import { randomUUID } from 'node:crypto'

import { getDatabase } from '../../config/db.js'

function mapImprovement(row) {
  if (!row) {
    return null
  }

  return {
    id: row.improvement_id,
    planId: row.plan_id,
    planTitle: row.plan_title,
    planStatus: row.plan_status,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetStatus: row.asset_status,
    progressPercentage: row.progress_percentage,
    improvementStatus: row.improvement_status,
    updateDate: row.update_date,
    remarks: row.remarks,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findImprovements(filters = {}) {
  const db = getDatabase()
  const clauses = []
  const values = []

  if (filters.search) {
    clauses.push(
      `(
        ir.remarks LIKE ?
        OR dp.plan_title LIKE ?
        OR a.asset_name LIKE ?
      )`,
    )
    const searchValue = `%${filters.search}%`
    values.push(searchValue, searchValue, searchValue)
  }

  if (filters.planId) {
    clauses.push('ir.plan_id = ?')
    values.push(filters.planId)
  }

  if (filters.assetId) {
    clauses.push('dp.asset_id = ?')
    values.push(filters.assetId)
  }

  if (filters.status) {
    clauses.push('ir.improvement_status = ?')
    values.push(filters.status)
  }

  if (filters.dateFrom) {
    clauses.push('ir.update_date >= ?')
    values.push(filters.dateFrom)
  }

  if (filters.dateTo) {
    clauses.push('ir.update_date <= ?')
    values.push(filters.dateTo)
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `
        SELECT
          ir.*,
          dp.plan_title,
          dp.plan_status,
          dp.asset_id,
          a.asset_name,
          a.development_status AS asset_status
        FROM improvement_records ir
        INNER JOIN development_plans dp ON dp.plan_id = ir.plan_id
        INNER JOIN tourism_assets a ON a.asset_id = dp.asset_id
        ${whereSql}
        ORDER BY
          CASE WHEN ir.improvement_status = 'Archived' THEN 1 ELSE 0 END,
          ir.update_date DESC,
          ir.updated_at DESC
      `,
    )
    .all(...values)

  return rows.map(mapImprovement)
}

export function findImprovementById(improvementId) {
  const db = getDatabase()
  const row = db
    .prepare(
      `
        SELECT
          ir.*,
          dp.plan_title,
          dp.plan_status,
          dp.asset_id,
          a.asset_name,
          a.development_status AS asset_status
        FROM improvement_records ir
        INNER JOIN development_plans dp ON dp.plan_id = ir.plan_id
        INNER JOIN tourism_assets a ON a.asset_id = dp.asset_id
        WHERE ir.improvement_id = ?
      `,
    )
    .get(improvementId)

  return mapImprovement(row)
}

export function createImprovement(improvementInput, user) {
  const db = getDatabase()
  const improvementId = randomUUID()

  db.prepare(
    `
      INSERT INTO improvement_records (
        improvement_id,
        plan_id,
        progress_percentage,
        improvement_status,
        update_date,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    improvementId,
    improvementInput.planId,
    improvementInput.progressPercentage,
    improvementInput.improvementStatus || 'Ongoing',
    improvementInput.updateDate,
    improvementInput.remarks,
    user?.id || null,
  )

  return findImprovementById(improvementId)
}

export function updateImprovement(improvementId, improvementInput) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE improvement_records
      SET
        plan_id = ?,
        progress_percentage = ?,
        improvement_status = ?,
        update_date = ?,
        remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE improvement_id = ?
    `,
  ).run(
    improvementInput.planId,
    improvementInput.progressPercentage,
    improvementInput.improvementStatus,
    improvementInput.updateDate,
    improvementInput.remarks,
    improvementId,
  )

  return findImprovementById(improvementId)
}

export function archiveImprovement(improvementId) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE improvement_records
      SET improvement_status = 'Archived', updated_at = CURRENT_TIMESTAMP
      WHERE improvement_id = ?
    `,
  ).run(improvementId)

  return findImprovementById(improvementId)
}
