-- Allow tourism packages to be built from development plans.

ALTER TABLE package_items
  DROP CONSTRAINT IF EXISTS package_items_item_type_check;

ALTER TABLE package_items
  ADD CONSTRAINT package_items_item_type_check
  CHECK (item_type IN ('Plan', 'Asset'));
