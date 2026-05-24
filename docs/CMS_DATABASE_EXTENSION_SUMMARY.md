# CMS Database Extension Summary

Project: CaliTourSys / CallTourSys  
Phase: 07B - CMS Database Extension  
Scope: CMS foundation only, after the frozen Public Facing Website

## What Was Added

This phase adds the database foundation for the future CMS without changing the public website behavior. It introduces authentication identities, role-based access control, session tracking, audit logging, content versioning, inquiry response records, notification logs, and CMS ownership metadata on selected public tables.

Generated files:

- `backend/database/migrations/002_cms_foundation_schema.sql`
- `backend/database/seeds/002_cms_roles_permissions_seed.sql`
- `backend/database/VERIFY_CMS_SCHEMA.sql`
- `docs/CMS_DATABASE_EXTENSION_SUMMARY.md`

## Why It Was Added

The public website currently displays published public records. The CMS phase needs a secure foundation for staff/admin users to manage those records later. This migration prepares the database for:

- Staff login and account status.
- Role-based access control.
- Secure refresh/session tracking.
- CMS audit logs for content and security events.
- Content snapshots before major changes.
- Public inquiry response preparation.
- Media upload ownership and storage metadata.
- Future CMS management of public website content.

## CMS Tables Created

- `users`: CMS authentication identity with hashed passwords only.
- `roles`: system roles such as System Administrator and Tourism Officer.
- `permissions`: granular permission keys.
- `user_roles`: user-to-role mapping.
- `role_permissions`: role-to-permission mapping.
- `staff_profiles`: staff profile details separated from credentials.
- `auth_sessions`: refresh/session tracking with hashed refresh tokens only.
- `content_audit_logs`: audit trail for CMS actions and security events.
- `content_versions`: optional JSON snapshots for content versioning.
- `inquiry_responses`: staff response records for public inquiries.
- `notification_logs`: future-ready notification/email log.

## Existing Public Tables Extended

Nullable CMS audit columns were added to:

- `businesses`
- `products`
- `promotions`
- `events`
- `destinations`
- `map_locations`
- `museum_artifacts`
- `media_assets`

Common added columns:

- `created_by`
- `updated_by`

Added where the table supports publishing/archiving:

- `published_by`
- `archived_by`

Additional media metadata added to `media_assets`:

- `uploaded_by`
- `storage_provider`
- `storage_key`
- `file_size_bytes`
- `checksum_sha256`

All added user-reference columns are nullable and use `ON DELETE SET NULL` so deleting a CMS user does not delete public content.

## Enums Added

- `user_status`
- `auth_session_status`
- `audit_action_type`
- `cms_entity_type`
- `inquiry_response_status`
- `media_storage_provider`

Enums are created using safe `DO` blocks so development reruns do not fail when types already exist.

## Seeded Roles

The role/permission seed creates only system roles and permissions:

- `system_admin`
- `tourism_officer`
- `tourism_staff`
- `content_editor`
- `read_only_staff`

No users are seeded.

## Seeded Permissions

Permission groups include:

- Dashboard access
- Promotions
- Events
- Products
- Destinations
- Businesses
- Map locations
- Museum artifacts
- Media
- Inquiries
- Newsletter subscribers
- Users
- Roles
- Audit logs
- Reports

The seed is rerunnable and uses fixed UUIDs for roles and permissions.

## Security Decisions

- No plaintext passwords are stored.
- No default admin user is seeded.
- No raw refresh token is stored; `auth_sessions` stores `refresh_token_hash`.
- Account lifecycle fields support active, inactive, locked, and pending users.
- Failed login count and locked-until fields support throttling/lockout.
- Audit logs preserve actor, action, entity, before/after values, IP address, user agent, request ID, and timestamp.
- CMS user references on public content are nullable and preserve content if a staff user is removed.
- Media storage metadata does not store provider secrets.

## What Was Intentionally Not Added

This phase does not add:

- Default admin accounts
- Seed users
- Passwords or password reset tokens
- CMS backend API code
- CMS frontend code
- Approval workflow tables
- Full accreditation workflow tables
- Business owner portal tables
- Product submission portal tables
- Analytics event tables
- PostGIS
- Mapbox frontend changes

## How To Run

From PostgreSQL, pgAdmin, or `psql`, run in this order:

1. Public schema, if not already applied:

```sql
\i backend/database/migrations/001_public_website_schema.sql
```

2. CMS foundation migration:

```sql
\i backend/database/migrations/002_cms_foundation_schema.sql
```

3. CMS roles and permissions seed:

```sql
\i backend/database/seeds/002_cms_roles_permissions_seed.sql
```

4. CMS verification:

```sql
\i backend/database/VERIFY_CMS_SCHEMA.sql
```

In pgAdmin, open each SQL file in the Query Tool and execute them in the same order.

## Rollback Considerations

This migration is additive. A rollback should be planned carefully because the CMS tables may later contain authentication, audit, and content ownership data.

Development rollback can drop the new CMS tables and remove the added nullable audit columns, but production rollback should:

- Preserve `content_audit_logs`.
- Export or archive `auth_sessions` and `users` if compliance requires it.
- Avoid deleting public website records.
- Prefer a forward migration over destructive rollback once CMS is live.

## Next Phase Recommendation

Before Phase 07C backend auth implementation:

- Review role-permission assignments with the project owner/professor.
- Confirm password hashing choice: bcrypt or argon2.
- Confirm JWT plus refresh-token strategy or cookie session strategy.
- Confirm login rate limit and lockout policy.
- Confirm first-admin creation process.
- Confirm whether media storage starts local or external.

