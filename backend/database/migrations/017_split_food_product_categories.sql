-- Migration: 017_split_food_product_categories.sql
-- Purpose: Split the broad Food and Delicacies category into clearer product choices.

UPDATE product_categories
SET
  slug = 'food-products',
  name = 'Food Products',
  description = 'Prepared meals, food items, and locally made food products.',
  display_order = 10,
  status = 'published',
  updated_at = now()
WHERE slug = 'food-and-delicacies';

INSERT INTO product_categories (slug, name, description, display_order, status)
VALUES
  ('food-products', 'Food Products', 'Prepared meals, food items, and locally made food products.', 10, 'published'),
  ('local-delicacies', 'Local Delicacies', 'Pasalubong, sweets, snacks, and specialty delicacies.', 20, 'published')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  updated_at = now();

UPDATE product_categories
SET display_order = CASE slug
  WHEN 'crafts-and-souvenirs' THEN 30
  WHEN 'agri-products' THEN 40
  WHEN 'wearables-and-textiles' THEN 50
  WHEN 'wellness-and-home' THEN 60
  ELSE display_order
END
WHERE slug IN (
  'crafts-and-souvenirs',
  'agri-products',
  'wearables-and-textiles',
  'wellness-and-home'
);
