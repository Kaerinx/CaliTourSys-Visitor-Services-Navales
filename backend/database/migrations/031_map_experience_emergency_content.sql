-- ============================================================================
-- CaliTourSys
-- Migration: 031_map_experience_emergency_content.sql
-- Scope: Emergency map facilities and rich destination/business map content.
-- Database: PostgreSQL
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_entity_type') THEN
    ALTER TYPE cms_entity_type ADD VALUE IF NOT EXISTS 'emergency_facility';
  END IF;
END $$;

BEGIN;

-- --------------------------------------------------------------------------
-- Emergency infrastructure displayed independently from tourism locations
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS emergency_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL,
  name varchar(255) NOT NULL,
  facility_type varchar(120) NOT NULL,
  description text,
  address_line text NOT NULL,
  barangay varchar(120),
  municipality varchar(120) NOT NULL DEFAULT 'Calabanga',
  province varchar(120) NOT NULL DEFAULT 'Camarines Sur',
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  public_phone varchar(80),
  emergency_hotline varchar(80),
  email varchar(255),
  accessibility_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_source text,
  verified_at timestamptz,
  sort_priority integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  archived_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT emergency_facilities_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT emergency_facilities_name_not_blank
    CHECK (length(trim(name)) > 0),
  CONSTRAINT emergency_facilities_type_not_blank
    CHECK (length(trim(facility_type)) > 0),
  CONSTRAINT emergency_facilities_address_not_blank
    CHECK (length(trim(address_line)) > 0),
  CONSTRAINT emergency_facilities_latitude_valid
    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT emergency_facilities_longitude_valid
    CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT emergency_facilities_opening_hours_object
    CHECK (jsonb_typeof(opening_hours) = 'object'),
  CONSTRAINT emergency_facilities_accessibility_array
    CHECK (jsonb_typeof(accessibility_features) = 'array'),
  CONSTRAINT emergency_facilities_amenities_array
    CHECK (jsonb_typeof(amenities) = 'array')
);

COMMENT ON TABLE emergency_facilities IS
  'CMS-managed emergency and first-response establishments rendered as an independent public map layer.';
COMMENT ON COLUMN emergency_facilities.opening_hours IS
  'Structured weekly hours object. Keys and display labels are managed by the CMS.';
COMMENT ON COLUMN emergency_facilities.verification_source IS
  'Source used by LGU staff to verify public emergency-facility information.';

CREATE UNIQUE INDEX IF NOT EXISTS ux_emergency_facilities_slug_lower
  ON emergency_facilities (lower(slug));
CREATE INDEX IF NOT EXISTS idx_emergency_facilities_publication
  ON emergency_facilities (status, published_at, sort_priority);
