// const pool = require("../config/db");
// const { emitToUser } = require('../socket');
// // const moment = require("moment");

// const validateForeignKeys = async (thietbi_id, thongtinthietbi_id, phong_id) => {
//     if (thietbi_id) {
//         const [rows] = await pool.query(
//             `SELECT * FROM phong_thietbi WHERE thietbi_id = ? AND phong_id = ?`,
//             [thietbi_id, phong_id]
//         );
//         if (rows.length === 0) return false; // Không khớp thietbi_id và phong_id
//     }

//     if (thongtinthietbi_id) {
//         const [rowsThongTin] = await pool.query(
//             `SELECT * FROM thongtinthietbi WHERE id = ?`,
//             [thongtinthietbi_id]
//         );
//         if (rowsThongTin.length === 0) return false; // Không tồn tại thongtinthietbi_id
//     }

//     return true; // Các giá trị hợp lệ
// };

// exports.postGuiBaoHong = async (req, res) => {
//     const { devices = [], phong_id, thiethai, moTa, hinhAnh, loaithiethai } = req.body;
//     const user_id = req.user?.id; // Lấy user_id từ token nếu có

//     // --- Validation cơ bản ---
//     if (!phong_id || !thiethai || !loaithiethai) {
//         return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
//     }
//     if (loaithiethai === 'Các Loại Thiết Bị' && devices.length === 0) {
//         return res.status(400).json({ error: "Vui lòng chọn ít nhất một thiết bị khi báo hỏng loại 'Các Loại Thiết Bị'." });
//     }
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const insertResults = [];

//         if (devices.length === 0) {
//             // Báo hỏng chung cho phòng
//             const [result] = await connection.query(`
//                 INSERT INTO baohong (phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
//                 VALUES (?, ?, ?, ?, ?, ?, NOW())
//             `, [phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);
//             insertResults.push(result); // Lưu kết quả
//         } else {
//             // Báo hỏng cho từng thiết bị
//             for (const device of devices) {
//                 const { thietbi_id, thongtinthietbi_id } = device;
//                 if (!thongtinthietbi_id) continue;

//                 // Kiểm tra trùng lặp
//                 const [existingPending] = await connection.query(
//                     `SELECT id FROM baohong WHERE thongtinthietbi_id = ? AND trangThai NOT IN ('Hoàn Thành', 'Không Thể Hoàn Thành')`,
//                     [thongtinthietbi_id]
//                 );
//                 if (existingPending.length > 0) {
//                     throw new Error(`Thiết bị (MDD: ${thongtinthietbi_id}) đã được báo hỏng và đang chờ xử lý.`);
//                 }

//                 const [result] = await connection.query(`
//                     INSERT INTO baohong (thietbi_id, thongtinthietbi_id, phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
//                 `, [thietbi_id || null, thongtinthietbi_id, phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);
//                 insertResults.push(result); // Lưu kết quả
//             }
//         }
//         if (insertResults.length === 0 && devices.length > 0) {
//             throw new Error("Không có thông tin thiết bị hợp lệ để báo hỏng.");
//         }

//         await connection.commit();

//         try {
//             const firstInsertedId = insertResults[0]?.insertId;
//             if (firstInsertedId) {
//                 const [newBaoHong] = await pool.query(`
//                             SELECT bh.*, p.toa, p.tang, p.soPhong, tb.tenThietBi, u_report.hoTen as nguoiBaoCao
//                             FROM baohong bh
//                             JOIN phong p ON bh.phong_id = p.id
//                             LEFT JOIN thietbi tb ON bh.thietbi_id = tb.id
//                             LEFT JOIN users u_report ON bh.user_id = u_report.id
//                             WHERE bh.id = ?`,
//                     [firstInsertedId]
//                 );

//                 if (newBaoHong.length > 0) {
//                     const eventData = {
//                         ...newBaoHong[0],
//                         phong_name: `${newBaoHong[0].toa}${newBaoHong[0].tang}.${newBaoHong[0].soPhong}`
//                     };
//                     emitToUser(1, 'new_baohong', eventData);
//                 }
//             }
//         } catch (socketError) {
//             console.error("Lỗi khi gửi socket event sau khi tạo báo hỏng:", socketError);
//         }

//         res.status(201).json({ message: "Gửi báo hỏng thành công!" });

//     } catch (error) {
//         await connection.rollback();
//         console.error("Lỗi khi lưu báo hỏng:", error);
//         if (error.message.includes("đã được báo hỏng")) {
//             res.status(409).json({ error: error.message });
//         } else {
//             res.status(500).json({ error: "Không thể lưu báo hỏng." });
//         }
//     } finally {
//         connection.release();
//     }
// };


// exports.getThongTinBaoHong = async (req, res) => {
//     try {
//         // 1. Lấy thông tin báo hỏng cơ bản và JOIN để lấy tên phòng, tên thiết bị, tên NV đã gán
//         const query = `
//             SELECT
//                 bh.*,
//                 p.toa,
//                 p.tang,
//                 p.soPhong,
//                 tttb.thietbi_id,
//                 tttb.tinhTrang,       
//                 tb.tenThietBi,     
//                 u_assigned.hoTen AS tenNhanVienDaGan,
//                 latest_log.phuongAnXuLy AS phuongAnXuLyCuoiCung
//             FROM baohong bh
//             LEFT JOIN phong p ON bh.phong_id = p.id -- JOIN để lấy thông tin phòng
//             -- JOIN qua thongtinthietbi để lấy thietbi_id
//             LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
//             -- JOIN vào thietbi để lấy tenThietBi
//             LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
//             -- JOIN để lấy tên nhân viên đã được gán
//             LEFT JOIN users u_assigned ON bh.nhanvien_id = u_assigned.id
//             LEFT JOIN (
//                 SELECT
//                     bt.baohong_id,
//                     bt.phuongAnXuLy,
//                     ROW_NUMBER() OVER(PARTITION BY bt.baohong_id ORDER BY bt.thoiGian DESC) as rn
//                 FROM baotri bt
//             ) AS latest_log ON bh.id = latest_log.baohong_id AND latest_log.rn = 1
//             ORDER BY bh.ngayBaoHong ASC;
//         `;

//         const [baoHongRows] = await pool.query(query);

//         const phongMap = new Map(baoHongRows.map(p => [p.phong_id, `${p.toa}${p.tang}.${p.soPhong}`]));

//         const baoHongDataPromises = baoHongRows.map(async (item) => {
//             let suggested_nhanvien_id = null;
//             let suggested_nhanvien_name = null;

//             if (item.trangThai === 'Chờ Duyệt') {
//                 // Ưu tiên 1: Tìm phân công cố định
//                 const [fixedAssign] = await pool.query(
//                     `SELECT npp.nhanvien_id, u.hoTen
//                      FROM nhanvien_phong_phutrach npp
//                      JOIN users u ON npp.nhanvien_id = u.id
//                      WHERE npp.phong_id = ? AND u.tinhTrang = 'on'`, // Chỉ gợi ý NV đang hoạt động
//                     [item.phong_id]
//                 );

//                 if (fixedAssign.length > 0) {
//                     suggested_nhanvien_id = fixedAssign[0].nhanvien_id;
//                     suggested_nhanvien_name = fixedAssign[0].hoTen;
//                 } else {
//                     // Ưu tiên 2: Tìm người trực theo lịch tại thời điểm báo hỏng
//                     const [shiftAssign] = await pool.query(
//                         `SELECT lt.nhanvien_id, u.hoTen
//                          FROM lichtruc lt
//                          JOIN users u ON lt.nhanvien_id = u.id
//                          WHERE ? BETWEEN lt.start_time AND lt.end_time AND u.tinhTrang = 'on'
//                          LIMIT 1`, // Lấy người đầu tiên tìm thấy nếu có nhiều người trùng lịch
//                         [item.ngayBaoHong] // Thời điểm báo hỏng
//                     );
//                     if (shiftAssign.length > 0) {
//                         suggested_nhanvien_id = shiftAssign[0].nhanvien_id;
//                         suggested_nhanvien_name = shiftAssign[0].hoTen;
//                     }
//                 }
//             }


//             return {
//                 ...item,
//                 phong_name: phongMap.get(item.phong_id) || "Không xác định",
//                 tenThietBi: item.tenThietBi || null,
//                 tenNhanVienXuLy: item.tenNhanVienDaGan || null, // Tên NV đã gán chính thức
//                 suggested_nhanvien_id, // ID NV gợi ý
//                 suggested_nhanvien_name, // Tên NV gợi ý
//                 phuongAnXuLy: item.phuongAnXuLyCuoiCung || null
//             };
//         });


//         const baoHongData = await Promise.all(baoHongDataPromises);

//         res.status(200).json(baoHongData);

//     } catch (error) {
//         console.error("Lỗi khi lấy thông tin báo hỏng:", error);
//         res.status(500).json({ error: "Không thể lấy thông tin báo hỏng." });
//     }
// };

// exports.updateBaoHong = async (req, res) => {
//     const { id } = req.params;
//     // Lấy các trường từ body
//     const { trangThai, nhanvien_id, ghiChuXuLy, ghiChuAdmin, action, finalDeviceStatus } = req.body;
//     const requesterRole = req.user?.role;
//     const requesterId = req.user?.id;

//     let finalNhanVienId = null;
//     let statusAfterUpdate = '';

//     // --- Validation ---
//     if (trangThai === 'Đã Duyệt' && requesterRole === 'admin' && !nhanvien_id) {
//         console.log(`[updateBaoHong] ID: ${id}, Validation Failed: Admin duyệt nhưng thiếu nhân viên.`);
//         return res.status(400).json({ error: "Vui lòng chọn nhân viên xử lý khi duyệt." });
//     }

