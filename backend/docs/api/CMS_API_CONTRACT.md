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

Foundation permissions:

| Endpoint | Permission |
|---|---|
| `GET /cms/health` | `dashboard.view` |
| `GET /cms/dashboard` | `dashboard.view` |
| `GET /cms/navigation` | Authenticated user only |
| `GET /cms/audit-logs` | `audit_logs.view` |

Phase 07E-1 content permissions:

| Endpoint Group | Permission |
|---|---|
| `GET /cms/promotions`, `GET /cms/promotions/:id` | `promotions.view` |
| `POST /cms/promotions` | `promotions.create` |
| `PATCH /cms/promotions/:id` | `promotions.update` |
| `PATCH /cms/promotions/:id/publish` | `promotions.publish` |
| `PATCH /cms/promotions/:id/archive` | `promotions.archive` |
| `GET /cms/events`, `GET /cms/events/:id` | `events.view` |
| `POST /cms/events` | `events.create` |
| `PATCH /cms/events/:id` | `events.update` |
| `PATCH /cms/events/:id/publish` | `events.publish` |
| `PATCH /cms/events/:id/archive` | `events.archive` |
| `GET /cms/event-categories` | `events.view` |
| `POST/PATCH /cms/event-categories` | `events.update` |
| `GET /cms/product-categories` | `products.view` |
| `POST/PATCH /cms/product-categories` | `products.update` |
| `GET /cms/destination-categories` | `destinations.view` |
| `POST/PATCH /cms/destination-categories` | `destinations.update` |
| `GET /cms/museum/categories` | `museum.view` |
| `POST/PATCH /cms/museum/categories` | `museum.update` |

Dedicated category permissions do not exist yet. Category routes therefore use the closest existing content-module permissions and should be split later only if the role matrix requires finer control.

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

## 11. Implemented Endpoints in Phase 07E-1

### Promotions

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/promotions` | Paginated CMS promotion list. |
| `POST` | `/api/v1/cms/promotions` | Create promotion draft or authorized status. |
| `GET` | `/api/v1/cms/promotions/:id` | Get one promotion by UUID. |
| `PATCH` | `/api/v1/cms/promotions/:id` | Update promotion metadata/content. |
| `PATCH` | `/api/v1/cms/promotions/:id/publish` | Publish promotion and set `published_at`/`published_by`. |
| `PATCH` | `/api/v1/cms/promotions/:id/archive` | Archive promotion and set `archived_at`/`archived_by`. |

Promotion list query params:

- `page`
- `limit`
- `search`
- `status`
- `featured`
- `sort`: `createdAt`, `-createdAt`, `updatedAt`, `-updatedAt`, `title`, `-title`, `status`

Create/update body:

```json
{
  "slug": "summer-tourism-campaign",
  "title": "Summer Tourism Campaign",
  "summary": "Short summary.",
  "description": "Long description.",
  "promotionType": "campaign",
  "accentColor": "#174A35",
  "startsAt": "2026-06-01T00:00:00.000Z",
  "endsAt": "2026-06-30T23:59:59.000Z",
  "status": "draft",
  "isFeatured": false
}
```

### Events

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/events` | Paginated CMS event list. |
| `POST` | `/api/v1/cms/events` | Create event draft or authorized status. |
| `GET` | `/api/v1/cms/events/:id` | Get one event by UUID. |
| `PATCH` | `/api/v1/cms/events/:id` | Update event metadata/content. |
| `PATCH` | `/api/v1/cms/events/:id/publish` | Publish event and set `published_at`/`published_by`. |
| `PATCH` | `/api/v1/cms/events/:id/archive` | Archive event and set `archived_at`/`archived_by`. |

Event list query params:

- `page`
- `limit`
- `search`
- `status`
- `featured`
- `sort`: `createdAt`, `-createdAt`, `updatedAt`, `-updatedAt`, `title`, `-title`, `status`, `startsAt`, `-startsAt`

Create/update body:

```json
{
  "categoryId": "uuid",
  "slug": "calabanga-tourism-event",
  "title": "Calabanga Tourism Event",
  "shortDescription": "Short event copy.",
  "description": "Long event copy.",
  "venueName": "Town Plaza",
  "organizerName": "Tourism Office",
  "contactInfo": "tourism@example.test",
  "addressLine": "Calabanga",
  "barangay": "Poblacion",
  "startsAt": "2026-06-24T08:00:00.000Z",
  "endsAt": "2026-06-24T17:00:00.000Z",
  "accentColor": "#174A35",
  "status": "draft",
  "isFeatured": false
}
```

### Categories

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/event-categories` | Paginated event categories. |
| `POST` | `/api/v1/cms/event-categories` | Create event category. |
| `PATCH` | `/api/v1/cms/event-categories/:id` | Update event category. |
| `GET` | `/api/v1/cms/product-categories` | Paginated product categories. |
| `POST` | `/api/v1/cms/product-categories` | Create product category. |
| `PATCH` | `/api/v1/cms/product-categories/:id` | Update product category. |
| `GET` | `/api/v1/cms/destination-categories` | Paginated destination categories. |
| `POST` | `/api/v1/cms/destination-categories` | Create destination category. |
| `PATCH` | `/api/v1/cms/destination-categories/:id` | Update destination category. |
| `GET` | `/api/v1/cms/museum/categories` | Paginated museum artifact categories. |
| `POST` | `/api/v1/cms/museum/categories` | Create museum artifact category. |
| `PATCH` | `/api/v1/cms/museum/categories/:id` | Update museum artifact category. |

Category list query params:

- `page`
- `limit`
- `search`
- `status`
- `sort`: `displayOrder`, `-displayOrder`, `createdAt`, `-createdAt`, `updatedAt`, `-updatedAt`, `name`, `-name`, `status`

Create/update body:

```json
{
  "slug": "festival",
  "name": "Festival",
  "description": "Public grouping label.",
  "displayOrder": 0,
  "status": "published",
  "color": "#174A35"
}
```

`color` is only stored for destination categories in the current database schema.

### Audit Behavior

Phase 07E-1 writes `content_audit_logs` for `create`, `update`, `publish`, and `archive`.

Category audit rows use the closest existing `cms_entity_type` because the enum does not contain separate category entity types:

- event categories: `event`
- product categories: `product`
- destination categories: `destination`
- museum categories: `museum_artifact`

## 12. Planned Endpoints for Later Phases

Dashboard:

- `GET /api/v1/cms/dashboard`

Promotions:

- Phase 07E-1 implemented.

Events:

- Phase 07E-1 implemented.

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
