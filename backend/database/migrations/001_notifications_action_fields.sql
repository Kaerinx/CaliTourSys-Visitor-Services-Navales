ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS reference_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS action_path TEXT,
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_role_target ON notifications(role_target);
