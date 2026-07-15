BEGIN;

-- Credit/debit card is a new gateway-backed option. Bank transfer stays in
-- these constraints only so historical records remain valid and readable.
ALTER TABLE package_booking_requests
  DROP CONSTRAINT IF EXISTS package_booking_selected_payment_method_valid;

ALTER TABLE package_booking_requests
  ADD CONSTRAINT package_booking_selected_payment_method_valid
    CHECK (
      selected_payment_method IS NULL
      OR selected_payment_method IN (
        'cash',
        'qr_instapay',
        'credit_debit_card',
        'bank_transfer',
        'legacy_electronic'
      )
    );

ALTER TABLE package_booking_payments
  DROP CONSTRAINT IF EXISTS package_booking_payment_method_valid,
  DROP CONSTRAINT IF EXISTS package_booking_electronic_payment_evidence;

ALTER TABLE package_booking_payments
  ADD CONSTRAINT package_booking_payment_method_valid
    CHECK (
      payment_method IN (
        'cash',
        'qr_instapay',
        'credit_debit_card',
        'bank_transfer',
        'legacy_electronic'
      )
    ),
  ADD CONSTRAINT package_booking_electronic_payment_evidence
    CHECK (
      is_legacy
      OR payment_method = 'cash'
      OR (
        payment_method = 'credit_debit_card'
        AND NULLIF(trim(transaction_reference), '') IS NOT NULL
      )
      OR (
        payment_method IN ('qr_instapay', 'bank_transfer', 'legacy_electronic')
        AND NULLIF(trim(transaction_reference), '') IS NOT NULL
        AND NULLIF(trim(proof_file_url), '') IS NOT NULL
      )
    );

COMMIT;
