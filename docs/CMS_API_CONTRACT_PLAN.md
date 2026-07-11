# CMS API Contract Plan

Project: CaliTourSys / CallTourSys
Phase: 07A - Planning only
Base path: `/api/v1`

## Purpose

This document plans future authenticated CMS and auth APIs. It does not implement endpoints.

Public APIs remain under `/api/v1/public/...`. CMS APIs must not be merged into public APIs.

## API Namespaces

- Auth: `/api/v1/auth/...`
- CMS: `/api/v1/cms/...`
- Public: `/api/v1/public/...`

## Standard Response Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "string",
    "timestamp": "ISO-8601 string"
  }
}
```

Paginated success:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "requestId": "string",
    "timestamp": "ISO-8601 string",
    "pagination": {
      "page": 1,
      "limit": 25,
      "totalItems": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message.",
    "details": []
  },
  "meta": {
    "requestId": "string",
    "timestamp": "ISO-8601 string"
  }
}
```

## Auth Endpoints

Planned endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### POST `/api/v1/auth/login`

Purpose: authenticate CMS staff.

Expected request:

```json
{
  "email": "staff@example.gov.ph",
  "password": "string"
}
```

Expected behavior:

- Validate email and password shape.
- Apply login rate limiting.
- Check account status and lockout state.
- Verify password hash using bcrypt or argon2.
- Return access token/session and staff profile.
- Create audit log for success/failure without storing password.

### POST `/api/v1/auth/logout`

Purpose: revoke current session or refresh token.

### POST `/api/v1/auth/refresh`

Purpose: rotate refresh token or renew secure session.

### GET `/api/v1/auth/me`

Purpose: return current authenticated user, roles, and permissions.

## CMS Endpoint Groups

All CMS endpoints require authentication.

### Dashboard

- `GET /api/v1/cms/dashboard`

Returns counts and operational summaries:

- draft content counts
- published content counts
- new inquiries
- upcoming events
- recent audit activity
- media count

### Promotions

- `GET /api/v1/cms/promotions`
- `POST /api/v1/cms/promotions`
- `GET /api/v1/cms/promotions/:id`
- `PATCH /api/v1/cms/promotions/:id`
- `DELETE /api/v1/cms/promotions/:id` or `PATCH /api/v1/cms/promotions/:id/archive`
- `POST /api/v1/cms/promotions/:id/publish`

### Events

- `GET /api/v1/cms/events`
- `POST /api/v1/cms/events`
- `GET /api/v1/cms/events/:id`
- `PATCH /api/v1/cms/events/:id`
- `PATCH /api/v1/cms/events/:id/archive`
- `POST /api/v1/cms/events/:id/publish`

### Products

- `GET /api/v1/cms/products`
- `POST /api/v1/cms/products`
- `GET /api/v1/cms/products/:id`
- `PATCH /api/v1/cms/products/:id`
- `PATCH /api/v1/cms/products/:id/archive`
- `POST /api/v1/cms/products/:id/publish`
- `POST /api/v1/cms/products/:id/images`
- `DELETE /api/v1/cms/products/:id/images/:imageId`

### Businesses / Producers

- `GET /api/v1/cms/businesses`
- `POST /api/v1/cms/businesses`
- `GET /api/v1/cms/businesses/:id`
- `PATCH /api/v1/cms/businesses/:id`
- `PATCH /api/v1/cms/businesses/:id/archive`
- `POST /api/v1/cms/businesses/:id/contacts`
- `PATCH /api/v1/cms/businesses/:id/contacts/:contactId`

### Destinations

- `GET /api/v1/cms/destinations`
- `POST /api/v1/cms/destinations`
- `GET /api/v1/cms/destinations/:id`
- `PATCH /api/v1/cms/destinations/:id`
- `PATCH /api/v1/cms/destinations/:id/archive`
- `POST /api/v1/cms/destinations/:id/publish`

### Map Locations

- `GET /api/v1/cms/map-locations`
- `POST /api/v1/cms/map-locations`
- `GET /api/v1/cms/map-locations/:id`
- `PATCH /api/v1/cms/map-locations/:id`
- `PATCH /api/v1/cms/map-locations/:id/archive`

