const pool = require("../config/db");
const { getIoInstance } = require('../socket');

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
        const [rows] = await pool.query("SELECT * FROM phong");
        const phongList = rows.map(p => ({
            id: p.id,
            phong: `${p.toa}${p.tang}.${p.soPhong}`,
            chucNang: p.chucNang
        }));
        res.json(phongList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//  Lấy danh sách phòng có tài sản
exports.getListPhongCoTaiSan = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.toa, p.tang, p.soPhong, p.chucNang
            FROM phong p
            WHERE EXISTS (
                SELECT 1
                FROM thongtinthietbi tttb
                WHERE tttb.phong_id = p.id
            )
            ORDER BY p.toa, p.tang, p.soPhong;
        `;

        const [rows] = await pool.query(sql);

        const phongList = rows.map(p => ({
            id: p.id,
            phong: `${p.toa}${p.tang}.${p.soPhong}`,
            chucNang: p.chucNang
        }));

        res.json(phongList);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách phòng có tài sản:", error);
        res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu: " + error.message });
    }
};

// Lấy Danh Sách Thiết Bị Trong Phòng
exports.getThietBiTrongPhong = async (req, res) => {
    const phongIdParam = req.params.id || req.params.phong_id; // Lấy ID phòng từ URL

    if (!phongIdParam) {
        return res.status(400).json({ error: "Thiếu ID phòng!" });
    }

    // Chuyển đổi sang số nguyên một cách an toàn
    const phong_id = parseInt(phongIdParam, 10);
    if (isNaN(phong_id)) {
        return res.status(400).json({ error: "ID phòng không hợp lệ." });
    }

    try {
        const query = `
            SELECT tttb.id AS thongtinthietbi_id, tttb.tinhTrang, tb.tenThietBi AS tenLoaiThietBi, tl.theLoai AS tenTheLoai, bh_latest.trangThai AS trangThaiBaoHongHienTai
             FROM thongtinthietbi tttb
             LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
             LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            LEFT JOIN (
                SELECT
                    bh.thongtinthietbi_id,
                    bh.trangThai,
                    ROW_NUMBER() OVER(PARTITION BY bh.thongtinthietbi_id ORDER BY bh.ngayBaoHong DESC, bh.id DESC) as rn
                FROM baohong bh
                WHERE bh.trangThai != 'Hoàn Thành'
            ) bh_latest ON tttb.id = bh_latest.thongtinthietbi_id AND bh_latest.rn = 1
            WHERE
                tttb.phong_id = ?
            ORDER BY
                tl.theLoai, tb.tenThietBi, tttb.id; -- Giữ nguyên ORDER BY cũ của bạn
        `;

        const [thietBiList] = await pool.query(query, [phong_id]);
        // Trả về mảng rỗng nếu không có
        res.status(200).json(thietBiList || []);

    } catch (error) {
        console.error("Lỗi lấy danh sách thiết bị trong phòng:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};

// Xóa thiết bị khỏi phòng
exports.thuHoiTaiSanKhoiPhong = async (req, res) => {
    const { phong_id, thongtinthietbi_id } = req.body;

    // --- Input Validation ---
    if (!phong_id || !thongtinthietbi_id || isNaN(parseInt(phong_id, 10)) || isNaN(parseInt(thongtinthietbi_id, 10))) {
        return res.status(400).json({ error: "Thiếu hoặc sai định dạng ID phòng hoặc ID tài sản." });
    }
    const phongIdInt = parseInt(phong_id, 10);
    const tttbIdInt = parseInt(thongtinthietbi_id, 10);
    // ------------------------

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // --- Kiểm tra tài sản trong bảng thongtinthietbi ---
        const [rows] = await connection.query(
            'SELECT phong_id FROM thongtinthietbi WHERE id = ? FOR UPDATE', // Chỉ cần lấy phong_id để kiểm tra
            [tttbIdInt]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: `Không tìm thấy tài sản với ID ${tttbIdInt}.` });
        }

        const taiSan = rows[0];

        // Kiểm tra xem tài sản có đúng là thuộc phòng này không
        if (taiSan.phong_id !== phongIdInt) {
            await connection.rollback();
            return res.status(400).json({ error: `Tài sản ID ${tttbIdInt} không thực sự thuộc phòng ID ${phongIdInt}.` });
        }
        // ----------------------------------------------------

        // --- Chỉ Cập nhật phong_id = NULL ---
        const [updateResult] = await connection.query(
            'UPDATE thongtinthietbi SET phong_id = NULL WHERE id = ?', // Bỏ cập nhật tinhTrang
            [tttbIdInt]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            throw new Error(`Không thể cập nhật thông tin thu hồi cho tài sản ID ${tttbIdInt}.`);
        }
        // -----------------------------------

        await connection.commit();

        try {
            const io = getIoInstance();
            if (io) {
                io.emit('stats_updated', { type: 'thietbi' }); // Số lượng TB theo phòng/kho thay đổi
                console.log(`[thuHoiTaiSanKhoiPhong TTTB_ID: ${tttbIdInt}] Emitted stats_updated (type: thietbi).`);
            }
        } catch (socketError) {
            console.error(`[thuHoiTaiSanKhoiPhong TTTB_ID: ${tttbIdInt}] Socket emit error:`, socketError);
        }

        res.status(200).json({ message: `Đã thu hồi tài sản ID ${tttbIdInt} thành công!` });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi khi thu hồi tài sản khỏi phòng:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ khi thu hồi tài sản." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Xóa NHIỀU thiết bị khỏi phòng
exports.thuHoiNhieuTaiSanKhoiPhong = async (req, res) => {
    const list = req.body.list;
    if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ error: "Danh sách thiết bị không hợp lệ." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of list) {
            const { thongtinthietbi_id, phong_id } = item;

            const [rows] = await connection.query(
                "SELECT phong_id FROM thongtinthietbi WHERE id = ? FOR UPDATE",
                [thongtinthietbi_id]
            );

            if (!rows.length || rows[0].phong_id !== phong_id) continue;

            await connection.query(
                "UPDATE thongtinthietbi SET phong_id = NULL WHERE id = ?",
                [thongtinthietbi_id]
            );
        }

        await connection.commit();

        try {
            const io = getIoInstance();
            if (io) {
                io.emit('stats_updated', { type: 'thietbi' }); 
            }
        } catch (socketError) {
            console.error(`[thuHoiTaiSanKhoiPhong TTTB_ID: ${tttbIdInt}] Socket emit error:`, socketError);
        }

        res.json({ message: `Đã gỡ ${list.length} thiết bị khỏi phòng.` });
    } catch (err) {
        await connection.rollback();
        console.error("Lỗi thu hồi nhiều thiết bị:", err);
        res.status(500).json({ error: "Lỗi thu hồi nhiều thiết bị." });
    } finally {
        connection.release();
    }
};
