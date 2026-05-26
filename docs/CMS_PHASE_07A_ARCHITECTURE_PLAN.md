# CMS Phase 07A Architecture Plan

Project: CaliTourSys / CallTourSys
Phase: 07A - CMS Planning, Scope Boundary, and Architecture Design
Scope: CMS planning only, no implementation

## Executive Summary

The public-facing website is now treated as frozen and stable. The CMS phase should add a separate authenticated staff workspace for managing the content that already powers the public website.

The CMS must not be mixed into the public `/promotion` frontend routes or `/api/v1/public` backend routes. It should use a separate Vue module, separate layout, separate API route group, and explicit authentication/authorization controls.

Recommended route boundaries:

- Public website: `/promotion/...`
- CMS frontend: `/cms/...`
- Auth API: `/api/v1/auth/...`
- CMS API: `/api/v1/cms/...`
- Public API: `/api/v1/public/...`

## CMS Purpose

The CMS exists to let authorized LGU tourism staff manage public website content safely:

- Create, edit, publish, and archive promotions.
- Manage event calendar content.
- Manage OTOP products and producer/business profiles.
- Manage tourist destinations and public map locations.
- Manage museum artifacts.
- Upload and manage public media.
- View and triage public inquiries.
- View newsletter subscribers.
- Track who changed content and when.

## CMS Users And Roles

Initial production roles:

- System Administrator
- Tourism Officer
- Tourism Staff
- Content Editor
- Viewer/Read-only Staff

Role behavior should be enforced by backend RBAC. The frontend should hide unavailable controls for usability, but the backend must remain the source of authorization.

## CMS Module List

Core modules for first CMS implementation:

- Login and session management
- Dashboard overview
- Promotions management
- Events management
- Products / OTOP management
- Businesses / producers management
- Destinations management
- Map locations management
- Museum artifacts management
- Media library
- Tourism inquiries
- Newsletter subscribers
- Audit logs
- User and role management for administrators

## CMS Route Structure

Recommended frontend routes:

- `/cms/login`
- `/cms/dashboard`
- `/cms/promotions`
- `/cms/promotions/new`
- `/cms/promotions/:id/edit`
- `/cms/events`
- `/cms/events/new`
- `/cms/events/:id/edit`
- `/cms/products`
- `/cms/products/new`
- `/cms/products/:id/edit`
- `/cms/businesses`
- `/cms/businesses/new`
- `/cms/businesses/:id/edit`
- `/cms/destinations`
- `/cms/destinations/new`
- `/cms/destinations/:id/edit`
- `/cms/map-locations`
- `/cms/map-locations/new`
- `/cms/map-locations/:id/edit`
- `/cms/museum`
- `/cms/museum/new`
- `/cms/museum/:id/edit`
- `/cms/media`
- `/cms/inquiries`
- `/cms/newsletter`
- `/cms/audit-logs`
- `/cms/users`

The CMS should use a dedicated `frontend/src/modules/cms/` module with its own routes, views, components, services, and layout.

## CMS Backend Architecture

Recommended backend module layout:

```text
backend/src/modules/auth/
backend/src/modules/cms/
backend/src/modules/cms/promotions/
backend/src/modules/cms/events/
backend/src/modules/cms/products/
backend/src/modules/cms/destinations/
backend/src/modules/cms/mapLocations/
backend/src/modules/cms/museum/
backend/src/modules/cms/media/
backend/src/modules/cms/inquiries/
backend/src/modules/cms/newsletter/
backend/src/modules/cms/auditLogs/
```

Recommended backend layering:

- routes: Express route registration
- validators: Zod request validation
- controllers: request/response orchestration
- services: business rules, authorization checks, audit intent
- repositories: parameterized SQL only
- middleware: auth, RBAC, audit context, rate limiting

## CMS Frontend Architecture

Recommended frontend module:

```text
frontend/src/modules/cms/
  routes.js
  layouts/CmsLayout.vue
  services/cmsApi.js
  services/authApi.js
  stores/authStore.js
  stores/cmsUiStore.js
  components/
  views/
```

CMS UI should be operational and dense, not marketing-style. It should prioritize tables, filters, edit forms, preview status, publish/archive controls, and audit metadata.

## CMS Data Flow

