-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 001_public_website_schema.sql
-- Scope: Public Facing Website only
-- Database: PostgreSQL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Enum Types
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_status') THEN
    CREATE TYPE business_status AS ENUM ('active', 'inactive', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accreditation_status') THEN
    CREATE TYPE accreditation_status AS ENUM ('accredited', 'pending', 'expired', 'revoked');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_type') THEN
    CREATE TYPE contact_type AS ENUM ('email', 'phone', 'website', 'facebook', 'instagram', 'youtube', 'other');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_type') THEN
    CREATE TYPE promotion_type AS ENUM ('campaign', 'featured', 'seasonal', 'announcement');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_item_type') THEN
    CREATE TYPE promotion_item_type AS ENUM ('product', 'event', 'destination', 'business');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'map_location_type') THEN
    CREATE TYPE map_location_type AS ENUM ('destination', 'business', 'event');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itinerary_item_type') THEN
    CREATE TYPE itinerary_item_type AS ENUM ('product', 'event', 'destination', 'artifact');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
    CREATE TYPE inquiry_status AS ENUM ('new', 'read', 'responded', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('subscribed', 'unsubscribed', 'bounced');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_status') THEN
    CREATE TYPE media_status AS ENUM ('active', 'archived');
  END IF;
END $$;

-- ============================================================================
-- Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url text NOT NULL,
  file_name varchar(255),
  mime_type varchar(120),
  alt_text varchar(255),
  caption text,
  credit varchar(255),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  status media_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE media_assets IS 'Reusable public media records for products, events, destinations, and museum artifacts.';
COMMENT ON COLUMN media_assets.status IS 'Controls whether the asset is available for public display.';

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON media_assets;
CREATE TRIGGER trg_media_assets_updated_at
BEFORE UPDATE ON media_assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  business_type varchar(120) NOT NULL,
  owner_name varchar(255),
  description text,
  address_line text,
  barangay varchar(120),
  municipality varchar(120) NOT NULL DEFAULT 'Calabanga',
  province varchar(120) NOT NULL DEFAULT 'Camarines Sur',
  status business_status NOT NULL DEFAULT 'active',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT businesses_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT businesses_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE businesses IS 'Public tourism businesses and OTOP producers.';
COMMENT ON COLUMN businesses.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN businesses.status IS 'Public visibility state for the business or producer.';

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON businesses;
CREATE TRIGGER trg_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS business_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_type contact_type NOT NULL,
  contact_value varchar(255) NOT NULL,
  label varchar(120),
  is_primary boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_contacts_value_not_blank CHECK (length(trim(contact_value)) > 0)
);

COMMENT ON TABLE business_contacts IS 'Public contact methods for businesses and producers. Deleted when the parent business is deleted.';

DROP TRIGGER IF EXISTS trg_business_contacts_updated_at ON business_contacts;
CREATE TRIGGER trg_business_contacts_updated_at
BEFORE UPDATE ON business_contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS business_accreditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  accreditation_number varchar(120),
  status accreditation_status NOT NULL DEFAULT 'pending',
  issued_at date,
  expires_at date,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_accreditations_date_order CHECK (
    expires_at IS NULL OR issued_at IS NULL OR expires_at >= issued_at
  )
);

COMMENT ON TABLE business_accreditations IS 'Public LGU accreditation badge/status data only; not an accreditation workflow table.';
COMMENT ON COLUMN business_accreditations.status IS 'Public accreditation display status.';
COMMENT ON COLUMN business_accreditations.verified_at IS 'Timestamp when accreditation was verified for public display.';

DROP TRIGGER IF EXISTS trg_business_accreditations_updated_at ON business_accreditations;
CREATE TRIGGER trg_business_accreditations_updated_at
BEFORE UPDATE ON business_accreditations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT product_categories_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE product_categories IS 'Public OTOP product categories.';
COMMENT ON COLUMN product_categories.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN product_categories.status IS 'Controls whether category appears in public filters.';

DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON product_categories;
CREATE TRIGGER trg_product_categories_updated_at
BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  short_description text,
  description text,
  price_amount numeric(12,2),
  price_currency char(3) NOT NULL DEFAULT 'PHP',
  unit_label varchar(80),
  availability_text varchar(180),
  accent_color varchar(32),
  status content_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT products_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT products_price_non_negative CHECK (price_amount IS NULL OR price_amount >= 0)
);

