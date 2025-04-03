
const pool = require("../config/db");
const axios = require("axios");

const validateForeignKeys = async (thietbi_id, thongtinthietbi_id, phong_id) => {
    if (thietbi_id) {
        const [rows] = await pool.query(
            `SELECT * FROM phong_thietbi WHERE thietbi_id = ? AND phong_id = ?`,
            [thietbi_id, phong_id]
        );
        if (rows.length === 0) return false; // Không khớp thietbi_id và phong_id
    }

    if (thongtinthietbi_id) {
        const [rowsThongTin] = await pool.query(
            `SELECT * FROM thongtinthietbi WHERE id = ?`,
            [thongtinthietbi_id]
        );
        if (rowsThongTin.length === 0) return false; // Không tồn tại thongtinthietbi_id
    }

    return true; // Các giá trị hợp lệ
};

exports.postGuiBaoHong = async (req, res) => {
    const {
        devices,
        phong_id,
        user_id,
        thiethai,
        moTa,
        hinhAnh,
        loaithiethai,
    } = req.body;

    try {
        // Lưu thông tin báo hỏng chung nếu devices rỗng
        if (devices.length === 0) {
            const [result] = await pool.query(`
                INSERT INTO baohong 
                (phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [phong_id, user_id || null, thiethai, moTa, hinhAnh || null, loaithiethai]);

            return res.status(201).json({ message: "Báo hỏng thành công!", id: result.insertId });
        }

        // Xử lý nếu có devices
        const insertPromises = devices.map(({ thietbi_id, thongtinthietbi_id }) =>
            pool.query(`
                INSERT INTO baohong 
                (thietbi_id, thongtinthietbi_id, phong_id, user_id, thiethai, moTa, hinhAnh, loaithiethai, ngayBaoHong)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                thietbi_id || null,
                thongtinthietbi_id || null,
                phong_id,
                user_id || null,
                thiethai,
                moTa,
                hinhAnh || null,
                loaithiethai,
            ])
        );

        await Promise.all(insertPromises);

        res.status(201).json({ message: "Báo hỏng thành công!" });
    } catch (error) {
        console.error("Lỗi khi lưu báo hỏng:", error);
        res.status(500).json({ error: "Không thể lưu báo hỏng." });
    }
};


exports.getThongTinBaoHong = async (req, res) => {
    try {
        // Lấy thông tin từ bảng baohong
        const [baoHongRows] = await pool.query(`
            SELECT 
                baohong.id,
                baohong.thietbi_id,
                baohong.thongtinthietbi_id,
                baohong.phong_id,
                baohong.user_id,
                baohong.thiethai,
                baohong.moTa,
                baohong.hinhAnh,
                baohong.loaithiethai,
                baohong.mucDoUuTien,
                baohong.ngayBaoHong,
                baohong.trangThai
            FROM baohong
            ORDER BY baohong.ngayBaoHong DESC
        `);

        // Gọi API /phonglist để lấy danh sách phòng
        const phongListResponse = await axios.get("http://localhost:5000/api/phong/phonglist");
        const phongList = phongListResponse.data;

        // Kết hợp dữ liệu để thêm tên phòng vào danh sách báo hỏng
        const baoHongData = baoHongRows.map((item) => {
            const phong = phongList.find(p => p.id === item.phong_id);
            return {
                ...item,
                phong_name: phong ? phong.phong : "Không xác định" // Thêm tên phòng
            };
        });

        res.status(200).json(baoHongData);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin báo hỏng:", error);
        res.status(500).json({ error: "Không thể lấy thông tin báo hỏng." });
    }
};
