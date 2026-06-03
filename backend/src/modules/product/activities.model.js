import { randomUUID } from 'node:crypto'

import { getDatabase } from '../../config/db.js'

function mapActivity(row) {
  if (!row) {
    return null
  }

  return {
    id: row.activity_id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetStatus: row.asset_status,
    planId: row.plan_id,
    planTitle: row.plan_title,
    planStatus: row.plan_status,
    name: row.activity_name,
    description: row.description,
    duration: row.duration,
    targetMarket: row.target_market,
    activityStatus: row.activity_status,
    remarks: row.remarks || '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findActivities(filters = {}) {
  const db = getDatabase()
  const clauses = []
  const values = []

  if (filters.search) {
    clauses.push(
      `(
        ta.activity_name LIKE ?
        OR ta.description LIKE ?
        OR ta.target_market LIKE ?
        OR a.asset_name LIKE ?
        OR dp.plan_title LIKE ?
      )`,
    )
    const searchValue = `%${filters.search}%`
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue)
  }

  if (filters.assetId) {
    clauses.push('ta.asset_id = ?')
    values.push(filters.assetId)
  }

  if (filters.planId) {
    clauses.push('ta.plan_id = ?')
    values.push(filters.planId)
  }

  if (filters.status) {
    clauses.push('ta.activity_status = ?')
    values.push(filters.status)
  }

  if (filters.targetMarket) {
    clauses.push('ta.target_market LIKE ?')
    values.push(`%${filters.targetMarket}%`)
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `
        SELECT
          ta.*,
          a.asset_name,
          a.development_status AS asset_status,
          dp.plan_title,
          dp.plan_status
        FROM tourism_activities ta
        INNER JOIN tourism_assets a ON a.asset_id = ta.asset_id
        LEFT JOIN development_plans dp ON dp.plan_id = ta.plan_id
        ${whereSql}
        ORDER BY
          CASE WHEN ta.activity_status = 'Archived' THEN 1 ELSE 0 END,
          ta.updated_at DESC,
          ta.activity_name ASC
      `,
    )
    .all(...values)

  return rows.map(mapActivity)
}

export function findActivityById(activityId) {
  const db = getDatabase()
  const row = db
    .prepare(
      `
        SELECT
          ta.*,
          a.asset_name,
          a.development_status AS asset_status,
          dp.plan_title,
          dp.plan_status
        FROM tourism_activities ta
        INNER JOIN tourism_assets a ON a.asset_id = ta.asset_id
        LEFT JOIN development_plans dp ON dp.plan_id = ta.plan_id
        WHERE ta.activity_id = ?
      `,
    )
    .get(activityId)

  return mapActivity(row)
}

export function createActivity(activityInput, user) {
  const db = getDatabase()
  const activityId = randomUUID()

  db.prepare(
    `
      INSERT INTO tourism_activities (
        activity_id,
        asset_id,
        plan_id,
        activity_name,
        description,
        duration,
        target_market,
        activity_status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    activityId,
    activityInput.assetId,
    activityInput.planId || null,
    activityInput.name,
    activityInput.description,
    activityInput.duration,
    activityInput.targetMarket,
    activityInput.activityStatus || 'Draft',
    activityInput.remarks || '',
    user?.id || null,
  )

  return findActivityById(activityId)
}

export function updateActivity(activityId, activityInput) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE tourism_activities
      SET
        asset_id = ?,
        plan_id = ?,
        activity_name = ?,
        description = ?,
        duration = ?,
        target_market = ?,
        activity_status = ?,
        remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE activity_id = ?
    `,
  ).run(
    activityInput.assetId,
    activityInput.planId || null,
    activityInput.name,
    activityInput.description,
    activityInput.duration,
    activityInput.targetMarket,
    activityInput.activityStatus,
    activityInput.remarks || '',
    activityId,
  )

  return findActivityById(activityId)
}

export function archiveActivity(activityId) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE tourism_activities
      SET activity_status = 'Archived', updated_at = CURRENT_TIMESTAMP
      WHERE activity_id = ?
    `,
  ).run(activityId)

  return findActivityById(activityId)
}
