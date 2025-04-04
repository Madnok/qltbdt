const pool = require("../config/db");

// Lấy danh sách phòng phụ trách theo ID nhân viên
exports.getPhuTrachByNhanVien = async (req, res) => {
    const { id } = req.params;
     if (!id || isNaN(parseInt(id))) { }
    try {
        const [rows] = await pool.query(
            `SELECT p.id, p.toa, p.tang, p.soPhong
             FROM nhanvien_phong_phutrach npp
             JOIN phong p ON npp.phong_id = p.id
             WHERE npp.nhanvien_id = ?`,
            [id]
        );

        // **KIỂM TRA KỸ BƯỚC NÀY:** Mapping để tạo tên phòng
        const phongList = rows.map(p => {
             const tenPhong = `${p.toa}${p.tang}.${p.soPhong}`;

             return {
                 id: p.id,
                 phong: tenPhong
             };
        });

        res.json(phongList);

    } catch (error) {
        console.error(`Lỗi khi lấy danh sách phòng phụ trách cho nhân viên ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy dữ liệu phân công." });
    }
};

// Thêm phân công phòng cho nhân viên
exports.addPhuTrach = async (req, res) => {
    const { id } = req.params; // ID nhân viên
    const { phongIds } = req.body; // Mảng các ID phòng cần gán

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID nhân viên không hợp lệ." });
    }
    if (!Array.isArray(phongIds) || phongIds.length === 0) {
        return res.status(400).json({ error: "Danh sách ID phòng không hợp lệ." });
    }

    // Lọc ra các ID phòng hợp lệ (là số)
    const validPhongIds = phongIds.filter(pid => pid && !isNaN(parseInt(pid)));
    if (validPhongIds.length === 0) {
        return res.status(400).json({ error: "Không có ID phòng hợp lệ nào được cung cấp." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const values = validPhongIds.map(phongId => [id, phongId]); // Tạo mảng giá trị [ [nhanvien_id, phong_id1], [nhanvien_id, phong_id2], ... ]

        // Dùng INSERT IGNORE để bỏ qua nếu đã tồn tại phân công (do UNIQUE KEY)
        // Hoặc bạn có thể xóa hết phân công cũ rồi insert mới nếu muốn ghi đè hoàn toàn
        const [result] = await connection.query(
            `INSERT IGNORE INTO nhanvien_phong_phutrach (nhanvien_id, phong_id) VALUES ?`,
            [values] // Truyền mảng 2 chiều vào đây
        );

        await connection.commit();
        res.status(201).json({ message: `Đã thêm ${result.affectedRows} phân công mới thành công.` });

    } catch (error) {
        await connection.rollback();
        console.error(`Lỗi khi thêm phân công cho nhân viên ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi thêm phân công." });
    } finally {
        connection.release();
    }
};

// Xóa phân công phòng của nhân viên
exports.removePhuTrach = async (req, res) => {
    const { id } = req.params; // ID nhân viên
    const { phongIds } = req.body; // Mảng các ID phòng cần xóa phân công

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID nhân viên không hợp lệ." });
    }
    if (!Array.isArray(phongIds) || phongIds.length === 0) {
        return res.status(400).json({ error: "Danh sách ID phòng không hợp lệ." });
    }

    const validPhongIds = phongIds.filter(pid => pid && !isNaN(parseInt(pid)));
     if (validPhongIds.length === 0) {
        return res.status(400).json({ error: "Không có ID phòng hợp lệ nào được cung cấp." });
    }

    try {
        // Tạo placeholders (?) cho danh sách ID phòng
        const placeholders = validPhongIds.map(() => '?').join(',');

        const [result] = await pool.query(
            `DELETE FROM nhanvien_phong_phutrach WHERE nhanvien_id = ? AND phong_id IN (${placeholders})`,
            [id, ...validPhongIds] // Truyền ID nhân viên và các ID phòng
        );

        if (result.affectedRows === 0) {
            // Có thể không tìm thấy bản ghi nào để xóa
            return res.status(404).json({ message: "Không tìm thấy phân công nào để xóa hoặc các ID phòng không chính xác." });
        }

        res.json({ message: `Đã xóa ${result.affectedRows} phân công thành công.` });

    } catch (error) {
        console.error(`Lỗi khi xóa phân công cho nhân viên ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi xóa phân công." });
    }
};

// (Tùy chọn) Lấy danh sách nhân viên phụ trách theo ID phòng
exports.getPhuTrachByPhong = async (req, res) => {
    const { id } = req.params; // Lấy ID phòng từ URL
     if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID phòng không hợp lệ." });
    }
    try {
        // Lấy danh sách nhân viên phụ trách phòng này
        const [rows] = await pool.query(
            `SELECT u.id, u.hoTen
             FROM nhanvien_phong_phutrach npp
             JOIN users u ON npp.nhanvien_id = u.id
             WHERE npp.phong_id = ? AND u.role = 'nhanvien'`, // Đảm bảo chỉ lấy nhân viên
            [id]
        );
        res.json(rows);
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách nhân viên phụ trách phòng ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy dữ liệu phân công." });
    }
};