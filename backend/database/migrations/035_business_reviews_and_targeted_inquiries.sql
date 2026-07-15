BEGIN;

-- Preserve the canonical accreditation profile behind public business records.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS source_business_profile_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_source_business_profile_id_fkey'
      AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_source_business_profile_id_fkey
      FOREIGN KEY (source_business_profile_id)
      REFERENCES business_profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_source_business_profile_id
  ON businesses(source_business_profile_id);

-- Accreditation renewals can produce several accreditation rows for the same
-- profile. Only backfill a public business when every matching accreditation
-- number resolves to one unambiguous business profile.
WITH profile_matches AS (
  SELECT
    ba.business_id,
    MIN(ar.business_profile_id::text)::uuid AS business_profile_id
  FROM business_accreditations ba
  JOIN accreditation_records ar
    ON NULLIF(trim(ba.accreditation_number), '') = NULLIF(trim(ar.record_number), '')
  WHERE ba.accreditation_number IS NOT NULL
  GROUP BY ba.business_id
  HAVING COUNT(DISTINCT ar.business_profile_id) = 1
)
UPDATE businesses b
SET source_business_profile_id = profile_matches.business_profile_id
FROM profile_matches
WHERE b.id = profile_matches.business_id
  AND b.source_business_profile_id IS NULL;

-- Reviews are normalized through explicit foreign keys. Exactly one target is
-- present for every row, while a deleted tourist account leaves an anonymous
-- review rather than deleting the public feedback.
CREATE TABLE IF NOT EXISTS tourism_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_account_id uuid REFERENCES tourist_accounts(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES business_profiles(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourism_reviews_rating_valid CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT tourism_reviews_comment_not_blank CHECK (
    comment IS NULL OR length(trim(comment)) > 0
  ),
  CONSTRAINT tourism_reviews_exactly_one_target CHECK (
    num_nonnulls(product_id, destination_id, business_profile_id, business_id) = 1
  )
);

DROP TRIGGER IF EXISTS trg_tourism_reviews_updated_at ON tourism_reviews;
CREATE TRIGGER trg_tourism_reviews_updated_at
BEFORE UPDATE ON tourism_reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS ux_tourism_reviews_tourist_product
  ON tourism_reviews(tourist_account_id, product_id)
  WHERE tourist_account_id IS NOT NULL AND product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tourism_reviews_tourist_destination
  ON tourism_reviews(tourist_account_id, destination_id)
  WHERE tourist_account_id IS NOT NULL AND destination_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tourism_reviews_tourist_business_profile
  ON tourism_reviews(tourist_account_id, business_profile_id)
  WHERE tourist_account_id IS NOT NULL AND business_profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tourism_reviews_tourist_business
  ON tourism_reviews(tourist_account_id, business_id)
  WHERE tourist_account_id IS NOT NULL AND business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_reviews_product_created_at
  ON tourism_reviews(product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_reviews_destination_created_at
  ON tourism_reviews(destination_id, created_at DESC)
  WHERE destination_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_reviews_business_profile_created_at
  ON tourism_reviews(business_profile_id, created_at DESC)
  WHERE business_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_reviews_business_created_at
  ON tourism_reviews(business_id, created_at DESC)
  WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_reviews_tourist_created_at
  ON tourism_reviews(tourist_account_id, created_at DESC)
  WHERE tourist_account_id IS NOT NULL;

-- Product inquiries keep their original public inquiry record while gaining
-- enough relational context for tourist history and owner-scoped dashboards.
ALTER TABLE tourism_inquiries
  ADD COLUMN IF NOT EXISTS tourist_account_id uuid REFERENCES tourist_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_profile_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_tourist_account_created_at
  ON tourism_inquiries(tourist_account_id, created_at DESC)
  WHERE tourist_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_product_created_at
  ON tourism_inquiries(product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_business_created_at
  ON tourism_inquiries(business_id, created_at DESC)
  WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourism_inquiries_business_profile_created_at
  ON tourism_inquiries(business_profile_id, created_at DESC)
  WHERE business_profile_id IS NOT NULL;

-- Older product-contact submissions stored only `/products/{slug}`. Match the
-- complete normalized path so generic inquiries and partial path matches are
-- never assigned to an owner accidentally.
WITH source_product_matches AS (
  SELECT
    i.id AS inquiry_id,
    p.id AS product_id
  FROM tourism_inquiries i
  JOIN products p
    ON lower(regexp_replace(split_part(trim(i.source_page), '?', 1), '/+$', '')) =
       '/products/' || lower(p.slug)
  WHERE i.product_id IS NULL
    AND NULLIF(trim(i.source_page), '') IS NOT NULL
)
UPDATE tourism_inquiries i
SET product_id = source_product_matches.product_id
FROM source_product_matches
WHERE i.id = source_product_matches.inquiry_id;

-- Product ownership is derived from the relational product/business records,
-- never from an owner identifier supplied by a public client.
UPDATE tourism_inquiries i
SET
  business_id = COALESCE(i.business_id, p.business_id),
  business_profile_id = COALESCE(i.business_profile_id, b.source_business_profile_id)
FROM products p
JOIN businesses b ON b.id = p.business_id
WHERE i.product_id = p.id
  AND (
    i.business_id IS NULL
    OR (i.business_profile_id IS NULL AND b.source_business_profile_id IS NOT NULL)
  );

UPDATE tourism_inquiries i
SET business_profile_id = b.source_business_profile_id
FROM businesses b
WHERE i.business_id = b.id
  AND i.business_profile_id IS NULL
  AND b.source_business_profile_id IS NOT NULL;

COMMIT;
