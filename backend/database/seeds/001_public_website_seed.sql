-- ============================================================================
-- CaliTourSys / CallTourSys
-- Seed: 001_public_website_seed.sql
-- Scope: Public Facing Website only
-- Environment: Development/local demo data only
-- ============================================================================

-- IMPORTANT:
-- These records are development/demo data only.
-- They must be reviewed and replaced with LGU-verified tourism, business,
-- accreditation, event, destination, museum, contact, image, and coordinate data
-- before any production deployment.
--
-- This script intentionally does not insert CMS, staff, officer, admin, auth,
-- role, password, approval workflow, or private stakeholder records.

BEGIN;

-- ============================================================================
-- Product Categories
-- ============================================================================

INSERT INTO product_categories (id, slug, name, description, display_order, status)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'sweets', 'Sweets', 'Demo category for local sweets and pasalubong products.', 1, 'published'),
  ('10000000-0000-4000-8000-000000000002', 'crafts', 'Crafts', 'Demo category for handmade crafts and local materials.', 2, 'published'),
  ('10000000-0000-4000-8000-000000000003', 'pantry', 'Pantry', 'Demo category for shelf-stable food products.', 3, 'published'),
  ('10000000-0000-4000-8000-000000000004', 'beverages', 'Beverages', 'Demo category for local drinks and concentrates.', 4, 'published')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Businesses / Producers
-- ============================================================================