Map location validation:

- latitude must be between -90 and 90
- longitude must be between -180 and 180
- location type must match one linked target
- no PostGIS required in this phase

### Museum Artifacts

- `GET /api/v1/cms/museum/artifacts`
- `POST /api/v1/cms/museum/artifacts`
- `GET /api/v1/cms/museum/artifacts/:id`
- `PATCH /api/v1/cms/museum/artifacts/:id`
- `PATCH /api/v1/cms/museum/artifacts/:id/archive`
- `POST /api/v1/cms/museum/artifacts/:id/publish`

### Media

- `GET /api/v1/cms/media`
- `POST /api/v1/cms/media`
- `GET /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id/archive`

Upload handling:

- Use multipart upload endpoint.
- Enforce file type allowlist.
- Enforce file size limits.
- Require alt text for public images.
- Store files outside source code.
- Store metadata in database.

### Inquiries

- `GET /api/v1/cms/inquiries`
- `GET /api/v1/cms/inquiries/:id`
- `PATCH /api/v1/cms/inquiries/:id/status`
- `POST /api/v1/cms/inquiries/:id/responses`

First CMS release may store response drafts without sending email.

### Newsletter Subscribers

- `GET /api/v1/cms/newsletter-subscribers`
- `PATCH /api/v1/cms/newsletter-subscribers/:id/status`

### Audit Logs

- `GET /api/v1/cms/audit-logs`

Filters:

- actor
- action
- entity type
- entity ID
- from/to timestamps

### Users And Roles

- `GET /api/v1/cms/users`
- `POST /api/v1/cms/users`
- `GET /api/v1/cms/users/:id`
- `PATCH /api/v1/cms/users/:id`
- `PATCH /api/v1/cms/users/:id/status`
- `GET /api/v1/cms/roles`
- `PATCH /api/v1/cms/users/:id/roles`

System Administrator only.

## Authentication Expectations

- All `/api/v1/cms` endpoints require authentication.
- Auth state should be checked with `/api/v1/auth/me`.
- Passwords must be hashed with bcrypt or argon2.
- Access tokens should be short-lived.
- Refresh tokens or sessions must be revocable.
- Logout must invalidate active refresh token/session.
- Login attempts must be rate limited.

## Authorization Expectations

- Every CMS route requires explicit permission checks.
- Publish/archive permissions are separate from edit permissions.
- Read-only roles cannot write even if frontend controls are manipulated.
- Audit log access is restricted.
- User and role management is System Administrator only.

## Validation Expectations

- Use Zod or Joi.
- Reject unknown fields for write operations.
- Validate UUID params.
- Validate slug format.
- Validate date ranges.
- Validate status transitions.
- Validate map coordinates.
- Validate upload MIME type and size.
- Validate required public fields before publish.

## Pagination And Query Conventions

Common query params:

- `page`
- `limit`
- `search`
- `status`
- `category`
- `sort`
- `from`
- `to`

Default page size:

- CMS tables: 25
- Maximum page size: 100

Sort values should be allowlisted per endpoint.

## Audit Logging

CMS write actions should create audit log entries:

- create
- update
- publish
- archive
- media upload
- inquiry status change
- user role change
- login success/failure

Audit logs must include request ID and actor ID where available.

## Rate Limiting

Recommended starting limits:

- Login: strict, for example 5 attempts per IP/email per 15 minutes.
- Refresh: moderate.
- CMS writes: moderate per authenticated user.
- Media upload: stricter due to file size.

## Security Considerations

- Use Helmet/security headers.
- Use CORS allowlist.
- Use request body size limits.
- Use upload size limits.
- Use CSRF protection if cookies are used.
- Use parameterized SQL only.
- Do not expose stack traces.
- Do not expose password hashes, token hashes, or internal secrets.
- Do not expose draft content through public APIs.
- Keep public, CMS, and auth route groups separate.

## Planned OpenAPI Work

After approval, create:

- `backend/docs/api/CMS_API_CONTRACT.md`
- `backend/docs/api/openapi.cms.yaml`
- `backend/docs/api/AUTH_API_CONTRACT.md`

Do not implement runtime routes until the contract and database extension plan are approved.
