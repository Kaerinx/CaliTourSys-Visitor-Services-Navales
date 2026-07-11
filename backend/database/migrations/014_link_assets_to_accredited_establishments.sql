-- Migration: 014_link_assets_to_accredited_establishments.sql
-- Purpose: Let Product Development assets optionally reference approved accreditation records.

BEGIN;

ALTER TABLE tourism_assets
  ADD COLUMN IF NOT EXISTS source_accreditation_record_id uuid REFERENCES accreditation_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_business_profile_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_assets_source_accreditation_record_id
  ON tourism_assets(source_accreditation_record_id);

CREATE INDEX IF NOT EXISTS idx_tourism_assets_source_business_profile_id
  ON tourism_assets(source_business_profile_id);

COMMIT;
