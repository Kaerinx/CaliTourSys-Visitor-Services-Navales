-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 007_product_package_combo_categories.sql
-- Scope: Allow combined package category themes in Product Development
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

ALTER TABLE tourism_packages
  DROP CONSTRAINT IF EXISTS tourism_packages_category_check;

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

COMMIT;