//     const allowedStatusUpdatesByNhanVien = ['Đang Tiến Hành', 'Hoàn Thành', 'Không Thể Hoàn Thành', 'Chờ Xem Xét'];
//     // Kiểm tra chỉ khi trangThai được gửi lên từ client và người gửi là nhân viên
//     if (trangThai && requesterRole === 'nhanvien' && !allowedStatusUpdatesByNhanVien.includes(trangThai)) {
//         console.log(`[updateBaoHong] ID: ${id}, Forbidden: Nhân viên không được đặt trạng thái ${trangThai}.`);
//         return res.status(403).json({ error: "Bạn không có quyền đặt trạng thái này." });
//     }
//     //--- Kết thúc validation ---

//     const connection = await pool.getConnection();

//     try {
//         await connection.beginTransaction();

//         // --- Pre-update checks ---
//         const [currentBaoHongRows] = await connection.query(
//             `SELECT bh.trangThai, bh.nhanvien_id, bh.coLogBaoTri, bh.thongtinthietbi_id, tttb.tinhTrang as currentDeviceStatus
//              FROM baohong bh
//              LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
//              WHERE bh.id = ?`, [id]);
//         if (currentBaoHongRows.length === 0) {
//             await connection.rollback();
//             return res.status(404).json({ error: "Báo hỏng không tồn tại." });
//         }
//         const currentBaoHong = currentBaoHongRows[0];

//         // Kiểm tra quyền nếu người yêu cầu là nhân viên
//         if (requesterRole === 'nhanvien' && currentBaoHong.nhanvien_id !== requesterId) {
//             await connection.rollback();
//             console.log(`[updateBaoHong] ID: ${id}, Forbidden: Nhân viên ${requesterId} không được gán cho task này (NV ${currentBaoHong.nhanvien_id}).`);
//             return res.status(403).json({ error: "Bạn không được giao xử lý báo hỏng này." });
//         }
//         // --- Kết thúc Pre-update checks ---

//         // --- Xử lý action 'cancel' ---
//         if (requesterRole === 'admin' && action === 'cancel') {
//             const allowedCancelStates = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét']; // Mở rộng các trạng thái có thể hủy
//             if (!allowedCancelStates.includes(currentBaoHong.trangThai)) {
//                 await connection.rollback();
//                 return res.status(400).json({ error: `Không thể hủy lệnh khi báo hỏng đang ở trạng thái '${currentBaoHong.trangThai}'.` });
//             }

//             // Lấy ID nhân viên hiện tại TRƯỚC KHI reset
//             const currentNhanVienId = currentBaoHong.nhanvien_id;

//             statusAfterUpdate = 'Chờ Duyệt'; // Luôn quay về Chờ Duyệt khi hủy
//             const queryCancel = `UPDATE baohong SET trangThai = ?, nhanvien_id = NULL, thoiGianXuLy = NULL, ghiChuAdmin = NULL, ghiChuXuLy = NULL, coLogBaoTri = FALSE WHERE id = ?`;
//             const paramsCancel = [statusAfterUpdate, id];

//             const [cancelResult] = await connection.query(queryCancel, paramsCancel);

//             if (cancelResult.affectedRows === 0) {
//                 await connection.rollback();
//                 return res.status(404).json({ error: "Không tìm thấy báo hỏng để hủy lệnh." });
//             }

//             await connection.commit();

//             // ... (Gửi socket hủy) ...
//             if (currentNhanVienId) { 
//                 try {
//                     emitToUser(currentNhanVienId, 'task_cancelled', {
//                         baoHongId: parseInt(id), // Đảm bảo ID là số nếu cần
//                         statusAfterUpdate: statusAfterUpdate
//                     });
//                 } catch (socketError) {
//                 }
//                 return res.status(200).json({
//                     message: "Đã hủy lệnh và đặt lại trạng thái về 'Chờ Duyệt' thành công!",
//                     id: id, 
//                     statusAfterUpdate: statusAfterUpdate
//                 });
//             }
//         }
//         // --- Kết thúc Cancel ---

//         // --- XỬ LÝ DUYỆT LẦN ĐẦU ---
//         else if (requesterRole === 'admin' && currentBaoHong.trangThai === 'Chờ Duyệt' && trangThai === 'Đã Duyệt') {
//             console.log(`[updateBaoHong] ID: ${id}, Processing initial Admin approval.`);

//             // Validation: Đảm bảo nhanvien_id được gửi lên
//             if (nhanvien_id === undefined || nhanvien_id === null) {
//                 await connection.rollback();
//                 console.log(`[updateBaoHong] ID: ${id}, Validation Failed: Admin duyệt nhưng thiếu nhân viên.`);
//                 return res.status(400).json({ error: "Vui lòng chọn nhân viên xử lý khi duyệt." });
//             }

//             statusAfterUpdate = 'Đã Duyệt';
//             finalNhanVienId = nhanvien_id; // LẤY ID TỪ REQUEST BODY

//             // Câu lệnh SQL cập nhật cả trạng thái và nhân viên
//             const queryApprove = `
//                         UPDATE baohong
//                         SET trangThai = ?,
//                             nhanvien_id = ?,
//                             ghiChuAdmin = ?,
//                             thoiGianXuLy = NULL,  -- Reset thời gian xử lý cũ nếu có
//                             coLogBaoTri = FALSE, -- Reset cờ log bảo trì
//                             ghiChuXuLy = NULL   -- Reset ghi chú xử lý cũ nếu có
//                         WHERE id = ?`;
//             const paramsApprove = [statusAfterUpdate, finalNhanVienId, ghiChuAdmin || null, id];

//             console.log(`[updateBaoHong] ID: ${id}, Executing Initial Approval SQL: ${queryApprove} with params:`, paramsApprove);
//             const [approveResult] = await connection.query(queryApprove, paramsApprove);
//             console.log(`[updateBaoHong] ID: ${id}, Initial Approval result:`, approveResult);

//             if (approveResult.affectedRows === 0) {
//                 await connection.rollback();
//                 return res.status(404).json({ error: "Không tìm thấy báo hỏng để duyệt." });
//             }

//             await connection.commit();
//             console.log(`[updateBaoHong] ID: ${id}, Initial Approval Transaction committed.`);

//             // Gửi thông báo socket tới nhân viên được gán (nếu cần)
//             // Ví dụ: emitToUser(finalNhanVienId, 'new_task_assigned', { baoHongId: parseInt(id) });

//             console.log(`[updateBaoHong] ID: ${id}, Sending Initial Approval success response.`);
//             // Trả về ID và trạng thái mới
//             return res.status(200).json({
//                 message: "Duyệt và gán báo hỏng thành công!",
//                 id: id, // Chuyển id về kiểu number nếu cần thiết ở frontend
//                 statusAfterUpdate: statusAfterUpdate
//             });
//         }
//         // --- END: THÊM KHỐI XỬ LÝ DUYỆT LẦN ĐẦU ---

//         // --- Xử lý Admin duyệt lại ---
//         else if (requesterRole === 'admin' && (currentBaoHong.trangThai === 'Hoàn Thành' || currentBaoHong.trangThai === 'Không Thể Hoàn Thành' || currentBaoHong.trangThai === 'Chờ Xem Xét')) {
//             // Các trạng thái Admin có thể chuyển đến từ các trạng thái trên
//             const validNextAdminStates = ['Yêu Cầu Làm Lại', 'Đã Duyệt', 'Hoàn Thành'];
//             if (trangThai && validNextAdminStates.includes(trangThai)) {
//                 console.log(`[updateBaoHong] ID: ${id}, Processing Admin action. Target state: ${trangThai}`);
//                 statusAfterUpdate = trangThai;
//                 finalNhanVienId = nhanvien_id === undefined ? currentBaoHong.nhanvien_id : nhanvien_id;

//                 // Nếu chuyển về trạng thái cần NV xử lý mà không có NV -> lỗi
//                 if (!finalNhanVienId && (statusAfterUpdate === 'Đã Duyệt' || statusAfterUpdate === 'Yêu Cầu Làm Lại')) {
//                     await connection.rollback();
//                     return res.status(400).json({ error: "Vui lòng chọn nhân viên xử lý." });
//                 }

//                 // --- Xử lý cập nhật TTTB nếu duyệt từ 'Chờ Xem Xét' thành 'Hoàn Thành' ---
//                 let updateDeviceStatus = false;
//                 if (currentBaoHong.trangThai === 'Chờ Xem Xét' && statusAfterUpdate === 'Hoàn Thành' && currentBaoHong.thongtinthietbi_id) {
//                     const currentDeviceStatus = currentBaoHong.currentDeviceStatus;
//                     // Trường hợp 1: Thiết bị đã bảo hành về (da_bao_hanh) -> Admin phải chọn finalDeviceStatus
//                     if (currentDeviceStatus === 'da_bao_hanh') {
//                         if (!finalDeviceStatus || !['con_bao_hanh', 'het_bao_hanh'].includes(finalDeviceStatus)) {
//                             await connection.rollback();
//                             console.error(`[updateBaoHong] ID: ${id}, Missing/Invalid finalDeviceStatus ('${finalDeviceStatus}') for da_bao_hanh.`);
//                             return res.status(400).json({ error: "Vui lòng chọn trạng thái 'Còn bảo hành' hoặc 'Hết bảo hành' cho thiết bị." });
//                         }
//                         updateDeviceStatus = true; // Đánh dấu cần cập nhật TTTB
//                     }
//                     // Trường hợp 2: Đề xuất thanh lý -> Admin phải chọn finalDeviceStatus
//                     else if (currentDeviceStatus === 'de_xuat_thanh_ly') {
//                         const validDisposalFinalStates = ['cho_thanh_ly', 'con_bao_hanh', 'het_bao_hanh'];
//                         if (!finalDeviceStatus || !validDisposalFinalStates.includes(finalDeviceStatus)) {
//                             await connection.rollback();
//                             console.error(`[updateBaoHong] ID: ${id}, Missing/Invalid finalDeviceStatus ('${finalDeviceStatus}') for de_xuat_thanh_ly.`);
//                             return res.status(400).json({ error: "Vui lòng chọn 'Chờ thanh lý', 'Còn bảo hành' hoặc 'Hết bảo hành'." });
//                         }
//                         updateDeviceStatus = true; // Đánh dấu cần cập nhật TTTB
//                     }
//                 }

