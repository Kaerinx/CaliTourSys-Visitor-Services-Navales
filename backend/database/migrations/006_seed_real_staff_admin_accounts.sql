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
('Maria', 'Santos', 'maria.santos@tourism.gov.ph', '$2b$10$J6raAyuk4ja52jaBTHhQBeXK7Z4W6iNTWcyX8TEdlSu9M6KjhpeBO', '+63 911 111 1111', 'tourism_staff', 'active', NOW())
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
  updated_at = NOW();
