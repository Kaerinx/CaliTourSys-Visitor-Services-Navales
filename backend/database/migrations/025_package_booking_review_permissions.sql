-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 025_package_booking_review_permissions.sql
-- Scope: Add CMS permissions and audit entity for package booking review
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

ALTER TYPE cms_entity_type ADD VALUE IF NOT EXISTS 'package_booking_request';

ALTER TABLE package_booking_requests
  ADD COLUMN IF NOT EXISTS booking_review_notes text,
  ADD COLUMN IF NOT EXISTS booking_decline_reason text,
  ADD COLUMN IF NOT EXISTS booking_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS booking_reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL;

INSERT INTO permissions (id, permission_key, name, description)
VALUES
  ('21000000-0000-4000-8000-000000000045', 'package_bookings.view', 'View Package Bookings', 'View package booking requests and payment proof records.'),
  ('21000000-0000-4000-8000-000000000046', 'package_bookings.review', 'Review Package Bookings', 'Review package booking requests and manually verify payment proof.')
ON CONFLICT (permission_key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

WITH role_permission_keys(role_key, permission_key) AS (
  VALUES
    ('system_admin', 'package_bookings.view'),
    ('system_admin', 'package_bookings.review'),
    ('tourism_officer', 'package_bookings.view'),
    ('tourism_officer', 'package_bookings.review'),
    ('tourism_staff', 'package_bookings.view'),
    ('tourism_staff', 'package_bookings.review'),
    ('read_only_staff', 'package_bookings.view')
),
resolved AS (
  SELECT r.id AS role_id, p.id AS permission_id
  FROM role_permission_keys rpk
  JOIN roles r ON r.role_key = rpk.role_key
  JOIN permissions p ON p.permission_key = rpk.permission_key
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM resolved
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
