const pool = require("../config/db");


// Lấy danh sách nhân viên (Giữ nguyên)
exports.getNhanVien = async (req, res) => {
    const query = "SELECT id, hoTen FROM users WHERE role = 'nhanvien' AND tinhTrang = 'on'";
    try {
        const [results] = await pool.query(query);
        res.json(results);
    } catch (error) {
        console.error("Lỗi khi truy vấn nhân viên:", error);
        res.status(500).send("Lỗi máy chủ");
    }
};

// Lấy Lịch Trực 
exports.getAllLichTruc = async (req, res) => {
    // Cân nhắc lọc theo khoảng thời gian nếu dữ liệu lớn
    const { startDate, endDate } = req.query;
    let query = `SELECT * FROM lichtruc`;
    const params = [];

    if (startDate && endDate) {
        // TODO: Validate startDate and endDate format (YYYY-MM-DD)
        query += ` WHERE start_time >= ? AND start_time < ?`; // Lấy các ca bắt đầu trong khoảng
        params.push(`${startDate} 00:00:00`);
        // Thêm 1 ngày vào endDate để lấy hết các ca trong ngày cuối cùng
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        params.push(`${nextDay.toISOString().split('T')[0]} 00:00:00`);
    }
    query += ` ORDER BY start_time ASC`;

    try {
        const [results] = await pool.query(query, params);
        res.json(results);

    } catch (error) {
        console.error("Lỗi khi lấy lịch trực:", error);
        res.status(500).send("Lỗi máy chủ khi lấy lịch trực.");
    }
};

