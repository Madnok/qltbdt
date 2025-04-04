CREATE TABLE `nhanvien_phong_phutrach` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nhanvien_id` INT NOT NULL COMMENT 'ID của user có role nhanvien',
  `phong_id` INT NOT NULL COMMENT 'ID của phòng được giao phụ trách',
  `ngay_gan` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày bắt đầu giao phụ trách (tùy chọn)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nhanvien_phong` (`nhanvien_id`, `phong_id`), -- Đảm bảo không gán trùng lặp 1 nhân viên cho 1 phòng
  CONSTRAINT `fk_nvpp_nhanvien` FOREIGN KEY (`nhanvien_id`) REFERENCES `users`(`id`) ON DELETE CASCADE, -- Nếu xóa user thì xóa luôn phân công
  CONSTRAINT `fk_nvpp_phong` FOREIGN KEY (`phong_id`) REFERENCES `phong`(`id`) ON DELETE CASCADE -- Nếu xóa phòng thì xóa luôn phân công
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu trữ việc phân công phòng cố định cho nhân viên';