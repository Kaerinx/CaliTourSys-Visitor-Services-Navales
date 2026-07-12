DELETE FROM notifications
WHERE role_target = 'tourism_officer';

WITH removed_users AS (
  SELECT id FROM users
  WHERE email IN (
    'ernesto.cruz@tourism.gov.ph',
    'admin@tourism.gov.ph'
  )
)
UPDATE audit_logs
SET actor_id = NULL
WHERE actor_id IN (SELECT id FROM removed_users);

WITH removed_users AS (
  SELECT id FROM users
  WHERE email IN (
    'ernesto.cruz@tourism.gov.ph',
    'admin@tourism.gov.ph'
  )
)
UPDATE accreditation_applications
SET reviewed_by = NULL
WHERE reviewed_by IN (SELECT id FROM removed_users);

WITH removed_users AS (
  SELECT id FROM users
  WHERE email IN (
    'ernesto.cruz@tourism.gov.ph',
    'admin@tourism.gov.ph'
  )
)
UPDATE application_documents
SET uploaded_by = NULL
WHERE uploaded_by IN (SELECT id FROM removed_users);

WITH removed_users AS (
  SELECT id FROM users
  WHERE email IN (
    'ernesto.cruz@tourism.gov.ph',
    'admin@tourism.gov.ph'
  )
)
UPDATE accreditation_records
SET issued_by = NULL
WHERE issued_by IN (SELECT id FROM removed_users);

DELETE FROM users
WHERE email IN (
  'ernesto.cruz@tourism.gov.ph',
  'admin@tourism.gov.ph'
);
