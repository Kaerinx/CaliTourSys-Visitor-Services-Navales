# CMS API Contract

Project: CaliTourSys / CallTourSys  
Phase: 07D - CMS API Contract and Protected Route Foundation  
Base path: `/api/v1/cms`

The CMS API is separate from the public website API. Public website routes remain under `/api/v1/public`, and authentication routes remain under `/api/v1/auth`.

## 1. API Overview

The CMS API supports authenticated tourism office operations. Phase 07D implements only protected foundation endpoints:

- CMS health/readiness
- CMS dashboard summary
- Permission-filtered CMS navigation
- Safe audit log list

Full CMS CRUD is planned for later phases.

## 2. Base Path

```text
/api/v1/cms
```

Development server:

```text
http://localhost:5000/api/v1
```

## 3. Authentication Requirements

All `/api/v1/cms/...` routes require:

```text
Authorization: Bearer <accessToken>
```

The access token is issued by `POST /api/v1/auth/login`.

## 4. Authorization/RBAC Requirements

CMS routes use:

- `authenticate`
- `authorize("permission.key")`

Phase 07D permissions:

| Endpoint | Permission |
|---|---|
| `GET /cms/health` | `dashboard.view` |
| `GET /cms/dashboard` | `dashboard.view` |
| `GET /cms/navigation` | Authenticated user only |
| `GET /cms/audit-logs` | `audit_logs.view` |

## 5. Standard Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "string",
    "timestamp": "ISO string"
  }
}
```

## 6. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "string",
    "details": []
  },
  "meta": {
    "requestId": "string",
    "timestamp": "ISO string"
  }
}
```

Common CMS error codes:

- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `TOKEN_EXPIRED`
- `ACCOUNT_INACTIVE`
- `ACCOUNT_LOCKED`
- `INTERNAL_ERROR`

## 7. Pagination Conventions

Paginated CMS list endpoints use:

| Param | Default | Max |
|---|---:|---:|
| `page` | `1` | n/a |
| `limit` | `20` | `100` |

Paginated response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "requestId": "string",
    "timestamp": "ISO string",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## 8. Validation Conventions

- Use Zod schemas.
- Reject invalid query params.
- UUIDs must be valid UUIDs for future detail routes.
- Enum filters must use documented values.
- Unknown request body fields should be rejected for write routes in future phases.

## 9. Security Requirements

- All CMS endpoints require authentication.
- Authorization must be permission-based.
- CMS routes must use `Cache-Control: no-store`.
- Do not expose password hashes.
- Do not expose refresh token hashes.
- Do not expose raw `auth_sessions`.
- Do not expose full `before_values` or `after_values` audit JSON in list views.
- Use parameterized SQL only.
- Use centralized error handling.
- Do not expose stack traces in production.

## 10. Implemented Endpoints in Phase 07D

### GET `/api/v1/cms/health`

Returns:

```json
{
  "status": "ok",
  "service": "CaliTourSys CMS API",
  "version": "v1",
  "authenticated": true
}
```

### GET `/api/v1/cms/dashboard`

Returns safe CMS dashboard counts:

- `totalProducts`
- `publishedProducts`
- `draftProducts`
- `totalEvents`
- `publishedEvents`
- `totalDestinations`
- `publishedDestinations`
- `totalBusinesses`
- `activeBusinesses`
- `totalMuseumArtifacts`
- `publishedMuseumArtifacts`
- `pendingInquiries`
- `newsletterSubscribers`
- `recentAuditLogs`

### GET `/api/v1/cms/navigation`

Returns navigation items filtered by current user permissions.

### GET `/api/v1/cms/audit-logs`

Query params:

- `page`
- `limit`
- `action`
- `entityType`

Returns safe fields only:

- `id`
- `action`
- `entityType`
- `entityId`
- `entityLabel`
- `actor`
- `requestId`
- `createdAt`

## 11. Planned Endpoints for Later Phases

Dashboard:

- `GET /api/v1/cms/dashboard`

Promotions:

- `GET /api/v1/cms/promotions`
- `POST /api/v1/cms/promotions`
- `GET /api/v1/cms/promotions/:id`
- `PATCH /api/v1/cms/promotions/:id`
- `PATCH /api/v1/cms/promotions/:id/publish`
- `PATCH /api/v1/cms/promotions/:id/archive`

Events:

- `GET /api/v1/cms/events`
- `POST /api/v1/cms/events`
- `GET /api/v1/cms/events/:id`
- `PATCH /api/v1/cms/events/:id`
- `PATCH /api/v1/cms/events/:id/publish`
- `PATCH /api/v1/cms/events/:id/archive`

Products:

- `GET /api/v1/cms/products`
- `POST /api/v1/cms/products`
- `GET /api/v1/cms/products/:id`
- `PATCH /api/v1/cms/products/:id`
- `PATCH /api/v1/cms/products/:id/publish`
- `PATCH /api/v1/cms/products/:id/archive`

Destinations:

- `GET /api/v1/cms/destinations`
- `POST /api/v1/cms/destinations`
- `GET /api/v1/cms/destinations/:id`
- `PATCH /api/v1/cms/destinations/:id`
- `PATCH /api/v1/cms/destinations/:id/publish`
- `PATCH /api/v1/cms/destinations/:id/archive`

Map Locations:

- `GET /api/v1/cms/map-locations`
- `POST /api/v1/cms/map-locations`
- `GET /api/v1/cms/map-locations/:id`
- `PATCH /api/v1/cms/map-locations/:id`
- `DELETE /api/v1/cms/map-locations/:id`

Museum:

- `GET /api/v1/cms/museum/artifacts`
- `POST /api/v1/cms/museum/artifacts`
- `GET /api/v1/cms/museum/artifacts/:id`
- `PATCH /api/v1/cms/museum/artifacts/:id`
- `PATCH /api/v1/cms/museum/artifacts/:id/publish`
- `PATCH /api/v1/cms/museum/artifacts/:id/archive`

Businesses:

- `GET /api/v1/cms/businesses`
- `POST /api/v1/cms/businesses`
- `GET /api/v1/cms/businesses/:id`
- `PATCH /api/v1/cms/businesses/:id`

Inquiries:

- `GET /api/v1/cms/inquiries`
- `GET /api/v1/cms/inquiries/:id`
- `PATCH /api/v1/cms/inquiries/:id/status`
- `POST /api/v1/cms/inquiries/:id/responses`

Newsletter:

- `GET /api/v1/cms/newsletter-subscribers`

Media:

- `GET /api/v1/cms/media`
- `POST /api/v1/cms/media`
- `PATCH /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id/archive`

Users and Roles:

- `GET /api/v1/cms/users`
- `POST /api/v1/cms/users`
- `PATCH /api/v1/cms/users/:id`
- `GET /api/v1/cms/roles`
- `GET /api/v1/cms/permissions`
- `PATCH /api/v1/cms/users/:id/roles`

Audit Logs:

- `GET /api/v1/cms/audit-logs`

