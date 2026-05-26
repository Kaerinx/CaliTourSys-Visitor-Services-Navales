# CMS Frontend Module

Scope: CMS frontend shell/auth integration plus Phase 07G-1 core content pages.

This module is isolated under `/cms`. Public `/promotion` routes are intentionally left untouched by CMS page work.

## Routes

- `/cms/login`
- `/cms/dashboard`
- `/cms/unauthorized`
- `/cms/promotions`
- `/cms/events`
- `/cms/categories`
- `/cms/categories/events`
- `/cms/categories/products`
- `/cms/categories/destinations`
- `/cms/categories/museum`
- `/cms/*` CMS-only not found placeholder

## Phase 07G-1 Pages

- Promotions list and form
- Events list and form
- Category landing page
- Event categories
- Product categories
- Destination categories
- Museum categories

## API Services Used

`services/cmsContentApi.js` centralizes protected CMS content API calls:

- promotions: list, detail, create, update, publish, archive
- events: list, detail, create, update, publish, archive
- event categories: list, create, update
- product categories: list, create, update
- destination categories: list, create, update
- museum categories: list, create, update

All methods use the shared HTTP client and existing CMS auth token handling.

## Permissions Used

- Promotions page: `promotions.view`
- Promotion create: `promotions.create`
- Promotion edit: `promotions.update`
- Promotion publish: `promotions.publish`
- Promotion archive: `promotions.archive`
- Events page: `events.view`
- Event create: `events.create`
- Event edit/category write: `events.update`
- Event publish: `events.publish`
- Event archive: `events.archive`
- Product category page: `products.view`
- Product category write: `products.update`
- Destination category page: `destinations.view`
- Destination category write: `destinations.update`
- Museum category page: `museum.view`
- Museum category write: `museum.update`
- Category landing page: any of `events.view`, `products.view`, `destinations.view`, `museum.view`

Frontend buttons are hidden by permission, while backend RBAC remains the final authority.

## Shared UI Components

- `components/content/CmsContentToolbar.vue`
- `components/content/CmsDataTable.vue`
- `components/content/CmsStatusBadge.vue`
- `components/content/CmsPagination.vue`
- `components/content/CmsConfirmDialog.vue`
- `components/content/CmsPromotionForm.vue`
- `components/content/CmsEventForm.vue`
- `components/content/CmsCategoryForm.vue`
- `components/content/CmsCategoryManager.vue`

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
- login with a CMS user
- open `/cms/promotions`
- create a promotion draft
- edit the promotion
- publish the promotion
- archive the promotion
- open `/cms/events`
- create an event draft with a category
- edit the event
- publish and archive the event
- open `/cms/categories`
- open each category page
- create and edit event, product, destination, and museum categories
- test duplicate slug handling
- confirm buttons hide for users without matching permissions
- refresh a CMS page and confirm auth bootstrap still works
- confirm public routes still work: `/promotion`, `/promotion/events`, `/promotion/products`, `/promotion/map`

## Postponed

- Phase 07G-2 pages
- product, destination, museum artifact, business, map location, media, inquiry, newsletter, users, roles, and audit-log CMS pages
- approval workflows
- business owner portal
- media binary upload
- visitor-facing auth API wiring
- dedicated category permissions beyond the current backend module permissions

## Notes

The events API does not currently expose a server-side category filter. The event category filter is applied to the currently loaded page of results until the API contract adds `categoryId` filtering for `/cms/events`.
