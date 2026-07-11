INSERT INTO visitor_establishments
  (id, name, type, address, contact_number, email, is_active)
VALUES
  (1, 'Calabanga Beach Resort', 'resort', 'Calabanga, Camarines Sur', '+63 912 000 0001', 'beach@calabanga.com', TRUE),
  (2, 'Calabanga Eco-Park and Resort', 'resort', 'Barangay San Antonio, Calabanga', '+63 912 345 6789', 'ecopark@calabanga.com', TRUE),
  (3, 'Calabanga Municipal Museum', 'museum', 'Calabanga Town Center', '(054) 123-4567', 'museum@calabanga.gov.ph', TRUE),
  (4, 'Mangrove Eco-Tourism Park', 'tourist_spot', 'Barangay Sabang, Calabanga', '+63 912 345 6790', 'mangrove@calabanga.com', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  address = EXCLUDED.address,
  contact_number = EXCLUDED.contact_number,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

SELECT setval(
  pg_get_serial_sequence('visitor_establishments', 'id'),
  COALESCE((SELECT MAX(id) FROM visitor_establishments), 1),
  true
);

INSERT INTO visitor_users
  (id, username, password, full_name, role, assigned_establishment_id, status, is_active)
VALUES
  (1, 'admin', 'admin123', 'Admin User', 'admin', NULL, 'active', TRUE),
  (2, 'tourism_staff', 'staff123', 'Tourism Staff', 'tourism_staff', NULL, 'active', TRUE),
  (3, 'beach_reception', 'beach123', 'Maria Santos', 'receptionist', 1, 'active', TRUE),
  (4, 'ecopark_reception', 'eco123', 'Juan Dela Cruz', 'receptionist', 2, 'active', TRUE)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  assigned_establishment_id = EXCLUDED.assigned_establishment_id,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active;

SELECT setval(
  pg_get_serial_sequence('visitor_users', 'id'),
  COALESCE((SELECT MAX(id) FROM visitor_users), 1),
  true
);