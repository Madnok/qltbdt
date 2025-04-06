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
        // Kiểm tra xem phòng có chứa thiết bị không (tối ưu bằng EXISTS)
        const [[deviceCheck]] = await pool.query(
            "SELECT EXISTS(SELECT 1 FROM phong_thietbi WHERE phong_id = ?) AS hasDevice",
            [id]
        );

        // Nếu phòng có thiết bị, không cho phép xóa
        if (deviceCheck.hasDevice) {
            return res.status(400).json({
                error: "Không thể xóa phòng vì phòng này đang chứa thiết bị!",
            });
        }

        // Xóa phòng nếu không có thiết bị
        const [result] = await pool.query("DELETE FROM phong WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng để xóa!" });
        }

        res.json({ message: "Xóa phòng thành công!" });
    } catch (error) {
        console.error("Lỗi khi xóa phòng:", error);
        res.status(500).json({ error: "Lỗi server!" });
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
        const thietbiList = req.body; // Nhận danh sách thiết bị từ frontend

        if (!thietbiList || thietbiList.length === 0) {
            return res.status(400).json({ error: "Danh sách thiết bị rỗng!" });
        }

        for (let item of thietbiList) {
            const { phong_id, thietbi_id, thongtinthietbi_id } = item;

            if (!phong_id || !thietbi_id || !thongtinthietbi_id) {
                return res.status(400).json({ error: "Thiếu dữ liệu, vui lòng kiểm tra lại!" });
            }

            // Kiểm tra thiết bị đã được phân bổ vào phòng khác hay chưa
            const [[existingDevice]] = await pool.query(
                "SELECT phong_id FROM phong_thietbi WHERE thongtinthietbi_id = ?",
                [thongtinthietbi_id]
            );
            
            if (existingDevice && existingDevice.phong_id !== phong_id) {
                return res.status(400).json({
                    error: `Thiết bị có thongtinthietbi_id ${thongtinthietbi_id} đã được phân bổ vào phòng khác!`,
                });
            }
            
            // Thêm thiết bị vào phòng
            await pool.query(
                "INSERT INTO phong_thietbi (phong_id, thietbi_id, thongtinthietbi_id) VALUES (?, ?, ?)",
                [phong_id, thietbi_id, thongtinthietbi_id]
            );
        }

        res.json({ success: true, message: "Thêm thiết bị vào phòng thành công!" });
    } catch (error) {
        console.error("Lỗi thêm thiết bị vào phòng:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};


// Lấy Danh Sách Thiết Bị Trong Phòng
exports.getThietBiTrongPhong = async (req, res) => {
    const { phong_id } = req.params;

    if (!phong_id) {
        return res.status(400).json({ error: "Thiếu mã phòng!" });
    }

    try {
        const [results] = await pool.query(
            `SELECT
                ptb.id, ptb.phong_id, ptb.thietbi_id, ptb.thongtinthietbi_id,
                tb.tenThietBi,
                tttb.tinhTrang, tttb.thoiGianBaoHanh, tttb.ngayBaoHanhKetThuc,
                tl.theLoai,
                -- Lấy trạng thái của báo hỏng gần nhất CHƯA HOÀN THÀNH cho TTTB này
                (SELECT bh.trangThai
                 FROM baohong bh
                 WHERE bh.thongtinthietbi_id = ptb.thongtinthietbi_id
                   AND bh.trangThai NOT IN ('Hoàn Thành', 'Không Thể Hoàn Thành') -- Hoặc chỉ check NOT IN ('Hoàn Thành')
                 ORDER BY bh.ngayBaoHong DESC
                 LIMIT 1
                ) AS trangThaiBaoHongHienTai
            FROM phong_thietbi ptb
            JOIN thietbi tb ON ptb.thietbi_id = tb.id
            JOIN thongtinthietbi tttb ON ptb.thongtinthietbi_id = tttb.id
            JOIN theloai tl ON tb.theloai_id = tl.id
            WHERE ptb.phong_id = ?`,
            [phong_id]
        );

        // Nếu không có thiết bị nào trong phòng
        if (results.length === 0) {
            return res.status(200).json({ message: "Phòng chưa có thiết bị nào!" });
        }

        // Trả về danh sách thiết bị
        res.json(results);
    } catch (error) {
        console.error("Lỗi lấy danh sách thiết bị trong phòng:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};



// Xóa thiết bị khỏi phòng và cập nhật tồn kho
exports.removeThietBiFromPhong = async (req, res) => {
    try {
        const { phong_id, thongtinthietbi_id } = req.body;

        if (!phong_id || !thongtinthietbi_id) {
            return res.status(400).json({ error: "Thiếu dữ liệu, vui lòng kiểm tra lại!" });
        }

        // Kiểm tra xem thiết bị có tồn tại trong phòng không
        const [existing] = await pool.query(
            "SELECT * FROM phong_thietbi WHERE phong_id = ? AND thongtinthietbi_id = ?",
            [phong_id, thongtinthietbi_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: "Thiết bị không tồn tại trong phòng này!" });
        }

        // Xóa thiết bị khỏi phòng
        await pool.query("DELETE FROM phong_thietbi WHERE phong_id = ? AND thongtinthietbi_id = ?", [phong_id, thongtinthietbi_id]);

        res.status(200).json({ message: "Xóa thiết bị khỏi phòng thành công!" });
    } catch (error) {
        console.error("Lỗi khi xóa thiết bị khỏi phòng:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};