//                 // Cập nhật TTTB nếu cần (trong cùng transaction)
//                 if (updateDeviceStatus) {
//                     console.log(`[updateBaoHong] ID: ${id}, Updating TTTB ${currentBaoHong.thongtinthietbi_id} to status: ${finalDeviceStatus}`);
//                     const [tttbUpdateResult] = await connection.query(
//                         "UPDATE thongtinthietbi SET tinhTrang = ? WHERE id = ?",
//                         [finalDeviceStatus, currentBaoHong.thongtinthietbi_id]
//                     );
//                     if (tttbUpdateResult.affectedRows === 0) {
//                         await connection.rollback();
//                         console.warn(`[updateBaoHong] ID: ${id}, Failed to update TTTB ${currentBaoHong.thongtinthietbi_id}.`);
//                         return res.status(404).json({ error: "Không tìm thấy thiết bị liên quan để cập nhật." });
//                     }
//                     console.log(`[updateBaoHong] ID: ${id}, TTTB ${currentBaoHong.thongtinthietbi_id} updated successfully.`);
//                 }
//                 // --- Kết thúc xử lý cập nhật TTTB ---

//                 // --- Cập nhật Báo hỏng ---
//                 let queryAdminAction = "UPDATE baohong SET trangThai = ?, nhanvien_id = ?, ghiChuAdmin = ?";
//                 let paramsAdminAction = [statusAfterUpdate, finalNhanVienId, ghiChuAdmin || null];

//                 // Reset các trường nếu cần
//                 if (statusAfterUpdate === 'Yêu Cầu Làm Lại' || statusAfterUpdate === 'Đã Duyệt') {
//                     queryAdminAction += ", thoiGianXuLy = NULL, coLogBaoTri = FALSE, ghiChuXuLy = NULL";
//                 } else if (statusAfterUpdate === 'Hoàn Thành') {
//                     queryAdminAction += ", thoiGianXuLy = NOW()"; // Ghi nhận thời gian hoàn thành
//                 }

//                 queryAdminAction += " WHERE id = ?";
//                 paramsAdminAction.push(id);

//                 console.log(`[updateBaoHong] ID: ${id}, Executing Admin Action SQL: ${queryAdminAction} with params:`, paramsAdminAction);
//                 const [adminActionResult] = await connection.query(queryAdminAction, paramsAdminAction);
//                 console.log(`[updateBaoHong] ID: ${id}, Admin Action result:`, adminActionResult);

//                 if (adminActionResult.affectedRows === 0) {
//                     await connection.rollback();
//                     return res.status(404).json({ error: "Không tìm thấy báo hỏng để xử lý." });
//                 }

//                 await connection.commit();
//                 console.log(`[updateBaoHong] ID: ${id}, Admin Action Transaction committed.`);
//                 console.log(`[updateBaoHong] ID: ${id}, Sending Admin Action success response.`);
//                 return res.status(200).json({ message: `Đã cập nhật trạng thái thành '${statusAfterUpdate}'.`, id: id, statusAfterUpdate: statusAfterUpdate });

//             } else {
//                 // Trường hợp admin cố cập nhật từ trạng thái cuối sang trạng thái không hợp lệ khác
//                 await connection.rollback();
//                 return res.status(400).json({ error: `Không thể chuyển từ '${currentBaoHong.trangThai}' sang '${trangThai}'.` });
//             }
//         }
//         // --- Kết thúc Duyệt lại ---

//         // --- Kiểm tra Hoàn thành sớm ---
//         else if (requesterRole === 'nhanvien' && trangThai === 'Hoàn Thành') {
//             console.log(`[updateBaoHong] ID: ${id}, Processing Technician complete request.`);
//             if (currentBaoHong.trangThai !== 'Đang Tiến Hành') { await connection.rollback(); return res.status(400).json({ error: "Chỉ hoàn thành khi đang 'Đang Tiến Hành'." }); }
//             if (!currentBaoHong.coLogBaoTri) { await connection.rollback(); return res.status(400).json({ error: "Cần ghi log trước khi hoàn thành." }); }
//             if (currentBaoHong.thongtinthietbi_id) {
//                 const [tttbRows] = await connection.query("SELECT tinhTrang FROM thongtinthietbi WHERE id = ?", [currentBaoHong.thongtinthietbi_id]);
//                 if (tttbRows.length > 0 && ['dang_bao_hanh', 'de_xuat_thanh_ly'].includes(tttbRows[0].tinhTrang)) {
//                     await connection.rollback(); return res.status(400).json({ error: `Không thể hoàn thành khi thiết bị '${tttbRows[0].tinhTrang}'.` });
//                 }
//             }
//             const [lastLog] = await connection.query("SELECT ketQuaXuLy FROM baotri WHERE baohong_id = ? ORDER BY thoiGian DESC LIMIT 1", [id]);
//             if (lastLog.length > 0 && ['Đã gửi bảo hành', 'Đề xuất thanh lý'].includes(lastLog[0].ketQuaXuLy)) {
//                 await connection.rollback(); return res.status(400).json({ error: "Log cuối chưa cho phép hoàn thành." });
//             }

//             // Nếu vượt qua kiểm tra -> tiến hành cập nhật thành Hoàn Thành
//             statusAfterUpdate = 'Hoàn Thành';
//             let queryComplete = "UPDATE baohong SET trangThai = ?, thoiGianXuLy = NOW() WHERE id = ?";
//             const paramsComplete = [statusAfterUpdate, id];
//             const [completeResult] = await connection.query(queryComplete, paramsComplete);
//             if (completeResult.affectedRows === 0) { await connection.rollback(); return res.status(404).json({ error: "Không tìm thấy báo hỏng để hoàn thành." }); }
//             await connection.commit();
//             return res.status(200).json({ message: "Đã hoàn thành công việc!", id: id, statusAfterUpdate: statusAfterUpdate });
//         }
//         // --- Kết thúc Hoàn thành sớm ---

//         // --- XỬ LÝ CẬP NHẬT TRẠNG THÁI THÔNG THƯỜNG  ---
//         else if (trangThai) {
//             console.log(`[updateBaoHong] ID: ${id}, Processing normal status update to: ${trangThai} by ${requesterRole}`);
//             // Chỉ cho phép nhân viên cập nhật các trạng thái được phép
//             if (requesterRole === 'nhanvien' && !allowedStatusUpdatesByNhanVien.includes(trangThai)) {
//                 await connection.rollback();
//                 console.log(`[updateBaoHong] ID: ${id}, Forbidden: Nhân viên không được đặt trạng thái ${trangThai}.`);
//                 return res.status(403).json({ error: "Bạn không có quyền đặt trạng thái này." });
//             }

//             statusAfterUpdate = trangThai;
//             finalNhanVienId = currentBaoHong.nhanvien_id;

//             let query = "UPDATE baohong SET trangThai = ?";
//             const params = [statusAfterUpdate];

//             // Chỉ cập nhật ghi chú xử lý nếu người gửi là nhân viên và có ghi chú
//             if (requesterRole === 'nhanvien' && ghiChuXuLy !== undefined) {
//                 query += ", ghiChuXuLy = ?";
//                 params.push(ghiChuXuLy || null);
//             }

//             // Xử lý riêng cho các trạng thái cụ thể nếu cần thêm trường
//             if (statusAfterUpdate === 'Không Thể Hoàn Thành' && requesterRole === 'nhanvien') {
//                 query += ", thoiGianXuLy = NOW()";
//             } else if (statusAfterUpdate === 'Đang Tiến Hành' && requesterRole === 'nhanvien') {
//                 query += ", ghiChuAdmin = NULL";
//             } else if (statusAfterUpdate === 'Chờ Xem Xét' && requesterRole === 'nhanvien') {
//                 query += ", thoiGianXuLy = NOW()";
//             }


//             query += " WHERE id = ?";
//             params.push(id);

//             console.log(`[updateBaoHong] ID: ${id}, Executing Normal Update SQL: ${query} with params:`, params);
//             const [result] = await connection.query(query, params);
//             console.log(`[updateBaoHong] ID: ${id}, Normal Update result:`, result);

//             if (result.affectedRows === 0) {
//                 await connection.rollback();
//                 return res.status(404).json({ error: "Không tìm thấy báo hỏng hoặc trạng thái không thay đổi." });
//             }

//             await connection.commit();
//             // Thông báo cho admin khi nhân viên cập nhật trạng thái (ví dụ: chờ xem xét)
//             if (requesterRole === 'nhanvien' && statusAfterUpdate === 'Chờ Xem Xét') {
//                 // emitToRole('admin', 'task_needs_review', { baoHongId: parseInt(id) });
//             } else if (requesterRole === 'nhanvien' && statusAfterUpdate === 'Không Thể Hoàn Thành') {
//                 // emitToRole('admin', 'task_cannot_complete', { baoHongId: parseInt(id) });
//             }

//             res.status(200).json({ message: "Cập nhật báo hỏng thành công!", id: id, statusAfterUpdate: statusAfterUpdate });

//         } else {
//             // Hiện tại logic này không cho phép chỉ cập nhật ghi chú mà không đổi trạng thái
//             await connection.rollback(); // Rollback vì không có hành động rõ ràng
//             console.warn(`[updateBaoHong] ID: ${id}, Update request missing 'trangThai'.`);
//             return res.status(400).json({ error: "Thiếu thông tin trạng thái cần cập nhật." });
//         }

//     } catch (error) {
//         await connection.rollback();
//         res.status(500).json({ error: "Lỗi máy chủ khi cập nhật báo hỏng." });
//     } finally {
//         if (connection) {
//             connection.release();
//         }
//     }
// }

// exports.uploadBaoHongImage = (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'Không có file nào được tải lên.' });
//     }
//     // req.file.path chứa URL từ Cloudinary do cấu hình multer-storage-cloudinary
//     res.json({ imageUrl: req.file.path });
// };

