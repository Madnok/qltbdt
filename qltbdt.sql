CREATE DATABASE  IF NOT EXISTS `qltbdt` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `qltbdt`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: qltbdt
-- ------------------------------------------------------
-- Server version	8.0.41

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
  `hinhAnh` varchar(255) DEFAULT NULL,
  `tinhTrang` enum('Tốt','Đang Xử Lý') DEFAULT 'Tốt',
  `ngayBaoHong` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `loaithiethai` enum('Kết Cấu','Hệ Thống Điện','Hệ Thống Nước','Các Loại Thiết Bị','Khác') NOT NULL,
  `nhanvien_id` int DEFAULT NULL,
  `thoiGianXuLy` timestamp NULL DEFAULT NULL,
  `trangThai` enum('Chờ Duyệt','Đang Xử Lý','Hoàn Thành') DEFAULT 'Chờ Duyệt',
  `mucDoUuTien` enum('Cao','Trung Bình','Thấp') DEFAULT 'Trung Bình',
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baohong`
--

LOCK TABLES `baohong` WRITE;
/*!40000 ALTER TABLE `baohong` DISABLE KEYS */;
INSERT INTO `baohong` VALUES (1,NULL,NULL,1,NULL,'Nhẹ','Nứt Vách Trái phòng',NULL,'Tốt','2025-03-30 21:32:33','Kết Cấu',NULL,NULL,'Chờ Duyệt','Trung Bình'),(15,9,177,1,NULL,'Vừa','sdfgdf',NULL,'Tốt','2025-03-30 22:20:55','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt','Trung Bình'),(16,9,178,1,NULL,'Vừa','sdfgdf',NULL,'Tốt','2025-03-30 22:20:55','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt','Trung Bình'),(18,4,160,2,NULL,'Nặng','k nói được ',NULL,'Tốt','2025-03-30 23:10:27','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt','Trung Bình'),(19,4,161,1,NULL,'Nặng','Gãy làm 2',NULL,'Tốt','2025-03-30 23:23:37','Các Loại Thiết Bị',NULL,NULL,'Chờ Duyệt','Trung Bình'),(20,NULL,NULL,28,NULL,'Nhẹ','asdasdasdvf21',NULL,'Tốt','2025-03-30 23:24:55','Khác',NULL,NULL,'Chờ Duyệt','Trung Bình'),(21,NULL,NULL,31,NULL,'Nặng','Dột Nóc Nhà + Bể Gạch',NULL,'Tốt','2025-03-30 23:43:44','Khác',NULL,NULL,'Chờ Duyệt','Trung Bình'),(22,NULL,NULL,31,NULL,'Nhẹ','Úm ba la',NULL,'Tốt','2025-04-02 13:06:16','Kết Cấu',NULL,NULL,'Chờ Duyệt','Trung Bình');
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
-- Table structure for table `baohong_lichtruc`
--

DROP TABLE IF EXISTS `baohong_lichtruc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baohong_lichtruc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `baohong_id` int NOT NULL,
  `lichtruc_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_baohong` (`baohong_id`),
  KEY `fk_lichtruc` (`lichtruc_id`),
  CONSTRAINT `fk_baohong` FOREIGN KEY (`baohong_id`) REFERENCES `baohong` (`id`),
  CONSTRAINT `fk_lichtruc` FOREIGN KEY (`lichtruc_id`) REFERENCES `lichtruc` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baohong_lichtruc`
--

LOCK TABLES `baohong_lichtruc` WRITE;
/*!40000 ALTER TABLE `baohong_lichtruc` DISABLE KEYS */;
/*!40000 ALTER TABLE `baohong_lichtruc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baotri`
--

DROP TABLE IF EXISTS `baotri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baotri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhanvien_id` int NOT NULL,
  `baohong_id` int DEFAULT NULL,
  `thongtinthietbi_id` int DEFAULT NULL,
  `phong_id` int NOT NULL,
  `hoatdong` text NOT NULL,
  `thoiGian` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `nhanvien_id` (`nhanvien_id`),
  KEY `baohong_id` (`baohong_id`),
  KEY `thongtinthietbi_id` (`thongtinthietbi_id`),
  KEY `phong_id` (`phong_id`),
  CONSTRAINT `baotri_ibfk_1` FOREIGN KEY (`nhanvien_id`) REFERENCES `users` (`id`),
  CONSTRAINT `baotri_ibfk_2` FOREIGN KEY (`baohong_id`) REFERENCES `baohong` (`id`),
  CONSTRAINT `baotri_ibfk_3` FOREIGN KEY (`thongtinthietbi_id`) REFERENCES `thongtinthietbi` (`id`),
  CONSTRAINT `baotri_ibfk_4` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baotri`
