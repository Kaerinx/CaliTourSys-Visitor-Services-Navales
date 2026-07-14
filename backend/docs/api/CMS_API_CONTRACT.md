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

Phase 07E-2 remaining content permissions:

| Endpoint Group | Permission |
|---|---|
| `GET /cms/products`, `GET /cms/products/:id` | `products.view` |
| `POST /cms/products` | `products.create` |
| `PATCH /cms/products/:id` | `products.update` |
| `PATCH /cms/products/:id/publish` | `products.publish` |
| `PATCH /cms/products/:id/archive` | `products.archive` |
| `GET /cms/destinations`, `GET /cms/destinations/:id` | `destinations.view` |
| `POST /cms/destinations` | `destinations.create` |
| `PATCH /cms/destinations/:id` | `destinations.update` |
| `PATCH /cms/destinations/:id/publish` | `destinations.publish` |
| `PATCH /cms/destinations/:id/archive` | `destinations.archive` |
| `GET /cms/businesses`, `GET /cms/businesses/:id` | `businesses.view` |
| `POST /cms/businesses` | `businesses.create` |
| `PATCH /cms/businesses/:id` | `businesses.update` |
| `GET /cms/museum/artifacts`, `GET /cms/museum/artifacts/:id` | `museum.view` |
| `POST /cms/museum/artifacts` | `museum.create` |
| `PATCH /cms/museum/artifacts/:id` | `museum.update` |
| `PATCH /cms/museum/artifacts/:id/publish` | `museum.publish` |
| `PATCH /cms/museum/artifacts/:id/archive` | `museum.archive` |
| `GET /cms/map-locations`, `GET /cms/map-locations/:id` | `map_locations.view` |
| `POST /cms/map-locations` | `map_locations.create` |
| `PATCH /cms/map-locations/:id`, `DELETE /cms/map-locations/:id` | `map_locations.update` |
| `GET /cms/map-locations/options/experience` | `map_locations.view` |
| `PATCH /cms/map-locations/:id/experience` | `map_locations.update` |
| `GET /cms/emergency-facilities`, `GET /cms/emergency-facilities/:id` | `map_locations.view` |
| `POST /cms/emergency-facilities` | `map_locations.create` |
| `PATCH /cms/emergency-facilities/:id`, `/publish`, `/archive` | `map_locations.update` |

Phase 07E-3 operations permissions:

| Endpoint Group | Permission |
|---|---|
| `GET /cms/media`, `GET /cms/media/:id` | `media.view` |
| `POST /cms/media`, `PATCH /cms/media/:id` | `media.upload` |
| `PATCH /cms/media/:id/archive` | `media.archive` |
| `GET /cms/inquiries`, `GET /cms/inquiries/:id`, `GET /cms/inquiries/:id/responses` | `inquiries.view` |
| `PATCH /cms/inquiries/:id/status`, `POST /cms/inquiries/:id/responses` | `inquiries.respond` |
| `GET /cms/newsletter-subscribers`, `PATCH /cms/newsletter-subscribers/:id/status` | `newsletter.view` |
| `GET /cms/users`, `GET /cms/users/:id` | `users.view` |
| `PATCH /cms/users/:id/status` | `users.manage` |
| `GET /cms/roles`, `GET /cms/permissions` | `roles.view` |
| `PATCH /cms/users/:id/roles` | `users.manage` and `roles.manage` |
| `GET /cms/audit-logs`, `GET /cms/audit-logs/:id` | `audit_logs.view` |

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

## 12. Implemented Endpoints in Phase 07E-2

### Products

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/products` | Paginated CMS product list. |
| `POST` | `/api/v1/cms/products` | Create product. |
| `GET` | `/api/v1/cms/products/:id` | Get product by UUID. |
| `PATCH` | `/api/v1/cms/products/:id` | Update product. |
| `PATCH` | `/api/v1/cms/products/:id/publish` | Publish product. |
| `PATCH` | `/api/v1/cms/products/:id/archive` | Archive product. |

List filters: `page`, `limit`, `search`, `status`, `categoryId`, `businessId`, `featured`, `sort`.

### Destinations

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/destinations` | Paginated CMS destination list. |
| `POST` | `/api/v1/cms/destinations` | Create destination. |
| `GET` | `/api/v1/cms/destinations/:id` | Get destination by UUID. |
| `PATCH` | `/api/v1/cms/destinations/:id` | Update destination. |
| `PATCH` | `/api/v1/cms/destinations/:id/publish` | Publish destination. |
| `PATCH` | `/api/v1/cms/destinations/:id/archive` | Archive destination. |

List filters: `page`, `limit`, `search`, `status`, `categoryId`, `barangay`, `featured`, `sort`.

### Businesses / Producers

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/businesses` | Paginated CMS business/producer list. |
| `POST` | `/api/v1/cms/businesses` | Create business/producer profile. |
| `GET` | `/api/v1/cms/businesses/:id` | Get business by UUID. |
| `PATCH` | `/api/v1/cms/businesses/:id` | Update business profile. |

List filters: `page`, `limit`, `search`, `status`, `businessType`, `featured`, `sort`.

### Museum Artifacts

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/museum/artifacts` | Paginated CMS museum artifact list. |
| `POST` | `/api/v1/cms/museum/artifacts` | Create museum artifact. |
| `GET` | `/api/v1/cms/museum/artifacts/:id` | Get artifact by UUID. |
| `PATCH` | `/api/v1/cms/museum/artifacts/:id` | Update artifact. |
| `PATCH` | `/api/v1/cms/museum/artifacts/:id/publish` | Publish artifact. |
| `PATCH` | `/api/v1/cms/museum/artifacts/:id/archive` | Archive artifact. |

