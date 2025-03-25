const pool = require("../config/db");

//  Lấy danh sách tất cả phòng
exports.getAllPhong = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM phong");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết phòng theo ID
exports.getPhongById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM phong WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng!" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//  Thêm phòng mới
exports.addPhong = async (req, res) => {
    const { coSo, toa, tang, soPhong, chucNang } = req.body;

    // Kiểm tra đầu vào
    if (!coSo || !toa || !tang || !soPhong || !chucNang) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO phong (coSo, toa, tang, soPhong, chucNang) VALUES (?, ?, ?, ?, ?)",
            [coSo, toa, tang, soPhong, chucNang]
        );

        res.status(201).json({ message: "Thêm phòng thành công!", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật thông tin phòng
exports.updatePhong = async (req, res) => {
    const { id } = req.params;
    const { coSo, toa, tang, soPhong, chucNang } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE phong SET coSo = ?, toa = ?, tang = ?, soPhong = ?, chucNang = ? WHERE id = ?",
            [coSo, toa, tang, soPhong, chucNang, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng để cập nhật" });
        }

        res.json({ message: "Cập nhật phòng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//  Xóa phòng
exports.deletePhong = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM phong WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng để xóa" });
        }

        res.json({ message: "Xóa phòng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách phòng (Dropdown)
exports.getListPhong = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, toa, tang, soPhong FROM phong");
        const phongList = rows.map(p => ({
            id: p.id,
            phong: `${p.toa}${p.tang}.${p.soPhong}`
        }));
        res.json(phongList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm thiết bị vào phòng
exports.addThietBiToPhong = async (req, res) => {
    try {
        const thietbiList = req.body; // Nhận danh sách thiết bị

        for (let item of thietbiList) {
            const { phong_id, thietbi_id, thongtinthietbi_id, soLuong } = item;

            if (!phong_id || !thietbi_id || !thongtinthietbi_id || !soLuong) {
                return res.status(400).json({ error: "Thiếu dữ liệu, vui lòng kiểm tra lại!" });
            }

            // Kiểm tra tồn kho
            const [thietBi] = await pool.query("SELECT tonKho FROM thietbi WHERE id = ?", [thietbi_id]);
            if (thietBi.length === 0) continue;

            if (soLuong > thietBi[0].tonKho) {
                return res.status(400).json({ error: "Số lượng thiết bị vượt quá tồn kho!" });
            }

            // Thêm vào phòng
            await pool.query(
                "INSERT INTO phong_thietbi (phong_id, thietbi_id, thongtinthietbi_id, soLuong) VALUES (?, ?, ?, ?)",
                [phong_id, thietbi_id, thongtinthietbi_id, soLuong]
            );
        }

        res.json({ success: true, message: "Thêm thiết bị vào phòng thành công!" });
    } catch (error) {
        console.error("Lỗi thêm thiết bị vào phòng:", error);
        res.status(500).json({ success: false, message: "Lỗi server!" });
    }
};

// Lấy Danh Sách Thiết Bị Trong Phòng
exports.getThietBiTrongPhong = async (req, res) => {
    const { phong_id } = req.params;

    if (!phong_id) {
        return res.status(400).json({ error: "Thiếu mã phòng!" });
    }

    try {
        // Truy vấn danh sách thiết bị trong phòng
        const [results] = await pool.query(
            `SELECT 
                ptb.id,
                ptb.phong_id,
                ptb.thietbi_id,
                ptb.thongtinthietbi_id,
                ptb.soLuong,
                tb.tenThietBi,
                tttb.tinhTrang,
                tttb.thoiGianBaoHanh,
                tttb.ngayBaoHanhKetThuc
            FROM phong_thietbi ptb
            JOIN thietbi tb ON ptb.thietbi_id = tb.id
            JOIN thongtinthietbi tttb ON ptb.thongtinthietbi_id = tttb.id
            WHERE ptb.phong_id = ?`,
            [phong_id]
        );

        // Nếu phòng không có thiết bị
        if (results.length === 0) {
            return res.status(200).json({ message: "Phòng chưa có thiết bị nào!" });
        }

        // Truy vấn tổng số thiết bị trong phòng
        const [countResult] = await pool.query(
            "SELECT SUM(soLuong) AS total FROM phong_thietbi WHERE phong_id = ?",
            [phong_id]
        );

        const total = countResult[0].total || 0; // Gán giá trị total (nếu null thì gán 0)

        // Thêm giá trị `total` vào từng thiết bị trong danh sách
        const devicesWithTotal = results.map(device => ({
            ...device,
            total: total
        }));

        // Trả về danh sách thiết bị với thông tin tổng số thiết bị
        res.json(devicesWithTotal);
    } catch (error) {
        console.error("Lỗi lấy danh sách thiết bị trong phòng:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};

// Xóa thiết bị khỏi phòng
exports.removeThietBiFromPhong = async (req, res) => {
    const { phong_id, thietbi_id } = req.body;

    if (!phong_id || !thietbi_id) {
        return res.status(400).json({ error: "Vui lòng cung cấp phòng_id và thietbi_id!" });
    }

    try {
        // Kiểm tra xem thiết bị có tồn tại trong phòng không
        const [existing] = await pool.query(
            "SELECT * FROM phong_thietbi WHERE phong_id = ? AND thietbi_id = ?",
            [phong_id, thietbi_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: "Thiết bị không tồn tại trong phòng này!" });
        }

        // Xóa thiết bị khỏi phòng
        await pool.query(
            "DELETE FROM phong_thietbi WHERE phong_id = ? AND thietbi_id = ? LIMIT 1",
            [phong_id, thietbi_id]
        );

        res.status(200).json({ message: "Xóa thiết bị khỏi phòng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};