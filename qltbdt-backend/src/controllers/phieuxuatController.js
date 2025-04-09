const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const path = require('path');

// Lấy danh sách tất cả phiếu xuất (để hiển thị trong trang Nhập Xuất)
exports.getAllPhieuXuat = async (req, res) => {
    try {
        // Lấy thêm tên người thực hiện
        const [rows] = await pool.query(`
            SELECT px.*, u.hoTen AS tenNguoiThucHien
            FROM phieuxuat px
            JOIN users u ON px.nguoiThucHien_id = u.id
            ORDER BY px.ngayXuat DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách phiếu xuất:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách phiếu xuất." });
    }
};

// Lấy chi tiết một phiếu xuất (bao gồm danh sách thiết bị đã xuất)
exports.getPhieuXuatById = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID phiếu xuất không hợp lệ." });
    }

    try {
        // Lấy thông tin phiếu xuất cơ bản
        const [phieuXuatRows] = await pool.query(`
            SELECT px.*, u.hoTen AS tenNguoiThucHien
            FROM phieuxuat px
            JOIN users u ON px.nguoiThucHien_id = u.id
            WHERE px.id = ?
        `, [id]);

        if (phieuXuatRows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phiếu xuất." });
        }
        const phieuXuat = phieuXuatRows[0];

        // Lấy danh sách chi tiết thiết bị đã xuất trong phiếu này
        const [chiTietRows] = await pool.query(`
            SELECT
                pxct.thongtinthietbi_id,
                ttb.tenThietBi,
                ttb.thietbi_id -- Lấy cả thietbi_id để tham chiếu
                -- Thêm các cột khác từ thongtinthietbi nếu cần hiển thị
            FROM phieuxuat_chitiet pxct
            JOIN thongtinthietbi ttb ON pxct.thongtinthietbi_id = ttb.id
            WHERE pxct.phieuxuat_id = ?
        `, [id]);

        phieuXuat.chiTietThietBi = chiTietRows; // Gắn danh sách chi tiết vào kết quả

        res.json(phieuXuat);
    } catch (error) {
        console.error(`Lỗi khi lấy chi tiết phiếu xuất ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy chi tiết phiếu xuất." });
    }
};

// Tạo phiếu xuất mới
exports.createPhieuXuat = async (req, res) => {
    const nguoiThucHien_id = req.user?.id; // Lấy ID từ token 
    const { lyDoXuat, ghiChu, giaTriThanhLy, danhSachThietBiIds } = req.body; // danhSachThietBiIds là mảng các thongtinthietbi_id

    // --- Validation ---
    if (!nguoiThucHien_id) {
        return res.status(401).json({ error: "Người dùng chưa được xác thực." });
    }
    if (!lyDoXuat) {
        return res.status(400).json({ error: "Vui lòng cung cấp lý do xuất." });
    }
    if (!Array.isArray(danhSachThietBiIds) || danhSachThietBiIds.length === 0) {
        return res.status(400).json({ error: "Vui lòng chọn ít nhất một thiết bị để xuất." });
    }
    // --- Kết thúc Validation ---

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Kiểm tra trạng thái các thiết bị sắp xuất (phải là 'cho_thanh_ly' hoặc trạng thái hợp lệ khác nếu bạn muốn)
        const placeholders = danhSachThietBiIds.map(() => '?').join(',');
        const [devicesToCheck] = await connection.query(
            `SELECT id, tinhTrang, phong_id, thietbi_id FROM thongtinthietbi WHERE id IN (${placeholders})`,
            danhSachThietBiIds
        );

        if (devicesToCheck.length !== danhSachThietBiIds.length) {
             throw new Error("Một hoặc nhiều ID thiết bị không tồn tại.");
        }

        const invalidStatusDevices = devicesToCheck.filter(d => d.tinhTrang !== 'cho_thanh_ly'); // Hoặc các trạng thái hợp lệ khác
        if (invalidStatusDevices.length > 0) {
            const invalidIds = invalidStatusDevices.map(d => d.id).join(', ');
            throw new Error(`Các thiết bị sau không ở trạng thái hợp lệ để xuất: ${invalidIds}`);
        }

        // 2. Tạo bản ghi trong bảng `phieuxuat`
        const [phieuXuatResult] = await connection.query(
            `INSERT INTO phieuxuat (nguoiThucHien_id, lyDoXuat, ghiChu, giaTriThanhLy, ngayXuat)
             VALUES (?, ?, ?, ?, NOW())`,
            [nguoiThucHien_id, lyDoXuat, ghiChu || null, giaTriThanhLy || null]
        );
        const phieuXuatId = phieuXuatResult.insertId;

        // 3. Tạo các bản ghi trong `phieuxuat_chitiet`
        const chiTietValues = danhSachThietBiIds.map(tttbId => [phieuXuatId, tttbId]);
        await connection.query(
            `INSERT INTO phieuxuat_chitiet (phieuxuat_id, thongtinthietbi_id) VALUES ?`,
            [chiTietValues]
        );

        // 4. Cập nhật trạng thái `thongtinthietbi` thành 'da_thanh_ly'
        await connection.query(
            `UPDATE thongtinthietbi SET tinhTrang = 'da_thanh_ly', phong_id = NULL, nguoiDuocCap = NULL WHERE id IN (${placeholders})`,
            danhSachThietBiIds
        );

        // 5. Gỡ các thiết bị này khỏi phòng trong `phong_thietbi`
        await connection.query(
            `DELETE FROM phong_thietbi WHERE thongtinthietbi_id IN (${placeholders})`,
            danhSachThietBiIds
        );

        // 6. (Quan trọng) Cập nhật lại `tonKho` (tổng nhập) trong bảng `thietbi`
        // Lấy danh sách thietbi_id và số lượng tương ứng cần giảm
         const countsToDecrease = devicesToCheck.reduce((acc, device) => {
            acc[device.thietbi_id] = (acc[device.thietbi_id] || 0) + 1;
            return acc;
        }, {});

        for (const thietBiId in countsToDecrease) {
            await connection.query(
                "UPDATE thietbi SET tonKho = tonKho - ? WHERE id = ?",
                [countsToDecrease[thietBiId], thietBiId]
            );
             // // Nếu muốn giảm cả tồn kho
             // await connection.query(
             //     "UPDATE thietbi SET tonKho = tonKho - ? WHERE id = ?",
             //     [countsToDecrease[thietBiId], thietBiId]
             // );
        }

        await connection.commit();
        res.status(201).json({ message: "Tạo phiếu xuất thành công!", phieuXuatId: phieuXuatId });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi tạo phiếu xuất:", error);
        res.status(500).json({ error: `Lỗi máy chủ khi tạo phiếu xuất: ${error.message}` });
    } finally {
        connection.release();
    }
};

