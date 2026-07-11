-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 024_package_booking_payment_proofs.sql
-- Scope: Add manual payment instruction and proof-of-payment fields
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

ALTER TABLE package_booking_requests
  ADD COLUMN IF NOT EXISTS payment_instruction_snapshot text,
  ADD COLUMN IF NOT EXISTS payment_reference_number varchar(120),
  ADD COLUMN IF NOT EXISTS proof_file_url text,
  ADD COLUMN IF NOT EXISTS proof_original_filename varchar(255),
  ADD COLUMN IF NOT EXISTS proof_mime_type varchar(120),
  ADD COLUMN IF NOT EXISTS proof_file_size integer,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason text,
  ADD COLUMN IF NOT EXISTS payment_notes text;

ALTER TABLE package_booking_requests
  DROP CONSTRAINT IF EXISTS package_booking_requests_payment_status_valid,
  DROP CONSTRAINT IF EXISTS package_booking_requests_proof_size_nonnegative;

ALTER TABLE package_booking_requests
  ADD CONSTRAINT package_booking_requests_payment_status_valid
    CHECK (payment_status IN ('unpaid', 'proof_submitted', 'verified', 'rejected', 'not_required', 'pending_inquiry')),
  ADD CONSTRAINT package_booking_requests_proof_size_nonnegative
    CHECK (proof_file_size IS NULL OR proof_file_size >= 0);

CREATE INDEX IF NOT EXISTS idx_package_booking_requests_payment_submitted
  ON package_booking_requests(payment_status, payment_submitted_at);

CREATE INDEX IF NOT EXISTS idx_package_booking_requests_verified_by
  ON package_booking_requests(payment_verified_by);

COMMIT;
