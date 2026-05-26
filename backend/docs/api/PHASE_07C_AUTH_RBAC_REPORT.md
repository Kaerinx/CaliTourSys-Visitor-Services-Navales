# Phase 07C Auth/RBAC Report

Project: CaliTourSys / CallTourSys  
Scope: CMS authentication and RBAC backend foundation

## Files Created

- `backend/src/modules/auth/auth.routes.js`
- `backend/src/modules/auth/auth.controller.js`
- `backend/src/modules/auth/auth.service.js`
- `backend/src/modules/auth/auth.repository.js`
- `backend/src/modules/auth/auth.validators.js`
- `backend/src/middleware/authenticate.js`
- `backend/src/middleware/authorize.js`
- `backend/src/utils/password.js`
- `backend/src/utils/tokens.js`
- `backend/src/utils/cookies.js`
- `backend/src/utils/auditLogger.js`
- `backend/scripts/create-cms-user.js`
- `backend/scripts/smoke-auth-api.js`
- `backend/docs/api/AUTH_RBAC_CONTRACT.md`
- `backend/docs/api/PHASE_07C_AUTH_RBAC_REPORT.md`

## Files Modified

- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/src/app.js`
- `backend/src/config/env.js`
- `backend/src/routes/index.js`
- `backend/src/middleware/rateLimiters.js`

## Dependencies Added

- `bcrypt`
- `jsonwebtoken`
- `cookie-parser`

## Security Decisions

- Passwords are hashed with bcrypt.
- Access tokens are short-lived JWTs.
- Refresh tokens are opaque random strings.
- Only refresh token hashes are stored in `auth_sessions`.
- Refresh tokens are sent through an httpOnly cookie.
- Refresh tokens rotate on `/auth/refresh`.
- Logout revokes the active refresh session.
- Login attempts are rate-limited.
- Failed logins are audited and increment `failed_login_count`.
- Accounts can be temporarily locked using `locked_until`.
- Password hashes and token hashes are never returned by API responses.

## RBAC Behavior

- `authenticate` verifies access tokens and reloads the user from PostgreSQL.
- `authenticate` rejects inactive, pending, locked, and temporarily locked users.
- `authorize(...permissions)` checks `req.user.permissions`.
- RBAC middleware is ready for future CMS routes.
- Public routes do not use CMS RBAC.

## Bootstrap User Process

No default CMS users are seeded.

Use:

```powershell
$env:CMS_BOOTSTRAP_EMAIL="admin@example.com"
$env:CMS_BOOTSTRAP_PASSWORD="UseAStrongPassword123!"
$env:CMS_BOOTSTRAP_DISPLAY_NAME="System Administrator"
$env:CMS_BOOTSTRAP_ROLE_KEY="system_admin"
npm run create:cms-user
```

The script requires the CMS role seed to be applied first.

## Testing Instructions

Run syntax checks:

```powershell
npm run check
```

Run auth smoke tests without live credentials:

```powershell
npm run test:auth-api
```

Run live auth smoke tests:

```powershell
$env:CMS_TEST_EMAIL="admin@example.com"
$env:CMS_TEST_PASSWORD="UseAStrongPassword123!"
npm run test:auth-api
```

Backend must be running before smoke tests:

```powershell
npm run dev
```

## Known Limitations

- No password reset email flow yet.
- No two-factor authentication yet.
- No CMS frontend login screen yet.
- No CMS content CRUD endpoints yet.
- No approval workflow yet.
- No session device-management UI yet.

## What Is Postponed

- CMS dashboard API.
- CMS content management APIs.
- CMS frontend.
- Password reset emails.
- Two-factor authentication.
- Approval workflows.
- Business owner portal.

## Next Phase Recommendation

Before Phase 07D:

- Create the first CMS user using the bootstrap script.
- Manually test login, me, refresh, logout, and change-password.
- Decide whether Phase 07D should implement CMS dashboard read endpoints or CMS frontend login first.