COMMENT ON TABLE products IS 'Public OTOP/product listings and product detail records.';
COMMENT ON COLUMN products.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN products.status IS 'Public content lifecycle status.';
COMMENT ON COLUMN products.published_at IS 'Timestamp after which published content may appear publicly.';
COMMENT ON COLUMN products.archived_at IS 'Timestamp when public content was archived.';

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url text,
  alt_text varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_images_has_source CHECK (media_asset_id IS NOT NULL OR image_url IS NOT NULL)
);

COMMENT ON TABLE product_images IS 'Public product image gallery records. Deleted when the parent product is deleted.';

CREATE TABLE IF NOT EXISTS product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_tags_tag_not_blank CHECK (length(trim(tag)) > 0)
);

COMMENT ON TABLE product_tags IS 'Public product search and filtering tags. Deleted when the parent product is deleted.';

CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT event_categories_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE event_categories IS 'Public event categories for filters and labels.';
COMMENT ON COLUMN event_categories.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';

DROP TRIGGER IF EXISTS trg_event_categories_updated_at ON event_categories;
CREATE TRIGGER trg_event_categories_updated_at
BEFORE UPDATE ON event_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES event_categories(id) ON DELETE RESTRICT,
  slug varchar(180) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  short_description text,
  description text,
  venue_name varchar(255),
  organizer_name varchar(255),
  contact_info varchar(255),
  address_line text,
  barangay varchar(120),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  accent_color varchar(32),
  status content_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT events_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT events_date_order CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

COMMENT ON TABLE events IS 'Public event, festival, calendar, and event detail records.';
COMMENT ON COLUMN events.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN events.status IS 'Public content lifecycle status.';
COMMENT ON COLUMN events.published_at IS 'Timestamp after which published event content may appear publicly.';
COMMENT ON COLUMN events.archived_at IS 'Timestamp when event content was archived.';

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url text,
  alt_text varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_images_has_source CHECK (media_asset_id IS NOT NULL OR image_url IS NOT NULL)
);

COMMENT ON TABLE event_images IS 'Public event image gallery records. Deleted when the parent event is deleted.';

CREATE TABLE IF NOT EXISTS destination_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  color varchar(32),
  description text,
  display_order integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT destination_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT destination_categories_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE destination_categories IS 'Public tourist destination categories and map marker grouping.';
COMMENT ON COLUMN destination_categories.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';

DROP TRIGGER IF EXISTS trg_destination_categories_updated_at ON destination_categories;
CREATE TRIGGER trg_destination_categories_updated_at
BEFORE UPDATE ON destination_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES destination_categories(id) ON DELETE RESTRICT,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  short_description text,
  description text,
  address_line text,
  barangay varchar(120),
  municipality varchar(120) NOT NULL DEFAULT 'Calabanga',
  province varchar(120) NOT NULL DEFAULT 'Camarines Sur',
  opening_hours_text varchar(255),
  entrance_fee_text varchar(255),
  best_time_to_visit varchar(255),
  accessibility_notes text,
  accent_color varchar(32),
  status content_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT destinations_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT destinations_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE destinations IS 'Public tourist destination discovery records.';
COMMENT ON COLUMN destinations.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN destinations.status IS 'Public content lifecycle status.';
COMMENT ON COLUMN destinations.published_at IS 'Timestamp after which published destination content may appear publicly.';
COMMENT ON COLUMN destinations.archived_at IS 'Timestamp when destination content was archived.';

DROP TRIGGER IF EXISTS trg_destinations_updated_at ON destinations;
CREATE TRIGGER trg_destinations_updated_at
BEFORE UPDATE ON destinations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS destination_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url text,
  alt_text varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT destination_images_has_source CHECK (media_asset_id IS NOT NULL OR image_url IS NOT NULL)
);

COMMENT ON TABLE destination_images IS 'Public destination image gallery records. Deleted when the parent destination is deleted.';

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  summary text,
  description text,
  promotion_type promotion_type NOT NULL,
  accent_color varchar(32),
  starts_at timestamptz,
  ends_at timestamptz,
  status content_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotions_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT promotions_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT promotions_date_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