CREATE INDEX IF NOT EXISTS idx_emergency_facilities_coordinates
  ON emergency_facilities (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_emergency_facilities_created_by
  ON emergency_facilities (created_by);
CREATE INDEX IF NOT EXISTS idx_emergency_facilities_updated_by
  ON emergency_facilities (updated_by);

DROP TRIGGER IF EXISTS trg_emergency_facilities_updated_at ON emergency_facilities;
CREATE TRIGGER trg_emergency_facilities_updated_at
BEFORE UPDATE ON emergency_facilities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- Rich content attached to an existing destination/business map location
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS map_location_details (
  map_location_id uuid PRIMARY KEY REFERENCES map_locations(id) ON DELETE CASCADE,
  overview text,
  opening_hours_text text,
  admission_information text,
  best_time_to_visit text,
  accessibility_notes text,
  how_to_visit text,
  how_to_book text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE map_location_details IS
  'Optional normalized detail copy for destination and business map locations.';

CREATE INDEX IF NOT EXISTS idx_map_location_details_created_by
  ON map_location_details (created_by);
CREATE INDEX IF NOT EXISTS idx_map_location_details_updated_by
  ON map_location_details (updated_by);

DROP TRIGGER IF EXISTS trg_map_location_details_updated_at ON map_location_details;
CREATE TRIGGER trg_map_location_details_updated_at
BEFORE UPDATE ON map_location_details
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS map_location_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_location_id uuid NOT NULL REFERENCES map_locations(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url text,
  alt_text varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_location_gallery_images_has_source
    CHECK (media_asset_id IS NOT NULL OR NULLIF(trim(image_url), '') IS NOT NULL)
);

COMMENT ON TABLE map_location_gallery_images IS
  'Ordered rich-detail gallery images. A direct URL or reusable active media asset supplies each image.';

CREATE INDEX IF NOT EXISTS idx_map_location_gallery_images_location_order
  ON map_location_gallery_images (map_location_id, display_order, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ux_map_location_gallery_images_primary
  ON map_location_gallery_images (map_location_id)
  WHERE is_primary = true;

DROP TRIGGER IF EXISTS trg_map_location_gallery_images_updated_at ON map_location_gallery_images;
CREATE TRIGGER trg_map_location_gallery_images_updated_at
BEFORE UPDATE ON map_location_gallery_images
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS map_location_activity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_location_id uuid NOT NULL REFERENCES map_locations(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES tourism_activities(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_location_activity_links_unique
    UNIQUE (map_location_id, activity_id)
);

COMMENT ON TABLE map_location_activity_links IS
  'Ordered tourism activities associated with a destination or business map location.';

CREATE INDEX IF NOT EXISTS idx_map_location_activity_links_location_order
  ON map_location_activity_links (map_location_id, display_order, created_at);
CREATE INDEX IF NOT EXISTS idx_map_location_activity_links_activity
  ON map_location_activity_links (activity_id);

CREATE TABLE IF NOT EXISTS map_location_package_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_location_id uuid NOT NULL REFERENCES map_locations(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES tourism_packages(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_location_package_links_unique
    UNIQUE (map_location_id, package_id)
);

COMMENT ON TABLE map_location_package_links IS
  'Ordered tourism packages associated with a map location, with at most one primary booking package.';

CREATE INDEX IF NOT EXISTS idx_map_location_package_links_location_order
  ON map_location_package_links (map_location_id, display_order, created_at);
CREATE INDEX IF NOT EXISTS idx_map_location_package_links_package
  ON map_location_package_links (package_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_map_location_package_links_primary
  ON map_location_package_links (map_location_id)
  WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS map_location_overnight_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_location_id uuid NOT NULL REFERENCES map_locations(id) ON DELETE CASCADE,
  option_type varchar(40) NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  capacity_min integer,
  capacity_max integer,
  rate_amount numeric(12,2),
  currency char(3) NOT NULL DEFAULT 'PHP',
  rate_unit varchar(80) NOT NULL,
  inclusions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_location_overnight_options_type_valid
    CHECK (option_type IN ('camping', 'tent_rental', 'other')),
  CONSTRAINT map_location_overnight_options_name_not_blank
    CHECK (length(trim(name)) > 0),
  CONSTRAINT map_location_overnight_options_capacity_min_positive
    CHECK (capacity_min IS NULL OR capacity_min >= 1),
  CONSTRAINT map_location_overnight_options_capacity_max_positive
    CHECK (capacity_max IS NULL OR capacity_max >= 1),
  CONSTRAINT map_location_overnight_options_capacity_range
    CHECK (capacity_min IS NULL OR capacity_max IS NULL OR capacity_max >= capacity_min),
  CONSTRAINT map_location_overnight_options_rate_nonnegative
    CHECK (rate_amount IS NULL OR rate_amount >= 0),
  CONSTRAINT map_location_overnight_options_currency_php
    CHECK (currency = 'PHP'),
  CONSTRAINT map_location_overnight_options_rate_unit_valid
    CHECK (rate_unit IN (
      'per_person_per_night',
      'per_tent_per_night',
      'per_site_per_night',
      'flat_rate'
    )),
  CONSTRAINT map_location_overnight_options_inclusions_array
    CHECK (jsonb_typeof(inclusions) = 'array')
);

COMMENT ON TABLE map_location_overnight_options IS
  'Ordered camping, tent-rental, and other overnight pricing rows for public map-location details.';

CREATE INDEX IF NOT EXISTS idx_map_location_overnight_options_public_order
  ON map_location_overnight_options (map_location_id, is_active, display_order, created_at);

DROP TRIGGER IF EXISTS trg_map_location_overnight_options_updated_at ON map_location_overnight_options;
CREATE TRIGGER trg_map_location_overnight_options_updated_at
BEFORE UPDATE ON map_location_overnight_options
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
