CREATE TABLE IF NOT EXISTS establishments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('resort', 'museum', 'tourist_spot', 'other') NOT NULL DEFAULT 'other',
  address VARCHAR(255),
  contact_number VARCHAR(40),
  email VARCHAR(120),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  password VARCHAR(255) NULL,
  full_name VARCHAR(150) NOT NULL,
  role ENUM('admin', 'tourism_staff', 'receptionist') NOT NULL,
  assigned_establishment_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
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
  contact_number VARCHAR(40),
  email VARCHAR(120),
  gender VARCHAR(30),
  age_group ENUM('adult', 'senior', 'child') NOT NULL DEFAULT 'adult',
  visitor_type ENUM('local', 'domestic', 'international') NOT NULL DEFAULT 'local',
  nationality VARCHAR(80),
  province VARCHAR(120),
  country VARCHAR(120),
  address VARCHAR(255),
  purpose_of_visit VARCHAR(180),
  visit_date DATE NOT NULL,
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  status ENUM('pending', 'checked_in', 'checked_out', 'cancelled') NOT NULL DEFAULT 'pending',
  source_type ENUM('resort', 'museum', 'tourism_office') NOT NULL DEFAULT 'tourism_office',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visitor_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_visitor_recorded_by
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_visitor_date (visit_date),
  INDEX idx_visitor_filters (establishment_id, visitor_type, source_type, status),
  INDEX idx_visitor_group (group_id)
);

CREATE TABLE IF NOT EXISTS visitor_companions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_record_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  age_group ENUM('adult', 'senior', 'child') NOT NULL DEFAULT 'adult',
  gender VARCHAR(30),
  nationality VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_companion_visitor
    FOREIGN KEY (visitor_record_id) REFERENCES visitor_records(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(120) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'reviewed', 'responded', 'archived') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
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

INSERT INTO establishments (id, name, type, address, contact_number, email, is_active) VALUES
(1, 'Calabanga Beach Resort', 'resort', 'Calabanga, Camarines Sur', '+63 912 000 0001', 'beach@calabanga.com', 1),
(2, 'Calabanga Eco-Park and Resort', 'resort', 'Barangay San Antonio, Calabanga', '+63 912 345 6789', 'ecopark@calabanga.com', 1),
(3, 'Calabanga Municipal Museum', 'museum', 'Calabanga Town Center', '(054) 123-4567', 'museum@calabanga.gov.ph', 1),
(4, 'Mangrove Eco-Tourism Park', 'tourist_spot', 'Barangay Sabang, Calabanga', '+63 912 345 6790', 'mangrove@calabanga.com', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (id, username, password, full_name, role, assigned_establishment_id, is_active) VALUES
(1, 'admin', 'admin123', 'Admin User', 'admin', NULL, 1),
(2, 'tourism_staff', 'staff123', 'Tourism Staff', 'tourism_staff', NULL, 1),
(3, 'beach_reception', 'beach123', 'Maria Santos', 'receptionist', 1, 1),
(4, 'ecopark_reception', 'eco123', 'Juan Dela Cruz', 'receptionist', 2, 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), assigned_establishment_id = VALUES(assigned_establishment_id);