COMMENT ON TABLE promotions IS 'Public promotional campaigns, seasonal campaigns, featured sections, and announcements.';
COMMENT ON COLUMN promotions.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN promotions.status IS 'Public content lifecycle status.';
COMMENT ON COLUMN promotions.published_at IS 'Timestamp after which published promotion content may appear publicly.';
COMMENT ON COLUMN promotions.archived_at IS 'Timestamp when promotion content was archived.';

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON promotions;
CREATE TRIGGER trg_promotions_updated_at
BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS promotion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  item_type promotion_item_type NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotion_items_exactly_one_target CHECK (
    num_nonnulls(product_id, event_id, destination_id, business_id) = 1
  ),
  CONSTRAINT promotion_items_type_matches_target CHECK (
    (item_type = 'product' AND product_id IS NOT NULL AND event_id IS NULL AND destination_id IS NULL AND business_id IS NULL)
    OR
    (item_type = 'event' AND event_id IS NOT NULL AND product_id IS NULL AND destination_id IS NULL AND business_id IS NULL)
    OR
    (item_type = 'destination' AND destination_id IS NOT NULL AND product_id IS NULL AND event_id IS NULL AND business_id IS NULL)
    OR
    (item_type = 'business' AND business_id IS NOT NULL AND product_id IS NULL AND event_id IS NULL AND destination_id IS NULL)
  )
);

COMMENT ON TABLE promotion_items IS 'Public promotion targets. Deleting linked products, events, destinations, businesses, or promotions removes corresponding promotion links.';

CREATE TABLE IF NOT EXISTS map_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_type map_location_type NOT NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  label varchar(255) NOT NULL,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  mapbox_place_id varchar(255),
  marker_color varchar(32),
  marker_icon varchar(80),
  cluster_group varchar(120),
  geojson_properties jsonb,
  is_primary boolean NOT NULL DEFAULT true,
  is_clusterable boolean NOT NULL DEFAULT true,
  sort_priority integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_locations_label_not_blank CHECK (length(trim(label)) > 0),
  CONSTRAINT map_locations_latitude_valid CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT map_locations_longitude_valid CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT map_locations_exactly_one_target CHECK (
    num_nonnulls(destination_id, business_id, event_id) = 1
  ),
  CONSTRAINT map_locations_type_matches_target CHECK (
    (location_type = 'destination' AND destination_id IS NOT NULL AND business_id IS NULL AND event_id IS NULL)
    OR
    (location_type = 'business' AND business_id IS NOT NULL AND destination_id IS NULL AND event_id IS NULL)
    OR
    (location_type = 'event' AND event_id IS NOT NULL AND destination_id IS NULL AND business_id IS NULL)
  )
);

COMMENT ON TABLE map_locations IS 'Mapbox-ready public map locations. Deleting linked destinations, businesses, or events removes their public map points.';
COMMENT ON COLUMN map_locations.latitude IS 'Latitude coordinate for future Mapbox rendering. Must be between -90 and 90.';
COMMENT ON COLUMN map_locations.longitude IS 'Longitude coordinate for future Mapbox rendering. Must be between -180 and 180.';
COMMENT ON COLUMN map_locations.status IS 'Controls whether the map point appears publicly.';

DROP TRIGGER IF EXISTS trg_map_locations_updated_at ON map_locations;
CREATE TRIGGER trg_map_locations_updated_at
BEFORE UPDATE ON map_locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS artifact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT artifact_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT artifact_categories_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE artifact_categories IS 'Public interactive museum artifact categories and eras.';
COMMENT ON COLUMN artifact_categories.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';

DROP TRIGGER IF EXISTS trg_artifact_categories_updated_at ON artifact_categories;
CREATE TRIGGER trg_artifact_categories_updated_at
BEFORE UPDATE ON artifact_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS museum_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES artifact_categories(id) ON DELETE RESTRICT,
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  era_label varchar(180),
  short_description text,
  description text,
  historical_notes text,
  accent_color varchar(32),
  status content_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT museum_artifacts_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT museum_artifacts_name_not_blank CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE museum_artifacts IS 'Public interactive museum artifact records.';
COMMENT ON COLUMN museum_artifacts.slug IS 'Lowercase URL-safe public slug: letters, numbers, and hyphens only.';
COMMENT ON COLUMN museum_artifacts.status IS 'Public content lifecycle status.';
COMMENT ON COLUMN museum_artifacts.published_at IS 'Timestamp after which published artifact content may appear publicly.';
COMMENT ON COLUMN museum_artifacts.archived_at IS 'Timestamp when artifact content was archived.';