// Hàm upload chứng từ cho Phiếu Xuất (Dùng diskStorage)
exports.uploadChungTuXuat = async (req, res) => {
    const { id } = req.params; // ID Phiếu xuất
    const files = req.files; // Lấy file từ middleware multer

    console.log('Received files for Export Slip (diskStorage):', files); // Log kiểm tra

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Không có file nào được chọn.' });
    }

    try {
        // Kiểm tra xem phiếu xuất có tồn tại không
        const [phieuCheck] = await pool.query("SELECT danhSachChungTu FROM phieuxuat WHERE id = ?", [id]);
        if (phieuCheck.length === 0) {
             // Xóa file tạm nếu phiếu không tồn tại
             files.forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlink(file.path, (err) => { if (err) console.error("Lỗi xóa file tạm:", err);});
                }
             });
            return res.status(404).json({ error: 'Phiếu xuất không tồn tại.' });
        }

        const uploadPromises = files.map(file => {
            console.log(`Processing file for Export Slip from path: ${file.path}, size: ${file.size}`);
            return new Promise((resolve, reject) => {
                // Upload từ đường dẫn file tạm
                cloudinary.uploader.upload(file.path, { // <-- Dùng file.path
                    resource_type: "auto",
                    folder: "chungtu_xuat", // Thư mục riêng cho phiếu xuất
                    public_id: `px_${id}_${Date.now()}_${path.parse(file.originalname).name}` // Prefix px_
                }, (error, result) => {
                    // Luôn xóa file tạm
                    fs.unlink(file.path, (unlinkErr) => {
                        if (unlinkErr) console.error("Lỗi xóa file tạm:", file.path, unlinkErr);
                    });

                    if (error) {
                        console.error('Cloudinary Upload Error:', error);
                        return reject(new Error(`Lỗi upload ${file.originalname} lên Cloudinary.`));
                    }
                    resolve(result.secure_url);
                });
            });
        });

        const uploadedUrls = await Promise.all(uploadPromises);

        // Lấy danh sách URL cũ và cập nhật CSDL cho bảng phieuxuat
        let existingUrls = [];
        try {
            existingUrls = phieuCheck[0].danhSachChungTu ? JSON.parse(phieuCheck[0].danhSachChungTu) : [];
            if (!Array.isArray(existingUrls)) existingUrls = [];
        } catch (parseError) {
            console.error("Lỗi parse JSON danhSachChungTu cũ (phiếu xuất):", parseError);
            existingUrls = [];
        }
        const newUrlList = [...existingUrls, ...uploadedUrls];
        await pool.query(
            "UPDATE phieuxuat SET danhSachChungTu = ? WHERE id = ?", // <-- Cập nhật bảng phieuxuat
            [JSON.stringify(newUrlList), id]
        );

        res.status(200).json({
            message: `Đã upload thành công ${uploadedUrls.length} chứng từ.`,
            danhSachChungTu: newUrlList
        });

    } catch (error) {
        console.error("Lỗi upload chứng từ phiếu xuất:", error);
         // Xóa file tạm nếu có lỗi xảy ra
         if (files && files.length > 0) {
             files.forEach(file => {
                 if (file.path && fs.existsSync(file.path)) {
                     fs.unlink(file.path, (unlinkErr) => { if (unlinkErr) console.error("Lỗi xóa file tạm sau lỗi:", file.path, unlinkErr); });
                 }
             });
         }
        res.status(500).json({ error: error.message || 'Lỗi máy chủ khi upload chứng từ.' });
    }
};
