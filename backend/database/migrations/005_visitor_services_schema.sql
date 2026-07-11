CREATE TABLE IF NOT EXISTS visitor_establishments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  type VARCHAR(40) NOT NULL DEFAULT 'other'
    CHECK (type IN ('resort', 'museum', 'tourist_spot', 'other', 'cultural site')),
  address VARCHAR(255),
  contact_number VARCHAR(40),
  email VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS visitor_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  password VARCHAR(255),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(120),
  role VARCHAR(40) NOT NULL CHECK (role IN ('admin', 'tourism_staff', 'receptionist', 'lgu_official')),
  assigned_establishment_id BIGINT REFERENCES visitor_establishments(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS visitor_records (
  id BIGSERIAL PRIMARY KEY,
  group_id VARCHAR(80),
  establishment_id BIGINT REFERENCES visitor_establishments(id) ON DELETE SET NULL,
  recorded_by_user_id TEXT,
  full_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(40),
  email VARCHAR(120),
  gender VARCHAR(30),
  age_group VARCHAR(20) NOT NULL DEFAULT 'adult'
    CHECK (age_group IN ('adult', 'senior', 'child')),
  visitor_type VARCHAR(30) NOT NULL DEFAULT 'local'
    CHECK (visitor_type IN ('local', 'domestic', 'international')),
  nationality VARCHAR(80),
  province VARCHAR(120),
  country VARCHAR(120),
  address VARCHAR(255),
  purpose_of_visit VARCHAR(180),
  visit_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status VARCHAR(30) NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('pending', 'checked_in', 'checked_out', 'cancelled', 'recorded', 'verified', 'pending_review', 'archived')),
  source_type VARCHAR(30) NOT NULL DEFAULT 'tourism_office'
    CHECK (source_type IN ('resort', 'museum', 'tourism_office')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_visitor_records_date
  ON visitor_records (visit_date);

CREATE INDEX IF NOT EXISTS idx_visitor_records_filters
  ON visitor_records (establishment_id, visitor_type, source_type, status);

CREATE INDEX IF NOT EXISTS idx_visitor_records_group
  ON visitor_records (group_id);

CREATE TABLE IF NOT EXISTS visitor_companions (
  id BIGSERIAL PRIMARY KEY,
  visitor_record_id BIGINT NOT NULL REFERENCES visitor_records(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  age_group VARCHAR(20) NOT NULL DEFAULT 'adult'
    CHECK (age_group IN ('adult', 'senior', 'child')),
  gender VARCHAR(30),
  nationality VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_inquiries (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(120) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'responded', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS visitor_inquiry_responses (
  id BIGSERIAL PRIMARY KEY,
  inquiry_id BIGINT NOT NULL REFERENCES visitor_inquiries(id) ON DELETE CASCADE,
  responded_by_user_id TEXT,
  response_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);