DROP TRIGGER IF EXISTS trg_museum_artifacts_updated_at ON museum_artifacts;
CREATE TRIGGER trg_museum_artifacts_updated_at
BEFORE UPDATE ON museum_artifacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS artifact_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES museum_artifacts(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url text,
  alt_text varchar(255),
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT artifact_images_has_source CHECK (media_asset_id IS NOT NULL OR image_url IS NOT NULL)
);

COMMENT ON TABLE artifact_images IS 'Public museum artifact image gallery records. Deleted when the parent artifact is deleted.';

CREATE TABLE IF NOT EXISTS itinerary_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token varchar(255) NOT NULL UNIQUE,
  visitor_label varchar(120),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itinerary_sessions_token_not_blank CHECK (length(trim(session_token)) > 0)
);

COMMENT ON TABLE itinerary_sessions IS 'Anonymous public itinerary sessions.';
COMMENT ON COLUMN itinerary_sessions.session_token IS 'Public-safe anonymous token used to retrieve a visitor itinerary.';

DROP TRIGGER IF EXISTS trg_itinerary_sessions_updated_at ON itinerary_sessions;
CREATE TRIGGER trg_itinerary_sessions_updated_at
BEFORE UPDATE ON itinerary_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_session_id uuid NOT NULL REFERENCES itinerary_sessions(id) ON DELETE CASCADE,
  item_type itinerary_item_type NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES museum_artifacts(id) ON DELETE CASCADE,
  title_snapshot varchar(255),
  saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itinerary_items_exactly_one_target CHECK (
    num_nonnulls(product_id, event_id, destination_id, artifact_id) = 1
  ),
  CONSTRAINT itinerary_items_type_matches_target CHECK (
    (item_type = 'product' AND product_id IS NOT NULL AND event_id IS NULL AND destination_id IS NULL AND artifact_id IS NULL)
    OR
    (item_type = 'event' AND event_id IS NOT NULL AND product_id IS NULL AND destination_id IS NULL AND artifact_id IS NULL)
    OR
    (item_type = 'destination' AND destination_id IS NOT NULL AND product_id IS NULL AND event_id IS NULL AND artifact_id IS NULL)
    OR
    (item_type = 'artifact' AND artifact_id IS NOT NULL AND product_id IS NULL AND event_id IS NULL AND destination_id IS NULL)
  )
);

COMMENT ON TABLE itinerary_items IS 'Saved public itinerary items. Deleting linked public content removes corresponding saved itinerary items.';

CREATE TABLE IF NOT EXISTS tourism_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  contact_number varchar(80),
  subject varchar(255) NOT NULL,
  message text NOT NULL,
  source_page varchar(255),
  status inquiry_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_inquiries_full_name_not_blank CHECK (length(trim(full_name)) > 0),
  CONSTRAINT tourism_inquiries_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT tourism_inquiries_email_format CHECK (
    email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ),
  CONSTRAINT tourism_inquiries_subject_not_blank CHECK (length(trim(subject)) > 0),
  CONSTRAINT tourism_inquiries_message_not_blank CHECK (length(trim(message)) > 0)
);

COMMENT ON TABLE tourism_inquiries IS 'Public tourism inquiry/contact form submissions only; no staff workflow in this phase.';
COMMENT ON COLUMN tourism_inquiries.status IS 'Basic inquiry state reserved for future CMS handling.';

DROP TRIGGER IF EXISTS trg_tourism_inquiries_updated_at ON tourism_inquiries;
CREATE TRIGGER trg_tourism_inquiries_updated_at
BEFORE UPDATE ON tourism_inquiries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  full_name varchar(255),
  status subscription_status NOT NULL DEFAULT 'subscribed',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT newsletter_subscribers_email_format CHECK (
    email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ),
  CONSTRAINT newsletter_subscribers_unsubscribe_date CHECK (
    unsubscribed_at IS NULL OR unsubscribed_at >= subscribed_at
  )
);

COMMENT ON TABLE newsletter_subscribers IS 'Public newsletter subscriptions from the website footer/form.';
COMMENT ON COLUMN newsletter_subscribers.status IS 'Subscription lifecycle status.';

