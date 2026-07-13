-- ============================================================================
-- CaliTourSys
-- Migration: 030_package_booking_business_foundation.sql
-- Scope: Add package scheduling, booking source, deposit, payment, and rebooking
--        foundations without deleting or rewriting historical booking records.
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Package duration and departure capacity
-- --------------------------------------------------------------------------

ALTER TABLE tourism_packages
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS departure_capacity integer;

UPDATE tourism_packages
SET duration_days = CASE
  WHEN estimated_duration ~* '^\s*[0-9]+\s+days?'
    THEN substring(estimated_duration from '([0-9]+)')::integer
  WHEN estimated_duration ~* '(half|full)\s+day' THEN 1
  WHEN estimated_duration ~* '^\s*[0-9]+\s+hours?' THEN 1
  ELSE duration_days
END
WHERE duration_days IS NULL;

UPDATE tourism_packages
SET departure_capacity = max_pax
WHERE departure_capacity IS NULL
  AND max_pax IS NOT NULL;

ALTER TABLE tourism_packages
  DROP CONSTRAINT IF EXISTS tourism_packages_duration_days_positive,
  DROP CONSTRAINT IF EXISTS tourism_packages_departure_capacity_positive;

ALTER TABLE tourism_packages
  ADD CONSTRAINT tourism_packages_duration_days_positive
    CHECK (duration_days IS NULL OR duration_days >= 1),
  ADD CONSTRAINT tourism_packages_departure_capacity_positive
    CHECK (departure_capacity IS NULL OR departure_capacity >= 1);

-- --------------------------------------------------------------------------
-- Monthly booking reference generator: YYYYMM-TOUR-NNNNNN
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS package_booking_reference_counters (
  reference_month char(6) PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_reference_month_valid
    CHECK (reference_month ~ '^[0-9]{6}$'),
  CONSTRAINT package_booking_reference_number_valid
    CHECK (last_number BETWEEN 0 AND 999999)
);

CREATE OR REPLACE FUNCTION next_package_booking_reference(
  reference_time timestamptz DEFAULT now()
)
RETURNS varchar
LANGUAGE plpgsql
AS $$
DECLARE
  month_key char(6);
  transaction_number integer;
BEGIN
  month_key := to_char(reference_time AT TIME ZONE 'Asia/Manila', 'YYYYMM');

  INSERT INTO package_booking_reference_counters (reference_month, last_number)
  VALUES (month_key, 1)
  ON CONFLICT (reference_month) DO UPDATE
  SET last_number = package_booking_reference_counters.last_number + 1,
      updated_at = now()
  RETURNING last_number INTO transaction_number;

  IF transaction_number > 999999 THEN
    RAISE EXCEPTION 'Monthly package booking reference capacity exceeded for %', month_key;
  END IF;

  RETURN month_key || '-TOUR-' || lpad(transaction_number::text, 6, '0');
END;
$$;

-- --------------------------------------------------------------------------
-- Booking schedule, source, representative, and deposit snapshot
-- --------------------------------------------------------------------------

ALTER TABLE package_booking_requests
  ADD COLUMN IF NOT EXISTS booking_reference varchar(32),
  ADD COLUMN IF NOT EXISTS booking_source varchar(20) NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS duration_days_snapshot integer,
  ADD COLUMN IF NOT EXISTS representative_gender varchar(1),
  ADD COLUMN IF NOT EXISTS other_participant_names text,
  ADD COLUMN IF NOT EXISTS payment_plan varchar(30),
  ADD COLUMN IF NOT EXISTS initial_payment_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS balance_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_status varchar(40),
  ADD COLUMN IF NOT EXISTS selected_payment_method varchar(40),
  ADD COLUMN IF NOT EXISTS deposit_deadline_extended_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_deadline_extended_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deposit_extension_reason text,
  ADD COLUMN IF NOT EXISTS expired_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS rebooked_from_booking_id uuid REFERENCES package_booking_requests(id) ON DELETE RESTRICT;

-- Walk-in representatives may not have an email address. Online validators
-- continue to require email at the API boundary.
ALTER TABLE package_booking_requests
  ALTER COLUMN visitor_email DROP NOT NULL;
ALTER TABLE package_booking_requests
  DROP CONSTRAINT IF EXISTS package_booking_requests_email_not_blank;
