export const name = '007_create_status_history'

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS status_history (
      history_id TEXT PRIMARY KEY,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by TEXT,
      changed_by_role TEXT,
      changed_by_name TEXT,
      remarks TEXT DEFAULT '',
      changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_status_history_record
      ON status_history(record_type, record_id, changed_at);
  `)
}

export default { name, up }
