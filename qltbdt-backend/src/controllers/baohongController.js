
const pool = require("../config/db");
const { emitToUser } = require('../socket');
const moment = require("moment");

const validateForeignKeys = async (thietbi_id, thongtinthietbi_id, phong_id) => {
    if (thietbi_id) {
        const [rows] = await pool.query(
            `SELECT * FROM phong_thietbi WHERE thietbi_id = ? AND phong_id = ?`,
            [thietbi_id, phong_id]
        );
        if (rows.length === 0) return false; // Không khớp thietbi_id và phong_id
    }

    if (thongtinthietbi_id) {
        const [rowsThongTin] = await pool.query(
            `SELECT * FROM thongtinthietbi WHERE id = ?`,
            [thongtinthietbi_id]
        );
        if (rowsThongTin.length === 0) return false; // Không tồn tại thongtinthietbi_id
    }

    return true; // Các giá trị hợp lệ
};

exports.postGuiBaoHong = async (req, res) => {
    const { devices = [], phong_id, thiethai, moTa, hinhAnh, loaithiethai } = req.body;
    const user_id = req.user?.id; // Lấy user_id từ token nếu có

    // --- Validation cơ bản ---
    if (!phong_id || !thiethai || !loaithiethai) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }
    if (loaithiethai === 'Các Loại Thiết Bị' && devices.length === 0) {
        return res.status(400).json({ error: "Vui lòng chọn ít nhất một thiết bị khi báo hỏng loại 'Các Loại Thiết Bị'." });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const insertResults = [];

        if (devices.length === 0) {
            // Báo hỏng chung cho phòng
            const [result] = await connection.query(`
                INSERT INTO baohong (phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);
            insertResults.push(result); // Lưu kết quả
        } else {
            // Báo hỏng cho từng thiết bị
            for (const device of devices) {
                const { thietbi_id, thongtinthietbi_id } = device;
                if (!thongtinthietbi_id) continue;

                // Kiểm tra trùng lặp
                const [existingPending] = await connection.query(
                    `SELECT id FROM baohong WHERE thongtinthietbi_id = ? AND trangThai NOT IN ('Hoàn Thành', 'Không Thể Hoàn Thành')`,
                    [thongtinthietbi_id]
                );
                if (existingPending.length > 0) {
                    throw new Error(`Thiết bị (MDD: ${thongtinthietbi_id}) đã được báo hỏng và đang chờ xử lý.`);
                }

                const [result] = await connection.query(`
                    INSERT INTO baohong (thietbi_id, thongtinthietbi_id, phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [thietbi_id || null, thongtinthietbi_id, phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);
                insertResults.push(result); // Lưu kết quả
            }
        }
        if (insertResults.length === 0 && devices.length > 0) {
            throw new Error("Không có thông tin thiết bị hợp lệ để báo hỏng.");
        }

        await connection.commit();

        try {
            const firstInsertedId = insertResults[0]?.insertId;
            if (firstInsertedId) {
                const [newBaoHong] = await pool.query(`
                            SELECT bh.*, p.toa, p.tang, p.soPhong, tb.tenThietBi, u_report.hoTen as nguoiBaoCao
                            FROM baohong bh
                            JOIN phong p ON bh.phong_id = p.id
                            LEFT JOIN thietbi tb ON bh.thietbi_id = tb.id
                            LEFT JOIN users u_report ON bh.user_id = u_report.id
                            WHERE bh.id = ?`,
                    [firstInsertedId]
                );

                if (newBaoHong.length > 0) {
                    const eventData = {
                        ...newBaoHong[0],
                        phong_name: `${newBaoHong[0].toa}${newBaoHong[0].tang}.${newBaoHong[0].soPhong}`
                    };
                    emitToUser(1, 'new_baohong', eventData);
                }
            }
        } catch (socketError) {
            console.error("Lỗi khi gửi socket event sau khi tạo báo hỏng:", socketError);
        }

        res.status(201).json({ message: "Gửi báo hỏng thành công!" });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi lưu báo hỏng:", error);
        if (error.message.includes("đã được báo hỏng")) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Không thể lưu báo hỏng." });
        }
    } finally {
        connection.release();
    }
};


