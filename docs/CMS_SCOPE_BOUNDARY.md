# CMS Scope Boundary

Project: CaliTourSys / CallTourSys
Phase: 07A - CMS Planning

## Purpose

This document separates the frozen public website scope from the future CMS scope and later workflow-heavy phases. It exists to prevent route, API, and database responsibilities from blending together.

## Current Public Website Scope

The public website is visitor-facing and remains available without login.

Public frontend routes:

- `/promotion`
- `/promotion/events`
- `/promotion/products`
- `/promotion/products/:slug`
- `/promotion/discovery`
- `/promotion/map`
- `/promotion/destinations`
- `/promotion/museum`
- `/promotion/inquiry`

Public API namespace:

- `/api/v1/public/...`

Public website responsibilities:

- Read-only public content browsing.
- Published promotions display.
- Published events display.
- Published products / OTOP display.
- Published destinations display.
- Public business/producer profile display.
- Public map browsing.
- Public museum browsing.
- Anonymous itinerary sessions.
- Public inquiry submission.
- Newsletter subscription submission.
- Sharing through browser/native/clipboard behavior.

Public website must not:

- Require staff login.
- Expose draft content.
- Expose staff-only workflow state.
- Expose raw database tables.
- Manage users, roles, permissions, or approvals.

## CMS Phase Scope

The CMS is an authenticated staff workspace that manages public website content.

Future CMS frontend routes:

- `/cms/login`
- `/cms/dashboard`
- `/cms/promotions`
- `/cms/events`
- `/cms/products`
- `/cms/destinations`
- `/cms/businesses`
- `/cms/map-locations`
- `/cms/museum`
- `/cms/media`
- `/cms/inquiries`
- `/cms/newsletter`
- `/cms/audit-logs`
- `/cms/users`

CMS API namespace:

- `/api/v1/cms/...`

Auth API namespace:

- `/api/v1/auth/...`

CMS responsibilities:

- Staff login.
- Staff session management.
- Role-based access control.
- Dashboard overview.
- Content management.
- Event management.
- OTOP product management.
- Destination management.
- Business/producer profile management.
- Public map location management.
- Museum artifact management.
- Media management.
- Inquiry viewing and response preparation.
- Newsletter subscriber viewing.
- Publish/archive workflows.
- Content audit logging.

CMS phase must preserve:

- Public route stability.
- Public API response contract.
- Public status filtering.
- Public website no-login behavior.
- Existing public service layer assumptions.

## Later Future Phases

The following are intentionally postponed beyond the first CMS release:

- Full accreditation workflow.
- Officer review workflow.
- Multi-step content approval workflow.
- Business owner portal.
- Product submission portal.
- Accreditation application portal.
- Visitor monitoring dashboard.
- Analytics dashboard.
- Advanced reports.
- Full notification system.
- SMS/email notification automation.
- Public share analytics.
- Content version comparison UI.
- PostGIS migration.

## Boundary Rules

- Public APIs remain under `/api/v1/public`.
- CMS APIs go under `/api/v1/cms`.
- Auth APIs go under `/api/v1/auth`.
- Public routes remain under `/promotion`.
- CMS routes go under `/cms`.
- CMS tables may reference public content tables, but public read models must remain stable.
- CMS draft/review/approval fields must not leak to public API responses.
- The CMS may manage existing public tables through authenticated APIs.
- The public website must not call CMS APIs.

## Data Visibility Rules

Public website can read:

- published products
- published events
- published destinations
- published promotions
- published museum artifacts
- active businesses
- public business contacts only
- published map locations

CMS can read:

- draft content
- published content
- archived content
- internal audit metadata
- staff-only content management metadata
- inquiry status and internal response preparation data

## Freeze Protection

During CMS implementation, avoid changing:

- `frontend/src/modules/promotion/routes.js`
- public API route names
- public response envelope
- public service method names used by Vue pages
- public content filtering rules
- anonymous itinerary behavior

If a public contract must change, introduce a versioned API change and document migration steps.