ALTER TABLE package_booking_requests
  ADD CONSTRAINT package_booking_requests_email_not_blank
    CHECK (visitor_email IS NULL OR length(trim(visitor_email)) > 0);

UPDATE package_booking_requests booking
SET start_date = COALESCE(booking.start_date, booking.preferred_booking_date),
    duration_days_snapshot = COALESCE(
      booking.duration_days_snapshot,
      package.duration_days,
      CASE
        WHEN package.estimated_duration ~* '^\s*[0-9]+\s+days?'
          THEN substring(package.estimated_duration from '([0-9]+)')::integer
        WHEN package.estimated_duration ~* '(half|full)\s+day' THEN 1
        WHEN package.estimated_duration ~* '^\s*[0-9]+\s+hours?' THEN 1
        ELSE 1
      END
    )
FROM tourism_packages package
WHERE booking.package_id = package.id;

UPDATE package_booking_requests
SET start_date = COALESCE(start_date, preferred_booking_date),
    duration_days_snapshot = COALESCE(duration_days_snapshot, 1);

UPDATE package_booking_requests
SET end_date = COALESCE(end_date, start_date + (duration_days_snapshot - 1)),
    payment_plan = COALESCE(
      payment_plan,
      CASE WHEN payment_required_snapshot THEN 'legacy_full' ELSE 'not_required' END
    ),
    initial_payment_amount = COALESCE(
      initial_payment_amount,
      CASE WHEN payment_required_snapshot THEN computed_total_amount ELSE 0 END
    ),
    deposit_status = COALESCE(
      deposit_status,
      CASE
        WHEN NOT payment_required_snapshot THEN 'not_required'
        WHEN payment_status = 'verified' THEN 'paid'
        WHEN payment_status = 'proof_submitted' THEN 'proof_submitted'
        WHEN payment_status = 'rejected' THEN 'rejected'
        ELSE 'pending'
      END
    ),
    selected_payment_method = COALESCE(
      selected_payment_method,
      CASE
        WHEN proof_file_url IS NOT NULL OR NULLIF(trim(payment_reference_number), '') IS NOT NULL
          THEN 'legacy_electronic'
        ELSE NULL
      END
    );

UPDATE package_booking_requests booking
SET other_participant_names = participants.names
FROM (
  SELECT
    package_booking_request_id,
    string_agg(full_name, E'\n' ORDER BY participant_order) AS names
  FROM package_booking_request_participants
  GROUP BY package_booking_request_id
) participants
WHERE booking.id = participants.package_booking_request_id
  AND NULLIF(trim(booking.other_participant_names), '') IS NULL;

DO $$
DECLARE
  booking_record record;
