export const name = '004_ready_package'

export function run(db) {
  const asset = db
    .prepare(
      `
        SELECT asset_id
        FROM tourism_assets
        WHERE development_status != 'Archived'
        ORDER BY created_at ASC
        LIMIT 1
      `,
    )
    .get()
  if (!asset) {
    return { packages: 0, packageItems: 0, statusHistory: 0 }
  }

  const packageId = 'PKG-CALABANGA-READY-SAMPLE'

  const packageChanges = db
    .prepare(
      `
        INSERT OR IGNORE INTO tourism_packages (
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
    )
    .run(
      packageId,
      'Calabanga Ready Tourism Sample Package',
      'A sample package already approved for promotion handoff testing.',
      'Nature',
      'Students, families, and eco-tourists',
      'Half day',
      'Ready for Promotion',
      'Sample ready package for readiness workflow and promotion handoff testing.',
      'USR-OFFICER',
    ).changes

  let itemChanges = 0
  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO package_items (
      item_id,
      package_id,
      item_type,
      item_reference_id,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?)
  `)

  if (asset) {
    itemChanges += insertItem.run(
      'PKGITEM-READY-SAMPLE-ASSET',
      packageId,
      'Asset',
      asset.asset_id,
      1,
    ).changes
  }

  const historyChanges = db
    .prepare(
      `
        INSERT OR IGNORE INTO status_history (
          history_id,
          record_type,
          record_id,
          previous_status,
          new_status,
          changed_by,
          changed_by_role,
          changed_by_name,
          remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      'HIST-READY-SAMPLE-PACKAGE',
      'Package',
      packageId,
      'For Review',
      'Ready for Promotion',
      'USR-OFFICER',
      'Tourism Officer',
      'Tourism Officer Demo',
      'Seeded readiness approval for promotion handoff testing.',
    ).changes

  return { packages: packageChanges, packageItems: itemChanges, statusHistory: historyChanges }
}

export default { name, run }
