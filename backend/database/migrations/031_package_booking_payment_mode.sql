BEGIN;

ALTER TABLE package_booking_requests
  ADD COLUMN IF NOT EXISTS payment_mode varchar(30);

UPDATE package_booking_requests
SET payment_mode = CASE
  WHEN selected_payment_method = 'cash' THEN 'pay_at_office'
  ELSE 'online'
END
WHERE payment_mode IS NULL;

ALTER TABLE package_booking_requests
  ALTER COLUMN payment_mode SET DEFAULT 'online',
  ALTER COLUMN payment_mode SET NOT NULL,
  DROP CONSTRAINT IF EXISTS package_booking_payment_mode_valid,
  DROP CONSTRAINT IF EXISTS package_booking_deposit_extension_valid;

ALTER TABLE package_booking_requests
  ADD CONSTRAINT package_booking_payment_mode_valid
    CHECK (payment_mode IN ('pay_at_office', 'online')),
  ADD CONSTRAINT package_booking_deposit_extension_valid
    CHECK (
      deposit_due_at IS NULL
      OR payment_mode = 'pay_at_office'
      OR deposit_due_at <= created_at + interval '5 days'
    );

COMMIT;