exports.getThongTinBaoHong = async (req, res) => {
    try {
        // 1. Lấy thông tin báo hỏng cơ bản và JOIN để lấy tên phòng, tên thiết bị, tên NV đã gán
        const query = `
            SELECT
                bh.*,
                p.toa,
                p.tang,
                p.soPhong,
                tttb.thietbi_id,       
                tb.tenThietBi,     
                u_assigned.hoTen AS tenNhanVienDaGan
            FROM baohong bh
            LEFT JOIN phong p ON bh.phong_id = p.id -- JOIN để lấy thông tin phòng
            -- JOIN qua thongtinthietbi để lấy thietbi_id
            LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
            -- JOIN vào thietbi để lấy tenThietBi
            LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
            -- JOIN để lấy tên nhân viên đã được gán
            LEFT JOIN users u_assigned ON bh.nhanvien_id = u_assigned.id
            ORDER BY bh.ngayBaoHong DESC; -- Sắp xếp theo ngày báo giảm dần
        `;

        const [baoHongRows] = await pool.query(query);

        const phongMap = new Map(baoHongRows.map(p => [p.phong_id, `${p.toa}${p.tang}.${p.soPhong}`]));

        const baoHongDataPromises = baoHongRows.map(async (item) => {
            let suggested_nhanvien_id = null;
            let suggested_nhanvien_name = null;

            if (item.trangThai === 'Chờ Duyệt') {
                // Ưu tiên 1: Tìm phân công cố định
                const [fixedAssign] = await pool.query(
                    `SELECT npp.nhanvien_id, u.hoTen
                     FROM nhanvien_phong_phutrach npp
                     JOIN users u ON npp.nhanvien_id = u.id
                     WHERE npp.phong_id = ? AND u.tinhTrang = 'on'`, // Chỉ gợi ý NV đang hoạt động
                    [item.phong_id]
                );

                if (fixedAssign.length > 0) {
                    suggested_nhanvien_id = fixedAssign[0].nhanvien_id;
                    suggested_nhanvien_name = fixedAssign[0].hoTen;
                } else {
                    // Ưu tiên 2: Tìm người trực theo lịch tại thời điểm báo hỏng
                    const [shiftAssign] = await pool.query(
                        `SELECT lt.nhanvien_id, u.hoTen
                         FROM lichtruc lt
                         JOIN users u ON lt.nhanvien_id = u.id
                         WHERE ? BETWEEN lt.start_time AND lt.end_time AND u.tinhTrang = 'on'
                         LIMIT 1`, // Lấy người đầu tiên tìm thấy nếu có nhiều người trùng lịch
                        [item.ngayBaoHong] // Thời điểm báo hỏng
                    );
                    if (shiftAssign.length > 0) {
                        suggested_nhanvien_id = shiftAssign[0].nhanvien_id;
                        suggested_nhanvien_name = shiftAssign[0].hoTen;
                    }
                }
            }


            return {
                ...item,
                phong_name: phongMap.get(item.phong_id) || "Không xác định",
                tenThietBi: item.tenThietBi || null, 
                tenNhanVienXuLy: item.tenNhanVienDaGan || null, // Tên NV đã gán chính thức
                suggested_nhanvien_id, // ID NV gợi ý
                suggested_nhanvien_name // Tên NV gợi ý
            };
        });


        const baoHongData = await Promise.all(baoHongDataPromises);

        res.status(200).json(baoHongData);

    } catch (error) {
        console.error("Lỗi khi lấy thông tin báo hỏng:", error);
        res.status(500).json({ error: "Không thể lấy thông tin báo hỏng." });
    }
};


