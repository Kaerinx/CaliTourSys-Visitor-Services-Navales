-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 002_cms_foundation_schema.sql
-- Scope: CMS Foundation after Public Facing Website
-- Database: PostgreSQL
--
-- Notes:
-- - Run after backend/database/migrations/001_public_website_schema.sql.
-- - This migration is additive and preserves existing public website tables.
-- - No default users, passwords, or seed accounts are created here.
-- ============================================================================

BEGIN;

-- ============================================================================
-- Enum Types
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked', 'pending');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_session_status') THEN
    CREATE TYPE auth_session_status AS ENUM ('active', 'revoked', 'expired');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_type') THEN
    CREATE TYPE audit_action_type AS ENUM (
      'create',
      'update',
      'publish',
      'archive',
      'delete',
      'restore',
      'login',
      'logout',
      'failed_login',
      'password_change',
      'permission_change'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cms_entity_type') THEN
    CREATE TYPE cms_entity_type AS ENUM (
      'product',
      'promotion',
      'event',
      'destination',
      'business',
      'map_location',
      'museum_artifact',
      'media_asset',
      'inquiry',
      'newsletter_subscriber',
      'user',
      'role',
      'permission'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_response_status') THEN
    CREATE TYPE inquiry_response_status AS ENUM ('draft', 'sent', 'failed', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_storage_provider') THEN
    CREATE TYPE media_storage_provider AS ENUM ('local', 'cloudinary', 's3', 'supabase', 'external');
  END IF;
END $$;

-- ============================================================================
-- CMS Authentication and RBAC Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  password_hash text NOT NULL,
  display_name varchar(255) NOT NULL,
  status user_status NOT NULL DEFAULT 'pending',
  last_login_at timestamptz,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  password_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT users_password_hash_not_blank CHECK (length(trim(password_hash)) > 0),
  CONSTRAINT users_display_name_not_blank CHECK (length(trim(display_name)) > 0),
  CONSTRAINT users_failed_login_count_nonnegative CHECK (failed_login_count >= 0)
);

COMMENT ON TABLE users IS 'CMS authentication identities for staff/admin users. Passwords are stored as hashes only.';
COMMENT ON COLUMN users.email IS 'CMS login email. Case-insensitive uniqueness is enforced by a lower(email) unique index.';
COMMENT ON COLUMN users.password_hash IS 'Password hash only. Plaintext passwords must never be stored.';
COMMENT ON COLUMN users.status IS 'CMS account lifecycle status.';
COMMENT ON COLUMN users.failed_login_count IS 'Failed login counter used for throttling or account lockout.';
COMMENT ON COLUMN users.locked_until IS 'When set in the future, login should be blocked by the authentication service.';

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key varchar(100) NOT NULL UNIQUE,
  name varchar(150) NOT NULL,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_role_key_not_blank CHECK (length(trim(role_key)) > 0),
  CONSTRAINT roles_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT roles_role_key_format CHECK (role_key ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

COMMENT ON TABLE roles IS 'CMS roles used for role-based access control.';
COMMENT ON COLUMN roles.role_key IS 'Stable machine-readable role key, for example system_admin.';
COMMENT ON COLUMN roles.is_system_role IS 'System roles are seeded and should be changed only with care.';

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key varchar(150) NOT NULL UNIQUE,
  name varchar(150) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permissions_key_not_blank CHECK (length(trim(permission_key)) > 0),
  CONSTRAINT permissions_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT permissions_key_format CHECK (permission_key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$')
);

COMMENT ON TABLE permissions IS 'Granular CMS permissions used by role-based access control.';
COMMENT ON COLUMN permissions.permission_key IS 'Stable machine-readable permission key, for example products.publish.';

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Many-to-many relationship between CMS users and roles.';
COMMENT ON COLUMN user_roles.assigned_by IS 'CMS user who assigned the role, if known.';

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_permissions_role_permission_unique UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between CMS roles and permissions.';

CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_number varchar(100) UNIQUE,
  position_title varchar(150),
  department varchar(150),
  contact_number varchar(80),
  profile_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE staff_profiles IS 'CMS staff profile information stored separately from login credentials.';
COMMENT ON COLUMN staff_profiles.user_id IS 'One-to-one link to the CMS authentication identity.';

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  status auth_session_status NOT NULL DEFAULT 'active',
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_sessions_refresh_token_hash_not_blank CHECK (length(trim(refresh_token_hash)) > 0),
  CONSTRAINT auth_sessions_expiry_after_created CHECK (expires_at > created_at),
  CONSTRAINT auth_sessions_revoked_at_valid CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

COMMENT ON TABLE auth_sessions IS 'CMS refresh/session tracking. Stores only hashed refresh tokens, never raw tokens.';
COMMENT ON COLUMN auth_sessions.refresh_token_hash IS 'Hash of the refresh token. The raw token must never be stored.';
COMMENT ON COLUMN auth_sessions.status IS 'Server-side session lifecycle status.';
COMMENT ON COLUMN auth_sessions.ip_address IS 'IP address observed when the session was created or updated.';

-- ============================================================================
-- CMS Audit, Versioning, Inquiry, and Notification Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action audit_action_type NOT NULL,
  entity_type cms_entity_type NOT NULL,
  entity_id uuid,
  entity_label varchar(255),
  before_values jsonb,
  after_values jsonb,
  ip_address inet,
  user_agent text,
  request_id varchar(120),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE content_audit_logs IS 'Production CMS audit trail for content changes and security events.';
COMMENT ON COLUMN content_audit_logs.actor_user_id IS 'CMS user who performed the action. Null is preserved if the user is deleted.';
COMMENT ON COLUMN content_audit_logs.action IS 'Audited action type such as create, update, publish, login, or failed_login.';
COMMENT ON COLUMN content_audit_logs.entity_type IS 'CMS-managed entity affected by the action.';
COMMENT ON COLUMN content_audit_logs.before_values IS 'JSON snapshot of relevant values before the action.';
COMMENT ON COLUMN content_audit_logs.after_values IS 'JSON snapshot of relevant values after the action.';
COMMENT ON COLUMN content_audit_logs.request_id IS 'Backend request identifier for tracing.';

CREATE TABLE IF NOT EXISTS content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type cms_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_versions_version_number_positive CHECK (version_number > 0),
  CONSTRAINT content_versions_entity_version_unique UNIQUE (entity_type, entity_id, version_number)
);

COMMENT ON TABLE content_versions IS 'Optional CMS content snapshots before major updates or publishing events.';
COMMENT ON COLUMN content_versions.snapshot IS 'JSON snapshot of the entity at this version.';

CREATE TABLE IF NOT EXISTS inquiry_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES tourism_inquiries(id) ON DELETE CASCADE,
  responder_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  response_message text NOT NULL,
  status inquiry_response_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiry_responses_message_not_blank CHECK (length(trim(response_message)) > 0)
);

COMMENT ON TABLE inquiry_responses IS 'CMS staff response records for public tourism inquiries. Email sending is not implemented by this table.';
COMMENT ON COLUMN inquiry_responses.status IS 'Response lifecycle state: draft, sent, failed, or archived.';

CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email varchar(255),
  recipient_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notification_type varchar(120) NOT NULL,
  subject varchar(255),
  status varchar(50) NOT NULL DEFAULT 'pending',
  provider varchar(100),
  provider_message_id varchar(255),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_logs_type_not_blank CHECK (length(trim(notification_type)) > 0),
  CONSTRAINT notification_logs_status_not_blank CHECK (length(trim(status)) > 0),
  CONSTRAINT notification_logs_email_format CHECK (
    recipient_email IS NULL OR recipient_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  )
);

