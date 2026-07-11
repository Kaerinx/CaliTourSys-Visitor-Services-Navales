-- Simplify Product Development statuses to the revised workflow:
-- Assets and plans keep only Draft/Archived internally.
-- Packages keep Draft/Ready for Promotion/Archived internally.

UPDATE tourism_assets
SET development_status = 'Draft'
WHERE development_status <> 'Archived';

UPDATE development_plans
SET plan_status = 'Draft'
WHERE plan_status <> 'Archived';

UPDATE tourism_packages
SET package_status = 'Ready for Promotion'
WHERE package_status IN ('Approved', 'Published');

UPDATE tourism_packages
SET package_status = 'Draft'
WHERE package_status NOT IN ('Draft', 'Ready for Promotion', 'Archived');

DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tourism_assets'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%development_status%'
  LOOP
    EXECUTE format('ALTER TABLE tourism_assets DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE tourism_assets
ADD CONSTRAINT tourism_assets_development_status_check
CHECK (development_status IN ('Draft', 'Archived'));

DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'development_plans'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%plan_status%'
  LOOP
    EXECUTE format('ALTER TABLE development_plans DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE development_plans
ADD CONSTRAINT development_plans_plan_status_check
CHECK (plan_status IN ('Draft', 'Archived'));

DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tourism_packages'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%package_status%'
  LOOP
    EXECUTE format('ALTER TABLE tourism_packages DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE tourism_packages
ADD CONSTRAINT tourism_packages_package_status_check
CHECK (package_status IN ('Draft', 'Ready for Promotion', 'Archived'));
