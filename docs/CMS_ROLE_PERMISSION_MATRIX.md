# CMS Role Permission Matrix

Project: CaliTourSys / CallTourSys
Phase: 07A - CMS Planning

## Role Definitions

| Role | Purpose |
|---|---|
| System Administrator | Owns system setup, users, roles, permissions, audit access, and emergency content control. |
| Tourism Officer | Senior tourism office role that can publish/archive official public content and review operational records. |
| Tourism Staff | Operational staff role for day-to-day content drafting, inquiry triage, and media preparation. |
| Content Editor | Content-focused role for drafting and editing website content without user administration. |
| Viewer/Read-only Staff | Can view CMS data for monitoring but cannot make content changes. |

## Permission Matrix

Legend:

- Full: create, read, update, publish/archive where applicable
- Edit: create and update drafts, no publish/archive
- View: read only
- None: no access

| Permission Area | System Administrator | Tourism Officer | Tourism Staff | Content Editor | Viewer/Read-only Staff |
|---|---|---|---|---|---|
| Dashboard access | Full | Full | View | View | View |
| Manage promotions | Full | Full | Edit | Edit | View |
| Manage events | Full | Full | Edit | Edit | View |
| Manage products | Full | Full | Edit | Edit | View |
| Manage businesses/producers | Full | Full | Edit | Edit | View |
| Manage destinations | Full | Full | Edit | Edit | View |
| Manage map locations | Full | Full | Edit | Edit | View |
| Manage museum artifacts | Full | Full | Edit | Edit | View |
| Manage media | Full | Full | Edit | Edit | View |
| View inquiries | Full | Full | Full | View | View |
| Respond to inquiries | Full | Full | Edit | None | None |
| View newsletter subscribers | Full | Full | View | None | View |
| Publish content | Full | Full | None | None | None |
| Archive content | Full | Full | None | None | None |
| Manage users | Full | None | None | None | None |
| Manage roles/permissions | Full | None | None | None | None |
| View audit logs | Full | View | None | None | None |

## Suggested Permission Keys

Backend RBAC should use explicit permission keys rather than role names directly.

Examples:

- `dashboard.view`
- `promotions.view`
- `promotions.create`
- `promotions.update`
- `promotions.publish`
- `promotions.archive`
- `events.view`
- `events.create`
- `events.update`
- `events.publish`
- `events.archive`
- `products.view`
- `products.create`
- `products.update`
- `products.publish`
- `products.archive`
- `businesses.view`
- `businesses.create`
- `businesses.update`
- `destinations.view`
- `destinations.create`
- `destinations.update`
- `map_locations.view`
- `map_locations.create`
- `map_locations.update`
- `museum.view`
- `museum.create`
- `museum.update`
- `media.view`
- `media.upload`
- `media.update`
- `media.archive`
- `inquiries.view`
- `inquiries.respond`
- `inquiries.update_status`
- `newsletter.view`
- `users.manage`
- `roles.manage`
- `audit_logs.view`

## Authorization Rules

- Frontend route guards should check authenticated user and permission hints.
- Backend middleware must enforce every permission.
- Publishing and archiving should be separate permissions from editing.
- Read-only staff must not receive write UI controls and must still be blocked by backend write permissions.
- Audit log access should be limited to System Administrator and Tourism Officer.
- User management should be restricted to System Administrator.

## First CMS Release Recommendation

Seed roles and permissions during a controlled migration or admin setup command. Do not allow public self-registration.

Initial user creation should be handled by a secure administrative setup process, not by a public endpoint.
