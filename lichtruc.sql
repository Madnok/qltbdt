CREATE TABLE lichtruc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nhanvien_id INT NOT NULL,                       -- ID nhân viên trực
    phong_id INT NOT NULL,                          -- ID khu vực/phòng trực
    caLamViec ENUM('Sáng', 'Chiều', 'Tối') NOT NULL, -- Ca trực
    start_time TIMESTAMP NOT NULL,                 -- Thời gian bắt đầu
    end_time TIMESTAMP NOT NULL,                   -- Thời gian kết thúc
    trangThai ENUM('Đang Chờ', 'Đang Thực Hiện', 'Hoàn Thành') DEFAULT 'Đang Chờ', -- Trạng thái
    isSupporting BOOLEAN DEFAULT FALSE,            -- Nhân viên có hỗ trợ khu vực khác không
    notes TEXT DEFAULT NULL,                       -- Ghi chú
    FOREIGN KEY (nhanvien_id) REFERENCES users(id), -- Liên kết đến bảng users
    FOREIGN KEY (phong_id) REFERENCES phong(id)     -- Liên kết đến bảng phòng
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
