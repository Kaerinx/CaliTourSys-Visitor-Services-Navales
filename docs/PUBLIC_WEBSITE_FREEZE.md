# Public Website Freeze Note

Project: CaliTourSys / CallTourSys
Scope: Public Facing Website only
Freeze phase: End of Phase 06

## Freeze Purpose

This note defines the public website surface that future CMS/admin/staff/officer work should build on without accidentally breaking public visitor behavior.

## Finalized Public Pages

- Home / landing page: `/promotion`
- Events: `/promotion/events`
- Products / OTOP listing: `/promotion/products`
- Product detail: `/promotion/products/:slug`
- Tourist discovery: `/promotion/discovery`
- Tourist map: `/promotion/map`
- Destination alias route: `/promotion/destinations`
- Interactive museum: `/promotion/museum`
- Tourism inquiry: `/promotion/inquiry`

## Finalized Frontend Routes

The current public route group is mounted from `frontend/src/modules/promotion/routes.js`.

Future CMS routes should not be mixed into the public promotion route module unless they are explicitly public visitor pages. CMS/admin/staff/officer routes should use a separate route module and separate layout.

## Finalized Backend Public Endpoints

Base path: `/api/v1`

Public read endpoints:

- `GET /api/v1/health`
- `GET /api/v1/public/home`
- `GET /api/v1/public/promotions`
- `GET /api/v1/public/promotions/:slug`
- `GET /api/v1/public/events`
- `GET /api/v1/public/events/:slug`
- `GET /api/v1/public/event-categories`
- `GET /api/v1/public/products`
- `GET /api/v1/public/products/:slug`
- `GET /api/v1/public/product-categories`
- `GET /api/v1/public/businesses/:slug`
- `GET /api/v1/public/destinations`
- `GET /api/v1/public/destinations/:slug`
- `GET /api/v1/public/destination-categories`
- `GET /api/v1/public/map/locations`
- `GET /api/v1/public/museum/artifacts`
- `GET /api/v1/public/museum/artifacts/:slug`
- `GET /api/v1/public/museum/categories`

Public write endpoints:

- `POST /api/v1/public/itinerary/sessions`
- `GET /api/v1/public/itinerary/:sessionToken`
- `POST /api/v1/public/itinerary/:sessionToken/items`
- `DELETE /api/v1/public/itinerary/:sessionToken/items/:itemId`
- `POST /api/v1/public/inquiries`
- `POST /api/v1/public/newsletter-subscriptions`

## Stable Public Contracts

- Public API responses use the standard success/error envelope.
- Public list responses include pagination metadata where applicable.
- Public endpoints return only published/active public data by default.
- Public business contacts must only expose `is_public = true` records.
- Public accreditation display should use the latest verified accreditation record.
- Itinerary sessions are anonymous public session tokens, not login tokens.

## What Should Not Change During CMS Start

- Do not change public API response shapes without versioning.
- Do not expose raw database tables through public endpoints.
- Do not add CMS/staff/officer workflow fields to public responses unless intentionally mapped.
- Do not move public routes into CMS route modules.
- Do not require login for public browsing, public inquiry, newsletter subscription, sharing, or anonymous itinerary.
- Do not remove the current public mock fallback behavior until the backend and data pipeline are stable in all target environments.

## What CMS Can Build On Later

- CMS content management can write into the existing public content tables.
- CMS publishing should control public `status`, `published_at`, `archived_at`, featured flags, media, map coordinates, categories, and display order.
- CMS can manage public business contacts while preserving `is_public` filtering.
- CMS can manage Mapbox-ready coordinates without requiring PostGIS in the current phase.
- Staff/officer review workflows can be added as separate workflow tables and APIs without changing public read models.

## Known Limitations At Freeze

- Data is still development/demo unless replaced with LGU-verified records.
- Mapbox requires a valid `VITE_MAPBOX_PUBLIC_TOKEN`.
- Map coordinates must be verified before real launch.
- Product pagination controls are visually present but not fully interactive yet.
- Mobile menu is intentionally disabled until a later navigation polish phase.
- Footer privacy/accessibility/social links need official destination URLs/pages before launch.
- Advanced analytics and share tracking are not implemented.

## Freeze Decision

The public-facing website can be frozen as the baseline for CMS planning. Future work should treat the public API contract, route structure, and service layer as stable integration boundaries.