// // Controller lấy báo hỏng được gán
// // exports.getAssignedBaoHong = async (req, res) => {
// //     const nhanvien_id = req.user?.id;

// //     if (!nhanvien_id) {
// //         return res.status(401).json({ error: "Không thể xác định nhân viên." });
// //     }
// //     try {
// //         const sqlQuery = `
// //             SELECT
// //                 bh.*,
// //                 p.toa,
// //                 p.tang,
// //                 p.soPhong,
// //                 tttb.thietbi_id,
// //                 tb.tenThietBi 
// //             FROM baohong bh
// //             LEFT JOIN phong p ON bh.phong_id = p.id -- JOIN để lấy thông tin phòng
// //             LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
// //             LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
// //             WHERE
// //                 bh.nhanvien_id = ? 
// //                 AND bh.trangThai IN ('Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại')
// //             ORDER BY
// //                 FIELD(bh.trangThai, 'Đã Duyệt', 'Yêu Cầu Làm Lại', 'Đang Tiến Hành'),
// //                 bh.ngayBaoHong ASC;
// //         `;
// //         const [assignedRows] = await pool.query(sqlQuery, [nhanvien_id]);

// //         const assignedData = assignedRows.map(item => ({
// //             ...item,
// //             phong_name: item.toa ? `${item.toa}${item.tang}.${item.soPhong}` : `Phòng ID:${item.phong_id}`,
// //             tenThietBi: item.tenThietBi || null 
// //         }));

// //         res.status(200).json(assignedData);

// //     } catch (error) {
// //         console.error("Lỗi khi lấy báo hỏng được gán:", error);
// //         res.status(500).json({ error: "Lỗi máy chủ khi lấy công việc được giao." });
// //     }
// // };

// exports.getAssignedBaoHong = async (req, res) => {
//     const nhanvien_id = req.user?.id;

//     // Lấy danh sách trạng thái từ query params, phân tách bằng dấu phẩy
//     const requestedStatusesQuery = req.query.statuses;
//     let requestedStatuses = null;
//     if (requestedStatusesQuery) {
//         // Lọc bỏ các giá trị trống hoặc không hợp lệ sau khi split
//         requestedStatuses = requestedStatusesQuery.split(',').map(s => s.trim()).filter(s => s);
//     }

//     if (!nhanvien_id) {
//         return res.status(401).json({ error: "Không thể xác định nhân viên." });
//     }
//     try {
//         let sqlQuery = `
//             SELECT
//                 bh.*,
//                 p.toa, p.tang, p.soPhong,
//                 tttb.thietbi_id,
//                 tb.tenThietBi,
//                 tttb.tinhTrang AS tinhTrangThietBi
//             FROM baohong bh
//             LEFT JOIN phong p ON bh.phong_id = p.id -- JOIN để lấy thông tin phòng
//             LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
//             LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
//             WHERE
//                 bh.nhanvien_id = ?
//         `;
//         const queryParams = [nhanvien_id];
//         let statusesToFilter;

//         // Xác định trạng thái cần lọc
//         if (requestedStatuses && requestedStatuses.length > 0) {
//             statusesToFilter = requestedStatuses;
//         } else {
//             // Mặc định nếu không có query param 'statuses'
//             statusesToFilter = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại'];
//         }

//         // Thêm điều kiện lọc trạng thái vào câu query
//         if (statusesToFilter && statusesToFilter.length > 0) {
//             sqlQuery += ` AND bh.trangThai IN (?)`;
//             queryParams.push(statusesToFilter);
//         } else {
//             console.warn("Không có trạng thái hợp lệ để lọc cho nhân viên ID:", nhanvien_id);
//             return res.status(200).json([]);
//         }

//         // Thêm ORDER BY
//         sqlQuery += `
//             ORDER BY
//                 FIELD(bh.trangThai,
//                     'Yêu Cầu Làm Lại',  -- Ưu tiên cao nhất
//                     'Đã Duyệt',          -- Tiếp theo
//                     'Đang Tiến Hành',    -- Đang làm
//                     'Chờ Hoàn Tất Bảo Hành', -- Chờ nhận về
//                     'Chờ Xem Xét'       -- Chờ duyệt cuối
//                 ),
//                 bh.ngayBaoHong DESC; -- Cuối cùng theo ngày báo
//         `;

//         const [assignedRows] = await pool.query(sqlQuery, queryParams);

//         const assignedData = assignedRows.map(item => ({
//             id: item.id,
//             phong_id: item.phong_id,
//             thongtinthietbi_id: item.thongtinthietbi_id,
//             moTa: item.moTa,
//             ngayBaoHong: item.ngayBaoHong,
//             thoiGianXuLy: item.thoiGianXuLy,
//             thiethai: item.thiethai,
//             loaiThietHai: item.loaithietHai,
//             trangThai: item.trangThai,
//             nhanvien_id: item.nhanvien_id, // người được gán xử lý
//             ghiChuAdmin: item.ghiChuAdmin,
//             ghiChuXuLy: item.ghiChuXuLy,
//             coLogBaoTri: Boolean(item.coLogBaoTri), // Chuyển thành boolean
//             phong_name: item.toa ? `${item.toa}${item.tang}.${item.soPhong}` : (item.phong_id ? `Phòng ID:${item.phong_id}` : 'N/A'), // Xử lý cả trường hợp null phong_id
//             tenThietBi: item.tenThietBi || (item.thongtinthietbi_id ? `Thiết bị ID:${item.thongtinthietbi_id}` : 'Không có TB'), // Tên TB hoặc ID
//             tinhTrangThietBi: item.tinhTrangThietBi // Thêm tình trạng thiết bị
//         }));

//         res.status(200).json(assignedData); // Trả về mảng dữ liệu

//     } catch (error) {
//         console.error("Lỗi khi lấy báo hỏng được gán:", error);
//         res.status(500).json({ error: "Lỗi máy chủ khi lấy công việc được giao." });
//     }
// };


// exports.deleteBaoHong = async (req, res) => {
//     const { id } = req.params;

//     if (!id || isNaN(parseInt(id))) {
//         return res.status(400).json({ error: "ID báo hỏng không hợp lệ." });
//     }

//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();
//         // Ví dụ: Xóa cả log bảo trì liên quan
//         await connection.query("DELETE FROM baotri WHERE baohong_id = ?", [id]);

//         const [result] = await connection.query("DELETE FROM baohong WHERE id = ?", [id]);

//         if (result.affectedRows === 0) {
//             await connection.rollback();
//             return res.status(404).json({ error: "Không tìm thấy báo hỏng để xóa." });
//         }

//         await connection.commit();
//         res.status(200).json({ message: "Xóa báo hỏng thành công!", id: id });

//     } catch (error) {
//         await connection.rollback();
//         console.error("Lỗi khi xóa báo hỏng:", error);
//         if (error.code === 'ER_ROW_IS_REFERENCED_2') {
//             return res.status(400).json({ error: "Không thể xóa báo hỏng này vì còn dữ liệu liên quan (ví dụ: trong bảng baohong_lichtruc)." });
//         }
//         res.status(500).json({ error: "Lỗi máy chủ khi xóa báo hỏng." });
//     } finally {
//         connection.release();
//     }
// };

const pool = require("../config/db");
const { emitToUser } = require('../socket');

// ==================================
//        Hàm Helper Nội Bộ
// ==================================
/**
 * Helper: Xử lý Admin duyệt báo hỏng lần đầu.
 * Tự quản lý transaction.
 * @param {object} connection - Active DB connection
 * @param {number} id - ID báo hỏng
 * @param {object} updateData - Dữ liệu từ req.body (chứa nhanvien_id, ghiChuAdmin)
 * @param {object} currentBaoHong - Dữ liệu báo hỏng hiện tại
 * @param {object} currentUser - Thông tin user request (req.user)
 * @returns {Promise<object>} - Object kết quả thành công
 * @throws {Error} - Ném lỗi nếu thất bại (đã rollback)
 */

async function _handleAdminInitialApproval(connection, id, updateData, currentBaoHong, currentUser) {
    console.log(`[_handleAdminInitialApproval] ID: ${id}`);
    const { nhanvien_id, ghiChuAdmin } = updateData;
    const statusAfterUpdate = 'Đã Duyệt';

    if (nhanvien_id === undefined || nhanvien_id === null) {
        // Không cần rollback vì chưa bắt đầu transaction
        throw new Error("Vui lòng chọn nhân viên xử lý khi duyệt.");
    }

    const queryApprove = `
        UPDATE baohong
        SET trangThai = ?, nhanvien_id = ?, ghiChuAdmin = ?,
            thoiGianXuLy = NULL, coLogBaoTri = FALSE, ghiChuXuLy = NULL
        WHERE id = ? AND trangThai = 'Chờ Duyệt'`; // Thêm điều kiện trạng thái để an toàn
    const paramsApprove = [statusAfterUpdate, nhanvien_id, ghiChuAdmin || null, id];

    await connection.beginTransaction(); // Bắt đầu transaction
    try {
        const [approveResult] = await connection.query(queryApprove, paramsApprove);
        console.log(`[_handleAdminInitialApproval] ID: ${id} - Rows Affected: ${approveResult.affectedRows}`);

        if (approveResult.affectedRows === 0) {
            // Có thể do trạng thái đã thay đổi hoặc ID không đúng
            throw new Error("Không tìm thấy báo hỏng ở trạng thái 'Chờ Duyệt' để duyệt hoặc đã có lỗi xảy ra.");
        }

        await connection.commit();
        console.log(`[_handleAdminInitialApproval] ID: ${id} - Transaction committed.`);

        // Gửi socket cho NV được gán
        try {
            emitToUser(nhanvien_id, 'new_task_assigned', { baoHongId: parseInt(id), statusAfterUpdate });
            console.log(`[_handleAdminInitialApproval] ID: ${id} - Emitted new_task_assigned to user ${nhanvien_id}.`);
        } catch (socketError) {
            console.error(`[_handleAdminInitialApproval] ID: ${id} - Failed to emit socket:`, socketError);
        }

        return {
            success: true, // Thêm cờ success để hàm chính dễ kiểm tra
            message: "Duyệt và gán báo hỏng thành công!",
            id: id,
            statusAfterUpdate: statusAfterUpdate
        };
    } catch (error) {
        await connection.rollback();
        console.error(`[_handleAdminInitialApproval] ID: ${id} - Error:`, error);
        // Ném lại lỗi để hàm chính bắt và gửi response 500 hoặc 4xx
        throw new Error(error.message || "Lỗi khi duyệt báo hỏng lần đầu.");
    }
}

