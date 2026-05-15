-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 15, 2026 at 01:56 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `calitoursys`
--

-- --------------------------------------------------------

--
-- Table structure for table `establishments`
--

CREATE TABLE `establishments` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('resort','museum','tourist_spot','other') NOT NULL DEFAULT 'other',
  `address` varchar(255) DEFAULT NULL,
  `contact_number` varchar(40) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `establishments`
--

INSERT INTO `establishments` (`id`, `name`, `type`, `address`, `contact_number`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Calabanga Beach Resort', 'resort', 'Calabanga, Camarines Sur', '+63 912 000 0001', 'beach@calabanga.com', 1, '2026-05-14 20:42:29', NULL),
(2, 'Calabanga Eco-Park and Resort', 'resort', 'Barangay San Antonio, Calabanga', '+63 912 345 6789', 'ecopark@calabanga.com', 1, '2026-05-14 20:42:29', NULL),
(3, 'Calabanga Municipal Museum', 'museum', 'Calabanga Town Center', '(054) 123-4567', 'museum@calabanga.gov.ph', 1, '2026-05-14 20:42:29', NULL),
(4, 'Mangrove Eco-Tourism Park', 'tourist_spot', 'Barangay Sabang, Calabanga', '+63 912 345 6790', 'mangrove@calabanga.com', 1, '2026-05-14 20:42:29', NULL),
(5, 'Hacienda', 'resort', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '0977561063', 'Kaerin1215@gmail.com', 1, '2026-05-14 23:15:16', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inquiries`
--

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(120) NOT NULL,
  `contact_number` varchar(40) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','responded','archived') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inquiry_responses`
--

CREATE TABLE `inquiry_responses` (
  `id` int(11) NOT NULL,
  `inquiry_id` int(11) NOT NULL,
  `responded_by_user_id` int(11) DEFAULT NULL,
  `response_message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('admin','tourism_staff','receptionist') NOT NULL,
  `assigned_establishment_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `password`, `full_name`, `role`, `assigned_establishment_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', NULL, 'admin123', 'Admin User', 'admin', NULL, 1, '2026-05-14 20:42:29', NULL),
(2, 'tourism_staff', NULL, 'staff123', 'Tourism Staff', 'tourism_staff', NULL, 1, '2026-05-14 20:42:29', NULL),
(3, 'beach_reception', NULL, 'beach123', 'Maria Santos', 'receptionist', 1, 1, '2026-05-14 20:42:29', NULL),
(4, 'ecopark_reception', NULL, 'eco123', 'Juan Dela Cruz', 'receptionist', 2, 1, '2026-05-14 20:42:29', NULL),
(5, 'khy', '$2a$10$6xk4en3ETD6yGc2avbvy4OcdvcBFBqgprbRZyFoLsQZwnPibZce6.', 'khy123', 'Khylene Navales', 'receptionist', 2, 1, '2026-05-14 22:55:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `visitor_companions`
--

CREATE TABLE `visitor_companions` (
  `id` int(11) NOT NULL,
  `visitor_record_id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `age_group` enum('adult','senior','child') NOT NULL DEFAULT 'adult',
  `gender` varchar(30) DEFAULT NULL,
  `nationality` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `visitor_records`
--

CREATE TABLE `visitor_records` (
  `id` int(11) NOT NULL,
  `group_id` varchar(80) DEFAULT NULL,
  `establishment_id` int(11) DEFAULT NULL,
  `recorded_by_user_id` int(11) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `contact_number` varchar(40) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `gender` varchar(30) DEFAULT NULL,
  `age_group` enum('adult','senior','child') NOT NULL DEFAULT 'adult',
  `visitor_type` enum('local','domestic','international') NOT NULL DEFAULT 'local',
  `nationality` varchar(80) DEFAULT NULL,
  `province` varchar(120) DEFAULT NULL,
  `country` varchar(120) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `purpose_of_visit` varchar(180) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `status` enum('pending','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
  `source_type` enum('resort','museum','tourism_office') NOT NULL DEFAULT 'tourism_office',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `visitor_records`
--

INSERT INTO `visitor_records` (`id`, `group_id`, `establishment_id`, `recorded_by_user_id`, `full_name`, `contact_number`, `email`, `gender`, `age_group`, `visitor_type`, `nationality`, `province`, `country`, `address`, `purpose_of_visit`, `visit_date`, `check_in_time`, `check_out_time`, `status`, `source_type`, `created_at`, `updated_at`) VALUES
(1, 'GRP-1778791520194', 3, 1, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', NULL, '2026-05-14', '04:45:00', '04:46:22', 'checked_out', 'museum', '2026-05-14 20:45:43', '2026-05-14 23:08:08'),
(2, 'GRP-1778791587322', NULL, 1, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', NULL, '2026-05-14', NULL, NULL, 'checked_in', 'tourism_office', '2026-05-14 20:46:35', '2026-05-14 22:54:07'),
(3, 'GRP-1778791675912', 1, 3, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', NULL, '2026-05-14', '04:48:12', NULL, 'checked_in', 'resort', '2026-05-14 20:48:02', '2026-05-14 20:48:12'),
(4, 'GRP-1778799393574', 2, 5, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', 'family', '2026-05-14', '08:58:00', NULL, 'checked_out', 'resort', '2026-05-14 22:57:05', '2026-05-14 23:21:35'),
(5, 'GRP-1778799432184', 2, 5, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', 'family', '2026-05-14', '07:58:00', NULL, 'checked_out', 'resort', '2026-05-14 22:57:32', '2026-05-14 23:21:35'),
(6, 'GRP-1778799704951', 3, 2, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', 'sight seeing ', '2026-05-14', NULL, NULL, 'checked_out', 'museum', '2026-05-14 23:03:05', '2026-05-14 23:08:07'),
(7, 'GRP-1778800076530', 3, 2, 'KHYLENE NAVALES', '09770561063', 'khylene.navales@unc.edu.ph', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'checked_out', 'museum', '2026-05-14 23:07:56', '2026-05-14 23:08:04'),
(8, 'GRP-1778800307985', 1, 3, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'pending', 'resort', '2026-05-14 23:11:52', NULL),
(9, 'GRP-1778800552599', 2, 5, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'checked_out', 'resort', '2026-05-14 23:15:56', '2026-05-14 23:21:36'),
(10, 'GRP-1778800601299', 3, 2, 'KHYLENE NAVALES', '09770561063', 'khylene.navales@unc.edu.ph', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'checked_in', 'museum', '2026-05-14 23:16:41', NULL),
(11, 'GRP-1778800610225', 2, 2, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', 'family', '2026-05-14', NULL, NULL, 'pending', 'tourism_office', '2026-05-14 23:17:02', NULL),
(12, 'GRP-1778800642584', 3, 2, 'Khylene ', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'checked_in', 'museum', '2026-05-14 23:17:22', NULL),
(13, 'GRP-1778800873243', 2, 5, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'checked_out', 'resort', '2026-05-14 23:21:18', '2026-05-14 23:21:36'),
(14, 'GRP-1778802133489', 2, 5, 'Khylene Navales', '09770561063', 'Kaerin1215@gmail.com', 'Female', 'adult', 'local', 'Filipino', 'Camarines Sur', 'Philippines', '599 Rose Street, Upland Sta.Cruz Poblacion Calabanga Camarines Sur', '', '2026-05-14', NULL, NULL, 'pending', 'resort', '2026-05-14 23:42:17', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `establishments`
--
ALTER TABLE `establishments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inquiry_responses`
--
ALTER TABLE `inquiry_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_response_inquiry` (`inquiry_id`),
  ADD KEY `fk_response_user` (`responded_by_user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_establishment` (`assigned_establishment_id`);

--
-- Indexes for table `visitor_companions`
--
ALTER TABLE `visitor_companions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_companion_visitor` (`visitor_record_id`);

--
-- Indexes for table `visitor_records`
--
ALTER TABLE `visitor_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_visitor_recorded_by` (`recorded_by_user_id`),
  ADD KEY `idx_visitor_date` (`visit_date`),
  ADD KEY `idx_visitor_filters` (`establishment_id`,`visitor_type`,`source_type`,`status`),
  ADD KEY `idx_visitor_group` (`group_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `establishments`
--
ALTER TABLE `establishments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inquiry_responses`
--
ALTER TABLE `inquiry_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `visitor_companions`
--
ALTER TABLE `visitor_companions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visitor_records`
--
ALTER TABLE `visitor_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inquiry_responses`
--
ALTER TABLE `inquiry_responses`
  ADD CONSTRAINT `fk_response_inquiry` FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_response_user` FOREIGN KEY (`responded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_establishment` FOREIGN KEY (`assigned_establishment_id`) REFERENCES `establishments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `visitor_companions`
--
ALTER TABLE `visitor_companions`
  ADD CONSTRAINT `fk_companion_visitor` FOREIGN KEY (`visitor_record_id`) REFERENCES `visitor_records` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `visitor_records`
--
ALTER TABLE `visitor_records`
  ADD CONSTRAINT `fk_visitor_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_visitor_recorded_by` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
