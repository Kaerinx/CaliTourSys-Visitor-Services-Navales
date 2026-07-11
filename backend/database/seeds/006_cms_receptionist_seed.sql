-- ============================================================================
-- CaliTourSys
-- Seed: 006_cms_receptionist_seed.sql
-- Scope: Visitor Services CMS receptionist test account only
-- ============================================================================

INSERT INTO users (
  display_name,
  first_name,
  last_name,
  email,
  password_hash,
  phone,
  role,
  status,
  email_verified_at
)
VALUES (
  'Receptionist Desk',
  'Receptionist',
  'Desk',
  'receptionist@tourism.gov.ph',
  '$2b$10$J6raAyuk4ja52jaBTHhQBeXK7Z4W6iNTWcyX8TEdlSu9M6KjhpeBO',
  '+63 912 000 0002',
  'receptionist',
  'active'::user_status,
  NOW()
)
ON CONFLICT (lower(email)) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
  updated_at = NOW();
