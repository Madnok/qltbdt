
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
            // Chèn vào bảng `thongtinthietbi` với số lượng
            await connection.query(
                `INSERT INTO thongtinthietbi (
                    thietbi_id, phieunhap_id, tenThietBi, tinhTrang, thoiGianBaoHanh, ngayBaoHanhKetThuc, soLuong
                ) VALUES (?, ?, ?, 'con_bao_hanh', ?, DATE_ADD(CURDATE(), INTERVAL ? MONTH), ?)`,
                [item.thietbi_id, phieuNhapId, item.tenThietBi, item.thoiGianBaoHanh, item.thoiGianBaoHanh, item.soLuong]
            );

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
                ttb.thietbi_id, 
                ttb.tenThietBi, 
                ttb.soLuong, 
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

        // Lấy danh sách số lượng và thietbi_id để cập nhật tồn kho
        const [thietBiList] = await connection.query(
            "SELECT thietbi_id, SUM(soLuong) AS tongSoLuong FROM thongtinthietbi WHERE phieunhap_id = ? GROUP BY thietbi_id",
            [id]
        );

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

        // Lấy danh sách thiết bị cũ của phiếu nhập
        const [existingDevices] = await connection.query(
            "SELECT thietbi_id, thoiGianBaoHanh, soLuong FROM thongtinthietbi WHERE phieunhap_id = ?",
            [id]
        );

        // Tạo map để kiểm tra thiết bị đã tồn tại (kèm thời gian bảo hành)
        const existingMap = {};
        existingDevices.forEach((device) => {
            const key = `${device.thietbi_id}_${device.thoiGianBaoHanh}`;
            existingMap[key] = device.soLuong;
        });

        const newDeviceIds = new Set();

        // Xử lý cập nhật, thêm mới
        for (const item of thietBiNhap) {
            const key = `${item.thietbi_id}_${item.thoiGianBaoHanh}`;

            if (existingMap[key] !== undefined) {
                // Nếu thiết bị đã tồn tại với cùng ID và thời gian bảo hành => Cộng dồn số lượng
                const updatedQuantity = existingMap[key] + item.soLuong;

                await connection.query(
                    `UPDATE thongtinthietbi 
                     SET soLuong = ?
                     WHERE phieunhap_id = ? AND thietbi_id = ? AND thoiGianBaoHanh = ?`,
                    [updatedQuantity, id, item.thietbi_id, item.thoiGianBaoHanh]
                );

                await connection.query(
                    "UPDATE thietbi SET tonKho = tonKho + ? WHERE id = ?",
                    [item.soLuong, item.thietbi_id]
                );
            } else {
                // Nếu thiết bị chưa tồn tại hoặc có khác thời gian bảo hành => Thêm mới
                await connection.query(
                    `INSERT INTO thongtinthietbi (
                        thietbi_id, phieunhap_id, tenThietBi, tinhTrang, thoiGianBaoHanh, ngayBaoHanhKetThuc, soLuong
                    ) VALUES (?, ?, ?, 'con_bao_hanh', ?, DATE_ADD(CURDATE(), INTERVAL ? MONTH), ?)`,
                    [item.thietbi_id, id, item.tenThietBi, item.thoiGianBaoHanh, item.thoiGianBaoHanh, item.soLuong]
                );

                await connection.query(
                    "UPDATE thietbi SET tonKho = tonKho + ? WHERE id = ?",
                    [item.soLuong, item.thietbi_id]
                );
            }

            newDeviceIds.add(`${item.thietbi_id}_${item.thoiGianBaoHanh}`);
        }

        // Xóa thiết bị bị loại bỏ khỏi danh sách nhập
        for (const device of existingDevices) {
            const key = `${device.thietbi_id}_${device.thoiGianBaoHanh}`;
            if (!newDeviceIds.has(key)) {
                await connection.query(
                    "DELETE FROM thongtinthietbi WHERE phieunhap_id = ? AND thietbi_id = ? AND thoiGianBaoHanh = ?",
                    [id, device.thietbi_id, device.thoiGianBaoHanh]
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

