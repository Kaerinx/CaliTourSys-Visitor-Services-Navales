-- Migration: 016_seed_default_product_categories.sql
-- Purpose: Ensure the Products / OTOP creation form has baseline category options.

INSERT INTO product_categories (slug, name, description, display_order, status)
VALUES
  ('food-products', 'Food Products', 'Prepared meals, food items, and locally made food products.', 10, 'published'),
  ('local-delicacies', 'Local Delicacies', 'Pasalubong, sweets, snacks, and specialty delicacies.', 20, 'published'),
  ('crafts-and-souvenirs', 'Crafts and Souvenirs', 'Handmade crafts, gifts, and souvenir items.', 30, 'published'),
  ('agri-products', 'Agri Products', 'Farm, garden, and locally produced agricultural goods.', 40, 'published'),
  ('wearables-and-textiles', 'Wearables and Textiles', 'Clothing, woven items, accessories, and textile products.', 50, 'published'),
  ('wellness-and-home', 'Wellness and Home', 'Home goods, wellness items, and locally made household products.', 60, 'published')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  updated_at = now();