/**
 * Helper: Xử lý Admin hủy công việc CÓ GHI LOG.
 * Tự quản lý transaction.
 */
async function _handleAdminCancelWithLog(connection, id, updateData, currentBaoHong, currentUser) {
    console.log(`[_handleAdminCancelWithLog] ID: ${id}`);
    const { lyDoHuy } = updateData;
    const adminId = currentUser.id;
    const adminUsername = currentUser.username; // Giả sử có username trong req.user

    const allowedCancelStates = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'];
    if (!allowedCancelStates.includes(currentBaoHong.trangThai)) {
        throw new Error(`Không thể hủy công việc (ghi log) từ trạng thái '${currentBaoHong.trangThai}'.`);
    }

    if (!lyDoHuy || lyDoHuy.trim() === '') {
        throw new Error("Vui lòng cung cấp lý do hủy công việc.");
    }

    const cancelledNhanVienId = currentBaoHong.nhanvien_id;
    const statusBeforeCancel = currentBaoHong.trangThai;
    const thongTinThietBiId = currentBaoHong.thongtinthietbi_id;
    const originalReason = lyDoHuy.trim();

    // --- Kiểm tra trạng thái thiết bị ---
    let currentDeviceStatus = null;
    if (thongTinThietBiId) {
        const [deviceRows] = await connection.query("SELECT tinhTrang FROM thongtinthietbi WHERE id = ?", [thongTinThietBiId]);
        if (deviceRows.length > 0) {
            currentDeviceStatus = deviceRows[0].tinhTrang;
            console.log(`[_handleAdminCancelWithLog] ID: ${id} - Linked Device TTTB_ID: ${thongTinThietBiId}, Status: ${currentDeviceStatus}`);
        } else {
            console.warn(`[_handleAdminCancelWithLog] ID: ${id} - Cannot find device with TTTB_ID: ${thongTinThietBiId}`);
        }
    }

    // --- Quyết định trạng thái mới & reset fields ---
    let newStatus = 'Chờ Duyệt';
    let shouldResetFields = true;
    if (currentDeviceStatus === 'dang_bao_hanh') {
        newStatus = 'Chờ Hoàn Tất Bảo Hành'; shouldResetFields = false;
    } else if (currentDeviceStatus === 'da_bao_hanh' || currentDeviceStatus === 'de_xuat_thanh_ly') {
        newStatus = 'Chờ Xem Xét'; shouldResetFields = false;
    }
    const statusAfterUpdate = newStatus;
    console.log(`[_handleAdminCancelWithLog] ID: ${id} - Determined new status: ${newStatus}, Should reset fields: ${shouldResetFields}`);

    await connection.beginTransaction();
    try {
        // 1. Cập nhật baohong
        let queryUpdateBH = `UPDATE baohong SET trangThai = ?, nhanvien_id = NULL, ghiChuAdmin = ? `;
        const adminNote = `Hủy/Thu hồi bởi Admin (${adminUsername || adminId}). Lý do: ${originalReason}`;
        const paramsUpdateBH = [newStatus, adminNote];
        if (shouldResetFields) {
            queryUpdateBH += `, thoiGianXuLy = NULL, ghiChuXuLy = NULL, coLogBaoTri = FALSE `;
        }
        queryUpdateBH += ` WHERE id = ? AND trangThai IN (?)`; // Thêm kiểm tra trạng thái nguồn
        paramsUpdateBH.push(id, allowedCancelStates);

        const [updateResult] = await connection.query(queryUpdateBH, paramsUpdateBH);
        if (updateResult.affectedRows === 0) throw new Error("Không tìm thấy báo hỏng ở trạng thái hợp lệ để hủy (có log).");

        // 2. Insert log
        const queryInsertLog = `INSERT INTO log_huy_congviec (baohong_id, nhanvien_id_bi_huy, admin_id_huy, lyDoHuy, trangThaiTruocKhiHuy) VALUES (?, ?, ?, ?, ?)`;
        const paramsInsertLog = [id, cancelledNhanVienId, adminId, originalReason, statusBeforeCancel];
        const [logResult] = await connection.query(queryInsertLog, paramsInsertLog);
        if (logResult.affectedRows === 0) throw new Error("Lỗi khi ghi nhận lịch sử hủy công việc.");

        await connection.commit();
        console.log(`[_handleAdminCancelWithLog] ID: ${id} - Transaction committed.`);

        // Gửi Socket
        if (cancelledNhanVienId) {
            try {
                emitToUser(cancelledNhanVienId, 'task_cancelled', { baoHongId: parseInt(id), reason: originalReason, statusAfterUpdate: newStatus });
                console.log(`[_handleAdminCancelWithLog] ID: ${id} - Emitted task_cancelled to user ${cancelledNhanVienId}.`);
            } catch (socketError) { console.error(`[_handleAdminCancelWithLog] ID: ${id} - Failed to emit socket:`, socketError); }
        }
        // try { // Thông báo cho các admin khác biết cần gán lại
        //     emitToRole('admin', 'task_needs_reassignment', { baoHongId: parseInt(id), newStatus: newStatus, reason: originalReason });
        //     console.log(`[_handleAdminCancelWithLog] ID: ${id} - Emitted task_needs_reassignment to admins.`);
        // } catch (socketError) { console.error(`[_handleAdminCancelWithLog] ID: ${id} - Failed to emit admin notification:`, socketError); }


        return {
            success: true,
            message: `Đã hủy/thu hồi công việc và ghi log. Trạng thái mới: '${newStatus}'.`,
            id: id,
            statusAfterUpdate: newStatus
        };

    } catch (error) {
        await connection.rollback();
        console.error(`[_handleAdminCancelWithLog] ID: ${id} - Error:`, error);
        throw new Error(error.message || "Lỗi khi hủy công việc (có log).");
    }
}


/**
 * Helper: Xử lý Admin xem xét / duyệt lại / hoàn thành từ các trạng thái cuối/chờ xem xét.
 * Tự quản lý transaction.
 */
async function _handleAdminReviewOrRework(connection, id, updateData, currentBaoHong, currentUser) {
    console.log(`[_handleAdminReviewOrRework] ID: ${id}`);
    const { trangThai, nhanvien_id, ghiChuAdmin, finalDeviceStatus } = updateData;
    const currentStatus = currentBaoHong.trangThai;
    const allowedSourceStates = ['Hoàn Thành', 'Không Thể Hoàn Thành', 'Chờ Xem Xét'];
    const validNextAdminStates = ['Yêu Cầu Làm Lại', 'Đã Duyệt', 'Hoàn Thành']; // Trạng thái đích hợp lệ

    if (!allowedSourceStates.includes(currentStatus)) {
        throw new Error(`Hành động này không hợp lệ từ trạng thái '${currentStatus}'.`);
    }
    if (!trangThai || !validNextAdminStates.includes(trangThai)) {
        throw new Error(`Admin không thể chuyển từ '${currentStatus}' sang '${trangThai}'. Hành động không hợp lệ.`);
    }

    const statusAfterUpdate = trangThai;
    let finalNhanVienId = nhanvien_id !== undefined ? nhanvien_id : currentBaoHong.nhanvien_id; // Giữ NV cũ nếu chỉ chuyển sang Hoàn Thành mà ko gán lại

    // Kiểm tra nếu cần NV mà không có
    if (!finalNhanVienId && (statusAfterUpdate === 'Đã Duyệt' || statusAfterUpdate === 'Yêu Cầu Làm Lại')) {
        throw new Error("Vui lòng chọn nhân viên xử lý khi yêu cầu làm lại hoặc duyệt lại.");
    }
    // Nếu admin hoàn thành, không còn ai được gán
    if (statusAfterUpdate === 'Hoàn Thành') {
        finalNhanVienId = null;
    }

    await connection.beginTransaction();
    try {
        let tttbUpdated = false;
        let newDeviceStatus = null;
        // --- Xử lý cập nhật TTTB NẾU chuyển từ 'Chờ Xem Xét' -> 'Hoàn Thành' ---
        if (currentStatus === 'Chờ Xem Xét' && statusAfterUpdate === 'Hoàn Thành' && currentBaoHong.thongtinthietbi_id) {
            const currentDeviceStatus = currentBaoHong.currentDeviceStatus;
            if (currentDeviceStatus === 'da_bao_hanh') {
                if (!finalDeviceStatus || !['con_bao_hanh', 'het_bao_hanh'].includes(finalDeviceStatus)) throw new Error("Vui lòng chọn trạng thái 'Còn bảo hành' hoặc 'Hết bảo hành' cho thiết bị đã nhận về.");
                newDeviceStatus = finalDeviceStatus;
            } else if (currentDeviceStatus === 'de_xuat_thanh_ly') {
                const validDisposalFinalStates = ['cho_thanh_ly', 'con_bao_hanh', 'het_bao_hanh'];
                if (!finalDeviceStatus || !validDisposalFinalStates.includes(finalDeviceStatus)) throw new Error("Vui lòng chọn 'Chờ thanh lý', 'Còn bảo hành' hoặc 'Hết bảo hành' cho đề xuất thanh lý.");
                newDeviceStatus = finalDeviceStatus;
            }

            // Thực hiện cập nhật TTTB nếu có newDeviceStatus
            if (newDeviceStatus) {
                const [tttbUpdateResult] = await connection.query("UPDATE thongtinthietbi SET tinhTrang = ? WHERE id = ?", [newDeviceStatus, currentBaoHong.thongtinthietbi_id]);
                if (tttbUpdateResult.affectedRows === 0) throw new Error(`Không tìm thấy TTTB ID ${currentBaoHong.thongtinthietbi_id} để cập nhật.`);
                tttbUpdated = true;
                console.log(`[_handleAdminReviewOrRework] ID: ${id} - Updated TTTB ${currentBaoHong.thongtinthietbi_id} to ${newDeviceStatus}.`);
            }
        }
        // --- Kết thúc cập nhật TTTB ---

        // --- Cập nhật Báo hỏng ---
        let queryAdminAction = "UPDATE baohong SET trangThai = ?, nhanvien_id = ?, ghiChuAdmin = ?";
        let paramsAdminAction = [statusAfterUpdate, finalNhanVienId, ghiChuAdmin || null];
        if (statusAfterUpdate === 'Yêu Cầu Làm Lại' || statusAfterUpdate === 'Đã Duyệt') {
            queryAdminAction += ", thoiGianXuLy = NULL, coLogBaoTri = FALSE, ghiChuXuLy = NULL";
        } else if (statusAfterUpdate === 'Hoàn Thành') {
            queryAdminAction += ", thoiGianXuLy = NOW()";
        }
        queryAdminAction += " WHERE id = ? AND trangThai = ?"; // Thêm trạng thái nguồn vào điều kiện
        paramsAdminAction.push(id, currentStatus);

        const [adminActionResult] = await connection.query(queryAdminAction, paramsAdminAction);
        console.log(`[_handleAdminReviewOrRework] ID: ${id} - Rows Affected: ${adminActionResult.affectedRows}`);
        if (adminActionResult.affectedRows === 0) {
            throw new Error(`Không tìm thấy báo hỏng ở trạng thái '${currentStatus}' để xử lý.`);
        }

        await connection.commit();
        console.log(`[_handleAdminReviewOrRework] ID: ${id} - Transaction committed.`);

        // Gửi Socket
        if ((statusAfterUpdate === 'Yêu Cầu Làm Lại' || statusAfterUpdate === 'Đã Duyệt') && finalNhanVienId) {
            try {
                const eventName = statusAfterUpdate === 'Yêu Cầu Làm Lại' ? 'task_rework_request' : 'new_task_assigned';
                emitToUser(finalNhanVienId, eventName, { baoHongId: parseInt(id), reason: ghiChuAdmin || null, statusAfterUpdate });
                console.log(`[_handleAdminReviewOrRework] ID: ${id} - Emitted ${eventName} to user ${finalNhanVienId}.`);
            } catch (socketError) { console.error(`[_handleAdminReviewOrRework] ID: ${id} - Failed to emit socket:`, socketError); }
        }

        return {
            success: true,
            message: `Đã cập nhật trạng thái thành '${statusAfterUpdate}'.` + (tttbUpdated ? ` Trạng thái thiết bị: '${newDeviceStatus}'.` : ''),
            id: id,
            statusAfterUpdate: statusAfterUpdate,
            ...(tttbUpdated && { finalDeviceStatus: newDeviceStatus })
        };

    } catch (error) {
        await connection.rollback();
        console.error(`[_handleAdminReviewOrRework] ID: ${id} - Error:`, error);
        throw new Error(error.message || "Lỗi khi admin xử lý công việc.");
    }
}