BEGIN
  FOR booking_record IN
    SELECT id, created_at
    FROM package_booking_requests
    WHERE booking_reference IS NULL
    ORDER BY created_at, id
  LOOP
    UPDATE package_booking_requests
    SET booking_reference = next_package_booking_reference(booking_record.created_at)
    WHERE id = booking_record.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION assign_package_booking_reference()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR trim(NEW.booking_reference) = '' THEN
    NEW.booking_reference := next_package_booking_reference(COALESCE(NEW.created_at, now()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_package_booking_reference_before_insert
  ON package_booking_requests;
CREATE TRIGGER assign_package_booking_reference_before_insert
BEFORE INSERT ON package_booking_requests
FOR EACH ROW EXECUTE FUNCTION assign_package_booking_reference();

ALTER TABLE package_booking_requests
  ALTER COLUMN booking_reference SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL,
  ALTER COLUMN duration_days_snapshot SET NOT NULL;

ALTER TABLE package_booking_requests
  DROP CONSTRAINT IF EXISTS package_booking_requests_booking_status_valid,
  DROP CONSTRAINT IF EXISTS package_booking_requests_payment_status_valid,
  DROP CONSTRAINT IF EXISTS package_booking_source_valid,
  DROP CONSTRAINT IF EXISTS package_booking_schedule_valid,
  DROP CONSTRAINT IF EXISTS package_booking_duration_positive,
  DROP CONSTRAINT IF EXISTS package_booking_representative_gender_valid,
  DROP CONSTRAINT IF EXISTS package_booking_payment_plan_valid,
  DROP CONSTRAINT IF EXISTS package_booking_initial_payment_nonnegative,
  DROP CONSTRAINT IF EXISTS package_booking_deposit_status_valid,
  DROP CONSTRAINT IF EXISTS package_booking_selected_payment_method_valid,
  DROP CONSTRAINT IF EXISTS package_booking_deposit_extension_valid,
  DROP CONSTRAINT IF EXISTS package_booking_rebooking_not_self;

ALTER TABLE package_booking_requests
  ADD CONSTRAINT package_booking_requests_booking_status_valid
    CHECK (booking_status IN ('pending', 'reviewed', 'approved', 'declined', 'cancelled', 'expired', 'rescheduled')),
  ADD CONSTRAINT package_booking_requests_payment_status_valid
    CHECK (payment_status IN ('unpaid', 'proof_submitted', 'verified', 'rejected', 'not_required', 'pending_inquiry', 'partially_paid', 'paid')),
  ADD CONSTRAINT package_booking_source_valid
    CHECK (booking_source IN ('online', 'walk_in')),
  ADD CONSTRAINT package_booking_schedule_valid
    CHECK (end_date = start_date + (duration_days_snapshot - 1)),
  ADD CONSTRAINT package_booking_duration_positive
    CHECK (duration_days_snapshot >= 1),
  ADD CONSTRAINT package_booking_representative_gender_valid
    CHECK (representative_gender IS NULL OR representative_gender IN ('M', 'F')),
  ADD CONSTRAINT package_booking_payment_plan_valid
    CHECK (payment_plan IS NULL OR payment_plan IN ('deposit_50', 'full_payment', 'legacy_full', 'not_required')),
  ADD CONSTRAINT package_booking_initial_payment_nonnegative
    CHECK (initial_payment_amount IS NULL OR initial_payment_amount >= 0),
  ADD CONSTRAINT package_booking_deposit_status_valid
    CHECK (deposit_status IS NULL OR deposit_status IN ('pending', 'proof_submitted', 'partially_paid', 'paid', 'rejected', 'expired', 'transferred', 'refunded', 'not_required')),
  ADD CONSTRAINT package_booking_selected_payment_method_valid
    CHECK (selected_payment_method IS NULL OR selected_payment_method IN ('cash', 'qr_instapay', 'bank_transfer', 'legacy_electronic')),
  ADD CONSTRAINT package_booking_deposit_extension_valid
    CHECK (deposit_due_at IS NULL OR deposit_due_at <= created_at + interval '5 days'),
  ADD CONSTRAINT package_booking_rebooking_not_self
    CHECK (rebooked_from_booking_id IS NULL OR rebooked_from_booking_id <> id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_package_booking_requests_reference
  ON package_booking_requests(booking_reference);
CREATE UNIQUE INDEX IF NOT EXISTS ux_package_booking_requests_rebooked_from
  ON package_booking_requests(rebooked_from_booking_id)
  WHERE rebooked_from_booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_package_booking_requests_departure
  ON package_booking_requests(package_id, start_date, booking_status);
CREATE INDEX IF NOT EXISTS idx_package_booking_requests_deposit_deadline
  ON package_booking_requests(deposit_status, deposit_due_at)
  WHERE deposit_due_at IS NOT NULL;

-- --------------------------------------------------------------------------
-- Per-departure capacity overrides. Reserved pax is derived from active
-- bookings so cancellation/expiration releases capacity atomically.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS package_departure_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES tourism_packages(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  capacity_pax integer NOT NULL,
  notes text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_departure_capacity_positive CHECK (capacity_pax >= 1),
  CONSTRAINT package_departure_unique UNIQUE (package_id, start_date)
);

DROP TRIGGER IF EXISTS set_package_departure_inventory_updated_at
  ON package_departure_inventory;
CREATE TRIGGER set_package_departure_inventory_updated_at
BEFORE UPDATE ON package_departure_inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- Normalized payment transactions for split payments and mixed methods.
-- Legacy proof columns remain available during the compatibility period.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS package_booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_booking_request_id uuid NOT NULL REFERENCES package_booking_requests(id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL,
  payment_method varchar(40) NOT NULL,
  payment_status varchar(40) NOT NULL DEFAULT 'pending_verification',
  transaction_reference varchar(120),
  proof_file_url text,
  proof_original_filename varchar(255),
  proof_mime_type varchar(120),
  proof_file_size integer,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason text,
  notes text DEFAULT '',
  is_legacy boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_payment_amount_positive CHECK (amount > 0),
  CONSTRAINT package_booking_payment_method_valid
    CHECK (payment_method IN ('cash', 'qr_instapay', 'bank_transfer', 'legacy_electronic')),
  CONSTRAINT package_booking_payment_status_valid
    CHECK (payment_status IN ('pending_verification', 'verified', 'rejected', 'voided', 'refunded')),
  CONSTRAINT package_booking_payment_proof_size_nonnegative
    CHECK (proof_file_size IS NULL OR proof_file_size >= 0),
  CONSTRAINT package_booking_electronic_payment_evidence
    CHECK (
      is_legacy
      OR payment_method = 'cash'
      OR (
        NULLIF(trim(transaction_reference), '') IS NOT NULL
        AND NULLIF(trim(proof_file_url), '') IS NOT NULL
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_package_booking_payments_legacy
  ON package_booking_payments(package_booking_request_id)
  WHERE is_legacy;
CREATE INDEX IF NOT EXISTS idx_package_booking_payments_booking
  ON package_booking_payments(package_booking_request_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_package_booking_payments_reference
  ON package_booking_payments(lower(transaction_reference))
  WHERE transaction_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_package_booking_payments_active_reference
  ON package_booking_payments(lower(transaction_reference))
  WHERE transaction_reference IS NOT NULL
    AND payment_status NOT IN ('rejected', 'voided');

DROP TRIGGER IF EXISTS set_package_booking_payments_updated_at
  ON package_booking_payments;
CREATE TRIGGER set_package_booking_payments_updated_at
BEFORE UPDATE ON package_booking_payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO package_booking_payments (
  package_booking_request_id,
  amount,
  payment_method,
  payment_status,
  transaction_reference,
  proof_file_url,
  proof_original_filename,
  proof_mime_type,
  proof_file_size,
  submitted_at,
  verified_at,
  verified_by,
  rejection_reason,
  notes,
  is_legacy
)
SELECT
  id,
  computed_total_amount,
  'legacy_electronic',
  CASE
    WHEN payment_status = 'verified' THEN 'verified'
    WHEN payment_status = 'rejected' THEN 'rejected'
    ELSE 'pending_verification'
  END,
  payment_reference_number,
  proof_file_url,
  proof_original_filename,
  proof_mime_type,
  proof_file_size,
  COALESCE(payment_submitted_at, proof_uploaded_at, created_at),
  payment_verified_at,
  payment_verified_by,
  payment_rejection_reason,
  COALESCE(payment_notes, ''),
  true
FROM package_booking_requests
WHERE proof_file_url IS NOT NULL
  AND computed_total_amount IS NOT NULL
  AND computed_total_amount > 0
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- One-time, same-package credit transfers with a six-month validity window.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS package_booking_credit_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_booking_request_id uuid NOT NULL REFERENCES package_booking_requests(id) ON DELETE RESTRICT,
  to_booking_request_id uuid NOT NULL REFERENCES package_booking_requests(id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'applied',
  expires_at timestamptz NOT NULL,
  approved_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  refundable_excess numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_credit_amount_positive CHECK (amount > 0),
  CONSTRAINT package_booking_credit_excess_nonnegative CHECK (refundable_excess >= 0),
  CONSTRAINT package_booking_credit_status_valid CHECK (status IN ('applied', 'refunded', 'voided')),
  CONSTRAINT package_booking_credit_not_self CHECK (from_booking_request_id <> to_booking_request_id),
  CONSTRAINT package_booking_credit_once UNIQUE (from_booking_request_id)
);

CREATE INDEX IF NOT EXISTS idx_package_booking_credit_destination
  ON package_booking_credit_transfers(to_booking_request_id);

CREATE OR REPLACE FUNCTION enforce_same_package_credit_transfer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_package uuid;
  destination_package uuid;
BEGIN
  SELECT package_id INTO source_package
  FROM package_booking_requests
  WHERE id = NEW.from_booking_request_id;

  SELECT package_id INTO destination_package
  FROM package_booking_requests
  WHERE id = NEW.to_booking_request_id;

  IF source_package IS DISTINCT FROM destination_package THEN
    RAISE EXCEPTION 'Booking credit may only be transferred to the same package';
  END IF;

  IF NEW.expires_at > now() + interval '6 months' THEN
    RAISE EXCEPTION 'Booking credit validity may not exceed six months';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_same_package_credit_transfer_before_write
  ON package_booking_credit_transfers;
CREATE TRIGGER enforce_same_package_credit_transfer_before_write
BEFORE INSERT OR UPDATE ON package_booking_credit_transfers
FOR EACH ROW EXECUTE FUNCTION enforce_same_package_credit_transfer();

-- --------------------------------------------------------------------------
-- Date-change requests and immutable booking event history
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS package_booking_date_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_booking_request_id uuid NOT NULL REFERENCES package_booking_requests(id) ON DELETE RESTRICT,
  requested_by_tourist_account_id uuid REFERENCES tourist_accounts(id) ON DELETE SET NULL,
  requested_start_date date NOT NULL,
  requested_end_date date NOT NULL,
  requested_duration_days integer NOT NULL,
  reason text NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_date_change_duration_positive CHECK (requested_duration_days >= 1),
  CONSTRAINT package_booking_date_change_schedule_valid
    CHECK (requested_end_date = requested_start_date + (requested_duration_days - 1)),
  CONSTRAINT package_booking_date_change_status_valid
    CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_package_booking_date_change_pending
  ON package_booking_date_change_requests(package_booking_request_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS set_package_booking_date_change_requests_updated_at
  ON package_booking_date_change_requests;
CREATE TRIGGER set_package_booking_date_change_requests_updated_at
BEFORE UPDATE ON package_booking_date_change_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS package_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_booking_request_id uuid NOT NULL REFERENCES package_booking_requests(id) ON DELETE RESTRICT,
  event_type varchar(60) NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_tourist_account_id uuid REFERENCES tourist_accounts(id) ON DELETE SET NULL,
  before_values jsonb,
  after_values jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_booking_event_type_not_blank CHECK (length(trim(event_type)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_package_booking_events_booking
  ON package_booking_events(package_booking_request_id, created_at DESC);

-- --------------------------------------------------------------------------
-- Granular CMS permissions for the new booking operations
-- --------------------------------------------------------------------------

INSERT INTO permissions (id, permission_key, name, description)
VALUES
  ('21000000-0000-4000-8000-000000000047', 'package_bookings.create_walkin', 'Create Walk-in Bookings', 'Create package bookings for walk-in tourists.'),
  ('21000000-0000-4000-8000-000000000048', 'package_bookings.edit_schedule', 'Edit Booking Schedule', 'Approve date-change requests and edit package booking dates.'),
  ('21000000-0000-4000-8000-000000000049', 'package_bookings.extend_deposit', 'Extend Deposit Deadline', 'Extend an online deposit deadline up to five calendar days from booking creation.'),
  ('21000000-0000-4000-8000-000000000050', 'package_bookings.transfer_credit', 'Transfer Booking Credit', 'Approve a one-time same-package booking credit transfer.')
ON CONFLICT (permission_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

WITH role_permission_keys(role_key, permission_key) AS (
  VALUES
    ('system_admin', 'package_bookings.create_walkin'),
    ('system_admin', 'package_bookings.edit_schedule'),
    ('system_admin', 'package_bookings.extend_deposit'),
    ('system_admin', 'package_bookings.transfer_credit'),
    ('tourism_officer', 'package_bookings.create_walkin'),
    ('tourism_officer', 'package_bookings.edit_schedule'),
    ('tourism_officer', 'package_bookings.extend_deposit'),
    ('tourism_officer', 'package_bookings.transfer_credit'),
    ('tourism_staff', 'package_bookings.create_walkin'),
    ('tourism_staff', 'package_bookings.edit_schedule'),
    ('tourism_staff', 'package_bookings.extend_deposit')
),
resolved AS (
  SELECT role.id AS role_id, permission.id AS permission_id
  FROM role_permission_keys requested
  JOIN roles role ON role.role_key = requested.role_key
  JOIN permissions permission ON permission.permission_key = requested.permission_key
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM resolved
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
