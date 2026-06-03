# Public Website QA Report

Project: CaliTourSys / CallTourSys
Phase: 06 - Full Public Website QA, Responsiveness, Accessibility, and Production Hardening
Scope: Public Facing Website only

## QA Scope

Reviewed the public Vue/Vite website, public Node/Express API contract behavior, public write actions, Mapbox discovery page integration, accessibility basics, production safety, and build/test readiness.

CMS, staff, officer, admin, authentication, roles, and approval workflows remain outside this QA scope.

## Public Pages Reviewed

- `/promotion`
- `/promotion/events`
- `/promotion/products`
- `/promotion/products/:slug`
- `/promotion/discovery`
- `/promotion/map`
- `/promotion/museum`
- `/promotion/inquiry`

## Backend Endpoints Verified

- `GET /api/v1/health`
- `GET /api/v1/public/home`
- `GET /api/v1/public/products`
- `GET /api/v1/public/events`
- `GET /api/v1/public/destinations`
- `GET /api/v1/public/map/locations?format=geojson`
- `GET /api/v1/public/museum/artifacts`
- `POST /api/v1/public/inquiries`
- `POST /api/v1/public/newsletter-subscriptions`
- `POST /api/v1/public/itinerary/sessions`

## Verification Results

- Frontend production build: passed.
- Backend syntax check: passed.
- Public API smoke test: passed, 14/14 checks.
- Public API response envelope: verified by smoke script.
- Public write flows: itinerary, inquiry, newsletter verified by smoke script.
- Map endpoint: verified by smoke script for list and GeoJSON formats.

## Responsiveness Results

- Product detail, inquiry form, and Mapbox discovery layouts include responsive fallbacks.
- Product detail suggested-products grid collapses from desktop to tablet and mobile.
- Inquiry form uses border-box sizing to prevent input/button overflow.
- Map page keeps a full-height map on mobile and keeps the search/list panel usable as a bottom panel.
- Floating itinerary remains available on promotion routes.

## Accessibility Findings

Fixed:

- Added explicit `type="button"` to public action buttons that should not submit forms.
- Disabled future mobile menu controls and added explanatory titles.
- Replaced placeholder `href="#"` footer links with non-navigating disabled link semantics.
- Improved filter rows on the map page with keyboard support and `role="checkbox"`.
- Added `aria-expanded` and `aria-controls` to the floating itinerary trigger.
- Removed a pasted checkmark glyph from product cards and replaced it with CSS-generated visual confirmation.

Remaining limitations:

- Footer social/privacy/accessibility links are placeholders until official LGU URLs/pages exist.
- A full automated accessibility scan is not yet configured.
- Mapbox marker keyboard behavior exists, but final QA should be performed with a real Mapbox token in a browser.

## Bugs Found

- Product inquiry page fields/buttons could overflow their card on some viewport widths.
- Product detail producer contact action did not open the expected modal.
- Product detail thumbnails were decorative rather than functional.
- Product detail did not show related product suggestions.
- Product list pagination buttons looked interactive but were static.
- Some public buttons lacked explicit `type`, risking accidental form submission if moved into forms.
- Footer placeholder links used `href="#"`.
- Map page duplicated selected-location information between Mapbox popup and side card.
- Mapbox token failure states were too generic.

## Bugs Fixed

- Inquiry page layout overflow fixed.
- Product contact producer modal added and connected to inquiry API.
- Product gallery thumbnails made functional.
- Related product section added using backend `relatedProducts`.
- Product pagination buttons marked disabled until real pagination is implemented.
- Public static/future buttons hardened with explicit types and disabled states.
- Placeholder footer links no longer navigate to `#`.
- Mapbox popup duplication removed in favor of a single selected-location card.
- Mapbox missing/invalid/rejected token states clarified.
- Mapbox marker cleanup, resize handling, and filter marker sync were refined.

## Security / Production Readiness

- No backend secrets are exposed in frontend source.
- Mapbox token is read from `VITE_MAPBOX_PUBLIC_TOKEN`; it is not hardcoded in source.
- API base URL is read from `VITE_API_BASE_URL`.
- Root `.gitignore` excludes `.env` and `.env.*`, while allowing `.env.example`.
- No `v-html` usage found in public source.
- No `console.log` usage found in public source.
- Backend smoke test confirms standardized public error envelopes.

## Performance Findings

- Mapbox GL JS creates a large route chunk. Current build passes but Vite reports a chunk-size warning.
- This is acceptable for the current phase because the Mapbox page is route-loaded, but Phase 06/07 polish can consider deeper dynamic import of `mapbox-gl`.
- No repeated Mapbox initialization path was found; the component owns and cleans up the map instance.

## Known Limitations

- Real production Mapbox behavior requires a valid public Mapbox token.
- Map coordinates are development/seed placeholders until LGU-verified coordinates are entered.
- Mobile menu is intentionally disabled pending a later navigation polish phase.
- Product list pagination is visually present but not yet backed by frontend page-changing behavior.
- Footer privacy/accessibility pages are not built yet.
- CMS/admin/staff/officer capabilities are intentionally excluded.

## Production Blockers

- A real Mapbox public token is required for live map rendering.
- LGU-verified content, media, coordinates, and contact information must replace development seed/demo data before production.
- Official privacy and accessibility pages/links should exist before public launch.

## Safe To Postpone

- CMS/admin/staff/officer pages.
- Authentication, users, roles, and approval workflows.
- Advanced Mapbox clustering, routing, directions, and custom layers.
- Full automated accessibility test suite.
- Real paginated product UI controls.

## Readiness Decision

The public-facing website is ready for a feature freeze at the current public prototype/integration level, provided the known production blockers are tracked before real deployment.

The project is ready to begin CMS planning after confirmation, with the public website routes and API contracts treated as stable integration targets.
