# Package Booking Rollout

Phase 6 QA results and the final production blockers are documented in `docs/PHASE_06_PACKAGE_BOOKING_QA_REPORT.md`.

## Development status

- Migration `030_package_booking_business_foundation.sql` was applied transactionally to the configured local `calitoursys_dev` database.
- All 10 existing booking IDs were verified before commit and remained present afterward.
- Fifteen existing packages received a numeric duration. Any remaining package without `duration_days` must be edited before it can pass Ready for Promotion review.
- The booking integration smoke test cleans up all temporary bookings, tourists, payments, credits, events, and audit rows that it creates.

## Required production preparation

1. Take a production database backup and test restoration.
2. Run `backend/database/migrations/030_package_booking_business_foundation.sql` in a transaction.
3. Verify existing booking count and IDs before committing.
4. Configure the frontend bank variables documented in `frontend/.env.example`.
5. Replace the temporary `frontend/src/assets/payments/tourism-office-qr-temporary.png` image with the official Tourism Office receiving QR. The current image identifies Francis Aracosta with an account ending in 9266 and is approved only as a temporary QR.
6. Schedule `npm run expire:package-bookings` from the backend directory. Run it at least hourly so overdue unpaid online bookings expire and release capacity.
7. Confirm the intended staff accounts have the new walk-in, schedule, deposit-extension, and credit-transfer permissions.

## Verification commands

From `backend`:

```powershell
npm run check
npm run test:booking-rules
npm run test:booking-integration
npm run test:public-api
npm run test:cms-operations-api
```

From `frontend`:

```powershell
npm run build
```

Authenticated CMS API smoke checks require `CMS_TEST_EMAIL` and `CMS_TEST_PASSWORD`. Do not store those credentials in source control.

## Business rules covered

- Online and walk-in booking sources.
- Inclusive start/end dates and editable duration.
- Capacity reservation and release on expiration.
- One payment representative and compact optional participant names.
- M/F booking genders.
- 50% deposit or full payment, with full payment required within three days of departure.
- Three-day online payment deadline and authorized extension up to five days.
- QR/InstaPay and bank transfer for online bookings; cash is also available for walk-ins.
- Electronic reference and proof requirements; cash does not require either.
- Split-payment totals and remaining balance.
- One-time, six-month same-customer and same-package cancellation credit transfer.
- Monthly `YYYYMM-TOUR-NNNNNN` booking references.