COMMENT ON TABLE notification_logs IS 'Future-ready log for system or email notifications. Does not implement delivery by itself.';

-- ============================================================================
-- Extend Existing Public Tables with CMS Audit Columns
-- ============================================================================

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE map_locations
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE museum_artifacts
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS storage_provider media_storage_provider NOT NULL DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS storage_key text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS checksum_sha256 varchar(64);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_file_size_bytes_nonnegative'
  ) THEN
    ALTER TABLE media_assets
      ADD CONSTRAINT media_assets_file_size_bytes_nonnegative
      CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_checksum_sha256_format'
  ) THEN
    ALTER TABLE media_assets
      ADD CONSTRAINT media_assets_checksum_sha256_format
      CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[a-fA-F0-9]{64}$');
  END IF;
END $$;

-- Foreign keys for CMS audit columns on existing public tables.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('businesses', 'created_by', 'fk_businesses_created_by_users'),
      ('businesses', 'updated_by', 'fk_businesses_updated_by_users'),
      ('products', 'created_by', 'fk_products_created_by_users'),
      ('products', 'updated_by', 'fk_products_updated_by_users'),
      ('products', 'published_by', 'fk_products_published_by_users'),
      ('products', 'archived_by', 'fk_products_archived_by_users'),
      ('promotions', 'created_by', 'fk_promotions_created_by_users'),
      ('promotions', 'updated_by', 'fk_promotions_updated_by_users'),
      ('promotions', 'published_by', 'fk_promotions_published_by_users'),
      ('promotions', 'archived_by', 'fk_promotions_archived_by_users'),
      ('events', 'created_by', 'fk_events_created_by_users'),
      ('events', 'updated_by', 'fk_events_updated_by_users'),
      ('events', 'published_by', 'fk_events_published_by_users'),
      ('events', 'archived_by', 'fk_events_archived_by_users'),
      ('destinations', 'created_by', 'fk_destinations_created_by_users'),
      ('destinations', 'updated_by', 'fk_destinations_updated_by_users'),
      ('destinations', 'published_by', 'fk_destinations_published_by_users'),
      ('destinations', 'archived_by', 'fk_destinations_archived_by_users'),
      ('map_locations', 'created_by', 'fk_map_locations_created_by_users'),
      ('map_locations', 'updated_by', 'fk_map_locations_updated_by_users'),
      ('museum_artifacts', 'created_by', 'fk_museum_artifacts_created_by_users'),
      ('museum_artifacts', 'updated_by', 'fk_museum_artifacts_updated_by_users'),
      ('museum_artifacts', 'published_by', 'fk_museum_artifacts_published_by_users'),
      ('museum_artifacts', 'archived_by', 'fk_museum_artifacts_archived_by_users'),
      ('media_assets', 'created_by', 'fk_media_assets_created_by_users'),
      ('media_assets', 'updated_by', 'fk_media_assets_updated_by_users'),
      ('media_assets', 'uploaded_by', 'fk_media_assets_uploaded_by_users')
    ) AS t(table_name, column_name, constraint_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = item.constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES users(id) ON DELETE SET NULL',
        item.table_name,
        item.constraint_name,
        item.column_name
      );
    END IF;
  END LOOP;
