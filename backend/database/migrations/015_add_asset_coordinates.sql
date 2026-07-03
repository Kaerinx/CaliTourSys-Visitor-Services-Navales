-- Migration: 015_add_asset_coordinates.sql
-- Purpose: Store map coordinates inherited from accredited establishments on tourism assets.

BEGIN;

ALTER TABLE tourism_assets
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tourism_assets_latitude_valid'
  ) THEN
    ALTER TABLE tourism_assets
      ADD CONSTRAINT tourism_assets_latitude_valid
      CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tourism_assets_longitude_valid'
  ) THEN
    ALTER TABLE tourism_assets
      ADD CONSTRAINT tourism_assets_longitude_valid
      CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
  END IF;
END $$;

UPDATE tourism_assets ta
SET latitude = bp.latitude,
    longitude = bp.longitude
FROM business_profiles bp
WHERE ta.source_business_profile_id = bp.id
  AND ta.latitude IS NULL
  AND ta.longitude IS NULL
  AND bp.latitude IS NOT NULL
  AND bp.longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_assets_lat_lng ON tourism_assets(latitude, longitude);

COMMIT;
