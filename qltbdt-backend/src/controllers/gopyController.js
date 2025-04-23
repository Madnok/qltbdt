const pool = require("../config/db");


exports.createGopY = async (req, res) => {
    const { loaiGopY, noiDung, isAnonymous, hoTenNguoiGui, user_id: userIdFromBody } = req.body;

    let finalUserId = null;
    let senderName = "Ẩn Danh";

    if (!isAnonymous) {
        if (userIdFromBody) {
            finalUserId = userIdFromBody;
            try {
                const [userRows] = await pool.query("SELECT hoTen FROM users WHERE id = ?", [finalUserId]);
                if (userRows.length > 0) {
                    senderName = userRows[0].hoTen;
                } else {
                    senderName = hoTenNguoiGui || `Người dùng #${finalUserId}`;
                    return res.status(400).json({ error: "ID người dùng không hợp lệ." });
                }
            } catch (dbError) {
                senderName = hoTenNguoiGui || `Người dùng #${finalUserId}`;
            }

        } else if (hoTenNguoiGui) {
            senderName = hoTenNguoiGui;
            finalUserId = null;
        } else {
            return res.status(400).json({ error: "Thiếu thông tin người gửi." });
        }
    } else {
        finalUserId = null;
        senderName = "Ẩn Danh";
    }

    // --- Validation cơ bản ---
    if (!loaiGopY || !noiDung) {
        return res.status(400).json({ error: "Vui lòng cung cấp loại góp ý và nội dung." });
    }
    if (loaiGopY === 'Khác' && (!noiDung || noiDung.trim() === '')) {
        return res.status(400).json({ error: "Vui lòng nhập nội dung chi tiết khi chọn loại góp ý là 'Khác'." });
    }

    try {
        const query = `
            INSERT INTO gopy (loaiGopY, noiDung, isAnonymous, user_id, hoTenNguoiGui, ngayGopY, trangThai)
            VALUES (?, ?, ?, ?, ?, NOW(), 'Mới')
        `;
        const params = [
            loaiGopY,
            noiDung,
            Boolean(isAnonymous),
            finalUserId,
            senderName
        ];

        const [result] = await pool.query(query, params);

        res.status(201).json({ message: "Gửi góp ý thành công!", gopyId: result.insertId });

    } catch (error) {
        console.error("Lỗi khi tạo góp ý:", error);
        res.status(500).json({ error: "Không thể gửi góp ý." });
    }
};

