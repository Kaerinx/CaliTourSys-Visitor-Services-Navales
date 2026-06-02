CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'pending_verification';
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sex VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS role VARCHAR(40),
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(120),
  business_permit_number VARCHAR(120),
  dti_sec_registration_number VARCHAR(120),
  region VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  city_municipality VARCHAR(120) NOT NULL,
  barangay VARCHAR(120) NOT NULL,
  street_address TEXT NOT NULL,
  zip_code VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accreditation_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(40) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  accreditation_type VARCHAR(40) NOT NULL DEFAULT 'New Accreditation',
  business_type VARCHAR(120) NOT NULL,
  business_permit_number VARCHAR(120),
  dti_sec_registration_number VARCHAR(120),
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  owner_remarks TEXT,
  review_remarks TEXT,
  remarks TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES accreditation_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(120) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(120),
  file_size INTEGER,
  file_checksum VARCHAR(128),
  status VARCHAR(40) NOT NULL DEFAULT 'submitted',
  remarks TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accreditation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_number VARCHAR(40) UNIQUE NOT NULL,
  application_id UUID NOT NULL REFERENCES accreditation_applications(id) ON DELETE CASCADE,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_target VARCHAR(40),
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  reference_id VARCHAR(120),
  action_path TEXT,
  details TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_number VARCHAR(40) UNIQUE NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(200),
  actor_role VARCHAR(40),
  action VARCHAR(180) NOT NULL,
  module VARCHAR(120) NOT NULL,
  severity VARCHAR(40) NOT NULL DEFAULT 'low',
  reference_id VARCHAR(120),
  outcome VARCHAR(180),
  ip_address VARCHAR(80),
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_owner_id ON accreditation_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON accreditation_applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON application_documents(application_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_application_type
  ON application_documents(application_id, document_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_records_application_id
  ON accreditation_records(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role_target ON notifications(role_target);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
