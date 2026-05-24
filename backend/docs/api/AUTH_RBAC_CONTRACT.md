# Auth and RBAC API Contract

Project: CaliTourSys / CallTourSys  
Phase: 07C - Auth/RBAC Backend Foundation  
Base path: `/api/v1`

This contract defines the CMS authentication and role-based authorization foundation. It does not define CMS content CRUD endpoints.

## Auth Strategy

The CMS uses:

- Password hashing with `bcrypt`.
- Short-lived JWT access tokens.
- Opaque random refresh tokens.
- Refresh token hashes stored in `auth_sessions.refresh_token_hash`.
- httpOnly refresh-token cookie named by `CMS_COOKIE_NAME`.
- Role and permission lookup from `roles`, `permissions`, `user_roles`, and `role_permissions`.

The public website APIs remain under `/api/v1/public/...` and do not use CMS auth.

## Token Strategy

Access token:

- JWT.
- Sent by clients with `Authorization: Bearer <token>`.
- Short-lived, controlled by `ACCESS_TOKEN_TTL`.
- Payload includes only `sub`, `email`, `roles`, `permissions`, `iat`, and `exp`.

Refresh token:

- Opaque random string from Node crypto.
- Stored in an httpOnly cookie.
- Stored in the database only as a SHA-256 hash.
- Rotated on refresh.
- Revoked on logout.

## Cookie Strategy

Cookie config is controlled by:

- `CMS_COOKIE_NAME`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `REFRESH_TOKEN_TTL_DAYS`

In production, cookies are forced secure.

## Standard Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "string",
    "timestamp": "ISO-8601 string"
  }
}
```

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication is required.",
    "details": []
  },
  "meta": {
    "requestId": "string",
    "timestamp": "ISO-8601 string"
  }
}
```

## Error Codes

- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `ACCOUNT_LOCKED`
- `ACCOUNT_INACTIVE`
- `TOKEN_EXPIRED`
- `SESSION_REVOKED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## Endpoints

### POST `/api/v1/auth/login`

Request:

```json
{
  "email": "staff@example.com",
  "password": "Password123!"
}
```

Behavior:

- Validates body.
- Looks up user by case-insensitive email.
- Rejects pending, inactive, locked, or temporarily locked accounts.
- Verifies password hash.
- Increments failed login count on failure.
- Temporarily locks after configured failed attempts.
- Creates an `auth_sessions` row with `refresh_token_hash`.
- Sets httpOnly refresh cookie.
- Logs `login` or `failed_login` to `content_audit_logs`.

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "user": {
      "id": "uuid",
      "email": "staff@example.com",
      "displayName": "Tourism Staff",
      "status": "active",
      "profile": {},
      "roles": ["tourism_staff"],
      "permissions": ["dashboard.view"]
    }
  },
  "meta": {
    "requestId": "req_demo",
    "timestamp": "2026-05-24T00:00:00.000Z"
  }
}
```

### POST `/api/v1/auth/logout`

Behavior:

- Reads refresh token from cookie or request body.
- Revokes matching active session if present.
- Clears refresh cookie.
- Logs `logout`.
- Returns an idempotent success response.

### POST `/api/v1/auth/refresh`

Behavior:

- Reads refresh token from cookie or optional `refreshToken` body field.
- Hashes incoming token and finds `auth_sessions`.
- Rejects revoked or expired sessions.
- Rotates refresh token.
- Sets a new httpOnly refresh cookie.
- Returns a new access token and user profile.

### GET `/api/v1/auth/me`

Headers:

```text
Authorization: Bearer <accessToken>
```

Behavior:

- Requires valid access token.
- Reloads the user, roles, and permissions from the database.
- Rejects inactive or locked users.
- Does not expose password hashes or token hashes.

### POST `/api/v1/auth/change-password`

Headers:

```text
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!"
}
```

Rules:

- New password minimum 12 characters.
- Requires uppercase, lowercase, number, and symbol.
- Revokes other active sessions.
- Clears refresh cookie.
- Logs `password_change`.

## RBAC Usage

Future CMS routes should use:

```js
authenticate
authorize('promotions.view')
authorize('products.update')
authorize('users.manage')
```

`authenticate` attaches:

```js
req.user = {
  id,
  email,
  displayName,
  roles,
  permissions,
  profile
}
```

`authorize` returns `403 FORBIDDEN` if any required permission is missing.

## Bootstrap User Creation

No default users are seeded in SQL.

Create the first CMS user with:

```powershell
$env:CMS_BOOTSTRAP_EMAIL="admin@example.com"
$env:CMS_BOOTSTRAP_PASSWORD="UseAStrongPassword123!"
$env:CMS_BOOTSTRAP_DISPLAY_NAME="System Administrator"
$env:CMS_BOOTSTRAP_ROLE_KEY="system_admin"
npm run create:cms-user
```

The script:

- Hashes the password.
- Assigns an existing seeded role.
- Refuses weak passwords.
- Refuses to overwrite an existing user.
- Does not print the password.

## Security Notes

- Do not commit real secrets.
- Do not log passwords, access tokens, refresh tokens, password hashes, or refresh token hashes.
- Use HTTPS and secure cookies in production.
- Keep login rate limiting enabled.
- Keep CORS credentials restricted to trusted frontend origins.
- Keep public and CMS APIs separated.

