# Public Website API Contract

Project: CaliTourSys / CallTourSys  
Phase: 03A - Backend API Contract  
Scope: Public Facing Website only  
Base path: `/api/v1`

This contract defines the public website API for the Promotion & Marketing / Tourist Map & Discovery scope. It is intentionally read-optimized and does not expose raw database tables directly.

No CMS, staff, officer, admin, authentication, roles, approval workflow, or Mapbox frontend behavior is included in this phase.

## 1. API Overview

The public API supports:

- Home page content blocks
- Promotions and campaign pages
- Events and event categories
- OTOP products and product categories
- Public business/producer profiles
- Tourist destinations and destination categories
- Map/discovery locations
- Interactive museum artifacts
- Anonymous visitor itinerary sessions
- Public tourism inquiries
- Newsletter subscriptions

The backend should query normalized PostgreSQL tables and return frontend-friendly read models.

## 2. Base URL

Development:

```text
http://localhost:5000/api/v1
```

Production:

```text
https://<production-domain>/api/v1
```

Public website endpoints use:

```text
/api/v1/public/...
```

Health endpoint:

```text
/api/v1/health
```

## 3. Versioning Strategy

Versioning is path-based:

```text
/api/v1
```

Rules:

- Backward-compatible additions may remain in `v1`.
- Breaking response shape changes require `v2`.
- Public frontend pages should not depend on undocumented fields.
- Deprecated fields should remain for one release cycle before removal.

## 4. Standard Success Response

Single-object response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_01HZY...",
    "timestamp": "2026-05-23T10:30:00.000Z"
  }
}
```

Paginated list response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "requestId": "req_01HZY...",
    "timestamp": "2026-05-23T10:30:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalItems": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## 5. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message.",
    "details": []
  },
  "meta": {
    "requestId": "req_01HZY...",
    "timestamp": "2026-05-23T10:30:00.000Z"
  }
}
```

Recommended error codes:

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request params/body failed validation. |
| `NOT_FOUND` | Public resource does not exist or is not published. |
| `CONFLICT` | Duplicate public action, such as existing newsletter email. |
| `RATE_LIMITED` | Public POST rate limit exceeded. |
| `PAYLOAD_TOO_LARGE` | Body exceeds configured limit. |
| `INTERNAL_ERROR` | Unexpected server error. |

## 6. HTTP Status Code Rules

| Status | Usage |
|---|---|
| `200` | Successful read, successful idempotent create behavior. |
| `201` | New itinerary session/item, inquiry, or subscription created. |
| `204` | Successful delete with no response body. |
| `400` | Invalid query params or request body. |
| `404` | Resource not found or not public. |
| `409` | Conflict, duplicate, or invalid state. |
| `413` | Request body too large. |
| `429` | Rate limit exceeded. |
| `500` | Internal server error with no stack trace exposed. |

## 7. Pagination Format

Common query params:

| Param | Default | Rules |
|---|---:|---|
| `page` | `1` | Positive integer. |
| `limit` | `12` | Positive integer. Recommended max: `50`. |

Pagination metadata must be returned for list endpoints:

