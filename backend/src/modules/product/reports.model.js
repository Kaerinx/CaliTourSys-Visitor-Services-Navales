import { getDatabase } from '../../config/db.js'

function countRows(db, sql, ...params) {
  return db.prepare(sql).get(...params)?.count || 0
}

function groupByStatus(db, table, statusColumn) {
  return db
    .prepare(
      `
        SELECT ${statusColumn} AS status, COUNT(*) AS count
        FROM ${table}
        GROUP BY ${statusColumn}
        ORDER BY ${statusColumn} ASC
      `,
    )
    .all()
}

export function getProductReportSummary() {
  const db = getDatabase()
  const averageProgress =
    db.prepare('SELECT ROUND(AVG(progress_percentage), 0) AS value FROM improvement_records').get()
      .value || 0

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
      byStatus: groupByStatus(db, 'tourism_assets', 'development_status'),
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
      byStatus: groupByStatus(db, 'development_plans', 'plan_status'),
    },
    improvements: {
      total: countRows(db, 'SELECT COUNT(*) AS count FROM improvement_records'),
      delayed: countRows(
        db,
        "SELECT COUNT(*) AS count FROM improvement_records WHERE improvement_status = 'Delayed'",
      ),
      completed: countRows(
        db,
        "SELECT COUNT(*) AS count FROM improvement_records WHERE improvement_status = 'Completed'",
      ),
      averageProgress,
      byStatus: groupByStatus(db, 'improvement_records', 'improvement_status'),
    },
    activities: {
      total: countRows(db, 'SELECT COUNT(*) AS count FROM tourism_activities'),
      active: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_activities WHERE activity_status != 'Archived'",
      ),
      archived: countRows(
        db,
        "SELECT COUNT(*) AS count FROM tourism_activities WHERE activity_status = 'Archived'",
      ),
      byStatus: groupByStatus(db, 'tourism_activities', 'activity_status'),
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
      byStatus: groupByStatus(db, 'tourism_packages', 'package_status'),
    },
  }
}
