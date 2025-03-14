
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

// Lấy ID phiếu nhập tiếp theo
exports.getNextPhieuNhapId = async (req, res) => {
    const query = "SELECT MAX(id) AS maxId FROM phieunhap";

    db.query(query, (err, result) => {
        if (err) {
            console.error("❌ Lỗi SQL lấy ID tiếp theo:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        console.log("📌 Kết quả MAX(id):", result); // 🛠 Debug log

        if (!result || result.length === 0 || result[0].maxId === null) {
            console.log("📌 Không có phiếu nhập nào, nextId = 1");
            return res.json({ nextPhieuNhapId: 1 });
        } else {
            console.log("📌 Next ID:", result[0].maxId + 1);
            return res.json({ nextPhieuNhapId: result[0].maxId + 1 });
        }
    });
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

        // Chèn danh sách thiết bị vào bảng `thongtinthietbi`
        if (danhSachThietBi && danhSachThietBi.length > 0) {
            const insertQuery = `
                INSERT INTO thongtinthietbi (thietbi_id, phieunhap_id, tenThietBi, tinhTrang) 
                VALUES ?
            `;

            const values = danhSachThietBi.map(item => [item.thietbi_id, phieuNhapId, item.tenThietBi, item.tinhTrang]);
            await connection.query(insertQuery, [values]);
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

// Lấy các thiết bị trong phiếu nhập
exports.getThietBiInPhieuNhap = async (req, res) => {
    const { phieuNhapId } = req.params;
    
    try {
        const [rows] = await db.execute(
            `SELECT 
                ttb.*, 
                pn.truongHopNhap 
            FROM thongtinthietbi ttb
            JOIN phieunhap pn ON ttb.phieunhap_id = pn.id
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