```json
{
  "page": 1,
  "limit": 12,
  "totalItems": 30,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## 8. Search, Filter, Sort Conventions

Common listing params:

| Param | Meaning |
|---|---|
| `search` | Text search over public names, titles, descriptions, tags where applicable. |
| `category` | Category slug. |
| `featured` | Boolean string: `true` or `false`. |
| `status` | Public-safe status filter. Public reads default to published/active content and must not expose draft/private workflow records. |
| `sort` | Stable sort key. Prefix with `-` for descending where supported. |

Public endpoints must default to public content only:

- `products.status = published`
- `events.status = published`
- `destinations.status = published`
- `museum_artifacts.status = published`
- categories with `status = published`
- businesses with `status = active`

The public API should not expose draft, inactive, archived, revoked-only, or private workflow data.

## 9. Public Caching Recommendations

Recommended cache behavior:

| Endpoint Type | Cache |
|---|---|
| Public read lists/details | `Cache-Control: public, max-age=60, stale-while-revalidate=300` |
| Home endpoint | `Cache-Control: public, max-age=60, stale-while-revalidate=300` |
| Map locations | `Cache-Control: public, max-age=300, stale-while-revalidate=600` |
| Public POST endpoints | `Cache-Control: no-store` |
| Itinerary session endpoints | `Cache-Control: private, no-store` |

ETag support is recommended later for high-traffic public reads.

## 10. Rate Limiting Expectations

Apply stricter rate limits to public POST endpoints:

- `POST /public/inquiries`
- `POST /public/newsletter-subscriptions`
- `POST /public/itinerary/sessions`
- `POST /public/itinerary/:sessionToken/items`
- `DELETE /public/itinerary/:sessionToken/items/:itemId`

Recommended starting point:

- Inquiry: 5 requests per IP per 15 minutes
- Newsletter: 5 requests per IP per 15 minutes
- Itinerary writes: 60 requests per IP per 15 minutes

Return `429 RATE_LIMITED` using the standard error envelope.

## 11. Validation Expectations

Phase 03B should validate with Zod or Joi.

Validation rules:

- Slugs: lowercase letters, numbers, and hyphens only.
- UUID params: valid UUID format.
- Emails: basic email format in API layer, with database constraints as final guard.
- `page` and `limit`: positive integers, max limit enforced.
- `sort`: allowlist only.
- POST bodies: reject unknown or oversized fields.
- `sourcePage`: optional path or URL-like string; do not trust it for redirects.

## 12. Security Considerations

Phase 03B implementation must include:

- Helmet/security headers
- CORS allowlist
- Public POST rate limiting
- Request body size limit
- Input validation with Zod or Joi
- SQL parameterization only
- No raw SQL string interpolation
- Centralized error handler
- Request ID middleware
- Structured logging
- Environment validation
- No internal stack traces in public responses
- Public endpoints return only published/active content by default

No secrets, auth tokens, staff data, workflow state, or private contact data should be returned by public endpoints.

Public contact and accreditation rules:

- Business contact data must only return records where `business_contacts.is_public = true`.
- Public accreditation display should prioritize the latest verified accreditation record, ordered by `verified_at DESC NULLS LAST` and then newest record.
- `sessionToken` is an anonymous itinerary lookup token only. It is not a login token, must not grant user identity, and must not contain personal data.

## 13. Endpoint List

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/health` | API health check. |
| `GET` | `/api/v1/public/home` | Home page content blocks. |
| `GET` | `/api/v1/public/promotions` | Paginated promotions. |
| `GET` | `/api/v1/public/promotions/:slug` | Promotion detail. |
| `GET` | `/api/v1/public/events` | Paginated/listed events. |
| `GET` | `/api/v1/public/events/:slug` | Event detail. |
| `GET` | `/api/v1/public/event-categories` | Event categories. |
| `GET` | `/api/v1/public/products` | Paginated products. |
| `GET` | `/api/v1/public/products/:slug` | Product detail. |
| `GET` | `/api/v1/public/product-categories` | Product categories. |
| `GET` | `/api/v1/public/businesses/:slug` | Public business/producer profile. |
| `GET` | `/api/v1/public/destinations` | Paginated destinations. |
| `GET` | `/api/v1/public/destinations/:slug` | Destination detail. |
| `GET` | `/api/v1/public/destination-categories` | Destination categories. |
| `GET` | `/api/v1/public/map/locations` | Map/list or GeoJSON locations. |
| `GET` | `/api/v1/public/map/emergency-facilities` | Published emergency facilities as GeoJSON. |
| `GET` | `/api/v1/public/map/locations/:id/details` | Rich destination/business map detail. |
| `GET` | `/api/v1/public/museum/artifacts` | Paginated museum artifacts. |
| `GET` | `/api/v1/public/museum/artifacts/:slug` | Museum artifact detail. |
| `GET` | `/api/v1/public/museum/categories` | Museum categories. |
| `POST` | `/api/v1/public/itinerary/sessions` | Create anonymous itinerary session. |
| `GET` | `/api/v1/public/itinerary/:sessionToken` | Read itinerary. |
| `POST` | `/api/v1/public/itinerary/:sessionToken/items` | Save itinerary item. |
| `DELETE` | `/api/v1/public/itinerary/:sessionToken/items/:itemId` | Remove itinerary item. |
| `POST` | `/api/v1/public/inquiries` | Submit inquiry. |
| `POST` | `/api/v1/public/newsletter-subscriptions` | Subscribe to newsletter. |

