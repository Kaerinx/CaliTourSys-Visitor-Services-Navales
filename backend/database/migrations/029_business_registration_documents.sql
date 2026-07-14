CREATE TABLE IF NOT EXISTS business_registration_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_registration_documents_type_valid CHECK (
    document_type IN ('business_permit', 'registration_certificate', 'representative_valid_id')
  ),
  CONSTRAINT business_registration_documents_profile_type_unique UNIQUE (
    business_profile_id,
    document_type
  )
);

CREATE INDEX IF NOT EXISTS idx_business_registration_documents_profile
  ON business_registration_documents (business_profile_id);