DROP TRIGGER IF EXISTS trg_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER trg_newsletter_subscribers_updated_at
BEFORE UPDATE ON newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_businesses_slug_lower ON businesses(lower(slug));
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_is_featured ON businesses(is_featured);
CREATE INDEX IF NOT EXISTS idx_business_contacts_business_id ON business_contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_business_contacts_type ON business_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_business_accreditations_business_id ON business_accreditations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_accreditations_status ON business_accreditations(status);
CREATE INDEX IF NOT EXISTS idx_business_accreditations_business_status ON business_accreditations(business_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_categories_slug_lower ON product_categories(lower(slug));
CREATE INDEX IF NOT EXISTS idx_product_categories_status ON product_categories(status);
CREATE INDEX IF NOT EXISTS idx_product_categories_display_order ON product_categories(display_order);

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_slug_lower ON products(lower(slug));
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_published_at ON products(published_at);
CREATE INDEX IF NOT EXISTS idx_products_status_published_at ON products(status, published_at);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_lower ON product_tags(lower(tag));
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_tags_product_tag_lower ON product_tags(product_id, lower(tag));

CREATE UNIQUE INDEX IF NOT EXISTS ux_event_categories_slug_lower ON event_categories(lower(slug));
CREATE INDEX IF NOT EXISTS idx_event_categories_status ON event_categories(status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_events_slug_lower ON events(lower(slug));
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_status_starts_at ON events(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_primary ON event_images(event_id, is_primary);

CREATE UNIQUE INDEX IF NOT EXISTS ux_destination_categories_slug_lower ON destination_categories(lower(slug));
CREATE INDEX IF NOT EXISTS idx_destination_categories_status ON destination_categories(status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_destinations_slug_lower ON destinations(lower(slug));
CREATE INDEX IF NOT EXISTS idx_destinations_category_id ON destinations(category_id);
CREATE INDEX IF NOT EXISTS idx_destinations_business_id ON destinations(business_id);
CREATE INDEX IF NOT EXISTS idx_destinations_status ON destinations(status);
CREATE INDEX IF NOT EXISTS idx_destinations_is_featured ON destinations(is_featured);
CREATE INDEX IF NOT EXISTS idx_destinations_published_at ON destinations(published_at);
CREATE INDEX IF NOT EXISTS idx_destinations_status_published_at ON destinations(status, published_at);
CREATE INDEX IF NOT EXISTS idx_destination_images_destination_id ON destination_images(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_images_primary ON destination_images(destination_id, is_primary);

CREATE UNIQUE INDEX IF NOT EXISTS ux_promotions_slug_lower ON promotions(lower(slug));
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_is_featured ON promotions(is_featured);
CREATE INDEX IF NOT EXISTS idx_promotions_published_at ON promotions(published_at);
CREATE INDEX IF NOT EXISTS idx_promotions_status_dates ON promotions(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotion_items_promotion_id ON promotion_items(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_items_product_id ON promotion_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotion_items_event_id ON promotion_items(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotion_items_destination_id ON promotion_items(destination_id) WHERE destination_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotion_items_business_id ON promotion_items(business_id) WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_map_locations_location_type ON map_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_map_locations_status ON map_locations(status);
CREATE INDEX IF NOT EXISTS idx_map_locations_lat_lng ON map_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_map_locations_destination_id ON map_locations(destination_id) WHERE destination_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_map_locations_business_id ON map_locations(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_map_locations_event_id ON map_locations(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_map_locations_cluster_group ON map_locations(cluster_group);

CREATE UNIQUE INDEX IF NOT EXISTS ux_artifact_categories_slug_lower ON artifact_categories(lower(slug));
CREATE INDEX IF NOT EXISTS idx_artifact_categories_status ON artifact_categories(status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_museum_artifacts_slug_lower ON museum_artifacts(lower(slug));
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_category_id ON museum_artifacts(category_id);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_status ON museum_artifacts(status);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_is_featured ON museum_artifacts(is_featured);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_published_at ON museum_artifacts(published_at);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_status_published_at ON museum_artifacts(status, published_at);
CREATE INDEX IF NOT EXISTS idx_artifact_images_artifact_id ON artifact_images(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_images_primary ON artifact_images(artifact_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_itinerary_sessions_token ON itinerary_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_session_id ON itinerary_items(itinerary_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_itinerary_items_session_product
ON itinerary_items(itinerary_session_id, product_id)
WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_itinerary_items_session_event
ON itinerary_items(itinerary_session_id, event_id)
WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_itinerary_items_session_destination
ON itinerary_items(itinerary_session_id, destination_id)
WHERE destination_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_itinerary_items_session_artifact
ON itinerary_items(itinerary_session_id, artifact_id)
WHERE artifact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_status_created_at ON tourism_inquiries(status, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_newsletter_subscribers_email_lower
ON newsletter_subscribers(lower(email));

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);