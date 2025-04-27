
const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const path = require('path');
const { getIoInstance } = require('../socket');

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
    // Lấy dữ liệu từ body theo cấu trúc payload mới từ FormNhap gộp
    const { truongHopNhap, ghiChu, chiTietItems } = req.body;
    const user_id = req.user?.id; // Lấy ID người dùng đã xác thực

    // --- Validation Đầu vào ---
    if (!user_id) {
        return res.status(401).json({ error: "Yêu cầu xác thực người dùng." });
    }
    const validTruongHop = ['taiTro', 'muaMoi'];
    if (!truongHopNhap || !validTruongHop.includes(truongHopNhap)) {
        return res.status(400).json({ error: "Trường hợp nhập không hợp lệ." });
    }
    if (!Array.isArray(chiTietItems) || chiTietItems.length === 0) {
        return res.status(400).json({ error: "Yêu cầu ít nhất một chi tiết thiết bị." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Lấy họ tên người tạo từ user_id
        const [userRows] = await connection.query("SELECT hoTen FROM users WHERE id = ?", [user_id]);
        if (userRows.length === 0) throw new Error("Người dùng không tồn tại!");
        const nguoiTao = userRows[0].hoTen;

        // 2. Chèn vào bảng `phieunhap`
        const phieuNhapQuery = `
            INSERT INTO phieunhap (user_id, nguoiTao, ngayTao, truongHopNhap, ghiChu, danhSachChungTu)
            VALUES (?, ?, NOW(), ?, ?, NULL) -- ngayTao dùng NOW(), danhSachChungTu sẽ update sau
        `;
        const phieuNhapParams = [user_id, nguoiTao, truongHopNhap, ghiChu || null];
        const [phieuNhapResult] = await connection.query(phieuNhapQuery, phieuNhapParams);
        const newPhieuNhapId = phieuNhapResult.insertId;

        if (!newPhieuNhapId) {
            throw new Error("Không thể tạo phiếu nhập!");
        }
        console.log(`[createPhieuNhapWithDetails] Created phieunhap ID: ${newPhieuNhapId}`);

        // 3. Duyệt danh sách chi tiết thiết bị và chèn vào `thongtinthietbi`
        const insertTTTBPromises = [];
        let totalTTTBCreated = 0;

        for (const item of chiTietItems) {
            // --- Validation cho từng item chi tiết ---
            if (!item.thietbi_id || isNaN(parseInt(item.thietbi_id))) throw new Error("Dữ liệu chi tiết thiếu hoặc sai ID Loại Thiết Bị.");
            const soLuongNum = parseInt(item.soLuong, 10);
            if (isNaN(soLuongNum) || soLuongNum < 1) throw new Error(`Số lượng không hợp lệ cho thiết bị ID ${item.thietbi_id}.`);
            const giaTriBanDauNum = parseFloat(item.giaTriBanDau);
            if (isNaN(giaTriBanDauNum) || giaTriBanDauNum < 0) throw new Error(`Giá trị ban đầu không hợp lệ cho thiết bị ID ${item.thietbi_id}.`);
            const thoiGianBHNum = parseInt(item.thoiGianBaoHanh, 10);
            if (isNaN(thoiGianBHNum) || thoiGianBHNum < 0) throw new Error(`Thời gian bảo hành không hợp lệ cho thiết bị ID ${item.thietbi_id}.`);
            // Parse ngày mua, cho phép null
            let ngayMuaParsed = null;
            if (item.ngayMua) {
                // Thêm validation ngày hợp lệ nếu cần
                 try {
                     ngayMuaParsed = new Date(item.ngayMua).toISOString().slice(0, 10); // Format YYYY-MM-DD
                 } catch (dateError) {
                     throw new Error(`Ngày mua không hợp lệ cho thiết bị ID ${item.thietbi_id}.`);
                 }
            }

            // Lấy tenThietBi từ bảng thietbi
            const [thietBiInfo] = await connection.query("SELECT tenThietBi FROM thietbi WHERE id = ?", [item.thietbi_id]);
            if (thietBiInfo.length === 0) throw new Error(`Không tìm thấy loại thiết bị với ID ${item.thietbi_id}.`);
            const tenThietBi = thietBiInfo[0].tenThietBi;

            // Lặp lại `soLuongNum` lần để tạo bản ghi TTTB
            for (let i = 0; i < soLuongNum; i++) {
                // Tính ngày kết thúc bảo hành
                let ngayKetThucBH = null;
                if (ngayMuaParsed && thoiGianBHNum > 0) {
                    try {
                        let endDate = new Date(ngayMuaParsed);
                        endDate.setMonth(endDate.getMonth() + thoiGianBHNum);
                        ngayKetThucBH = endDate.toISOString().slice(0, 10);
                    } catch(dateCalcError) {
                        console.error("Error calculating warranty end date:", dateCalcError);
                    }
                }

                // Query INSERT cho thongtinthietbi
                const insertTTTBQuery = `
                    INSERT INTO thongtinthietbi
                    (thietbi_id, phieunhap_id, ngayMua, giaTriBanDau, tinhTrang, thoiGianBaoHanh, ngayBaoHanhKetThuc, tenThietBi)
                    VALUES (?, ?, ?, ?, 'con_bao_hanh', ?, ?, ?)
                `;

                const tttbParams = [
                    item.thietbi_id,
                    newPhieuNhapId,
                    ngayMuaParsed,
                    giaTriBanDauNum,
                    thoiGianBHNum,
                    ngayKetThucBH,
                    tenThietBi 
                ];
                insertTTTBPromises.push(connection.query(insertTTTBQuery, tttbParams));
                totalTTTBCreated++;
            }
        } 

        // Thực thi tất cả các lệnh INSERT TTTB
        await Promise.all(insertTTTBPromises);
        console.log(`[createPhieuNhapWithDetails] Inserted ${totalTTTBCreated} thongtinthietbi records.`);

        // 4. Commit transaction
        await connection.commit();
        console.log(`[createPhieuNhapWithDetails] Transaction committed for PhieuNhap ID ${newPhieuNhapId}.`);
        try {
            const io = getIoInstance();
            if (io) {
                io.emit('stats_updated', { type: 'phieu' }); // Số lượng phiếu nhập thay đổi
                io.emit('stats_updated', { type: 'thietbi' }); // Số lượng/trạng thái TB thay đổi
                io.emit('stats_updated', { type: 'taichinh' }); // Giá trị tài sản thay đổi
                console.log(`[createPhieuNhap ID: ${newPhieuNhapId}] Emitted stats_updated (types: phieu, thietbi, taichinh).`);
            }
        } catch (socketError) {
             console.error(`[createPhieuNhap ID: ${newPhieuNhapId}] Socket emit error:`, socketError);
        }
        // 5. Trả về kết quả thành công 
        res.status(201).json({
            message: `Tạo phiếu nhập và ${totalTTTBCreated} chi tiết thiết bị thành công!`,
            phieuNhapId: newPhieuNhapId 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Lỗi khi tạo phiếu nhập và chi tiết:", error);
        res.status(error.message.includes("không tồn tại") ? 404 : (error.message.includes("không hợp lệ") ? 400 : 500))
           .json({ error: error.message || "Lỗi máy chủ khi xử lý phiếu nhập." });
    } finally {
        if (connection) connection.release();
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
exports.uploadChungTuNhapAPI = async (req, res) => {
     const { phieuNhapId } = req.params;
     const files = req.files; 

     if (!phieuNhapId || isNaN(parseInt(phieuNhapId))) return res.status(400).json({ error: "ID phiếu nhập không hợp lệ." });
     if (!files || files.length === 0) return res.status(400).json({ error: "Không có file nào được tải lên." });

     let connection;
     try {
         connection = await db.getConnection();
         await connection.beginTransaction();

         // Lấy danh sách chứng từ hiện có
         const [pnCheck] = await connection.query("SELECT danhSachChungTu FROM phieunhap WHERE id = ? FOR UPDATE", [phieuNhapId]);
         if (pnCheck.length === 0) throw new Error(`Phiếu nhập ID ${phieuNhapId} không tồn tại.`);

         let existingChungTu = [];
         try {
             existingChungTu = pnCheck[0].danhSachChungTu ? JSON.parse(pnCheck[0].danhSachChungTu) : [];
             if (!Array.isArray(existingChungTu)) existingChungTu = [];
         } catch (e) { existingChungTu = []; }

         if (existingChungTu.length >= 5) {
             throw new Error("Đã đạt số lượng chứng từ tối đa (5 file).");
         }

         // Upload file mới lên Cloudinary
         const uploadPromises = files.map(async file => {
            const filePath = file.path;
            try {
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: 'nhapxuat_documents',
                    resource_type: 'auto'
                });
                return result;
            } finally {
            }
        });

         const uploadResults = await Promise.all(uploadPromises);
         const newUrls = uploadResults.map(result => result.secure_url);

         // Cập nhật danh sách trong DB
         const updatedChungTuList = [...existingChungTu, ...newUrls].slice(0, 5); // Giới hạn 5 file
         await connection.query("UPDATE phieunhap SET danhSachChungTu = ? WHERE id = ?", [JSON.stringify(updatedChungTuList), phieuNhapId]);

         await connection.commit();
         res.status(200).json({ message: `Đã upload thành công ${newUrls.length} chứng từ.`, fileUrls: updatedChungTuList });

     } catch (error) {
         if (connection) await connection.rollback();
         console.error(`Lỗi khi upload chứng từ cho phiếu nhập ID ${phieuNhapId}:`, error);
         res.status(500).json({ error: error.message || "Lỗi máy chủ khi upload chứng từ." });
     } finally {
         if (connection) connection.release();
     }
};

