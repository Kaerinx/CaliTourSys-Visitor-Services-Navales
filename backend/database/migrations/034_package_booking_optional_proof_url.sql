BEGIN;

ALTER TABLE package_booking_payments
  DROP CONSTRAINT IF EXISTS package_booking_electronic_payment_evidence;

ALTER TABLE package_booking_payments
  ADD CONSTRAINT package_booking_electronic_payment_evidence
    CHECK (
      is_legacy
      OR payment_method = 'cash'
      OR (
        payment_method IN ('qr_instapay', 'credit_debit_card', 'bank_transfer', 'legacy_electronic')
        AND NULLIF(trim(transaction_reference), '') IS NOT NULL
      )
    );

COMMIT;
