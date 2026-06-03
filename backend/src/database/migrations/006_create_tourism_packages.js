import {
  PACKAGE_CATEGORIES,
  PACKAGE_ITEM_TYPES,
  PACKAGE_STATUSES,
} from '../../modules/product/product.constants.js'
import { sqlList } from '../sqlHelpers.js'

export const name = '006_create_tourism_packages'

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tourism_packages (
      package_id TEXT PRIMARY KEY,
      package_name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Nature & Eco' CHECK (
        category IN (${sqlList(PACKAGE_CATEGORIES)})
      ),
      target_market TEXT NOT NULL,
      estimated_duration TEXT NOT NULL,
      package_status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        package_status IN (${sqlList(PACKAGE_STATUSES)})
      ),
      remarks TEXT DEFAULT '',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS package_items (
      item_id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (
        item_type IN (${sqlList(PACKAGE_ITEM_TYPES)})
      ),
      item_reference_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES tourism_packages(package_id) ON DELETE CASCADE,
      UNIQUE (package_id, item_type, item_reference_id)
    );

    CREATE INDEX IF NOT EXISTS idx_package_items_package_id
      ON package_items(package_id);
  `)
}

export default { name, up }
