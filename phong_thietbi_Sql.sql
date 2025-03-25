CREATE TABLE `phong_thietbi` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `phong_id` INT NOT NULL,
    `thietbi_id` INT NOT NULL,
    `thongtinthietbi_id` INT NOT NULL, -- Để xác định thiết bị này thuộc lô nhập nào
    `soLuong` INT NOT NULL DEFAULT 0,  -- Số lượng thiết bị có trong phòng
    PRIMARY KEY (`id`),
    FOREIGN KEY (`phong_id`) REFERENCES `phong`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`thietbi_id`) REFERENCES `thietbi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
DELIMITER //
CREATE TRIGGER check_ton_kho_before_update
BEFORE UPDATE ON phong_thietbi
FOR EACH ROW
BEGIN
    DECLARE available_tonKho INT;
    
    -- Lấy số lượng tồn kho của thiết bị
    SELECT tonKho INTO available_tonKho 
    FROM thietbi 
    WHERE id = NEW.thietbi_id;
    
    -- Kiểm tra nếu số lượng cập nhật vượt quá tồn kho
    IF NEW.soLuong > available_tonKho THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng thiết bị trong phòng không thể vượt quá tồn kho!';
    END IF;
END;
//
DELIMITER ;