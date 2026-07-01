import { PACKAGE_CATEGORIES } from '../../modules/product/product.constants.js'
import { sqlList } from '../sqlHelpers.js'

export const name = '008_add_tourism_package_category'

export function up(db) {
  const columns = db.prepare('PRAGMA table_info(tourism_packages)').all()
  const hasCategory = columns.some((column) => column.name === 'category')

  if (hasCategory) {
    return
  }

  db.exec(`
    ALTER TABLE tourism_packages
    ADD COLUMN category TEXT NOT NULL DEFAULT 'Nature' CHECK (
      category IN (${sqlList(PACKAGE_CATEGORIES)})
    );
  `)
}

export default { name, up }
