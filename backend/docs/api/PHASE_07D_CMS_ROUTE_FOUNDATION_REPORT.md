# Phase 07D CMS Route Foundation Report

Project: CaliTourSys / CallTourSys  
Scope: CMS API contract and protected route foundation

## Files Created

- `backend/src/modules/cms/cms.routes.js`
- `backend/src/modules/cms/cms.controller.js`
- `backend/src/modules/cms/cms.service.js`
- `backend/src/modules/cms/cms.repository.js`
- `backend/src/modules/cms/cms.validators.js`
- `backend/src/utils/cmsNavigation.js`
- `backend/scripts/smoke-cms-api.js`
- `backend/docs/api/CMS_API_CONTRACT.md`
- `backend/docs/api/openapi.cms.yaml`
- `backend/docs/api/PHASE_07D_CMS_ROUTE_FOUNDATION_REPORT.md`

## Files Modified

- `backend/src/routes/index.js`
- `backend/package.json`

## Protected Routes Implemented

- `GET /api/v1/cms/health`
- `GET /api/v1/cms/dashboard`
- `GET /api/v1/cms/navigation`
- `GET /api/v1/cms/audit-logs`

All CMS routes are mounted under `/api/v1/cms` and protected by `authenticate`.

## Permissions Used

- `/cms/health`: `dashboard.view`
- `/cms/dashboard`: `dashboard.view`
- `/cms/navigation`: authenticated user only
- `/cms/audit-logs`: `audit_logs.view`

## Dashboard Data

The dashboard endpoint returns safe counts from existing public tables:

- Products
- Events
- Destinations
- Businesses
- Museum artifacts
- Pending inquiries
- Newsletter subscribers
- Recent audit logs

It does not expose users, sessions, password hashes, refresh token hashes, or raw audit JSON.

## Audit Log Behavior

The audit log endpoint supports:

- `page`
- `limit`
- `action`
- `entityType`

It returns safe list fields only:

- `id`
- `action`
- `entityType`
- `entityId`
- `entityLabel`
- `actor`
- `requestId`
- `createdAt`

`before_values` and `after_values` are intentionally not exposed in Phase 07D.

## Test Instructions

Run syntax checks:

```powershell
npm run check
```

Run backend:

```powershell
npm run dev
```

PowerShell smoke test:

```powershell
$env:CMS_TEST_EMAIL="your-cms-user-email"
$env:CMS_TEST_PASSWORD="your-cms-user-password"
npm run test:cms-api
```

Command Prompt smoke test:

```cmd
set CMS_TEST_EMAIL=your-cms-user-email
set CMS_TEST_PASSWORD=your-cms-user-password
npm run test:cms-api
```

If credentials are missing, the script skips live protected tests and still checks unauthenticated route behavior.

The audit log smoke check is permission-aware:

- Users with `audit_logs.view` must receive a successful paginated audit response.
- Users without `audit_logs.view` must receive `403 FORBIDDEN`.

## Known Limitations

- No CMS CRUD endpoints yet.
- No CMS frontend yet.
- No media upload endpoint yet.
- No approval workflows.
- No detailed audit diff endpoint.
- Navigation icons are not included yet; the frontend can map icons by `key`.

## What Is Postponed

- Products CRUD
- Events CRUD
- Destinations CRUD
- Promotions CRUD
- Business/accreditation management APIs
- Museum management APIs
- Inquiry response APIs
- Newsletter management APIs
- Media upload/archive APIs
- User and role management APIs
- Approval workflows

## Next Phase Recommendation

Phase 07E should either:

1. Build the CMS frontend login and protected shell, using `/auth/login`, `/auth/me`, and `/cms/navigation`; or
2. Build CMS dashboard frontend against `/cms/dashboard`; or
3. Start the first protected CMS CRUD group, preferably products or content management.
