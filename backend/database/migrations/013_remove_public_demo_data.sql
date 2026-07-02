-- ============================================================================
-- CaliTourSys / CallTourSys
-- Migration: 013_remove_public_demo_data.sql
-- Scope: Remove fixed public website demo records seeded by 001_public_website_seed.sql
-- ============================================================================

BEGIN;

-- Visitor/demo interaction data.
DELETE FROM itinerary_sessions WHERE id::text LIKE '80000000-0000-4000-8000-%';
DELETE FROM tourism_inquiries WHERE id::text LIKE '90000000-0000-4000-8000-%';
DELETE FROM newsletter_subscribers WHERE id::text LIKE '91000000-0000-4000-8000-%';

-- Public campaign records and their linked items.
DELETE FROM promotion_items WHERE id::text LIKE '71000000-0000-4000-8000-%';
DELETE FROM promotions WHERE id::text LIKE '70000000-0000-4000-8000-%';

-- Public content records. Child rows cascade from these parent deletes, but the
-- explicit child deletes keep this cleanup safe across partially applied seeds.
DELETE FROM product_images WHERE id::text LIKE '31000000-0000-4000-8000-%';
DELETE FROM product_tags WHERE id::text LIKE '32000000-0000-4000-8000-%';
DELETE FROM event_images WHERE id::text LIKE '42000000-0000-4000-8000-%';
DELETE FROM destination_images WHERE id::text LIKE '52000000-0000-4000-8000-%';
DELETE FROM map_locations WHERE id::text LIKE '53000000-0000-4000-8000-%';
DELETE FROM artifact_images WHERE id::text LIKE '62000000-0000-4000-8000-%';

DELETE FROM products WHERE id::text LIKE '30000000-0000-4000-8000-%';
DELETE FROM events WHERE id::text LIKE '41000000-0000-4000-8000-%';
DELETE FROM destinations WHERE id::text LIKE '51000000-0000-4000-8000-%';
DELETE FROM museum_artifacts WHERE id::text LIKE '61000000-0000-4000-8000-%';

-- Demo business/producers after dependent products and locations are removed.
DELETE FROM business_contacts WHERE id::text LIKE '21000000-0000-4000-8000-%';
DELETE FROM business_accreditations WHERE id::text LIKE '22000000-0000-4000-8000-%';
DELETE FROM businesses WHERE id::text LIKE '20000000-0000-4000-8000-%';

-- Demo categories last because public content references them with RESTRICT.
DELETE FROM product_categories WHERE id::text LIKE '10000000-0000-4000-8000-%';
DELETE FROM event_categories WHERE id::text LIKE '40000000-0000-4000-8000-%';
DELETE FROM destination_categories WHERE id::text LIKE '50000000-0000-4000-8000-%';
DELETE FROM artifact_categories WHERE id::text LIKE '60000000-0000-4000-8000-%';

COMMIT;