exports.handleVote = async (req, res) => {
    const { id: gopy_id } = req.params;
    const { vote_type } = req.body; // 'like' or 'dislike'
    const user_id = req.user?.id; // Lấy ID nếu user đăng nhập
    const anonymous_voter_id = req.anonymous_voter_id; // Lấy từ middleware

    if (!['like', 'dislike'].includes(vote_type)) {
        return res.status(400).json({ error: "Loại vote không hợp lệ." });
    }

    if (!user_id && !anonymous_voter_id) {
        console.error(`[handleVote] Critical Error: No user_id and no anonymous_voter_id for gopy_id ${gopy_id}`);
        return res.status(500).json({ error: "Không thể xác định người vote." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Kiểm tra xem góp ý có tồn tại không
        const [gopyExists] = await connection.query("SELECT id FROM gopy WHERE id = ?", [gopy_id]);
        if (gopyExists.length === 0) {
            await connection.rollback(); // Không cần rollback nếu chỉ SELECT nhưng để cho an toàn
            return res.status(404).json({ error: "Không tìm thấy góp ý này." });
        }


        // 2. Kiểm tra vote hiện tại của người dùng này
        let existingVote = null;
        const checkVoteQuery = `
            SELECT id, vote_type FROM gopy_votes
            WHERE gopy_id = ? AND (` +
            // Ưu tiên user_id nếu có, nếu không thì dùng anonymous_voter_id
            (user_id ? `user_id = ?` : `anonymous_voter_id = ?`) +
            `) FOR UPDATE`; // Khóa dòng để tránh race condition
        const checkVoteParams = [gopy_id, user_id || anonymous_voter_id];
        const [existingVotes] = await connection.query(checkVoteQuery, checkVoteParams);

        if (existingVotes.length > 0) {
            existingVote = existingVotes[0];
        }

        let message = "";
        let targetCounter = vote_type === 'like' ? 'likes' : 'dislikes';
        let oppositeCounter = vote_type === 'like' ? 'dislikes' : 'likes';
        let gopyUpdateQuery = "";

        if (existingVote) {
            // Đã vote trước đó
            if (existingVote.vote_type === vote_type) {
                // Vote trùng -> Hủy vote
                await connection.query("DELETE FROM gopy_votes WHERE id = ?", [existingVote.id]);
                gopyUpdateQuery = `UPDATE gopy SET ${targetCounter} = GREATEST(0, ${targetCounter} - 1) WHERE id = ?`;
                message = "Đã hủy lượt vote.";
            } else {
                // Đổi vote
                await connection.query("UPDATE gopy_votes SET vote_type = ? WHERE id = ?", [vote_type, existingVote.id]);
                gopyUpdateQuery = `UPDATE gopy SET ${targetCounter} = ${targetCounter} + 1, ${oppositeCounter} = GREATEST(0, ${oppositeCounter} - 1) WHERE id = ?`;
                message = `Đã đổi thành ${vote_type}.`;
            }
        } else {
            // Vote lần đầu
            const insertVoteQuery = `
                INSERT INTO gopy_votes (gopy_id, user_id, anonymous_voter_id, vote_type)
                VALUES (?, ?, ?, ?)`;
            const insertVoteParams = [gopy_id, user_id || null, user_id ? null : anonymous_voter_id, vote_type];
            // Đảm bảo chỉ một trong user_id hoặc anonymous_voter_id được điền
            if (user_id) insertVoteParams[2] = null; else insertVoteParams[1] = null;
            await connection.query(insertVoteQuery, insertVoteParams);
            gopyUpdateQuery = `UPDATE gopy SET ${targetCounter} = ${targetCounter} + 1 WHERE id = ?`;
            message = `Đã ${vote_type} thành công.`;
        }

        // Cập nhật bộ đếm trong bảng gopy
        if (gopyUpdateQuery) {
            await connection.query(gopyUpdateQuery, [gopy_id]);
        }

        // Lấy số likes/dislikes mới nhất
        const [updatedGopy] = await connection.query("SELECT likes, dislikes FROM gopy WHERE id = ?", [gopy_id]);

        await connection.commit();

        res.status(200).json({
            message: message,
            likes: updatedGopy[0]?.likes ?? 0, // Trả về 0 nếu không tìm thấy (dù đã kiểm tra)
            dislikes: updatedGopy[0]?.dislikes ?? 0
        });

    } catch (error) {
        if (connection) await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            console.warn(`[handleVote] Duplicate vote attempt detected by DB for gopy_id ${gopy_id}, voter: ${user_id || anonymous_voter_id}`);
            try {
                const [currentVote] = await pool.query("SELECT vote_type FROM gopy_votes WHERE gopy_id = ? AND (" + (user_id ? `user_id = ?` : `anonymous_voter_id = ?`) + ")", [gopy_id, user_id || anonymous_voter_id]);
                const [counters] = await pool.query("SELECT likes, dislikes FROM gopy WHERE id = ?", [gopy_id]);
                if (currentVote.length > 0) {
                    return res.status(200).json({
                        message: `Bạn đã ${currentVote[0].vote_type} góp ý này rồi.`,
                        likes: counters[0]?.likes ?? 0,
                        dislikes: counters[0]?.dislikes ?? 0
                    });
                } else {
                    console.error(`[handleVote] DUP_ENTRY error but no existing vote found for gopy_id ${gopy_id}`);
                    return res.status(500).json({ error: "Lỗi khi xử lý vote (mã lỗi 1)." });
                }
            } catch (fetchError) {
                console.error(`[handleVote] Error fetching current vote state after DUP_ENTRY for gopy_id ${gopy_id}:`, fetchError);
                return res.status(500).json({ error: "Lỗi khi xử lý vote (mã lỗi 2)." });
            }
        }
        console.error(`[handleVote] Error voting for gopy_id ${gopy_id}:`, error);
        res.status(500).json({ error: "Lỗi khi xử lý vote." });
    } finally {
        if (connection) connection.release();
    }
};

exports.getPublicGopY = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Lấy danh sách góp ý công khai 
        const gopyQuery = `
            SELECT
                g.id, g.loaiGopY, g.noiDung, g.isAnonymous, g.hoTenNguoiGui, g.ngayGopY, g.trangThai,
                g.likes, g.dislikes
            FROM gopy g
            WHERE g.trangThai != 'Đã từ chối' AND g.is_publicly_visible = TRUE
            ORDER BY g.ngayGopY DESC
            LIMIT ? OFFSET ?
        `;
        const [gopyList] = await pool.query(gopyQuery, [limit, offset]);

        // Lấy tổng số góp ý công khai để tính toán phân trang
        const countQuery = "SELECT COUNT(*) as total FROM gopy WHERE trangThai != 'Đã từ chối' AND is_publicly_visible = TRUE";
        const [countResult] = await pool.query(countQuery);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);


        // (Tùy chọn) Lấy bình luận cho các góp ý trong trang hiện tại
        const gopyIds = gopyList.map(g => g.id);
        let comments = [];
        if (gopyIds.length > 0) {
            const commentsQuery = `
                SELECT
                    gc.id, gc.gopy_id, gc.noiDungBinhLuan, gc.thoiGianBinhLuan,
                    u.hoTen AS tenNguoiBinhLuan, u.role AS vaiTroNguoiBinhLuan
                FROM gopy_comments gc
                JOIN users u ON gc.user_id = u.id
                WHERE gc.gopy_id IN (?)
                ORDER BY gc.thoiGianBinhLuan ASC
            `;
            [comments] = await pool.query(commentsQuery, [gopyIds]);
        }

        // Gom bình luận vào từng góp ý
        const gopyWithComments = gopyList.map(gopy => ({
            ...gopy,
            hoTenNguoiGui: gopy.isAnonymous ? "Ẩn Danh" : gopy.hoTenNguoiGui,
            comments: comments.filter(comment => comment.gopy_id === gopy.id).map(c => ({
                id: c.id,
                noiDung: c.noiDungBinhLuan,
                thoiGian: c.thoiGianBinhLuan,
                nguoiBinhLuan: {
                    hoTen: c.tenNguoiBinhLuan,
                    role: c.vaiTroNguoiBinhLuan
                }
            }))
        }));

        res.status(200).json({
            data: gopyWithComments,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách góp ý công khai:", error);
        res.status(500).json({ error: "Không thể lấy danh sách góp ý." });
    }
};