exports.updateBaoHong = async (req, res) => {
    const { id } = req.params;
    const { trangThai, nhanvien_id, ghiChuXuLy, ghiChuAdmin, action } = req.body;
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;
    // Không cần lấy io từ req.app nữa

    let finalNhanVienId = null;
    let statusAfterUpdate = '';

    // --- Validation (Giữ nguyên) ---
    if (trangThai === 'Đã Duyệt' && requesterRole === 'admin' && !nhanvien_id) {
        return res.status(400).json({ error: "Vui lòng chọn nhân viên xử lý khi duyệt." });
    }

    const allowedStatusUpdatesByNhanVien = ['Đang Tiến Hành', 'Hoàn Thành', 'Không Thể Hoàn Thành'];
    if (requesterRole === 'nhanvien' && !allowedStatusUpdatesByNhanVien.includes(trangThai)) {
        return res.status(403).json({ error: "Bạn không có quyền đặt trạng thái này." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- Kiểm tra trước khi cập nhật (Giữ nguyên) ---
        const [currentBaoHongRows] = await connection.query("SELECT trangThai, nhanvien_id, coLogBaoTri, thongtinthietbi_id FROM baohong WHERE id = ?", [id]);
        if (currentBaoHongRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Báo hỏng không tồn tại." });
        }
        const currentBaoHong = currentBaoHongRows[0];
        const currentNhanVienId = currentBaoHong.nhanvien_id;
        if (requesterRole === 'nhanvien' && currentBaoHong.nhanvien_id !== requesterId) {
            await connection.rollback();
            return res.status(403).json({ error: "Bạn không được giao xử lý báo hỏng này." });
        }

        // *** XỬ LÝ HỦY LỆNH CỦA ADMIN  TRỞ VỀ CHỜ DUYỆT***
        if (requesterRole === 'admin' && action === 'cancel') {
            const allowedCancelStates = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại'];
            if (!allowedCancelStates.includes(currentBaoHong.trangThai)) {
                await connection.rollback();
                return res.status(400).json({ error: `Không thể hủy lệnh khi báo hỏng đang ở trạng thái '${currentBaoHong.trangThai}'.` });
            }
            statusAfterUpdate = 'Chờ Duyệt';
            const queryCancel = `UPDATE baohong SET trangThai = ?, nhanvien_id = NULL, thoiGianXuLy = NULL, ghiChuAdmin = NULL, ghiChuXuLy = NULL, coLogBaoTri = FALSE WHERE id = ?`;
            const paramsCancel = [statusAfterUpdate, id];
            const [cancelResult] = await connection.query(queryCancel, paramsCancel);
            if (cancelResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: "Không tìm thấy báo hỏng để hủy lệnh." });
            }
            await connection.commit();

            // Gửi thông báo hủy cho nhân viên
            if (currentNhanVienId) { // Gửi socket nếu có NV cũ
                console.log(`Attempting to emit task_cancelled for user ${currentNhanVienId}, task ${id}`);
                emitToUser(currentNhanVienId, 'task_cancelled', {
                    baoHongId: parseInt(id),
                    statusAfterUpdate: statusAfterUpdate
                });
            }
            return res.status(200).json({ message: "Đã hủy lệnh và đặt lại trạng thái về 'Chờ Duyệt' thành công!", id: id, statusAfterUpdate: statusAfterUpdate });
        }
        // *** KẾT THÚC XỬ LÝ HỦY LỆNH ***

        // *** LOGIC CHO ADMIN DUYỆT LẠI ***
        if (requesterRole === 'admin' && (currentBaoHong.trangThai === 'Hoàn Thành' || currentBaoHong.trangThai === 'Không Thể Hoàn Thành')) {
            if (trangThai === 'Yêu Cầu Làm Lại' || trangThai === 'Đã Duyệt') {
                // Admin có thể đặt lại về "Đã Duyệt" (có thể kèm ghi chú) hoặc "Yêu Cầu Làm Lại"
                statusAfterUpdate = (trangThai === 'Yêu Cầu Làm Lại' ? 'Yêu Cầu Làm Lại' : 'Đã Duyệt'); // Gán trạng thái mới
                finalNhanVienId = nhanvien_id === undefined ? currentNhanVienId : nhanvien_id; // Xác định NV mới/cũ

                // Nếu không có nhân viên nào (cả cũ và mới), báo lỗi nếu trạng thái là Đã Duyệt/Yêu cầu làm lại
                if (!finalNhanVienId && (statusAfterUpdate === 'Đã Duyệt' || statusAfterUpdate === 'Yêu Cầu Làm Lại')) {
                    await connection.rollback();
                    return res.status(400).json({ error: "Vui lòng chọn nhân viên xử lý khi duyệt lại hoặc yêu cầu làm lại." });
                }


                let queryReopen = "UPDATE baohong SET trangThai = ?, nhanvien_id = ?, ghiChuAdmin = ?, thoiGianXuLy = NULL, coLogBaoTri = FALSE, ghiChuXuLy = NULL WHERE id = ?";
                let paramsReopen = [statusAfterUpdate, finalNhanVienId, ghiChuAdmin || null, id];

                // Thực thi UPDATE
                const [reopenResult] = await connection.query(queryReopen, paramsReopen);
                if (reopenResult.affectedRows === 0) {
                    await connection.rollback();
                    return res.status(404).json({ error: "Không tìm thấy báo hỏng để duyệt lại." });
                }

                await connection.commit();

                if (finalNhanVienId) { // Gửi socket nếu có NV được gán
                    const [reassignedTask] = await pool.query("SELECT bh.*, p.toa, p.tang, p.soPhong FROM baohong bh JOIN phong p ON bh.phong_id = p.id WHERE bh.id = ?", [id]);
                    if (reassignedTask.length > 0) {
                        const taskData = {
                            ...reassignedTask[0],
                            phong_name: `${reassignedTask[0].toa}${reassignedTask[0].tang}.${reassignedTask[0].soPhong}`
                        };
                        // Dùng emitToUser
                        emitToUser(finalNhanVienId, statusAfterUpdate === 'Yêu Cầu Làm Lại' ? 'task_reassigned' : 'new_task', taskData);
                    }
                }
                return res.status(200).json({ message: "Đã yêu cầu làm lại / duyệt lại...", id: id, statusAfterUpdate: statusAfterUpdate });
            }
        }
        // *** KẾT THÚC LOGIC ADMIN DUYỆT LẠI ***

        // *** KIỂM TRA NGĂN HOÀN THÀNH SỚM ***
        if (requesterRole === 'nhanvien' && trangThai === 'Hoàn Thành') {
            if (currentBaoHong.trangThai !== 'Đang Tiến Hành') {
                await connection.rollback();
                return res.status(400).json({ error: "Không thể hoàn thành báo hỏng chưa ở trạng thái 'Đang Tiến Hành'." });
            }
            if (!currentBaoHong.coLogBaoTri) {
                await connection.rollback();
                return res.status(400).json({ error: "Vui lòng ghi nhận hoạt động bảo trì trước khi hoàn thành." });
            }
            // Kiểm tra kết quả xử lý cuối cùng hoặc trạng thái thiết bị
            if (currentBaoHong.thongtinthietbi_id) {
                const [tttbRows] = await connection.query("SELECT tinhTrang FROM thongtinthietbi WHERE id = ?", [currentBaoHong.thongtinthietbi_id]);
                if (tttbRows.length > 0 && ['dang_bao_hanh', 'cho_thanh_ly'].includes(tttbRows[0].tinhTrang)) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Không thể hoàn thành khi thiết bị đang ở trạng thái '${tttbRows[0].tinhTrang}'.` });
                }
            }
            const [lastLog] = await connection.query("SELECT ketQuaXuLy FROM baotri WHERE baohong_id = ? ORDER BY thoiGian DESC LIMIT 1", [id]);
            if (lastLog.length > 0 && ['Đã gửi bảo hành', 'Đề xuất thanh lý'].includes(lastLog[0].ketQuaXuLy)) {
                await connection.rollback();
                return res.status(400).json({ error: "Log bảo trì cuối cùng chưa cho phép hoàn thành." });
            }
        }
        // *** HẾT KIỂM TRA NGĂN HOÀN THÀNH SỚM ***

        // --- UPDATE TRẠNG THÁI THÔNG THƯỜNG ---
        statusAfterUpdate = trangThai;
        finalNhanVienId = currentNhanVienId;
        let query = "UPDATE baohong SET trangThai = ?";
        const params = [statusAfterUpdate];

        if (statusAfterUpdate === 'Đã Duyệt' && requesterRole === 'admin') {
            finalNhanVienId = nhanvien_id;
            query += ", nhanvien_id = ?, thoiGianXuLy = NOW(), coLogBaoTri = FALSE, ghiChuXuLy = NULL, ghiChuAdmin = ?";
            params.push(finalNhanVienId);
            params.push(ghiChuAdmin || null);
        } else if (statusAfterUpdate === 'Không Thể Hoàn Thành') {
            query += ", thoiGianXuLy = NOW(), ghiChuXuLy = ?";
            params.push(ghiChuXuLy || null);
        } else if (statusAfterUpdate === 'Hoàn Thành') {
            query += ", thoiGianXuLy = NOW()";
        } else if (statusAfterUpdate === 'Đang Tiến Hành') {
            finalNhanVienId = currentNhanVienId;
        }

        query += " WHERE id = ?";
        params.push(id);

        // --- Thực thi UPDATE ---
        const [result] = await connection.query(query, params);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Không tìm thấy báo hỏng để cập nhật." });
        }

        await connection.commit();

        if (statusAfterUpdate === 'Đã Duyệt' && requesterRole === 'admin' && finalNhanVienId) {
            const [newTask] = await pool.query("SELECT bh.*, p.toa, p.tang, p.soPhong FROM baohong bh JOIN phong p ON bh.phong_id = p.id WHERE bh.id = ?", [id]);
            if (newTask.length > 0) {
                const taskData = {
                    ...newTask[0],
                    phong_name: `${newTask[0].toa}${newTask[0].tang}.${newTask[0].soPhong}`
                };
                emitToUser(finalNhanVienId, 'new_task', taskData);
            }
        }
        res.status(200).json({ message: "Cập nhật báo hỏng thành công!", id: id, statusAfterUpdate: statusAfterUpdate });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi cập nhật báo hỏng:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi cập nhật báo hỏng." });
    } finally {
        connection.release();
    }
};

exports.uploadBaoHongImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Không có file nào được tải lên.' });
    }
    // req.file.path chứa URL từ Cloudinary do cấu hình multer-storage-cloudinary
    res.json({ imageUrl: req.file.path });
};

exports.uploadBaoHongImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Không có file nào được tải lên.' });
    }
    res.json({ imageUrl: req.file.path });
};

// Controller lấy báo hỏng được gán
exports.getAssignedBaoHong = async (req, res) => {
    const nhanvien_id = req.user?.id;

    if (!nhanvien_id) {
        return res.status(401).json({ error: "Không thể xác định nhân viên." });
    }
    try {
        // <<< SỬA SQL: Bỏ comment lỗi >>>
        const sqlQuery = `
            SELECT
                bh.*,
                p.toa, p.tang, p.soPhong,
                tb.tenThietBi
            FROM baohong bh
            JOIN phong p ON bh.phong_id = p.id
            LEFT JOIN thietbi tb ON bh.thietbi_id = tb.id
            WHERE bh.nhanvien_id = ?
              AND bh.trangThai IN ('Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại')
            ORDER BY FIELD(bh.trangThai, 'Yêu Cầu Làm Lại', 'Đã Duyệt', 'Đang Tiến Hành'), bh.ngayBaoHong ASC
        `;
        const [assignedRows] = await pool.query(sqlQuery, [nhanvien_id]);

        const assignedData = assignedRows.map(item => ({
            ...item,
            phong_name: `${item.toa}${item.tang}.${item.soPhong}` // Bỏ khoảng trắng thừa cuối
        }));

        res.status(200).json(assignedData);

    } catch (error) {
        console.error("Lỗi khi lấy báo hỏng được gán:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy công việc được giao." });
    }
};

exports.deleteBaoHong = async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID báo hỏng không hợp lệ." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Ví dụ: Xóa cả log bảo trì liên quan
        await connection.query("DELETE FROM baotri WHERE baohong_id = ?", [id]);

        const [result] = await connection.query("DELETE FROM baohong WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Không tìm thấy báo hỏng để xóa." });
        }

        await connection.commit();
        res.status(200).json({ message: "Xóa báo hỏng thành công!", id: id });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi xóa báo hỏng:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Không thể xóa báo hỏng này vì còn dữ liệu liên quan (ví dụ: trong bảng baohong_lichtruc)." });
        }
        res.status(500).json({ error: "Lỗi máy chủ khi xóa báo hỏng." });
    } finally {
        connection.release();
    }
};