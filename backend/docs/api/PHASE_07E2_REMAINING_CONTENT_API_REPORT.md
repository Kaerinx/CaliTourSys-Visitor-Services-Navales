# Phase 07E-2 Remaining CMS Content API Report

Project: CaliTourSys / CallTourSys  
Phase: 07E-2 - Remaining CMS Content APIs  
Scope: Protected CMS backend API only

## Summary

Phase 07E-2 completes the next CMS content API layer for products, destinations, businesses/producers, museum artifacts, and map locations. These endpoints are protected by the existing authentication and RBAC middleware, use the standard response envelope, and follow the audit logging pattern introduced in Phase 07E-1.

The public website and public APIs were not changed.

## Files Created

- `backend/scripts/smoke-cms-remaining-content-api.js`
- `backend/docs/api/PHASE_07E2_REMAINING_CONTENT_API_REPORT.md`

## Files Modified

- `backend/src/modules/cms/content/content.routes.js`
- `backend/src/modules/cms/content/content.controller.js`
- `backend/src/modules/cms/content/content.service.js`
- `backend/src/modules/cms/content/content.repository.js`
- `backend/src/modules/cms/content/content.validators.js`
- `backend/src/utils/cmsContentMapper.js`
- `backend/package.json`
- `backend/docs/api/CMS_API_CONTRACT.md`
- `backend/docs/api/openapi.cms.yaml`

## Endpoints Implemented

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

Businesses / Producers:

- `GET /api/v1/cms/businesses`
- `POST /api/v1/cms/businesses`
- `GET /api/v1/cms/businesses/:id`
- `PATCH /api/v1/cms/businesses/:id`

Museum artifacts:

- `GET /api/v1/cms/museum/artifacts`
- `POST /api/v1/cms/museum/artifacts`
- `GET /api/v1/cms/museum/artifacts/:id`
- `PATCH /api/v1/cms/museum/artifacts/:id`
- `PATCH /api/v1/cms/museum/artifacts/:id/publish`
- `PATCH /api/v1/cms/museum/artifacts/:id/archive`

Map locations:

- `GET /api/v1/cms/map-locations`
- `POST /api/v1/cms/map-locations`
- `GET /api/v1/cms/map-locations/:id`
- `PATCH /api/v1/cms/map-locations/:id`
- `DELETE /api/v1/cms/map-locations/:id`

## Permissions Used

- Products: `products.view`, `products.create`, `products.update`, `products.publish`, `products.archive`
- Destinations: `destinations.view`, `destinations.create`, `destinations.update`, `destinations.publish`, `destinations.archive`
- Businesses: `businesses.view`, `businesses.create`, `businesses.update`
- Museum artifacts: `museum.view`, `museum.create`, `museum.update`, `museum.publish`, `museum.archive`
- Map locations: `map_locations.view`, `map_locations.create`, `map_locations.update`

## Validation Rules

- UUID path params and foreign keys are validated.
- Slugs must be lowercase URL-safe values.
- CMS list pagination is capped at `limit <= 100`.
- Prices must be non-negative.
- Latitude must be between `-90` and `90`.
- Longitude must be between `-180` and `180`.
- Map location targets must match `locationType` and include exactly one target ID.
- Unknown request body fields are rejected where practical.

## Audit Logging

Audit logs are written to `content_audit_logs` for:

- `create`
- `update`
- `publish`
- `archive`
- `delete` for map locations

Audit entries include actor user, action, entity type, entity ID, entity label, before/after values where practical, IP address, user agent, and request ID.

## Security Decisions

- All endpoints require a valid Bearer access token.
- All endpoints require permission-based authorization.
- CMS endpoints use `Cache-Control: no-store`.
- SQL values are parameterized.
- Sort columns are allowlisted.
- Public API filtering remains unchanged and cannot be weakened by these CMS endpoints.

## Testing Instructions

Run syntax/module checks:

```powershell
cd backend
npm run check
```

Run the remaining CMS content smoke test:

```powershell
cd backend
$env:CMS_TEST_EMAIL="your-cms-user-email"
$env:CMS_TEST_PASSWORD="your-cms-user-password"
npm run test:cms-remaining-content-api
```

## Known Limitations

- Media upload handling is not implemented yet.
- Inquiry response and newsletter management APIs are not implemented yet.
- User and role management APIs are not implemented yet.
- Approval workflow remains intentionally postponed.
- PATCH endpoints use partial updates but do not currently clear nullable fields to `NULL`.

## Next Phase Recommendation

Proceed to Phase 07E-3 for CMS media, inquiry, newsletter, and supporting management APIs after the remaining content smoke test passes.
