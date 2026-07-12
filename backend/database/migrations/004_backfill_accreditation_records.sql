INSERT INTO accreditation_records (
  record_number,
  application_id,
  business_profile_id,
  issued_by,
  issued_at,
  expires_at,
  status,
  notes
)
SELECT
  REPLACE(a.application_number, 'APP', 'ACC'),
  a.id,
  a.business_profile_id,
  a.reviewed_by,
  COALESCE(a.reviewed_at, a.updated_at, NOW()),
  COALESCE(a.reviewed_at, a.updated_at, NOW()) + INTERVAL '1 year',
  'active',
  COALESCE(a.review_remarks, a.remarks)
FROM accreditation_applications a
WHERE a.status = 'approved'
ON CONFLICT (application_id) DO NOTHING;
