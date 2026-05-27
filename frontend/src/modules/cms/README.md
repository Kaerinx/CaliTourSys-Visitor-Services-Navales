# CMS Frontend Module

Scope: CMS frontend shell/auth integration plus Phase 07G-1 and Phase 07G-2 content pages.

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
- `/cms/products`
- `/cms/destinations`
- `/cms/businesses`
- `/cms/museum`
- `/cms/map-locations`
- `/cms/*` CMS-only not found placeholder

## Phase 07G-1 Pages

- Promotions list and form
- Events list and form
- Category landing page
- Event categories
- Product categories
- Destination categories
- Museum categories

## Phase 07G-2 Pages

- Products / OTOP
- Destinations
- Businesses / Producers
- Museum artifacts
- Map locations

## API Services Used

`services/cmsContentApi.js` centralizes protected CMS content API calls:

- promotions: list, detail, create, update, publish, archive
- events: list, detail, create, update, publish, archive
- event categories: list, create, update
- product categories: list, create, update
- destination categories: list, create, update
- museum categories: list, create, update
- products: list, detail, create, update, publish, archive
- destinations: list, detail, create, update, publish, archive
- businesses: list, detail, create, update
- museum artifacts: list, detail, create, update, publish, archive
- map locations: list, detail, create, update, delete

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
- Products page: `products.view`
- Product create/edit/publish/archive: `products.create`, `products.update`, `products.publish`, `products.archive`
- Destinations page: `destinations.view`
- Destination create/edit/publish/archive: `destinations.create`, `destinations.update`, `destinations.publish`, `destinations.archive`
- Businesses page: `businesses.view`
- Business create/edit: `businesses.create`, `businesses.update`
- Museum artifacts page: `museum.view`
- Museum artifact create/edit/publish/archive: `museum.create`, `museum.update`, `museum.publish`, `museum.archive`
- Map locations page: `map_locations.view`
- Map location create/edit/delete: `map_locations.create`, `map_locations.update`

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
- `components/content/CmsProductForm.vue`
- `components/content/CmsDestinationForm.vue`
- `components/content/CmsBusinessForm.vue`
- `components/content/CmsMuseumArtifactForm.vue`
- `components/content/CmsMapLocationForm.vue`
- `components/content/CmsImagePreviewField.vue`
- `components/content/CmsCoordinateField.vue`
- `components/content/CmsRelationSelect.vue`

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
- open `/cms/products`
- create, edit, publish, and archive a product
- open `/cms/destinations`
- create, edit, publish, and archive a destination
- open `/cms/businesses`
- create and edit a business
- open `/cms/museum`
- create, edit, publish, and archive a museum artifact
- open `/cms/map-locations`
- create, edit, and delete a map location
- test invalid coordinates and map target validation
- test duplicate slug handling
- confirm buttons hide for users without matching permissions
- refresh a CMS page and confirm auth bootstrap still works
- confirm public routes still work: `/promotion`, `/promotion/events`, `/promotion/products`, `/promotion/map`

## Postponed

- Phase 07G-3 pages
- media, inquiry, newsletter, users, roles, reports, and audit-log CMS pages
- approval workflows
- business owner portal
- media binary upload
- visitor-facing auth API wiring
- dedicated category permissions beyond the current backend module permissions

## Notes

The events API does not currently expose a server-side category filter. The event category filter is applied to the currently loaded page of results until the API contract adds `categoryId` filtering for `/cms/events`.

Map location list records expose target IDs but not joined target labels. The CMS displays the linked ID in the table until the backend list response includes joined destination/business/event names.