/**
 * Helper: Xử lý Nhân viên cập nhật trạng thái.
 * Tự quản lý transaction.
 */
async function _handleTechnicianUpdateStatus(connection, id, updateData, currentBaoHong, currentUser) {
    console.log(`[_handleTechnicianUpdateStatus] ID: ${id}`);
    const { trangThai, ghiChuXuLy } = updateData;
    const allowedSourceStates = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại']; // Trạng thái NV có thể bắt đầu/tiếp tục từ đó
    const allowedTargetStates = ['Đang Tiến Hành', 'Không Thể Hoàn Thành', 'Chờ Xem Xét']; // Trạng thái NV có thể chuyển đến (trừ Hoàn Thành)

    if (!trangThai) throw new Error("Thiếu thông tin trạng thái cần cập nhật.");
    if (!allowedTargetStates.includes(trangThai)) throw new Error(`Nhân viên không được phép đặt trạng thái thành '${trangThai}'.`);
    if (!allowedSourceStates.includes(currentBaoHong.trangThai)) throw new Error(`Không thể cập nhật từ trạng thái hiện tại '${currentBaoHong.trangThai}'.`);

    // Nếu NV cố gắng hoàn thành, gọi helper riêng
    if (trangThai === 'Hoàn Thành') {
        console.log(`[_handleTechnicianUpdateStatus] ID: ${id} - Redirecting to _handleTechnicianTryComplete.`);
        return await _handleTechnicianTryComplete(connection, id, updateData, currentBaoHong, currentUser);
    }

    const statusAfterUpdate = trangThai;
    let query = "UPDATE baohong SET trangThai = ?";
    const params = [statusAfterUpdate];

    if (ghiChuXuLy !== undefined) { query += ", ghiChuXuLy = ?"; params.push(ghiChuXuLy || null); }

    if (statusAfterUpdate === 'Không Thể Hoàn Thành') {
        query += ", thoiGianXuLy = NOW()";
    } else if (statusAfterUpdate === 'Đang Tiến Hành') {
        if (currentBaoHong.trangThai === 'Yêu Cầu Làm Lại' || currentBaoHong.trangThai === 'Đã Duyệt') {
            query += ", coLogBaoTri = FALSE, ghiChuXuLy = NULL, ghiChuAdmin = NULL"; // Reset khi bắt đầu/làm lại
        }
    } else if (statusAfterUpdate === 'Chờ Xem Xét') {
        if (currentBaoHong.trangThai !== 'Đang Tiến Hành') throw new Error("Chỉ có thể chuyển sang 'Chờ Xem Xét' từ trạng thái 'Đang Tiến Hành'.");
        if (!currentBaoHong.coLogBaoTri) throw new Error("Cần ghi log bảo trì trước khi gửi yêu cầu xem xét.");
        query += ", thoiGianXuLy = NOW()";
    }

    query += " WHERE id = ? AND trangThai = ?"; // Thêm trạng thái nguồn
    params.push(id, currentBaoHong.trangThai);

    await connection.beginTransaction();
    try {
        console.log(`[_handleTechnicianUpdateStatus] ID: ${id} - Executing SQL: ${query} with params:`, params);
        const [result] = await connection.query(query, params);
        console.log(`[_handleTechnicianUpdateStatus] ID: ${id} - Rows Affected: ${result.affectedRows}`);
        if (result.affectedRows === 0) throw new Error(`Không tìm thấy báo hỏng ở trạng thái '${currentBaoHong.trangThai}' để cập nhật.`);

        await connection.commit();
        console.log(`[_handleTechnicianUpdateStatus] ID: ${id} - Transaction committed.`);

        // Gửi Socket thông báo cho Admin
        if (['Chờ Xem Xét', 'Không Thể Hoàn Thành'].includes(statusAfterUpdate)) {
            try {
                const eventName = statusAfterUpdate === 'Chờ Xem Xét' ? 'task_needs_review' : 'task_cannot_complete';
                // emitToRole('admin', eventName, { baoHongId: parseInt(id), statusAfterUpdate });
                console.log(`[_handleTechnicianUpdateStatus] ID: ${id} - Emitted ${eventName} to admins.`);
            } catch (socketError) { console.error(`[_handleTechnicianUpdateStatus] ID: ${id} - Failed to emit socket:`, socketError); }
        }

        return {
            success: true,
            message: "Cập nhật trạng thái công việc thành công!",
            id: id,
            statusAfterUpdate: statusAfterUpdate
        };
    } catch (error) {
        await connection.rollback();
        console.error(`[_handleTechnicianUpdateStatus] ID: ${id} - Error:`, error);
        throw new Error(error.message || "Lỗi khi nhân viên cập nhật trạng thái.");
    }
}


/**
 * Helper: Xử lý riêng logic khi Nhân viên cố gắng Hoàn Thành công việc.
 * Tự quản lý transaction.
 */
