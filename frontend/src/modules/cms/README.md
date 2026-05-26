# CMS Frontend Module

Scope: Phase 07F - CMS frontend shell and auth integration.

This module contains the first Vue CMS foundation for CaliTourSys. It is isolated under `/cms` and does not modify the completed public website routes under `/promotion`.

## Routes

- `/cms/login`
- `/cms/dashboard`
- `/cms/unauthorized`
- `/cms/*` CMS-only not found placeholder

Future CMS CRUD pages are intentionally not implemented in this phase.

## Auth Flow

- Login submits to `POST /api/v1/auth/login`.
- The access token is kept in Pinia state and mirrored to `sessionStorage` for development refresh behavior.
- Passwords are never stored.
- Authenticated API calls use `Authorization: Bearer <accessToken>`.
- `POST /api/v1/auth/refresh` is used during route bootstrap when possible.
- Logout calls `POST /api/v1/auth/logout`, clears local auth state, and redirects to `/cms/login`.

The backend httpOnly refresh cookie remains the preferred session recovery mechanism. The `sessionStorage` access token is a development convenience and should be reviewed before deployment hardening.

## Permission Navigation

The CMS layout tries `GET /api/v1/cms/navigation` first. If that fails, it falls back to a local permission map.

Navigation items are filtered by permissions such as:

- `dashboard.view`
- `promotions.view`
- `events.view`
- `products.view`
- `destinations.view`
- `businesses.view`
- `map_locations.view`
- `museum.view`
- `media.view`
- `inquiries.view`
- `newsletter.view`
- `users.view`
- `roles.view`
- `audit_logs.view`

## Files Created

- `components/CmsSidebar.vue`
- `components/CmsTopbar.vue`
- `components/CmsStatCard.vue`
- `components/CmsQuickActionCard.vue`
- `components/CmsRecentActivity.vue`
- `components/CmsPermissionGate.vue`
- `layouts/CmsLayout.vue`
- `views/CmsLoginView.vue`
- `views/CmsDashboardView.vue`
- `views/CmsUnauthorizedView.vue`
- `views/CmsNotFoundView.vue`
- `services/authApi.js`
- `services/cmsApi.js`
- `stores/authStore.js`
- `routes.js`
- `index.js`

## How To Test

Run backend:

```powershell
cd backend
npm run dev
```

Run frontend:

```powershell
cd frontend
npm run dev
```

Manual checks:

- open `/cms/login`
- try invalid credentials
- login with a CMS user
- confirm redirect to `/cms/dashboard`
- refresh `/cms/dashboard`
- confirm sidebar items match permissions
- open `/cms/unauthorized`
- logout
- confirm `/promotion`, `/promotion/products`, and `/promotion/map` still work

## Postponed

- CMS CRUD pages
- content forms
- media upload UI
- approval workflows
- user creation UI
- password reset and two-factor UI
