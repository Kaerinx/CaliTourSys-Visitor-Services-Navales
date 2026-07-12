INSERT INTO users (
  first_name,
  last_name,
  email,
  password_hash,
  phone,
  role,
  status,
  email_verified_at
) VALUES
('System', 'Administrator', 'system.admin@tourism.gov.ph', '$2b$10$J6raAyuk4ja52jaBTHhQBeXK7Z4W6iNTWcyX8TEdlSu9M6KjhpeBO', '+63 900 000 0000', 'admin', 'active', NOW()),
('Maria', 'Santos', 'maria.santos@tourism.gov.ph', '$2b$10$J6raAyuk4ja52jaBTHhQBeXK7Z4W6iNTWcyX8TEdlSu9M6KjhpeBO', '+63 911 111 1111', 'tourism_staff', 'active', NOW()),
('John', 'Martinez', 'john@sunsetresort.com', '$2b$10$J6raAyuk4ja52jaBTHhQBeXK7Z4W6iNTWcyX8TEdlSu9M6KjhpeBO', '+63 912 345 6789', 'business_owner', 'active', NOW())
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
  updated_at = NOW();

INSERT INTO business_profiles (
  owner_id,
  business_name,
  business_type,
  business_permit_number,
  dti_sec_registration_number,
  region,
  province,
  city_municipality,
  barangay,
  street_address,
  zip_code
)
SELECT
  id,
  'Sunset Beach Resort',
  'Resort',
  'BP-2026-00124',
  'DTI-2026-7712',
  'Region V - Bicol Region',
  'Camarines Sur',
  'Calabanga',
  'San Francisco',
  'Zone 2, Coastal Road',
  '4405'
FROM users
WHERE email = 'john@sunsetresort.com'
  AND NOT EXISTS (
    SELECT 1 FROM business_profiles
    WHERE owner_id = users.id
      AND business_name = 'Sunset Beach Resort'
  );

INSERT INTO audit_logs (
  event_number,
  actor_name,
  actor_role,
  action,
  module,
  severity,
  reference_id,
  outcome,
  details
) VALUES
('AUD-2026-1057', 'Admin User', 'admin', 'Updated role permissions', 'Role Management', 'medium', 'ROLE-TOURISM-STAFF', 'Permissions saved', 'Tourism Staff permissions were updated.'),
('AUD-2026-1056', 'Maria Santos', 'tourism_staff', 'Approved APP-2026-001', 'Application Review', 'low', 'APP-2026-001', 'Application approved', 'Application review was completed.'),
('AUD-2026-1055', 'Ana Reyes', 'tourism_staff', 'Failed login attempt', 'Authentication', 'high', 'USER-STAFF-004', 'Login denied', 'Invalid password attempt.')
ON CONFLICT (event_number) DO NOTHING;

INSERT INTO notifications (
  role_target,
  title,
  message,
  type,
  reference_id,
  action_path,
  details,
  is_read
)
SELECT 'business_owner', 'Application Under Review', 'Your application APP-2026-001 is now under review.', 'info', 'APP-2026-001', '/accreditation/app/applications?application=APP-2026-001', 'Tourism staff has started checking the business information and submitted documents for this application.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Application Under Review' AND reference_id = 'APP-2026-001');

INSERT INTO notifications (
  role_target,
  title,
  message,
  type,
  reference_id,
  action_path,
  details,
  is_read
)
SELECT 'business_owner', 'Revision Needed', 'Please update your submitted document before resubmitting.', 'action_needed', 'APP-2026-003', '/accreditation/app/applications?application=APP-2026-003', 'One submitted document needs correction. Open the application details to review the document status.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Revision Needed' AND reference_id = 'APP-2026-003');

INSERT INTO notifications (
  role_target,
  title,
  message,
  type,
  reference_id,
  action_path,
  details,
  is_read
)
SELECT 'tourism_staff', 'New Application Submitted', 'APP-2026-006 is ready for review.', 'action_needed', 'APP-2026-006', '/accreditation/app/review?application=APP-2026-006', 'A new business accreditation application has been submitted and is waiting for staff review.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'New Application Submitted' AND reference_id = 'APP-2026-006');

INSERT INTO notifications (
  role_target,
  title,
  message,
  type,
  reference_id,
  action_path,
  details,
  is_read
)
SELECT 'admin', 'Failed Login Attempt', 'A staff account had a failed login attempt today.', 'urgent', 'AUD-2026-1055', '/accreditation/app/audit?event=AUD-2026-1055', 'Review the audit log entry to see the affected account, module, and outcome.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Failed Login Attempt' AND reference_id = 'AUD-2026-1055');
