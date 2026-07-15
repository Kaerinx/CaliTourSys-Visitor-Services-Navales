-- Migration: 036_tourism_asset_reviews.sql
-- Purpose: Make Product Development tourism assets reviewable from the public map.

BEGIN;

ALTER TABLE tourism_reviews
  ADD COLUMN IF NOT EXISTS tourism_asset_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tourism_reviews_tourism_asset_id_fkey'
      AND conrelid = 'tourism_reviews'::regclass
  ) THEN
    ALTER TABLE tourism_reviews
      ADD CONSTRAINT tourism_reviews_tourism_asset_id_fkey
      FOREIGN KEY (tourism_asset_id)
      REFERENCES tourism_assets(id)
      ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE tourism_reviews
  DROP CONSTRAINT IF EXISTS tourism_reviews_exactly_one_target;

ALTER TABLE tourism_reviews
  ADD CONSTRAINT tourism_reviews_exactly_one_target CHECK (
    num_nonnulls(
      product_id,
      destination_id,
      tourism_asset_id,
      business_profile_id,
      business_id
    ) = 1
  );

CREATE UNIQUE INDEX IF NOT EXISTS ux_tourism_reviews_tourist_asset
  ON tourism_reviews(tourist_account_id, tourism_asset_id)
  WHERE tourist_account_id IS NOT NULL AND tourism_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_reviews_asset_created_at
  ON tourism_reviews(tourism_asset_id, created_at DESC)
  WHERE tourism_asset_id IS NOT NULL;

COMMIT;