--

LOCK TABLES `baotri` WRITE;
/*!40000 ALTER TABLE `baotri` DISABLE KEYS */;
/*!40000 ALTER TABLE `baotri` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichtruc`
--

LOCK TABLES `lichtruc` WRITE;
/*!40000 ALTER TABLE `lichtruc` DISABLE KEYS */;
INSERT INTO `lichtruc` VALUES (7,2,'Phạm Minh Hùng',NULL,'Ca Sáng','2025-04-03 01:00:00','2025-04-03 08:00:00','Đang Chờ',0,''),(17,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-04 08:00:00','2025-04-04 15:00:00','Đang Chờ',0,NULL),(18,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-05 08:00:00','2025-04-05 15:00:00','Đang Chờ',0,NULL),(19,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-06 08:00:00','2025-04-06 15:00:00','Đang Chờ',0,NULL),(20,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-07 08:00:00','2025-04-07 15:00:00','Đang Chờ',0,NULL),(21,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-08 08:00:00','2025-04-08 15:00:00','Đang Chờ',0,NULL),(22,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-09 08:00:00','2025-04-09 15:00:00','Đang Chờ',0,NULL),(23,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-10 08:00:00','2025-04-10 15:00:00','Đang Chờ',0,NULL),(24,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-11 08:00:00','2025-04-11 15:00:00','Đang Chờ',0,NULL),(25,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-12 08:00:00','2025-04-12 15:00:00','Đang Chờ',0,NULL),(26,2,'Phạm Minh Hùng',NULL,'Ca Chiều','2025-04-13 08:00:00','2025-04-13 15:00:00','Đang Chờ',0,NULL),(27,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-04 08:00:00','2025-04-04 15:00:00','Đang Chờ',0,'đúp ca nha cưng~~'),(28,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-05 08:00:00','2025-04-05 15:00:00','Đang Chờ',0,'đúp ca nha cưng~~'),(29,3,'Đinh Lê Khải',NULL,'Ca Chiều','2025-04-06 08:00:00','2025-04-06 15:00:00','Đang Chờ',0,'đúp ca nha cưng~~');
/*!40000 ALTER TABLE `lichtruc` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu trữ việc phân công phòng cố định cho nhân viên';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhanvien_phong_phutrach`
--

LOCK TABLES `nhanvien_phong_phutrach` WRITE;
/*!40000 ALTER TABLE `nhanvien_phong_phutrach` DISABLE KEYS */;
INSERT INTO `nhanvien_phong_phutrach` VALUES (1,2,1,'2025-04-04 17:24:44'),(2,2,2,'2025-04-04 17:24:44'),(3,2,3,'2025-04-04 17:24:44'),(4,2,4,'2025-04-04 17:24:44'),(5,2,6,'2025-04-04 17:24:44'),(6,2,7,'2025-04-04 17:24:44');
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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `phieunhap_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieunhap`
--

LOCK TABLES `phieunhap` WRITE;
/*!40000 ALTER TABLE `phieunhap` DISABLE KEYS */;
INSERT INTO `phieunhap` VALUES (67,1,'Admin','2025-03-30 03:16:00','muaMoi'),(73,1,'Admin','2025-03-30 04:55:00','muaMoi'),(74,1,'Admin','2025-03-30 05:19:00','muaMoi'),(75,1,'Admin','2025-03-30 07:08:00','taiTro'),(76,1,'Admin','2025-03-30 07:09:00','taiTro'),(78,1,'Admin','2025-03-30 07:31:00','muaMoi'),(79,1,'Admin','2025-03-30 07:31:00','muaMoi'),(80,1,'Admin','2025-03-30 08:37:00','taiTro'),(81,1,'Admin','2025-03-30 21:03:00','taiTro');
/*!40000 ALTER TABLE `phieunhap` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phong`
--

LOCK TABLES `phong` WRITE;
/*!40000 ALTER TABLE `phong` DISABLE KEYS */;
INSERT INTO `phong` VALUES (1,'Chính','A',1,1,'Phòng Học'),(2,'Chính','A',2,3,'Phòng Học'),(3,'Chính','A',3,5,'Phòng Học'),(4,'Chính','A',6,5,'Phòng Học'),(6,'Chính','A',6,11,'Phòng Học'),(7,'Chính','A',7,13,'Phòng Học'),(8,'Chính','X',1,1,'Phòng Học'),(9,'Chính','X',5,8,'Phòng Học'),(10,'Chính','X',10,12,'Phòng Học'),(11,'Chính','X',14,15,'Phòng Học'),(12,'Chính','E',1,1,'Hội Trường'),(13,'Chính','E',2,2,'Hội Trường'),(14,'Chính','E',3,3,'Hội Trường'),(15,'Chính','G',1,1,'KTX Nữ'),(16,'Chính','G',5,6,'KTX Nữ'),(17,'Chính','G',10,12,'KTX Nữ'),(18,'Chính','I',1,2,'KTX Nam'),(19,'Chính','I',6,7,'KTX Nam'),(20,'Chính','I',12,15,'KTX Nam'),(21,'Chính','Bãi giữ xe',1,1,'Giữ xe'),(22,'Chính','Bãi giữ xe',2,2,'Giữ xe'),(23,'Chính','Bãi giữ xe',3,3,'Giữ xe'),(24,'Chính','B',2,2,'Phòng Học'),(25,'Chính','C',2,3,'Phòng Học'),(26,'Chính','D',3,5,'Phòng Học'),(27,'Chính','F',4,7,'Phòng Học'),(28,'Chính','H',5,9,'Phòng Học'),(29,'Chính','T',6,12,'Phòng Học'),(30,'Phụ','J',1,1,'Phòng Học'),(31,'Phụ','K',2,4,'Phòng Học'),(33,'Chính','X',14,20,'Phòng Kiểm Tra'),(40,'Phụ','L',1,2,'Phòng Học'),(41,'Phụ','L',2,2,'Phòng Học');
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
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phong_thietbi`
--

LOCK TABLES `phong_thietbi` WRITE;
/*!40000 ALTER TABLE `phong_thietbi` DISABLE KEYS */;
INSERT INTO `phong_thietbi` VALUES (35,1,9,177),(36,1,9,178),(38,2,4,160),(44,1,4,161),(46,2,4,162),(49,3,4,163),(50,3,4,164),(51,4,3,155),(52,4,3,156),(53,4,3,157),(56,1,23,206);
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--

LOCK TABLES `theloai` WRITE;
/*!40000 ALTER TABLE `theloai` DISABLE KEYS */;
INSERT INTO `theloai` VALUES (1,'Laptop'),(2,'Micro'),(3,'Máy In'),(4,'Bóng Đèn'),(5,'Máy Tính'),(6,'Điều Hòa'),(7,'Ghế'),(8,'Bàn'),(9,'Dây Điện'),(10,'Loa'),(11,'Quạt'),(12,'Tai Nghe'),(13,'Sạc Dự Phòng'),(14,'Hệ Thống Nước');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thietbi`
--

LOCK TABLES `thietbi` WRITE;
/*!40000 ALTER TABLE `thietbi` DISABLE KEYS */;
INSERT INTO `thietbi` VALUES (2,4,'Bóng Đèn Huỳnh Quang','Công Suất Cao Tiết Kiệm Điện',120000,5),(3,2,'Micro Shure SM58','Dòng micro dynamic',310000,5),(4,2,'Micro AKG D5','Thiết kế chống hú',275000,5),(6,3,'Máy In Canon PIXMA','In màu, kết nối WiFi',18500000,2),(7,4,'Bóng Đèn Philips LED','Công suất 9W, tiết kiệm điện',150000,7),(8,4,'Bóng Đèn Rạng Đông','Bóng LED 18W, ánh sáng trắng',160000,3),(9,1,'Laptop MSI','Dùng để chơi game',25000000,2),(18,5,'Desktop Gaming','I5 12400F, RTX 5090, 64 gb Ram',20000000,1),(20,12,'Airpod Pro 2025','Tai Nghe của hãng Apple, Chống Ồn, Âm Thanh 3D sống động',4000000,3),(21,3,'Máy In Hp','Máy In Hp hiện đại ',18000000,2),(22,8,'Bàn Học ','Bàn Học Đơn 60x80cm',300000,20),(23,1,'Laptop HP','Thiết kế gọn nhẹ, hiệu năng tốt, phù hợp cho các tác vụ văn phòng.',11000000,5);
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
  `tinhTrang` enum('con_bao_hanh','het_bao_hanh') NOT NULL DEFAULT 'con_bao_hanh',
  `thoiGianBaoHanh` int DEFAULT NULL COMMENT 'Thời gian bảo hành (tháng)',
  `ngayBaoHanhKetThuc` date DEFAULT NULL COMMENT 'Ngày bảo hành kết thúc',
  PRIMARY KEY (`id`),
  KEY `thietbi_id` (`thietbi_id`),
  KEY `phong_id` (`phong_id`),
  KEY `phieunhap_id` (`phieunhap_id`),
  CONSTRAINT `ThongTinThietBi_ibfk_1` FOREIGN KEY (`thietbi_id`) REFERENCES `thietbi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ThongTinThietBi_ibfk_2` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ThongTinThietBi_ibfk_3` FOREIGN KEY (`phieunhap_id`) REFERENCES `phieunhap` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=215 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongtinthietbi`
--

LOCK TABLES `thongtinthietbi` WRITE;
/*!40000 ALTER TABLE `thongtinthietbi` DISABLE KEYS */;
INSERT INTO `thongtinthietbi` VALUES (150,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,'con_bao_hanh',12,'2026-03-30'),(151,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,'con_bao_hanh',12,'2026-03-30'),(152,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,'con_bao_hanh',12,'2026-03-30'),(153,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,'con_bao_hanh',12,'2026-03-30'),(154,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',67,'con_bao_hanh',12,'2026-03-30'),(155,3,NULL,'Lê Khải','Micro Shure SM58',67,'con_bao_hanh',12,'2026-03-30'),(156,3,NULL,NULL,'Micro Shure SM58',67,'con_bao_hanh',12,'2026-03-30'),(157,3,NULL,'Minh Hùng','Micro Shure SM58',67,'con_bao_hanh',12,'2026-03-30'),(158,3,NULL,NULL,'Micro Shure SM58',67,'con_bao_hanh',12,'2026-03-30'),(159,3,NULL,NULL,'Micro Shure SM58',67,'con_bao_hanh',12,'2026-03-30'),(160,4,NULL,NULL,'Micro AKG D5',73,'con_bao_hanh',12,'2026-03-30'),(161,4,NULL,NULL,'Micro AKG D5',73,'con_bao_hanh',12,'2026-03-30'),(162,4,NULL,NULL,'Micro AKG D5',73,'con_bao_hanh',12,'2026-03-30'),(163,4,NULL,NULL,'Micro AKG D5',73,'con_bao_hanh',12,'2026-03-30'),(164,4,NULL,NULL,'Micro AKG D5',73,'con_bao_hanh',12,'2026-03-30'),(165,6,NULL,NULL,'Máy In Canon PIXMA',74,'con_bao_hanh',36,'2028-03-30'),(166,6,NULL,NULL,'Máy In Canon PIXMA',74,'con_bao_hanh',36,'2028-03-30'),(167,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(168,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(169,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(170,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(171,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(172,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(173,7,NULL,NULL,'Bóng Đèn Philips LED',74,'con_bao_hanh',14,'2026-05-30'),(174,8,NULL,NULL,'Bóng Đèn Rạng Đông',75,'con_bao_hanh',24,'2027-03-30'),(175,8,NULL,NULL,'Bóng Đèn Rạng Đông',75,'con_bao_hanh',24,'2027-03-30'),(176,8,NULL,NULL,'Bóng Đèn Rạng Đông',75,'con_bao_hanh',24,'2027-03-30'),(177,9,NULL,NULL,'Laptop MSI',75,'con_bao_hanh',36,'2028-03-30'),(178,9,NULL,NULL,'Laptop MSI',75,'con_bao_hanh',36,'2028-03-30'),(179,18,NULL,NULL,'Desktop Gaming',76,'con_bao_hanh',36,'2028-03-30'),(180,20,NULL,NULL,'Airpod Pro 2025',76,'con_bao_hanh',28,'2027-07-30'),(181,20,NULL,NULL,'Airpod Pro 2025',76,'con_bao_hanh',28,'2027-07-30'),(182,20,NULL,NULL,'Airpod Pro 2025',76,'con_bao_hanh',28,'2027-07-30'),(184,21,NULL,NULL,'Máy In Hp',78,'con_bao_hanh',34,'2028-01-30'),(185,21,NULL,NULL,'Máy In Hp',79,'con_bao_hanh',23,'2027-02-28'),(186,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(187,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(188,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(189,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(190,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(191,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(192,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(193,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(194,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(195,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(196,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(197,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(198,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(199,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(200,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(201,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(202,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(203,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(204,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(205,22,NULL,NULL,'Bàn Học ',80,'con_bao_hanh',45,'2028-12-30'),(206,23,NULL,NULL,'Laptop HP',81,'con_bao_hanh',36,'2028-03-30'),(207,23,NULL,NULL,'Laptop HP',81,'con_bao_hanh',36,'2028-03-30'),(208,23,NULL,NULL,'Laptop HP',81,'con_bao_hanh',36,'2028-03-30'),(209,23,NULL,NULL,'Laptop HP',81,'con_bao_hanh',36,'2028-03-30'),(210,23,NULL,NULL,'Laptop HP',81,'con_bao_hanh',36,'2028-03-30');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$yufXko9XShE85gJeSP7sc.PDI42WHtZwhHQzkbKaEjdvRZETJ0ht.','Admin',NULL,'Nam',NULL,NULL,NULL,'admin','on'),(2,'hung1806','$2b$10$CNvZl4yWWejIXICC8zz79.HcKQlRfInP5hBNqNzOyi9oc/MYRO5US','Phạm Minh Hùng','2001-06-20','Khác','0589898989','minhhungbackup1806@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1740675683/avatars/icmscyq4wqyzpunsav98.jpg','nhanvien','on'),(3,'khai123','$2b$10$baM6xf68qqvvdI1soFe9fONnEf/dMMjSfSi3xMsH7Fr7E11MPE6b6','Đinh Lê Khải','2011-11-09','Nam','012345678','dinhlekhai@gmail.com',NULL,'nhanvien','on'),(4,'testuser','$2b$10$52lhJF7aT9dmHBbOfofYg.NNXkJQOmljQfXgRc2YccgEo32mXVu0C','Phạm Văn Test','2012-10-08','Khác','0999999999','phamvantet@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1740919997/avatars/nbm5heihwzluedfnk2tp.png','nguoidung','on'),(20,'nhanvien1','$2b$10$rje80jL8dm7QZr2O9rEEceXmVEnDq5QAOQF6A/1fVXPQgVyrn9e9y','Nhân Văn Viên ',NULL,'Khác',NULL,'nv1@gmail.com',NULL,'nhanvien','on'),(21,'nhanvien2','$2b$10$kNxJBoupO9bC2Z5m9vb31eSnlzp1tpg7NvumJnesqixj.N59OfwPW','Viên Nhân Phan',NULL,'Nữ',NULL,'nv2@mail.com',NULL,'nhanvien','on'),(22,'nhanvien3','$2b$10$4TgPFoD2rZws3UWf8ij.i.Lk.t.jUP4DnfBchfmNxOwzpVofjZz72','Hoàng Huy Hùng',NULL,'Nam',NULL,'tripleh@mail.com',NULL,'nhanvien','on'),(23,'nhanvien4','$2b$10$dsLE37W1mPHuvN.pK/cKROALQBy9avOE/5cXOTxkE3h3ZnIhFNnZG','Phùng Văn Từ',NULL,'Nữ',NULL,'pvtu4@mail.com',NULL,'nhanvien','on'),(24,'nhanvien5','$2b$10$rRYQ9f7EoAusLSkmH9/7t.FLylNCbxOUjsSTyCiUFDCgCLVSrybgi','Nguyễn Phan Lưu Chương',NULL,'Nam',NULL,'nguyenphanluuchuong1@mail.com',NULL,'nhanvien','on'),(25,'nhanvien6','$2b$10$F2Mkg62nsHHWWsO1bE6YEeofs7qOV2Kmx2jexa8p3PAF2LWAuvzi.','Văn Hải Quỳnh',NULL,'Khác',NULL,'nv5@mail.com',NULL,'nhanvien','on');
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

-- Dump completed on 2025-04-05  1:01:21
