import { ASSET_CATEGORIES, ASSET_STATUSES } from '../../modules/product/product.constants.js'
import { sqlList } from '../sqlHelpers.js'

export const name = '002_create_tourism_assets'

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tourism_assets (
      asset_id TEXT PRIMARY KEY,
      asset_name TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL CHECK (
        category IN (${sqlList(ASSET_CATEGORIES)})
      ),
      target_market TEXT NOT NULL,
      development_status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        development_status IN (${sqlList(ASSET_STATUSES)})
      ),
      remarks TEXT DEFAULT '',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export default { name, up }
