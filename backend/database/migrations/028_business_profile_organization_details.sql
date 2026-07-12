ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS legal_structure VARCHAR(80),
  ADD COLUMN IF NOT EXISTS partners JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS authorized_representative_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS authorized_representative_position VARCHAR(160),
  ADD COLUMN IF NOT EXISTS company_registration_number VARCHAR(120);

UPDATE business_profiles
SET partners = '[]'::jsonb
WHERE partners IS NULL;
