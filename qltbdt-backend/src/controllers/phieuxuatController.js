const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");


// Lấy danh sách thiết bị đủ điều kiện xuất kho
exports.getEligibleDevicesForExport = async (req, res) => {
    try {
        const query = `
            SELECT
                tttb.id,
                tttb.ngayMua,
                tttb.tinhTrang,
                tb.tenThietBi,
                tl.theLoai,
                tttb.giaTriBanDau
            FROM thongtinthietbi tttb
            JOIN thietbi tb ON tttb.thietbi_id = tb.id
            LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            WHERE
                tttb.phong_id IS NULL
                AND tttb.tinhTrang IN ('con_bao_hanh', 'het_bao_hanh', 'cho_thanh_ly')
            ORDER BY
                FIELD(tttb.tinhTrang, 'cho_thanh_ly', 'het_bao_hanh', 'con_bao_hanh'),
                tb.tenThietBi
        `;
        const [devices] = await pool.query(query);
        res.status(200).json(devices);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thiết bị đủ điều kiện xuất kho:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy dữ liệu thiết bị." });
    }
};

// Lấy danh sách tất cả phiếu xuất (để hiển thị trong trang Nhập Xuất)
exports.getAllPhieuXuat = async (req, res) => {
    try {
        const query = `
            SELECT
                px.id, px.ngayXuat, px.lyDoXuat, px.ghiChu, px.giaTriThanhLy,
                u.hoTen AS tenNguoiThucHien, COUNT(pxc.id) AS soLuongThietBi
            FROM phieuxuat px
            JOIN users u ON px.nguoiThucHien_id = u.id
            LEFT JOIN phieuxuat_chitiet pxc ON px.id = pxc.phieuxuat_id
            GROUP BY px.id ORDER BY px.ngayXuat DESC;
        `;
        const [phieuXuatList] = await pool.query(query);
        res.status(200).json(phieuXuatList);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách phiếu xuất:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách phiếu xuất." });
    }
};

