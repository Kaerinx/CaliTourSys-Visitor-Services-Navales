-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 006_product_package_category_revision.sql
-- Scope: Align Product Development packages to revised categories and asset-only package items
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

ALTER TABLE tourism_packages
  DROP CONSTRAINT IF EXISTS tourism_packages_category_check;

ALTER TABLE package_items
  DROP CONSTRAINT IF EXISTS package_items_item_type_check;

UPDATE tourism_packages
SET category = CASE category
  WHEN 'Faith & Heritage' THEN 'Cultural'
  WHEN 'Coastal & Island' THEN 'Nature'
  WHEN 'Nature & Eco' THEN 'Nature'
  WHEN 'Agri-Tourism & Farm' THEN 'Food'
  WHEN 'Food & Local Products' THEN 'Food'
  ELSE category
END
WHERE category IN (
  'Faith & Heritage',
  'Coastal & Island',
  'Nature & Eco',
  'Agri-Tourism & Farm',
  'Food & Local Products'
);

UPDATE tourism_packages
SET name = CASE name
  WHEN 'Faith & Heritage Package' THEN 'Cultural Heritage Package'
  WHEN 'San Miguel Bay Coastal Discovery Package' THEN 'San Miguel Bay Nature Discovery Package'
  WHEN 'Hacienda Agri-Tourism Preview' THEN 'Hacienda Food Tourism Preview'
  ELSE replace(replace(name, 'Faith Heritage', 'Cultural Heritage'), 'Faith & Heritage', 'Cultural Heritage')
END
WHERE name ILIKE '%Faith%Heritage%'
   OR name ILIKE '%Coastal Discovery%'
   OR name ILIKE '%Agri-Tourism%';

DELETE FROM package_items
WHERE item_type = 'Activity';

ALTER TABLE tourism_packages
  ALTER COLUMN category SET DEFAULT 'Nature';

ALTER TABLE tourism_packages
  ADD CONSTRAINT tourism_packages_category_check
  CHECK (category IN (
    'Nature',
    'Cultural',
    'Food',
    'Events',
    'Nature and Cultural',
    'Nature and Food',
    'Nature and Events',
    'Cultural and Food',
    'Cultural and Events',
    'Food and Events'
  ));

ALTER TABLE package_items
  ADD CONSTRAINT package_items_item_type_check
  CHECK (item_type IN ('Plan', 'Asset'));

COMMIT;
