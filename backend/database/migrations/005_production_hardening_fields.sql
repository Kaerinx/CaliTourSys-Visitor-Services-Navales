ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

ALTER TABLE application_documents
  ADD COLUMN IF NOT EXISTS file_checksum VARCHAR(128);
