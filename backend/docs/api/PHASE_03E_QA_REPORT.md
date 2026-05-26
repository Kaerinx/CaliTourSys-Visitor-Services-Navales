# Phase 03E QA Report

Project: CaliTourSys / CallTourSys  
Phase: 03E - Backend API QA and Contract Verification  
Scope: Public Facing Website API only  
Base URL: `http://localhost:5000/api/v1`

No CMS, staff, officer, admin, authentication, roles, approval workflow, frontend integration, or Mapbox frontend behavior is included in this QA pass.

## QA Scope

This pass verifies:

- Express foundation and health endpoint.
- Public read endpoints from the documented API contract.
- Public write endpoints for itinerary, inquiries, and newsletter subscriptions.
- Standard success and error response envelopes.
- Pagination metadata for list endpoints.
- Published/active public data rules.
- Basic security middleware expectations.
- PowerShell-friendly manual testing workflow.

## Environment Tested

- Runtime: Node.js backend under `backend`.
- API base URL: `API_BASE_URL` or default `http://localhost:5000/api/v1`.
- Database: existing local PostgreSQL development database with public website seed data.
- External services: none required.

Before running QA:

```powershell
cd backend
npm run check
npm run dev
```

In a second terminal:

```powershell
cd backend
npm run test:public-api
```

## Endpoint Checklist

| Endpoint | Status |
|---|---|
| `GET /api/v1/health` | Covered by smoke test |
| `GET /api/v1/public/home` | Covered by smoke test |
| `GET /api/v1/public/promotions` | Covered by smoke test |
| `GET /api/v1/public/promotions/:slug` | Covered by smoke test |
| `GET /api/v1/public/events` | Covered by smoke test |
| `GET /api/v1/public/events/:slug` | Covered by smoke test |
| `GET /api/v1/public/event-categories` | Covered by smoke test |
| `GET /api/v1/public/products` | Covered by smoke test |
| `GET /api/v1/public/products/:slug` | Covered by smoke test |
| `GET /api/v1/public/product-categories` | Covered by smoke test |
| `GET /api/v1/public/businesses/:slug` | Covered by smoke test |
| `GET /api/v1/public/destinations` | Covered by smoke test |
| `GET /api/v1/public/destinations/:slug` | Covered by smoke test |
| `GET /api/v1/public/destination-categories` | Covered by smoke test |
| `GET /api/v1/public/map/locations` | Covered by smoke test |
| `GET /api/v1/public/museum/artifacts` | Covered by smoke test |
| `GET /api/v1/public/museum/artifacts/:slug` | Covered by smoke test |
| `GET /api/v1/public/museum/categories` | Covered by smoke test |
| `POST /api/v1/public/itinerary/sessions` | Covered by smoke test |
| `GET /api/v1/public/itinerary/:sessionToken` | Covered by smoke test |
| `POST /api/v1/public/itinerary/:sessionToken/items` | Covered by smoke test |
| `DELETE /api/v1/public/itinerary/:sessionToken/items/:itemId` | Covered by smoke test |
| `POST /api/v1/public/inquiries` | Covered by smoke test |
| `POST /api/v1/public/newsletter-subscriptions` | Covered by smoke test |

## Contract Verification Checklist

- Base path remains `/api/v1`.
- Health route remains `GET /api/v1/health`.
- Public routes remain under `/api/v1/public/...`.
- OpenAPI local server URL remains `http://localhost:5000/api/v1`.
- Public read endpoints return read models, not raw database rows.
- `sessionToken` is documented as an anonymous itinerary lookup token, not a login token.
- Public business contacts are documented and implemented as `is_public = true` only.
- Public accreditation display is documented and implemented using the latest verified/newest display record.
- Duplicate itinerary item saves return idempotent `200`.
- Duplicate newsletter subscriptions return idempotent `200`.

## Response Envelope Checklist

Success responses include:

- `success: true`
- `data`
- `meta.requestId`
- `meta.timestamp`

Paginated responses additionally include:

- `meta.pagination.page`
- `meta.pagination.limit`
- `meta.pagination.totalItems`
- `meta.pagination.totalPages`
- `meta.pagination.hasNextPage`
- `meta.pagination.hasPreviousPage`

Error responses include:

- `success: false`
- `error.code`
- `error.message`
- `error.details`
- `meta.requestId`
- `meta.timestamp`

`DELETE /api/v1/public/itinerary/:sessionToken/items/:itemId` returns `204 No Content`, matching the API contract.

## Validation and Error Checklist

Smoke test coverage includes:

- Invalid slug: `400 VALIDATION_ERROR`.
- Missing valid slug: `404 NOT_FOUND`.
- Invalid itinerary `targetId`: `400 VALIDATION_ERROR`.
- Invalid itinerary `itemType`: `400 VALIDATION_ERROR`.
- Bad inquiry email: `400 VALIDATION_ERROR`.
- Unknown route: `404 NOT_FOUND`.
- Error envelopes do not expose stack traces.
- Malformed JSON is normalized to `400 VALIDATION_ERROR`.

## Public Data Rule Checklist

