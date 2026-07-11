-- ============================================================================
-- CaliTourSys / CaliTourSys
-- Migration: 011_tourism_asset_images.sql
-- Scope: Uploaded gallery images for Product Development tourism assets
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tourism_asset_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES tourism_assets(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  original_name varchar(255),
  mime_type varchar(120),
  file_size integer,
  display_order integer NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_asset_images_url_not_blank CHECK (length(trim(image_url)) > 0),
  CONSTRAINT tourism_asset_images_display_order_positive CHECK (display_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_tourism_asset_images_asset_id ON tourism_asset_images(asset_id);
CREATE INDEX IF NOT EXISTS idx_tourism_asset_images_primary ON tourism_asset_images(asset_id, is_primary);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tourism_asset_images_asset_order
  ON tourism_asset_images(asset_id, display_order);

INSERT INTO tourism_asset_images (asset_id, image_url, display_order, is_primary)
SELECT id, image_url, 1, true
FROM tourism_assets
WHERE image_url IS NOT NULL
  AND length(trim(image_url)) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM tourism_asset_images existing
    WHERE existing.asset_id = tourism_assets.id
  );

COMMIT;
