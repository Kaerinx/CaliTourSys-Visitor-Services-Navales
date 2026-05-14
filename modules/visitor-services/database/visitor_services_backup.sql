-- CaliTourSys Visitor Services and Monitoring Module
-- MySQL backup/schema for final SE Laboratory submission
-- Generated without private credentials.

CREATE DATABASE IF NOT EXISTS calitoursys;
USE calitoursys;

CREATE TABLE IF NOT EXISTS establishments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  type ENUM('resort', 'museum', 'tourist_spot', 'other') NOT NULL DEFAULT 'resort',
  address VARCHAR(255),
  contact_number VARCHAR(50),
  email VARCHAR(150),
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'tourism_staff', 'receptionist', 'lgu_official') NOT NULL,
  assigned_establishment_id INT NULL,
  email VARCHAR(150),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_establishment
    FOREIGN KEY (assigned_establishment_id) REFERENCES establishments(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS visitor_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id VARCHAR(80),
  establishment_id INT NULL,
  recorded_by_user_id INT NULL,
  full_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(50),
  email VARCHAR(150),
  gender VARCHAR(30),
  age_group ENUM('adult', 'senior', 'child') NOT NULL DEFAULT 'adult',
  guest_category ENUM('adult', 'senior', 'child') NOT NULL DEFAULT 'adult',
  visitor_type ENUM('local', 'domestic', 'international') NOT NULL DEFAULT 'local',
  nationality VARCHAR(80),
  province VARCHAR(120),
  country VARCHAR(120),
  address VARCHAR(255),
  purpose_of_visit VARCHAR(255),
  visit_date DATE NOT NULL,
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  number_of_guests INT NOT NULL DEFAULT 1,
  status ENUM('pending', 'checked_in', 'checked_out', 'cancelled') NOT NULL DEFAULT 'pending',
  source_type ENUM('resort', 'museum', 'tourism_office') NOT NULL DEFAULT 'tourism_office',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visitor_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_visitor_recorded_by
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS visitor_companions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_record_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  age_group ENUM('adult', 'senior', 'child') NOT NULL DEFAULT 'adult',
  gender VARCHAR(30),
  nationality VARCHAR(80),
  relationship VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_companion_visitor
    FOREIGN KEY (visitor_record_id) REFERENCES visitor_records(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  contact_number VARCHAR(50),
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'responded', 'archived') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiry_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT NOT NULL,
  responded_by_user_id INT NULL,
  response_message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_response_inquiry
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_response_user
    FOREIGN KEY (responded_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

INSERT IGNORE INTO establishments (id, name, type, address, contact_number, email, description, is_active) VALUES
(1, 'Calabanga Beach Resort', 'resort', 'Barangay San Antonio, Calabanga, Camarines Sur', '09171234567', 'beach@calabanga.com', 'Partner resort for guest monitoring.', 1),
(2, 'Calabanga Municipal Museum', 'museum', 'Calabanga Town Center', '09181234567', 'museum@calabanga.com', 'Municipal museum visitor monitoring.', 1),
(3, 'Mangrove Eco-Tourism Park', 'tourist_spot', 'Barangay Sabang, Calabanga', '09191234567', 'mangrove@calabanga.com', 'Eco-tourism destination.', 1);

-- Password hashes are intentionally placeholders. Use the application seeder or reset passwords locally.
INSERT IGNORE INTO users (id, full_name, username, password_hash, role, assigned_establishment_id, email, is_active) VALUES
(1, 'Admin User', 'admin', '$2a$10$replace_with_local_hash', 'admin', NULL, 'admin@calabanga.gov.ph', 1),
(2, 'Tourism Staff', 'staff', '$2a$10$replace_with_local_hash', 'tourism_staff', NULL, 'staff@calabanga.gov.ph', 1),
(3, 'Maria Santos', 'beach_reception', '$2a$10$replace_with_local_hash', 'receptionist', 1, 'beach.reception@calabanga.gov.ph', 1);
