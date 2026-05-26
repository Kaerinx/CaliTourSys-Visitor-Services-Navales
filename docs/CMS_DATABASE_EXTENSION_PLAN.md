# CMS Database Extension Plan

Project: CaliTourSys / CallTourSys
Phase: 07A - Planning only
Database: PostgreSQL

## Purpose

This document plans the database extensions required for the CMS phase. It does not define SQL yet.

The existing public website schema remains the foundation for public content. CMS tables should extend authentication, authorization, auditing, sessions, and staff-only workflows without breaking public read behavior.

## Existing Public Tables Managed By CMS

CMS will manage these existing public tables:

- `promotions`
- `promotion_items`
- `events`
- `event_categories`
- `event_images`
- `products`
- `product_categories`
- `product_images`
- `product_tags`
- `businesses`
- `business_contacts`
- `business_accreditations` for public display status only
- `destinations`
- `destination_categories`
- `destination_images`
- `map_locations`
- `museum_artifacts`
- `artifact_categories`
- `artifact_images`
- `media_assets`
- `tourism_inquiries`
- `newsletter_subscribers`

CMS should use the existing status fields:

- `content_status`: draft, published, archived
- `business_status`: active, inactive, archived
- `media_status`: active, archived
- `inquiry_status`: new, read, responded, archived
- `subscription_status`: subscribed, unsubscribed, bounced

## Proposed New Tables

### users

Purpose: authenticated CMS staff accounts.

Suggested fields:

- `id uuid primary key`
- `email varchar unique not null`
- `password_hash text not null`
- `display_name varchar not null`
- `status varchar not null`
- `last_login_at timestamptz`
- `failed_login_count integer`
- `locked_until timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Notes:

- Store password hashes only.
- Use bcrypt or argon2.
- Do not store raw passwords or reset tokens.

### roles

Purpose: named CMS roles.

Suggested fields:

- `id uuid primary key`
- `slug varchar unique not null`
- `name varchar not null`
- `description text`
- `is_system boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

### permissions

Purpose: explicit permission keys for RBAC.

Suggested fields:

- `id uuid primary key`
- `key varchar unique not null`
- `description text`
- `created_at timestamptz`

### user_roles

Purpose: many-to-many mapping between users and roles.

Suggested fields:

- `user_id uuid references users(id)`
- `role_id uuid references roles(id)`
- `assigned_by uuid references users(id)`
- `assigned_at timestamptz`

Primary key:

- `(user_id, role_id)`

### role_permissions

Purpose: many-to-many mapping between roles and permissions.

Suggested fields:

- `role_id uuid references roles(id)`
- `permission_id uuid references permissions(id)`
- `created_at timestamptz`

Primary key:

- `(role_id, permission_id)`

### staff_profiles

Purpose: staff metadata separate from authentication.

Suggested fields:

- `id uuid primary key`
- `user_id uuid unique references users(id)`
- `position_title varchar`
- `department varchar`
- `contact_number varchar`
- `created_at timestamptz`
- `updated_at timestamptz`

### cms_sessions or refresh_tokens

Purpose: session invalidation and refresh token tracking.

Suggested fields:

- `id uuid primary key`
- `user_id uuid references users(id)`
- `token_hash text not null`
- `expires_at timestamptz not null`
- `revoked_at timestamptz`
- `replaced_by_token_id uuid nullable`
- `ip_address inet nullable`
- `user_agent text nullable`
- `created_at timestamptz`

Notes:

- Store token hashes only.
- Support logout and refresh token rotation.

### content_audit_logs

Purpose: immutable audit trail for CMS actions.

Suggested fields:

- `id uuid primary key`
- `actor_user_id uuid references users(id)`
- `action varchar not null`
- `entity_type varchar not null`
- `entity_id uuid nullable`
- `before_data jsonb nullable`
- `after_data jsonb nullable`
- `request_id varchar nullable`
- `ip_address inet nullable`
- `user_agent text nullable`
- `created_at timestamptz`

