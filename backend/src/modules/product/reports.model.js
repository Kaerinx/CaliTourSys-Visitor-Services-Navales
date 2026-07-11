import { getDatabase } from '../../config/db.js'

function countRows(db, sql, ...params) {
  return db.prepare(sql).get(...params)?.count || 0
}

export function getProductReportSummary() {
  const db = getDatabase()

  return {
    assets: {
      total: countRows(db, 'SELECT COUNT(*) AS count FROM tourism_assets'),
      active: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_assets WHERE development_status != 'Archived'",
      ),
      archived: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_assets WHERE development_status = 'Archived'",
      ),
    },
    developmentPlans: {
      total: countRows(db, 'SELECT COUNT(*) AS count FROM development_plans'),
      active: countRows(
        db,
        "SELECT COUNT(*) AS count FROM development_plans WHERE plan_status != 'Archived'",
      ),
      archived: countRows(
        db,
        "SELECT COUNT(*) AS count FROM development_plans WHERE plan_status = 'Archived'",
      ),
    },
    packages: {
      total: countRows(db, 'SELECT COUNT(*) AS count FROM tourism_packages'),
      active: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_packages WHERE package_status != 'Archived'",
      ),
      archived: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_packages WHERE package_status = 'Archived'",
      ),
      readyForPromotion: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_packages WHERE package_status = 'Ready for Promotion'",
      ),
      incomplete: countRows(
        db,
        `
          SELECT COUNT(*) AS count
          FROM (
            SELECT tp.package_id
            FROM tourism_packages tp
            LEFT JOIN package_items pi ON pi.package_id = tp.package_id
            WHERE tp.package_status != 'Archived'
            GROUP BY tp.package_id
            HAVING COUNT(pi.item_id) = 0
          )
        `,
      ),
    },
  }
}
