-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 003_product_development_schema.sql
-- Scope: Product Development workflow and public package handoff
-- Database: PostgreSQL
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS tourism_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text NOT NULL,
  location varchar(255) NOT NULL,
  category varchar(80) NOT NULL CHECK (
    category IN ('Natural', 'Cultural', 'Historical', 'Recreational', 'Agricultural', 'Religious', 'Other')
  ),
  target_market varchar(255) NOT NULL,
  development_status varchar(80) NOT NULL DEFAULT 'Draft' CHECK (
    development_status IN ('Draft', 'Archived')
  ),
  image_url text,
  remarks text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_assets_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT tourism_assets_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT tourism_assets_location_not_blank CHECK (length(trim(location)) > 0),
  CONSTRAINT tourism_assets_target_market_not_blank CHECK (length(trim(target_market)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_tourism_assets_status ON tourism_assets(development_status);
CREATE INDEX IF NOT EXISTS idx_tourism_assets_category ON tourism_assets(category);

DROP TRIGGER IF EXISTS set_tourism_assets_updated_at ON tourism_assets;
CREATE TRIGGER set_tourism_assets_updated_at
BEFORE UPDATE ON tourism_assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES tourism_assets(id) ON DELETE RESTRICT,
  title varchar(255) NOT NULL,
  objectives text NOT NULL,
  target_market varchar(255) NOT NULL,
  improvement_needs text NOT NULL,
  proposed_activities text NOT NULL,
  timeline_start date,
  timeline_end date,
  timeline_start_time time,
  timeline_end_time time,
  assigned_personnel varchar(255) NOT NULL,
  plan_status varchar(80) NOT NULL DEFAULT 'Draft' CHECK (
    plan_status IN ('Draft', 'Archived')
  ),
  remarks text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT development_plans_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT development_plans_objectives_not_blank CHECK (length(trim(objectives)) > 0),
  CONSTRAINT development_plans_target_market_not_blank CHECK (length(trim(target_market)) > 0),
  CONSTRAINT development_plans_improvement_needs_not_blank CHECK (length(trim(improvement_needs)) > 0),
  CONSTRAINT development_plans_proposed_activities_not_blank CHECK (length(trim(proposed_activities)) > 0),
  CONSTRAINT development_plans_assigned_personnel_not_blank CHECK (length(trim(assigned_personnel)) > 0),
  CONSTRAINT development_plans_timeline_order CHECK (
    timeline_start IS NULL OR timeline_end IS NULL OR timeline_end >= timeline_start
  )
);

CREATE INDEX IF NOT EXISTS idx_development_plans_asset_id ON development_plans(asset_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_status ON development_plans(plan_status);

DROP TRIGGER IF EXISTS set_development_plans_updated_at ON development_plans;
CREATE TRIGGER set_development_plans_updated_at
BEFORE UPDATE ON development_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS improvement_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES development_plans(id) ON DELETE RESTRICT,
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  improvement_status varchar(80) NOT NULL DEFAULT 'Not Started' CHECK (
    improvement_status IN ('Not Started', 'Ongoing', 'Delayed', 'Completed', 'On Hold', 'Archived')
  ),
  update_date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT improvement_records_remarks_not_blank CHECK (length(trim(remarks)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_improvement_records_plan_id ON improvement_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_improvement_records_status ON improvement_records(improvement_status);

DROP TRIGGER IF EXISTS set_improvement_records_updated_at ON improvement_records;
CREATE TRIGGER set_improvement_records_updated_at
BEFORE UPDATE ON improvement_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS tourism_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES tourism_assets(id) ON DELETE RESTRICT,
  plan_id uuid REFERENCES development_plans(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  description text NOT NULL,
  duration varchar(120) NOT NULL,
  target_market varchar(255) NOT NULL,
  activity_status varchar(80) NOT NULL DEFAULT 'Draft' CHECK (
    activity_status IN ('Draft', 'In Development', 'For Review', 'Ready for Promotion', 'Archived')
  ),
  remarks text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_activities_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT tourism_activities_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT tourism_activities_duration_not_blank CHECK (length(trim(duration)) > 0),
  CONSTRAINT tourism_activities_target_market_not_blank CHECK (length(trim(target_market)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_tourism_activities_asset_id ON tourism_activities(asset_id);
CREATE INDEX IF NOT EXISTS idx_tourism_activities_plan_id ON tourism_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_tourism_activities_status ON tourism_activities(activity_status);

DROP TRIGGER IF EXISTS set_tourism_activities_updated_at ON tourism_activities;
CREATE TRIGGER set_tourism_activities_updated_at
BEFORE UPDATE ON tourism_activities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS tourism_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text NOT NULL,
  category varchar(120) NOT NULL DEFAULT 'Nature' CHECK (
    category IN (
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
    )
  ),
  target_market varchar(255) NOT NULL,
  estimated_duration varchar(120) NOT NULL,
  package_status varchar(80) NOT NULL DEFAULT 'Draft' CHECK (
    package_status IN ('Draft', 'Ready for Promotion', 'Archived')
  ),
  remarks text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_packages_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT tourism_packages_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT tourism_packages_target_market_not_blank CHECK (length(trim(target_market)) > 0),
  CONSTRAINT tourism_packages_duration_not_blank CHECK (length(trim(estimated_duration)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_tourism_packages_status ON tourism_packages(package_status);
CREATE INDEX IF NOT EXISTS idx_tourism_packages_category ON tourism_packages(category);

DROP TRIGGER IF EXISTS set_tourism_packages_updated_at ON tourism_packages;
CREATE TRIGGER set_tourism_packages_updated_at
BEFORE UPDATE ON tourism_packages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES tourism_packages(id) ON DELETE CASCADE,
  item_type varchar(30) NOT NULL CHECK (item_type IN ('Plan', 'Asset')),
  item_reference_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_items_unique_reference UNIQUE (package_id, item_type, item_reference_id)
);

CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_reference ON package_items(item_type, item_reference_id);

CREATE TABLE IF NOT EXISTS product_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type varchar(80) NOT NULL,
  record_id uuid NOT NULL,
  previous_status varchar(80),
  new_status varchar(80) NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_by_role varchar(120),
  changed_by_name varchar(255),
  remarks text DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_status_history_record_type_not_blank CHECK (length(trim(record_type)) > 0),
  CONSTRAINT product_status_history_new_status_not_blank CHECK (length(trim(new_status)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_product_status_history_record ON product_status_history(record_type, record_id);

COMMIT;
