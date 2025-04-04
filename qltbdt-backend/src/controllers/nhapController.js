
const db = require("../config/db");
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
        const [rows] = await db.query("SELECT * FROM phieunhap WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

