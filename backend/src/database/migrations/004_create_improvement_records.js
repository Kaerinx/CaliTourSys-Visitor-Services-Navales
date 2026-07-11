import { IMPROVEMENT_STATUSES } from '../../modules/product/product.constants.js'
import { sqlList } from '../sqlHelpers.js'

export const name = '004_create_improvement_records'

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS improvement_records (
      improvement_id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      progress_percentage INTEGER NOT NULL CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
      ),
      improvement_status TEXT NOT NULL DEFAULT 'Ongoing' CHECK (
        improvement_status IN (${sqlList(IMPROVEMENT_STATUSES)})
      ),
      update_date TEXT NOT NULL,
      remarks TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES development_plans(plan_id)
    );
  `)
}

export default { name, up }
