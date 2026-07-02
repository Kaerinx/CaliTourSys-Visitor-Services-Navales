-- ============================================================================
-- CaliTourSys / CaliTourSys
-- Migration: 012_align_asset_categories.sql
-- Scope: Align Product Development asset categories with package categories
-- ============================================================================

BEGIN;

DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tourism_assets'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE tourism_assets DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

UPDATE tourism_assets
SET category = CASE
  WHEN category = 'Natural' THEN 'Nature'
  WHEN category IN ('Historical', 'Religious') THEN 'Cultural'
  WHEN category = 'Agricultural' THEN 'Food'
  WHEN category = 'Recreational' THEN 'Events'
  WHEN category = 'Other' THEN 'Nature'
  ELSE category
END
WHERE category IN ('Natural', 'Historical', 'Religious', 'Agricultural', 'Recreational', 'Other');

ALTER TABLE tourism_assets
ADD CONSTRAINT tourism_assets_category_check
CHECK (category IN ('Nature', 'Cultural', 'Food', 'Events'));

COMMIT;
