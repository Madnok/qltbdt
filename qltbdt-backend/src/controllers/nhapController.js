
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

    const connection = await db.getConnection(); // Mở kết nối DB
    try {
        await connection.beginTransaction(); // Bắt đầu transaction

        // Lấy họ tên người tạo từ userId
        const [userRows] = await connection.query("SELECT hoTen FROM users WHERE id = ?", [userId]);
        if (userRows.length === 0) {
            throw new Error("Người dùng không tồn tại!");
        }
        const nguoiTao = userRows[0].hoTen;

        // Chèn vào bảng `phieunhap`
        const [phieuNhapResult] = await connection.query(
            "INSERT INTO phieunhap (user_id, nguoiTao, truongHopNhap, ngayTao) VALUES (?, ?, ?, ?)",
            [userId, nguoiTao, truongHopNhap, ngayTao]
        );
        const phieuNhapId = phieuNhapResult.insertId; // ID phiếu nhập vừa tạo

        // Duyệt từng thiết bị trong danh sách
        if (danhSachThietBi && danhSachThietBi.length > 0) {
            for (const item of danhSachThietBi) {
                //Chèn vào `thongtinthietbi`
                await connection.query(
                    "INSERT INTO thongtinthietbi (thietbi_id, phieunhap_id, tenThietBi) VALUES (?, ?, ?)",
                    [item.thietbi_id, phieuNhapId, item.tenThietBi]
                );

                //Cập nhật số lượng trong `thietbi`
                await connection.query(
                    "UPDATE thietbi SET soLuong = soLuong + ?, donGia = donGia + ?,tonKho = tonKho + ? WHERE id = ?",
                    [item.soLuong, item.donGia, item.soLuong, item.thietbi_id]
                );
            }
        }

        await connection.commit(); // Xác nhận transaction
        res.json({ message: "Tạo phiếu nhập thành công!", phieunhapId: phieuNhapId });
    } catch (error) {
        await connection.rollback(); // Hoàn tác nếu có lỗi
        res.status(500).json({ error: error.message });
    } finally {
        connection.release(); // Đóng kết nối
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
                tb.soLuong, 
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
