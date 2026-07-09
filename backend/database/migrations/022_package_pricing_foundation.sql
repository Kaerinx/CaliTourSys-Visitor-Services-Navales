-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 022_package_pricing_foundation.sql
-- Scope: Add package pricing foundation fields for future booking/payment flow
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

ALTER TABLE tourism_packages
  ADD COLUMN IF NOT EXISTS base_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS base_pax integer,
  ADD COLUMN IF NOT EXISTS extra_pax_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS min_pax integer,
  ADD COLUMN IF NOT EXISTS max_pax integer,
  ADD COLUMN IF NOT EXISTS payment_required boolean NOT NULL DEFAULT false;

ALTER TABLE tourism_packages
  DROP CONSTRAINT IF EXISTS tourism_packages_base_price_nonnegative,
  DROP CONSTRAINT IF EXISTS tourism_packages_base_pax_positive,
  DROP CONSTRAINT IF EXISTS tourism_packages_extra_pax_price_nonnegative,
  DROP CONSTRAINT IF EXISTS tourism_packages_min_pax_positive,
  DROP CONSTRAINT IF EXISTS tourism_packages_max_pax_positive,
  DROP CONSTRAINT IF EXISTS tourism_packages_pax_range_valid;

ALTER TABLE tourism_packages
  ADD CONSTRAINT tourism_packages_base_price_nonnegative
    CHECK (base_price IS NULL OR base_price >= 0),
  ADD CONSTRAINT tourism_packages_base_pax_positive
    CHECK (base_pax IS NULL OR base_pax >= 1),
  ADD CONSTRAINT tourism_packages_extra_pax_price_nonnegative
    CHECK (extra_pax_price IS NULL OR extra_pax_price >= 0),
  ADD CONSTRAINT tourism_packages_min_pax_positive
    CHECK (min_pax IS NULL OR min_pax >= 1),
  ADD CONSTRAINT tourism_packages_max_pax_positive
    CHECK (max_pax IS NULL OR max_pax >= 1),
  ADD CONSTRAINT tourism_packages_pax_range_valid
    CHECK (
      (min_pax IS NULL OR max_pax IS NULL OR max_pax >= min_pax)
      AND (base_pax IS NULL OR min_pax IS NULL OR base_pax >= min_pax)
      AND (base_pax IS NULL OR max_pax IS NULL OR base_pax <= max_pax)
    );

COMMIT;
