ALTER TABLE accreditation_applications
  ADD COLUMN IF NOT EXISTS dti_sec_registration_number VARCHAR(120);

ALTER TABLE accreditation_applications
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE accreditation_applications
  ALTER COLUMN submitted_at DROP NOT NULL;

ALTER TABLE accreditation_applications
  ALTER COLUMN submitted_at DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_application_type
  ON application_documents(application_id, document_type);
