const db = require('../config/db');

// Hàm helper được cập nhật để query bảng 'users' và 'lichtruc'
async function suggestNhanVienForPhong(phongId, ngayBaoTri) {
    // Ưu tiên 1: Nhân viên phụ trách phòng đó (role='nhanvien', tinhTrang='on')
    let queryPhuTrach = `
        SELECT u.id, u.hoTen, u.role as chucvu, 1 AS priority
        FROM users u
        JOIN nhanvien_phong_phutrach nppt ON u.id = nppt.nhanvien_id
        WHERE nppt.phong_id = ? AND u.role = 'nhanvien' AND u.tinhTrang = 'on'`;
    const [phuTrachNV] = await db.query(queryPhuTrach, [phongId]);

    // Ưu tiên 2: Nhân viên có lịch trực trong ngày bảo trì (role='nhanvien', tinhTrang='on')
    let queryLichTruc = `
        SELECT u.id, u.hoTen, u.role as chucvu, 2 AS priority
        FROM users u
        JOIN lichtruc lt ON u.id = lt.nhanvien_id
        WHERE DATE(lt.start_time) = ? AND u.role = 'nhanvien' AND u.tinhTrang = 'on'
          AND u.id NOT IN (SELECT id FROM (${queryPhuTrach.replace('?', phongId).replace('SELECT u.id, u.hoTen, u.role as chucvu, 1 AS priority', 'SELECT u.id')}) AS pt)`;
    const [lichTrucNv] = await db.query(queryLichTruc, [ngayBaoTri]);

    // --- THAY ĐỔI LOGIC GỢI Ý ---
    // Nếu KHÔNG có ai có lịch trực (Ưu tiên 2 rỗng) -> KHÔNG gợi ý ai cả (kể cả người phụ trách)
    if (lichTrucNv.length === 0) {
        return [];
    }

    // Nếu có người trực, thì chỉ lấy người Phụ trách (Ưu tiên 1) và người có Lịch trực (Ưu tiên 2)
    // Bỏ qua Ưu tiên 3 (nhân viên còn lại không có lịch trực)
    const suggestedList = [...phuTrachNV, ...lichTrucNv];
    // --- KẾT THÚC THAY ĐỔI LOGIC ---

    // Lọc danh sách duy nhất (giữ nguyên)
    const uniqueList = suggestedList.filter((nv, index, self) =>
        index === self.findIndex((t) => t.id === nv.id)
    );

    return uniqueList;
}

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
            }
        }

        await connection.commit();
        res.status(201).json({ message: `Đã tạo ${insertedIds.length} lịch bảo dưỡng thành công.`, insertedIds });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi tạo lịch bảo dưỡng hàng loạt:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ khi tạo lịch bảo dưỡng hàng loạt." });
    } finally {
        connection.release();
    }
};

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
    const { trangThai = 'Chờ xử lý,Đang tiến hành', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const trangThaiList = trangThai.split(',').map(s => s.trim()).filter(s => s);

    // Sửa JOIN để lấy thông tin từ bảng users (nếu cần, nhưng ở đây không cần tên NV)
    let sql = `SELECT lb.*, ttb.tenThietBi, CONCAT(p.toa, p.tang, '.', p.soPhong) AS tenPhong
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

exports.updateLichBaoDuongStatus = async (req, res) => {
    const { id } = req.params;
    const { trang_thai } = req.body;
    const userId = req.user.id; // ID user thực hiện
    const userRole = req.user.role; // Role user thực hiện

    if (!trang_thai) {
        return res.status(400).json({ message: "Cần cung cấp trạng thái mới." });
    }

    const validNhanVienNextStatuses = ['Đang tiến hành'];
    const validAdminNextStatuses = ['Đang tiến hành', 'Hủy', 'Chờ xử lý', 'Chờ Hoàn Tất Bảo Hành'];


    try {
        const [lichResult] = await db.query("SELECT * FROM lichbaoduong WHERE id = ?", [id]);
        if (lichResult.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy lịch bảo dưỡng." });
        }
        const currentLich = lichResult[0];

        // --- Logic Phân Quyền và Chuyển Trạng Thái Mới ---
        if (userRole === 'nhanvien') {
            // Kiểm tra quyền sở hữu
            if (currentLich.nhanvien_id !== userId) {
                return res.status(403).json({ message: "Bạn không được giao xử lý lịch bảo dưỡng này." });
            }

            // Kiểm tra trạng thái nguồn hợp lệ cho nhân viên bắt đầu
            const allowedSourceStatuses = ['Chờ xử lý'];
            if (!allowedSourceStatuses.includes(currentLich.trang_thai)) {
                // Nếu đang tiến hành thì không cập nhật qua đây nữa
                if (currentLich.trang_thai === 'Đang tiến hành') {
                    return res.status(400).json({ message: `Công việc đang '${currentLich.trang_thai}'. Vui lòng sử dụng chức năng 'Ghi Log Bảo trì' để tiếp tục.` });
                }
                // Nếu đã ở trạng thái cuối
                if (['Hoàn thành', 'Hủy', 'Chờ Hoàn Tất Bảo Hành'].includes(currentLich.trang_thai)) {
                    return res.status(400).json({ message: `Lịch bảo dưỡng đã ở trạng thái cuối '${currentLich.trang_thai}', không thể cập nhật.` });
                }
                // Các trường hợp khác không hợp lệ
                return res.status(400).json({ message: `Không thể cập nhật từ trạng thái hiện tại '${currentLich.trang_thai}'.` });
            }

            // Kiểm tra trạng thái đích hợp lệ cho NHÂN VIÊN qua API này
            if (!validNhanVienNextStatuses.includes(trang_thai)) {
                // Hướng dẫn người dùng nếu họ cố gắng hoàn thành hoặc các trạng thái khác
                if (trang_thai === 'Hoàn thành' || trang_thai === 'Chờ Hoàn Tất Bảo Hành') {
                    return res.status(400).json({ message: `Để '${trang_thai}', vui lòng sử dụng chức năng 'Ghi Log Bảo trì'.` });
                }
                if (trang_thai === 'Hủy') {
                    return res.status(403).json({ message: "Nhân viên không thể hủy lịch, vui lòng liên hệ Admin." });
                }
                return res.status(400).json({ message: `Nhân viên không thể trực tiếp cập nhật sang trạng thái '${trang_thai}'. Chỉ có thể chuyển sang 'Đang tiến hành'.` });
            }
        }
        else if (userRole === 'admin') {
            // Admin có thể cập nhật trạng thái linh hoạt hơn (vd: Hủy, hoặc đặt lại Chờ xử lý)
            if (!validAdminNextStatuses.includes(trang_thai)) {
                // Kiểm tra xem có phải admin đang cố hoàn thành không? Nếu vậy thì chặn.
                if (trang_thai === 'Hoàn thành' || trang_thai === 'Chờ Hoàn Tất Bảo Hành') {
                    // Có thể cho phép Admin làm điều này nếu muốn, nhưng nếu muốn chặt chẽ thì không nên.
                    return res.status(400).json({ message: `Admin nên xem xét log bảo trì thay vì cập nhật trực tiếp trạng thái '${trang_thai}'.` });
                } else {
                    return res.status(400).json({ message: `Admin không thể cập nhật sang trạng thái '${trang_thai}' không hợp lệ.` });
                }
            }
            // Logic kiểm tra quyền hủy/reset của Admin 
            const cancellableStatuses = ['Chờ xử lý', 'Đang tiến hành'];
            if (trang_thai === 'Hủy' && !cancellableStatuses.includes(currentLich.trang_thai)) {
                return res.status(400).json({ message: `Không thể hủy lịch bảo dưỡng từ trạng thái '${currentLich.trang_thai}'.` });
            }
            if (trang_thai === 'Chờ xử lý' && !cancellableStatuses.includes(currentLich.trang_thai)) {
                if (currentLich.trang_thai !== 'Đang tiến hành') {
                    return res.status(400).json({ message: `Không thể đặt lại trạng thái Chờ xử lý từ '${currentLich.trang_thai}'.` });
                }
            }
        } else {
            return res.status(403).json({ message: "Không có quyền cập nhật." });
        }

        // Kiểm tra lần cuối trước khi cập nhật: không cho cập nhật nếu đã kết thúc
        if (['Hoàn thành', 'Hủy', 'Chờ Hoàn Tất Bảo Hành'].includes(currentLich.trang_thai)) {
            if (userRole !== 'admin' || !isAdminOverrideAllowed) {
                return res.status(400).json({ message: `Lịch bảo dưỡng đã ở trạng thái cuối '${currentLich.trang_thai}', không thể cập nhật.` });
            }
        }


        // Nếu Admin chọn 'Hủy', hệ thống sẽ reset trạng thái về 'Chờ xử lý' thay vì lưu 'Hủy'
        let newStatus = trang_thai;
        if (userRole === 'admin' && trang_thai === 'Hủy') {
            newStatus = 'Chờ xử lý';
        }

        // --- Cập nhật DB ---
        const fieldsToUpdate = { trang_thai: newStatus };

        if (userRole === 'admin' && trang_thai === 'Chờ xử lý' && currentLich.trang_thai === 'Đang tiến hành') {
            fieldsToUpdate.coLogBaoTri = 0;
        }

        const sql = "UPDATE lichbaoduong SET ? WHERE id = ?";
        await db.query(sql, [fieldsToUpdate, id]);
        res.status(200).json({ message: `Đã cập nhật trạng thái lịch bảo dưỡng ID ${id} thành công.` });

    } catch (error) {
        console.error(`Lỗi khi cập nhật trạng thái lịch bảo dưỡng ID ${id}:`, error);
        res.status(500).json({ message: "Lỗi máy chủ khi cập nhật trạng thái." });
    }
};

// Xóa lịch bảo dưỡng (chỉ khi ở trạng thái 'Chờ xử lý')
exports.deleteLichBaoDuong = async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;

    // --- Kiểm tra quyền Admin ---
    if (userRole !== 'admin') {
        return res.status(403).json({ message: "Chỉ Admin mới có quyền xóa lịch bảo dưỡng." });
    }

    // --- Validate ID ---
    const lichId = parseInt(id, 10);
    if (isNaN(lichId) || lichId <= 0) {
        return res.status(400).json({ message: "ID lịch bảo dưỡng không hợp lệ." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // --- Kiểm tra bản ghi và trạng thái ---
        const [lichRows] = await connection.query("SELECT trang_thai FROM lichbaoduong WHERE id = ? FOR UPDATE", [lichId]);

        if (lichRows.length === 0) {
            await connection.rollback(); // Không cần rollback vì chưa thay đổi gì, nhưng để cho chắc
            return res.status(404).json({ message: "Không tìm thấy lịch bảo dưỡng để xóa." });
        }

        const currentStatus = lichRows[0].trang_thai;

        // --- Chỉ cho phép xóa khi trạng thái là 'Chờ xử lý' ---
        if (currentStatus !== 'Chờ xử lý') {
            await connection.rollback();
            return res.status(400).json({ message: `Không thể xóa lịch bảo dưỡng ở trạng thái '${currentStatus}'. Chỉ xóa được khi 'Chờ xử lý'.` });
        }
        // -----------------------------------------------------

        // --- Thực hiện xóa ---
        const [deleteResult] = await connection.query("DELETE FROM lichbaoduong WHERE id = ?", [lichId]);

        if (deleteResult.affectedRows === 0) {
            // Trường hợp này ít xảy ra nếu đã kiểm tra ở trên, nhưng vẫn nên có
            await connection.rollback();
            return res.status(404).json({ message: "Không tìm thấy lịch bảo dưỡng để xóa (lỗi sau kiểm tra)." });
        }
        // --------------------

        await connection.commit();
        res.status(200).json({ message: "Xóa lịch bảo dưỡng thành công!", id: lichId });

    } catch (error) {
        await connection.rollback();
        console.error(`Lỗi khi xóa lịch bảo dưỡng ID ${lichId}:`, error);
        // Kiểm tra xem có phải lỗi khóa ngoại không (ví dụ: nếu bảng baotri có FK trỏ tới)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: "Không thể xóa lịch này vì có dữ liệu liên quan (ví dụ: log bảo trì)." });
        }
        res.status(500).json({ message: "Lỗi máy chủ khi xóa lịch bảo dưỡng." });
    } finally {
        connection.release();
    }
};