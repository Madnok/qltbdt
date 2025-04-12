
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
    const phieuNhapId = parseInt(id);
    if (isNaN(phieuNhapId)) {
        return res.status(400).json({ error: "ID Phiếu nhập không hợp lệ." });
    }

    try {
        // Query 1: Lấy thông tin phiếu nhập
        const [phieuNhapRows] = await db.query("SELECT pn.*, u.hoTen as nguoiTao, pn.danhSachChungTu FROM phieunhap pn LEFT JOIN users u ON pn.user_id = u.id WHERE pn.id = ?", [id]);
        if (phieuNhapRows.length === 0) {
            return res.status(404).json({ error: "Phiếu nhập không tồn tại" });
        }
        const phieuNhap = phieuNhapRows[0];

        // Query 2: Lấy danh sách thiết bị thuộc phiếu nhập
        const queryThietBi = `
        SELECT
            tttb.*, -- Lấy tất cả các cột từ thongtinthietbi
            tb.tenThietBi,
            tb.donGia
        FROM thongtinthietbi tttb
        LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id -- Join với bảng thietbi
        WHERE tttb.phieunhap_id = ?
        ORDER BY tttb.id ASC; -- Sắp xếp theo ID tăng dần (hoặc tiêu chí khác)
        `;

        const [thietBiRows] = await db.query(queryThietBi, [phieuNhapId]);

        // Xử lý danhSachChungTu
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

// Hàm upload chứng từ cho Phiếu Nhập
exports.uploadChungTuNhap = async (req, res) => {
    const { id } = req.params;
    const files = req.files;


    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Không có file nào được chọn.' });
    }


    try {
        const [phieuCheck] = await db.query("SELECT danhSachChungTu FROM phieunhap WHERE id = ?", [id]);
        if (phieuCheck.length === 0) {
            return res.status(404).json({ error: 'Phiếu nhập không tồn tại.' });
        }


        const uploadedUrls = files.map(file => file.path);


        let existingUrls = [];
        if (phieuCheck[0].danhSachChungTu) {
            try {
                if (typeof phieuCheck[0].danhSachChungTu === 'string') {
                    existingUrls = JSON.parse(phieuCheck[0].danhSachChungTu);
                } else if (Array.isArray(phieuCheck[0].danhSachChungTu)) {
                    existingUrls = phieuCheck[0].danhSachChungTu;
                } else {
                    existingUrls = [];
                }
            } catch (parseError) {
                console.error("Lỗi parse JSON danhSachChungTu cũ:", parseError);
                existingUrls = [];
            }
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
        res.status(500).json({ error: error.message || 'Lỗi máy chủ khi upload chứng từ.' });
    }
};

