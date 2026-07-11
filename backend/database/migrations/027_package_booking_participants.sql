-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 027_package_booking_participants.sql
-- Scope: Store package booking participants and representative contact snapshot
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

ALTER TABLE package_booking_requests
  ADD COLUMN IF NOT EXISTS representative_full_name varchar(255),
  ADD COLUMN IF NOT EXISTS representative_email varchar(255),
  ADD COLUMN IF NOT EXISTS representative_phone_number varchar(80);

UPDATE package_booking_requests
SET
  representative_full_name = COALESCE(representative_full_name, visitor_full_name),
  representative_email = COALESCE(representative_email, visitor_email),
  representative_phone_number = COALESCE(representative_phone_number, visitor_phone_number);

ALTER TABLE package_booking_requests
  DROP CONSTRAINT IF EXISTS package_booking_requests_representative_name_not_blank,
  DROP CONSTRAINT IF EXISTS package_booking_requests_representative_email_not_blank,
  DROP CONSTRAINT IF EXISTS package_booking_requests_representative_phone_not_blank;

ALTER TABLE package_booking_requests
  ADD CONSTRAINT package_booking_requests_representative_name_not_blank
    CHECK (representative_full_name IS NULL OR length(trim(representative_full_name)) > 0),
  ADD CONSTRAINT package_booking_requests_representative_email_not_blank
    CHECK (representative_email IS NULL OR length(trim(representative_email)) > 0),
  ADD CONSTRAINT package_booking_requests_representative_phone_not_blank
    CHECK (representative_phone_number IS NULL OR length(trim(representative_phone_number)) > 0);

CREATE TABLE IF NOT EXISTS package_booking_request_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_booking_request_id uuid NOT NULL REFERENCES package_booking_requests(id) ON DELETE CASCADE,
  participant_order integer NOT NULL,
  full_name varchar(255) NOT NULL,
  age integer,
  gender varchar(40),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_participants_order_positive
    CHECK (participant_order >= 1),
  CONSTRAINT package_booking_participants_name_not_blank
    CHECK (length(trim(full_name)) > 0),
  CONSTRAINT package_booking_participants_age_reasonable
    CHECK (age IS NULL OR (age >= 0 AND age <= 130)),
  CONSTRAINT package_booking_participants_gender_not_blank
    CHECK (gender IS NULL OR length(trim(gender)) > 0),
  CONSTRAINT package_booking_participants_order_unique
    UNIQUE (package_booking_request_id, participant_order)
);

CREATE INDEX IF NOT EXISTS idx_package_booking_participants_request
  ON package_booking_request_participants(package_booking_request_id, participant_order);

DROP TRIGGER IF EXISTS set_package_booking_request_participants_updated_at
  ON package_booking_request_participants;
CREATE TRIGGER set_package_booking_request_participants_updated_at
BEFORE UPDATE ON package_booking_request_participants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
