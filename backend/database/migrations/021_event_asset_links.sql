CREATE TABLE IF NOT EXISTS event_asset_links (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES tourism_assets(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_event_asset_links_asset_id
  ON event_asset_links(asset_id);

INSERT INTO event_asset_links (event_id, asset_id, display_order)
SELECT e.id, e.related_asset_id, 1
FROM events e
WHERE e.related_asset_id IS NOT NULL
ON CONFLICT (event_id, asset_id) DO NOTHING;
