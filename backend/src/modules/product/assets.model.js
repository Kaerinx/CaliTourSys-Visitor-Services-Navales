import { randomUUID } from 'node:crypto'

import { getDatabase } from '../../config/db.js'

function mapAsset(row) {
  if (!row) {
    return null
  }

  return {
    id: row.asset_id,
    name: row.asset_name,
    description: row.description,
    location: row.location,
    category: row.category,
    targetMarket: row.target_market,
    developmentStatus: row.development_status,
    remarks: row.remarks || '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findAssets(filters = {}) {
  const db = getDatabase()
  const clauses = []
  const values = []

  if (filters.search) {
    clauses.push(
      '(asset_name LIKE ? OR description LIKE ? OR location LIKE ? OR target_market LIKE ?)',
    )
    const searchValue = `%${filters.search}%`
    values.push(searchValue, searchValue, searchValue, searchValue)
  }

  if (filters.category) {
    clauses.push('category = ?')
    values.push(filters.category)
  }

  if (filters.status) {
    clauses.push('development_status = ?')
    values.push(filters.status)
  }

  if (filters.location) {
    clauses.push('location LIKE ?')
    values.push(`%${filters.location}%`)
  }

  if (filters.targetMarket) {
    clauses.push('target_market LIKE ?')
    values.push(`%${filters.targetMarket}%`)
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `
        SELECT *
        FROM tourism_assets
        ${whereSql}
        ORDER BY
          CASE WHEN development_status = 'Archived' THEN 1 ELSE 0 END,
          updated_at DESC,
          asset_name ASC
      `,
    )
    .all(...values)

  return rows.map(mapAsset)
}

export function findAssetById(assetId) {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM tourism_assets WHERE asset_id = ?').get(assetId)

  return mapAsset(row)
}

export function createAsset(assetInput, user) {
  const db = getDatabase()
  const assetId = randomUUID()

  db.prepare(
    `
      INSERT INTO tourism_assets (
        asset_id,
        asset_name,
        description,
        location,
        category,
        target_market,
        development_status,
        remarks,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    assetId,
    assetInput.name,
    assetInput.description,
    assetInput.location,
    assetInput.category,
    assetInput.targetMarket,
    assetInput.developmentStatus || 'Draft',
    assetInput.remarks || '',
    user?.id || null,
  )

  return findAssetById(assetId)
}

export function updateAsset(assetId, assetInput) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE tourism_assets
      SET
        asset_name = ?,
        description = ?,
        location = ?,
        category = ?,
        target_market = ?,
        development_status = ?,
        remarks = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE asset_id = ?
    `,
  ).run(
    assetInput.name,
    assetInput.description,
    assetInput.location,
    assetInput.category,
    assetInput.targetMarket,
    assetInput.developmentStatus,
    assetInput.remarks || '',
    assetId,
  )

  return findAssetById(assetId)
}

export function archiveAsset(assetId) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE tourism_assets
      SET development_status = 'Archived', updated_at = CURRENT_TIMESTAMP
      WHERE asset_id = ?
    `,
  ).run(assetId)

  return findAssetById(assetId)
}