exports.addComment = async (req, res) => {
    const { id: gopy_id } = req.params;
    const { noiDungBinhLuan } = req.body;
    const user_id = req.user?.id;

    if (!noiDungBinhLuan || noiDungBinhLuan.trim() === '') {
        return res.status(400).json({ error: "Nội dung bình luận không được để trống." });
    }

    try {
        const [gopyExists] = await pool.query("SELECT id FROM gopy WHERE id = ?", [gopy_id]);
        if (gopyExists.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy góp ý để bình luận." });
        }

        const query = `
            INSERT INTO gopy_comments (gopy_id, user_id, noiDungBinhLuan, thoiGianBinhLuan)
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await pool.query(query, [gopy_id, user_id, noiDungBinhLuan]);

        const [newComment] = await pool.query(`
             SELECT gc.id, gc.noiDungBinhLuan, gc.thoiGianBinhLuan, u.hoTen AS tenNguoiBinhLuan, u.role AS vaiTroNguoiBinhLuan
             FROM gopy_comments gc
             JOIN users u ON gc.user_id = u.id
            WHERE gc.id = ?
        `, [result.insertId]);


        res.status(201).json({
            message: "Thêm bình luận thành công!",
            comment: {
                id: newComment[0].id,
                noiDung: newComment[0].noiDungBinhLuan,
                thoiGian: newComment[0].thoiGianBinhLuan,
                nguoiBinhLuan: {
                    hoTen: newComment[0].tenNguoiBinhLuan,
                    role: newComment[0].vaiTroNguoiBinhLuan
                }
            }
        });

    } catch (error) {
        console.error("Lỗi khi thêm bình luận:", error);
        res.status(500).json({ error: "Không thể thêm bình luận." });
    }
};

exports.getAllGopYForAdmin = async (req, res) => {
    const { status, type, sort = 'ngayGopY', order = 'DESC' } = req.query;

    let query = `
           SELECT
                 g.id, g.loaiGopY, g.noiDung, g.isAnonymous,
                 g.user_id, COALESCE(u_submit.hoTen, g.hoTenNguoiGui) AS tenNguoiGuiThucTe,
                 g.ngayGopY, g.trangThai,
                 g.ghiChuNoiBo, g.likes, g.dislikes, g.is_publicly_visible
           FROM gopy g
           LEFT JOIN users u_submit ON g.user_id = u_submit.id -- Người gửi (nếu có)
           WHERE 1=1
     `;
    const params = [];

    if (status) {
        query += " AND g.trangThai = ?";
        params.push(status);
    }
    if (type) {
        query += " AND g.loaiGopY = ?";
        params.push(type);
    }

    // Sắp xếp an toàn
    const allowedSorts = ['ngayGopY', 'loaiGopY', 'trangThai', 'likes', 'dislikes', 'is_publicly_visible'];
    const sortColumn = allowedSorts.includes(sort) ? `g.${sort}` : 'g.ngayGopY';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    // Có thể thêm phân trang ở đây nếu danh sách quá lớn

    try {
        const [allGopY] = await pool.query(query, params);

        // Xử lý tên người gửi cuối cùng
        const results = allGopY.map(item => ({
            ...item,
            tenNguoiGui: item.isAnonymous ? "Ẩn Danh" : item.tenNguoiGuiThucTe,
            is_publicly_visible: Boolean(item.is_publicly_visible)
        }));


        res.status(200).json(results);

    } catch (error) {
        console.error("Lỗi khi lấy danh sách góp ý cho Admin:", error);
        res.status(500).json({ error: "Không thể lấy danh sách góp ý." });
    }
};

exports.updateGopY = async (req, res) => {
    const { id } = req.params;
    const { trangThai, ghiChuNoiBo, is_publicly_visible } = req.body;

    // Validation: Ít nhất phải có một trường để cập nhật
    if (trangThai === undefined && ghiChuNoiBo === undefined && is_publicly_visible === undefined) {
        return res.status(400).json({ error: "Không có thông tin nào để cập nhật." });
    }

    // Validation kiểu boolean cho is_publicly_visible
    if (is_publicly_visible !== undefined && typeof is_publicly_visible !== 'boolean') {
        return res.status(400).json({ error: "Giá trị 'Hiển thị công khai' không hợp lệ." });
    }

    // Validation: Kiểm tra giá trị hợp lệ 
    const validStatuses = ['Mới', 'Đang xử lý', 'Đã phản hồi', 'Đã từ chối'];
    if (trangThai && !validStatuses.includes(trangThai)) {
        return res.status(400).json({ error: `Trạng thái "${trangThai}" không hợp lệ.` });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Kiểm tra góp ý tồn tại
        const [gopyExists] = await connection.query("SELECT id FROM gopy WHERE id = ?", [id]);
        if (gopyExists.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Không tìm thấy góp ý để cập nhật." });
        }

        // 2. Xây dựng câu lệnh UPDATE động
        let updateQuery = "UPDATE gopy SET ";
        const updateParams = [];
        const fieldsToUpdate = [];

        if (trangThai !== undefined) {
            fieldsToUpdate.push("trangThai = ?");
            updateParams.push(trangThai);
        }
        if (ghiChuNoiBo !== undefined) {
            fieldsToUpdate.push("ghiChuNoiBo = ?");
            updateParams.push(ghiChuNoiBo);
        }
        if (is_publicly_visible !== undefined) {
            fieldsToUpdate.push("is_publicly_visible = ?");
            updateParams.push(is_publicly_visible ? 1 : 0);
            console.log(`[updateGopY ID: ${id}] Adding is_publicly_visible to update. Value:`, is_publicly_visible ? 1 : 0);
        }
        if (fieldsToUpdate.length === 0) {
            return res.status(200).json({ message: 'Không có gì thay đổi để cập nhật.' });
        }

        updateQuery += fieldsToUpdate.join(", ") + " WHERE id = ?";
        updateParams.push(id);

        // 3. Thực thi UPDATE
        const [updateResult] = await connection.query(updateQuery, updateParams);

        if (updateResult.affectedRows === 0) {
            console.warn(`[updateGopY] No rows affected for gopy_id ${id}. Might be no change or wrong ID.`);
            await connection.commit();
            return res.status(200).json({ message: "Không có thay đổi nào được thực hiện.", gopyId: id });
        }

        await connection.commit();

        // Lấy lại thông tin đã cập nhật để trả về
        const [updatedData] = await pool.query(`
            SELECT g.*, COALESCE(u_submit.hoTen, g.hoTenNguoiGui) AS tenNguoiGuiThucTe
            FROM gopy g
            LEFT JOIN users u_submit ON g.user_id = u_submit.id
           WHERE g.id = ?
        `, [id]);
        console.log(`[updateGopY ID: ${id}] Fetched updated data:`, updatedData[0]);

        res.status(200).json({
            message: "Cập nhật góp ý thành công!",
            updatedGopY: {
                ...updatedData[0],
                is_publicly_visible: Boolean(updatedData[0]?.is_publicly_visible),
                tenNguoiGui: updatedData[0].isAnonymous ? "Ẩn Danh" : updatedData[0].tenNguoiGuiThucTe,
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Lỗi khi cập nhật góp ý ID ${id}:`, error);
        res.status(500).json({ error: "Không thể cập nhật góp ý." });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteGopY = async (req, res) => {
    const { id } = req.params;
    const admin_id = req.user?.id; // Admin thực hiện xóa

    // Kiểm tra xem ID có hợp lệ không
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID góp ý không hợp lệ." });
    }

    console.log(`[deleteGopY] Admin ID ${admin_id} yêu cầu xóa góp ý ID: ${id}`);

    try {
        // Kiểm tra xem góp ý có tồn tại không trước khi xóa
        const [gopyExists] = await pool.query("SELECT id FROM gopy WHERE id = ?", [id]);
        if (gopyExists.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy góp ý để xóa." });
        }

        // Thực hiện xóa (Do đã có ON DELETE CASCADE trong SQL cho gopy_votes và gopy_comments,
        // chỉ cần xóa khỏi bảng gopy là các bảng kia tự động xóa theo)
        const [deleteResult] = await pool.query("DELETE FROM gopy WHERE id = ?", [id]);

        if (deleteResult.affectedRows > 0) {
            console.log(`[deleteGopY] Đã xóa thành công góp ý ID: ${id}`);
            res.status(200).json({ message: "Xóa góp ý thành công!", deletedId: parseInt(id) });
        } else {
            // Trường hợp này ít khi xảy ra nếu select ở trên thành công
            console.warn(`[deleteGopY] Không có dòng nào bị xóa cho ID: ${id} (có thể đã bị xóa trước đó)`);
            res.status(404).json({ error: "Không thể xóa góp ý hoặc góp ý không còn tồn tại." });
        }

    } catch (error) {
        console.error(`Lỗi khi xóa góp ý ID ${id}:`, error);
        // Bắt lỗi khóa ngoại nếu CASCADE chưa được thiết lập đúng
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Không thể xóa góp ý này vì còn dữ liệu liên quan." });
        }
        res.status(500).json({ error: "Lỗi máy chủ khi xóa góp ý." });
    }
};