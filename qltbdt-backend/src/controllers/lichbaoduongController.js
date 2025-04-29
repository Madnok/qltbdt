const db = require('../config/db');
const { getIoInstance, emitToUser } = require('../socket');

// Hàm helper được cập nhật để query bảng 'users' và 'lichtruc'
async function suggestNhanVienForPhong(phongId, ngayBaoTri) {
    const startOfDay = new Date(ngayBaoTri + 'T00:00:00');
    const endOfDay = new Date(ngayBaoTri + 'T23:59:59');

    // 1. Nhân viên phụ trách
    const queryPhuTrach = `
        SELECT u.id, u.hoTen, u.role as chucvu, 1 AS priority
        FROM users u
        JOIN nhanvien_phong_phutrach nppt ON u.id = nppt.nhanvien_id
        WHERE nppt.phong_id = ? AND u.role = 'nhanvien' AND u.tinhTrang = 'on'`;
    const [phuTrachNV] = await db.query(queryPhuTrach, [phongId]);

    // 2. Nhân viên có lịch trực trong ngày, không trùng người phụ trách
    const queryLichTruc = `
        SELECT u.id, u.hoTen, u.role as chucvu, 2 AS priority
        FROM users u
        JOIN lichtruc lt ON u.id = lt.nhanvien_id
        WHERE lt.start_time BETWEEN ? AND ?
          AND u.role = 'nhanvien' AND u.tinhTrang = 'on'
          AND u.id NOT IN (
              SELECT u.id FROM users u
              JOIN nhanvien_phong_phutrach nppt ON u.id = nppt.nhanvien_id
              WHERE nppt.phong_id = ?
          )`;
    const [lichTrucNV] = await db.query(queryLichTruc, [startOfDay, endOfDay, phongId]);

    // 3. Các nhân viên còn lại (chưa nằm trong 1 hoặc 2)
    const queryNhanVienConLai = `
        SELECT u.id, u.hoTen, u.role as chucvu, 3 AS priority
        FROM users u
        WHERE u.role = 'nhanvien' AND u.tinhTrang = 'on'
            AND u.id NOT IN (
                SELECT u.id
                FROM nhanvien_phong_phutrach nppt
                JOIN users u ON u.id = nppt.nhanvien_id
                WHERE nppt.phong_id = ?
                UNION
                SELECT u.id
                FROM users u
                JOIN lichtruc lt ON u.id = lt.nhanvien_id
                WHERE lt.start_time BETWEEN ? AND ?
            )`;
    const [nhanVienConLai] = await db.query(queryNhanVienConLai, [phongId, startOfDay, endOfDay]);


    // Gộp tất cả lại
    const suggestedList = [...phuTrachNV, ...lichTrucNV, ...nhanVienConLai];

    // Lọc trùng phòng hờ
    const uniqueList = suggestedList.filter((nv, index, self) =>
        index === self.findIndex((t) => t.id === nv.id)
    );

    return uniqueList;
}

exports.suggestNhanVien = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Không có quyền truy cập." });
    }
    const { phongId, ngayBaoTri } = req.query;
    if (!phongId || !ngayBaoTri) {
        return res.status(400).json({ message: "Cần cung cấp ID phòng và Ngày bảo trì." });
    }
    try {
        const suggestedList = await suggestNhanVienForPhong(phongId, ngayBaoTri);
        res.status(200).json(suggestedList);
    } catch (error) {
        console.error("Lỗi khi gợi ý nhân viên:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi gợi ý nhân viên." });
    }
};