//Thêm MỘT Lịch Trực
exports.addLichTruc = async (req, res) => {
    const { nhanvien_id, caLamViec, start_time, end_time, trangThai, isSupporting, notes, phong_id } = req.body;

    // 1. Kiểm tra các giá trị bắt buộc
    if (!nhanvien_id || !caLamViec || !start_time || !end_time) {
        return res.status(400).send("Thiếu thông tin bắt buộc (nhanvien_id, caLamViec, start_time, end_time).");
    }

    // 2. Validate caLamViec (Chỉ còn Ca Sáng, Ca Chiều)
    if (caLamViec !== 'Ca Sáng' && caLamViec !== 'Ca Chiều') {
        return res.status(400).send("Giá trị caLamViec không hợp lệ.");
    }

    // 3. Parse và Validate Date ISO strings thành Date Objects
    const startDateObj = new Date(start_time);
    const endDateObj = new Date(end_time);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).send("Định dạng start_time hoặc end_time không hợp lệ.");
    }

    // 4. Chuẩn bị câu lệnh SQL
    const queryGetTenNhanVien = `SELECT hoTen FROM users WHERE id = ?`;
    const queryAddLichTruc = `
        INSERT INTO lichtruc (nhanvien_id, phong_id, caLamViec, start_time, end_time, trangThai, isSupporting, notes, tenNhanVien)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        // Lấy tên nhân viên
        const [resultTenNhanVien] = await pool.query(queryGetTenNhanVien, [nhanvien_id]);
        const tenNhanVien = resultTenNhanVien.length ? resultTenNhanVien[0].hoTen : null;
        if (!tenNhanVien) {
            return res.status(400).send("Nhân viên không tồn tại.");
        }

        // 5. Thực hiện INSERT (Truyền Date objects vào query)
        const [insertResult] = await pool.query(queryAddLichTruc, [
            nhanvien_id,
            phong_id || null,
            caLamViec,
            startDateObj, // Truyền Date object
            endDateObj,   // Truyền Date object
            trangThai || "Đang Chờ",
            isSupporting == true || isSupporting === 1 || isSupporting === '1' ? 1 : 0, // Đảm bảo là 0 hoặc 1
            notes || null,
            tenNhanVien
        ]);

        // 6. Trả về ID và thông báo thành công
        res.status(201).json({
            message: "Lịch trực được thêm thành công!",
            insertedId: insertResult.insertId
        });

    } catch (error) {
        console.error("Lỗi khi thêm lịch trực:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send("Lỗi: Lịch trực này có thể đã tồn tại.");
        }
        res.status(500).send("Lỗi máy chủ khi thêm lịch trực.");
    }
};

// --- API MỚI: Cập nhật MỘT Lịch Trực ---
exports.updateLichTruc = async (req, res) => {
    const { id } = req.params;
    const { nhanvien_id, caLamViec, start_time, end_time, trangThai, isSupporting, notes, tenNhanVien, phong_id } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).send("ID lịch trực không hợp lệ.");
    }

    // Validate caLamViec nếu có
    if (caLamViec && caLamViec !== 'Ca Sáng' && caLamViec !== 'Ca Chiều') {
        return res.status(400).send("Giá trị caLamViec không hợp lệ.");
    }

    // Xây dựng câu lệnh UPDATE động
    let queryUpdate = "UPDATE lichtruc SET ";
    const params = [];
    const fieldsToUpdate = [];

    const addField = (field, value) => {
        if (value !== undefined) {
             // Parse date nếu là start_time hoặc end_time
             if ((field === 'start_time' || field === 'end_time') && typeof value === 'string') {
                 const dateObj = new Date(value);
                 if (isNaN(dateObj.getTime())) {
                      // Có thể ném lỗi hoặc bỏ qua field này
                     console.warn(`Invalid date format for update (${field}): ${value}`);
                     return; // Bỏ qua trường không hợp lệ
                 }
                 fieldsToUpdate.push(`${field} = ?`);
                 params.push(dateObj); // Dùng Date object
             } else if (field === 'isSupporting') {
                  fieldsToUpdate.push(`${field} = ?`);
                  params.push(value == true || value === 1 || value === '1' ? 1 : 0); // Đảm bảo boolean/tinyint
             } else {
                 fieldsToUpdate.push(`${field} = ?`);
                 params.push(value);
             }
        }
    };

    addField('nhanvien_id', nhanvien_id);
    addField('caLamViec', caLamViec);
    addField('start_time', start_time);
    addField('end_time', end_time);
    addField('trangThai', trangThai);
    addField('isSupporting', isSupporting);
    addField('notes', notes === "" ? null : notes); // Lưu NULL nếu là chuỗi rỗng
    addField('tenNhanVien', tenNhanVien); // Có thể cần lấy lại tên nếu nhanvien_id thay đổi
    addField('phong_id', phong_id);

    if (fieldsToUpdate.length === 0) {
        return res.status(400).send("Không có thông tin nào để cập nhật.");
    }

    queryUpdate += fieldsToUpdate.join(", ");
    queryUpdate += " WHERE id = ?";
    params.push(id);

    try {
        const [result] = await pool.query(queryUpdate, params);

        if (result.affectedRows === 0) {
            return res.status(404).send("Không tìm thấy lịch trực để cập nhật.");
        }

        res.status(200).json({ message: "Cập nhật lịch trực thành công!", id: id });

    } catch (error) {
        console.error("Lỗi khi cập nhật lịch trực:", error);
        res.status(500).send("Lỗi máy chủ khi cập nhật lịch trực.");
    }
};

// --- API MỚI: Xóa MỘT Lịch Trực ---
exports.deleteLichTruc = async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).send("ID lịch trực không hợp lệ.");
    }

    const queryDelete = "DELETE FROM lichtruc WHERE id = ?";

    try {
        const [result] = await pool.query(queryDelete, [id]);

        if (result.affectedRows === 0) {
            // Có thể không phải lỗi nếu client gửi ID không tồn tại
            // return res.status(404).send("Không tìm thấy lịch trực để xóa.");
             console.log(`Record with ID ${id} not found for deletion.`);
        }

        res.status(200).json({ message: "Xóa lịch trực thành công (hoặc không tìm thấy)!", id: id });

    } catch (error) {
        console.error("Lỗi khi xóa lịch trực:", error);
        res.status(500).send("Lỗi máy chủ khi xóa lịch trực.");
    }
};


// --- API MỚI: Lưu Hàng Loạt Thay Đổi ---
exports.saveBulkChanges = async (req, res) => {
    const { added = [], updated = [], deleted = [] } = req.body;
    const connection = await pool.getConnection(); // Lấy connection để dùng transaction

    console.log("Bulk Save Received:", { added, updated, deleted }); // Log dữ liệu nhận được

    try {
        await connection.beginTransaction(); // Bắt đầu Transaction

        // --- 1. Xử lý Xóa ---
        if (deleted.length > 0) {
            const validDeletedIds = deleted.filter(id => id && !isNaN(parseInt(id))); // Lọc ID hợp lệ
            if(validDeletedIds.length > 0) {
                const deletePlaceholders = validDeletedIds.map(() => '?').join(',');
                const queryDelete = `DELETE FROM lichtruc WHERE id IN (${deletePlaceholders})`;
                const [deleteResult] = await connection.query(queryDelete, validDeletedIds);
                console.log(`Bulk Deleted ${deleteResult.affectedRows} records.`);
            } else {
                console.log("No valid IDs provided for deletion.");
            }
        }

        // --- 2. Xử lý Cập nhật ---
         if (updated.length > 0) {
             let updatedCount = 0;
             for (const item of updated) {
                 const { id, ...fields } = item;
                  if (id === undefined || isNaN(parseInt(id))) {
                     console.warn("Skipping update due to missing or invalid ID:", item);
                     continue;
                 }

                 const fieldEntries = Object.entries(fields).filter(([key, value]) => value !== undefined);
                 if (fieldEntries.length > 0) {
                     const params = [];
                     const setClause = fieldEntries.map(([key, value]) => {
                          if ((key === 'start_time' || key === 'end_time') && typeof value === 'string') {
                              const dateObj = new Date(value);
                              if (isNaN(dateObj.getTime())) return null; // Bỏ qua date không hợp lệ
                              params.push(dateObj);
                              return `${key} = ?`;
                          } else if (key === 'isSupporting') {
                              params.push(value == true || value === 1 || value === '1' ? 1 : 0);
                              return `${key} = ?`;
                          } else if (key === 'notes' && value === "") {
                               params.push(null); // Lưu NULL nếu notes rỗng
                               return `${key} = ?`;
                          } else {
                              params.push(value);
                              return `${key} = ?`;
                          }
                     }).filter(part => part !== null);

                     if (setClause.length > 0) {
                          params.push(id);
                          const queryUpdate = `UPDATE lichtruc SET ${setClause.join(', ')} WHERE id = ?`;
                           try {
                               const [result] = await connection.query(queryUpdate, params);
                               if (result.affectedRows > 0) updatedCount++;
                           } catch(updateError){
                                console.error(`Error updating record ID ${id}:`, updateError.message);
                                // Có thể ném lỗi để rollback hoặc chỉ log lỗi và tiếp tục
                                throw updateError; // Ném lỗi để rollback toàn bộ
                           }
                     }
                 }
             }
             console.log(`Bulk Updated ${updatedCount} records.`);
         }

        // --- 3. Xử lý Thêm mới ---
         let insertedInfo = []; // Lưu thông tin { tempId, newId } nếu cần
         if (added.length > 0) {
             // Lấy tên NV cho các bản ghi mới
             const employeeIds = [...new Set(added.map(item => item.nhanvien_id))].filter(id => id != null && !isNaN(id));
             let employeeMap = {};
              if (employeeIds.length > 0) {
                 const namePlaceholders = employeeIds.map(() => '?').join(',');
                 const queryGetNames = `SELECT id, hoTen FROM users WHERE id IN (${namePlaceholders})`;
                 const [empResults] = await connection.query(queryGetNames, employeeIds);
                 employeeMap = empResults.reduce((map, emp) => { map[emp.id] = emp.hoTen; return map; }, {});
             }

             const queryInsert = `
                 INSERT INTO lichtruc (nhanvien_id, phong_id, caLamViec, start_time, end_time, trangThai, isSupporting, notes, tenNhanVien)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             `;
             for (const item of added) {
                 if (!item.nhanvien_id || !item.caLamViec || !item.start_time || !item.end_time) {
                     throw new Error(`Thiếu thông tin bắt buộc cho bản ghi thêm mới: ${JSON.stringify(item)}`);
                 }
                 if (item.caLamViec !== 'Ca Sáng' && item.caLamViec !== 'Ca Chiều') {
                    throw new Error(`Ca làm việc không hợp lệ: ${item.caLamViec}`);
                 }
                 const startDateObj = new Date(item.start_time);
                 const endDateObj = new Date(item.end_time);
                 if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                      throw new Error(`Ngày giờ không hợp lệ: ${item.start_time} hoặc ${item.end_time}`);
                 }
                 const tenNhanVien = employeeMap[item.nhanvien_id] || 'Không rõ'; // Lấy tên NV

                 try {
                      const [result] = await connection.query(queryInsert, [
                          item.nhanvien_id, item.phong_id || null, item.caLamViec,
                          startDateObj, endDateObj, item.trangThai || 'Đang Chờ',
                          item.isSupporting == true || item.isSupporting === 1 || item.isSupporting === '1' ? 1 : 0,
                          item.notes === "" ? null : item.notes, // Lưu NULL nếu rỗng
                          tenNhanVien
                      ]);
                      // insertedIds.push(result.insertId);
                      // Nếu frontend cần map ID tạm thời với ID thật
                      if (item.id && String(item.id).startsWith('temp-')) {
                           insertedInfo.push({ tempId: item.id, newId: result.insertId });
                      } else {
                           insertedInfo.push({ newId: result.insertId });
                      }
                 } catch(insertError){
                      console.error(`Error adding record for NV ${item.nhanvien_id}:`, insertError.message);
                      // Ném lỗi để rollback
                      throw insertError;
                 }
             }
         }

        await connection.commit(); // Commit transaction
        res.status(200).json({
            message: "Lưu thay đổi thành công!",
            addedCount: added.length,
            updatedCount: updated.length, // Cần logic đếm chính xác hơn nếu bỏ qua lỗi
            deletedCount: deleted.length, // Số ID gửi lên, có thể khác số dòng thực tế bị xóa
            insertedInfo: insertedInfo // Trả về map ID tạm và ID thật
        });

    } catch (error) {
        await connection.rollback(); // Rollback nếu có bất kỳ lỗi nào
        console.error("Lỗi khi lưu hàng loạt thay đổi:", error);
        res.status(500).json({ message: `Lỗi máy chủ khi lưu thay đổi: ${error.message}` }); // Trả về lỗi dạng JSON
    } finally {
        connection.release(); // Luôn trả connection về pool
    }
};
