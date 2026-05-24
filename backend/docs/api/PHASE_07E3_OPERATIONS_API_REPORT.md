# Phase 07E-3 CMS Operations API Report

Project: CaliTourSys / CallTourSys  
Phase: 07E-3 - CMS Operations APIs  
Scope: Protected CMS backend API only

## Summary

Phase 07E-3 adds protected CMS operations APIs for media metadata, public inquiries, newsletter subscribers, safe user and role views, role assignment, and audit log detail. Public website APIs and frontend code were not changed.

## Files Created

- `backend/src/modules/cms/operations/operations.routes.js`
- `backend/src/modules/cms/operations/operations.controller.js`
- `backend/src/modules/cms/operations/operations.service.js`
- `backend/src/modules/cms/operations/operations.repository.js`
- `backend/src/modules/cms/operations/operations.validators.js`
- `backend/scripts/smoke-cms-operations-api.js`
- `backend/docs/api/PHASE_07E3_OPERATIONS_API_REPORT.md`

## Files Modified

- `backend/src/modules/cms/cms.routes.js`
- `backend/package.json`
- `backend/docs/api/CMS_API_CONTRACT.md`
- `backend/docs/api/openapi.cms.yaml`

## Endpoints Implemented

Media:

- `GET /api/v1/cms/media`
- `POST /api/v1/cms/media`
- `GET /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id`
- `PATCH /api/v1/cms/media/:id/archive`

Inquiries:

- `GET /api/v1/cms/inquiries`
- `GET /api/v1/cms/inquiries/:id`
- `PATCH /api/v1/cms/inquiries/:id/status`
- `POST /api/v1/cms/inquiries/:id/responses`
- `GET /api/v1/cms/inquiries/:id/responses`

Newsletter:

- `GET /api/v1/cms/newsletter-subscribers`
- `PATCH /api/v1/cms/newsletter-subscribers/:id/status`

Users and roles:

- `GET /api/v1/cms/users`
- `GET /api/v1/cms/users/:id`
- `PATCH /api/v1/cms/users/:id/status`
- `GET /api/v1/cms/roles`
- `GET /api/v1/cms/permissions`
- `PATCH /api/v1/cms/users/:id/roles`

Audit logs:

- `GET /api/v1/cms/audit-logs`
- `GET /api/v1/cms/audit-logs/:id`

## Permissions Used

- Media: `media.view`, `media.upload`, `media.archive`
- Inquiries: `inquiries.view`, `inquiries.respond`
- Newsletter: `newsletter.view`
- Users: `users.view`, `users.manage`
- Roles and permissions: `roles.view`, `roles.manage`
- Audit logs: `audit_logs.view`

`PATCH /cms/users/:id/roles` requires both `users.manage` and `roles.manage`.

## Audit Logging

Audit logging was added for:

- media create/update/archive
- inquiry status update
- inquiry response creation
- newsletter status update
- user status update
- user role changes as `permission_change`

Audit log detail responses sanitize before/after values by removing keys containing password, token, secret, or hash.

## Validation Rules

- UUID route params are validated.
- Pagination is capped at `limit <= 100`.
- Media status and storage provider enums are validated.
- Inquiry, newsletter, and user status enums are validated.
- Inquiry response message is required and length-limited.
- User role assignment requires an array of UUID role IDs.
- Unknown request body fields are rejected where practical.

## Security Decisions

- All operations routes require Bearer access token authentication.
- All routes require permission-based authorization.
- CMS routes use `Cache-Control: no-store`.
- User responses never include `password_hash`.
- Auth session records and token hashes are not exposed.
- Binary file upload and email sending are intentionally not implemented.
- SQL values are parameterized.

## Testing Instructions

Run syntax and module checks:

```powershell
cd backend
npm run check
```

Run the operations smoke test:

```powershell
cd backend
$env:CMS_TEST_EMAIL="your-cms-user-email"
$env:CMS_TEST_PASSWORD="your-cms-user-password"
npm run test:cms-operations-api
```

## Known Limitations

- Media API creates metadata records only; binary upload and cloud provider integration are postponed.
- Inquiry response API stores response records only; no real email is sent.
- User creation remains limited to the bootstrap script.
- Last-admin role removal protection is documented as a TODO for the user management hardening phase.
- PATCH endpoints do not currently clear nullable fields to `NULL`.

## Next Phase Recommendation

Proceed to Phase 07F after the operations smoke test passes. Phase 07F should focus on CMS frontend authentication shell and dashboard integration, or on additional backend hardening if preferred.