exports.createLichBaoDuong = async (req, res) => {
    // Sử dụng chuỗi role trực tiếp hoặc hằng số ROLES.ADMIN
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Không có quyền tạo lịch bảo dưỡng." });
    }

    const {
        thongtinthietbi_ids,
        phong_id,
        nhanvien_id, // ID user (nhanvien) được Admin chọn
        ngay_baotri,
        mo_ta
    } = req.body;
    const nguoi_tao_id = req.user.id; // Lấy ID admin từ middleware

    if (!thongtinthietbi_ids || thongtinthietbi_ids.length === 0 || !phong_id || !ngay_baotri) {
        return res.status(400).json({ message: "Vui lòng cung cấp đủ thông tin: danh sách thiết bị, phòng, ngày bảo trì." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const results = [];
        for (const thietbi_id of thongtinthietbi_ids) {
            const sql = `INSERT INTO lichbaoduong (thongtinthietbi_id, phong_id, nhanvien_id, ngay_baotri, mo_ta, nguoi_tao_id, trang_thai)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const [result] = await connection.query(sql, [
                thietbi_id,
                phong_id,
                nhanvien_id || null,
                ngay_baotri,
                mo_ta || `Bảo dưỡng định kỳ thiết bị ID ${thietbi_id}`,
                nguoi_tao_id,
                'Chờ xử lý'
            ]);
            results.push(result.insertId);
            if (nhanvien_id) {
                emitToUser(nhanvien_id, 'new_assigned_task', {
                    taskId: result.insertId,
                    type: 'baoduong',
                });
            }
        }
        await connection.commit();
        res.status(201).json({ message: "Đã tạo lịch bảo dưỡng thành công.", insertedIds: results });
    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi tạo lịch bảo dưỡng:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ khi tạo lịch bảo dưỡng." });
    } finally {
        connection.release();
    }
};

// Tạo lịch bảo dưỡng hàng loạt cho nhiều phòng/thiết bị
exports.createBulkLichBaoDuong = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Không có quyền tạo lịch bảo dưỡng hàng loạt." });
    }

    const { bulkTasks } = req.body;
    const nguoi_tao_id = req.user.id;

    // --- Validation Input ---
    if (!Array.isArray(bulkTasks) || bulkTasks.length === 0) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ. Cần cung cấp một mảng 'bulkTasks'." });
    }

    const validationErrors = [];
    for (let i = 0; i < bulkTasks.length; i++) {
        const task = bulkTasks[i];
        if (!task.phong_id || !task.ngay_baotri || !Array.isArray(task.thongtinthietbi_ids) || task.thongtinthietbi_ids.length === 0) {
            validationErrors.push(`Task ${i + 1}: Thiếu thông tin phòng, ngày bảo trì hoặc danh sách thiết bị.`);
        }
    }

    if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ.", errors: validationErrors });
    }


    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const insertedIds = [];

        for (const task of bulkTasks) {
            const {
                phong_id,
                thongtinthietbi_ids,
                nhanvien_id,
                ngay_baotri,
                mo_ta
            } = task;

            const trang_thai_ban_dau = 'Chờ xử lý';

            // Lặp qua từng thiết bị trong task hiện tại
            for (const thietbi_id of thongtinthietbi_ids) {
                const sql = `INSERT INTO lichbaoduong (thongtinthietbi_id, phong_id, nhanvien_id, ngay_baotri, mo_ta, nguoi_tao_id, trang_thai, coLogBaoTri)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                const mo_ta_final = mo_ta || `Bảo dưỡng định kỳ thiết bị ID ${thietbi_id}`; // Mô tả mặc định nếu không có

                const [result] = await connection.query(sql, [
                    thietbi_id,
                    phong_id,
                    nhanvien_id || null,
                    ngay_baotri,
                    mo_ta_final,
                    nguoi_tao_id,
                    trang_thai_ban_dau,
                    0
                ]);
                insertedIds.push(result.insertId);
                if (nhanvien_id) {
                    emitToUser(nhanvien_id, 'new_assigned_task', {
                        taskId: result.insertId,
                        type: 'baoduong',
                    });
                }
            }
        }

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi tạo lịch bảo dưỡng hàng loạt:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ khi tạo lịch bảo dưỡng hàng loạt." });
    } finally {
        connection.release();
    }
};

