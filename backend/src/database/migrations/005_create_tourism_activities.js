import { ACTIVITY_STATUSES } from '../../modules/product/product.constants.js'
import { sqlList } from '../sqlHelpers.js'

export const name = '005_create_tourism_activities'

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tourism_activities (
      activity_id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      plan_id TEXT,
      activity_name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration TEXT NOT NULL,
      target_market TEXT NOT NULL,
      activity_status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        activity_status IN (${sqlList(ACTIVITY_STATUSES)})
      ),
      remarks TEXT DEFAULT '',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES tourism_assets(asset_id),
      FOREIGN KEY (plan_id) REFERENCES development_plans(plan_id)
    );
  `)
}

export default { name, up }
