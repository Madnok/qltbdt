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
            else if (currentDeviceStatus === 'con_bao_hanh' || currentDeviceStatus === 'het_bao_hanh') {
                if (!finalDeviceStatus || !['con_bao_hanh', 'het_bao_hanh'].includes(finalDeviceStatus)) {

                    throw new Error("Vui lòng chọn lại trạng thái 'Còn bảo hành' hoặc 'Hết bảo hành' để xác nhận.");
                }
                newDeviceStatus = finalDeviceStatus; // Gán trạng thái được chọn
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
        if (insertResults.length > 0) {
            try {
                // 1. Lấy ID của tất cả admin đang hoạt động
                const [adminUsers] = await connection.query( // Dùng lại connection từ transaction
                    "SELECT id FROM users WHERE role = 'admin' AND tinhTrang = 'on'"
                );

                if (adminUsers.length > 0) {
                    const firstInsertedId = insertResults[0].insertId;
                    const eventData = {
                        message: `Có ${insertResults.length} báo hỏng mới được tạo.`,
                        firstId: firstInsertedId,
                        count: insertResults.length
                    };

                    console.log(`[postGuiBaoHong] Found ${adminUsers.length} active admins. Emitting 'new_baohong_created' to each...`);

                    // 2. Lặp qua từng admin và gửi sự kiện
                    for (const admin of adminUsers) {
                        emitToUser(admin.id, 'new_baohong_created', eventData);
                    }
                    console.log(`[postGuiBaoHong] Finished emitting to admins.`);
                } else {
                    console.log("[postGuiBaoHong] No active admin users found to notify.");
                }

            } catch (socketOrDbError) {
                console.error("Lỗi khi lấy danh sách admin hoặc gửi socket event:", socketOrDbError);
            }
        }
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
    const adminUserId = req.user?.id || null; // Sử dụng null nếu req.user.id không tồn tại

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: "ID báo hỏng không hợp lệ." });
    }

    // Log xem adminUserId có được lấy không
    if (!adminUserId) {
        console.warn(`[deleteBaoHong] Không thể xác định ID admin thực hiện xóa báo hỏng ID: ${id}.`);
    } else {
        console.log(`[deleteBaoHong] Admin ID ${adminUserId} yêu cầu xóa báo hỏng ID: ${id}`);
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        console.log(`[deleteBaoHong ID ${id}] Bắt đầu transaction.`);

        // --- Bước 1: Lấy thông tin báo hỏng cần xóa ---
        const [baoHongRows] = await connection.query("SELECT * FROM baohong WHERE id = ?", [id]);
        if (baoHongRows.length === 0) {
            console.log(`[deleteBaoHong ID ${id}] Báo hỏng không tồn tại.`);
            await connection.rollback();
            return res.status(404).json({ message: "Không tìm thấy báo hỏng để xóa." });
        }
        const baoHongToDelete = baoHongRows[0];
        console.log(`[deleteBaoHong ID ${id}] Tìm thấy báo hỏng:`, JSON.stringify(baoHongToDelete));

        // --- Bước 2: Kiểm tra coLogBaoTri và tạo log nếu cần ---
        if (baoHongToDelete.coLogBaoTri === 1) { // Sử dụng so sánh lỏng lẻo hoặc chặt (== hoặc ===) tùy kiểu dữ liệu tinyint
            console.log(`[deleteBaoHong ID ${id}] Cờ coLogBaoTri = 1. Tiến hành tạo log bảo trì lưu trữ.`);

            // Chuẩn bị dữ liệu cho bản ghi baotri mới
            const userIdForLog = adminUserId ? `Admin ID ${adminUserId}` : 'Người dùng không xác định';
            const hoatDongLog = `Lưu trữ log từ báo hỏng ID ${id} (Trạng thái cuối: ${baoHongToDelete.trangThai}) đã bị xóa bởi ${userIdForLog}. Mô tả gốc: ${baoHongToDelete.moTa || 'Không có'}. Ghi chú xử lý cuối: ${baoHongToDelete.ghiChuXuLy || 'Không có'}. Ghi chú Admin cuối: ${baoHongToDelete.ghiChuAdmin || 'Không có'}.`;
            let ketQuaXuLyLog = 'Không cần xử lý';
            if (baoHongToDelete.trangThai === 'Hoàn Thành') ketQuaXuLyLog = 'Đã sửa chữa xong';
            else if (baoHongToDelete.trangThai === 'Không Thể Hoàn Thành') ketQuaXuLyLog = 'Đề xuất thanh lý';

            const baoTriLogData = {
                baohong_id: id,
                nhanvien_id: adminUserId,
                thongtinthietbi_id: baoHongToDelete.thongtinthietbi_id,
                phong_id: baoHongToDelete.phong_id,
                hoatdong: hoatDongLog,
                ketQuaXuLy: ketQuaXuLyLog,
                phuongAnXuLy: 'Khác',
                phuongAnKhacChiTiet: 'Log lưu trữ tự động khi xóa báo hỏng.',
                suDungVatTu: 0,
                ghiChuVatTu: null,
                chiPhi: null,
                hinhAnhHoaDonUrls: null,
                ngayDuKienTra: null,
            };

            const [insertLogResult] = await connection.query("INSERT INTO baotri SET ?", baoTriLogData);
            console.log(`[deleteBaoHong ID ${id}] Đã tạo log bảo trì lưu trữ ID: ${insertLogResult.insertId} với nhanvien_id: ${adminUserId}`);

        } else {
            console.log(`[deleteBaoHong ID ${id}] Cờ coLogBaoTri = 0. Bỏ qua việc tạo log bảo trì lưu trữ.`);
        }

        // --- Bước 3: Xóa các log phụ (TÙY CHỌN) ---
        const [deleteLogHuyResult] = await connection.query("DELETE FROM log_huy_congviec WHERE baohong_id = ?", [id]);
        if (deleteLogHuyResult.affectedRows > 0) {
            console.log(`[deleteBaoHong ID ${id}] Đã xóa ${deleteLogHuyResult.affectedRows} bản ghi log_huy_congviec.`);
        }

        // --- Bước 4: Xóa báo hỏng chính ---
        console.log(`[deleteBaoHong ID ${id}] Tiến hành xóa bản ghi khỏi bảng baohong.`);
        const [deleteBaoHongResult] = await connection.query("DELETE FROM baohong WHERE id = ?", [id]);

        if (deleteBaoHongResult.affectedRows === 0) {
            console.error(`[deleteBaoHong ID ${id}] Lỗi: Không thể xóa báo hỏng (affectedRows = 0). Rollback.`);
            await connection.rollback();
            return res.status(404).json({ message: "Không tìm thấy báo hỏng để xóa (lỗi sau khi kiểm tra)." });
        }

        // --- Bước 5: Commit transaction ---
        await connection.commit();
        console.log(`[deleteBaoHong ID ${id}] Đã commit transaction. Xóa thành công.`);
        res.status(200).json({ message: "Xóa báo hỏng thành công!", id: parseInt(id) });

    } catch (error) {
        if (connection) {
            console.error(`[deleteBaoHong ID ${id}] Gặp lỗi, rollback transaction:`, error);
            await connection.rollback();
        } else {
            console.error(`[deleteBaoHong ID ${id}] Gặp lỗi và không có kết nối để rollback:`, error);
        }

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: "Không thể xóa báo hỏng này vì còn dữ liệu tham chiếu ở bảng khác." });
        }
        res.status(500).json({ message: "Lỗi máy chủ khi xóa báo hỏng." });
    } finally {
        if (connection) {
            console.log(`[deleteBaoHong ID ${id}] Giải phóng kết nối.`);
            connection.release();
        }
    }
};