Future optional analytics, not for this phase:

- `POST /api/v1/public/share-events`
- `POST /api/v1/public/analytics/page-view`
- `POST /api/v1/public/analytics/interaction`

## 14. Endpoint Contracts

### GET `/api/v1/health`

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "CaliTourSys API",
    "version": "v1"
  },
  "meta": {
    "requestId": "req_demo",
    "timestamp": "2026-05-23T10:30:00.000Z"
  }
}
```

### GET `/api/v1/public/home`

Returns:

- `featuredPromotions`
- `featuredProducts`
- `featuredDestinations`
- `upcomingEvents`
- `featuredMuseumArtifacts`
- `publicStats`

Example:

```json
{
  "success": true,
  "data": {
    "featuredPromotions": [],
    "featuredProducts": [],
    "featuredDestinations": [],
    "upcomingEvents": [],
    "featuredMuseumArtifacts": [],
    "publicStats": {
      "publishedProducts": 6,
      "publishedDestinations": 5,
      "upcomingEvents": 4,
      "accreditedBusinesses": 2
    }
  },
  "meta": {
    "requestId": "req_demo",
    "timestamp": "2026-05-23T10:30:00.000Z"
  }
}
```

### GET `/api/v1/public/products`

Query params:

- `search`
- `category`
- `business`
- `tag`
- `featured`
- `page`
- `limit`
- `sort`

Allowed sort values:

- `name`
- `-name`
- `publishedAt`
- `-publishedAt`
- `price`
- `-price`
- `featured`

Product listing item:

```json
{
  "id": "uuid",
  "slug": "demo-pili-nut-brittle",
  "name": "Demo Pili Nut Brittle",
  "shortDescription": "Demo small-batch pili brittle.",
  "price": {
    "amount": 250,
    "currency": "PHP",
    "unitLabel": "pack"
  },
  "category": {
    "slug": "sweets",
    "name": "Sweets"
  },
  "business": {
    "slug": "demo-pili-kitchen",
    "name": "Demo Pili Kitchen"
  },
  "accreditationStatus": "accredited",
  "primaryImage": {
    "url": "https://picsum.photos/seed/calitoursys-pili-brittle/900/700",
    "altText": "Demo image placeholder for pili brittle."
  },
  "tags": ["pili", "sweets"],
  "isFeatured": true
}
```

### GET `/api/v1/public/products/:slug`

Returns:

- `product`
- `category`
- `business`
- public `business.contacts`, filtered to `is_public = true`
- `accreditation`, using the latest verified public accreditation record
- `gallery`
- `relatedProducts`

### GET `/api/v1/public/events`

Query params:

- `search`
- `category`
- `from`
- `to`
- `featured`
- `page`
- `limit`
- `sort`

Allowed sort values:

- `startsAt`
- `-startsAt`
- `title`
- `-title`
- `featured`

Event listing item:

```json
{
  "id": "uuid",
  "slug": "demo-pili-festival-2026",
  "title": "Demo Pili Festival 2026",
  "shortDescription": "Demo festival entry.",
  "category": {
    "slug": "festival",
    "name": "Festival"
  },
  "startsAt": "2026-06-24T00:00:00.000Z",
  "endsAt": "2026-06-24T10:00:00.000Z",
  "venueName": "Demo Town Plaza",
  "primaryImage": {
    "url": "https://picsum.photos/seed/calitoursys-pili-festival/1200/675",
    "altText": "Demo image placeholder for festival event."
  },
  "isFeatured": true
}
```

### GET `/api/v1/public/destinations`

Query params:

- `search`
- `category`
- `barangay`
- `featured`
- `page`
- `limit`
- `sort`

Destination listing item:

```json
{
  "id": "uuid",
  "slug": "demo-sabang-beach",
  "name": "Demo Sabang Beach",
  "shortDescription": "Demo coastal destination record.",
  "category": {
    "slug": "beach",
    "name": "Beach",
    "color": "#1565C0"
  },
  "barangay": "Sabang",
  "primaryImage": {
    "url": "https://picsum.photos/seed/calitoursys-sabang-beach/1200/800",
    "altText": "Demo image placeholder for beach destination."
  },
  "hasMapLocation": true,
  "isFeatured": true
}
```

### GET `/api/v1/public/map/locations`

Query params:

- `type`: `destination`, `business`, `event`
- `category`: category slug where applicable
- `featured`: boolean
- `bounds`: reserved for later, format `minLng,minLat,maxLng,maxLat`
- `format`: `list` or `geojson`

For `format=geojson`, `data` is a GeoJSON FeatureCollection:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [123.252, 13.711]
      },
      "properties": {
        "id": "uuid",
        "locationType": "destination",
        "slug": "demo-sabang-beach",
        "label": "Demo Sabang Beach",
        "category": "Beach",
        "markerColor": "#1565C0",
        "markerIcon": "beach",
        "primaryImage": "https://picsum.photos/seed/calitoursys-sabang-beach/1200/800",
        "description": "Demo coastal destination record."
      }
    }
  ]
}
```

