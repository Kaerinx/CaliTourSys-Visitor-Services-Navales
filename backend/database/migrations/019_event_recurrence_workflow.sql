ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_type varchar(40) NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS usual_month integer,
  ADD COLUMN IF NOT EXISTS next_occurrence_date date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_recurrence_type_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_recurrence_type_check
      CHECK (recurrence_type IN ('one_time', 'yearly', 'twice_a_year'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_usual_month_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_usual_month_check
      CHECK (usual_month IS NULL OR usual_month BETWEEN 1 AND 12);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_recurrence_type ON events (recurrence_type);
CREATE INDEX IF NOT EXISTS idx_events_next_occurrence_date ON events (next_occurrence_date);

COMMENT ON COLUMN events.is_recurring IS 'Marks annual or occasional tourism events for planning.';
COMMENT ON COLUMN events.recurrence_type IS 'Planning recurrence type: one_time, yearly, or twice_a_year.';
COMMENT ON COLUMN events.usual_month IS 'Typical calendar month for recurring events, 1-12.';
COMMENT ON COLUMN events.next_occurrence_date IS 'Optional next planned occurrence date before schedule is confirmed.';