List filters: `page`, `limit`, `search`, `status`, `categoryId`, `featured`, `sort`.

### Map Locations

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/map-locations` | Paginated CMS map location list. |
| `POST` | `/api/v1/cms/map-locations` | Create map location. |
| `GET` | `/api/v1/cms/map-locations/:id` | Get map location by UUID. |
| `PATCH` | `/api/v1/cms/map-locations/:id` | Update map location. |
| `DELETE` | `/api/v1/cms/map-locations/:id` | Delete map location. |

List filters: `page`, `limit`, `search`, `status`, `locationType`, `sort`.

Map location target rules:

- `locationType = destination` requires `destinationId`
- `locationType = business` requires `businessId`
- `locationType = event` requires `eventId`
- exactly one target may be present

Phase 07E-2 writes audit logs for `create`, `update`, `publish`, `archive`, and map-location `delete`.

## 13. Implemented Endpoints in Phase 07E-3

### Media

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/media` | Paginated media metadata list. |
| `POST` | `/api/v1/cms/media` | Create media metadata only. |
| `GET` | `/api/v1/cms/media/:id` | Get media metadata by UUID. |
| `PATCH` | `/api/v1/cms/media/:id` | Update media metadata. |
| `PATCH` | `/api/v1/cms/media/:id/archive` | Archive media asset. |

Binary upload and cloud storage processing are not implemented in this phase.

### Inquiries

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/inquiries` | Paginated public inquiry list. |
| `GET` | `/api/v1/cms/inquiries/:id` | Inquiry detail. |
| `PATCH` | `/api/v1/cms/inquiries/:id/status` | Update inquiry status. |
| `POST` | `/api/v1/cms/inquiries/:id/responses` | Store prepared/sent response record. |
| `GET` | `/api/v1/cms/inquiries/:id/responses` | List stored response records. |

No real email is sent in this phase. A response with `status = sent` records `sent_at` and marks the inquiry as `responded`.

### Newsletter

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/newsletter-subscribers` | Paginated subscriber list. |
| `PATCH` | `/api/v1/cms/newsletter-subscribers/:id/status` | Update subscription status. |

### Users and Roles

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/users` | Paginated safe CMS user list. |
| `GET` | `/api/v1/cms/users/:id` | Safe CMS user detail. |
| `PATCH` | `/api/v1/cms/users/:id/status` | Update CMS user status. |
| `GET` | `/api/v1/cms/roles` | List roles. |
| `GET` | `/api/v1/cms/permissions` | List permissions. |
| `PATCH` | `/api/v1/cms/users/:id/roles` | Replace user role assignments. |

User creation remains intentionally limited to the bootstrap script. Password hashes, refresh token hashes, and auth sessions are never returned.

### Audit Logs

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/audit-logs` | Paginated safe audit log summary list. |
| `GET` | `/api/v1/cms/audit-logs/:id` | Audit log detail with sanitized before/after values. |

Audit detail recursively strips sensitive keys containing password, token, secret, or hash.

## 14. Emergency Facilities and Map Experience Authoring

Emergency infrastructure reuses the established `map_locations.*` permission family so current map editors can manage the layer without a role migration.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/cms/emergency-facilities` | Paginated emergency facility list with status, type, search, and sort filters. |
| `POST` | `/api/v1/cms/emergency-facilities` | Create a draft emergency facility. Status changes use the dedicated state endpoints. |
| `GET` | `/api/v1/cms/emergency-facilities/:id` | Get one facility for editing. |
| `PATCH` | `/api/v1/cms/emergency-facilities/:id` | Update facility identity, coordinates, hours, contacts, access data, or verification metadata. |
| `PATCH` | `/api/v1/cms/emergency-facilities/:id/publish` | Publish the facility and record publisher/time metadata. |
| `PATCH` | `/api/v1/cms/emergency-facilities/:id/archive` | Archive the facility and record archiver/time metadata. |
| `GET` | `/api/v1/cms/map-locations/options/experience` | List non-archived activities/packages and active managed-media assets available to the editor. |
| `PATCH` | `/api/v1/cms/map-locations/:id/experience` | Transactionally replace optional details, gallery, activity links, package links, and overnight rows. |

The experience endpoint accepts only destination and business map locations. Event pins keep their existing summary model. All experience collections accept empty arrays; sending an empty experience is the supported CMS empty state and does not create fabricated public content.

Each gallery row must contain exactly one `mediaAssetId` or `imageUrl`, and at most one row can be primary. Activity/package IDs cannot repeat, and at most one linked package can be primary. Overnight `optionType` and `rateUnit` values follow the database constraints; prices use `PHP`.

Emergency facility creates/updates are audited as `emergency_facility`. Experience replacements are audited as `map_location` updates with before/after snapshots.

## 15. Planned Endpoints for Later Phases

Dashboard:

- `GET /api/v1/cms/dashboard`

Promotions:

- Phase 07E-1 implemented.

Events:

- Phase 07E-1 implemented.

Products:

- Phase 07E-2 implemented.

Destinations:

- Phase 07E-2 implemented.

Map Locations:

- Phase 07E-2 implemented.

Museum:

- Phase 07E-2 implemented.

Businesses:

- Phase 07E-2 implemented.

Inquiries:

- Phase 07E-3 implemented.

Newsletter:

- Phase 07E-3 implemented.

Media:

- Phase 07E-3 metadata API implemented. Binary upload is postponed.

Users and Roles:

- Phase 07E-3 read/status/role assignment endpoints implemented. User creation remains postponed.

Audit Logs:

- Phase 07E-3 list/detail implemented.