async function _handleTechnicianTryComplete(connection, id, updateData, currentBaoHong, currentUser) {
    console.log(`[_handleTechnicianTryComplete] ID: ${id}`);
    const { ghiChuXuLy } = updateData;
    const statusAfterUpdate = 'Hoàn Thành';

    if (currentBaoHong.trangThai !== 'Đang Tiến Hành' && currentBaoHong.trangThai !== 'Yêu Cầu Làm Lại') {
        throw new Error("Chỉ có thể hoàn thành khi công việc đang 'Đang Tiến Hành' hoặc 'Yêu Cầu Làm Lại'.");
    }
    if (currentBaoHong.trangThai === 'Đang Tiến Hành' && !currentBaoHong.coLogBaoTri) {
        throw new Error("Cần ghi log bảo trì trước khi hoàn thành công việc.");
    }

    // Kiểm tra trạng thái thiết bị liên quan
    if (currentBaoHong.thongtinthietbi_id) {
        const [tttbRows] = await connection.query("SELECT tinhTrang FROM thongtinthietbi WHERE id = ?", [currentBaoHong.thongtinthietbi_id]);
        if (tttbRows.length > 0) {
            const deviceStatus = tttbRows[0].tinhTrang;
            const restrictedDeviceStates = ['dang_bao_hanh', 'de_xuat_thanh_ly', 'da_bao_hanh', 'cho_thanh_ly'];
            if (restrictedDeviceStates.includes(deviceStatus)) {
                throw new Error(`Không thể hoàn thành trực tiếp khi thiết bị đang ở trạng thái '${deviceStatus}'. Vui lòng chuyển sang 'Chờ Xem Xét'.`);
            }
        }
    }

    // Kiểm tra log cuối cùng (chỉ nếu có log)
    if (currentBaoHong.coLogBaoTri) {
        const [lastLog] = await connection.query("SELECT ketQuaXuLy FROM baotri WHERE baohong_id = ? ORDER BY thoiGian DESC LIMIT 1", [id]);
        const restrictedLogResults = ['Đã gửi bảo hành', 'Đề xuất thanh lý', 'Bàn giao cho bộ phận khác'];
        if (lastLog.length > 0 && restrictedLogResults.includes(lastLog[0].ketQuaXuLy)) {
            throw new Error(`Không thể hoàn thành trực tiếp vì kết quả xử lý cuối cùng là '${lastLog[0].ketQuaXuLy}'. Vui lòng chuyển sang 'Chờ Xem Xét'.`);
        }
    }

    await connection.beginTransaction();
    try {
        let queryComplete = "UPDATE baohong SET trangThai = ?, thoiGianXuLy = NOW()";
        const paramsComplete = [statusAfterUpdate];
        if (ghiChuXuLy !== undefined) { queryComplete += ", ghiChuXuLy = ?"; paramsComplete.push(ghiChuXuLy || null); }
        queryComplete += " WHERE id = ? AND trangThai IN (?)"; // Thêm trạng thái nguồn
        paramsComplete.push(id, ['Đang Tiến Hành', 'Yêu Cầu Làm Lại']);

        const [completeResult] = await connection.query(queryComplete, paramsComplete);
        console.log(`[_handleTechnicianTryComplete] ID: ${id} - Rows Affected: ${completeResult.affectedRows}`);
        if (completeResult.affectedRows === 0) {
            throw new Error(`Không tìm thấy báo hỏng ở trạng thái 'Đang Tiến Hành' hoặc 'Yêu Cầu Làm Lại' để hoàn thành.`);
        }

        await connection.commit();
        console.log(`[_handleTechnicianTryComplete] ID: ${id} - Transaction committed.`);

        // Thông báo cho Admin
        try {
            // emitToRole('admin', 'task_completed_by_tech', { baoHongId: parseInt(id), statusAfterUpdate });
            console.log(`[_handleTechnicianTryComplete] ID: ${id} - Emitted task_completed_by_tech to admins.`);
        } catch (socketError) { console.error(`[_handleTechnicianTryComplete] ID: ${id} - Failed to emit socket:`, socketError); }

        return {
            success: true,
            message: "Đã hoàn thành công việc!",
            id: id,
            statusAfterUpdate: statusAfterUpdate
        };
    } catch (error) {
        await connection.rollback();
        console.error(`[_handleTechnicianTryComplete] ID: ${id} - Error:`, error);
        throw new Error(error.message || "Lỗi khi hoàn thành công việc.");
    }
}

// ==================================
//       Hàm Controller Chính
// ==================================

