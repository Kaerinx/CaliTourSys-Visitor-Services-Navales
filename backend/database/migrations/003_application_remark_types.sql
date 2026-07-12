ALTER TABLE accreditation_applications
  ADD COLUMN IF NOT EXISTS owner_remarks TEXT,
  ADD COLUMN IF NOT EXISTS review_remarks TEXT;

UPDATE accreditation_applications
SET owner_remarks = remarks
WHERE owner_remarks IS NULL
  AND status IN ('draft', 'submitted')
  AND remarks IS NOT NULL;

UPDATE accreditation_applications
SET review_remarks = remarks
WHERE review_remarks IS NULL
  AND status IN ('under_review', 'for_revision', 'approved', 'rejected')
  AND remarks IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_records_application_id
  ON accreditation_records(application_id);
