# Phase 6 Package Booking QA and Production-Readiness Report

Date: July 14, 2026
Scope: Package booking business-rule changes from Phases 1-5

## Readiness decision

The modified package booking system is ready for adviser review and local/UAT use. The online tourist flow, walk-in staff flow, split-payment rules, editable schedules, cancellation credit transfer, booking references, and temporary QR display were verified against the local development database and running Vue application.

This is not approval to deploy to production. Complete the production blockers below first.

## End-to-end UI checks completed

- Public package list and package detail display duration, pax, and pricing.
- Protected booking redirects preserve the selected package, date, pax, duration, and payment choice after tourist sign-in or registration.
- The booking form requires one representative and stores total pax separately.
- Optional participant names use compact single rows, each with only M/F gender options.
- Online payment offers 50% deposit or full payment and QR/InstaPay or bank transfer.
- The temporary InstaPay QR is displayed with recipient confirmation for Francis Aracosta, account ending in 9266.
- Tourist dashboard and booking detail show the correct amount due now, payment status, deadlines, and date-change form.
- Date-only values remain on the intended calendar day in both tourist and staff edit forms.
- Staff Package Bookings exposes walk-in source, cash/QR/bank methods, M/F gender, compact participants, schedule editing, deposit extension, payment recording, cancellation, and credit transfer.
- Walk-in cash explicitly requires no electronic reference or proof.
- Staff payment recording defaults to the 50% initial amount for an unpaid deposit booking and includes applied booking credit in remaining totals.

No real payment or proof of payment was submitted during QA.

## Defects fixed during Phase 6

1. Corrected `frontend/.env.example` to use the current `/api/v1` backend base URL.
2. Preserved protected package-booking redirects after tourist login and registration.
3. Separated inquiry, booking creation, booking lookup, and payment-proof rate-limit buckets so unrelated traffic cannot block booking actions.
4. Corrected tourist dashboard and staff payment defaults to use the amount currently due instead of the full package total.
5. Normalized PostgreSQL date-only fields before API serialization to prevent one-day timezone shifts.
6. Exposed applied cancellation credit in staff payment totals.
7. Added local fixture cleanup to the public API smoke test.

## Automated verification

- Backend syntax check: passed.
- Booking business-rule tests: 9/9 passed.
- Package booking integration smoke test: passed.
  - `YYYYMM-TOUR-NNNNNN` reference format
  - 50% deposit and remaining balance
  - deadline extension
  - date-change approval without timezone shift
  - cancellation credit transfer and staff credit totals
  - walk-in cash
- Public API smoke test: 14/14 passed and cleans its local fixtures.
- CMS operations unauthenticated checks: 2/2 passed.
- Staff authentication and Package Bookings UI were verified with a disposable local system-admin account.
- Frontend production build: passed.
- `git diff --check`: passed; only line-ending conversion warnings were reported.

## Local database safety

- The disposable Phase 6 booking, tourist, staff user, related payment/event records, and audit records were removed.
- Existing booking records were not edited or deleted.
- Final preserved booking count: 11.
- Temporary QA tourists and staff: 0.
- Orphan payments: 0.
- Orphan booking credits: 0.
- One existing tourism package still has no numeric `duration_days` and requires an authorized manual edit.

## Production blockers

1. Back up the production database and verify restoration before migration.
2. Apply migration `030_package_booking_business_foundation.sql` transactionally and compare booking IDs/counts before commit.
3. Replace the temporary personal QR with the official Tourism Office receiving QR.
4. Configure and verify the official bank name, account name, and account number through frontend production environment variables.
5. Edit the remaining package with no numeric duration.
6. Schedule `npm run expire:package-bookings` at least hourly.
7. Confirm production staff accounts and permissions for walk-in creation, schedule changes, deadline extension, payment review, cancellation, and credit transfer.
8. Run a controlled UAT payment using the official QR/bank account and verify proof upload, staff review, and receipt/status wording.

## Recommended next action

Conduct adviser/user acceptance testing using test bookings only. After written approval and completion of every production blocker, prepare a separate deployment runbook and production change window.
