-- ============================================================================
-- CaliTourSys / CallTourSys
-- Seed: Product Development Calabanga sample workflow data
-- ============================================================================

BEGIN;

WITH seed_user AS (
  SELECT id FROM users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO tourism_assets (
  id, name, description, location, category, target_market, development_status, image_url, remarks, created_by
)
VALUES
  (
    '31000000-0000-4000-8000-000000000001',
    'Quipayo Church Heritage Site',
    'A historic faith and heritage landmark suited for guided interpretation, parish coordination, and visitor orientation.',
    'Barangay Quipayo',
    'Religious',
    'Pilgrims, heritage learners, families, student groups',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg',
    'Anchor site for faith and heritage package development.',
    (SELECT id FROM seed_user)
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    'Amang Hinulid Shrine',
    'A devotion-focused shrine visit opportunity that can support respectful pilgrim routing and faith tourism interpretation.',
    'Calabanga poblacion area',
    'Religious',
    'Pilgrims, families, parish groups',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg',
    'Needs visitor flow and interpretive guide coordination.',
    (SELECT id FROM seed_user)
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    'San Miguel Bay Coastal and Island Area',
    'A coastal landscape with bay views, fishing communities, and potential island-hopping orientation points.',
    'San Miguel Bay, Calabanga',
    'Natural',
    'Eco-tourists, photographers, coastal learners, families',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg',
    'Coordinate weather, tide, and community readiness before promotion.',
    (SELECT id FROM seed_user)
  ),
  (
    '31000000-0000-4000-8000-000000000004',
    'Kawit Island',
    'A coastal island stop that can support low-impact visits, community storytelling, and scenic coastal experiences.',
    'Kawit Island',
    'Natural',
    'Island visitors, families, photography groups',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
    'Boat coordination and visitor safety checks required.',
    (SELECT id FROM seed_user)
  ),
  (
    '31000000-0000-4000-8000-000000000005',
    'Cabgan Island',
    'A coastal island asset suitable for curated island stops, nature viewing, and local guide development.',
    'Cabgan Island',
    'Natural',
    'Eco-tourists, family groups, coastal visitors',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Kabgan%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
    'Use controlled group sizes and local coordination.',
    (SELECT id FROM seed_user)
  ),
  (
    '31000000-0000-4000-8000-000000000006',
    'Tigman-Hinagyanan-Inarihan River Corridor',
    'A river corridor with potential for ecology education, watershed interpretation, and community-led visitor activities.',
    'Tigman-Hinagyanan-Inarihan river corridor',
    'Natural',
    'Students, eco-tourists, researchers, families',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg',
    'Suitable for conservation learning once safety points are mapped.',
    (SELECT id FROM seed_user)
  ),
  (
    '31000000-0000-4000-8000-000000000007',
    'Hacienda Calabanga Agri-Tourism Site',
    'A countryside and agri-tourism site for farm learning, local food storytelling, and livelihood-oriented visits.',
    'Hacienda Calabanga',
    'Agricultural',
    'Families, students, farm visitors, food tourists',
    'Draft',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Kabgan%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
    'Needs host orientation and visitor flow preparation.',
    (SELECT id FROM seed_user)
  )
ON CONFLICT (id) DO NOTHING;

WITH seed_user AS (
  SELECT id FROM users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO development_plans (
  id, asset_id, title, objectives, target_market, improvement_needs, proposed_activities,
  timeline_start, timeline_end, assigned_personnel, plan_status, remarks, created_by
)
VALUES
  (
    '32000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'Heritage Development Plan',
    'Prepare Quipayo Church for respectful guided visits with basic interpretation and visitor routing.',
    'Pilgrims, heritage learners, student groups',
    'Directional signage, visitor guide notes, coordination with parish representatives, and photo-stop guidance.',
    'Guided heritage walk, faith storytelling stop, visitor briefing, and optional shrine connection.',
    '2026-06-01',
    '2026-08-15',
    'Tourism Officer and Heritage Guide Coordinator',
    'Draft',
    'Complete chain seed: Quipayo Church to Cultural Package.',
    (SELECT id FROM seed_user)
  ),
  (
    '32000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000003',
    'San Miguel Bay Coastal Readiness Plan',
    'Prepare a coastal learning and island orientation route with weather-aware visitor guidance.',
    'Eco-tourists, photographers, family groups',
    'Boat safety checklist, guide assignment, island stop coordination, and coastal interpretation materials.',
    'Coastal orientation, bay viewpoint stop, island storytelling, and community seafood learning.',
    '2026-06-10',
    '2026-09-30',
    'Coastal Tourism Staff and Barangay Coordinators',
    'Draft',
    'Supports coastal and island package readiness.',
    (SELECT id FROM seed_user)
  ),
  (
    '32000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000007',
    'Hacienda Agri-Experience Plan',
    'Shape a farm learning visit that highlights Calabanga countryside livelihoods and local food stories.',
    'Families, students, food tourists',
    'Host briefing, hygiene checks, visitor path marking, and farm activity sequencing.',
    'Farm walk, harvest demonstration, local snack stop, and livelihood talk.',
    '2026-07-01',
    '2026-10-15',
    'Agri-Tourism Desk and Site Host',
    'Draft',
    'Draft plan remains internal until reviewed.',
    (SELECT id FROM seed_user)
  )
ON CONFLICT (id) DO NOTHING;

WITH seed_user AS (
  SELECT id FROM users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO improvement_records (
  id, plan_id, progress_percentage, improvement_status, update_date, remarks, created_by
)
VALUES
  (
    '33000000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001',
    75,
    'Ongoing',
    '2026-07-05',
    'Signage and visitor guide draft completed; parish coordination is in progress.',
    (SELECT id FROM seed_user)
  ),
  (
    '33000000-0000-4000-8000-000000000002',
    '32000000-0000-4000-8000-000000000002',
    55,
    'Ongoing',
    '2026-07-12',
    'Boat safety checklist and island stop contacts are being validated.',
    (SELECT id FROM seed_user)
  ),
  (
    '33000000-0000-4000-8000-000000000003',
    '32000000-0000-4000-8000-000000000003',
    20,
    'Not Started',
    '2026-07-18',
    'Initial site host discussion completed; activity sequencing still needs review.',
    (SELECT id FROM seed_user)
  )
ON CONFLICT (id) DO NOTHING;

WITH seed_user AS (
  SELECT id FROM users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO tourism_activities (
  id, asset_id, plan_id, name, description, duration, target_market, activity_status, remarks, created_by
)
VALUES
  (
    '34000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001',
    'Guided Heritage Walk',
    'A guided walk introducing Quipayo Church history, devotional context, and respectful visitor behavior.',
    '2 hours',
    'Pilgrims, heritage learners, student groups',
    'Ready for Promotion',
    'Linked to signage and visitor guide improvement.',
    (SELECT id FROM seed_user)
  ),
  (
    '34000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000003',
    '32000000-0000-4000-8000-000000000002',
    'San Miguel Bay Coastal Orientation',
    'A bay-view activity covering coastal livelihood, safety reminders, and environmental stewardship.',
    'Half day',
    'Eco-tourists, family groups, photographers',
    'Draft',
    'Can be paired with island stops once boat coordination is complete.',
    (SELECT id FROM seed_user)
  ),
  (
    '34000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000006',
    NULL,
    'River Corridor Eco-Learning Walk',
    'A short guided learning activity on watershed health, river ecology, and community stewardship.',
    '2.5 hours',
    'Students, eco-tourists, researchers',
    'Draft',
    'Needs final route safety assessment.',
    (SELECT id FROM seed_user)
  ),
  (
    '34000000-0000-4000-8000-000000000004',
    '31000000-0000-4000-8000-000000000007',
    '32000000-0000-4000-8000-000000000003',
    'Countryside Farm Learning Visit',
    'A farm visit with host orientation, harvest demonstration, and local snack storytelling.',
    'Half day',
    'Families, students, food tourists',
    'Draft',
    'Internal draft activity for agri-tourism preparation.',
    (SELECT id FROM seed_user)
  )
ON CONFLICT (id) DO NOTHING;

WITH seed_user AS (
  SELECT id FROM users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO tourism_packages (
  id, name, description, category, target_market, estimated_duration, package_status, remarks, created_by
)
VALUES
  (
    '35000000-0000-4000-8000-000000000001',
    'Cultural Heritage Package',
    'A visitor-ready faith and heritage route anchored on Quipayo Church, interpretation, and respectful devotional stops.',
    'Cultural',
    'Pilgrims, heritage learners, student groups',
    'Half day',
    'Ready for Promotion',
    'Complete chain: Quipayo Church -> Heritage Development Plan -> signage/visitor guide improvement -> Guided Heritage Walk.',
    (SELECT id FROM seed_user)
  ),
  (
    '35000000-0000-4000-8000-000000000002',
    'San Miguel Bay Nature Discovery Package',
    'A coastal and island-oriented package combining bay orientation, scenic island context, and community-based visitor guidance.',
    'Nature',
    'Eco-tourists, photographers, family groups',
    'Full day',
    'Ready for Promotion',
    'Approved for public promotion while final boat schedules are coordinated per group inquiry.',
    (SELECT id FROM seed_user)
  ),
  (
    '35000000-0000-4000-8000-000000000003',
    'River and Eco-Learning Package',
    'A nature learning package focused on the Tigman-Hinagyanan-Inarihan River Corridor and watershed stewardship.',
    'Nature',
    'Students, eco-tourists, researchers',
    'Half day',
    'Draft',
    'Internal package: public listing should hide this until marked ready.',
    (SELECT id FROM seed_user)
  ),
  (
    '35000000-0000-4000-8000-000000000004',
    'Hacienda Food Tourism Preview',
    'A draft agri-tourism package for farm learning, countryside livelihood, and local snack storytelling.',
    'Food',
    'Families, students, food tourists',
    'Half day',
    'Draft',
    'Draft/internal package: should remain inside CMS.',
    (SELECT id FROM seed_user)
  ),
  (
    '35000000-0000-4000-8000-000000000005',
    'Calabanga Coast, Faith, and Flavors Package',
    'A public package combining heritage orientation, coastal scenery, and local food inquiry stops.',
    'Food',
    'Families, balikbayan visitors, local product buyers',
    'Full day',
    'Ready for Promotion',
    'Published sample for public Packages QA.',
    (SELECT id FROM seed_user)
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO package_items (id, package_id, item_type, item_reference_id, sort_order)
VALUES
  ('36000000-0000-4000-8000-000000000001', '35000000-0000-4000-8000-000000000001', 'Asset', '31000000-0000-4000-8000-000000000001', 1),
  ('36000000-0000-4000-8000-000000000003', '35000000-0000-4000-8000-000000000002', 'Asset', '31000000-0000-4000-8000-000000000003', 1),
  ('36000000-0000-4000-8000-000000000004', '35000000-0000-4000-8000-000000000002', 'Asset', '31000000-0000-4000-8000-000000000004', 2),
  ('36000000-0000-4000-8000-000000000005', '35000000-0000-4000-8000-000000000002', 'Asset', '31000000-0000-4000-8000-000000000005', 3),
  ('36000000-0000-4000-8000-000000000007', '35000000-0000-4000-8000-000000000003', 'Asset', '31000000-0000-4000-8000-000000000006', 1),
  ('36000000-0000-4000-8000-000000000009', '35000000-0000-4000-8000-000000000004', 'Asset', '31000000-0000-4000-8000-000000000007', 1),
  ('36000000-0000-4000-8000-000000000011', '35000000-0000-4000-8000-000000000005', 'Asset', '31000000-0000-4000-8000-000000000001', 1),
  ('36000000-0000-4000-8000-000000000012', '35000000-0000-4000-8000-000000000005', 'Asset', '31000000-0000-4000-8000-000000000003', 2)
ON CONFLICT (id) DO NOTHING;

WITH seed_user AS (
  SELECT id, display_name FROM users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO product_status_history (
  id, record_type, record_id, previous_status, new_status, changed_by, changed_by_role, changed_by_name, remarks
)
VALUES
  (
    '37000000-0000-4000-8000-000000000001',
    'Package',
    '35000000-0000-4000-8000-000000000001',
    'Draft',
    'Ready for Promotion',
    (SELECT id FROM seed_user),
    'tourism_officer',
    COALESCE((SELECT display_name FROM seed_user), 'Seeded Tourism Officer'),
    'Seeded readiness approval for public package handoff QA.'
  ),
  (
    '37000000-0000-4000-8000-000000000002',
    'Package',
    '35000000-0000-4000-8000-000000000002',
    'Draft',
    'Ready for Promotion',
    (SELECT id FROM seed_user),
    'tourism_officer',
    COALESCE((SELECT display_name FROM seed_user), 'Seeded Tourism Officer'),
    'Seeded readiness approval for public package handoff QA.'
  ),
  (
    '37000000-0000-4000-8000-000000000003',
    'Package',
    '35000000-0000-4000-8000-000000000005',
    'Draft',
    'Ready for Promotion',
    (SELECT id FROM seed_user),
    'system_admin',
    COALESCE((SELECT display_name FROM seed_user), 'Seeded System Admin'),
    'Seeded readiness approval for public page QA.'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
