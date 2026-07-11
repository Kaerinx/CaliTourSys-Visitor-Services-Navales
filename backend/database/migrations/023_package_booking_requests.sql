-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 023_package_booking_requests.sql
-- Scope: Store public package booking requests with pricing snapshots
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS package_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES tourism_packages(id) ON DELETE SET NULL,
  package_name_snapshot varchar(255) NOT NULL,
  selected_pax integer NOT NULL,
  base_price_snapshot numeric(12, 2),
  base_pax_snapshot integer,
  extra_pax_price_snapshot numeric(12, 2),
  computed_total_amount numeric(12, 2),
  visitor_full_name varchar(255) NOT NULL,
  visitor_email varchar(255) NOT NULL,
  visitor_phone_number varchar(80) NOT NULL,
  preferred_booking_date date NOT NULL,
  message text DEFAULT '',
  payment_required_snapshot boolean NOT NULL DEFAULT false,
  booking_status varchar(40) NOT NULL DEFAULT 'pending',
  payment_status varchar(40) NOT NULL DEFAULT 'pending_inquiry',
  pricing_note varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_requests_package_name_not_blank
    CHECK (length(trim(package_name_snapshot)) > 0),
  CONSTRAINT package_booking_requests_selected_pax_positive
    CHECK (selected_pax >= 1),
  CONSTRAINT package_booking_requests_base_price_nonnegative
    CHECK (base_price_snapshot IS NULL OR base_price_snapshot >= 0),
  CONSTRAINT package_booking_requests_base_pax_positive
    CHECK (base_pax_snapshot IS NULL OR base_pax_snapshot >= 1),
  CONSTRAINT package_booking_requests_extra_pax_price_nonnegative
    CHECK (extra_pax_price_snapshot IS NULL OR extra_pax_price_snapshot >= 0),
  CONSTRAINT package_booking_requests_total_nonnegative
    CHECK (computed_total_amount IS NULL OR computed_total_amount >= 0),
  CONSTRAINT package_booking_requests_visitor_name_not_blank
    CHECK (length(trim(visitor_full_name)) > 0),
  CONSTRAINT package_booking_requests_email_not_blank
    CHECK (length(trim(visitor_email)) > 0),
  CONSTRAINT package_booking_requests_phone_not_blank
    CHECK (length(trim(visitor_phone_number)) > 0),
  CONSTRAINT package_booking_requests_booking_status_valid
    CHECK (booking_status IN ('pending', 'reviewed', 'approved', 'declined', 'cancelled')),
  CONSTRAINT package_booking_requests_payment_status_valid
    CHECK (payment_status IN ('unpaid', 'not_required', 'pending_inquiry'))
);

CREATE INDEX IF NOT EXISTS idx_package_booking_requests_package_id
  ON package_booking_requests(package_id);

CREATE INDEX IF NOT EXISTS idx_package_booking_requests_status
  ON package_booking_requests(booking_status, payment_status);

CREATE INDEX IF NOT EXISTS idx_package_booking_requests_preferred_date
  ON package_booking_requests(preferred_booking_date);

DROP TRIGGER IF EXISTS set_package_booking_requests_updated_at ON package_booking_requests;
CREATE TRIGGER set_package_booking_requests_updated_at
BEFORE UPDATE ON package_booking_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