exports.getLichBaoDuongList = async (req, res) => {
    const { phongId, thietbiId, nhanvienId, trangThai, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Sửa JOIN và SELECT để lấy hoTen từ bảng users
    let sql = `SELECT lb.*, ttb.tenThietBi, CONCAT(p.toa, p.tang, '.', p.soPhong) AS tenPhong, u.hoTen AS tenNhanVienPhuTrach
               FROM lichbaoduong lb
               JOIN thongtinthietbi ttb ON lb.thongtinthietbi_id = ttb.id
               JOIN phong p ON lb.phong_id = p.id
               LEFT JOIN users u ON lb.nhanvien_id = u.id
               WHERE 1=1`;
    const params = [];
    const countParams = [];

    // Thêm điều kiện lọc
    if (phongId) { sql += " AND lb.phong_id = ?"; params.push(phongId); countParams.push(phongId); }
    if (thietbiId) { sql += " AND lb.thongtinthietbi_id = ?"; params.push(thietbiId); countParams.push(thietbiId); }
    if (trangThai) { sql += " AND lb.trang_thai = ?"; params.push(trangThai); countParams.push(trangThai); }
    if (startDate) { sql += " AND lb.ngay_baotri >= ?"; params.push(startDate); countParams.push(startDate); }
    if (endDate) { sql += " AND lb.ngay_baotri <= ?"; params.push(endDate); countParams.push(endDate); }

    // Phân quyền xem: admin xem tất cả, nhân viên chỉ xem việc của mình (hoặc việc được lọc theo nhanvienId nếu admin request)
    if (userRole === 'nhanvien') {
        // Nếu nhân viên đang xem, chỉ cho xem việc của mình
        sql += " AND lb.nhanvien_id = ?";
        params.push(userId);
        countParams.push(userId);
        // Nếu nhân viên cố tình lọc theo ID người khác -> bỏ qua filter đó (vì đã lọc theo ID của chính họ)
    } else if (userRole === 'admin' && nhanvienId) {
        // Nếu admin lọc theo nhân viên cụ thể
        sql += " AND lb.nhanvien_id = ?";
        params.push(nhanvienId);
        countParams.push(nhanvienId);
    }

    const countSql = `SELECT COUNT(*) as total FROM lichbaoduong lb WHERE 1=1 ${sql.substring(sql.indexOf("WHERE 1=1") + 9, sql.indexOf("ORDER BY") > 0 ? sql.indexOf("ORDER BY") : sql.length)}`;

    sql += " ORDER BY lb.ngay_baotri DESC, lb.id DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    try {
        const [[countResult]] = await db.query(countSql.replace(' LIMIT ? OFFSET ?', ''), countParams);
        const totalItems = countResult.total;
        const [lichbaoduong] = await db.query(sql, params);
        res.status(200).json({
            data: lichbaoduong,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lịch bảo dưỡng:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách lịch bảo dưỡng." });
    }
};

exports.getThietBiTrongPhongToBaoDuong = async (req, res) => {
    // Giữ nguyên logic lấy và kiểm tra phong_id từ params
    const phongIdParam = req.params.id || req.params.phong_id;
    if (!phongIdParam) {
        return res.status(400).json({ error: "Thiếu ID phòng!" });
    }
    const phong_id = parseInt(phongIdParam, 10);
    if (isNaN(phong_id)) {
        return res.status(400).json({ error: "ID phòng không hợp lệ." });
    }

    try {
        // --- Câu Query SQL MỚI với logic lọc ---
        const query = `
            SELECT
                tttb.id AS thongtinthietbi_id, 
                tttb.tinhTrang,                
                tb.tenThietBi AS tenLoaiThietBi, 
                tl.theLoai AS tenTheLoai         
            FROM thongtinthietbi tttb
            LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
            LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            WHERE
                tttb.phong_id = ?               
                -- Điều kiện 1: KHÔNG tồn tại báo hỏng đang hoạt động cho thiết bị này
                AND NOT EXISTS (
                    SELECT 1
                    FROM baohong bh
                    WHERE bh.thongtinthietbi_id = tttb.id
                      AND bh.trangThai IN (
                          'Chờ Duyệt', 'Đã Duyệt', 'Đang Tiến Hành',
                          'Chờ Hoàn Tất Bảo Hành', 'Yêu Cầu Làm Lại', 'Chờ Xem Xét'
                          -- Các trạng thái 'Hoàn Thành', 'Không Thể Hoàn Thành', 'Đã Hủy' được bỏ qua
                      )
                )
                -- Điều kiện 2: KHÔNG tồn tại lịch bảo dưỡng đang hoạt động cho thiết bị này
                AND NOT EXISTS (
                    SELECT 1
                    FROM lichbaoduong lbd
                    WHERE lbd.thongtinthietbi_id = tttb.id
                      AND lbd.trang_thai IN (
                          'Chờ xử lý', 'Đang tiến hành', 'Chờ Hoàn Tất Bảo Hành'
                          -- Các trạng thái 'Hoàn thành', 'Hủy' được bỏ qua
                          -- Bạn có thể thêm điều kiện về ngày nếu muốn lọc chặt hơn, ví dụ:
                          -- AND lbd.ngay_baotri >= CURDATE() -- Chỉ loại nếu lịch chưa tới hạn hoặc đang diễn ra
                      )
                )
                --  Loại bỏ các thiết bị có tình trạng không phù hợp để bảo dưỡng
                 AND tttb.tinhTrang NOT IN ('da_thanh_ly', 'da_bao_hanh','cho_thanh_ly', 'dang_bao_hanh', 'de_xuat_thanh_ly', 'mat') -- Ví dụ: bỏ qua thiết bị đã/chờ thanh lý, đang bảo hành, mất mát

            ORDER BY
                tl.theLoai, tb.tenThietBi, tttb.id; 
        `;

        const [thietBiList] = await db.query(query, [phong_id]);

        res.status(200).json(thietBiList || []);

    } catch (error) {
        console.error("Lỗi lấy danh sách thiết bị trong phòng (đã lọc):", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách thiết bị!" });
    }
};

exports.getMyLichBaoDuong = async (req, res) => {
    if (req.user.role !== 'nhanvien') {
        return res.status(403).json({ message: "Chỉ nhân viên mới có thể xem công việc được giao." });
    }
    const nhanvienId = req.user.id;
    const { trangThai = 'Chờ xử lý,Đang tiến hành,Chờ Xem Xét', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const trangThaiList = trangThai.split(',').map(s => s.trim()).filter(s => s);

    // Sửa JOIN để lấy thông tin từ bảng users 
    let sql = `SELECT lb.*, ttb.tenThietBi, ttb.tinhTrang, ttb.trangThaiHoatDong,
               CONCAT(p.toa, p.tang, '.', p.soPhong) AS tenPhong
               FROM lichbaoduong lb
               JOIN thongtinthietbi ttb ON lb.thongtinthietbi_id = ttb.id
               JOIN phong p ON lb.phong_id = p.id
               WHERE lb.nhanvien_id = ?`;
    const params = [nhanvienId];
    const countParams = [nhanvienId];

    if (trangThaiList.length > 0) {
        sql += ` AND lb.trang_thai IN (?)`;
        params.push(trangThaiList);
        countParams.push(trangThaiList);
    }

    const countSql = `SELECT COUNT(*) as total FROM lichbaoduong lb WHERE lb.nhanvien_id = ? ${trangThaiList.length > 0 ? 'AND lb.trang_thai IN (?)' : ''}`;


    sql += " ORDER BY lb.ngay_baotri ASC, lb.id ASC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    try {
        const [[countResult]] = await db.query(countSql, countParams);
        const totalItems = countResult.total;
        const [tasks] = await db.query(sql, params);
        res.status(200).json({
            data: tasks,
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy công việc bảo dưỡng của tôi:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy công việc bảo dưỡng." });
    }
};

// exports.updateLichBaoDuongStatus = async (req, res) => {
//     const { id } = req.params;
//     const { trang_thai } = req.body;
//     const userId = req.user.id; // ID user thực hiện
//     const userRole = req.user.role; // Role user thực hiện
//     const userHoTen = req.user.hoTen; // Lấy tên user để gửi đi nếu cần


//     if (!trang_thai) {
//         return res.status(400).json({ message: "Cần cung cấp trạng thái mới." });
//     }

//     const validNhanVienNextStatuses = ['Đang tiến hành'];
//     const validAdminNextStatuses = [
//         'Đang tiến hành', 'Hủy', 'Chờ xử lý', // Các trạng thái cũ
//         'Hoàn thành', // Admin duyệt hoàn thành từ Chờ Xem Xét
//         // 'Yêu cầu làm lại' -> sẽ set về 'Chờ xử lý'
//     ];
//     let connection;

//     try {
//         connection = await db.getConnection();
//         await connection.beginTransaction();

//         const [lichResult] = await connection.query("SELECT * FROM lichbaoduong WHERE id = ? FOR UPDATE", [id]);
//         if (lichResult.length === 0) {
//             await connection.rollback();
//             throw new Error("Không tìm thấy lịch bảo dưỡng.", 404);
//         }
//         const currentLich = lichResult[0];
//         const currentStatus = currentLich.trang_thai;
//         const assignedUserId = currentLich.nhanvien_id;

//         // --- Logic Phân Quyền và Chuyển Trạng Thái ---
//         let finalStatusToSet = trang_thai;
//         let canUpdate = false;
//         let notificationEventForAdmins = null;
//         let notificationEventForSelf = null;
//         let notificationData = {};
//         let broadcastEvent = true;

//         if (userRole === 'nhanvien') {
//             // Kiểm tra quyền sở hữu
//             if (assignedUserId !== userId) throw new Error("Bạn không được giao xử lý lịch bảo dưỡng này.", 403);

//             // Kiểm tra trạng thái nguồn hợp lệ cho nhân viên bắt đầu
//             const allowedSourceStatuses = ['Chờ xử lý'];
//             if (!allowedSourceStatuses.includes(currentStatus)) {
//                 if (currentStatus === 'Đang tiến hành') throw new Error(`Công việc đang '${currentStatus}'. Vui lòng sử dụng chức năng 'Ghi Log Bảo trì'.`, 400);
//                 if (['Hoàn thành', 'Hủy', 'Chờ Hoàn Tất Bảo Hành'].includes(currentStatus)) throw new Error(`Lịch bảo dưỡng đã ở trạng thái cuối '${currentStatus}'.`, 400);
//                 throw new Error(`Không thể cập nhật từ trạng thái hiện tại '${currentStatus}'.`, 400);
//             }

//             // Kiểm tra trạng thái đích hợp lệ cho NHÂN VIÊN qua API này
//             if (!validNhanVienNextStatuses.includes(trang_thai)) {
//                 if (trang_thai === 'Hoàn thành' || trang_thai === 'Chờ Hoàn Tất Bảo Hành') throw new Error(`Để '${trang_thai}', vui lòng sử dụng chức năng 'Ghi Log Bảo trì'.`, 400);
//                 if (trang_thai === 'Hủy') throw new Error("Nhân viên không thể hủy lịch, vui lòng liên hệ Admin.", 403);
//                 throw new Error(`Nhân viên chỉ có thể chuyển sang 'Đang tiến hành'.`, 400);
//             }

//             // Nhân viên hợp lệ để chuyển sang Đang tiến hành
//             canUpdate = true;
//             // Thông báo cho admin khi nhân viên bắt đầu
//             notificationEventForAdmins = 'task_started';
//             notificationEventForSelf = 'task_started';
//             notificationData = { lichBaoDuongId: parseInt(id), statusAfterUpdate: finalStatusToSet, technicianId: userId, technicianName: userHoTen || `NV ${userId}` };
//             broadcastEvent = true;
//         }
//         else if (userRole === 'admin') {
//             if (!validAdminNextStatuses.includes(trang_thai)) {
//                 if (trang_thai === 'Hoàn thành' || trang_thai === 'Chờ Hoàn Tất Bảo Hành') {
//                     throw new Error(`Admin nên xem xét log bảo trì thay vì cập nhật trực tiếp trạng thái '${trang_thai}'.`, 400);
//                 }
//                 throw new Error(`Admin không thể cập nhật sang trạng thái '${trang_thai}' không hợp lệ.`, 400);
//             }
//             // Logic kiểm tra quyền hủy/reset của Admin 
//             const adminActionableStatuses = ['Chờ xử lý', 'Đang tiến hành'];
//             if (trang_thai === 'Hủy' || trang_thai === 'Chờ xử lý') {
//                 if (!adminActionableStatuses.includes(currentStatus)) {
//                     throw new Error(`Không thể '${trang_thai}' lịch bảo dưỡng từ trạng thái '${currentStatus}'.`, 400);
//                 }
//                 finalStatusToSet = 'Chờ xử lý';
//                 canUpdate = true;
//                 // Thông báo cho nhân viên bị hủy/reset task
//                 if (assignedUserId) {
//                     notificationEvent = 'task_cancelled';
//                     notificationData = { lichBaoDuongId: parseInt(id), reason: `Admin đã ${trang_thai === 'Hủy' ? 'hủy' : 'reset'} công việc.`, statusAfterUpdate: finalStatusToSet };
//                 }
//             } else if (trang_thai === 'Đang tiến hành') {
//                 canUpdate = true;

//             }
//         } else {
//             throw new Error("Không có quyền cập nhật.", 403);
//         }

//         // Kiểm tra lần cuối trước khi cập nhật: không cho cập nhật nếu đã kết thúc
//         if (!canUpdate) {
//             throw new Error("Hành động cập nhật trạng thái không hợp lệ.", 400);
//         }

//         // --- Cập nhật DB ---
//         const fieldsToUpdate = { trang_thai: finalStatusToSet };
//         if (userRole === 'admin' && finalStatusToSet === 'Chờ xử lý' && currentStatus === 'Đang tiến hành') {
//             fieldsToUpdate.coLogBaoTri = 0;
//         }

//         const sql = "UPDATE lichbaoduong SET ? WHERE id = ?";
//         const [updateResult] = await connection.query(sql, [fieldsToUpdate, id]);

//         if (updateResult.affectedRows > 0) {

//             // Commit transaction
//             await connection.commit();
//             console.log(`[updateLichBaoDuongStatus] ID ${id} - Transaction committed.`);

//             // --- Gửi Socket IO ---
//             try {
//                 const io = getIoInstance();
//                 if (io) {
//                     if (broadcastEvent) {
//                         io.emit('stats_updated', { type: 'baoduong', id: parseInt(id), newStatus: finalStatusToSet });
//                         console.log(`[updateLichBaoDuongStatus] Emitted 'stats_updated' for ID ${id}`);
//                     }
//                     // Gửi cho Admin (nếu nhân viên bắt đầu)
//                     if (notificationEventForAdmins === 'task_started') {
//                         const [adminUsers] = await db.query("SELECT id FROM users WHERE role = 'admin' AND tinhTrang = 'on'");
//                         adminUsers.forEach(admin => {
//                             emitToUser(admin.id, notificationEventForAdmins, notificationData);
//                         });
//                         console.log(`[updateLichBaoDuongStatus] Emitted '${notificationEventForAdmins}' to ${adminUsers.length} admins for ID ${id}.`);
//                     }
//                     // Gửi cho chính người thực hiện
//                     if (notificationEventForSelf === 'task_started' && userRole === 'nhanvien') {
//                         emitToUser(userId, notificationEventForSelf, notificationData); // Gửi lại cho chính nhân viên
//                     }
//                     // Gửi cho người bị ảnh hưởng (nếu admin hủy)
//                     else if (notificationEventForSelf === 'task_cancelled' && userRole === 'admin' && assignedUserId) {
//                         emitToUser(assignedUserId, notificationEventForSelf, notificationData);
//                         console.log(`[updateLichBaoDuongStatus] Emitted '${notificationEventForSelf}' to affected user ${assignedUserId} for ID ${id}.`);
//                     }
//                 }
//             } catch (socketError) {
//                 console.error(`[updateLichBaoDuongStatus] Lỗi khi gửi socket cho ID ${id}:`, socketError);
//             }
//         } else {
//             await connection.rollback();
//             console.log(`[updateLichBaoDuongStatus] No rows updated for ID ${id}. Rolling back.`);
//             res.status(404).json({ message: "Không có gì được cập nhật. Lịch bảo dưỡng không tồn tại hoặc trạng thái không thay đổi." });
//         }
//     } catch (error) {
//         if (connection) {
//             await connection.rollback();
//             console.error(`[updateLichBaoDuongStatus] Error for ID ${id}, rolling back:`, error);
//         } else {
//             console.error(`[updateLichBaoDuongStatus] Error for ID ${id} and no connection:`, error);
//         }
//         res.status(error.status || 500).json({ message: error.message || "Lỗi máy chủ khi cập nhật trạng thái." });
//     } finally {
//         if (connection) {
//             connection.release();
//             console.log(`[updateLichBaoDuongStatus] ID ${id} - Connection released.`);
//         }
//     }
// };


exports.updateLichBaoDuongStatus = async (req, res) => {
    const { id } = req.params;
    // Lấy cả trang_thai và ghiChuAdmin từ body
    const { trang_thai, ghiChuAdmin } = req.body;
    const userId = req.user.id; // ID user thực hiện
    const userRole = req.user.role; // Role user thực hiện
    const userHoTen = req.user.hoTen; // Lấy tên user để gửi đi nếu cần

    // trang_thai là trạng thái đích mà người dùng YÊU CẦU
    if (!trang_thai) {
        return res.status(400).json({ message: "Cần cung cấp trạng thái mới." });
    }

    const lichId = parseInt(id, 10); // Parse ID để dùng trong log và data socket
    if (isNaN(lichId)) {
         return res.status(400).json({ message: "ID lịch bảo dưỡng không hợp lệ." });
    }

    const validNhanVienNextStatuses = ['Đang tiến hành'];
    // Admin có thể yêu cầu các trạng thái này (hoặc yêu cầu làm lại)
    const validAdminRequestedStatuses = ['Đang tiến hành', 'Hủy', 'Chờ xử lý', 'Hoàn thành', 'Yêu cầu làm lại'];

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [lichResult] = await connection.query("SELECT * FROM lichbaoduong WHERE id = ? FOR UPDATE", [lichId]);
        if (lichResult.length === 0) {
            throw new Error("Không tìm thấy lịch bảo dưỡng.", 404);
        }
        const currentLich = lichResult[0];
        const currentStatus = currentLich.trang_thai;
        const assignedUserId = currentLich.nhanvien_id;

        // --- Logic Phân Quyền và Chuyển Trạng Thái ---
        let finalStatusToSet = null; // Trạng thái cuối cùng sẽ LƯU vào DB
        let fieldsToUpdate = {}; // Các trường cần cập nhật
        let canUpdate = false;
        let notificationEventForUser = null; // Event gửi cho NV bị ảnh hưởng
        let notificationEventForAdmins = null; // Event gửi cho các Admin khác
        let notificationData = {};
        let broadcastStatsUpdate = true; // Mặc định là gửi stats_updated

        // ================== XỬ LÝ CHO NHÂN VIÊN ==================
        if (userRole === 'nhanvien') {
            if (assignedUserId !== userId) throw new Error("Bạn không được giao xử lý lịch bảo dưỡng này.", 403);

            const allowedSourceStatuses = ['Chờ xử lý'];
            if (!allowedSourceStatuses.includes(currentStatus)) {
                if (currentStatus === 'Đang tiến hành') throw new Error(`Công việc đang '${currentStatus}'. Vui lòng sử dụng chức năng 'Ghi Log Bảo trì'.`, 400);
                // Bao gồm cả Chờ Xem Xét ở đây
                if (['Hoàn thành', 'Hủy', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'].includes(currentStatus)) throw new Error(`Lịch bảo dưỡng đã ở trạng thái cuối/chờ duyệt '${currentStatus}'.`, 400);
                throw new Error(`Không thể cập nhật từ trạng thái hiện tại '${currentStatus}'.`, 400);
            }

            if (!validNhanVienNextStatuses.includes(trang_thai)) {
                // Nhân viên không thể trực tiếp set các trạng thái khác qua API này
                throw new Error(`Nhân viên chỉ có thể yêu cầu chuyển sang 'Đang tiến hành' từ 'Chờ xử lý'.`, 400);
            }

            // Hợp lệ: Chuyển từ 'Chờ xử lý' sang 'Đang tiến hành'
            canUpdate = true;
            finalStatusToSet = 'Đang tiến hành';
            fieldsToUpdate.trang_thai = finalStatusToSet;
            notificationEventForAdmins = 'task_started'; // Dùng lại event này
            notificationEventForUser = 'task_started'; // Gửi về cho chính NV
            notificationData = { lichBaoDuongId: lichId, statusAfterUpdate: finalStatusToSet, technicianId: userId, technicianName: userHoTen || `NV ${userId}` };
            // broadcastStatsUpdate = true; // Vẫn nên broadcast

        // ================== XỬ LÝ CHO ADMIN ==================
        } else if (userRole === 'admin') {
            if (!validAdminRequestedStatuses.includes(trang_thai)) {
                throw new Error(`Admin không thể yêu cầu cập nhật sang trạng thái '${trang_thai}'.`, 400);
            }

            // --- Xử lý dựa trên trạng thái HIỆN TẠI (currentStatus) ---
            switch (currentStatus) {
                case 'Chờ Xem Xét':
                    if (trang_thai === 'Hoàn thành') { // Admin duyệt OK
                        canUpdate = true;
                        finalStatusToSet = 'Hoàn thành';
                        fieldsToUpdate.trang_thai = finalStatusToSet;
                        // Xóa ghi chú cũ của admin nếu có khi duyệt thành công
                        fieldsToUpdate.ghiChuAdmin = null;
                        notificationEventForUser = 'task_completed';
                        notificationData = { lichBaoDuongId: lichId, statusAfterUpdate: finalStatusToSet };
                    } else if (trang_thai === 'Yêu cầu làm lại') { // Admin yêu cầu làm lại
                        if (!assignedUserId) throw new Error("Không thể yêu cầu làm lại vì chưa có nhân viên nào được gán.", 400);
                        canUpdate = true;
                        finalStatusToSet = 'Chờ xử lý'; // Quay về Chờ xử lý
                        fieldsToUpdate.trang_thai = finalStatusToSet;
                        fieldsToUpdate.coLogBaoTri = 0; // Reset cờ log
                        // Lưu ghi chú của Admin (nếu bảng có cột ghiChuAdmin)
                        if (ghiChuAdmin !== undefined) { // Chỉ cập nhật nếu có gửi lên
                            fieldsToUpdate.ghiChuAdmin = ghiChuAdmin || null;
                        }
                        notificationEventForUser = 'task_rework_request';
                        notificationData = { lichBaoDuongId: lichId, reason: ghiChuAdmin || 'Admin yêu cầu làm lại.', statusAfterUpdate: finalStatusToSet };
                    } else {
                        throw new Error(`Từ '${currentStatus}', Admin chỉ có thể 'Hoàn thành' hoặc 'Yêu cầu làm lại'.`, 400);
                    }
                    break;

                case 'Chờ xử lý':
                case 'Đang tiến hành':
                    if (trang_thai === 'Hủy' || trang_thai === 'Chờ xử lý') { // Admin Hủy hoặc Reset
                        canUpdate = true;
                        finalStatusToSet = 'Chờ xử lý'; // Luôn về Chờ xử lý
                        fieldsToUpdate.trang_thai = finalStatusToSet;
                        fieldsToUpdate.coLogBaoTri = 0; // Reset cờ log
                        fieldsToUpdate.ghiChuAdmin = null; // Xóa ghi chú cũ
                        if (assignedUserId) {
                            notificationEventForUser = 'task_cancelled';
                            notificationData = { lichBaoDuongId: lichId, reason: `Admin đã ${trang_thai === 'Hủy' ? 'hủy' : 'reset'} công việc.`, statusAfterUpdate: finalStatusToSet };
                        }
                    } else if (trang_thai === 'Đang tiến hành' && currentStatus === 'Chờ xử lý') {
                        // Admin có thể ép bắt đầu từ Chờ xử lý
                        canUpdate = true;
                        finalStatusToSet = 'Đang tiến hành';
                        fieldsToUpdate.trang_thai = finalStatusToSet;
                        // Không cần gửi socket đặc biệt ở đây? Hoặc gửi task_started?
                    } else {
                        throw new Error(`Hành động yêu cầu '${trang_thai}' không hợp lệ từ trạng thái '${currentStatus}'.`, 400);
                    }
                    break;

                // Admin không nên dùng API này để thay đổi các trạng thái cuối hoặc đang chờ BH
                case 'Hoàn thành':
                case 'Hủy':
                case 'Chờ Hoàn Tất Bảo Hành':
                     // Trừ khi có logic đặc biệt cho phép admin override (ví dụ: mở lại task đã hủy)
                     // Hiện tại, chặn các hành động từ các trạng thái này qua API status
                     throw new Error(`Không thể thay đổi trạng thái từ '${currentStatus}' bằng API này.`, 400);

                default:
                    throw new Error(`Trạng thái hiện tại '${currentStatus}' không được hỗ trợ cho hành động này.`, 400);
            }

        } else {
            throw new Error("Không có quyền cập nhật.", 403);
        }

        // --- Kiểm tra cuối cùng ---
        if (!canUpdate || !finalStatusToSet) {
            // Lỗi logic nếu chạy vào đây
            console.error("[updateLichBaoDuongStatus] Logic error: cannot update or finalStatusToSet is null.");
            throw new Error("Hành động cập nhật trạng thái không hợp lệ hoặc logic bị lỗi.", 500);
        }

        // --- Cập nhật DB ---
        const sql = "UPDATE lichbaoduong SET ? WHERE id = ?";
        const [updateResult] = await connection.query(sql, [fieldsToUpdate, lichId]);

        if (updateResult.affectedRows > 0) {
            console.log(`[updateLichBaoDuongStatus] Updated ID ${lichId} from ${currentStatus} to status ${finalStatusToSet}.`);
            await connection.commit();
            console.log(`[updateLichBaoDuongStatus] ID ${lichId} - Transaction committed.`);

            // --- Gửi Socket IO ---
            try {
                const io = getIoInstance();
                if (io) {
                    // Gửi broadcast chung
                    if (broadcastStatsUpdate) {
                        io.emit('stats_updated', { type: 'baoduong', id: lichId, newStatus: finalStatusToSet });
                        console.log(`[updateLichBaoDuongStatus] Emitted 'stats_updated' for ID ${lichId}`);
                    }
                    // Gửi cho Admin (nếu nhân viên bắt đầu)
                    if (notificationEventForAdmins === 'task_started') {
                        const [adminUsers] = await db.query("SELECT id FROM users WHERE role = 'admin' AND tinhTrang = 'on'");
                        adminUsers.forEach(admin => {
                            emitToUser(admin.id, notificationEventForAdmins, notificationData);
                        });
                        console.log(`[updateLichBaoDuongStatus] Emitted '${notificationEventForAdmins}' to ${adminUsers.length} admins for ID ${lichId}.`);
                    }

                     // Gửi cho nhân viên bị ảnh hưởng hoặc chính NV đó
                     // Đảm bảo assignedUserId hoặc userId (tùy ngữ cảnh) có giá trị
                     const targetUserId = (notificationEventForUser && assignedUserId) ? assignedUserId : ((notificationEventForSelf === 'task_started' && userId) ? userId : null);
                     const eventToSend = notificationEventForUser || notificationEventForSelf;

                     if (eventToSend && targetUserId) {
                         emitToUser(targetUserId, eventToSend, notificationData);
                         console.log(`[updateLichBaoDuongStatus] Emitted '${eventToSend}' to user ${targetUserId} for ID ${lichId}.`);
                     }
                }
            } catch (socketError) {
                console.error(`[updateLichBaoDuongStatus] Lỗi khi gửi socket cho ID ${lichId}:`, socketError);
            }

        } else {
             // Không có dòng nào được cập nhật (ít xảy ra vì đã FOR UPDATE)
             throw new Error("Không có dòng nào trong CSDL được cập nhật.", 500);
        }

    } catch (error) {
        if (connection) {
            await connection.rollback();
             console.error(`[updateLichBaoDuongStatus] Error for ID ${id}, rolling back:`, error);
        } else {
             console.error(`[updateLichBaoDuongStatus] Error for ID ${id} and no connection:`, error);
        }
         res.status(error.status || 500).json({ message: error.message || "Lỗi máy chủ khi cập nhật trạng thái." });
    } finally {
        if (connection) {
            connection.release();
             console.log(`[updateLichBaoDuongStatus] ID ${id} - Connection released.`);
        }
    }
};

// Xóa lịch bảo dưỡng (chỉ khi ở trạng thái 'Chờ xử lý')
exports.deleteLichBaoDuong = async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const adminUserId = req.user.id;

    // --- Kiểm tra quyền Admin ---
    if (userRole !== 'admin') {
        return res.status(403).json({ message: "Chỉ Admin mới có quyền xóa lịch bảo dưỡng." });
    }

    // --- Validate ID ---
    const lichId = parseInt(id, 10);
    if (isNaN(lichId) || lichId <= 0) {
        return res.status(400).json({ message: "ID lịch bảo dưỡng không hợp lệ." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        console.log(`[deleteLichBaoDuong ID ${lichId}] Transaction started by Admin ${adminUserId}.`);

        // --- Kiểm tra bản ghi và trạng thái ---
        const [lichRows] = await connection.query("SELECT trang_thai, nhanvien_id FROM lichbaoduong WHERE id = ? FOR UPDATE", [lichId]);

        if (lichRows.length === 0) {
            await connection.rollback();
            console.log(`[deleteLichBaoDuong ID ${lichId}] Record not found. Rolling back.`);
             throw new Error("Không tìm thấy lịch bảo dưỡng để xóa.", 404); 
        }

        const currentStatus = lichRows[0].trang_thai;
        const assignedUserId = lichRows[0].nhanvien_id;

        // --- Chỉ cho phép xóa khi trạng thái là 'Chờ xử lý' ---
        const deletableStatuses = ['Chờ xử lý', 'Hủy'];
        if (!deletableStatuses.includes(currentStatus)) {
            await connection.rollback();
            throw new Error(`Không thể xóa lịch bảo dưỡng ở trạng thái '${currentStatus}'. Chỉ xóa được khi 'Chờ xử lý' hoặc 'Hủy'.`, 400);
        }
        // -----------------------------------------------------

        // --- Thực hiện xóa ---
        const [deleteResult] = await connection.query("DELETE FROM lichbaoduong WHERE id = ?", [lichId]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
             throw new Error("Không tìm thấy lịch bảo dưỡng để xóa (lỗi sau kiểm tra).", 404);
        }
        // --------------------

        // --- GỬI SOCKET IO SAU KHI COMMIT ---
        try {
            const io = getIoInstance();
            if (io) {
                // 1. Gửi sự kiện chung báo dữ liệu thay đổi
                io.emit('stats_updated', { type: 'baoduong', deletedId: lichId });

                // 2. Gửi thông báo cho nhân viên bị xóa task
                if (assignedUserId) {
                    emitToUser(assignedUserId, 'task_cancelled', {
                        lichBaoDuongId: lichId,
                        reason: 'Lịch bảo dưỡng đã bị Admin xóa.'
                    });
                }
            }
        } catch (socketError) {
            console.error(`[deleteLichBaoDuong ID ${lichId}] Lỗi khi gửi socket:`, socketError);
        }
        // -----------------------------------

        // --- GỬI RESPONSE THÀNH CÔNG ---
        res.status(200).json({ message: "Xóa lịch bảo dưỡng thành công!", id: lichId });
        // -----------------------------

    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error(`[deleteLichBaoDuong ID ${lichId}] Error caught, rolling back:`, error);
        } else {
            console.error(`[deleteLichBaoDuong ID ${lichId}] Error caught and no connection:`, error);
        }
        // Xử lý lỗi ràng buộc khóa ngoại (nếu có log liên quan không xóa được)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: "Không thể xóa lịch này vì có dữ liệu liên quan (ví dụ: log bảo trì đã được ghi)." });
        }
         // Gửi response lỗi chung
         res.status(error.status || 500).json({ message: error.message || "Lỗi máy chủ khi xóa lịch bảo dưỡng." });
    } finally {
        if (connection) {
            connection.release();
             console.log(`[deleteLichBaoDuong ID ${lichId}] Connection released.`);
        }
    }
};