### GET `/api/v1/public/map/emergency-facilities`

Returns published emergency facilities as a GeoJSON `FeatureCollection`. Emergency facilities are an independent map layer and are not included in tourism search/filter results. Each feature uses `[longitude, latitude]` coordinates and exposes public address, opening-hours, contact, accessibility, amenity, and verification metadata under `properties`.

### GET `/api/v1/public/map/locations/:id/details`

`id` is the UUID from `GET /public/map/locations`. The endpoint supports published destination and active business locations; event locations return `404` and retain their existing summary UI.

Response data includes:

- normalized location identity, coordinates, category, overview, and visit information;
- `gallery`, preferring map-location images and falling back to destination or business-product images;
- linked `activities` and `packages` only when their workflow status is `Ready for Promotion`;
- `primaryPackage`, using the explicit primary link or the first linked package by display order;
- active `overnightOptions`, with PHP rate amount and one of `per_person_per_night`, `per_tent_per_night`, `per_site_per_night`, or `flat_rate`;
- empty arrays and nullable copy fields when the CMS has not populated optional content.

### GET `/api/v1/public/museum/artifacts`

Query params:

- `search`
- `category`
- `featured`
- `page`
- `limit`

Museum listing item:

```json
{
  "id": "uuid",
  "slug": "demo-heritage-bell",
  "name": "Demo Heritage Bell",
  "eraLabel": "Spanish-era demo label",
  "shortDescription": "Demo heritage record.",
  "category": {
    "slug": "spanish-era",
    "name": "Spanish-era"
  },
  "primaryImage": {
    "url": "https://picsum.photos/seed/calitoursys-bell/900/900",
    "altText": "Demo image placeholder for heritage bell artifact."
  },
  "isFeatured": true
}
```

### Itinerary Endpoints

`sessionToken` is not an authentication credential. It is only an anonymous public itinerary lookup token and must not contain personal data.

Create session:

