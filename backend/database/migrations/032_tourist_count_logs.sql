CREATE TABLE IF NOT EXISTS tourist_count_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  accreditation_record_id UUID REFERENCES accreditation_records(id) ON DELETE SET NULL,
  submitted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  log_date DATE NOT NULL,
  adult_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_logs_adult_count_nonnegative_check CHECK (adult_count >= 0),
  senior_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_logs_senior_count_nonnegative_check CHECK (senior_count >= 0),
  children_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_logs_children_count_nonnegative_check CHECK (children_count >= 0),
  local_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_logs_local_count_nonnegative_check CHECK (local_count >= 0),
  domestic_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_logs_domestic_count_nonnegative_check CHECK (domestic_count >= 0),
  international_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_logs_international_count_nonnegative_check CHECK (international_count >= 0),
  visit_context VARCHAR(40),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted'
    CONSTRAINT tourist_count_logs_status_value_check
    CHECK (status IN ('submitted', 'verified', 'returned', 'voided')),
  verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tourist_count_logs_profile_date_unique UNIQUE (business_profile_id, log_date),
  CONSTRAINT tourist_count_logs_classification_check CHECK (
    domestic_count + international_count <= adult_count + senior_count + children_count
  ),
  CONSTRAINT tourist_count_logs_local_count_check CHECK (
    local_count = adult_count + senior_count + children_count - domestic_count - international_count
  )
);

CREATE INDEX IF NOT EXISTS idx_tourist_count_logs_profile_date
  ON tourist_count_logs (business_profile_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_tourist_count_logs_status_date
  ON tourist_count_logs (status, log_date DESC);

DROP TRIGGER IF EXISTS trg_tourist_count_logs_updated_at ON tourist_count_logs;
CREATE TRIGGER trg_tourist_count_logs_updated_at
BEFORE UPDATE ON tourist_count_logs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
