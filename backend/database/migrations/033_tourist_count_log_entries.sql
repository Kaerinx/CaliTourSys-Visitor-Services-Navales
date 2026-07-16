CREATE TABLE IF NOT EXISTS tourist_count_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_count_log_id UUID NOT NULL
    REFERENCES tourist_count_logs(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  adult_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_log_entries_adult_nonnegative_check CHECK (adult_count >= 0),
  senior_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_log_entries_senior_nonnegative_check CHECK (senior_count >= 0),
  children_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_log_entries_children_nonnegative_check CHECK (children_count >= 0),
  local_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_log_entries_local_nonnegative_check CHECK (local_count >= 0),
  domestic_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_log_entries_domestic_nonnegative_check CHECK (domestic_count >= 0),
  international_count INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tourist_count_log_entries_international_nonnegative_check CHECK (international_count >= 0),
  visit_context VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tourist_count_log_entries_classification_check CHECK (
    domestic_count + international_count <= adult_count + senior_count + children_count
  ),
  CONSTRAINT tourist_count_log_entries_local_count_check CHECK (
    local_count = adult_count + senior_count + children_count - domestic_count - international_count
  )
);

CREATE INDEX IF NOT EXISTS idx_tourist_count_log_entries_log_time
  ON tourist_count_log_entries (tourist_count_log_id, entry_time DESC);

DROP TRIGGER IF EXISTS trg_tourist_count_log_entries_updated_at ON tourist_count_log_entries;
CREATE TRIGGER trg_tourist_count_log_entries_updated_at
BEFORE UPDATE ON tourist_count_log_entries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
