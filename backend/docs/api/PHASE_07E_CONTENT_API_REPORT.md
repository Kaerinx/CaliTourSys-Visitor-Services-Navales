# Phase 07E-1 CMS Content API Report

Project: CaliTourSys / CallTourSys  
Phase: 07E-1 - CMS Content API Core: Promotions, Events, and Categories  
Scope: Protected CMS backend API only

## Summary

Phase 07E-1 adds the first reusable CMS CRUD pattern for public-content management while keeping the completed public website API unchanged. The implemented endpoints are protected by authentication and permission checks, return the standard API response envelope, write audit logs for content mutations, and use parameterized PostgreSQL queries.

No CMS frontend, approval workflow, media upload flow, product CRUD, destination CRUD, business CRUD, map-location CRUD, or public website changes were added in this phase.

## Files Created

- `backend/src/modules/cms/content/content.routes.js`
- `backend/src/modules/cms/content/content.controller.js`
- `backend/src/modules/cms/content/content.service.js`
- `backend/src/modules/cms/content/content.repository.js`
- `backend/src/modules/cms/content/content.validators.js`
- `backend/src/utils/cmsAudit.js`
- `backend/src/utils/cmsSlug.js`
- `backend/src/utils/cmsContentMapper.js`
- `backend/scripts/smoke-cms-content-api.js`
- `backend/docs/api/PHASE_07E_CONTENT_API_REPORT.md`

## Files Modified

- `backend/src/modules/cms/cms.routes.js`
- `backend/package.json`
- `backend/docs/api/CMS_API_CONTRACT.md`
- `backend/docs/api/openapi.cms.yaml`

## Endpoints Implemented

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

Categories:

- `GET /api/v1/cms/event-categories`
- `POST /api/v1/cms/event-categories`
- `PATCH /api/v1/cms/event-categories/:id`
- `GET /api/v1/cms/product-categories`
- `POST /api/v1/cms/product-categories`
- `PATCH /api/v1/cms/product-categories/:id`
- `GET /api/v1/cms/destination-categories`
- `POST /api/v1/cms/destination-categories`
- `PATCH /api/v1/cms/destination-categories/:id`
- `GET /api/v1/cms/museum/categories`
- `POST /api/v1/cms/museum/categories`
- `PATCH /api/v1/cms/museum/categories/:id`

## Permissions Used

- Promotions: `promotions.view`, `promotions.create`, `promotions.update`, `promotions.publish`, `promotions.archive`
- Events: `events.view`, `events.create`, `events.update`, `events.publish`, `events.archive`
- Event categories: `events.view`, `events.update`
- Product categories: `products.view`, `products.update`
- Destination categories: `destinations.view`, `destinations.update`
- Museum categories: `museum.view`, `museum.update`

Dedicated category permissions do not exist yet. The endpoints use the closest existing module permissions to avoid unsafe bypasses.

## Validation Rules

- UUID path params are validated.
- Pagination supports `page` and `limit`, with `limit` capped at `100`.
- Slugs must use lowercase letters, numbers, and hyphens.
- Content status is limited to `draft`, `published`, and `archived`.
- Promotion type is limited to `campaign`, `featured`, `seasonal`, and `announcement`.
- Promotion and event date ranges reject `endsAt` earlier than `startsAt`.
- Sort values are allowlisted before reaching SQL.
- Unknown body fields are rejected for write routes.

## Audit Logging

The API writes `content_audit_logs` for:

- `create`
- `update`
- `publish`
- `archive`

Audit metadata includes actor, action, entity type, entity ID, entity label, before/after snapshots where practical, IP address, user agent, and request ID.

Category audit entries use the closest existing `cms_entity_type` because the current enum does not include separate category entity types:

- Event categories: `event`
- Product categories: `product`
- Destination categories: `destination`
- Museum categories: `museum_artifact`

## Security Decisions

- All CMS content routes require Bearer access token authentication.
- Every content route has an RBAC permission requirement.
- CMS routes use `Cache-Control: no-store`.
- SQL queries are parameterized.
- Sort columns and category table names are allowlisted in code.
- Password hashes, refresh token hashes, and auth session internals are not exposed.
- Public APIs remain unchanged and continue to return public-only content.

## Testing Instructions

Run syntax checks:

```powershell
cd backend
npm run check
```

Run the CMS content smoke test:

```powershell
cd backend
$env:CMS_TEST_EMAIL="your-cms-user-email"
$env:CMS_TEST_PASSWORD="your-cms-user-password"
npm run test:cms-content-api
```

The smoke test verifies:

- unauthenticated CMS content routes reject requests
- login
- promotions list
- promotion create/update/publish/archive when permissions allow
- events list
- category lists
- forbidden behavior when practical
- logout

## Known Limitations

- Category-specific permissions are not yet modeled.
- Category audit logs use parent content entity types.
- Product, destination, business, museum artifact, map location, media, inquiry response, and newsletter CMS CRUD are intentionally not implemented yet.
- OpenAPI documents the endpoint shapes but does not replace integration tests.

## Postponed

- CMS frontend
- Product CRUD
- Destination CRUD
- Business/producer CRUD
- Museum artifact CRUD
- Map location CRUD
- Media upload and storage processing
- Inquiry response workflow
- Newsletter management actions
- Approval workflows

## Next Phase Recommendation

Proceed to Phase 07E-2 for product, destination, business, museum artifact, map location, and media CMS APIs after the content smoke test passes for a CMS user with the required role permissions.