END $$;

COMMENT ON COLUMN businesses.created_by IS 'CMS user who created this business record, if created through CMS.';
COMMENT ON COLUMN businesses.updated_by IS 'CMS user who last updated this business record, if updated through CMS.';
COMMENT ON COLUMN products.published_by IS 'CMS user who published this product, if published through CMS.';
COMMENT ON COLUMN products.archived_by IS 'CMS user who archived this product, if archived through CMS.';
COMMENT ON COLUMN promotions.published_by IS 'CMS user who published this promotion, if published through CMS.';
COMMENT ON COLUMN promotions.archived_by IS 'CMS user who archived this promotion, if archived through CMS.';
COMMENT ON COLUMN events.published_by IS 'CMS user who published this event, if published through CMS.';
COMMENT ON COLUMN events.archived_by IS 'CMS user who archived this event, if archived through CMS.';
COMMENT ON COLUMN destinations.published_by IS 'CMS user who published this destination, if published through CMS.';
COMMENT ON COLUMN destinations.archived_by IS 'CMS user who archived this destination, if archived through CMS.';
COMMENT ON COLUMN museum_artifacts.published_by IS 'CMS user who published this museum artifact, if published through CMS.';
COMMENT ON COLUMN museum_artifacts.archived_by IS 'CMS user who archived this museum artifact, if archived through CMS.';
COMMENT ON COLUMN media_assets.uploaded_by IS 'CMS user who uploaded the media asset, if uploaded through CMS.';
COMMENT ON COLUMN media_assets.storage_provider IS 'Storage backend used for this media asset.';
COMMENT ON COLUMN media_assets.storage_key IS 'Provider-specific object key or path. Do not store secrets here.';
COMMENT ON COLUMN media_assets.file_size_bytes IS 'Uploaded media size in bytes when known.';
COMMENT ON COLUMN media_assets.checksum_sha256 IS 'Optional SHA-256 checksum for media integrity checks.';

