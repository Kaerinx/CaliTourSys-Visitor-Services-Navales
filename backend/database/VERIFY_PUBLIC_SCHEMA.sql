-- ============================================================================
-- CaliTourSys / CallTourSys
-- Verification: VERIFY_PUBLIC_SCHEMA.sql
-- Scope: Public Facing Website only
-- Purpose: Development database verification after migration and seed execution
-- ============================================================================

-- 1. Verify expected public tables exist.
SELECT
  COUNT(*) AS existing_public_website_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'media_assets',
    'businesses',
    'business_contacts',
    'business_accreditations',
    'product_categories',
    'products',
    'product_images',
    'product_tags',
    'promotions',
    'promotion_items',
    'event_categories',
    'events',
    'event_images',
    'destination_categories',
    'destinations',
    'destination_images',
    'map_locations',
    'emergency_facilities',
    'map_location_details',
    'map_location_gallery_images',
    'map_location_activity_links',
    'map_location_package_links',
    'map_location_overnight_options',
    'artifact_categories',
    'museum_artifacts',
    'artifact_images',
    'itinerary_sessions',
    'itinerary_items',
    'tourism_inquiries',
    'newsletter_subscribers'
  );

-- 2. Count seeded rows per major table.
SELECT 'media_assets' AS table_name, COUNT(*) AS row_count FROM media_assets
UNION ALL SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL SELECT 'business_contacts', COUNT(*) FROM business_contacts
UNION ALL SELECT 'business_accreditations', COUNT(*) FROM business_accreditations
UNION ALL SELECT 'product_categories', COUNT(*) FROM product_categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL SELECT 'product_tags', COUNT(*) FROM product_tags
UNION ALL SELECT 'promotions', COUNT(*) FROM promotions
UNION ALL SELECT 'promotion_items', COUNT(*) FROM promotion_items
UNION ALL SELECT 'event_categories', COUNT(*) FROM event_categories
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'event_images', COUNT(*) FROM event_images
UNION ALL SELECT 'destination_categories', COUNT(*) FROM destination_categories
UNION ALL SELECT 'destinations', COUNT(*) FROM destinations
UNION ALL SELECT 'destination_images', COUNT(*) FROM destination_images
UNION ALL SELECT 'map_locations', COUNT(*) FROM map_locations
UNION ALL SELECT 'emergency_facilities', COUNT(*) FROM emergency_facilities
UNION ALL SELECT 'map_location_details', COUNT(*) FROM map_location_details
UNION ALL SELECT 'map_location_gallery_images', COUNT(*) FROM map_location_gallery_images
UNION ALL SELECT 'map_location_activity_links', COUNT(*) FROM map_location_activity_links
UNION ALL SELECT 'map_location_package_links', COUNT(*) FROM map_location_package_links
UNION ALL SELECT 'map_location_overnight_options', COUNT(*) FROM map_location_overnight_options
UNION ALL SELECT 'artifact_categories', COUNT(*) FROM artifact_categories
UNION ALL SELECT 'museum_artifacts', COUNT(*) FROM museum_artifacts
UNION ALL SELECT 'artifact_images', COUNT(*) FROM artifact_images
UNION ALL SELECT 'itinerary_sessions', COUNT(*) FROM itinerary_sessions
UNION ALL SELECT 'itinerary_items', COUNT(*) FROM itinerary_items
UNION ALL SELECT 'tourism_inquiries', COUNT(*) FROM tourism_inquiries
UNION ALL SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers
ORDER BY table_name;

-- 3. List published products with business and latest accreditation status.
SELECT
  p.slug AS product_slug,
  p.name AS product_name,
  pc.name AS category_name,
  b.name AS business_name,
  p.price_amount,
  p.price_currency,
  p.status AS product_status,
  ba.status AS accreditation_status
FROM products p
JOIN product_categories pc ON pc.id = p.category_id
JOIN businesses b ON b.id = p.business_id
LEFT JOIN LATERAL (
  SELECT status
  FROM business_accreditations ba
  WHERE ba.business_id = b.id
  ORDER BY ba.verified_at DESC NULLS LAST, ba.created_at DESC
  LIMIT 1
) ba ON true
WHERE p.status = 'published'
ORDER BY p.is_featured DESC, p.name;

-- 4. List upcoming published events.
SELECT
  e.slug,
  e.title,
  ec.name AS category_name,
  e.venue_name,
  e.starts_at,
  e.ends_at,
  e.status
FROM events e
JOIN event_categories ec ON ec.id = e.category_id
WHERE e.status = 'published'
ORDER BY e.starts_at;

-- 5. List destinations with map coordinates.
SELECT
  d.slug AS destination_slug,
  d.name AS destination_name,
  dc.name AS category_name,
  ml.latitude,
  ml.longitude,
  ml.geojson_properties,
  ml.status AS map_status
FROM destinations d
JOIN destination_categories dc ON dc.id = d.category_id
LEFT JOIN map_locations ml ON ml.destination_id = d.id
WHERE d.status = 'published'
ORDER BY d.is_featured DESC, d.name;

-- 6. List museum artifacts with categories.
SELECT
  ma.slug,
  ma.name,
  ac.name AS category_name,
  ma.era_label,
  ma.status
FROM museum_artifacts ma
JOIN artifact_categories ac ON ac.id = ma.category_id
WHERE ma.status = 'published'
ORDER BY ma.is_featured DESC, ma.name;

-- 7. List promotion items with linked targets.
SELECT
  pr.slug AS promotion_slug,
  pr.title AS promotion_title,
  pi.item_type,
  COALESCE(p.name, e.title, d.name, b.name) AS linked_target,
  pi.display_order
FROM promotion_items pi
JOIN promotions pr ON pr.id = pi.promotion_id
LEFT JOIN products p ON p.id = pi.product_id
LEFT JOIN events e ON e.id = pi.event_id
LEFT JOIN destinations d ON d.id = pi.destination_id
LEFT JOIN businesses b ON b.id = pi.business_id
ORDER BY pr.slug, pi.display_order;

-- 8. Verify itinerary items.
SELECT
  s.session_token,
  ii.item_type,
  COALESCE(p.name, e.title, d.name, ma.name, ii.title_snapshot) AS saved_item,
  ii.saved_at
FROM itinerary_items ii
JOIN itinerary_sessions s ON s.id = ii.itinerary_session_id
LEFT JOIN products p ON p.id = ii.product_id
LEFT JOIN events e ON e.id = ii.event_id
LEFT JOIN destinations d ON d.id = ii.destination_id
LEFT JOIN museum_artifacts ma ON ma.id = ii.artifact_id
ORDER BY s.session_token, ii.saved_at;

-- 9. Verify newsletter lowercase email uniqueness.
SELECT
  lower(email) AS normalized_email,
  COUNT(*) AS duplicate_count
FROM newsletter_subscribers
GROUP BY lower(email)
HAVING COUNT(*) > 1;

-- 10. Verify pgcrypto is enabled.
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'pgcrypto';