// --- postGuiBaoHong ---
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
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const insertResults = [];
        const skippedDevices = []; // Lưu trữ MDD của thiết bị bị bỏ qua do trùng

        if (devices.length === 0 && loaithiethai !== 'Các Loại Thiết Bị') { // Cho phép báo hỏng Hạ Tầng/Khác không cần device
            // Báo hỏng chung cho phòng
            const [result] = await connection.query(`
                INSERT INTO baohong (phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);
            insertResults.push(result); // Lưu kết quả
        } else if (devices.length > 0 && loaithiethai === 'Các Loại Thiết Bị') {
            // Báo hỏng cho từng thiết bị
            for (const device of devices) {
                const { thongtinthietbi_id } = device;
                if (!thongtinthietbi_id) {
                    console.warn("Bỏ qua thiết bị không có thongtinthietbi_id:", device);
                    continue;
                }

                const [tttbInfo] = await connection.query("SELECT thietbi_id FROM thongtinthietbi WHERE id = ?", [thongtinthietbi_id]);
                const thietbi_id_from_tttb = tttbInfo.length > 0 ? tttbInfo[0].thietbi_id : null;

                // Kiểm tra trùng lặp báo hỏng chưa hoàn thành
                const [existingPending] = await connection.query(
                    `SELECT id FROM baohong WHERE thongtinthietbi_id = ? AND trangThai NOT IN ('Hoàn Thành', 'Không Thể Hoàn Thành', 'Đã Hủy')`, // Thêm các trạng thái kết thúc khác nếu có
                    [thongtinthietbi_id]
                );
                if (existingPending.length > 0) {
                    console.warn(`Thiết bị (MDD: ${thongtinthietbi_id}) đã được báo hỏng và đang chờ xử lý. Bỏ qua báo hỏng trùng.`);
                    skippedDevices.push(thongtinthietbi_id); // Thêm vào danh sách bỏ qua
                    continue;
                }

                const [result] = await connection.query(`
                     INSERT INTO baohong (thietbi_id, thongtinthietbi_id, phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                 `, [thietbi_id_from_tttb, thongtinthietbi_id, phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);
                insertResults.push(result);
            }
        } else {
            throw new Error("Thông tin báo hỏng không hợp lệ.");
        }

        if (insertResults.length === 0 && skippedDevices.length === devices.length) {
            // Nếu tất cả thiết bị đều bị bỏ qua
            throw new Error("Tất cả thiết bị bạn chọn đã được báo hỏng và đang chờ xử lý.");
        } else if (insertResults.length === 0) {
            // Nếu không có gì được insert vì lý do khác
            throw new Error("Không có báo hỏng nào được tạo. Vui lòng kiểm tra lại thông tin.");
        }


        await connection.commit();
        console.log("Báo hỏng đã được tạo thành công. Số lượng:", insertResults.length);

        // Gửi socket sau khi commit thành công
        try {
            for (const result of insertResults) {
                const insertedId = result.insertId;
            }
        } catch (socketError) { console.error("Lỗi khi gửi socket event sau khi tạo báo hỏng:", socketError); }

        // Tạo thông báo kết quả
        let message = `Gửi ${insertResults.length} báo hỏng thành công!`;
        if (skippedDevices.length > 0) {
            message += ` Đã bỏ qua ${skippedDevices.length} thiết bị đã được báo hỏng trước đó (MDD: ${skippedDevices.join(', ')}).`;
        }
        res.status(201).json({ message: message });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Lỗi khi lưu báo hỏng:", error);
        res.status(error.message.includes("Tất cả thiết bị") ? 409 : 500)
            .json({ error: error.message || "Không thể lưu báo hỏng." });
    } finally {
        if (connection) connection.release();
    }
};


// --- getThongTinBaoHong (Cập nhật logic gợi ý NV) ---
exports.getThongTinBaoHong = async (req, res) => {
    try {
        // Query để lấy thông tin báo hỏng và gợi ý NV
        const query = `
           SELECT
               bh.*,
               p.toa, p.tang, p.soPhong,
               CONCAT(p.toa, p.tang, '.', p.soPhong) AS phong_name,
               tttb.thietbi_id, tttb.tinhTrang, tb.tenThietBi,
               u_assigned.hoTen AS tenNhanVienDaGan,
               latest_log.phuongAnXuLy AS phuongAnXuLyCuoiCung,
               -- Gợi ý NV: Ưu tiên cố định -> Lịch trực HIỆN TẠI -> Lịch trực gần nhất (nếu không có ai đang trực)
               CASE
                   WHEN bh.trangThai = 'Chờ Duyệt' THEN COALESCE(
                       fixed_assign.nhanvien_id,
                       current_shift_assign.nhanvien_id
                       -- Có thể thêm gợi ý từ lịch trực gần nhất nếu muốn
                       -- , nearest_shift_assign.nhanvien_id
                   )
                   ELSE NULL
               END AS suggested_nhanvien_id,
               CASE
                   WHEN bh.trangThai = 'Chờ Duyệt' THEN COALESCE(
                       fixed_assign.hoTen,
                       current_shift_assign.hoTen
                       -- , nearest_shift_assign.hoTen
                   )
                   ELSE NULL
               END AS suggested_nhanvien_name
           FROM baohong bh
           LEFT JOIN phong p ON bh.phong_id = p.id
           LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
           LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
           LEFT JOIN users u_assigned ON bh.nhanvien_id = u_assigned.id AND u_assigned.role = 'nhanvien'
           LEFT JOIN (
               SELECT bt.baohong_id, bt.phuongAnXuLy, ROW_NUMBER() OVER(PARTITION BY bt.baohong_id ORDER BY bt.thoiGian DESC) as rn FROM baotri bt
           ) AS latest_log ON bh.id = latest_log.baohong_id AND latest_log.rn = 1
           -- Gợi ý NV cố định (Ưu tiên 1)
           LEFT JOIN (
               SELECT npp.phong_id, npp.nhanvien_id, u.hoTen
               FROM nhanvien_phong_phutrach npp
               JOIN users u ON npp.nhanvien_id = u.id AND u.tinhTrang = 'on' AND u.role = 'nhanvien'
           ) AS fixed_assign ON bh.phong_id = fixed_assign.phong_id AND bh.trangThai = 'Chờ Duyệt'
            -- Gợi ý NV theo lịch trực HIỆN TẠI (Ưu tiên 2)
           LEFT JOIN (
                SELECT lt.nhanvien_id, u.hoTen
                FROM lichtruc lt
                JOIN users u ON lt.nhanvien_id = u.id AND u.tinhTrang = 'on' AND u.role = 'nhanvien'
                WHERE NOW() BETWEEN lt.start_time AND lt.end_time -- Lấy ca đang diễn ra
                -- Có thể thêm điều kiện lt.phong_id = bh.phong_id nếu lịch trực theo phòng
                ORDER BY lt.start_time DESC -- Nếu có nhiều người trùng ca, lấy người mới nhất?
                LIMIT 1 -- Chỉ lấy 1 người nếu có nhiều
           ) AS current_shift_assign ON bh.trangThai = 'Chờ Duyệt' AND fixed_assign.nhanvien_id IS NULL
           -- Gợi ý NV theo lịch trực GẦN NHẤT (Ưu tiên 3, nếu không có ai đang trực)
           LEFT JOIN (
                SELECT lt.nhanvien_id, u.hoTen
                FROM lichtruc lt
                JOIN users u ON lt.nhanvien_id = u.id AND u.tinhTrang = 'on' AND u.role = 'nhanvien'
                WHERE lt.end_time <= NOW() -- Lấy ca đã kết thúc
                ORDER BY lt.end_time DESC -- Lấy ca gần nhất
                LIMIT 1
            ) AS nearest_shift_assign ON bh.trangThai = 'Chờ Duyệt' AND fixed_assign.nhanvien_id IS NULL AND current_shift_assign.nhanvien_id IS NULL
           ORDER BY FIELD(bh.trangThai, 'Yêu Cầu Làm Lại', 'Chờ Duyệt', 'Chờ Xem Xét', 'Chờ Hoàn Tất Bảo Hành', 'Đã Duyệt', 'Đang Tiến Hành', 'Hoàn Thành', 'Không Thể Hoàn Thành', 'Đã Hủy'), bh.ngayBaoHong DESC;
       `;

        const [baoHongRows] = await pool.query(query);

        const baoHongData = baoHongRows.map(item => ({
            ...item,
            coLogBaoTri: Boolean(item.coLogBaoTri),
            phong_name: item.phong_name || `Phòng ID:${item.phong_id}`,
            tenNhanVienXuLy: item.tenNhanVienDaGan,
            phuongAnXuLy: item.phuongAnXuLyCuoiCung
        }));

        res.status(200).json(baoHongData);

    } catch (error) {
        console.error("Lỗi khi lấy thông tin báo hỏng:", error);
        res.status(500).json({ error: "Không thể lấy thông tin báo hỏng." });
    }
};


// --- updateBaoHong (Dispatcher) ---
exports.updateBaoHong = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const currentUser = req.user;
    let connection = null;

    console.log(`[updateBaoHong] ID: ${id} - Request by User ID: ${currentUser?.id}, Role: ${currentUser?.role}. Body:`, JSON.stringify(updateData));

    try {
        connection = await pool.getConnection();

        // --- Lấy thông tin báo hỏng hiện tại ---
        const [currentBaoHongRows] = await connection.query(
            `SELECT bh.*, tttb.tinhTrang as currentDeviceStatus FROM baohong bh LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id WHERE bh.id = ? FOR UPDATE`, // Thêm FOR UPDATE nếu cần khóa dòng
            [id]
        );
        if (currentBaoHongRows.length === 0) return res.status(404).json({ error: "Báo hỏng không tồn tại." });
        const currentBaoHong = currentBaoHongRows[0];
        console.log(`[updateBaoHong] ID: ${id} - Current Status: ${currentBaoHong.trangThai}, Assigned NV: ${currentBaoHong.nhanvien_id}`);

        // --- Kiểm tra quyền của nhân viên ---
        if (currentUser?.role === 'nhanvien' && currentBaoHong.nhanvien_id !== currentUser.id) {
            // Có thể thêm logic cho phép NV nhận việc ở đây nếu cần
            console.log(`[updateBaoHong] ID: ${id}, Forbidden: NV ${currentUser.id} không được gán.`);
            return res.status(403).json({ error: "Bạn không được giao xử lý báo hỏng này." });
        }

        // --- Dispatcher Logic ---
        let result;
        const action = updateData.action;
        const targetStatus = updateData.trangThai; // Trạng thái đích (nếu có)
        const currentStatus = currentBaoHong.trangThai;

        // Ưu tiên xử lý action trước
        if (currentUser?.role === 'admin' && action === 'cancel_with_log') {
            result = await _handleAdminCancelWithLog(connection, id, updateData, currentBaoHong, currentUser);
        }
        // Xử lý dựa trên vai trò và trạng thái
        else if (currentUser?.role === 'admin') {
            if (currentStatus === 'Chờ Duyệt' && targetStatus === 'Đã Duyệt') {
                result = await _handleAdminInitialApproval(connection, id, updateData, currentBaoHong, currentUser);
            } else if (['Hoàn Thành', 'Không Thể Hoàn Thành', 'Chờ Xem Xét'].includes(currentStatus)) {
                // Check if targetStatus is valid for review/rework
                if (targetStatus && ['Yêu Cầu Làm Lại', 'Đã Duyệt', 'Hoàn Thành'].includes(targetStatus)) {
                    result = await _handleAdminReviewOrRework(connection, id, updateData, currentBaoHong, currentUser);
                } else {
                    throw new Error(`Hành động không hợp lệ hoặc thiếu trạng thái đích từ '${currentStatus}'.`);
                }
            } else {
                throw new Error(`Admin không thể thực hiện hành động này từ trạng thái '${currentStatus}' với dữ liệu được cung cấp.`);
            }
        } else if (currentUser?.role === 'nhanvien') {
            if (targetStatus) { // Phải có trạng thái đích từ NV
                // Gọi helper chung, helper này sẽ tự phân loại tiếp (TryComplete hoặc UpdateStatus)
                result = await _handleTechnicianUpdateStatus(connection, id, updateData, currentBaoHong, currentUser);
            } else {
                throw new Error("Nhân viên cần cung cấp trạng thái mới để cập nhật.");
            }
        } else {
            throw new Error("Vai trò không hợp lệ hoặc thiếu thông tin hành động.");
        }

        // --- Gửi Response ---
        return res.status(200).json(result);

    } catch (error) {
        // Helper đã rollback nếu có lỗi trong transaction của nó
        console.error(`[updateBaoHong] ID: ${id} - Error in main handler:`, error);
        const statusCode = error.message.includes("Vui lòng") ? 400 :
            error.message.includes("Không tìm thấy") ? 404 :
                error.message.includes("không được phép") || error.message.includes("không được giao xử lý") ? 403 :
                    error.message.includes("Không thể") ? 400 : // Bad request do logic nghiệp vụ
                        500;
        return res.status(statusCode).json({ error: error.message || "Lỗi máy chủ khi cập nhật báo hỏng." });
    } finally {
        if (connection) {
            try { await connection.release(); } catch (relError) { console.error("Error releasing connection:", relError); }
            console.log(`[updateBaoHong] ID: ${id} - Connection released.`);
        }
    }
};

// --- uploadBaoHongImage, getAssignedBaoHong, deleteBaoHong giữ nguyên như phiên bản trước ---
exports.uploadBaoHongImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Không có file nào được tải lên.' });
    }
    res.json({ imageUrl: req.file.path });
};

exports.getAssignedBaoHong = async (req, res) => {
    const nhanvien_id = req.user?.id;
    const requestedStatusesQuery = req.query.statuses;
    let requestedStatuses = null;
    if (requestedStatusesQuery) {
        requestedStatuses = requestedStatusesQuery.split(',').map(s => s.trim()).filter(s => s);
    }

    if (!nhanvien_id) {
        return res.status(401).json({ error: "Không thể xác định nhân viên." });
    }
    try {
        let sqlQuery = `
            SELECT
                bh.*,
                p.toa, p.tang, p.soPhong,
                CONCAT(p.toa, p.tang, '.', p.soPhong) AS phong_name,
                tttb.thietbi_id,
                tb.tenThietBi,
                tttb.tinhTrang AS tinhTrangThietBi
            FROM baohong bh
            LEFT JOIN phong p ON bh.phong_id = p.id
            LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
            LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
            WHERE bh.nhanvien_id = ?
        `;
        const queryParams = [nhanvien_id];
        let statusesToFilter;

        if (requestedStatuses && requestedStatuses.length > 0) {
            statusesToFilter = requestedStatuses;
        } else {
            statusesToFilter = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'];
        }

        if (statusesToFilter && statusesToFilter.length > 0) {
            sqlQuery += ` AND bh.trangThai IN (?)`;
            queryParams.push(statusesToFilter);
        } else {
            console.warn("Không có trạng thái hợp lệ để lọc cho nhân viên ID:", nhanvien_id);
            return res.status(200).json([]);
        }

        sqlQuery += ` ORDER BY FIELD(bh.trangThai,'Yêu Cầu Làm Lại','Đã Duyệt','Đang Tiến Hành','Chờ Hoàn Tất Bảo Hành','Chờ Xem Xét'), bh.ngayBaoHong DESC; `;
        const [assignedRows] = await pool.query(sqlQuery, queryParams);

        const assignedData = assignedRows.map(item => ({
            id: item.id,
            phong_id: item.phong_id,
            thongtinthietbi_id: item.thongtinthietbi_id,
            moTa: item.moTa,
            ngayBaoHong: item.ngayBaoHong,
            thoiGianXuLy: item.thoiGianXuLy,
            thiethai: item.thiethai,
            loaithiethai: item.loaithiethai,
            trangThai: item.trangThai,
            nhanvien_id: item.nhanvien_id,
            ghiChuAdmin: item.ghiChuAdmin,
            ghiChuXuLy: item.ghiChuXuLy,
            hinhAnh: item.hinhAnh,
            coLogBaoTri: Boolean(item.coLogBaoTri),
            phong_name: item.phong_name || (item.phong_id ? `Phòng ID:${item.phong_id}` : 'N/A'),
            tenThietBi: item.tenThietBi || (item.thongtinthietbi_id ? `Thiết bị ID:${item.thongtinthietbi_id}` : 'Không có TB'),
            tinhTrangThietBi: item.tinhTrangThietBi
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

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        await connection.query("DELETE FROM baotri WHERE baohong_id = ?", [id]);
        await connection.query("DELETE FROM log_huy_congviec WHERE baohong_id = ?", [id]);
        const [result] = await connection.query("DELETE FROM baohong WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Không tìm thấy báo hỏng để xóa." });
        }

        await connection.commit();
        res.status(200).json({ message: "Xóa báo hỏng và các log liên quan thành công!", id: parseInt(id) });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Lỗi khi xóa báo hỏng:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Không thể xóa báo hỏng này vì còn dữ liệu liên quan ở bảng khác." });
        }
        res.status(500).json({ error: "Lỗi máy chủ khi xóa báo hỏng." });
    } finally {
        if (connection) connection.release();
    }
};
