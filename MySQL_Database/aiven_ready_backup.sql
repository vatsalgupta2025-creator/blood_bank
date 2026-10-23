-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: blood_bank_db
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `blood_bank`
--

DROP TABLE IF EXISTS `blood_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blood_bank` (
  `bank_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL DEFAULT '0' COMMENT 'Max blood units storable',
  `established` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bank_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blood_bank`
--

LOCK TABLES `blood_bank` WRITE;
/*!40000 ALTER TABLE `blood_bank` DISABLE KEYS */;
INSERT INTO `blood_bank` VALUES (1,'City Blood Bank','Sector 1, Delhi - 110001','Delhi','Delhi','+91-110-110001000','city.bank@delhiblood.org',400,NULL,'2026-09-05 19:44:14'),(2,'LifeCare Blood Bank','Sector 1, Mumbai - 400001','Mumbai','Maharashtra','+91-400-400001000','lifecare.bank@mumbaiblood.org',400,NULL,'2026-09-05 19:44:14'),(3,'Jaipur Blood Centre','Sector 1, Jaipur - 302001','Jaipur','Rajasthan','+91-302-302001000','jaipur.centre@jaipurblood.org',400,NULL,'2026-09-05 19:44:14'),(4,'Lucknow Blood Bank','Sector 1, Lucknow - 226001','Lucknow','Uttar Pradesh','+91-226-226001000','lucknow.bank@lucknowblood.org',400,NULL,'2026-09-05 19:44:14'),(5,'Pune Blood Centre','Sector 1, Pune - 411001','Pune','Maharashtra','+91-411-411001000','pune.centre@puneblood.org',400,NULL,'2026-09-05 19:44:14'),(6,'Chandigarh Blood Bank','Sector 1, Chandigarh - 160001','Chandigarh','Chandigarh','+91-160-160001000','chandigarh.bank@chandigarhblood.org',400,NULL,'2026-09-05 19:44:14'),(7,'Amritsar Blood Centre','Sector 1, Amritsar - 143001','Amritsar','Punjab','+91-143-143001000','amritsar.centre@amritsarblood.org',400,NULL,'2026-09-05 19:44:14'),(8,'Kanpur Blood Bank','Sector 1, Kanpur - 208001','Kanpur','Uttar Pradesh','+91-208-208001000','kanpur.bank@kanpurblood.org',400,NULL,'2026-09-05 19:44:14'),(9,'Bhopal Blood Centre','Sector 1, Bhopal - 462001','Bhopal','Madhya Pradesh','+91-462-462001000','bhopal.centre@bhopalblood.org',400,NULL,'2026-09-05 19:44:14'),(10,'Ahmedabad Blood Bank','Sector 1, Ahmedabad - 380001','Ahmedabad','Gujarat','+91-380-380001000','ahmedabad.bank@ahmedabadblood.org',400,NULL,'2026-09-05 19:44:14');
/*!40000 ALTER TABLE `blood_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blood_request`
--

DROP TABLE IF EXISTS `blood_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blood_request` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `receiver_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `unit_id` int DEFAULT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_ml` int NOT NULL DEFAULT '450',
  `urgency` enum('Normal','Urgent','Critical') COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `request_date` date NOT NULL,
  `required_by` date DEFAULT NULL,
  `status` enum('Pending','Approved','Fulfilled','Rejected','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `handled_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `unit_id` (`unit_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `bank_id` (`bank_id`),
  KEY `handled_by` (`handled_by`),
  CONSTRAINT `blood_request_ibfk_1` FOREIGN KEY (`receiver_id`) REFERENCES `receiver` (`receiver_id`) ON DELETE CASCADE,
  CONSTRAINT `blood_request_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `blood_bank` (`bank_id`) ON DELETE CASCADE,
  CONSTRAINT `blood_request_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `blood_unit` (`unit_id`) ON DELETE SET NULL,
  CONSTRAINT `blood_request_ibfk_4` FOREIGN KEY (`handled_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blood_request`
--

LOCK TABLES `blood_request` WRITE;
/*!40000 ALTER TABLE `blood_request` DISABLE KEYS */;
INSERT INTO `blood_request` VALUES (1,1,1,1,'A+',450,'Critical','2026-04-01',NULL,'Fulfilled',1,NULL,'2026-09-05 19:44:15'),(2,2,2,2,'B+',450,'Urgent','2026-04-02',NULL,'Fulfilled',2,NULL,'2026-09-05 19:44:15'),(3,3,3,3,'O+',900,'Critical','2026-04-03',NULL,'Fulfilled',3,NULL,'2026-09-05 19:44:15'),(4,4,4,4,'AB+',450,'Normal','2026-04-04',NULL,'Fulfilled',4,NULL,'2026-09-05 19:44:15'),(5,5,1,5,'A-',450,'Urgent','2026-04-05',NULL,'Fulfilled',5,NULL,'2026-09-05 19:44:15'),(6,6,5,6,'O-',450,'Critical','2026-04-06',NULL,'Fulfilled',6,NULL,'2026-09-05 19:44:15'),(7,7,6,7,'B-',450,'Normal','2026-04-07',NULL,'Fulfilled',7,NULL,'2026-09-05 19:44:15'),(8,8,7,8,'AB-',450,'Urgent','2026-04-08',NULL,'Fulfilled',8,NULL,'2026-09-05 19:44:15'),(9,9,8,9,'A+',450,'Critical','2026-04-09',NULL,'Fulfilled',9,NULL,'2026-09-05 19:44:15'),(10,10,9,10,'O+',450,'Normal','2026-04-10',NULL,'Fulfilled',10,NULL,'2026-09-05 19:44:15');
/*!40000 ALTER TABLE `blood_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blood_test`
--

DROP TABLE IF EXISTS `blood_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blood_test` (
  `test_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `donor_id` int NOT NULL,
  `test_type` enum('HIV','Hepatitis B','Hepatitis C','Syphilis','Malaria','Blood Group Confirm') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tested_date` date NOT NULL,
  `result` enum('Positive','Negative','Pending') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `tested_by` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`test_id`),
  KEY `event_id` (`event_id`),
  KEY `donor_id` (`donor_id`),
  KEY `tested_by` (`tested_by`),
  CONSTRAINT `blood_test_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `donation_event` (`event_id`) ON DELETE CASCADE,
  CONSTRAINT `blood_test_ibfk_2` FOREIGN KEY (`donor_id`) REFERENCES `donor` (`donor_id`) ON DELETE CASCADE,
  CONSTRAINT `blood_test_ibfk_3` FOREIGN KEY (`tested_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blood_test`
--

LOCK TABLES `blood_test` WRITE;
/*!40000 ALTER TABLE `blood_test` DISABLE KEYS */;
INSERT INTO `blood_test` VALUES (1,1,1,'HIV','2026-01-10','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(2,2,2,'HIV','2026-01-15','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(3,3,3,'HIV','2026-02-05','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(4,4,4,'HIV','2026-02-12','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(5,5,5,'HIV','2026-02-20','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(6,6,6,'HIV','2026-03-01','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(7,7,7,'HIV','2026-03-08','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(8,8,8,'HIV','2026-03-15','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(9,9,9,'HIV','2026-03-20','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15'),(10,10,10,'HIV','2026-03-25','Negative',NULL,'Imported from Oracle database','2026-09-05 19:44:15');
/*!40000 ALTER TABLE `blood_test` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blood_unit`
--

DROP TABLE IF EXISTS `blood_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blood_unit` (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `bank_id` int NOT NULL,
  `unit_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `volume_ml` int NOT NULL DEFAULT '450',
  `collected_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` enum('Available','Reserved','Used','Expired','Discarded') COLLATE utf8mb4_unicode_ci DEFAULT 'Available',
  `storage_temp` decimal(4,1) DEFAULT '4.0' COMMENT 'Celsius',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`unit_id`),
  UNIQUE KEY `uq_unit_per_bank` (`bank_id`,`unit_code`),
  CONSTRAINT `blood_unit_ibfk_1` FOREIGN KEY (`bank_id`) REFERENCES `blood_bank` (`bank_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blood_unit`
--

LOCK TABLES `blood_unit` WRITE;
/*!40000 ALTER TABLE `blood_unit` DISABLE KEYS */;
INSERT INTO `blood_unit` VALUES (1,1,'BU-001','A+',450,'2026-01-10','2026-03-21','Available',4.0,'2026-09-05 19:44:14'),(2,2,'BU-002','B+',450,'2026-01-15','2026-03-26','Available',4.0,'2026-09-05 19:44:14'),(3,3,'BU-003','O+',450,'2026-02-05','2026-04-21','Available',4.0,'2026-09-05 19:44:14'),(4,4,'BU-004','AB+',450,'2026-02-12','2026-04-28','Available',4.0,'2026-09-05 19:44:15'),(5,1,'BU-005','A-',450,'2026-02-20','2026-05-06','Available',4.0,'2026-09-05 19:44:15'),(6,5,'BU-006','O-',450,'2026-03-01','2026-05-15','Available',4.0,'2026-09-05 19:44:15'),(7,6,'BU-007','B-',450,'2026-03-08','2026-05-22','Available',4.0,'2026-09-05 19:44:15'),(8,7,'BU-008','AB-',450,'2026-03-15','2026-05-29','Available',4.0,'2026-09-05 19:44:15'),(9,8,'BU-009','A+',450,'2026-03-20','2026-06-03','Available',4.0,'2026-09-05 19:44:15'),(10,9,'BU-010','O+',450,'2026-03-25','2026-06-08','Available',4.0,'2026-09-05 19:44:15');
/*!40000 ALTER TABLE `blood_unit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donation_event`
--

DROP TABLE IF EXISTS `donation_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation_event` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `donor_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `unit_id` int DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `staff_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  UNIQUE KEY `unit_id` (`unit_id`),
  KEY `donor_id` (`donor_id`),
  KEY `bank_id` (`bank_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `donation_event_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donor` (`donor_id`) ON DELETE CASCADE,
  CONSTRAINT `donation_event_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `blood_bank` (`bank_id`) ON DELETE CASCADE,
  CONSTRAINT `donation_event_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `blood_unit` (`unit_id`) ON DELETE SET NULL,
  CONSTRAINT `donation_event_ibfk_4` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donation_event`
--

LOCK TABLES `donation_event` WRITE;
/*!40000 ALTER TABLE `donation_event` DISABLE KEYS */;
INSERT INTO `donation_event` VALUES (1,1,1,1,'2026-01-10',NULL,NULL,NULL,'2026-09-05 19:44:15'),(2,2,2,2,'2026-01-15',NULL,NULL,NULL,'2026-09-05 19:44:15'),(3,3,3,3,'2026-02-05',NULL,NULL,NULL,'2026-09-05 19:44:15'),(4,4,4,4,'2026-02-12',NULL,NULL,NULL,'2026-09-05 19:44:15'),(5,5,1,5,'2026-02-20',NULL,NULL,NULL,'2026-09-05 19:44:15'),(6,6,5,6,'2026-03-01',NULL,NULL,NULL,'2026-09-05 19:44:15'),(7,7,6,7,'2026-03-08',NULL,NULL,NULL,'2026-09-05 19:44:15'),(8,8,7,8,'2026-03-15',NULL,NULL,NULL,'2026-09-05 19:44:15'),(9,9,8,9,'2026-03-20',NULL,NULL,NULL,'2026-09-05 19:44:15'),(10,10,9,10,'2026-03-25',NULL,NULL,NULL,'2026-09-05 19:44:15');
/*!40000 ALTER TABLE `donation_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donor`
--

DROP TABLE IF EXISTS `donor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donor` (
  `donor_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date NOT NULL,
  `gender` enum('Male','Female','Other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `street` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_donations` int NOT NULL DEFAULT '0',
  `last_donation` date DEFAULT NULL,
  `is_eligible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`donor_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donor`
--

LOCK TABLES `donor` WRITE;
/*!40000 ALTER TABLE `donor` DISABLE KEYS */;
INSERT INTO `donor` VALUES (1,'Rahul','Sharma','2000-05-12','Male','A+','+91-9876543210','rahul.sharma@gmail.com','Main Road','Delhi','Delhi',1,'2026-01-10',1,'2026-09-05 19:44:14'),(2,'Priya','Singh','1999-08-21','Female','B+','+91-9876543211','priya.singh@gmail.com','Main Road','Mumbai','Maharashtra',1,'2026-01-15',1,'2026-09-05 19:44:14'),(3,'Amit','Kumar','2001-02-15','Male','O+','+91-9876543212','amit.kumar@gmail.com','Main Road','Jaipur','Rajasthan',1,'2026-02-05',1,'2026-09-05 19:44:14'),(4,'Neha','Verma','1998-11-30','Female','AB+','+91-9876543213','neha.verma@gmail.com','Main Road','Lucknow','Uttar Pradesh',1,'2026-02-12',1,'2026-09-05 19:44:14'),(5,'Rohit','Gupta','2000-07-19','Male','A-','+91-9876543214','rohit.gupta@gmail.com','Main Road','Delhi','Delhi',1,'2026-02-20',1,'2026-09-05 19:44:14'),(6,'Anjali','Mehta','2002-01-10','Female','O-','+91-9876543215','anjali.mehta@gmail.com','Main Road','Pune','Maharashtra',1,'2026-03-01',1,'2026-09-05 19:44:14'),(7,'Karan','Malhotra','1997-09-25','Male','B-','+91-9876543216','karan.malhotra@gmail.com','Main Road','Chandigarh','Chandigarh',1,'2026-03-08',1,'2026-09-05 19:44:14'),(8,'Simran','Kaur','2001-12-05','Female','AB-','+91-9876543217','simran.kaur@gmail.com','Main Road','Amritsar','Punjab',1,'2026-03-15',1,'2026-09-05 19:44:14'),(9,'Vikas','Yadav','1999-04-18','Male','A+','+91-9876543218','vikas.yadav@gmail.com','Main Road','Kanpur','Uttar Pradesh',1,'2026-03-20',1,'2026-09-05 19:44:14'),(10,'Pooja','Sharma','2000-06-22','Female','O+','+91-9876543219','pooja.sharma@gmail.com','Main Road','Bhopal','Madhya Pradesh',1,'2026-03-25',1,'2026-09-05 19:44:14'),(11,'Kenzo','Tenma','2000-01-15','Male','O+','9973358661','raka143gupta@gmail.com','MG road','GANGTOK','SIKKHIM',0,NULL,1,'2026-09-06 12:42:03');
/*!40000 ALTER TABLE `donor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `donor_with_age`
--

DROP TABLE IF EXISTS `donor_with_age`;
/*!50001 DROP VIEW IF EXISTS `donor_with_age`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `donor_with_age` AS SELECT 
 1 AS `donor_id`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `dob`,
 1 AS `gender`,
 1 AS `blood_group`,
 1 AS `phone`,
 1 AS `email`,
 1 AS `street`,
 1 AS `city`,
 1 AS `state`,
 1 AS `total_donations`,
 1 AS `last_donation`,
 1 AS `is_eligible`,
 1 AS `created_at`,
 1 AS `age`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `receiver`
--

DROP TABLE IF EXISTS `receiver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receiver` (
  `receiver_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hospital_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hospital_city` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_condition` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`receiver_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receiver`
--

LOCK TABLES `receiver` WRITE;
/*!40000 ALTER TABLE `receiver` DISABLE KEYS */;
INSERT INTO `receiver` VALUES (1,'Arjun','Mehta','2001-01-15','Male','A+','+91-9123456780','arjun.mehta@gmail.com',NULL,'Delhi',NULL,'2026-09-05 19:44:14'),(2,'Sneha','Kapoor','1994-01-15','Female','B+','+91-9123456781','sneha.kapoor@gmail.com',NULL,'Mumbai',NULL,'2026-09-05 19:44:14'),(3,'Ravi','Patel','1981-01-15','Male','O+','+91-9123456782','ravi.patel@gmail.com',NULL,'Ahmedabad',NULL,'2026-09-05 19:44:14'),(4,'Kavya','Nair','1998-01-15','Female','AB+','+91-9123456783','kavya.nair@gmail.com',NULL,'Kochi',NULL,'2026-09-05 19:44:14'),(5,'Manish','Jain','1975-01-15','Male','A-','+91-9123456784','manish.jain@gmail.com',NULL,'Jaipur',NULL,'2026-09-05 19:44:14'),(6,'Isha','Sharma','2004-01-15','Female','O-','+91-9123456785','isha.sharma@gmail.com',NULL,'Pune',NULL,'2026-09-05 19:44:14'),(7,'Suresh','Kumar','1966-01-15','Male','B-','+91-9123456786','suresh.kumar@gmail.com',NULL,'Chandigarh',NULL,'2026-09-05 19:44:14'),(8,'Meera','Singh','1991-01-15','Female','AB-','+91-9123456787','meera.singh@gmail.com',NULL,'Amritsar',NULL,'2026-09-05 19:44:14'),(9,'Aditya','Verma','1986-01-15','Male','A+','+91-9123456788','aditya.verma@gmail.com',NULL,'Lucknow',NULL,'2026-09-05 19:44:14'),(10,'Nisha','Gupta','1997-01-15','Female','O+','+91-9123456789','nisha.gupta@gmail.com',NULL,'Bhopal',NULL,'2026-09-05 19:44:14');
/*!40000 ALTER TABLE `receiver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `bank_id` int NOT NULL,
  `first_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Doctor','Nurse','Technician','Admin','Receptionist') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shift` enum('Morning','Afternoon','Night') COLLATE utf8mb4_unicode_ci DEFAULT 'Morning',
  `hired_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `email` (`email`),
  KEY `bank_id` (`bank_id`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`bank_id`) REFERENCES `blood_bank` (`bank_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,1,'Rajesh','Kumar','Admin',NULL,'rajesh@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(2,2,'Anita','Sharma','Nurse',NULL,'anita@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(3,3,'Vivek','Singh','Technician',NULL,'vivek@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(4,4,'Pallavi','Gupta','Doctor',NULL,'pallavi@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(5,5,'Sanjay','Verma','Nurse',NULL,'sanjay@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(6,6,'Ritu','Mehta','Technician',NULL,'ritu@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(7,7,'Deepak','Jain','Admin',NULL,'deepak@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(8,8,'Neha','Kapoor','Nurse',NULL,'neha@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(9,9,'Mohit','Agarwal','Technician',NULL,'mohit@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14'),(10,10,'Swati','Nair','Doctor',NULL,'swati@bloodbank.com','Morning',NULL,'2026-09-05 19:44:14');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_credentials`
--

DROP TABLE IF EXISTS `staff_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_credentials` (
  `staff_id` int NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`staff_id`),
  CONSTRAINT `staff_credentials_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_credentials`
--

LOCK TABLES `staff_credentials` WRITE;
/*!40000 ALTER TABLE `staff_credentials` DISABLE KEYS */;
INSERT INTO `staff_credentials` VALUES (1,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(2,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(3,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(4,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(5,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(6,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(7,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(8,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(9,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2'),(10,'$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2');
/*!40000 ALTER TABLE `staff_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'blood_bank_db'
--

--
-- Dumping routines for database 'blood_bank_db'
--

--
-- Final view structure for view `donor_with_age`
--

/*!50001 DROP VIEW IF EXISTS `donor_with_age`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */

/*!50001 VIEW `donor_with_age` AS select `d`.`donor_id` AS `donor_id`,`d`.`first_name` AS `first_name`,`d`.`last_name` AS `last_name`,`d`.`dob` AS `dob`,`d`.`gender` AS `gender`,`d`.`blood_group` AS `blood_group`,`d`.`phone` AS `phone`,`d`.`email` AS `email`,`d`.`street` AS `street`,`d`.`city` AS `city`,`d`.`state` AS `state`,`d`.`total_donations` AS `total_donations`,`d`.`last_donation` AS `last_donation`,`d`.`is_eligible` AS `is_eligible`,`d`.`created_at` AS `created_at`,timestampdiff(YEAR,`d`.`dob`,curdate()) AS `age` from `donor` `d` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-06 21:03:13
