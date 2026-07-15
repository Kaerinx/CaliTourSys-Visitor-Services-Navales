-- ============================================================================
-- CaliTourSys
-- Migration: 033_seed_calabanga_rhu_emergency_facility.sql
-- Scope: Seed Calabanga Rural Health Unit as a published emergency facility.
-- Database: PostgreSQL
-- ============================================================================

INSERT INTO emergency_facilities (
  slug,
  name,
  facility_type,
  description,
  address_line,
  barangay,
  municipality,
  province,
  latitude,
  longitude,
  opening_hours,
  public_phone,
  emergency_hotline,
  email,
  accessibility_features,
  amenities,
  verification_source,
  verified_at,
  sort_priority,
  status,
  published_at
) VALUES (
  'calabanga-rural-health-unit',
  'Calabanga Rural Health Unit',
  'health_center',
  'Community health center',
  'P658+93J, Calabanga, Camarines Sur',
  NULL,
  'Calabanga',
  'Camarines Sur',
  13.708800,
  123.217800,
  '{
    "monday": "8 AM-5 PM",
    "tuesday": "8 AM-5 PM",
    "wednesday": "8 AM-5 PM",
    "thursday": "8 AM-5 PM",
    "saturday": "Closed",
    "sunday": "Closed"
  }'::jsonb,
  NULL,
  NULL,
  NULL,
  '[
    "Wheelchair accessible entrance",
    "Wheelchair accessible restroom",
    "Wheelchair accessible parking lot"
  ]'::jsonb,
  '[
    "Restroom"
  ]'::jsonb,
  'User-provided facility details',
  now(),
  0,
  'published',
  now()
)
ON CONFLICT (lower(slug))
DO UPDATE SET
  name = EXCLUDED.name,
  facility_type = EXCLUDED.facility_type,
  description = EXCLUDED.description,
  address_line = EXCLUDED.address_line,
  barangay = EXCLUDED.barangay,
  municipality = EXCLUDED.municipality,
  province = EXCLUDED.province,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  opening_hours = EXCLUDED.opening_hours,
  public_phone = EXCLUDED.public_phone,
  emergency_hotline = EXCLUDED.emergency_hotline,
  email = EXCLUDED.email,
  accessibility_features = EXCLUDED.accessibility_features,
  amenities = EXCLUDED.amenities,
  verification_source = EXCLUDED.verification_source,
  verified_at = COALESCE(emergency_facilities.verified_at, EXCLUDED.verified_at),
  sort_priority = EXCLUDED.sort_priority,
  status = EXCLUDED.status,
  published_at = COALESCE(emergency_facilities.published_at, EXCLUDED.published_at),
  archived_at = NULL,
  updated_at = now();
