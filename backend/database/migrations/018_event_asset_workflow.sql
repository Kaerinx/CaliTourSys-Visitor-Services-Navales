-- Migration: 018_event_asset_workflow.sql
-- Scope: Link events to optional tourism assets and ensure public event categories.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS related_asset_id uuid REFERENCES tourism_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_related_asset_id ON events(related_asset_id);

COMMENT ON COLUMN events.related_asset_id IS 'Optional tourism asset or venue connected to this time-based event.';

INSERT INTO event_categories (slug, name, description, display_order, status)
VALUES
  ('festival', 'Festival', 'Annual or seasonal festivals promoted for visitors.', 10, 'published'),
  ('cultural', 'Cultural', 'Cultural programs, traditions, performances, and heritage activities.', 20, 'published'),
  ('religious', 'Religious', 'Faith-based celebrations, processions, and religious observances.', 30, 'published'),
  ('food', 'Food', 'Food events, culinary promotions, tastings, and local cuisine activities.', 40, 'published'),
  ('sports', 'Sports', 'Sports tournaments, fitness activities, and recreation events.', 50, 'published'),
  ('community', 'Community', 'Barangay, civic, and community celebrations.', 60, 'published'),
  ('tourism-activity', 'Tourism Activity', 'Tours, visitor programs, and tourism office-led activities.', 70, 'published'),
  ('trade-fair-otop', 'Trade Fair / OTOP', 'Trade fairs, OTOP showcases, producer fairs, and livelihood exhibits.', 80, 'published')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  updated_at = now();
