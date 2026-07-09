CREATE TABLE IF NOT EXISTS event_category_links (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES event_categories(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_event_category_links_category_id
  ON event_category_links(category_id);

INSERT INTO event_category_links (event_id, category_id, display_order)
SELECT e.id, e.category_id, 1
FROM events e
WHERE e.category_id IS NOT NULL
ON CONFLICT (event_id, category_id) DO NOTHING;