```http
POST /api/v1/public/itinerary/sessions
```

Response data:

```json
{
  "sessionToken": "public-safe-token",
  "itemCount": 0,
  "items": []
}
```

Add item:

```http
POST /api/v1/public/itinerary/:sessionToken/items
Content-Type: application/json

{
  "itemType": "product",
  "targetId": "30000000-0000-4000-8000-000000000001"
}
```

Itinerary item response:

```json
{
  "id": "uuid",
  "itemType": "product",
  "targetId": "uuid",
  "titleSnapshot": "Demo Pili Nut Brittle",
  "savedAt": "2026-05-23T10:30:00.000Z",
  "summary": {
    "slug": "demo-pili-nut-brittle",
    "title": "Demo Pili Nut Brittle",
    "primaryImage": "https://picsum.photos/seed/calitoursys-pili-brittle/900/700"
  }
}
```

### POST `/api/v1/public/inquiries`

Request:

```json
{
  "fullName": "Demo Visitor",
  "email": "visitor@example.test",
  "contactNumber": "+63 900 000 0000",
  "subject": "Destination inquiry",
  "message": "I would like to ask about public visiting hours.",
  "sourcePage": "/promotion/inquiry"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "new",
    "receivedAt": "2026-05-23T10:30:00.000Z"
  },
  "meta": {
    "requestId": "req_demo",
    "timestamp": "2026-05-23T10:30:00.000Z"
  }
}
```

### POST `/api/v1/public/newsletter-subscriptions`

Request:

```json
{
  "email": "subscriber@example.test",
  "fullName": "Demo Subscriber"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "email": "subscriber@example.test",
    "status": "subscribed",
    "subscribedAt": "2026-05-23T10:30:00.000Z"
  },
  "meta": {
    "requestId": "req_demo",
    "timestamp": "2026-05-23T10:30:00.000Z"
  }
}
```

## 15. Frontend Usage Notes

- Vue services should consume only `/api/v1/public/...`.
- Do not call database-like endpoints; none should exist.
- Treat `slug` as the URL identifier for public pages.
- Treat UUID `id` as stable item reference for itinerary actions.
- Product/event/destination/museum list pages should use paginated endpoints.
- Map page can start with `format=list`; switch to `format=geojson` when Mapbox integration begins.
- The public UI should assume missing images are possible and use existing visual fallbacks.
- Public APIs only return public data; CMS data will require separate future endpoints.

## 16. Backend Implementation TODOs for Phase 03B

Implement:

- Express app setup
- Environment validation
- PostgreSQL connection pool
- Request ID middleware
- Helmet and CORS allowlist
- JSON body limit
- Rate limiters for public POST endpoints
- Centralized response envelope helpers
- Centralized error handler
- Zod or Joi schemas
- Public SQL query modules with parameterized queries only
- Public service layer returning read models
- Route/controller modules under `/api/v1`
- Integration tests for all endpoints
- Query pagination helpers
- Slug lookup helpers
- Public content filtering helpers

Do not implement in Phase 03B:

- CMS/admin/staff/officer APIs
- Auth/users/roles
- Approval workflows
- Mapbox frontend code
- Seed data changes unless specifically requested

## 17. Database Alignment

This contract is based on:

- `businesses`
- `business_contacts`
- `business_accreditations`
- `product_categories`
- `products`
- `product_images`
- `product_tags`
- `promotions`
- `promotion_items`
- `event_categories`
- `events`
- `event_images`
- `destination_categories`
- `destinations`
- `destination_images`
- `map_locations`
- `emergency_facilities`
- `map_location_details`
- `map_location_gallery_images`
- `map_location_activity_links`
- `map_location_package_links`
- `map_location_overnight_options`
- `artifact_categories`
- `museum_artifacts`
- `artifact_images`
- `itinerary_sessions`
- `itinerary_items`
- `tourism_inquiries`
- `newsletter_subscribers`
- `media_assets`
