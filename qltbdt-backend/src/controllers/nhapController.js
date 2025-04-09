
const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const path = require('path');

// Lấy danh sách tất cả phiếu nhập
exports.getAllPhieuNhap = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM phieunhap");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết phiếu nhập theo ID
exports.getPhieuNhapById = async (req, res) => {
    const { id } = req.params;
    try {
        // Query 1: Lấy thông tin phiếu nhập
        const [phieuNhapRows] = await db.query("SELECT pn.*, u.hoTen as nguoiTao, pn.danhSachChungTu FROM phieunhap pn LEFT JOIN users u ON pn.user_id = u.id WHERE pn.id = ?", [id]);
        if (phieuNhapRows.length === 0) {
            return res.status(404).json({ error: "Phiếu nhập không tồn tại" });
        }
        const phieuNhap = phieuNhapRows[0];

        // Query 2: Lấy danh sách thiết bị thuộc phiếu nhập
        const [thietBiRows] = await db.query("SELECT * FROM thongtinthietbi WHERE phieunhap_id = ?", [id]);

        try {
             let parsedData = []; // Khởi tạo mảng rỗng
             if (phieuNhap.danhSachChungTu) {
                // Nếu kiểu đã là object/array (do driver tự parse từ kiểu JSON của DB), không cần parse nữa
                if (typeof phieuNhap.danhSachChungTu === 'object') {
                    parsedData = phieuNhap.danhSachChungTu;
                } else {
                    // Nếu là string, thì mới parse
                    parsedData = JSON.parse(phieuNhap.danhSachChungTu);
                }
             }
            // Đảm bảo kết quả cuối cùng là mảng
            if (!Array.isArray(parsedData)) {
                 parsedData = [];
             }
             phieuNhap.danhSachChungTu = parsedData; // Gán kết quả cuối cùng

        } catch (e) {
             console.error(`JSON Parse Error for ID ${id}:`, e); // Log lỗi nếu parse thất bại
             phieuNhap.danhSachChungTu = []; // Gán mảng rỗng nếu lỗi
        }
        res.json({
            phieuNhap: phieuNhap,
            thongTinThietBi: thietBiRows
        });

    } catch (error) {
        console.error("Lỗi lấy chi tiết phiếu nhập:", error);
        res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

// Lấy họ tên người tạo theo user_id
exports.getHoTenByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query("SELECT hoTen FROM users WHERE id = ?", [userId]);
        if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy người dùng" });
        res.json({ hoTen: rows[0].hoTen });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tạo phiếu nhập với trường hợp nhập (muaMoi hoặc taiTro)
exports.createPhieuNhap = async (req, res) => {
    const { userId, truongHopNhap, ngayTao, danhSachThietBi } = req.body;

    if (!["muaMoi", "taiTro"].includes(truongHopNhap)) {
        return res.status(400).json({ error: "Trường hợp nhập không hợp lệ!" });
    }
    if (!Array.isArray(danhSachThietBi) || danhSachThietBi.length === 0) {
        return res.status(400).json({ error: "Danh sách thiết bị không hợp lệ!" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Lấy họ tên người tạo từ userId
        const [userRows] = await connection.query("SELECT hoTen FROM users WHERE id = ?", [userId]);
        if (userRows.length === 0) throw new Error("Người dùng không tồn tại!");
        const nguoiTao = userRows[0].hoTen;

        // Chèn vào bảng `phieunhap`
        const [phieuNhapResult] = await connection.query(
            "INSERT INTO phieunhap (user_id, nguoiTao, truongHopNhap, ngayTao) VALUES (?, ?, ?, ?)",
            [userId, nguoiTao, truongHopNhap, ngayTao]
        );
        const phieuNhapId = phieuNhapResult.insertId;
        if (!phieuNhapId) throw new Error("Không thể tạo phiếu nhập!");

        // Duyệt danh sách thiết bị
        for (const item of danhSachThietBi) {
            // Lặp lại `n` lần để tạo `n` bản ghi riêng biệt
            for (let i = 0; i < item.soLuong; i++) {
                await connection.query(
                    `INSERT INTO thongtinthietbi (
                        thietbi_id, phieunhap_id, tenThietBi, tinhTrang, thoiGianBaoHanh, ngayBaoHanhKetThuc
                    ) VALUES (?, ?, ?, 'con_bao_hanh', ?, DATE_ADD(CURDATE(), INTERVAL ? MONTH))`,
                    [item.thietbi_id, phieuNhapId, item.tenThietBi, item.thoiGianBaoHanh, item.thoiGianBaoHanh]
                );
            }

            // Cập nhật tồn kho trong bảng `thietbi`
            await connection.query(
                "UPDATE thietbi SET tonKho = tonKho + ? WHERE id = ?",
                [item.soLuong, item.thietbi_id]
            );
        }

        await connection.commit();
        res.json({ message: "Tạo phiếu nhập thành công!", phieunhapId: phieuNhapId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// Lấy danh sách thiết bị trong phiếu nhập
exports.getThietBiInPhieuNhap = async (req, res) => {
    const { phieuNhapId } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT
                ttb.id,
                ttb.thietbi_id, 
                ttb.tenThietBi, 
                ttb.thoiGianBaoHanh,
                tb.donGia, 
                pn.truongHopNhap 
            FROM thongtinthietbi ttb
            JOIN phieunhap pn ON ttb.phieunhap_id = pn.id
            JOIN thietbi tb ON ttb.thietbi_id = tb.id
            WHERE ttb.phieunhap_id = ?`,
            [phieuNhapId]
        );

        res.json(rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách thiết bị:", error);
        res.status(500).json({ error: "Lỗi lấy danh sách thiết bị" });
    }
};

// Xóa phiếu nhập theo ID
exports.deletePhieuNhap = async (req, res) => {
    const { id } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra tồn tại của phiếu nhập
        const [phieuNhap] = await connection.query("SELECT id FROM phieunhap WHERE id = ?", [id]);
        if (phieuNhap.length === 0) {
            throw new Error("Phiếu nhập không tồn tại!");
        }

        // Lấy danh sách số lượng và thietbi_id để cập nhật tồn kho
        const [thietBiList] = await connection.query(
            "SELECT thietbi_id, COUNT(*) AS tongSoLuong FROM thongtinthietbi WHERE phieunhap_id = ? GROUP BY thietbi_id",
            [id]
        );

        // Trừ tồn kho
        for (const item of thietBiList) {
            await connection.query(
                "UPDATE thietbi SET tonKho = tonKho - ? WHERE id = ?",
                [item.tongSoLuong, item.thietbi_id]
            );
        }

        // Xóa các thiết bị liên quan trong bảng `thongtinthietbi`
        await connection.query("DELETE FROM thongtinthietbi WHERE phieunhap_id = ?", [id]);

        // Xóa phiếu nhập
        const [result] = await connection.query("DELETE FROM phieunhap WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            throw new Error("Không tìm thấy phiếu nhập để xóa!");
        }

        await connection.commit();
        res.json({ message: "Xóa phiếu nhập thành công!" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// Cập nhật phiếu nhập theo ID
exports.updatePhieuNhap = async (req, res) => {
    const { id } = req.params;
    const { truongHopNhap, thietBiNhap } = req.body;

    if (!["muaMoi", "taiTro"].includes(truongHopNhap)) {
        return res.status(400).json({ error: "Trường hợp nhập không hợp lệ!" });
    }
    if (!Array.isArray(thietBiNhap) || thietBiNhap.length === 0) {
        return res.status(400).json({ error: "Danh sách thiết bị không hợp lệ!" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Cập nhật thông tin phiếu nhập
        const [updatePhieuNhapResult] = await connection.query(
            "UPDATE phieunhap SET truongHopNhap = ? WHERE id = ?",
            [truongHopNhap, id]
        );

        if (updatePhieuNhapResult.affectedRows === 0) {
            throw new Error("Không tìm thấy phiếu nhập để cập nhật!");
        }

        // Lấy danh sách thiết bị cũ trong phiếu nhập
        const [existingDevices] = await connection.query(
            "SELECT thietbi_id, soLuong, thoiGianBaoHanh FROM thongtinthietbi WHERE phieunhap_id = ?",
            [id]
        );

        // Chuyển danh sách thiết bị cũ thành Map để tiện tra cứu
        const existingMap = {};
        existingDevices.forEach((device) => {
            existingMap[device.thietbi_id] = {
                soLuong: device.soLuong,
                thoiGianBaoHanh: device.thoiGianBaoHanh
            };
        });

        const updatedDeviceIds = new Set();

        // Xử lý cập nhật thiết bị
        for (const item of thietBiNhap) {
            if (existingMap[item.thietbi_id]) {
                const oldQuantity = existingMap[item.thietbi_id].soLuong;
                const newQuantity = item.soLuong;
                const oldWarranty = existingMap[item.thietbi_id].thoiGianBaoHanh;
                const newWarranty = item.thoiGianBaoHanh;

                // Cập nhật số lượng thiết bị trong tồn kho
                const quantityDiff = newQuantity - oldQuantity;
                await connection.query(
                    "UPDATE thietbi SET tonKho = tonKho + ? WHERE id = ?",
                    [quantityDiff, item.thietbi_id]
                );

                // Cập nhật thiết bị trong phiếu nhập
                await connection.query(
                    `UPDATE thongtinthietbi 
                     SET soLuong = ?, thoiGianBaoHanh = ?, 
                         ngayBaoHanhKetThuc = DATE_ADD(
                             (SELECT ngayTao FROM phieunhap WHERE id = ?), INTERVAL ? MONTH) 
                     WHERE phieunhap_id = ? AND thietbi_id = ?`,
                    [newQuantity, newWarranty, id, newWarranty, id, item.thietbi_id]
                );
            }

            updatedDeviceIds.add(item.thietbi_id);
        }

        // Xóa thiết bị không còn trong danh sách nhập
        for (const device of existingDevices) {
            if (!updatedDeviceIds.has(device.thietbi_id)) {
                await connection.query(
                    "DELETE FROM thongtinthietbi WHERE phieunhap_id = ? AND thietbi_id = ?",
                    [id, device.thietbi_id]
                );

                await connection.query(
                    "UPDATE thietbi SET tonKho = tonKho - ? WHERE id = ?",
                    [device.soLuong, device.thietbi_id]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Cập nhật phiếu nhập thành công!" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// Hàm upload chứng từ cho Phiếu Nhập
exports.uploadChungTuNhap = async (req, res) => {
    const { id } = req.params;
    const files = req.files;

    console.log('Received files (using diskStorage):', files); // Log kiểm tra file.path

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Không có file nào được chọn.' });
    }

    try {
        const [phieuCheck] = await db.query("SELECT danhSachChungTu FROM phieunhap WHERE id = ?", [id]); // Sửa db thành db nếu đúng
        if (phieuCheck.length === 0) {
            return res.status(404).json({ error: 'Phiếu nhập không tồn tại.' });
        }

        const uploadPromises = files.map(file => {
            console.log(`Processing file from path: ${file.path}, size: ${file.size}`);
            return new Promise((resolve, reject) => {
                // Upload từ đường dẫn file tạm
                cloudinary.uploader.upload(file.path, { // <-- Dùng file.path
                    resource_type: "auto",
                    folder: "chungtu_nhap",
                     // Dùng path.parse để lấy tên gốc không có extension
                    public_id: `pn_${id}_${Date.now()}_${path.parse(file.originalname).name}`
                }, (error, result) => {
                    // Luôn xóa file tạm sau khi xử lý xong
                    fs.unlink(file.path, (unlinkErr) => {
                        if (unlinkErr) console.error("Error deleting temp file:", file.path, unlinkErr);
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

        //  Phần lấy existingUrls và cập nhật CSDL...
         let existingUrls = [];
         try {
             existingUrls = phieuCheck[0].danhSachChungTu ? JSON.parse(phieuCheck[0].danhSachChungTu) : [];
             if (!Array.isArray(existingUrls)) existingUrls = [];
         } catch (parseError) {
             console.error("Lỗi parse JSON danhSachChungTu cũ:", parseError);
             existingUrls = [];
         }
         const newUrlList = [...existingUrls, ...uploadedUrls];
         await db.query( 
             "UPDATE phieunhap SET danhSachChungTu = ? WHERE id = ?",
             [JSON.stringify(newUrlList), id]
         );


        res.status(200).json({
            message: `Đã upload thành công ${uploadedUrls.length} chứng từ.`,
            danhSachChungTu: newUrlList
        });

    } catch (error) {
        console.error("Lỗi upload chứng từ phiếu nhập:", error);
         // Xóa file tạm nếu có lỗi xảy ra trước khi kịp xóa trong callback cloudinary
         if (files && files.length > 0) {
             files.forEach(file => {
                 if (file.path && fs.existsSync(file.path)) {
                     fs.unlink(file.path, (unlinkErr) => {
                        if (unlinkErr) console.error("Error deleting temp file after error:", file.path, unlinkErr);
                     });
                 }
             });
         }
        res.status(500).json({ error: error.message || 'Lỗi máy chủ khi upload chứng từ.' });
    }
};