1. Staff logs in through `/api/v1/auth/login`.
2. Backend validates credentials, applies login throttling, and issues a secure session strategy.
3. CMS frontend loads authenticated staff profile from `/api/v1/auth/me`.
4. Staff uses CMS APIs under `/api/v1/cms`.
5. CMS APIs update existing public content tables.
6. Public APIs continue to read only `published` or `active` content.
7. Content changes create audit log entries.
8. Public website updates automatically based on content status and public filters.

## CMS And Public Website Relationship

The CMS manages the data that public APIs read, but it must not change the public contract casually.

Public website responsibilities:

- Public browsing
- Anonymous itinerary
- Inquiry submission
- Newsletter submission
- Map discovery

CMS responsibilities:

- Authenticated content management
- Content status changes
- Media upload and association
- Inquiry triage
- Newsletter list viewing
- Audit history

## Security Model

Required controls:

- Password hashing with bcrypt or argon2.
- Login rate limiting.
- Account lockout or throttling after repeated failed attempts.
- JWT or secure session strategy.
- Refresh token or session invalidation strategy.
- RBAC middleware for every CMS route.
- Request validation with Zod or Joi.
- SQL parameterization only.
- CSRF protection if cookie-based auth is used.
- Secure CORS allowlist.
- No draft content exposed by public APIs.
- No stack traces in production responses.
- Environment validation for auth secrets, token lifetimes, CORS, upload limits, and storage paths.

Recommended auth strategy:

- Short-lived access token plus refresh token rotation, or secure httpOnly cookie sessions.
- If using cookies, include sameSite, secure, httpOnly flags and CSRF strategy.
- Store refresh token hashes, not raw refresh tokens.

## Audit And Logging Strategy

Audit log every significant CMS write action:

- create
- update
- publish
- archive
- delete/soft-delete
- media upload
- login success/failure
- role or permission changes
- inquiry status changes

Audit logs should capture:

- actor user ID
- action
- entity type
- entity ID
- before/after summary where practical
- request ID
- IP/user agent if safe
- timestamp

Do not store passwords, raw tokens, or sensitive secrets in audit logs.

## Media Management Strategy

CMS media should manage public image assets through `media_assets` or an extension table.

Required controls:

- File type allowlist.
- File size limits.
- Image dimension validation where practical.
- Alt text required for public images.
- Storage path or object key tracking.
- Media status: active/archived.
- Uploader user ID.
- Virus/malware scanning if deployment environment supports it.

The public website should continue to tolerate missing images with fallbacks.

## Content Publishing Strategy

Existing public tables already include status fields and publish/archive timestamps. CMS should use those fields instead of inventing separate public visibility rules.

Initial status model:

- draft: editable, not public
- published: public if date rules allow
- archived: hidden from public

Recommended safeguards:

- Preview drafts only inside CMS.
- Require publish permission for status changes to `published`.
- Require archive permission for destructive visibility changes.
- Keep public APIs filtering to published/active content.

## What Must Not Affect The Public Website

- Do not move public Vue routes.
- Do not alter public API response shapes without versioning.
- Do not require login for public website actions.
- Do not expose draft or archived content publicly.
- Do not mix CMS navigation into public pages.
- Do not add workflow-only fields to public read models unless intentionally mapped.
- Do not change public Mapbox behavior while building CMS map management.

## Suggested Implementation Phases

### Phase 07B - Auth And RBAC Database Design

Plan and create migrations for users, roles, permissions, sessions/tokens, staff profiles, and audit logs.

### Phase 07C - Auth API Foundation

Implement login, logout, refresh, me, password hashing, login throttling, and auth middleware.

### Phase 07D - CMS Shell Frontend

Create `/cms/login`, protected CMS layout, dashboard shell, auth store, and route guards.

### Phase 07E - Content CRUD APIs

Implement CMS CRUD for promotions, events, products, destinations, businesses, map locations, museum artifacts, and media.

### Phase 07F - CMS Content UI

Implement tables, filters, forms, publish/archive controls, media picker, and validation states.

### Phase 07G - Inquiries And Newsletter

Implement inquiry list/status management, response preparation, and newsletter subscriber list management.

### Phase 07H - CMS QA And Hardening

Run role-based tests, API contract tests, security checks, accessibility review, and production readiness review.

## Open Decisions Before Implementation

- JWT vs secure cookie sessions.
- Local disk storage vs object storage for media.
- Whether content versioning is required in first CMS release.
- Whether inquiry responses will send email now or only prepare internal response records.
- Exact production role assignments for LGU staff.
