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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieunhap`
--

LOCK TABLES `phieunhap` WRITE;
/*!40000 ALTER TABLE `phieunhap` DISABLE KEYS */;
INSERT INTO `phieunhap` VALUES (1,1,'Admin','2025-03-03 02:53:08','muaMoi');
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phong`
--

LOCK TABLES `phong` WRITE;
/*!40000 ALTER TABLE `phong` DISABLE KEYS */;
INSERT INTO `phong` VALUES (1,'Chính','A',1,1,'Phòng Học'),(2,'Chính','A',2,3,'Phòng Học'),(3,'Chính','A',3,5,'Phòng Học'),(4,'Chính','A',7,5,'Phòng Học'),(5,'Chính','A',5,9,'Phòng Học'),(6,'Chính','A',6,11,'Phòng Học'),(7,'Chính','A',7,13,'Phòng Học'),(8,'Chính','X',1,1,'Phòng Học'),(9,'Chính','X',5,8,'Phòng Học'),(10,'Chính','X',10,12,'Phòng Học'),(11,'Chính','X',14,15,'Phòng Học'),(12,'Chính','E',1,1,'Hội Trường'),(13,'Chính','E',2,2,'Hội Trường'),(14,'Chính','E',3,3,'Hội Trường'),(15,'Chính','G',1,1,'KTX Nữ'),(16,'Chính','G',5,6,'KTX Nữ'),(17,'Chính','G',10,12,'KTX Nữ'),(18,'Chính','I',1,2,'KTX Nam'),(19,'Chính','I',6,7,'KTX Nam'),(20,'Chính','I',12,15,'KTX Nam'),(21,'Chính','Bãi giữ xe',1,1,'Bãi giữ xe'),(22,'Chính','Bãi giữ xe',2,2,'Bãi giữ xe'),(23,'Chính','Bãi giữ xe',3,3,'Bãi giữ xe'),(24,'Chính','B',2,2,'Phòng Học'),(25,'Chính','C',2,3,'Phòng Học'),(26,'Chính','D',3,5,'Phòng Học'),(27,'Chính','F',4,7,'Phòng Học'),(28,'Chính','H',5,9,'Phòng Học'),(29,'Chính','T',6,12,'Phòng Học'),(30,'Phụ','J',1,1,'Phòng Học'),(31,'Phụ','K',2,4,'Phòng Học'),(33,'Chính','X',14,20,'Phòng Kiểm Tra'),(34,'Phụ','K',6,20,'Phòng Thực Hành');
/*!40000 ALTER TABLE `phong` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--

LOCK TABLES `theloai` WRITE;
/*!40000 ALTER TABLE `theloai` DISABLE KEYS */;
INSERT INTO `theloai` VALUES (1,'Laptop'),(2,'Micro'),(3,'Máy In'),(4,'Bóng Đèn'),(5,'Máy Tính'),(6,'Điều Hòa'),(7,'Ghế'),(8,'Bàn'),(9,'Dây Điện'),(10,'Loa'),(11,'Quạt'),(12,'Tai Nghe'),(13,'Sạc Dự Phòng');
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
  `soLuong` int NOT NULL DEFAULT '0',
  `tonKho` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `theloai_id` (`theloai_id`),
  CONSTRAINT `thietbi_ibfk_1` FOREIGN KEY (`theloai_id`) REFERENCES `theloai` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thietbi`
--

LOCK TABLES `thietbi` WRITE;
/*!40000 ALTER TABLE `thietbi` DISABLE KEYS */;
INSERT INTO `thietbi` VALUES (1,1,'Laptop Sony VPL','Độ phân giải Full HD',15000000,0,0),(2,4,'Bóng Đèn Huỳnh Quang','Công Suất Cao Tiết Kiệm Điện',600000,1,1),(3,2,'Micro Shure SM58','Dòng micro dynamic',3000000,0,0),(4,2,'Micro AKG D5','Thiết kế chống hú',2500000,25,22),(5,3,'Máy In HP LaserJet','Công nghệ in Laser trắng đen',5000000,8,5),(6,3,'Máy In Canon PIXMA','In màu, kết nối WiFi',4500000,12,10),(7,4,'Bóng Đèn Philips LED','Công suất 9W, tiết kiệm điện',50000,100,95),(8,4,'Bóng Đèn Rạng Đông','Bóng LED 18W, ánh sáng trắng',70000,80,75),(9,1,'Laptop MSI','Dùng để chơi game',12000000,0,0),(18,5,'Desktop Gaming','I5 12400F, RTX 5090, 64 gb Ram',54000000,0,0),(20,12,'Airpod Pro 2025','Tai Nghe của hãng Apple, Chống Ồn, Âm Thanh 3D sống động',7000000,0,0),(21,3,'Máy In Hp','Máy In Hp hiện đại ',15000000,0,0);
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
  `tinhTrang` enum('chua_dung','dang_dung') NOT NULL DEFAULT 'chua_dung',
  PRIMARY KEY (`id`),
  KEY `thietbi_id` (`thietbi_id`),
  KEY `phong_id` (`phong_id`),
  KEY `phieunhap_id` (`phieunhap_id`),
  CONSTRAINT `ThongTinThietBi_ibfk_1` FOREIGN KEY (`thietbi_id`) REFERENCES `thietbi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ThongTinThietBi_ibfk_2` FOREIGN KEY (`phong_id`) REFERENCES `phong` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ThongTinThietBi_ibfk_3` FOREIGN KEY (`phieunhap_id`) REFERENCES `phieunhap` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongtinthietbi`
--

LOCK TABLES `thongtinthietbi` WRITE;
/*!40000 ALTER TABLE `thongtinthietbi` DISABLE KEYS */;
INSERT INTO `thongtinthietbi` VALUES (3,1,6,'Lê Khải','Laptop Sony VPL',1,'dang_dung'),(4,2,NULL,NULL,'Bóng Đèn Huỳnh Quang',1,'chua_dung'),(5,3,NULL,NULL,'Micro Shure SM58',1,'chua_dung'),(6,4,NULL,NULL,'Micro AKG D5',1,'chua_dung'),(7,5,NULL,NULL,'Máy In HP LaserJet',1,'chua_dung'),(10,1,NULL,'admin','Laptop Sony VPL',NULL,'dang_dung'),(11,20,4,'Hoàng Tép','Airpod Pro 2025',NULL,'dang_dung'),(13,5,NULL,NULL,'Máy In HP LaserJet',NULL,'dang_dung');
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
  UNIQUE KEY `sDT` (`sDT`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$yufXko9XShE85gJeSP7sc.PDI42WHtZwhHQzkbKaEjdvRZETJ0ht.','Admin',NULL,'Nam',NULL,NULL,NULL,'admin','on'),(2,'hung1806','$2b$10$CNvZl4yWWejIXICC8zz79.HcKQlRfInP5hBNqNzOyi9oc/MYRO5US','Phạm Minh Hùng','2001-06-18','Nam','0589898989','minhhungbackup1806@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1740675683/avatars/icmscyq4wqyzpunsav98.jpg','nhanvien','on'),(3,'khai123','$2b$10$baM6xf68qqvvdI1soFe9fONnEf/dMMjSfSi3xMsH7Fr7E11MPE6b6','Đinh Lê Khải','2011-11-11','Nam','012345678','dinhlekhai@gmail.com',NULL,'nguoidung','on'),(4,'testuser','$2b$10$52lhJF7aT9dmHBbOfofYg.NNXkJQOmljQfXgRc2YccgEo32mXVu0C','Phạm Văn Test','2012-10-08','Khác','0999999999','phamvantet@gmail.com','https://res.cloudinary.com/dqs9zvox3/image/upload/v1740919997/avatars/nbm5heihwzluedfnk2tp.png','nguoidung','on'),(5,'testuser2','$2b$10$xeDHWNWCwERwWVa.mXOgCu/1X7wB7RviwBI2XQFzeagCx6hcjXLp2','Test User 2',NULL,'Nam',NULL,NULL,NULL,'nguoidung','on');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-04 18:23:07