Implementation uses public filters:

- Products: `products.status = 'published'`.
- Events: `events.status = 'published'`.
- Destinations: `destinations.status = 'published'`.
- Promotions: `promotions.status = 'published'`.
- Museum artifacts: `museum_artifacts.status = 'published'`.
- Categories: `status = 'published'`.
- Businesses: `businesses.status = 'active'`.
- Business contacts: `business_contacts.is_public = true`.
- Itinerary targets must exist and be public before saving.

The smoke test also checks that list read models do not expose raw `status`, `publishedAt`, or `archivedAt` fields.

## Security Checks

Confirmed by implementation and smoke test where practical:

- Helmet is enabled and security headers are present.
- CORS is configured with an allowlist.
- Request body size limit is configured through `REQUEST_BODY_LIMIT`.
- Public POST rate limiters exist for inquiry, newsletter, and itinerary writes.
- SQL access is handled through parameterized `pg` queries.
- Error handler returns standard envelopes and hides production stack traces.
- Request ID exists in success and error response metadata.
- Public POST responses use `Cache-Control: no-store` or `private, no-store`.

## Bugs Found

- Malformed JSON bodies were previously normalized as `REQUEST_ERROR`; they now return `400 VALIDATION_ERROR` with a safe message.
- OpenAPI documented newsletter duplicate behavior as `409`, while the implemented and preferred public behavior is idempotent `200`.
- OpenAPI did not describe the optional itinerary session body.
- OpenAPI did not describe idempotent `200` for duplicate itinerary item saves.

## Bugs Fixed

- Added malformed JSON handling to the centralized error handler.
- Updated `openapi.public.yaml` to document optional itinerary session body.
- Updated `openapi.public.yaml` to document idempotent duplicate itinerary item behavior.
- Updated `openapi.public.yaml` to document idempotent newsletter duplicate/resubscribe behavior.
- Added a repeatable smoke test script at `backend/scripts/smoke-public-api.js`.

## Known Limitations

- Smoke tests require the backend server to already be running.
- Smoke tests require the public website seed data slugs and fixed UUIDs from the development seed file.
- Rate limit behavior is configured but not stress-tested by default to avoid intentionally blocking local development.
- This is a black-box API smoke test, not a full integration or load test suite.
- No frontend integration is included in this phase.

## Manual PowerShell Commands

Health:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" | ConvertTo-Json -Depth 10
```

Read endpoints:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/home" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/products" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/products/demo-pili-nut-brittle" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/events" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/events/demo-pili-festival-2026" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/destinations" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/destinations/demo-sabang-beach" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/map/locations?format=geojson" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/museum/artifacts" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/museum/artifacts/demo-heritage-bell" | ConvertTo-Json -Depth 10
```

Itinerary:

```powershell
$sessionBody = @{ visitorLabel = "Demo Visitor" } | ConvertTo-Json
$session = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/v1/public/itinerary/sessions" -ContentType "application/json" -Body $sessionBody
$token = $session.data.sessionToken
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/itinerary/$token" | ConvertTo-Json -Depth 10

$itemBody = @{
  itemType = "product"
  targetId = "30000000-0000-4000-8000-000000000001"
} | ConvertTo-Json
$item = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/v1/public/itinerary/$token/items" -ContentType "application/json" -Body $itemBody
$itemId = $item.data.id
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/public/itinerary/$token" | ConvertTo-Json -Depth 10
Invoke-RestMethod -Method Delete -Uri "http://localhost:5000/api/v1/public/itinerary/$token/items/$itemId"
```

Inquiry:

```powershell
$inquiryBody = @{
  fullName = "Demo Visitor"
  email = "visitor@example.test"
  contactNumber = "+63 900 000 0000"
  subject = "Destination inquiry"
  message = "I would like to ask about public visiting hours."
  sourcePage = "/promotion/inquiry"
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/v1/public/inquiries" -ContentType "application/json" -Body $inquiryBody | ConvertTo-Json -Depth 10
```

Newsletter:

```powershell
$newsletterBody = @{
  email = "subscriber@example.test"
  fullName = "Demo Subscriber"
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/v1/public/newsletter-subscriptions" -ContentType "application/json" -Body $newsletterBody | ConvertTo-Json -Depth 10
```

PowerShell-friendly `curl.exe` example:

```powershell
curl.exe "http://localhost:5000/api/v1/health"
curl.exe -X POST "http://localhost:5000/api/v1/public/newsletter-subscriptions" -H "Content-Type: application/json" -d "{`"email`":`"subscriber@example.test`",`"fullName`":`"Demo Subscriber`"}"
```

## Remaining TODOs Before Frontend Integration

- Run `npm run test:public-api` after every backend change while Phase 04 integration is underway.
- Add automated integration tests later using a dedicated test database.
- Decide whether frontend should use `Invoke-RestMethod` examples as API docs, Thunder Client collection, or generated OpenAPI client later.
- Add production observability and deployment checks in a later phase.

## Phase 04 Readiness

Backend public API is ready for Phase 04 frontend integration after the local smoke test passes against the developer database.