-- ============================================================================
-- Safe updated_at Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_permissions_updated_at ON permissions;
CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER trg_staff_profiles_updated_at
BEFORE UPDATE ON staff_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_auth_sessions_updated_at ON auth_sessions;
CREATE TRIGGER trg_auth_sessions_updated_at
BEFORE UPDATE ON auth_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_inquiry_responses_updated_at ON inquiry_responses;
CREATE TRIGGER trg_inquiry_responses_updated_at
BEFORE UPDATE ON inquiry_responses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

CREATE INDEX IF NOT EXISTS idx_roles_role_key ON roles(role_key);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employee_number ON staff_profiles(employee_number);

CREATE UNIQUE INDEX IF NOT EXISTS ux_auth_sessions_refresh_token_hash ON auth_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_status ON auth_sessions(status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_status ON auth_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_content_audit_logs_actor_user_id ON content_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_content_audit_logs_action ON content_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_content_audit_logs_entity ON content_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_audit_logs_created_at ON content_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_content_audit_logs_request_id ON content_audit_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_content_versions_entity ON content_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_by ON content_versions(created_by);

CREATE INDEX IF NOT EXISTS idx_inquiry_responses_inquiry_id ON inquiry_responses(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_responder_user_id ON inquiry_responses(responder_user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_status ON inquiry_responses(status);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_sent_at ON inquiry_responses(sent_at);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_user_id ON notification_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_email ON notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_businesses_created_by ON businesses(created_by);
CREATE INDEX IF NOT EXISTS idx_businesses_updated_by ON businesses(updated_by);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_updated_by ON products(updated_by);
CREATE INDEX IF NOT EXISTS idx_products_published_by ON products(published_by);
CREATE INDEX IF NOT EXISTS idx_products_archived_by ON products(archived_by);
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON promotions(created_by);
CREATE INDEX IF NOT EXISTS idx_promotions_updated_by ON promotions(updated_by);
CREATE INDEX IF NOT EXISTS idx_promotions_published_by ON promotions(published_by);
CREATE INDEX IF NOT EXISTS idx_promotions_archived_by ON promotions(archived_by);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_updated_by ON events(updated_by);
CREATE INDEX IF NOT EXISTS idx_events_published_by ON events(published_by);
CREATE INDEX IF NOT EXISTS idx_events_archived_by ON events(archived_by);
CREATE INDEX IF NOT EXISTS idx_destinations_created_by ON destinations(created_by);
CREATE INDEX IF NOT EXISTS idx_destinations_updated_by ON destinations(updated_by);
CREATE INDEX IF NOT EXISTS idx_destinations_published_by ON destinations(published_by);
CREATE INDEX IF NOT EXISTS idx_destinations_archived_by ON destinations(archived_by);
CREATE INDEX IF NOT EXISTS idx_map_locations_created_by ON map_locations(created_by);
CREATE INDEX IF NOT EXISTS idx_map_locations_updated_by ON map_locations(updated_by);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_created_by ON museum_artifacts(created_by);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_updated_by ON museum_artifacts(updated_by);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_published_by ON museum_artifacts(published_by);
CREATE INDEX IF NOT EXISTS idx_museum_artifacts_archived_by ON museum_artifacts(archived_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_storage_provider ON media_assets(storage_provider);

COMMIT;