Notes:

- Avoid storing secrets.
- Consider append-only permissions.

### media_uploads or media_asset_extensions

Purpose: extend `media_assets` for CMS upload metadata if existing fields are insufficient.

Option A: extend `media_assets`.

Possible additions:

- `uploaded_by uuid references users(id)`
- `storage_provider varchar`
- `storage_key text`
- `mime_type varchar`
- `file_size_bytes bigint`
- `width integer`
- `height integer`

Option B: create `media_uploads`.

Use if upload metadata should remain separate from public media display records.

### inquiry_responses

Purpose: internal staff response preparation for public inquiries.

Suggested fields:

- `id uuid primary key`
- `inquiry_id uuid references tourism_inquiries(id)`
- `responder_user_id uuid references users(id)`
- `response_body text not null`
- `response_status varchar not null`
- `responded_at timestamptz nullable`
- `created_at timestamptz`
- `updated_at timestamptz`

Notes:

- First CMS release may prepare responses without sending email.
- Email delivery can be a later phase.

### content_versions optional

Purpose: version snapshots for content rollback or review.

Suggested fields:

- `id uuid primary key`
- `entity_type varchar not null`
- `entity_id uuid not null`
- `version_number integer not null`
- `snapshot jsonb not null`
- `created_by uuid references users(id)`
- `created_at timestamptz`

Recommendation:

- Optional for first CMS release. Audit logs may be enough initially.

### notification_logs optional

Purpose: record email/SMS/system notifications.

Suggested fields:

- `id uuid primary key`
- `recipient text`
- `channel varchar`
- `subject varchar`
- `status varchar`
- `provider_message_id varchar`
- `error_message text`
- `created_at timestamptz`

Recommendation:

- Postpone until notification delivery exists.

## Foreign Key Strategy

- Auth tables should reference `users(id)` for created/updated/assigned actions.
- Public content tables may later receive `created_by` and `updated_by` fields referencing `users(id)`.
- Audit logs should reference `users(id)` but tolerate retained logs if users are deactivated.
- Session/refresh token rows should cascade or be revoked when users are disabled, based on security policy.

## Audit Fields

For CMS-managed content, consider adding:

- `created_by uuid references users(id)`
- `updated_by uuid references users(id)`
- `published_by uuid references users(id)`
- `archived_by uuid references users(id)`

Existing `created_at` and `updated_at` fields should remain.

## Soft Delete / Archive Strategy

Public content should generally use archive statuses, not hard deletes:

- Products/events/destinations/promotions/artifacts: set `status = archived`.
- Businesses: set `status = archived` or inactive.
- Media: set `status = archived`.
- Inquiries: set `status = archived`.

Hard delete should be restricted to System Administrator and only for safe child records or mistaken draft records.

## Approval Fields If Postponed

Do not add full approval workflow tables in the first CMS migration unless required.

If lightweight placeholders are needed later, prefer separate workflow tables over adding many nullable workflow columns to every content table.

Postponed future tables may include:

- `content_reviews`
- `approval_requests`
- `approval_steps`
- `product_applications`
- `accreditation_applications`
- `accreditation_documents`

## Migration Risks

- Adding non-null user references to existing public tables with data requires backfill.
- Role/permission seed data must be deterministic and repeatable.
- Introducing auth tables must not expose public registration endpoints.
- Media upload metadata must match the chosen storage provider.
- Audit logging can grow quickly and needs indexing by entity, actor, and timestamp.
- Public API queries must continue to filter draft/archived content after CMS starts writing drafts.

## Recommended Phase 07B Output

Phase 07B should create a detailed SQL migration plan for:

- auth/RBAC tables
- staff profiles
- refresh token/session table
- audit log table
- inquiry response table
- optional media metadata extension
- deterministic initial roles and permissions strategy

No SQL should be generated until these decisions are approved.
