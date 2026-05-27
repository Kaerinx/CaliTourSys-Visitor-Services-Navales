import { randomUUID } from 'node:crypto'

import { getDatabase } from '../../config/db.js'
import { findStatusHistoryForRecord } from './statusHistory.model.js'

function mapPackage(row) {
  if (!row) {
    return null
  }

  return {
    id: row.package_id,
    name: row.package_name,
    description: row.description,
    category: row.category || 'Nature & Eco',
    targetMarket: row.target_market,
    estimatedDuration: row.estimated_duration,
    packageStatus: row.package_status,
    remarks: row.remarks || '',
    itemCount: row.item_count || 0,
    assetCount: row.asset_count || 0,
    activityCount: row.activity_count || 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPackageItem(row) {
  if (!row) {
    return null
  }

  return {
    id: row.item_id,
    packageId: row.package_id,
    itemType: row.item_type,
    referenceId: row.item_reference_id,
    sortOrder: row.sort_order,
    name: row.item_name,
    description: row.item_description,
    status: row.item_status,
    assetStatus: row.asset_status,
  }
}

function insertPackageItems(db, packageId, items) {
  const insertItem = db.prepare(`
    INSERT INTO package_items (
      item_id,
      package_id,
      item_type,
      item_reference_id,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?)
  `)

  items.forEach((item, index) => {
    insertItem.run(randomUUID(), packageId, item.itemType, item.referenceId, index + 1)
  })
}

export function findPackages(filters = {}) {
  const db = getDatabase()
  const clauses = []
  const values = []

  if (filters.search) {
    clauses.push(
      '(tp.package_name LIKE ? OR tp.description LIKE ? OR tp.target_market LIKE ? OR tp.category LIKE ?)',
    )
    const searchValue = `%${filters.search}%`
    values.push(searchValue, searchValue, searchValue, searchValue)
  }

  if (filters.status) {
    clauses.push('tp.package_status = ?')
    values.push(filters.status)
  }

  if (filters.targetMarket) {
    clauses.push('tp.target_market LIKE ?')
    values.push(`%${filters.targetMarket}%`)
  }

  if (filters.category) {
    clauses.push('tp.category = ?')
    values.push(filters.category)
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `
        SELECT
          tp.*,
          COUNT(pi.item_id) AS item_count,
          SUM(CASE WHEN pi.item_type = 'Asset' THEN 1 ELSE 0 END) AS asset_count,
          SUM(CASE WHEN pi.item_type = 'Activity' THEN 1 ELSE 0 END) AS activity_count
        FROM tourism_packages tp
        LEFT JOIN package_items pi ON pi.package_id = tp.package_id
        ${whereSql}
        GROUP BY tp.package_id
        ORDER BY
          CASE WHEN tp.package_status = 'Archived' THEN 1 ELSE 0 END,
          tp.updated_at DESC,
          tp.package_name ASC
      `,
    )
    .all(...values)

  return rows.map(mapPackage)
}

export function findPackageById(packageId) {
  const db = getDatabase()
  const row = db
    .prepare(
      `
        SELECT
          tp.*,
          COUNT(pi.item_id) AS item_count,
          SUM(CASE WHEN pi.item_type = 'Asset' THEN 1 ELSE 0 END) AS asset_count,
          SUM(CASE WHEN pi.item_type = 'Activity' THEN 1 ELSE 0 END) AS activity_count
        FROM tourism_packages tp
        LEFT JOIN package_items pi ON pi.package_id = tp.package_id
        WHERE tp.package_id = ?
        GROUP BY tp.package_id
      `,
    )
    .get(packageId)

  const tourismPackage = mapPackage(row)

  if (!tourismPackage) {
    return null
  }

  tourismPackage.items = findPackageItems(packageId)
  tourismPackage.statusHistory = findStatusHistoryForRecord('Package', packageId)

  return tourismPackage
}

export function findPackageItems(packageId) {
  const db = getDatabase()
  const rows = db
    .prepare(
      `
        SELECT
          pi.*,
          CASE
            WHEN pi.item_type = 'Asset' THEN ta.asset_name
            ELSE act.activity_name
          END AS item_name,
          CASE
            WHEN pi.item_type = 'Asset' THEN ta.description
            ELSE act.description
          END AS item_description,
          CASE
            WHEN pi.item_type = 'Asset' THEN ta.development_status
            ELSE act.activity_status
          END AS item_status,
          CASE
            WHEN pi.item_type = 'Asset' THEN ta.development_status
            ELSE activity_asset.development_status
          END AS asset_status
        FROM package_items pi
        LEFT JOIN tourism_assets ta
          ON pi.item_type = 'Asset' AND ta.asset_id = pi.item_reference_id
        LEFT JOIN tourism_activities act
          ON pi.item_type = 'Activity' AND act.activity_id = pi.item_reference_id
        LEFT JOIN tourism_assets activity_asset
          ON pi.item_type = 'Activity' AND activity_asset.asset_id = act.asset_id
        WHERE pi.package_id = ?
        ORDER BY pi.sort_order ASC, item_name ASC
      `,
    )
    .all(packageId)

  return rows.map(mapPackageItem)
}

export function createPackage(packageInput, user) {
  const db = getDatabase()
  const packageId = randomUUID()

  db.exec('BEGIN')
  try {
    db.prepare(
      `
        INSERT INTO tourism_packages (
          package_id,
          package_name,
          description,
          category,
          target_market,
          estimated_duration,
          package_status,
          remarks,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      packageId,
      packageInput.name,
      packageInput.description,
      packageInput.category,
      packageInput.targetMarket,
      packageInput.estimatedDuration,
      packageInput.packageStatus || 'Draft',
      packageInput.remarks || '',
      user?.id || null,
    )

    insertPackageItems(db, packageId, packageInput.items)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return findPackageById(packageId)
}

export function updatePackage(packageId, packageInput) {
  const db = getDatabase()

  db.exec('BEGIN')
  try {
    db.prepare(
      `
        UPDATE tourism_packages
        SET
          package_name = ?,
          description = ?,
          category = ?,
          target_market = ?,
          estimated_duration = ?,
          package_status = ?,
          remarks = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE package_id = ?
      `,
    ).run(
      packageInput.name,
      packageInput.description,
      packageInput.category,
      packageInput.targetMarket,
      packageInput.estimatedDuration,
      packageInput.packageStatus,
      packageInput.remarks || '',
      packageId,
    )

    db.prepare('DELETE FROM package_items WHERE package_id = ?').run(packageId)
    insertPackageItems(db, packageId, packageInput.items)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return findPackageById(packageId)
}

export function archivePackage(packageId) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE tourism_packages
      SET package_status = 'Archived', updated_at = CURRENT_TIMESTAMP
      WHERE package_id = ?
    `,
  ).run(packageId)

  return findPackageById(packageId)
}

export function updatePackageStatus(packageId, packageStatus) {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE tourism_packages
      SET package_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE package_id = ?
    `,
  ).run(packageStatus, packageId)

  return findPackageById(packageId)
}