INSERT INTO businesses (
  id, slug, name, business_type, owner_name, description, address_line, barangay,
  municipality, province, status, is_featured
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'demo-pili-kitchen',
    'Demo Pili Kitchen',
    'OTOP Producer',
    NULL,
    'Demo-safe producer profile for small-batch pili sweets used in local development.',
    'Demo Stall 01, Public Market Area',
    'Poblacion',
    'Calabanga',
    'Camarines Sur',
    'active',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'demo-abaca-crafts-coop',
    'Demo Abaca Crafts Cooperative',
    'Craft Cooperative',
    NULL,
    'Demo-safe cooperative profile for woven abaca products and handmade crafts.',
    'Demo Craft Center',
    'Quipayo',
    'Calabanga',
    'Camarines Sur',
    'active',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'demo-bay-pantry-producers',
    'Demo Bay Pantry Producers',
    'Food Producer',
    NULL,
    'Demo-safe food producer profile for pantry products inspired by coastal livelihoods.',
    'Demo Coastal Produce Hub',
    'Sabang',
    'Calabanga',
    'Camarines Sur',
    'active',
    false
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'demo-heritage-tour-services',
    'Demo Heritage Tour Services',
    'Tourism Business',
    NULL,
    'Demo-safe tourism business profile for heritage walks and visitor assistance.',
    'Demo Tourism Desk',
    'Poblacion',
    'Calabanga',
    'Camarines Sur',
    'active',
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO business_contacts (
  id, business_id, contact_type, contact_value, label, is_primary, is_public
)
VALUES
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'email', 'demo.pili@example.test', 'Demo public email', true, true),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'phone', '+63 900 000 0002', 'Demo public phone', true, true),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'email', 'demo.pantry@example.test', 'Demo public email', true, true),
  ('21000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'website', 'https://example.test/demo-heritage-tour-services', 'Demo public website', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO business_accreditations (
  id, business_id, accreditation_number, status, issued_at, expires_at, verified_at
)
VALUES
  ('22000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'DEV-ACC-2026-001', 'accredited', '2026-01-15', '2027-01-15', '2026-01-15 09:00:00+08'),
  ('22000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'DEV-ACC-2026-002', 'accredited', '2026-02-01', '2027-02-01', '2026-02-01 09:00:00+08'),
  ('22000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'DEV-ACC-2025-003', 'expired', '2025-01-10', '2026-01-10', '2025-01-10 09:00:00+08'),
  ('22000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'DEV-ACC-2026-004', 'pending', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Products, Images, Tags
-- ============================================================================

INSERT INTO products (
  id, business_id, category_id, slug, name, short_description, description,
  price_amount, price_currency, unit_label, availability_text, accent_color,
  status, is_featured, published_at
)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'demo-pili-nut-brittle',
    'Demo Pili Nut Brittle',
    'Demo small-batch pili brittle for public website development.',
    'Development-only product copy for a local sweets listing. Replace with LGU-verified product information before production.',
    250.00,
    'PHP',
    'pack',
    'Demo availability only',
    '#B5451B',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'demo-abaca-place-mat',
    'Demo Abaca Place Mat',
    'Demo woven abaca table piece for product browsing.',
    'Development-only product copy for a handmade craft listing. Replace before production.',
    480.00,
    'PHP',
    'piece',
    'Demo availability only',
    '#7B341E',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'demo-fermented-bagoong',
    'Demo Fermented Bagoong',
    'Demo pantry product inspired by coastal food traditions.',
    'Development-only pantry product copy. Replace with verified producer data before production.',
    180.00,
    'PHP',
    'jar',
    'Demo availability only',
    '#1B4332',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000004',
    'demo-calamansi-drink',
    'Demo Calamansi Drink',
    'Demo local beverage listing for development.',
    'Development-only beverage product copy. Replace with verified product details before production.',
    160.00,
    'PHP',
    'bottle',
    'Demo availability only',
    '#D4AC0D',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'demo-abaca-market-bag',
    'Demo Abaca Market Bag',
    'Demo reusable woven bag for OTOP-style product cards.',
    'Development-only craft product copy. Replace with verified product details before production.',
    620.00,
    'PHP',
    'piece',
    'Demo availability only',
    '#2D6A4F',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'demo-tablea-chocolate',
    'Demo Tablea Chocolate',
    'Demo pantry sweets product for public listing tests.',
    'Development-only food product copy. Replace with verified product details before production.',
    290.00,
    'PHP',
    'pack',
    'Demo availability only',
    '#5C3318',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  )
ON CONFLICT DO NOTHING;

INSERT INTO product_images (
  id, product_id, image_url, alt_text, display_order, is_primary
)
VALUES
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/calitoursys-pili-brittle/900/700', 'Demo image placeholder for pili brittle.', 1, true),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/calitoursys-abaca-mat/900/700', 'Demo image placeholder for abaca place mat.', 1, true),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/calitoursys-bagoong/900/700', 'Demo image placeholder for fermented bagoong.', 1, true),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/calitoursys-calamansi/900/700', 'Demo image placeholder for calamansi drink.', 1, true),
  ('31000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/calitoursys-abaca-bag/900/700', 'Demo image placeholder for abaca market bag.', 1, true),
  ('31000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', 'https://picsum.photos/seed/calitoursys-tablea/900/700', 'Demo image placeholder for tablea chocolate.', 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO product_tags (id, product_id, tag)
VALUES
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'pili'),
  ('32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'sweets'),
  ('32000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'abaca'),
  ('32000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'crafts'),
  ('32000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', 'pantry'),
  ('32000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000003', 'coastal'),
  ('32000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004', 'beverage'),
  ('32000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000004', 'calamansi'),
  ('32000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000005', 'abaca'),
  ('32000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000005', 'bag'),
  ('32000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000006', 'tablea'),
  ('32000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', 'chocolate')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Events
-- ============================================================================

INSERT INTO event_categories (id, slug, name, description, display_order, status)
VALUES
  ('40000000-0000-4000-8000-000000000001', 'festival', 'Festival', 'Demo category for festivals and major celebrations.', 1, 'published'),
  ('40000000-0000-4000-8000-000000000002', 'culture', 'Culture', 'Demo category for heritage and cultural activities.', 2, 'published'),
  ('40000000-0000-4000-8000-000000000003', 'sports', 'Sports', 'Demo category for sports and outdoor events.', 3, 'published')
ON CONFLICT DO NOTHING;

INSERT INTO events (
  id, category_id, slug, title, short_description, description, venue_name,
  organizer_name, contact_info, address_line, barangay, starts_at, ends_at,
  accent_color, status, is_featured, published_at
)
VALUES
  (
    '41000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'demo-pili-festival-2026',
    'Demo Pili Festival 2026',
    'Demo festival entry for development event listings.',
    'Development-only event content. Replace with official LGU event details before production.',
    'Demo Town Plaza',
    'Demo Tourism Office',
    'demo.events@example.test',
    'Demo Plaza Road',
    'Poblacion',
    '2026-06-24 08:00:00+08',
    '2026-06-24 18:00:00+08',
    '#B5451B',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000003',
    'demo-bay-regatta-2026',
    'Demo Bay Regatta 2026',
    'Demo coastal sports event for public calendar testing.',
    'Development-only event content. Coordinates, schedules, and organizer data must be verified before production.',
    'Demo Bayfront',
    'Demo Events Team',
    'demo.regatta@example.test',
    'Demo Bayfront Road',
    'Sabang',
    '2026-07-08 06:00:00+08',
    '2026-07-08 12:00:00+08',
    '#1565C0',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000002',
    'demo-heritage-art-walk-2026',
    'Demo Heritage Art Walk 2026',
    'Demo heritage walk entry for event calendar testing.',
    'Development-only cultural event content. Replace with verified route and schedule before production.',
    'Demo Heritage Route',
    'Demo Heritage Tour Services',
    'demo.heritage@example.test',
    'Demo Heritage Street',
    'Quipayo',
    '2026-07-15 09:00:00+08',
    '2026-07-15 16:00:00+08',
    '#7B341E',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  ),
  (
    '41000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000002',
    'demo-harvest-thanksgiving-2026',
    'Demo Harvest Thanksgiving 2026',
    'Demo community celebration event for development.',
    'Development-only event content for public website testing.',
    'Demo Rice Field Grounds',
    'Demo Community Group',
    'demo.harvest@example.test',
    'Demo Field Road',
    'Belen',
    '2026-08-02 07:00:00+08',
    '2026-08-02 15:00:00+08',
    '#1B7A4A',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  )
ON CONFLICT DO NOTHING;

INSERT INTO event_images (id, event_id, image_url, alt_text, display_order, is_primary)
VALUES
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/calitoursys-pili-festival/1200/675', 'Demo image placeholder for festival event.', 1, true),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/calitoursys-regatta/1200/675', 'Demo image placeholder for regatta event.', 1, true),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/calitoursys-art-walk/1200/675', 'Demo image placeholder for heritage walk event.', 1, true),
  ('42000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/calitoursys-harvest/1200/675', 'Demo image placeholder for harvest event.', 1, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Destinations and Map Locations
-- ============================================================================

INSERT INTO destination_categories (id, slug, name, color, description, display_order, status)
VALUES
  ('50000000-0000-4000-8000-000000000001', 'nature', 'Nature', '#1B7A4A', 'Demo category for nature and outdoor destinations.', 1, 'published'),
  ('50000000-0000-4000-8000-000000000002', 'beach', 'Beach', '#1565C0', 'Demo category for coastal destinations.', 2, 'published'),
  ('50000000-0000-4000-8000-000000000003', 'cultural', 'Cultural', '#7B341E', 'Demo category for heritage and cultural sites.', 3, 'published'),
  ('50000000-0000-4000-8000-000000000004', 'food-market', 'Food Market', '#B5451B', 'Demo category for food and market destinations.', 4, 'published')
ON CONFLICT DO NOTHING;

INSERT INTO destinations (
  id, category_id, business_id, slug, name, short_description, description,
  address_line, barangay, municipality, province, opening_hours_text,
  entrance_fee_text, best_time_to_visit, accessibility_notes, accent_color,
  status, is_featured, published_at
)
VALUES
  (
    '51000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    NULL,
    'demo-sabang-beach',
    'Demo Sabang Beach',
    'Demo coastal destination record for map discovery.',
    'Development-only destination copy. Coordinates and public details must be verified before production.',
    'Demo Beachfront Road',
    'Sabang',
    'Calabanga',
    'Camarines Sur',
    'Open daily, demo hours only',
    'Demo fee information only',
    'Morning or late afternoon',
    'Accessibility notes are demo text only.',
    '#1565C0',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004',
    'demo-quipayo-heritage-site',
    'Demo Quipayo Heritage Site',
    'Demo cultural destination record for heritage discovery.',
    'Development-only destination copy. Replace with verified cultural site details before production.',
    'Demo Heritage Street',
    'Quipayo',
    'Calabanga',
    'Camarines Sur',
    'Open daily, demo hours only',
    'Demo fee information only',
    'Morning tours',
    'Accessibility notes are demo text only.',
    '#7B341E',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  ),
  (
    '51000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000003',
    NULL,
    'demo-belen-craft-village',
    'Demo Belen Craft Village',
    'Demo craft and cultural destination record.',
    'Development-only destination copy for product and destination discovery testing.',
    'Demo Craft Village Road',
    'Belen',
    'Calabanga',
    'Camarines Sur',
    'Open daily, demo hours only',
    'Demo fee information only',
    'Weekday afternoons',
    'Accessibility notes are demo text only.',
    '#7B341E',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  ),
  (
    '51000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000001',
    NULL,
    'demo-mt-isarog-foothills',
    'Demo Mt Isarog Foothills',
    'Demo nature destination record for public discovery.',
    'Development-only nature destination copy. Replace with verified route, safety, and access notes before production.',
    'Demo Foothill Access Road',
    'Foothills Area',
    'Calabanga',
    'Camarines Sur',
    'Open daily, demo hours only',
    'Demo fee information only',
    'Cool mornings',
    'Accessibility notes are demo text only.',
    '#1B7A4A',
    'published',
    false,
    '2026-05-01 08:00:00+08'
  ),
  (
    '51000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000004',
    NULL,
    'demo-calabanga-public-market',
    'Demo Calabanga Public Market',
    'Demo town-center food and market destination.',
    'Development-only market destination copy. Replace with verified public information before production.',
    'Demo Market Road',
    'Poblacion',
    'Calabanga',
    'Camarines Sur',
    'Open daily, demo hours only',
    'No demo fee',
    'Morning market hours',
    'Accessibility notes are demo text only.',
    '#B5451B',
    'published',
    true,
    '2026-05-01 08:00:00+08'
  )
ON CONFLICT DO NOTHING;

INSERT INTO destination_images (id, destination_id, image_url, alt_text, display_order, is_primary)
VALUES
  ('52000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/calitoursys-sabang-beach/1200/800', 'Demo image placeholder for beach destination.', 1, true),
  ('52000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/calitoursys-quipayo/1200/800', 'Demo image placeholder for heritage destination.', 1, true),
  ('52000000-0000-4000-8000-000000000003', '51000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/calitoursys-belen-craft/1200/800', 'Demo image placeholder for craft village destination.', 1, true),
  ('52000000-0000-4000-8000-000000000004', '51000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/calitoursys-isarog/1200/800', 'Demo image placeholder for nature destination.', 1, true),
  ('52000000-0000-4000-8000-000000000005', '51000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/calitoursys-market/1200/800', 'Demo image placeholder for market destination.', 1, true)
ON CONFLICT DO NOTHING;

-- Development placeholder coordinates only.
-- Verify all latitude/longitude values with LGU-approved geolocation data before production.
INSERT INTO map_locations (
  id, location_type, destination_id, business_id, event_id, label, latitude,
  longitude, mapbox_place_id, marker_color, marker_icon, cluster_group,
  geojson_properties, is_primary, is_clusterable, sort_priority, status
)
VALUES
  ('53000000-0000-4000-8000-000000000001', 'destination', '51000000-0000-4000-8000-000000000001', NULL, NULL, 'Demo Sabang Beach', 13.711000, 123.252000, NULL, '#1565C0', 'beach', 'destinations', '{"development_placeholder": true}', true, true, 10, 'published'),
  ('53000000-0000-4000-8000-000000000002', 'destination', '51000000-0000-4000-8000-000000000002', NULL, NULL, 'Demo Quipayo Heritage Site', 13.718000, 123.220000, NULL, '#7B341E', 'landmark', 'destinations', '{"development_placeholder": true}', true, true, 20, 'published'),
  ('53000000-0000-4000-8000-000000000003', 'destination', '51000000-0000-4000-8000-000000000004', NULL, NULL, 'Demo Mt Isarog Foothills', 13.770000, 123.310000, NULL, '#1B7A4A', 'leaf', 'destinations', '{"development_placeholder": true}', true, true, 30, 'published'),
  ('53000000-0000-4000-8000-000000000004', 'destination', '51000000-0000-4000-8000-000000000005', NULL, NULL, 'Demo Calabanga Public Market', 13.706000, 123.209000, NULL, '#B5451B', 'market', 'destinations', '{"development_placeholder": true}', true, true, 40, 'published'),
  ('53000000-0000-4000-8000-000000000005', 'business', NULL, '20000000-0000-4000-8000-000000000001', NULL, 'Demo Pili Kitchen', 13.706500, 123.209500, NULL, '#B5451B', 'shop', 'businesses', '{"development_placeholder": true}', true, true, 50, 'published'),
  ('53000000-0000-4000-8000-000000000006', 'business', NULL, '20000000-0000-4000-8000-000000000004', NULL, 'Demo Heritage Tour Services', 13.708000, 123.211000, NULL, '#7B341E', 'compass', 'businesses', '{"development_placeholder": true}', true, true, 60, 'published'),
  ('53000000-0000-4000-8000-000000000007', 'event', NULL, NULL, '41000000-0000-4000-8000-000000000001', 'Demo Pili Festival 2026', 13.707000, 123.210000, NULL, '#B5451B', 'calendar', 'events', '{"development_placeholder": true}', true, true, 70, 'published'),
  ('53000000-0000-4000-8000-000000000008', 'event', NULL, NULL, '41000000-0000-4000-8000-000000000002', 'Demo Bay Regatta 2026', 13.712000, 123.253000, NULL, '#1565C0', 'calendar', 'events', '{"development_placeholder": true}', true, true, 80, 'published')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Interactive Museum
-- ============================================================================

INSERT INTO artifact_categories (id, slug, name, description, display_order, status)
VALUES
  ('60000000-0000-4000-8000-000000000001', 'pre-colonial', 'Pre-colonial', 'Demo category for pre-colonial heritage records.', 1, 'published'),
  ('60000000-0000-4000-8000-000000000002', 'spanish-era', 'Spanish-era', 'Demo category for Spanish-era heritage records.', 2, 'published'),
  ('60000000-0000-4000-8000-000000000003', 'modern', 'Modern', 'Demo category for modern cultural records.', 3, 'published')
ON CONFLICT DO NOTHING;

INSERT INTO museum_artifacts (
  id, category_id, slug, name, era_label, short_description, description,
  historical_notes, accent_color, status, is_featured, published_at
)
VALUES
  ('61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'demo-earthen-storage-jar', 'Demo Earthen Storage Jar', 'Pre-colonial demo era', 'Demo artifact record for public museum testing.', 'Development-only museum artifact copy. Replace with verified heritage data before production.', 'Demo historical notes only.', '#7B341E', 'published', true, '2026-05-01 08:00:00+08'),
  ('61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 'demo-heritage-bell', 'Demo Heritage Bell', 'Spanish-era demo label', 'Demo heritage record for museum modal testing.', 'Development-only museum artifact copy. Replace with verified heritage data before production.', 'Demo historical notes only.', '#5C3318', 'published', true, '2026-05-01 08:00:00+08'),
  ('61000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', 'demo-abaca-ritual-cloth', 'Demo Abaca Ritual Cloth', 'Pre-colonial demo label', 'Demo textile artifact record.', 'Development-only museum artifact copy. Replace with verified heritage data before production.', 'Demo historical notes only.', '#D4711B', 'published', false, '2026-05-01 08:00:00+08'),
  ('61000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000003', 'demo-outrigger-carving', 'Demo Outrigger Carving', 'Modern demo label', 'Demo coastal culture artifact record.', 'Development-only museum artifact copy. Replace with verified heritage data before production.', 'Demo historical notes only.', '#1B4332', 'published', false, '2026-05-01 08:00:00+08'),
  ('61000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000002', 'demo-trade-currency-fragment', 'Demo Trade Currency Fragment', 'Spanish-era demo label', 'Demo trade artifact record.', 'Development-only museum artifact copy. Replace with verified heritage data before production.', 'Demo historical notes only.', '#D4AC0D', 'published', false, '2026-05-01 08:00:00+08')
ON CONFLICT DO NOTHING;

INSERT INTO artifact_images (id, artifact_id, image_url, alt_text, display_order, is_primary)
VALUES
  ('62000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/calitoursys-jar/900/900', 'Demo image placeholder for earthen jar artifact.', 1, true),
  ('62000000-0000-4000-8000-000000000002', '61000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/calitoursys-bell/900/900', 'Demo image placeholder for heritage bell artifact.', 1, true),
  ('62000000-0000-4000-8000-000000000003', '61000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/calitoursys-cloth/900/900', 'Demo image placeholder for abaca cloth artifact.', 1, true),
  ('62000000-0000-4000-8000-000000000004', '61000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/calitoursys-carving/900/900', 'Demo image placeholder for outrigger carving artifact.', 1, true),
  ('62000000-0000-4000-8000-000000000005', '61000000-0000-4000-8000-000000000005', 'https://picsum.photos/seed/calitoursys-currency/900/900', 'Demo image placeholder for trade currency artifact.', 1, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Promotions and Promotion Items
-- ============================================================================

INSERT INTO promotions (
  id, slug, title, summary, description, promotion_type, accent_color,
  starts_at, ends_at, status, is_featured, published_at
)
VALUES
  ('70000000-0000-4000-8000-000000000001', 'demo-summer-otop-picks', 'Demo Summer OTOP Picks', 'Demo campaign featuring local products for public homepage testing.', 'Development-only campaign content. Replace with official promotional copy before production.', 'seasonal', '#B5451B', '2026-05-01 00:00:00+08', '2026-08-31 23:59:59+08', 'published', true, '2026-05-01 08:00:00+08'),
  ('70000000-0000-4000-8000-000000000002', 'demo-heritage-week', 'Demo Heritage Week', 'Demo campaign featuring destinations, events, and museum artifacts.', 'Development-only campaign content. Replace with official LGU campaign data before production.', 'campaign', '#7B341E', '2026-06-01 00:00:00+08', '2026-06-30 23:59:59+08', 'published', true, '2026-05-01 08:00:00+08'),
  ('70000000-0000-4000-8000-000000000003', 'demo-featured-producers', 'Demo Featured Producers', 'Demo featured producer section for public website development.', 'Development-only featured producer content.', 'featured', '#1B4332', '2026-05-01 00:00:00+08', NULL, 'published', false, '2026-05-01 08:00:00+08'),
  ('70000000-0000-4000-8000-000000000004', 'demo-upcoming-events', 'Demo Upcoming Events', 'Demo announcement for upcoming public events.', 'Development-only announcement content.', 'announcement', '#1565C0', '2026-05-01 00:00:00+08', NULL, 'published', false, '2026-05-01 08:00:00+08')
ON CONFLICT DO NOTHING;

INSERT INTO promotion_items (
  id, promotion_id, item_type, product_id, event_id, destination_id, business_id, display_order
)
VALUES
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'product', '30000000-0000-4000-8000-000000000001', NULL, NULL, NULL, 1),
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 'product', '30000000-0000-4000-8000-000000000004', NULL, NULL, NULL, 2),
  ('71000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000002', 'destination', NULL, NULL, '51000000-0000-4000-8000-000000000002', NULL, 1),
  ('71000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000002', 'event', NULL, '41000000-0000-4000-8000-000000000003', NULL, NULL, 2),
  ('71000000-0000-4000-8000-000000000005', '70000000-0000-4000-8000-000000000003', 'business', NULL, NULL, NULL, '20000000-0000-4000-8000-000000000001', 1),
  ('71000000-0000-4000-8000-000000000006', '70000000-0000-4000-8000-000000000003', 'business', NULL, NULL, NULL, '20000000-0000-4000-8000-000000000002', 2),
  ('71000000-0000-4000-8000-000000000007', '70000000-0000-4000-8000-000000000004', 'event', NULL, '41000000-0000-4000-8000-000000000001', NULL, NULL, 1),
  ('71000000-0000-4000-8000-000000000008', '70000000-0000-4000-8000-000000000004', 'destination', NULL, NULL, '51000000-0000-4000-8000-000000000001', NULL, 2)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Anonymous Itinerary
-- ============================================================================

INSERT INTO itinerary_sessions (
  id, session_token, visitor_label, expires_at
)
VALUES
  (
    '80000000-0000-4000-8000-000000000001',
    'dev-public-session-0001',
    'Development Demo Visitor',
    '2027-01-01 00:00:00+08'
  )
ON CONFLICT DO NOTHING;

INSERT INTO itinerary_items (
  id, itinerary_session_id, item_type, product_id, event_id, destination_id,
  artifact_id, title_snapshot, saved_at
)
VALUES
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'product', '30000000-0000-4000-8000-000000000001', NULL, NULL, NULL, 'Demo Pili Nut Brittle', '2026-05-20 10:00:00+08'),
  ('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', 'event', NULL, '41000000-0000-4000-8000-000000000001', NULL, NULL, 'Demo Pili Festival 2026', '2026-05-20 10:05:00+08'),
  ('81000000-0000-4000-8000-000000000003', '80000000-0000-4000-8000-000000000001', 'destination', NULL, NULL, '51000000-0000-4000-8000-000000000001', NULL, 'Demo Sabang Beach', '2026-05-20 10:10:00+08'),
  ('81000000-0000-4000-8000-000000000004', '80000000-0000-4000-8000-000000000001', 'artifact', NULL, NULL, NULL, '61000000-0000-4000-8000-000000000002', 'Demo Heritage Bell', '2026-05-20 10:15:00+08')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Public Inquiries and Newsletter Subscribers
-- ============================================================================

INSERT INTO tourism_inquiries (
  id, full_name, email, contact_number, subject, message, source_page, status
)
VALUES
  (
    '90000000-0000-4000-8000-000000000001',
    'Demo Visitor One',
    'demo.visitor.one@example.test',
    '+63 900 000 0101',
    'Demo destination inquiry',
    'This is a development-only inquiry record for testing the public inquiry table.',
    '/promotion/inquiry',
    'new'
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    'Demo Visitor Two',
    'demo.visitor.two@example.test',
    '+63 900 000 0102',
    'Demo product inquiry',
    'This is a development-only inquiry record and must not be treated as real visitor data.',
    '/promotion/products',
    'read'
  )
ON CONFLICT DO NOTHING;

INSERT INTO newsletter_subscribers (
  id, email, full_name, status, subscribed_at
)
VALUES
  (
    '91000000-0000-4000-8000-000000000001',
    'demo.subscriber.one@example.test',
    'Demo Subscriber One',
    'subscribed',
    '2026-05-20 09:00:00+08'
  ),
  (
    '91000000-0000-4000-8000-000000000002',
    'demo.subscriber.two@example.test',
    'Demo Subscriber Two',
    'subscribed',
    '2026-05-20 09:05:00+08'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- Optional verification queries for development use
-- Prefer running backend/database/VERIFY_PUBLIC_SCHEMA.sql for the full check set.
-- ============================================================================

-- SELECT COUNT(*) AS product_count FROM products;
-- SELECT COUNT(*) AS event_count FROM events;
-- SELECT COUNT(*) AS destination_count FROM destinations;
-- SELECT COUNT(*) AS map_location_count FROM map_locations;
-- SELECT COUNT(*) AS museum_artifact_count FROM museum_artifacts;
-- SELECT COUNT(*) AS promotion_count FROM promotions;
-- SELECT COUNT(*) AS itinerary_item_count FROM itinerary_items;
