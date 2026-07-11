-- ============================================================================
-- CaliTourSys
-- Migration: 026_tourist_accounts.sql
-- Scope: Public tourist account foundation and optional booking ownership
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tourist_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone_number varchar(80),
  password_hash text NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourist_accounts_full_name_not_blank CHECK (length(trim(full_name)) > 0),
  CONSTRAINT tourist_accounts_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT tourist_accounts_password_hash_not_blank CHECK (length(trim(password_hash)) > 0),
  CONSTRAINT tourist_accounts_status_valid CHECK (status IN ('active', 'inactive', 'locked'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tourist_accounts_email_lower
  ON tourist_accounts (lower(email));

CREATE INDEX IF NOT EXISTS idx_tourist_accounts_status
  ON tourist_accounts (status);

DROP TRIGGER IF EXISTS set_tourist_accounts_updated_at ON tourist_accounts;
CREATE TRIGGER set_tourist_accounts_updated_at
BEFORE UPDATE ON tourist_accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE package_booking_requests
  ADD COLUMN IF NOT EXISTS tourist_account_id uuid REFERENCES tourist_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_package_booking_requests_tourist_account
  ON package_booking_requests(tourist_account_id);

COMMIT;
