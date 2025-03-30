CREATE TABLE baohong (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thietbi_id INT NOT NULL,
    thongtinthietbi_id INT NOT NULL,
    phong_id INT NOT NULL,
    userid INT DEFAULT NULL,
    thiethai ENUM('Nhẹ', 'Vừa', 'Nặng') NOT NULL,
    moTa TEXT,
    hinhAnh VARCHAR(255) DEFAULT NULL,
    tinhTrang ENUM('Tốt', 'Đang Xử Lý') DEFAULT 'Tốt',
    ngayBaoHong TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thietbi_id) REFERENCES thietbi(id),
    FOREIGN KEY (thongtinthietbi_id) REFERENCES thongtinthietbi(id),
    FOREIGN KEY (phong_id) REFERENCES phong(id),
    FOREIGN KEY (userid) REFERENCES users(id)
);
ALTER TABLE baohong
MODIFY thongtinthietbi_id INT DEFAULT NULL;

select * from baohong
DELIMITER $$

CREATE TRIGGER trg_baohong_check_moTa_update
BEFORE UPDATE ON baohong
FOR EACH ROW
BEGIN
    IF NEW.loaithiethai IN ('Kết Cấu', 'Khác') AND (NEW.moTa IS NULL OR NEW.moTa = '') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mô tả bắt buộc khi loại thiệt hại là Kết Cấu hoặc Khác.';
    END IF;
END$$

DELIMITER ;

ALTER TABLE baohong
ADD nhanvien_id INT DEFAULT NULL,                                -- ID nhân viên xử lý
ADD thoiGianXuLy TIMESTAMP NULL DEFAULT NULL,                     -- Thời gian xử lý xong
ADD trangThai ENUM('Chờ Duyệt', 'Đang Xử Lý', 'Hoàn Thành') DEFAULT 'Chờ Duyệt', -- Trạng thái xử lý đơn
ADD mucDoUuTien ENUM('Cao', 'Trung Bình', 'Thấp') DEFAULT 'Trung Bình',         -- Mức độ ưu tiên
ADD FOREIGN KEY (nhanvien_id) REFERENCES users(id);             -- Liên kết nhân viên xử lý


