import { DEVELOPMENT_PLAN_STATUSES } from '../../modules/product/product.constants.js'
import { sqlList } from '../sqlHelpers.js'

export const name = '003_create_development_plans'

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS development_plans (
      plan_id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      plan_title TEXT NOT NULL,
      objectives TEXT NOT NULL,
      target_market TEXT NOT NULL,
      improvement_needs TEXT NOT NULL,
      proposed_activities TEXT NOT NULL,
      timeline_start TEXT NOT NULL,
      timeline_end TEXT NOT NULL,
      assigned_personnel TEXT NOT NULL,
      plan_status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        plan_status IN (${sqlList(DEVELOPMENT_PLAN_STATUSES)})
      ),
      remarks TEXT DEFAULT '',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES tourism_assets(asset_id)
    );
  `)
}

export default { name, up }
