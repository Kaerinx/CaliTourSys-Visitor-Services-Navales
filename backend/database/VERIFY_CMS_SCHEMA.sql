-- ============================================================================
-- CaliTourSys / CallTourSys
-- Verification: VERIFY_CMS_SCHEMA.sql
-- Scope: CMS Foundation verification after migration 002 and seed 002
-- ============================================================================

-- 1. Verify expected CMS tables exist.
SELECT
  COUNT(*) AS existing_cms_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'roles',
    'permissions',
    'user_roles',
    'role_permissions',
    'staff_profiles',
    'auth_sessions',
    'content_audit_logs',
    'content_versions',
    'inquiry_responses',
    'notification_logs'
  );

-- 2. Verify roles exist.
SELECT
  role_key,
  name,
  is_system_role
FROM roles
ORDER BY role_key;

-- 3. Verify permissions exist.
SELECT
  permission_key,
  name
FROM permissions
ORDER BY permission_key;

-- 4. Verify role-permission mappings exist.
SELECT
  r.role_key,
  COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.role_key
ORDER BY r.role_key;

-- 5. Verify no users were seeded.
SELECT
  COUNT(*) AS seeded_user_count_should_be_zero
FROM users;

-- 6. Verify audit log table exists and has expected core columns.
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_audit_logs'
  AND column_name IN (
    'actor_user_id',
    'action',
    'entity_type',
    'entity_id',
    'before_values',
    'after_values',
    'request_id',
    'created_at'
  )
ORDER BY column_name;

-- 7. Verify existing public tables still exist.
SELECT
  COUNT(*) AS existing_public_website_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'media_assets',
    'businesses',
    'business_contacts',
    'business_accreditations',
    'product_categories',
    'products',
    'product_images',
    'product_tags',
    'promotions',
    'promotion_items',
    'event_categories',
    'events',
    'event_images',
    'destination_categories',
    'destinations',
    'destination_images',
    'map_locations',
    'artifact_categories',
    'museum_artifacts',
    'artifact_images',
    'itinerary_sessions',
    'itinerary_items',
    'tourism_inquiries',
    'newsletter_subscribers'
  );

-- 8. Verify CMS audit columns were added to public tables.
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'businesses',
    'products',
    'promotions',
    'events',
    'destinations',
    'map_locations',
    'museum_artifacts',
    'media_assets'
  )
  AND column_name IN (
    'created_by',
    'updated_by',
    'published_by',
    'archived_by',
    'uploaded_by'
  )
ORDER BY table_name, column_name;

-- 9. Verify auth_sessions stores refresh_token_hash, not a raw refresh token column.
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'auth_sessions'
  AND column_name IN ('refresh_token_hash', 'refresh_token', 'token');

-- 10. Verify media_assets extension columns exist.
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'media_assets'
  AND column_name IN (
    'uploaded_by',
    'storage_provider',
    'storage_key',
    'file_size_bytes',
    'checksum_sha256'
  )
ORDER BY column_name;

-- 11. Verify key CMS enum types exist.
SELECT
  typname AS enum_type
FROM pg_type
WHERE typname IN (
  'user_status',
  'auth_session_status',
  'audit_action_type',
  'cms_entity_type',
  'inquiry_response_status',
  'media_storage_provider'
)
ORDER BY typname;

-- 12. Verify important indexes exist.
SELECT
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'ux_users_email_lower',
    'ux_auth_sessions_refresh_token_hash',
    'idx_content_audit_logs_entity',
    'idx_content_versions_entity',
    'idx_inquiry_responses_inquiry_id',
    'idx_media_assets_storage_provider'
  )
ORDER BY indexname;