exports.getPhieuXuatDetails = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Thiếu ID phiếu xuất." });

    try {
        const phieuXuatQuery = `
            SELECT px.*, u.hoTen AS tenNguoiThucHien, u.email AS emailNguoiThucHien
            FROM phieuxuat px JOIN users u ON px.nguoiThucHien_id = u.id
            WHERE px.id = ?;
        `;
        const [phieuXuatRows] = await pool.query(phieuXuatQuery, [id]);
        if (phieuXuatRows.length === 0) return res.status(404).json({ error: "Không tìm thấy phiếu xuất." });
        const phieuXuatDetails = phieuXuatRows[0];

        try {
            // Gán lại giá trị đã parse vào phieuXuatDetails.danhSachChungTu
            phieuXuatDetails.danhSachChungTu = phieuXuatDetails.danhSachChungTu && typeof phieuXuatDetails.danhSachChungTu === 'string'
                ? JSON.parse(phieuXuatDetails.danhSachChungTu)
                : (Array.isArray(phieuXuatDetails.danhSachChungTu) ? phieuXuatDetails.danhSachChungTu : []); // Đảm bảo là mảng hoặc mảng rỗng

            if (!Array.isArray(phieuXuatDetails.danhSachChungTu)) {
                 phieuXuatDetails.danhSachChungTu = [];
            }

        } catch (e) {
            console.error(`Error parsing danhSachChungTu for phieuxuat ID ${id}:`, e);
            phieuXuatDetails.danhSachChungTu = [];
        }
        
        const chiTietQuery = `
            SELECT
                pxc.thongtinthietbi_id,
                tttb.ngayMua, tttb.giaTriBanDau, 
                tb.tenThietBi, tl.theLoai
            FROM phieuxuat_chitiet pxc
            JOIN thongtinthietbi tttb ON pxc.thongtinthietbi_id = tttb.id
            JOIN thietbi tb ON tttb.thietbi_id = tb.id
            LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            WHERE pxc.phieuxuat_id = ?;
        `;
        const [chiTietRows] = await pool.query(chiTietQuery, [id]);

        res.status(200).json({ phieuXuat: phieuXuatDetails, chiTiet: chiTietRows });
    } catch (error) {
        console.error(`Lỗi khi lấy chi tiết phiếu xuất ID ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy chi tiết phiếu xuất." });
    }
};

// Tạo phiếu xuất mới
exports.createPhieuXuat = async (req, res) => {
    const { lyDoXuat, ghiChu, giaTriThanhLy, selectedDeviceIds, danhSachChungTu } = req.body;
    const nguoiThucHien_id = req.user?.id;

    // --- Validation ---
    if (!nguoiThucHien_id) return res.status(401).json({ error: "Không thể xác định người tạo phiếu." });
    const validLyDo = ['thanh_ly', 'mat_mat', 'xuat_tra', 'dieu_chuyen'];
    if (!lyDoXuat || !validLyDo.includes(lyDoXuat)) return res.status(400).json({ error: "Lý do xuất kho không hợp lệ." });
    if (!Array.isArray(selectedDeviceIds) || selectedDeviceIds.length === 0) return res.status(400).json({ error: "Vui lòng chọn ít nhất một thiết bị để xuất." });
    const giaTriParsed = giaTriThanhLy ? parseFloat(giaTriThanhLy) : null;
    if (giaTriThanhLy && (isNaN(giaTriParsed) || giaTriParsed < 0)) return res.status(400).json({ error: "Giá trị thanh lý không hợp lệ." });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // --- Kiểm tra lại điều kiện các thiết bị được chọn ---
        const placeholders = selectedDeviceIds.map(() => '?').join(',');
        const checkQuery = `SELECT id, tinhTrang, phong_id FROM thongtinthietbi WHERE id IN (${placeholders}) FOR UPDATE;`;
        const [devicesToCheck] = await connection.query(checkQuery, selectedDeviceIds);

        if (devicesToCheck.length !== selectedDeviceIds.length) throw new Error("Một số thiết bị được chọn không tồn tại hoặc đã bị xóa.");

        const allowedStates = ['con_bao_hanh', 'het_bao_hanh', 'cho_thanh_ly'];
        for (const device of devicesToCheck) {
            if (device.phong_id !== null) throw new Error(`Thiết bị ID ${device.id} đang thuộc phòng, không thể xuất.`);
            if (!allowedStates.includes(device.tinhTrang)) throw new Error(`Thiết bị ID ${device.id} đang ở trạng thái '${getTinhTrangLabel(device.tinhTrang)}', không thể xuất.`);
        }
        // --- Hết kiểm tra ---

        // 1. Tạo phiếu xuất
        const phieuXuatQuery = `INSERT INTO phieuxuat (ngayXuat, nguoiThucHien_id, lyDoXuat, ghiChu, giaTriThanhLy, danhSachChungTu) VALUES (NOW(), ?, ?, ?, ?, ?)`;
        const [phieuXuatResult] = await connection.query(phieuXuatQuery, [nguoiThucHien_id, lyDoXuat, ghiChu || null, giaTriParsed, danhSachChungTu ? JSON.stringify(danhSachChungTu) : null]);
        const newPhieuXuatId = phieuXuatResult.insertId;
        if (!newPhieuXuatId) throw new Error("Không thể tạo phiếu xuất.");
        console.log(`Created phieuxuat ID: ${newPhieuXuatId}`);

        // 2. Tạo chi tiết và Cập nhật TTTB
        const chiTietValues = [];
        const updatePromises = [];
        for (const deviceId of selectedDeviceIds) {
            chiTietValues.push([newPhieuXuatId, deviceId]);
            const updateQuery = "UPDATE thongtinthietbi SET tinhTrang = 'da_thanh_ly' WHERE id = ? AND tinhTrang IN (?)";
            updatePromises.push(connection.query(updateQuery, [deviceId, allowedStates]));
        }

        if (chiTietValues.length > 0) {
            const chiTietQuery = `INSERT INTO phieuxuat_chitiet (phieuxuat_id, thongtinthietbi_id) VALUES ?`;
            const [chiTietResult] = await connection.query(chiTietQuery, [chiTietValues]);
            if (chiTietResult.affectedRows !== selectedDeviceIds.length) throw new Error("Lỗi khi ghi chi tiết phiếu xuất.");
        }

        const updateResults = await Promise.all(updatePromises);
        let totalAffectedRows = 0;
        updateResults.forEach(([result], index) => {
            if (result.affectedRows !== 1) throw new Error(`Không thể cập nhật trạng thái cho thiết bị ID ${selectedDeviceIds[index]}. Trạng thái có thể đã thay đổi.`);
            totalAffectedRows += result.affectedRows;
        });
        if (totalAffectedRows !== selectedDeviceIds.length) throw new Error("Số lượng thiết bị được cập nhật trạng thái không khớp.");

        await connection.commit();
        console.log(`Transaction committed for phieuxuat ID: ${newPhieuXuatId}`);

        res.status(201).json({
            message: `Tạo phiếu xuất ID ${newPhieuXuatId} thành công cho ${selectedDeviceIds.length} thiết bị.`,
            phieuXuatId: newPhieuXuatId
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Lỗi khi tạo phiếu xuất:", error);
        res.status(error.message.includes("không thể xuất") || error.message.includes("không khớp") || error.message.includes("không tồn tại") ? 400 : 500)
           .json({ error: error.message || "Lỗi máy chủ khi tạo phiếu xuất." });
    } finally {
        if (connection) connection.release();
    }
};

// Hàm upload chứng từ cho Phiếu Xuất 
exports.uploadChungTuXuat = async (req, res) => {
    const { id } = req.params; 
    const files = req.files; 


    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Không có file nào được chọn.' });
    }


    try {
        // Kiểm tra xem phiếu xuất có tồn tại không
        const [phieuCheck] = await pool.query("SELECT danhSachChungTu FROM phieuxuat WHERE id = ?", [id]);
        if (phieuCheck.length === 0) {
            return res.status(404).json({ error: 'Phiếu xuất không tồn tại.' });
        }


        const uploadedUrls = files.map(file => file.path); 


         // Lấy danh sách URL cũ và cập nhật CSDL cho bảng phieuxuat
         let existingUrls = [];
         if (phieuCheck[0].danhSachChungTu) {
             try {
                 // Thử parse nếu là chuỗi
                 if (typeof phieuCheck[0].danhSachChungTu === 'string') {
                     existingUrls = JSON.parse(phieuCheck[0].danhSachChungTu);
                 } else if (Array.isArray(phieuCheck[0].danhSachChungTu)) {
                     // Nếu đã là mảng, gán trực tiếp
                     existingUrls = phieuCheck[0].danhSachChungTu;
                 } else {
                     existingUrls = [];
                 }
             } catch (parseError) {
                 console.error("Lỗi parse JSON danhSachChungTu cũ (phiếu xuất):", parseError);
                 existingUrls = [];
             }
         }
         const newUrlList = [...existingUrls, ...uploadedUrls];
         await pool.query(
             "UPDATE phieuxuat SET danhSachChungTu = ? WHERE id = ?",
             [JSON.stringify(newUrlList), id]
         );
 

         res.status(200).json({
             message: `Đã upload thành công ${uploadedUrls.length} chứng từ.`,
             danhSachChungTu: newUrlList
         });


    } catch (error) {
        console.error("Lỗi upload chứng từ phiếu xuất:", error);
        res.status(500).json({ error: error.message || 'Lỗi máy chủ khi upload chứng từ.' });
    }
};
