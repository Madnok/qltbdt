CREATE DATABASE  IF NOT EXISTS `qltbdt` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `qltbdt`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: qltbdt
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `baohong`
--

DROP TABLE IF EXISTS `baohong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baohong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thietbi_id` int DEFAULT NULL,
  `thongtinthietbi_id` int DEFAULT NULL,
  `phong_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `thiethai` enum('Nhẹ','Vừa','Nặng') NOT NULL,
  `moTa` text,
  `ghiChuXuLy` text,
  `ghiChuAdmin` text,
  `coLogBaoTri` tinyint(1) DEFAULT '0',
  `hinhAnh` varchar(255) DEFAULT NULL,
  `ngayBaoHong` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `loaithiethai` enum('Hạ Tầng','Các Loại Thiết Bị','Khác') NOT NULL,
  `nhanvien_id` int DEFAULT NULL,
  `thoiGianXuLy` timestamp NULL DEFAULT NULL,
  `trangThai` enum('Chờ Duyệt','Đã Duyệt','Đang Tiến Hành','Chờ Hoàn Tất Bảo Hành','Hoàn Thành','Không Thể Hoàn Thành','Yêu Cầu Làm Lại','Chờ Xem Xét') DEFAULT 'Chờ Duyệt',
  PRIMARY KEY (`id`),
  KEY `thietbi_id` (`thietbi_id`),
  KEY `thongtinthietbi_id` (`thongtinthietbi_id`),
  KEY `phong_id` (`phong_id`),
  KEY `userid` (`user_id`),
  KEY `nhanvien_id` (`nhanvien_id`),
  CONSTRAINT `baohong_ibfk_1` FOREIGN KEY (`thietbi_id`) REFERENCES `thietbi` (`id`),
  CONSTRAINT `baohong_ibfk_2` FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi` (`id`),
  CONSTRAINT `baohong_ibfk_3` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`),
  CONSTRAINT `baohong_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `baohong_ibfk_5` FOREIGN KEY (`nhanvien_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baohong`
--

LOCK TABLES `baohong` WRITE;
/*!40000 ALTER TABLE `baohong` DISABLE KEYS */;
INSERT INTO `baohong` VALUES (32,NULL,173,7,NULL,'Vừa','Đèn phòng bị chập chờn, lúc lên lúc không',NULL,NULL,1,'https://res.cloudinary.com/dqs9zvox3/image/upload/v1744482408/baohong_images/xc5nbfukyplz46scb3ea.png','2025-04-12 18:26:48','Các Loại Thiết Bị',3,'2025-04-15 12:50:24','Hoàn Thành'),(34,NULL,NULL,1,NULL,'Nhẹ','Test Chờ duyệt',NULL,NULL,0,'https://res.cloudinary.com/dqs9zvox3/image/upload/v1744657205/baohong_images/e5vo77jzfxwlwwhfusob.png','2025-04-14 19:00:03','Hạ Tầng',NULL,NULL,'Chờ Duyệt'),(35,NULL,NULL,18,NULL,'Vừa','Test Không thể hoàn thành ','chịu thui',NULL,0,'https://res.cloudinary.com/dqs9zvox3/image/upload/v1744657295/baohong_images/rgx9filp3vl8nrulgh9w.png','2025-04-14 19:01:33','Hạ Tầng',20,'2025-04-15 12:44:14','Không Thể Hoàn Thành'),(36,NULL,251,7,NULL,'Nặng','Gãy 4 chân',NULL,NULL,0,'https://res.cloudinary.com/dqs9zvox3/image/upload/v1744657359/baohong_images/wdjp8vau36k1x13qhhld.png','2025-04-14 19:02:37','Các Loại Thiết Bị',3,NULL,'Đang Tiến Hành'),(37,NULL,NULL,4,NULL,'Nhẹ','Test Đã Duyệt',NULL,NULL,1,NULL,'2025-04-14 19:04:40','Hạ Tầng',2,'2025-04-24 20:08:49','Hoàn Thành'),(39,25,247,9,NULL,'Nhẹ','ghế gãy',NULL,NULL,0,NULL,'2025-04-15 13:12:14','Các Loại Thiết Bị',3,NULL,'Đang Tiến Hành'),(41,4,161,1,NULL,'Vừa','hỏng hoài z',NULL,NULL,1,NULL,'2025-04-16 16:47:56','Các Loại Thiết Bị',2,NULL,'Chờ Hoàn Tất Bảo Hành'),(44,NULL,NULL,41,NULL,'Vừa','fill trang 1',NULL,NULL,0,NULL,'2025-04-16 19:43:42','Hạ Tầng',NULL,NULL,'Chờ Duyệt'),(46,4,163,3,NULL,'Vừa','hỏng dây micro',NULL,NULL,0,NULL,'2025-04-16 19:45:22','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt'),(47,4,164,3,NULL,'Vừa','hỏng dây micro',NULL,NULL,0,NULL,'2025-04-16 19:45:22','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt'),(48,7,173,7,NULL,'Nặng','bóng đèn chập chờn',NULL,NULL,0,NULL,'2025-04-16 19:46:31','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt'),(51,22,205,1,NULL,'Nặng','qwd',NULL,NULL,0,NULL,'2025-04-23 22:10:37','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt'),(52,4,162,2,NULL,'Vừa','hỏng',NULL,NULL,1,NULL,'2025-04-24 00:39:29','Các Loại Thiết Bị',2,'2025-04-24 21:12:27','Hoàn Thành');
/*!40000 ALTER TABLE `baohong` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_baohong_check_moTa_update` BEFORE UPDATE ON `baohong` FOR EACH ROW BEGIN
    IF NEW.loaithiethai IN ('Kết Cấu', 'Khác') AND (NEW.moTa IS NULL OR NEW.moTa = '') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mô tả bắt buộc khi loại thiệt hại là Kết Cấu hoặc Khác.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `baotri`
--

DROP TABLE IF EXISTS `baotri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baotri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `baohong_id` int DEFAULT NULL COMMENT 'ID của báo hỏng liên quan (có thể NULL)',
  `nhanvien_id` int NOT NULL COMMENT 'ID nhân viên thực hiện',
  `thongtinthietbi_id` int DEFAULT NULL COMMENT 'ID thiết bị cụ thể (nếu báo hỏng liên quan đến thiết bị)',
  `phong_id` int NOT NULL COMMENT 'ID phòng liên quan',
  `hoatdong` text NOT NULL COMMENT 'Mô tả chi tiết hoạt động đã thực hiện',
  `ketQuaXuLy` enum('Đã sửa chữa xong','Đã gửi bảo hành','Đề xuất thanh lý','Không tìm thấy lỗi / Không cần xử lý','Chuyển cho bộ phận khác','Đã nhận từ bảo hành') NOT NULL COMMENT 'Kết quả cuối cùng của lần ghi log này',
  `phuongAnXuLy` enum('Bảo hành','Tự Sửa Chữa','Bàn Giao Cho Bộ Phận Khác','Khác') DEFAULT NULL COMMENT 'Phương án xử lý chính được thực hiện',
  `phuongAnKhacChiTiet` text COMMENT 'Chi tiết nếu phương án xử lý là Khác',
  `suDungVatTu` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Có sử dụng vật tư/dịch vụ không?',
  `ghiChuVatTu` text COMMENT 'Chi tiết vật tư/dịch vụ đã sử dụng',
  `chiPhi` int DEFAULT NULL COMMENT 'Chi phí ước tính hoặc thực tế (số nguyên)',
  `hinhAnhHoaDonUrls` json DEFAULT NULL COMMENT 'Mảng các URL ảnh hóa đơn/chứng từ',
  `hinhAnhHongHocUrls` json DEFAULT NULL COMMENT 'Mảng URL ảnh xác nhận tình trạng hỏng hóc (trước xử lý)',
  `thoiGian` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian ghi log',
  `ngayDuKienTra` date DEFAULT NULL COMMENT 'Ngày dự kiến nhận lại thiết bị từ bảo hành',
  `lichbaoduong_id` int DEFAULT NULL COMMENT 'ID lịch bảo dưỡng định kỳ liên quan',
  PRIMARY KEY (`id`),
  KEY `idx_baotri_baohong` (`baohong_id`),
  KEY `idx_baotri_nhanvien` (`nhanvien_id`),
  KEY `idx_baotri_thongtinthietbi` (`thongtinthietbi_id`),
  KEY `idx_baotri_phong` (`phong_id`),
  KEY `idx_baotri_lichbaoduong` (`lichbaoduong_id`),
  CONSTRAINT `fk_baotri_baohong` FOREIGN KEY (`baohong_id`) REFERENCES `baohong` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_baotri_lichbaoduong` FOREIGN KEY (`lichbaoduong_id`) REFERENCES `lichbaoduong` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_baotri_nhanvien` FOREIGN KEY (`nhanvien_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_baotri_phong` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`),
  CONSTRAINT `fk_baotri_thongtinthietbi` FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu log các hoạt động bảo trì/sửa chữa';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baotri`
--

LOCK TABLES `baotri` WRITE;
/*!40000 ALTER TABLE `baotri` DISABLE KEYS */;
INSERT INTO `baotri` VALUES (25,32,3,173,7,'223e32','Chuyển cho bộ phận khác','Bàn Giao Cho Bộ Phận Khác',NULL,0,NULL,NULL,NULL,NULL,'2025-04-13 21:31:17',NULL,NULL),(37,NULL,2,160,2,'gửi bảo hành','Đã gửi bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-15 12:46:22','2025-04-20',NULL),(38,32,3,173,7,'tháo ra vệ sinh rồi gắn lại','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744721427/baotri_invoices/f5eokt49yeoefjhrazqb.png\"]','2025-04-15 12:50:24',NULL,NULL),(39,39,3,247,9,'đem đi qua cho phòng bảo vệ','Chuyển cho bộ phận khác','Bàn Giao Cho Bộ Phận Khác',NULL,0,NULL,NULL,NULL,NULL,'2025-04-15 13:14:44',NULL,NULL),(40,NULL,3,161,1,'gg','Đã sửa chữa xong','Tự Sửa Chữa',NULL,1,'10k nước mía',10000,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744821899/baotri_invoices/sqyp1rlgkyah3p56cpmx.png\"]','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744821899/baotri_invoices/cvn3btxizjwxarswhgqf.png\"]','2025-04-16 16:44:59',NULL,NULL),(41,41,2,161,1,'gửi bh','Đã gửi bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-16 16:50:13','2025-12-12',NULL),(42,41,2,161,1,'Nhận thiết bị ID 161 từ bảo hành về. (Báo hỏng gốc ID: 41) - Tình trạng ghi nhận: Hoạt động tốt.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-16 16:50:56',NULL,NULL),(43,41,2,161,1,'Nhận thiết bị ID 161 từ bảo hành về. (Báo hỏng gốc ID: 41) - Tình trạng ghi nhận: Vẫn còn lỗi.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-16 16:51:28',NULL,NULL),(44,41,2,161,1,'Nhận thiết bị ID 161 từ bảo hành về. (Báo hỏng gốc ID: 41) - Tình trạng ghi nhận: Hoạt động tốt.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-16 16:51:56',NULL,NULL),(45,NULL,2,160,2,'Nhận thiết bị ID 160 từ bảo hành về. (Báo hỏng gốc ID: 38) - Tình trạng ghi nhận: Hoạt động tốt.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-16 18:58:50',NULL,NULL),(46,NULL,2,160,2,'12 34','Đã gửi bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-18 19:56:36',NULL,NULL),(47,NULL,2,160,2,'Nhận thiết bị ID 160 từ bảo hành về. (Báo hỏng gốc ID: 38) - Tình trạng ghi nhận: Vẫn còn lỗi.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-18 19:57:05',NULL,NULL),(48,NULL,1,160,2,'Lưu trữ log từ báo hỏng ID 38 (Trạng thái cuối: Hoàn Thành) đã bị xóa bởi Admin ID 1. Mô tả gốc: gãy micrô. Ghi chú xử lý cuối: Không có. Ghi chú Admin cuối: Không có.','Đã sửa chữa xong','Khác','Log lưu trữ tự động khi xóa báo hỏng.',0,NULL,NULL,NULL,NULL,'2025-04-18 20:03:39',NULL,NULL),(49,NULL,2,160,2,'tự sửa k thành công','Đề xuất thanh lý','Khác','không sửa được nữa',0,NULL,NULL,NULL,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745006864/baotri_invoices/em7d1ekd1bvxcs40v46q.jpg\"]','2025-04-18 20:07:40',NULL,NULL),(50,NULL,1,160,2,'Lưu trữ log từ báo hỏng ID 49 (Trạng thái cuối: Hoàn Thành) đã bị xóa bởi Admin ID 1. Mô tả gốc: hỏng again . Ghi chú xử lý cuối: Không có. Ghi chú Admin cuối: Không có.','Đã sửa chữa xong','Khác','Log lưu trữ tự động khi xóa báo hỏng.',0,NULL,NULL,NULL,NULL,'2025-04-18 20:08:41',NULL,NULL),(51,NULL,2,207,6,'12 12 123 tralalero tralala','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745433162/baotri_invoices/kai741q4c560goknymmr.jpg\"]','2025-04-23 18:32:43',NULL,NULL),(52,NULL,2,207,6,'gửi bh','Đã gửi bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-23 18:34:05','2025-04-26',NULL),(53,NULL,2,207,6,'Nhận thiết bị ID 207 từ bảo hành về. (Báo hỏng gốc ID: 50) - Tình trạng ghi nhận: Hoạt động tốt.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-23 18:34:54',NULL,NULL),(54,NULL,1,207,6,'Lưu trữ log từ báo hỏng ID 50 (Trạng thái cuối: Hoàn Thành) đã bị xóa bởi Admin ID 1. Mô tả gốc: gãy làm 2 . Ghi chú xử lý cuối: Không có. Ghi chú Admin cuối: Không có.','Đã sửa chữa xong','Khác','Log lưu trữ tự động khi xóa báo hỏng.',0,NULL,NULL,NULL,NULL,'2025-04-23 18:35:36',NULL,NULL),(58,52,2,162,2,'asd','Đã gửi bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-24 19:57:26','2025-04-25',NULL),(59,52,2,162,2,'Nhận thiết bị ID 162 từ bảo hành về. (Báo hỏng gốc ID: 52) - Tình trạng ghi nhận: Hoạt động tốt.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-24 19:57:33',NULL,NULL),(61,37,2,NULL,4,'sdf','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,NULL,'2025-04-24 20:08:49',NULL,NULL),(64,NULL,2,206,1,'ko','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,NULL,'2025-04-24 20:19:52',NULL,25),(65,NULL,2,177,1,'vbnnhgj','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745526214/baotri_invoices/l4oxmuvsd2eoqgvbd7u1.png\"]','2025-04-24 20:23:35',NULL,26),(66,NULL,2,178,1,'bh','Đã gửi bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,NULL,'2025-04-24 20:24:07','2025-04-26',27),(67,52,2,162,2,'1 2 3 uống nước mía','Đã sửa chữa xong','Tự Sửa Chữa',NULL,1,'nước mía',50000,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745529147/baotri_invoices/auc0tsyfjyytfwiakdg3.jpg\"]',NULL,'2025-04-24 21:12:27',NULL,NULL),(68,NULL,2,178,1,'Nhận thiết bị Laptop MSI từ bảo hành về. (Lịch BD gốc ID: 27) - Tình trạng ghi nhận: Vẫn còn lỗi.','Đã nhận từ bảo hành','Bảo hành',NULL,0,NULL,NULL,NULL,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745530372/baotri_invoices/hjw3ncmbnqruprvp5kvm.jpg\"]','2025-04-24 21:32:52',NULL,27),(69,NULL,2,162,2,'vệ sinh micro','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,NULL,'2025-04-24 22:00:57',NULL,33),(70,NULL,2,206,1,'kk','Đã sửa chữa xong','Tự Sửa Chữa',NULL,0,NULL,NULL,NULL,NULL,'2025-04-25 20:05:51',NULL,38);
/*!40000 ALTER TABLE `baotri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gopy`
--

DROP TABLE IF EXISTS `gopy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gopy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loaiGopY` enum('Tính năng','Trải nghiệm người dùng','Hiệu năng / tốc độ','Quy trình sử dụng','Khác') NOT NULL,
  `noiDung` text NOT NULL,
  `isAnonymous` tinyint(1) NOT NULL DEFAULT '0',
  `user_id` int DEFAULT NULL COMMENT 'ID người dùng gửi (nếu đăng nhập)',
  `hoTenNguoiGui` varchar(100) DEFAULT NULL COMMENT 'Tên người gửi (nếu không ẩn danh)',
  `ngayGopY` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `trangThai` enum('Mới','Đang xử lý','Đã phản hồi','Đã từ chối') NOT NULL DEFAULT 'Mới',
  `ghiChuNoiBo` text,
  `likes` int NOT NULL DEFAULT '0',
  `dislikes` int NOT NULL DEFAULT '0',
  `is_publicly_visible` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Admin duyệt cho phép hiển thị công khai hay không',
  PRIMARY KEY (`id`),
  KEY `idx_gopy_user` (`user_id`),
  KEY `idx_gopy_trangthai` (`trangThai`),
  CONSTRAINT `fk_gopy_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gopy`
--

LOCK TABLES `gopy` WRITE;
/*!40000 ALTER TABLE `gopy` DISABLE KEYS */;
INSERT INTO `gopy` VALUES (1,'Trải nghiệm người dùng','hơi tệ',0,NULL,'minh hùng','2025-04-22 20:32:42','Đang xử lý','on',2,0,1),(3,'Hiệu năng / tốc độ','fsd',1,NULL,'Ẩn Danh','2025-04-22 22:19:55','Mới',NULL,1,0,1),(4,'Quy trình sử dụng','quy trình hơi khó hiểu cho 1 nhân viên như tôi',0,2,'Phạm Minh Hùng','2025-04-22 22:28:03','Đã phản hồi',NULL,1,0,1);
/*!40000 ALTER TABLE `gopy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gopy_comments`
--

DROP TABLE IF EXISTS `gopy_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gopy_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gopy_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT 'ID người bình luận (admin/nhanvien)',
  `noiDungBinhLuan` text NOT NULL,
  `thoiGianBinhLuan` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gopycomments_gopy` (`gopy_id`),
  KEY `idx_gopycomments_user` (`user_id`),
  CONSTRAINT `fk_gopycomments_gopy` FOREIGN KEY (`gopy_id`) REFERENCES `gopy` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gopycomments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gopy_comments`
--

LOCK TABLES `gopy_comments` WRITE;
/*!40000 ALTER TABLE `gopy_comments` DISABLE KEYS */;
INSERT INTO `gopy_comments` VALUES (1,1,2,'tệ ở đâu ạ','2025-04-22 20:44:31'),(2,1,1,'đó là tôi admin','2025-04-22 21:11:04');
/*!40000 ALTER TABLE `gopy_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gopy_votes`
--

DROP TABLE IF EXISTS `gopy_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gopy_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gopy_id` int NOT NULL,
  `user_id` int DEFAULT NULL COMMENT 'ID người dùng nếu đã đăng nhập',
  `anonymous_voter_id` varchar(36) DEFAULT NULL COMMENT 'UUID định danh người dùng chưa đăng nhập (từ cookie)',
  `vote_type` enum('like','dislike') NOT NULL,
  `thoiGianVote` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gopy_user_vote` (`gopy_id`,`user_id`),
  UNIQUE KEY `uq_gopy_anon_vote` (`gopy_id`,`anonymous_voter_id`),
  KEY `idx_gopyvotes_gopy` (`gopy_id`),
  KEY `idx_gopyvotes_user` (`user_id`),
  KEY `idx_gopyvotes_anon` (`anonymous_voter_id`),
  CONSTRAINT `fk_gopyvotes_gopy_new` FOREIGN KEY (`gopy_id`) REFERENCES `gopy` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gopyvotes_user_new` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_voter_id` CHECK (((`user_id` is not null) or (`anonymous_voter_id` is not null)))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu lượt vote (hỗ trợ cả user đăng nhập và ẩn danh)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gopy_votes`
--

LOCK TABLES `gopy_votes` WRITE;
/*!40000 ALTER TABLE `gopy_votes` DISABLE KEYS */;
INSERT INTO `gopy_votes` VALUES (2,1,NULL,'177f8432-705a-4744-b00b-b6327035612d','like','2025-04-22 21:11:20'),(3,1,NULL,'4fd811f9-ec24-4426-b1e3-0ff0f3075bbd','like','2025-04-22 21:11:21'),(4,3,NULL,'177f8432-705a-4744-b00b-b6327035612d','like','2025-04-22 22:59:15'),(5,4,NULL,'177f8432-705a-4744-b00b-b6327035612d','like','2025-04-22 22:59:16');
/*!40000 ALTER TABLE `gopy_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichbaoduong`
--

DROP TABLE IF EXISTS `lichbaoduong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichbaoduong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thongtinthietbi_id` int NOT NULL COMMENT 'ID của thông tin thiết bị cần bảo dưỡng',
  `nhanvien_id` int DEFAULT NULL COMMENT 'ID nhân viên được giao xử lý (có thể null ban đầu, chờ gán)',
  `phong_id` int NOT NULL COMMENT 'ID phòng chứa thiết bị',
  `ngay_baotri` date NOT NULL COMMENT 'Ngày dự kiến bảo dưỡng',
  `mo_ta` text COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả công việc bảo dưỡng',
  `trang_thai` enum('Chờ xử lý','Đang tiến hành','Hoàn thành','Hủy','Chờ Hoàn Tất Bảo Hành') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Chờ xử lý',
  `nguoi_tao_id` int DEFAULT NULL COMMENT 'ID người tạo lịch (Admin)',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo lịch',
  `ngay_cap_nhat` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật cuối cùng',
  `coLogBaoTri` tinyint(1) DEFAULT '0' COMMENT 'Đã có log bảo trì liên quan hay chưa',
  PRIMARY KEY (`id`),
  KEY `thongtinthietbi_id` (`thongtinthietbi_id`),
  KEY `nhanvien_id` (`nhanvien_id`),
  KEY `phong_id` (`phong_id`),
  KEY `nguoi_tao_id` (`nguoi_tao_id`),
  CONSTRAINT `lichbaoduong_ibfk_1` FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lichbaoduong_ibfk_2` FOREIGN KEY (`nhanvien_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lichbaoduong_ibfk_3` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lichbaoduong_ibfk_4` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichbaoduong`
--

LOCK TABLES `lichbaoduong` WRITE;
/*!40000 ALTER TABLE `lichbaoduong` DISABLE KEYS */;
INSERT INTO `lichbaoduong` VALUES (25,206,2,1,'2025-04-25','Bảo dưỡng định kỳ phòng A1.1','Hoàn thành',1,'2025-04-24 01:10:19','2025-04-24 20:19:52',1),(26,177,2,1,'2025-04-25','Bảo dưỡng định kỳ phòng A1.1','Hoàn thành',1,'2025-04-24 01:10:19','2025-04-24 20:23:35',1),(27,178,2,1,'2025-04-25','Bảo dưỡng định kỳ phòng A1.1','Hoàn thành',1,'2025-04-24 01:10:19','2025-04-24 21:32:52',1),(33,162,2,2,'2025-04-25','Bảo dưỡng định kỳ tại A2.3 (Phòng Học)','Hoàn thành',1,'2025-04-24 22:00:24','2025-04-24 22:00:57',1),(38,206,2,1,'2025-04-26','asdasd','Hoàn thành',1,'2025-04-25 19:25:46','2025-04-25 20:05:51',1),(39,177,2,1,'2025-04-26','Bảo dưỡng định kỳ phòng A1.1','Chờ xử lý',1,'2025-04-25 19:56:36','2025-04-25 19:56:36',0),(41,206,2,1,'2025-05-01','Bảo dưỡng định kỳ tại A1.1 (Phòng Học)','Chờ xử lý',1,'2025-04-25 20:49:15','2025-04-25 20:49:15',0);
/*!40000 ALTER TABLE `lichbaoduong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichtruc`
--

DROP TABLE IF EXISTS `lichtruc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichtruc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhanvien_id` int NOT NULL,
  `tenNhanVien` varchar(255) DEFAULT NULL,
  `phong_id` int DEFAULT NULL,
  `caLamViec` enum('Ca Sáng','Ca Chiều') NOT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `trangThai` enum('Đang Chờ','Đang Thực Hiện','Hoàn Thành') DEFAULT 'Đang Chờ',
  `isSupporting` tinyint(1) DEFAULT '0',
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `nhanvien_id` (`nhanvien_id`),
  KEY `phong_id` (`phong_id`),
  KEY `idx_start_time` (`start_time`),
  CONSTRAINT `lichtruc_ibfk_1` FOREIGN KEY (`nhanvien_id`) REFERENCES `users` (`id`),
  CONSTRAINT `lichtruc_ibfk_2` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichtruc`
--

LOCK TABLES `lichtruc` WRITE;
/*!40000 ALTER TABLE `lichtruc` DISABLE KEYS */;
INSERT INTO `lichtruc` VALUES (7,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-03 01:00:00','2025-04-03 08:00:00','Đang Chờ',0,''),(17,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-04 08:00:00','2025-04-04 15:00:00','Đang Chờ',0,NULL),(18,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-05 08:00:00','2025-04-05 15:00:00','Đang Chờ',0,NULL),(19,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-06 08:00:00','2025-04-06 15:00:00','Đang Chờ',0,NULL),(20,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-07 08:00:00','2025-04-07 15:00:00','Đang Chờ',0,NULL),(21,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-08 08:00:00','2025-04-08 15:00:00','Đang Chờ',0,NULL),(22,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-09 08:00:00','2025-04-09 15:00:00','Đang Chờ',0,NULL),(23,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-10 08:00:00','2025-04-10 15:00:00','Đang Chờ',0,NULL),(24,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-11 08:00:00','2025-04-11 15:00:00','Đang Chờ',0,NULL),(25,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-12 08:00:00','2025-04-12 15:00:00','Đang Chờ',0,NULL),(26,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-13 08:00:00','2025-04-13 15:00:00','Đang Chờ',0,NULL),(27,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-04 08:00:00','2025-04-04 15:00:00','Đang Chờ',0,'đúp ca nha cưng~~'),(28,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-05 08:00:00','2025-04-05 15:00:00','Đang Chờ',0,'đúp ca nha cưng~~'),(29,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-06 08:00:00','2025-04-06 15:00:00','Đang Chờ',0,'đúp ca nha cưng~~'),(30,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-05 01:00:00','2025-04-05 08:00:00','Đang Chờ',0,NULL),(31,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-06 01:00:00','2025-04-06 08:00:00','Đang Chờ',0,NULL),(32,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-12 01:00:00','2025-04-12 08:00:00','Đang Chờ',0,NULL),(33,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-13 01:00:00','2025-04-13 08:00:00','Đang Chờ',0,NULL),(34,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-15 01:00:00','2025-04-15 08:00:00','Đang Chờ',0,NULL),(35,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-16 01:00:00','2025-04-16 08:00:00','Đang Chờ',0,NULL),(36,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-17 01:00:00','2025-04-17 08:00:00','Đang Chờ',0,NULL),(37,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-18 01:00:00','2025-04-18 08:00:00','Đang Chờ',0,NULL),(38,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-19 01:00:00','2025-04-19 08:00:00','Đang Chờ',0,NULL),(39,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-20 01:00:00','2025-04-20 08:00:00','Đang Chờ',0,NULL),(40,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-15 08:00:00','2025-04-15 15:00:00','Đang Chờ',0,NULL),(41,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-16 08:00:00','2025-04-16 15:00:00','Đang Chờ',0,NULL),(42,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-17 08:00:00','2025-04-17 15:00:00','Đang Chờ',0,NULL),(43,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-18 08:00:00','2025-04-18 15:00:00','Đang Chờ',0,NULL),(44,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-19 08:00:00','2025-04-19 15:00:00','Đang Chờ',0,NULL),(45,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-20 08:00:00','2025-04-20 15:00:00','Đang Chờ',0,NULL),(46,20,'Nhân Văn Viên ',NULL,'Ca Chiều','2025-04-15 08:00:00','2025-04-15 15:00:00','Đang Chờ',0,NULL),(47,20,'Nhân Văn Viên ',NULL,'Ca Chiều','2025-04-16 08:00:00','2025-04-16 15:00:00','Đang Chờ',0,NULL),(48,20,'Nhân Văn Viên ',NULL,'Ca Sáng','2025-04-15 01:00:00','2025-04-15 08:00:00','Đang Chờ',0,NULL),(49,20,'Nhân Văn Viên ',NULL,'Ca Sáng','2025-04-16 01:00:00','2025-04-16 08:00:00','Đang Chờ',0,NULL),(50,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-24 01:00:00','2025-04-24 08:00:00','Đang Chờ',0,NULL),(51,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-25 01:00:00','2025-04-25 08:00:00','Đang Chờ',0,NULL),(52,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-26 01:00:00','2025-04-26 08:00:00','Đang Chờ',0,NULL),(53,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-27 01:00:00','2025-04-27 08:00:00','Đang Chờ',0,NULL),(54,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-24 08:00:00','2025-04-24 15:00:00','Đang Chờ',0,NULL),(55,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-25 08:00:00','2025-04-25 15:00:00','Đang Chờ',0,NULL),(56,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-26 08:00:00','2025-04-26 15:00:00','Đang Chờ',0,NULL),(57,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-27 08:00:00','2025-04-27 15:00:00','Đang Chờ',0,NULL),(58,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-05 01:00:00','2025-05-05 08:00:00','Đang Chờ',0,NULL),(59,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-06 01:00:00','2025-05-06 08:00:00','Đang Chờ',0,NULL),(60,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-07 01:00:00','2025-05-07 08:00:00','Đang Chờ',0,NULL),(61,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-08 01:00:00','2025-05-08 08:00:00','Đang Chờ',0,NULL),(62,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-09 01:00:00','2025-05-09 08:00:00','Đang Chờ',0,NULL),(63,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-10 01:00:00','2025-05-10 08:00:00','Đang Chờ',0,NULL),(64,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-11 01:00:00','2025-05-11 08:00:00','Đang Chờ',0,NULL),(65,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-28 01:00:00','2025-04-28 08:00:00','Đang Chờ',0,NULL),(66,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-29 01:00:00','2025-04-29 08:00:00','Đang Chờ',0,NULL),(67,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-30 01:00:00','2025-04-30 08:00:00','Đang Chờ',0,NULL),(69,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-02 01:00:00','2025-05-02 08:00:00','Đang Chờ',0,NULL),(70,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-03 01:00:00','2025-05-03 08:00:00','Đang Chờ',0,NULL),(71,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-05-04 01:00:00','2025-05-04 08:00:00','Đang Chờ',0,NULL);
/*!40000 ALTER TABLE `lichtruc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_huy_congviec`
--

DROP TABLE IF EXISTS `log_huy_congviec`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_huy_congviec` (
  `id` int NOT NULL AUTO_INCREMENT,
  `baohong_id` int NOT NULL,
  `nhanvien_id_bi_huy` int DEFAULT NULL,
  `admin_id_huy` int NOT NULL,
  `thoiGianHuy` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lyDoHuy` text NOT NULL,
  `trangThaiTruocKhiHuy` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `baohong_id` (`baohong_id`),
  KEY `nhanvien_id_bi_huy` (`nhanvien_id_bi_huy`),
  KEY `admin_id_huy` (`admin_id_huy`),
  CONSTRAINT `log_huy_congviec_ibfk_1` FOREIGN KEY (`baohong_id`) REFERENCES `baohong` (`id`) ON DELETE CASCADE,
  CONSTRAINT `log_huy_congviec_ibfk_2` FOREIGN KEY (`nhanvien_id_bi_huy`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `log_huy_congviec_ibfk_3` FOREIGN KEY (`admin_id_huy`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_huy_congviec`
--

LOCK TABLES `log_huy_congviec` WRITE;
/*!40000 ALTER TABLE `log_huy_congviec` DISABLE KEYS */;
INSERT INTO `log_huy_congviec` VALUES (1,37,2,1,'2025-04-15 13:10:41','hủy k làm nữa !!! scam','Đang Tiến Hành');
/*!40000 ALTER TABLE `log_huy_congviec` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhanvien_phong_phutrach`
--

DROP TABLE IF EXISTS `nhanvien_phong_phutrach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhanvien_phong_phutrach` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhanvien_id` int NOT NULL COMMENT 'ID của user có role nhanvien',
  `phong_id` int NOT NULL COMMENT 'ID của phòng được giao phụ trách',
  `ngay_gan` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày bắt đầu giao phụ trách (tùy chọn)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nhanvien_phong` (`nhanvien_id`,`phong_id`),
  KEY `fk_nvpp_phong` (`phong_id`),
  CONSTRAINT `fk_nvpp_nhanvien` FOREIGN KEY (`nhanvien_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nvpp_phong` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu trữ việc phân công phòng cố định cho nhân viên';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhanvien_phong_phutrach`
--

LOCK TABLES `nhanvien_phong_phutrach` WRITE;
/*!40000 ALTER TABLE `nhanvien_phong_phutrach` DISABLE KEYS */;
INSERT INTO `nhanvien_phong_phutrach` VALUES (45,3,9,'2025-04-12 16:28:44'),(46,3,7,'2025-04-12 18:29:24'),(47,2,2,'2025-04-14 19:07:13'),(48,20,18,'2025-04-15 12:41:06'),(49,20,19,'2025-04-15 12:41:06'),(50,20,20,'2025-04-15 12:41:06'),(51,2,1,'2025-04-15 12:42:01'),(52,2,3,'2025-04-15 12:42:21'),(53,2,4,'2025-04-15 12:42:21');
/*!40000 ALTER TABLE `nhanvien_phong_phutrach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieunhap`
--

DROP TABLE IF EXISTS `phieunhap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieunhap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nguoiTao` varchar(50) NOT NULL,
  `ngayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `truongHopNhap` enum('taiTro','muaMoi') NOT NULL,
  `danhSachChungTu` json DEFAULT NULL COMMENT 'Danh sách URL chứng từ nhập',
  `ghiChu` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `phieunhap_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieunhap`
--

LOCK TABLES `phieunhap` WRITE;
/*!40000 ALTER TABLE `phieunhap` DISABLE KEYS */;
INSERT INTO `phieunhap` VALUES (67,1,'Admin','2025-03-30 03:16:00','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744231448/nhapxuat_documents/qghdskxoybnqa5qgyxwz.png\", \"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744232212/nhapxuat_documents/ooxststccxhc2do7ozpp.png\"]',NULL),(73,1,'Admin','2025-03-30 04:55:00','muaMoi',NULL,NULL),(74,1,'Admin','2025-03-30 05:19:00','muaMoi',NULL,NULL),(75,1,'Admin','2025-03-30 07:08:00','taiTro',NULL,NULL),(76,1,'Admin','2025-03-30 07:09:00','taiTro',NULL,NULL),(78,1,'Admin','2025-03-30 07:31:00','muaMoi',NULL,NULL),(79,1,'Admin','2025-03-30 07:31:00','muaMoi',NULL,NULL),(80,1,'Admin','2025-03-30 08:37:00','taiTro',NULL,NULL),(81,1,'Admin','2025-03-30 21:03:00','taiTro',NULL,NULL),(89,1,'Admin','2025-04-09 19:31:00','muaMoi',NULL,NULL),(94,1,'Admin','2025-04-10 03:46:00','taiTro','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744231754/nhapxuat_documents/ibcgui3saujrgvf5vp7v.png\"]',NULL),(95,1,'Admin','2025-04-12 02:57:00','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1744401481/nhapxuat_documents/xvovk1yulj3bja3faq3f.png\"]',NULL),(96,1,'Admin','2025-04-20 01:29:00','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745087422/nhapxuat_documents/qxhelqf2ysjkn0wetdfj.jpg\"]',NULL),(97,1,'Admin','2025-04-21 04:07:00','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745183278/nhapxuat_documents/ywo0xodex7vwqwyjvcfk.jpg\"]',NULL),(98,1,'Admin','2025-04-21 05:37:16','muaMoi',NULL,NULL),(99,1,'Admin','2025-04-21 06:05:59','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745191597/nhapxuat_documents/pyhi3cq2mzljpwpmmain.jpg\"]','gờ gờ queo lay'),(100,1,'Admin','2025-04-21 06:16:37','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745191442/nhapxuat_documents/zaiwwjtouhqu5ofcrxyq.png\"]','tai nghe e pọt'),(101,1,'Admin','2025-04-21 06:20:04','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745191208/nhapxuat_documents/xillqxmaxrhqo15ahx7n.png\", \"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745191208/nhapxuat_documents/stsbrqjgdxks8dsxrnfi.png\"]','epod'),(102,1,'Admin','2025-04-21 06:30:37','taiTro','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745191842/nhapxuat_documents/jdtm6asfidodj8vmfn2e.jpg\"]','12345'),(103,1,'Admin','2025-04-25 05:50:47','muaMoi','[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745535051/nhapxuat_documents/kiyzj79mjo9y6hbcvv3h.jpg\"]','mua laptopdell');
/*!40000 ALTER TABLE `phieunhap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieuxuat`
--

DROP TABLE IF EXISTS `phieuxuat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieuxuat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ngayXuat` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày thực hiện xuất',
  `nguoiThucHien_id` int NOT NULL COMMENT 'ID người dùng (admin) thực hiện xuất',
  `lyDoXuat` enum('thanh_ly','mat_mat','xuat_tra','dieu_chuyen') NOT NULL COMMENT 'Lý do xuất kho',
  `ghiChu` text COMMENT 'Ghi chú thêm (vd: đơn vị nhận, thông tin bán...)',
  `giaTriThanhLy` decimal(15,2) DEFAULT NULL COMMENT 'Giá trị thu về nếu bán (tùy chọn)',
  `danhSachChungTu` json DEFAULT NULL COMMENT 'Danh sách URL chứng từ xuất',
  PRIMARY KEY (`id`),
  KEY `nguoiThucHien_id` (`nguoiThucHien_id`),
  CONSTRAINT `phieuxuat_ibfk_1` FOREIGN KEY (`nguoiThucHien_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu thông tin các phiếu xuất thiết bị';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieuxuat`
--

LOCK TABLES `phieuxuat` WRITE;
/*!40000 ALTER TABLE `phieuxuat` DISABLE KEYS */;
INSERT INTO `phieuxuat` VALUES (3,'2025-04-18 21:14:40',1,'thanh_ly','bán',50000.00,NULL),(4,'2025-04-20 19:14:34',1,'mat_mat','ggwp',25000.00,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745176476/nhapxuat_documents/uuxs0evc6hsidg0uer3g.jpg\"]'),(5,'2025-04-20 19:23:20',1,'mat_mat','ggwp',27000.00,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745177001/nhapxuat_documents/mkachg9z8ij8bmpbgpwt.jpg\"]'),(6,'2025-04-20 20:42:12',1,'thanh_ly','test thử tồn kho',28000.00,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745181734/nhapxuat_documents/tuugrlvanbmshgvwby8u.jpg\"]'),(7,'2025-04-24 22:52:01',1,'xuat_tra',NULL,NULL,'[\"https://res.cloudinary.com/dqs9zvox3/image/upload/v1745535124/nhapxuat_documents/p3ovvnwx4fjkvknxox4x.jpg\"]');
/*!40000 ALTER TABLE `phieuxuat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieuxuat_chitiet`
--

DROP TABLE IF EXISTS `phieuxuat_chitiet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieuxuat_chitiet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phieuxuat_id` int NOT NULL COMMENT 'ID của phiếu xuất liên quan',
  `thongtinthietbi_id` int NOT NULL COMMENT 'ID của thông tin thiết bị cụ thể được xuất',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_phieuxuat_thietbi` (`phieuxuat_id`,`thongtinthietbi_id`) COMMENT 'Mỗi thiết bị chỉ xuất hiện 1 lần/phiếu',
  KEY `thongtinthietbi_id` (`thongtinthietbi_id`),
  CONSTRAINT `phieuxuat_chitiet_ibfk_1` FOREIGN KEY (`phieuxuat_id`) REFERENCES `phieuxuat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phieuxuat_chitiet_ibfk_2` FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Chi tiết các thiết bị trong một phiếu xuất';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieuxuat_chitiet`
--

LOCK TABLES `phieuxuat_chitiet` WRITE;
/*!40000 ALTER TABLE `phieuxuat_chitiet` DISABLE KEYS */;
INSERT INTO `phieuxuat_chitiet` VALUES (3,3,170),(5,4,167),(4,4,169),(6,5,171),(7,6,168),(8,7,268);
/*!40000 ALTER TABLE `phieuxuat_chitiet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phong`
--

DROP TABLE IF EXISTS `phong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coSo` enum('Chính','Phụ') DEFAULT NULL,
  `toa` enum('A','B','C','D','E','F','H','T','V','X','I','G','J','K','L','Bãi giữ xe') DEFAULT NULL,
  `tang` int DEFAULT NULL,
  `soPhong` int DEFAULT NULL,
  `chucNang` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `phong_chk_1` CHECK ((`soPhong` between 1 and 20))
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phong`
--

LOCK TABLES `phong` WRITE;
/*!40000 ALTER TABLE `phong` DISABLE KEYS */;
INSERT INTO `phong` VALUES (1,'Chính','A',1,1,'Phòng Học'),(2,'Chính','A',2,3,'Phòng Học'),(3,'Chính','A',3,5,'Phòng Học'),(4,'Chính','A',6,5,'Phòng Học'),(6,'Chính','A',6,11,'Phòng Học'),(7,'Chính','A',7,13,'Phòng Học'),(9,'Chính','X',1,1,'Phòng Học'),(10,'Chính','X',10,12,'Phòng Học'),(11,'Chính','X',14,14,'Phòng Học'),(12,'Chính','E',1,1,'Hội Trường'),(13,'Chính','E',2,2,'Hội Trường'),(14,'Chính','E',3,3,'Hội Trường'),(15,'Chính','G',1,1,'KTX Nữ'),(16,'Chính','G',5,6,'KTX Nữ'),(17,'Chính','G',10,12,'KTX Nữ'),(18,'Chính','I',1,2,'KTX Nam'),(19,'Chính','I',6,7,'KTX Nam'),(20,'Chính','I',12,15,'KTX Nam'),(21,'Chính','Bãi giữ xe',1,1,'Giữ xe'),(22,'Chính','Bãi giữ xe',2,2,'Giữ xe'),(23,'Chính','Bãi giữ xe',3,3,'Giữ xe'),(24,'Chính','B',2,2,'Phòng Học'),(25,'Chính','C',2,3,'Phòng Học'),(26,'Chính','D',3,5,'Phòng Học'),(27,'Chính','F',4,7,'Phòng Học'),(28,'Chính','H',5,9,'Phòng Học'),(29,'Chính','T',6,12,'Phòng Học'),(30,'Phụ','J',1,1,'Phòng Học'),(31,'Phụ','K',2,4,'Phòng Học'),(33,'Chính','X',14,20,'Phòng Kiểm Tra'),(40,'Phụ','L',1,2,'Phòng Học'),(41,'Phụ','L',2,2,'Phòng Học L2.2'),(44,'Chính','A',1,2,'Phòng Học'),(45,'Chính','A',1,3,'Phòng Học A1.3'),(48,'Chính','A',1,4,'Phòng Học A1.4');
/*!40000 ALTER TABLE `phong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phong_thietbi`
--

DROP TABLE IF EXISTS `phong_thietbi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phong_thietbi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phong_id` int NOT NULL,
  `thietbi_id` int NOT NULL,
  `thongtinthietbi_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `phong_id` (`phong_id`),
  KEY `thietbi_id` (`thietbi_id`),
  KEY `thongtinthietbi_id` (`thongtinthietbi_id`),
  CONSTRAINT `phong_thietbi_ibfk_1` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `phong_thietbi_ibfk_2` FOREIGN KEY (`thietbi_id`) REFERENCES `thietbi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `phong_thietbi_ibfk_3` FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phong_thietbi`
--

LOCK TABLES `phong_thietbi` WRITE;
/*!40000 ALTER TABLE `phong_thietbi` DISABLE KEYS */;
INSERT INTO `phong_thietbi` VALUES (35,1,9,177),(36,1,9,178),(38,2,4,160),(44,1,4,161),(46,2,4,162),(49,3,4,163),(50,3,4,164),(51,4,3,155),(52,4,3,156),(53,4,3,157),(56,1,23,206),(57,6,23,207),(58,6,23,208),(59,6,23,209),(63,1,22,205),(66,7,25,257),(67,7,25,256),(68,7,25,255),(69,7,25,253),(70,7,25,254),(71,7,25,252);
/*!40000 ALTER TABLE `phong_thietbi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theloai`
--

DROP TABLE IF EXISTS `theloai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theloai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `theLoai` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--

LOCK TABLES `theloai` WRITE;
/*!40000 ALTER TABLE `theloai` DISABLE KEYS */;
INSERT INTO `theloai` VALUES (1,'Laptop'),(2,'Micro'),(3,'Máy In'),(4,'Bóng Đèn'),(5,'Máy Tính'),(6,'Điều Hòa'),(7,'Ghế'),(8,'Bàn'),(9,'Dây Điện'),(10,'Loa'),(11,'Quạt'),(12,'Tai Nghe'),(13,'Sạc Dự Phòng'),(16,'Remote');
/*!40000 ALTER TABLE `theloai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thietbi`
--

DROP TABLE IF EXISTS `thietbi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thietbi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `theloai_id` int DEFAULT NULL,
  `tenThietBi` varchar(255) NOT NULL,
  `moTa` text,
  `donGia` float NOT NULL DEFAULT '0',
  `tonKho` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `theloai_id` (`theloai_id`),
  CONSTRAINT `thietbi_ibfk_1` FOREIGN KEY (`theloai_id`) REFERENCES `theloai` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thietbi`
--

LOCK TABLES `thietbi` WRITE;
/*!40000 ALTER TABLE `thietbi` DISABLE KEYS */;
INSERT INTO `thietbi` VALUES (2,4,'Bóng Đèn Huỳnh Quang','Công Suất Cao Tiết Kiệm Điện',120000,5),(3,2,'Micro Shure SM58','Dòng micro dynamic',310000,5),(4,2,'Micro AKG D5','Thiết kế chống hú',275000,5),(6,3,'Máy In Canon PIXMA','In màu, kết nối WiFi',18500000,2),(7,4,'Bóng Đèn Philips LED','Công suất 9W, tiết kiệm điện',150000,7),(8,4,'Bóng Đèn Rạng Đông','Bóng LED 18W, ánh sáng trắng',160000,3),(9,1,'Laptop MSI','Dùng để chơi game',25000000,2),(18,5,'Desktop Gaming','I5 12400F, RTX 5090, 64 gb Ram',20000000,1),(20,12,'Airpod Pro 2025','Tai Nghe của hãng Apple, Chống Ồn, Âm Thanh 3D sống động',4000000,5),(21,3,'Máy In Hp','Máy In Hp hiện đại ',18000000,2),(22,8,'Bàn Học ','Bàn Học Đơn 60x80cm',300000,20),(23,1,'Laptop HP','Thiết kế gọn nhẹ, hiệu năng tốt, phù hợp cho các tác vụ văn phòng.',11000000,6),(25,7,'Ghế học','Dùng chung với bàn học, ghế rộng, chất liệu gỗ tốt.',200000,11),(26,10,'Loa JBL','Âm thanh to rõ, pin trâu, tích hợp Bluetooth 5.0',12000000,1),(30,1,'Laptop Dell','Thiết kế tinh tế, sang trọng, cấu hình mạnh',8000000,0);
/*!40000 ALTER TABLE `thietbi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thongtinthietbi`
--

DROP TABLE IF EXISTS `thongtinthietbi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thongtinthietbi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thietbi_id` int NOT NULL,
  `phong_id` int DEFAULT NULL,
  `nguoiDuocCap` varchar(100) DEFAULT NULL,
  `tenThietBi` varchar(255) NOT NULL,
  `phieunhap_id` int DEFAULT NULL,
  `ngayMua` date DEFAULT NULL COMMENT 'Ngày mua thực tế (có thể khác ngày nhập kho)',
  `giaTriBanDau` decimal(15,2) DEFAULT NULL COMMENT 'Giá trị ban đầu của thiết bị',
  `tinhTrang` enum('con_bao_hanh','het_bao_hanh','dang_bao_hanh','cho_thanh_ly','da_thanh_ly','de_xuat_thanh_ly','da_bao_hanh') NOT NULL DEFAULT 'con_bao_hanh',
  `thoiGianBaoHanh` int DEFAULT NULL COMMENT 'Thời gian bảo hành (tháng)',
  `ngayBaoHanhKetThuc` date DEFAULT NULL COMMENT 'Ngày bảo hành kết thúc',
  `ngayDuKienTra` date DEFAULT NULL COMMENT 'Ngày dự kiến trả thiết bị từ bảo hành',
  PRIMARY KEY (`id`),
  KEY `thietbi_id` (`thietbi_id`),
  KEY `phong_id` (`phong_id`),
  KEY `phieunhap_id` (`phieunhap_id`),
  CONSTRAINT `ThongTinThietBi_ibfk_1` FOREIGN KEY (`thietbi_id`) REFERENCES `thietbi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ThongTinThietBi_ibfk_2` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ThongTinThietBi_ibfk_3` FOREIGN KEY (`phieunhap_id`) REFERENCES `phieunhap` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=269 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongtinthietbi`
--

LOCK TABLES `thongtinthietbi` WRITE;
/*!40000 ALTER TABLE `thongtinthietbi` DISABLE KEYS */;
INSERT INTO `thongtinthietbi` VALUES (150,2,11,NULL,'Bóng Đèn Huỳnh Quang',67,NULL,120000.00,'con_bao_hanh',12,'2026-03-30',NULL),(151,2,11,NULL,'Bóng Đèn Huỳnh Quang',67,NULL,120000.00,'con_bao_hanh',12,'2026-03-30',NULL),(152,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,NULL,120000.00,'con_bao_hanh',12,'2026-03-30',NULL),(153,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,NULL,120000.00,'con_bao_hanh',12,'2026-03-30',NULL),(154,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,NULL,120000.00,'con_bao_hanh',12,'2026-03-30',NULL),(155,3,4,'Lê Khải','Micro Shure SM58',67,NULL,310000.00,'con_bao_hanh',12,'2026-03-30',NULL),(156,3,4,NULL,'Micro Shure SM58',67,NULL,310000.00,'con_bao_hanh',12,'2026-03-30',NULL),(157,3,4,'Minh Hùng','Micro Shure SM58',67,NULL,310000.00,'con_bao_hanh',12,'2026-03-30',NULL),(158,3,NULL,NULL,'Micro Shure SM58',67,NULL,310000.00,'con_bao_hanh',12,'2026-03-30',NULL),(159,3,NULL,NULL,'Micro Shure SM58',67,NULL,310000.00,'con_bao_hanh',12,'2026-03-30',NULL),(160,4,2,NULL,'Micro AKG D5',73,NULL,275000.00,'cho_thanh_ly',12,'2026-03-30',NULL),(161,4,1,NULL,'Micro AKG D5',73,NULL,275000.00,'da_bao_hanh',12,'2026-03-30',NULL),(162,4,2,NULL,'Micro AKG D5',73,NULL,275000.00,'con_bao_hanh',12,'2026-03-30',NULL),(163,4,3,NULL,'Micro AKG D5',73,NULL,275000.00,'con_bao_hanh',12,'2026-03-30',NULL),(164,4,3,NULL,'Micro AKG D5',73,NULL,275000.00,'con_bao_hanh',12,'2026-03-30',NULL),(165,6,NULL,NULL,'Máy In Canon PIXMA',74,NULL,18500000.00,'con_bao_hanh',36,'2028-03-30',NULL),(166,6,14,NULL,'Máy In Canon PIXMA',74,NULL,18500000.00,'con_bao_hanh',36,'2028-03-30',NULL),(167,7,NULL,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'da_thanh_ly',14,'2026-05-30',NULL),(168,7,NULL,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'da_thanh_ly',14,'2026-05-30',NULL),(169,7,NULL,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'da_thanh_ly',14,'2026-05-30',NULL),(170,7,NULL,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'da_thanh_ly',14,'2026-05-30',NULL),(171,7,NULL,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'da_thanh_ly',14,'2026-05-30',NULL),(172,7,NULL,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'het_bao_hanh',14,'2026-05-30',NULL),(173,7,7,NULL,'Bóng Đèn Philips LED',74,NULL,150000.00,'con_bao_hanh',14,'2026-05-30',NULL),(174,8,15,NULL,'Bóng Đèn Rạng Đông',75,NULL,160000.00,'con_bao_hanh',24,'2027-03-30',NULL),(175,8,15,NULL,'Bóng Đèn Rạng Đông',75,NULL,160000.00,'con_bao_hanh',24,'2027-03-30',NULL),(176,8,15,NULL,'Bóng Đèn Rạng Đông',75,NULL,160000.00,'con_bao_hanh',24,'2027-03-30',NULL),(177,9,1,NULL,'Laptop MSI',75,NULL,25000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(178,9,1,NULL,'Laptop MSI',75,NULL,25000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(179,18,NULL,NULL,'Desktop Gaming',76,NULL,20000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(180,20,12,NULL,'Airpod Pro 2025',76,NULL,4000000.00,'con_bao_hanh',28,'2027-07-30',NULL),(181,20,12,NULL,'Airpod Pro 2025',76,NULL,4000000.00,'con_bao_hanh',28,'2027-07-30',NULL),(182,20,12,NULL,'Airpod Pro 2025',76,NULL,4000000.00,'con_bao_hanh',28,'2027-07-30',NULL),(184,21,NULL,NULL,'Máy In Hp',78,NULL,18000000.00,'con_bao_hanh',34,'2028-01-30',NULL),(185,21,13,NULL,'Máy In Hp',79,NULL,18000000.00,'con_bao_hanh',23,'2027-02-28',NULL),(186,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(187,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(188,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(189,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(190,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(191,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(192,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(193,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(194,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(195,22,NULL,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(196,22,18,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(197,22,18,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(198,22,18,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(199,22,17,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(200,22,17,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(201,22,16,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(202,22,16,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(203,22,10,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(204,22,10,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(205,22,1,NULL,'Bàn Học ',80,NULL,300000.00,'con_bao_hanh',45,'2028-12-30',NULL),(206,23,1,NULL,'Laptop HP',81,NULL,11000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(207,23,6,NULL,'Laptop HP',81,NULL,11000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(208,23,6,NULL,'Laptop HP',81,NULL,11000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(209,23,6,NULL,'Laptop HP',81,NULL,11000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(210,23,11,NULL,'Laptop HP',81,NULL,11000000.00,'con_bao_hanh',36,'2028-03-30',NULL),(224,23,11,NULL,'Laptop HP',89,NULL,11000000.00,'con_bao_hanh',72,'2031-04-09',NULL),(247,25,9,NULL,'Ghế học',94,NULL,200000.00,'het_bao_hanh',2,'2025-06-10',NULL),(248,25,9,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(249,25,9,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(250,25,9,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(251,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(252,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(253,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(254,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(255,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(256,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(257,25,7,NULL,'Ghế học',95,NULL,200000.00,'con_bao_hanh',1,'2025-05-12',NULL),(258,20,NULL,NULL,'Airpod Pro 2025',96,NULL,4000000.00,'con_bao_hanh',12,'2026-04-20',NULL),(259,20,NULL,NULL,'Airpod Pro 2025',96,NULL,4000000.00,'con_bao_hanh',12,'2026-04-20',NULL),(260,26,NULL,NULL,'Loa JBL',97,NULL,12000000.00,'con_bao_hanh',12,'2026-04-21',NULL),(261,26,NULL,NULL,'Loa JBL',98,'2025-04-21',12000000.00,'con_bao_hanh',12,'2026-04-21',NULL),(262,26,NULL,NULL,'Loa JBL',98,'2025-02-12',140000.00,'con_bao_hanh',12,'2026-02-12',NULL),(263,26,NULL,NULL,'Loa JBL',99,'2025-04-22',12000000.00,'con_bao_hanh',12,'2026-04-22',NULL),(264,4,NULL,NULL,'Micro AKG D5',100,'2026-12-12',275000.00,'con_bao_hanh',12,'2027-12-12',NULL),(265,20,NULL,NULL,'Airpod Pro 2025',101,'2025-04-21',4000000.00,'con_bao_hanh',12,'2026-04-21',NULL),(266,20,NULL,NULL,'Airpod Pro 2025',101,'2025-04-30',5000000.00,'con_bao_hanh',22,'2027-03-02',NULL),(267,9,NULL,NULL,'Laptop MSI',102,NULL,25000000.00,'con_bao_hanh',12,NULL,NULL),(268,30,NULL,NULL,'Laptop Dell',103,'2025-04-25',8000000.00,'da_thanh_ly',24,'2027-04-25',NULL);
/*!40000 ALTER TABLE `thongtinthietbi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `hoTen` varchar(100) NOT NULL,
  `ngaySinh` date DEFAULT NULL,
  `gioiTinh` enum('Nam','Nữ','Khác') DEFAULT 'Nam',
  `sDT` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `hinhAnh` varchar(255) DEFAULT NULL,
  `role` enum('admin','nguoidung','nhanvien') DEFAULT 'nguoidung',
  `tinhTrang` enum('on','off') DEFAULT 'on',
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$yufXko9XShE85gJeSP7sc.PDI42WHtZwhHQzkbKaEjdvRZETJ0ht.','Admin',NULL,'Nam',NULL,NULL,NULL,'admin','on',NULL,NULL),(2,'hung1806','$2b$10$Otg0ehQEBO/48KI4xNJ3R.EXx/ijFu8lRLjIqbMA5yUVyekdTIFSm','Phạm Minh Hùng','2001-06-18','Nam','0589898989','minhhungbackup1806@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1740675683/avatars/icmscyq4wqyzpunsav98.jpg','nhanvien','on','b078cc6341009671b365cbd6e3de1ad01eff8f12','2025-04-10 20:53:45'),(3,'khai123','$2b$10$baM6xf68qqvvdI1soFe9fONnEf/dMMjSfSi3xMsH7Fr7E11MPE6b6','Đinh Lê Khải','2011-11-09','Nam','012345678','dinhlekhai@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1744286256/avatars/rkn6gnixei00v53bzcc7.jpg','nhanvien','on',NULL,NULL),(4,'testuser','$2b$10$52lhJF7aT9dmHBbOfofYg.NNXkJQOmljQfXgRc2YccgEo32mXVu0C','Phạm Văn Test','2012-10-08','Khác','0999999999','phamvantet@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1740919997/avatars/nbm5heihwzluedfnk2tp.png','nguoidung','on',NULL,NULL),(20,'nhanvien1','$2b$10$rje80jL8dm7QZr2O9rEEceXmVEnDq5QAOQF6A/1fVXPQgVyrn9e9y','Nhân Văn Viên ',NULL,'Khác',NULL,'nv1@gmail.com',NULL,'nhanvien','on',NULL,NULL),(21,'nhanvien2','$2b$10$kNxJBoupO9bC2Z5m9vb31eSnlzp1tpg7NvumJnesqixj.N59OfwPW','Viên Nhân Phan',NULL,'Nữ',NULL,'nv2@mail.com',NULL,'nhanvien','on',NULL,NULL),(22,'nhanvien3','$2b$10$4TgPFoD2rZws3UWf8ij.i.Lk.t.jUP4DnfBchfmNxOwzpVofjZz72','Hoàng Huy Hùng',NULL,'Nam',NULL,'tripleh@mail.com',NULL,'nhanvien','on',NULL,NULL),(23,'nhanvien4','$2b$10$dsLE37W1mPHuvN.pK/cKROALQBy9avOE/5cXOTxkE3h3ZnIhFNnZG','Phùng Văn Từ',NULL,'Nữ',NULL,'pvtu4@mail.com',NULL,'nhanvien','on',NULL,NULL),(24,'nhanvien5','$2b$10$rRYQ9f7EoAusLSkmH9/7t.FLylNCbxOUjsSTyCiUFDCgCLVSrybgi','Nguyễn Phan Lưu Chương',NULL,'Nữ',NULL,'nguyenphanluuchuong1@mail.com',NULL,'nhanvien','on',NULL,NULL),(28,'hungviper','$2b$10$VC6BcPAot/UGgTYdqzj52umDRlBedx.EtnwclJn/POXaBEP6W/UBi','Phạm Minh Tinh','2001-06-17','Nữ','999999999','wildentertainment123@gmail.com',NULL,'nhanvien','on',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'qltbdt'
--

--
-- Dumping routines for database 'qltbdt'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-26  4:02:11
