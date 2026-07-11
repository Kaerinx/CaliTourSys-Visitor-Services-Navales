export const name = '003_sample_packages'

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
    return { packages: 0, packageItems: 0 }
  }

  const packageId = 'PKG-CALABANGA-ECO-INTRO'

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
      'Calabanga Eco Introduction Package',
      'A starter package combining active tourism assets for future review.',
      'Nature',
      'Students, families, and eco-tourists',
      'Half day',
      'Draft',
      'Sample package for package creation workflow testing.',
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
      'PKGITEM-CALABANGA-ECO-ASSET',
      packageId,
      'Asset',
      asset.asset_id,
      1,
    ).changes
  }

  return { packages: packageChanges, packageItems: itemChanges }
}

export default { name, run }
