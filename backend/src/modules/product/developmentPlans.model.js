import { randomUUID } from 'node:crypto'

import { getDatabase } from '../../config/db.js'

function mapDevelopmentPlan(row) {
  if (!row) {
    return null
  }

  return {
    id: row.plan_id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetStatus: row.asset_status,
    planTitle: row.plan_title,
    objectives: row.objectives,
    targetMarket: row.target_market,
    improvementNeeds: row.improvement_needs,
    proposedActivities: row.proposed_activities,
    timelineStart: row.timeline_start,
    timelineEnd: row.timeline_end,
    assignedPersonnel: row.assigned_personnel,
    planStatus: row.plan_status,
    remarks: row.remarks || '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findDevelopmentPlans(filters = {}) {
  const db = getDatabase()
  const clauses = []
  const values = []

  if (filters.search) {
    clauses.push(
      `(
        dp.plan_title LIKE ?
        OR dp.objectives LIKE ?
        OR dp.target_market LIKE ?
        OR dp.improvement_needs LIKE ?
        OR dp.proposed_activities LIKE ?
        OR a.asset_name LIKE ?
      )`,
    )
    const searchValue = `%${filters.search}%`
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue)
  }

  if (filters.assetId) {
    clauses.push('dp.asset_id = ?')
    values.push(filters.assetId)
  }

  if (filters.status) {
    clauses.push('dp.plan_status = ?')
    values.push(filters.status)
  }

  if (filters.targetMarket) {
    clauses.push('dp.target_market LIKE ?')
    values.push(`%${filters.targetMarket}%`)
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `
        SELECT
          dp.*,
          a.asset_name,
          a.development_status AS asset_status
        FROM development_plans dp
        INNER JOIN tourism_assets a ON a.asset_id = dp.asset_id
        ${whereSql}
        ORDER BY
          CASE WHEN dp.plan_status = 'Archived' THEN 1 ELSE 0 END,
          dp.updated_at DESC,
          dp.plan_title ASC
      `,
    )
    .all(...values)

  return rows.map(mapDevelopmentPlan)
}

export function findDevelopmentPlanById(planId) {
  const db = getDatabase()
  const row = db
    .prepare(
      `
        SELECT
          dp.*,
          a.asset_name,
          a.development_status AS asset_status
        FROM development_plans dp
        INNER JOIN tourism_assets a ON a.asset_id = dp.asset_id
        WHERE dp.plan_id = ?
      `,
    )
    .get(planId)

  return mapDevelopmentPlan(row)
}

export function createDevelopmentPlan(planInput, user) {
  const db = getDatabase()
  const planId = randomUUID()

  db.prepare(
    `
      INSERT INTO development_plans (
        plan_id,
        asset_id,
        plan_title,
        objectives,
        target_market,
        improvement_needs,
        proposed_activities,
        timeline_start,
        timeline_end,
        assigned_personnel,
        plan_status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    planId,
    planInput.assetId,
    planInput.planTitle,
    planInput.objectives,
    planInput.targetMarket,
    planInput.improvementNeeds,
    planInput.proposedActivities,
    planInput.timelineStart,
    planInput.timelineEnd,
    planInput.assignedPersonnel,
    planInput.planStatus || 'Draft',
    planInput.remarks || '',
    user?.id || null,
  )

  return findDevelopmentPlanById(planId)
}

export function updateDevelopmentPlan(planId, planInput) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE development_plans
      SET
        asset_id = ?,
        plan_title = ?,
        objectives = ?,
        target_market = ?,
        improvement_needs = ?,
        proposed_activities = ?,
        timeline_start = ?,
        timeline_end = ?,
        assigned_personnel = ?,
        plan_status = ?,
        remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE plan_id = ?
    `,
  ).run(
    planInput.assetId,
    planInput.planTitle,
    planInput.objectives,
    planInput.targetMarket,
    planInput.improvementNeeds,
    planInput.proposedActivities,
    planInput.timelineStart,
    planInput.timelineEnd,
    planInput.assignedPersonnel,
    planInput.planStatus,
    planInput.remarks || '',
    planId,
  )

  return findDevelopmentPlanById(planId)
}

export function archiveDevelopmentPlan(planId) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE development_plans
      SET plan_status = 'Archived', updated_at = CURRENT_TIMESTAMP
      WHERE plan_id = ?
    `,
  ).run(planId)

  return findDevelopmentPlanById(planId)
}
