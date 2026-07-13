const { query } = require('../../config/db')
const {
  PACKAGE_CATEGORIES,
  PACKAGE_STATUSES,
  PUBLIC_PACKAGE_STATUSES,
} = require('./constants')

function addParam(params, value) {
  params.push(value)
  return `$${params.length}`
}

function mapAsset(row) {
  if (!row) return null
  const images = Array.isArray(row.images) ? row.images : []
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    category: row.category,
    targetMarket: row.target_market,
    developmentStatus: row.development_status,
    imageUrl: images[0]?.imageUrl || row.image_url,
    images,
    remarks: row.remarks || '',
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    sourceAccreditationRecordId: row.source_accreditation_record_id || null,
    sourceBusinessProfileId: row.source_business_profile_id || null,
    sourceAccreditationRecordNumber: row.source_accreditation_record_number || null,
    sourceBusinessName: row.source_business_name || null,
    sourceBusinessType: row.source_business_type || null,
    sourceOwnerName: row.source_owner_name || null,
    sourceOwnerEmail: row.source_owner_email || null,
    sourceOwnerPhone: row.source_owner_phone || null,
    sourceLatitude: row.source_latitude == null ? null : Number(row.source_latitude),
    sourceLongitude: row.source_longitude == null ? null : Number(row.source_longitude),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAccreditedEstablishment(row) {
  if (!row) return null
  const location = [
    row.street_address,
    row.barangay,
    row.city_municipality,
    row.province,
  ]
    .filter(Boolean)
    .join(', ')

  return {
    id: row.id,
    recordNumber: row.record_number,
    status: row.status,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    applicationNumber: row.application_number,
    accreditationType: row.accreditation_type,
    businessProfileId: row.business_profile_id,
    businessName: row.business_name,
    businessType: row.business_type,
    businessPermitNumber: row.business_permit_number,
    dtiSecRegistrationNumber: row.dti_sec_registration_number,
    region: row.region,
    province: row.province,
    cityMunicipality: row.city_municipality,
    barangay: row.barangay,
    streetAddress: row.street_address,
    location,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    ownerName: [row.first_name, row.last_name].filter(Boolean).join(' '),
    ownerEmail: row.email || '',
    ownerPhone: row.phone || '',
  }
}

function mapAssetImage(row) {
  if (!row) return null
  return {
    id: row.id,
    assetId: row.asset_id,
    imageUrl: row.image_url,
    originalName: row.original_name || '',
    mimeType: row.mime_type || '',
    fileSize: Number(row.file_size || 0),
    sortOrder: Number(row.display_order || 0),
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
  }
}

function mapPlan(row) {
  if (!row) return null
  return {
    id: row.id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetLocation: row.asset_location,
    assetStatus: row.asset_status,
    title: row.title,
    objectives: row.objectives,
    targetMarket: row.target_market,
    improvementNeeds: row.improvement_needs,
    proposedActivities: row.proposed_activities,
    timelineStart: row.timeline_start,
    timelineEnd: row.timeline_end,
    timelineStartTime: row.timeline_start_time,
    timelineEndTime: row.timeline_end_time,
    assignedPersonnel: row.assigned_personnel,
    planStatus: row.plan_status,
    remarks: row.remarks || '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapImprovement(row) {
  if (!row) return null
  return {
    id: row.id,
    planId: row.plan_id,
    planTitle: row.plan_title,
    planStatus: row.plan_status,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetStatus: row.asset_status,
    progressPercentage: Number(row.progress_percentage || 0),
    improvementStatus: row.improvement_status,
    updateDate: row.update_date,
    remarks: row.remarks || '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapActivity(row) {
  if (!row) return null
  return {
    id: row.id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetStatus: row.asset_status,
    planId: row.plan_id,
    planTitle: row.plan_title,
    planStatus: row.plan_status,
    name: row.name,
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

function mapPackage(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: packageSlug(row),
    name: row.name,
    description: row.description,
    category: row.category || 'Nature',
    targetMarket: row.target_market,
    estimatedDuration: row.estimated_duration,
    durationDays: row.duration_days == null ? null : Number(row.duration_days),
    departureCapacity: row.departure_capacity == null ? null : Number(row.departure_capacity),
    basePrice: row.base_price == null ? null : Number(row.base_price),
    basePax: row.base_pax == null ? null : Number(row.base_pax),
    extraPaxPrice: row.extra_pax_price == null ? null : Number(row.extra_pax_price),
    minPax: row.min_pax == null ? null : Number(row.min_pax),
    maxPax: row.max_pax == null ? null : Number(row.max_pax),
    paymentRequired: Boolean(row.payment_required),
    packageStatus: row.package_status,
    remarks: row.remarks || '',
    imageUrl: row.image_url || categoryImage(row.category),
    itemCount: Number(row.item_count || 0),
    planCount: Number(row.plan_count || 0),
    assetCount: Number(row.asset_count || 0),
    activityCount: Number(row.activity_count || 0),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPackageItem(row) {
  if (!row) return null
  return {
    id: row.id,
    packageId: row.package_id,
    itemType: row.item_type,
    referenceId: row.item_reference_id,
    sortOrder: row.sort_order,
    name: row.item_name,
    description: row.item_description,
    location: row.item_location,
    status: row.item_status,
    assetStatus: row.asset_status,
    imageUrl: row.item_image_url,
  }
}

function mapStatusHistory(row) {
  if (!row) return null
  return {
    id: row.id,
    recordType: row.record_type,
    recordId: row.record_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedBy: row.changed_by,
    changedByRole: row.changed_by_role,
    changedByName: row.changed_by_name,
    remarks: row.remarks || '',
    changedAt: row.changed_at,
  }
}

function slugify(value) {
  return String(value || 'tourism-package')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function packageSlug(row) {
  if (!row?.id) return null
  return `package-${slugify(row.name)}-${row.id}`
}

function categoryImage(category) {
  const images = {
    Cultural:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg',
    Nature:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg',
    Food:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg',
    Events:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
  }
  return images[categoryImageKey(category)] || images.Nature
}

function categoryImageKey(category) {
  const value = String(category || '').toLowerCase()
  if (value.includes('food')) return 'Food'
  if (value.includes('event')) return 'Events'
  if (value.includes('cultural')) return 'Cultural'
  return 'Nature'
}

function filteredWhere(filters, columns) {
  const params = []
  const where = []

  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(${columns.search.map((column) => `${column} ILIKE ${ref}`).join(' OR ')})`)
  }
  if (filters.status && columns.status) where.push(`${columns.status} = ${addParam(params, filters.status)}`)
  if (filters.category && columns.category) where.push(`${columns.category} = ${addParam(params, filters.category)}`)
  if (filters.location && columns.location) where.push(`${columns.location} ILIKE ${addParam(params, `%${filters.location}%`)}`)
  if (filters.targetMarket && columns.targetMarket) {
    where.push(`${columns.targetMarket} ILIKE ${addParam(params, `%${filters.targetMarket}%`)}`)
  }

  return { params, whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '' }
}

function firstAssetImageUrl(images = []) {
  return images.find((image) => image?.imageUrl)?.imageUrl || null
}

async function listAssetImages(assetId) {
  const result = await query(
    `
      SELECT *
      FROM tourism_asset_images
      WHERE asset_id = $1
      ORDER BY display_order ASC, created_at ASC
    `,
    [assetId],
  )
  return result.rows.map(mapAssetImage)
}

async function attachAssetImages(assets) {
  if (!assets.length) return assets

  const result = await query(
    `
      SELECT *
      FROM tourism_asset_images
      WHERE asset_id = ANY($1::uuid[])
      ORDER BY asset_id ASC, display_order ASC, created_at ASC
    `,
    [assets.map((asset) => asset.id)],
  )
  const grouped = new Map()
  result.rows.forEach((row) => {
    const images = grouped.get(row.asset_id) || []
    images.push(mapAssetImage(row))
    grouped.set(row.asset_id, images)
  })

  return assets.map((asset) => {
    const images = grouped.get(asset.id) || []
    return { ...asset, images, imageUrl: images[0]?.imageUrl || asset.imageUrl }
  })
}

async function replaceAssetImages(client, assetId, images = [], fallbackImageUrl = null) {
  const normalizedImages = images
    .filter((image) => image?.imageUrl)
    .slice(0, 5)
    .map((image, index) => ({
      ...image,
      displayOrder: index + 1,
      isPrimary: index === 0,
    }))

  await client.query('DELETE FROM tourism_asset_images WHERE asset_id = $1', [assetId])

  for (const image of normalizedImages) {
    await client.query(
      `
        INSERT INTO tourism_asset_images (
          asset_id, image_url, original_name, mime_type, file_size, display_order, is_primary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        assetId,
        image.imageUrl,
        image.originalName || null,
        image.mimeType || null,
        Number.isFinite(Number(image.fileSize)) ? Number(image.fileSize) : null,
        image.displayOrder,
        image.isPrimary,
      ],
    )
  }

  await client.query('UPDATE tourism_assets SET image_url = $2 WHERE id = $1', [
    assetId,
    normalizedImages[0]?.imageUrl || fallbackImageUrl || null,
  ])
}

async function listAssets(filters = {}) {
  const { params, whereSql } = filteredWhere(filters, {
    search: ['ta.name', 'ta.description', 'ta.location', 'ta.target_market'],
    status: 'ta.development_status',
    category: 'ta.category',
    location: 'ta.location',
    targetMarket: 'ta.target_market',
  })
  const result = await query(
    `
      SELECT
        ta.*,
        ar.record_number AS source_accreditation_record_number,
        bp.business_name AS source_business_name,
        bp.business_type AS source_business_type,
        bp.latitude AS source_latitude,
        bp.longitude AS source_longitude,
        CONCAT_WS(' ', owner.first_name, owner.last_name) AS source_owner_name,
        owner.email AS source_owner_email,
        owner.phone AS source_owner_phone
      FROM tourism_assets ta
      LEFT JOIN accreditation_records ar ON ar.id = ta.source_accreditation_record_id
      LEFT JOIN business_profiles bp ON bp.id = ta.source_business_profile_id
      LEFT JOIN users owner ON owner.id = bp.owner_id
      ${whereSql}
      ORDER BY CASE WHEN ta.development_status = 'Archived' THEN 1 ELSE 0 END, ta.updated_at DESC, ta.name ASC
    `,
    params,
  )
  return attachAssetImages(result.rows.map(mapAsset))
}

async function getAssetById(id) {
  const result = await query(
    `
      SELECT
        ta.*,
        ar.record_number AS source_accreditation_record_number,
        bp.business_name AS source_business_name,
        bp.business_type AS source_business_type,
        bp.latitude AS source_latitude,
        bp.longitude AS source_longitude,
        CONCAT_WS(' ', owner.first_name, owner.last_name) AS source_owner_name,
        owner.email AS source_owner_email,
        owner.phone AS source_owner_phone
      FROM tourism_assets ta
      LEFT JOIN accreditation_records ar ON ar.id = ta.source_accreditation_record_id
      LEFT JOIN business_profiles bp ON bp.id = ta.source_business_profile_id
      LEFT JOIN users owner ON owner.id = bp.owner_id
      WHERE ta.id = $1
      LIMIT 1
    `,
    [id],
  )
  const asset = mapAsset(result.rows[0])
  if (!asset) return null
  const images = await listAssetImages(id)
  return { ...asset, images, imageUrl: images[0]?.imageUrl || asset.imageUrl }
}

async function listAccreditedEstablishments(filters = {}) {
  const params = []
  const where = ["r.status = 'active'"]

  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(
      b.business_name ILIKE ${ref}
      OR b.business_type ILIKE ${ref}
      OR b.street_address ILIKE ${ref}
      OR b.barangay ILIKE ${ref}
      OR b.city_municipality ILIKE ${ref}
      OR r.record_number ILIKE ${ref}
    )`)
  }

  const result = await query(
    `
      SELECT
        r.id,
        r.record_number,
        r.status,
        r.issued_at,
        r.expires_at,
        a.application_number,
        a.accreditation_type,
        b.id AS business_profile_id,
        b.business_name,
        b.business_type,
        b.business_permit_number,
        b.dti_sec_registration_number,
        b.region,
        b.province,
        b.city_municipality,
        b.barangay,
        b.street_address,
        b.latitude,
        b.longitude,
        owner.first_name,
        owner.last_name,
        owner.email,
        owner.phone
      FROM accreditation_records r
      JOIN accreditation_applications a ON a.id = r.application_id
      JOIN business_profiles b ON b.id = r.business_profile_id
      LEFT JOIN users owner ON owner.id = b.owner_id
      WHERE ${where.join(' AND ')}
      ORDER BY r.issued_at DESC, b.business_name ASC
      LIMIT 100
    `,
    params,
  )

  return result.rows.map(mapAccreditedEstablishment)
}

async function getAccreditedEstablishmentByRecordId(id) {
  const result = await query(
    `
      SELECT
        r.id,
        r.record_number,
        r.status,
        r.issued_at,
        r.expires_at,
        a.application_number,
        a.accreditation_type,
        b.id AS business_profile_id,
        b.business_name,
        b.business_type,
        b.business_permit_number,
        b.dti_sec_registration_number,
        b.region,
        b.province,
        b.city_municipality,
        b.barangay,
        b.street_address,
        b.latitude,
        b.longitude,
        owner.first_name,
        owner.last_name,
        owner.email,
        owner.phone
      FROM accreditation_records r
      JOIN accreditation_applications a ON a.id = r.application_id
      JOIN business_profiles b ON b.id = r.business_profile_id
      LEFT JOIN users owner ON owner.id = b.owner_id
      WHERE r.id = $1 AND r.status = 'active'
      LIMIT 1
    `,
    [id],
  )

  return mapAccreditedEstablishment(result.rows[0])
}

async function createAsset(data, userId) {
  const client = await require('../../config/db').pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `
        INSERT INTO tourism_assets (
          name, description, location, category, target_market, development_status, image_url, remarks,
          latitude, longitude, source_accreditation_record_id, source_business_profile_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        data.name,
        data.description,
        data.location,
        data.category,
        data.targetMarket,
        data.developmentStatus || 'Draft',
        firstAssetImageUrl(data.assetImages) || data.imageUrl || null,
        data.remarks || '',
        data.latitude ?? null,
        data.longitude ?? null,
        data.sourceAccreditationRecordId || null,
        data.sourceBusinessProfileId || null,
        userId || null,
      ],
    )
    await replaceAssetImages(client, result.rows[0].id, data.assetImages || [], data.imageUrl)
    await client.query('COMMIT')
    return getAssetById(result.rows[0].id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function updateAsset(id, data) {
  const client = await require('../../config/db').pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `
        UPDATE tourism_assets
        SET name = $2, description = $3, location = $4, category = $5, target_market = $6,
            development_status = $7, image_url = $8, remarks = $9,
            latitude = $10, longitude = $11,
            source_accreditation_record_id = $12, source_business_profile_id = $13
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
        data.name,
        data.description,
        data.location,
        data.category,
        data.targetMarket,
        data.developmentStatus,
        firstAssetImageUrl(data.assetImages) || data.imageUrl || null,
        data.remarks || '',
        data.latitude ?? null,
        data.longitude ?? null,
        data.sourceAccreditationRecordId || null,
        data.sourceBusinessProfileId || null,
      ],
    )
    if (result.rows[0]?.id) {
      await replaceAssetImages(client, id, data.assetImages || [], data.imageUrl)
    }
    await client.query('COMMIT')
    return result.rows[0]?.id ? getAssetById(result.rows[0].id) : null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function archiveAsset(id) {
  const result = await query(
    "UPDATE tourism_assets SET development_status = 'Archived' WHERE id = $1 RETURNING *",
    [id],
  )
  return mapAsset(result.rows[0])
}

async function listPlans(filters = {}) {
  const { params, whereSql } = filteredWhere(filters, {
    search: ['dp.title', 'dp.objectives', 'dp.target_market', 'ta.name'],
    status: 'dp.plan_status',
    targetMarket: 'dp.target_market',
  })
  const result = await query(
    `
      SELECT dp.*, ta.name AS asset_name, ta.location AS asset_location, ta.development_status AS asset_status
      FROM development_plans dp
      JOIN tourism_assets ta ON ta.id = dp.asset_id
      ${whereSql}
      ORDER BY CASE WHEN dp.plan_status = 'Archived' THEN 1 ELSE 0 END, dp.updated_at DESC, dp.title ASC
    `,
    params,
  )
  return result.rows.map(mapPlan)
}

async function getPlanById(id) {
  const result = await query(
    `
      SELECT dp.*, ta.name AS asset_name, ta.location AS asset_location, ta.development_status AS asset_status
      FROM development_plans dp
      JOIN tourism_assets ta ON ta.id = dp.asset_id
      WHERE dp.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapPlan(result.rows[0])
}

async function createPlan(data, userId) {
  const result = await query(
    `
      INSERT INTO development_plans (
        asset_id, title, objectives, target_market, improvement_needs, proposed_activities,
        timeline_start, timeline_end, timeline_start_time, timeline_end_time, assigned_personnel,
        plan_status, remarks, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `,
    [
      data.assetId,
      data.title,
      data.objectives,
      data.targetMarket,
      data.improvementNeeds,
      data.proposedActivities,
      data.timelineStart || null,
      data.timelineEnd || null,
      data.timelineStartTime || null,
      data.timelineEndTime || null,
      data.assignedPersonnel,
      data.planStatus || 'Draft',
      data.remarks || '',
      userId || null,
    ],
  )
  return getPlanById(result.rows[0].id)
}

async function updatePlan(id, data) {
  const result = await query(
    `
      UPDATE development_plans
      SET asset_id = $2, title = $3, objectives = $4, target_market = $5,
          improvement_needs = $6, proposed_activities = $7, timeline_start = $8,
          timeline_end = $9, timeline_start_time = $10, timeline_end_time = $11,
          assigned_personnel = $12, plan_status = $13, remarks = $14
      WHERE id = $1
      RETURNING id
    `,
    [
      id,
      data.assetId,
      data.title,
      data.objectives,
      data.targetMarket,
      data.improvementNeeds,
      data.proposedActivities,
      data.timelineStart || null,
      data.timelineEnd || null,
      data.timelineStartTime || null,
      data.timelineEndTime || null,
      data.assignedPersonnel,
      data.planStatus,
      data.remarks || '',
    ],
  )
  return getPlanById(result.rows[0]?.id)
}

async function archivePlan(id) {
  const result = await query("UPDATE development_plans SET plan_status = 'Archived' WHERE id = $1 RETURNING id", [id])
  return getPlanById(result.rows[0]?.id)
}

async function listImprovements(filters = {}) {
  const { params, whereSql } = filteredWhere(filters, {
    search: ['ir.remarks', 'dp.title', 'ta.name'],
    status: 'ir.improvement_status',
  })
  const result = await query(
    `
      SELECT ir.*, dp.title AS plan_title, dp.plan_status, dp.asset_id, ta.name AS asset_name,
             ta.development_status AS asset_status
      FROM improvement_records ir
      JOIN development_plans dp ON dp.id = ir.plan_id
      JOIN tourism_assets ta ON ta.id = dp.asset_id
      ${whereSql}
      ORDER BY CASE WHEN ir.improvement_status = 'Archived' THEN 1 ELSE 0 END,
               ir.update_date DESC, ir.updated_at DESC
    `,
    params,
  )
  return result.rows.map(mapImprovement)
}

async function getImprovementById(id) {
  const result = await query(
    `
      SELECT ir.*, dp.title AS plan_title, dp.plan_status, dp.asset_id, ta.name AS asset_name,
             ta.development_status AS asset_status
      FROM improvement_records ir
      JOIN development_plans dp ON dp.id = ir.plan_id
      JOIN tourism_assets ta ON ta.id = dp.asset_id
      WHERE ir.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapImprovement(result.rows[0])
}

async function createImprovement(data, userId) {
  const result = await query(
    `
      INSERT INTO improvement_records (
        plan_id, progress_percentage, improvement_status, update_date, remarks, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      data.planId,
      data.progressPercentage,
      data.improvementStatus || 'Not Started',
      data.updateDate,
      data.remarks,
      userId || null,
    ],
  )
  return getImprovementById(result.rows[0].id)
}

async function updateImprovement(id, data) {
  const result = await query(
    `
      UPDATE improvement_records
      SET plan_id = $2, progress_percentage = $3, improvement_status = $4, update_date = $5, remarks = $6
      WHERE id = $1
      RETURNING id
    `,
    [id, data.planId, data.progressPercentage, data.improvementStatus, data.updateDate, data.remarks],
  )
  return getImprovementById(result.rows[0]?.id)
}

async function archiveImprovement(id) {
  const result = await query(
    "UPDATE improvement_records SET improvement_status = 'Archived' WHERE id = $1 RETURNING id",
    [id],
  )
  return getImprovementById(result.rows[0]?.id)
}

async function listActivities(filters = {}) {
  const { params, whereSql } = filteredWhere(filters, {
    search: ['ta2.name', 'ta2.description', 'ta2.target_market', 'asset.name', 'dp.title'],
    status: 'ta2.activity_status',
    targetMarket: 'ta2.target_market',
  })
  const result = await query(
    `
      SELECT ta2.*, asset.name AS asset_name, asset.development_status AS asset_status,
             dp.title AS plan_title, dp.plan_status
      FROM tourism_activities ta2
      JOIN tourism_assets asset ON asset.id = ta2.asset_id
      LEFT JOIN development_plans dp ON dp.id = ta2.plan_id
      ${whereSql}
      ORDER BY CASE WHEN ta2.activity_status = 'Archived' THEN 1 ELSE 0 END,
               ta2.updated_at DESC, ta2.name ASC
    `,
    params,
  )
  return result.rows.map(mapActivity)
}

async function getActivityById(id) {
  const result = await query(
    `
      SELECT ta2.*, asset.name AS asset_name, asset.development_status AS asset_status,
             dp.title AS plan_title, dp.plan_status
      FROM tourism_activities ta2
      JOIN tourism_assets asset ON asset.id = ta2.asset_id
      LEFT JOIN development_plans dp ON dp.id = ta2.plan_id
      WHERE ta2.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapActivity(result.rows[0])
}

async function createActivity(data, userId) {
  const result = await query(
    `
      INSERT INTO tourism_activities (
        asset_id, plan_id, name, description, duration, target_market, activity_status, remarks, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      data.assetId,
      data.planId || null,
      data.name,
      data.description,
      data.duration,
      data.targetMarket,
      data.activityStatus || 'Draft',
      data.remarks || '',
      userId || null,
    ],
  )
  return getActivityById(result.rows[0].id)
}

async function updateActivity(id, data) {
  const result = await query(
    `
      UPDATE tourism_activities
      SET asset_id = $2, plan_id = $3, name = $4, description = $5, duration = $6,
          target_market = $7, activity_status = $8, remarks = $9
      WHERE id = $1
      RETURNING id
    `,
    [
      id,
      data.assetId,
      data.planId || null,
      data.name,
      data.description,
      data.duration,
      data.targetMarket,
      data.activityStatus,
      data.remarks || '',
    ],
  )
  return getActivityById(result.rows[0]?.id)
}

async function archiveActivity(id) {
  const result = await query(
    "UPDATE tourism_activities SET activity_status = 'Archived' WHERE id = $1 RETURNING id",
    [id],
  )
  return getActivityById(result.rows[0]?.id)
}

function packageSelect(extraWhere = '') {
  return `
    SELECT
      tp.*,
      COALESCE(first_asset.image_url, category_asset.image_url) AS image_url,
      COUNT(pi.id)::integer AS item_count,
      COUNT(pi.id) FILTER (WHERE pi.item_type = 'Plan')::integer AS plan_count,
      COUNT(pi.id) FILTER (WHERE pi.item_type = 'Asset')::integer AS asset_count,
      COUNT(pi.id) FILTER (WHERE pi.item_type = 'Activity')::integer AS activity_count
    FROM tourism_packages tp
    LEFT JOIN package_items pi ON pi.package_id = tp.id
    LEFT JOIN LATERAL (
      SELECT COALESCE(direct_asset.image_url, plan_asset.image_url) AS image_url
      FROM package_items item
      LEFT JOIN tourism_assets direct_asset
        ON item.item_type = 'Asset'
       AND direct_asset.id = item.item_reference_id
      LEFT JOIN development_plans dp
        ON item.item_type = 'Plan'
       AND dp.id = item.item_reference_id
      LEFT JOIN tourism_assets plan_asset
        ON plan_asset.id = dp.asset_id
      WHERE item.package_id = tp.id
        AND COALESCE(direct_asset.image_url, plan_asset.image_url) IS NOT NULL
      ORDER BY item.sort_order ASC
      LIMIT 1
    ) first_asset ON true
    LEFT JOIN LATERAL (
      SELECT ta.image_url
      FROM tourism_assets ta
      WHERE ta.category = CASE
        WHEN tp.category ILIKE '%Cultural%' THEN 'Cultural'
        WHEN tp.category ILIKE '%Food%' THEN 'Food'
        WHEN tp.category ILIKE '%Events%' THEN 'Events'
        WHEN tp.category ILIKE '%Nature%' THEN 'Nature'
        ELSE ta.category
      END
        AND ta.image_url IS NOT NULL
      ORDER BY ta.updated_at DESC
      LIMIT 1
    ) category_asset ON true
    ${extraWhere}
    GROUP BY tp.id, first_asset.image_url, category_asset.image_url
  `
}

async function listPackages(filters = {}) {
  const { params, whereSql } = filteredWhere(filters, {
    search: ['tp.name', 'tp.description', 'tp.target_market', 'tp.category'],
    status: 'tp.package_status',
    category: 'tp.category',
    targetMarket: 'tp.target_market',
  })
  const result = await query(
    `
      ${packageSelect(whereSql)}
      ORDER BY CASE WHEN tp.package_status = 'Archived' THEN 1 ELSE 0 END, tp.updated_at DESC, tp.name ASC
    `,
    params,
  )
  return result.rows.map(mapPackage)
}

async function listPublicPackages(filters = {}) {
  const params = [[...PUBLIC_PACKAGE_STATUSES]]
  const where = ['tp.package_status = ANY($1::text[])']
  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push('(tp.name ILIKE ' + ref + ' OR tp.description ILIKE ' + ref + ' OR tp.target_market ILIKE ' + ref + ')')
  }
  if (filters.category) where.push(`tp.category = ${addParam(params, filters.category)}`)
  const result = await query(
    `
      ${packageSelect(`WHERE ${where.join(' AND ')}`)}
      ORDER BY tp.updated_at DESC, tp.name ASC
    `,
    params,
  )
  return result.rows.map(mapPackage)
}

async function getPackageById(id) {
  const result = await query(`${packageSelect('WHERE tp.id = $1')}`, [id])
  const tourismPackage = mapPackage(result.rows[0])
  if (!tourismPackage) return null
  const [items, gallery, statusHistory] = await Promise.all([
    listPackageItems(id),
    listPackageGallery(id),
    listStatusHistory('Package', id),
  ])
  return { ...tourismPackage, items, gallery, statusHistory }
}

async function getPublicPackageBySlug(slug) {
  const packages = await listPublicPackages()
  return packages.find((item) => item.id === slug || item.slug === slug) || null
}

async function listPackageItems(packageId) {
  const result = await query(
    `
      SELECT
        pi.*,
        CASE
          WHEN pi.item_type = 'Asset' THEN ta.name
          WHEN pi.item_type = 'Plan' THEN dp.title
          ELSE act.name
        END AS item_name,
        CASE
          WHEN pi.item_type = 'Asset' THEN ta.description
          WHEN pi.item_type = 'Plan' THEN dp.objectives
          ELSE act.description
        END AS item_description,
        CASE
          WHEN pi.item_type = 'Asset' THEN ta.location
          WHEN pi.item_type = 'Plan' THEN plan_asset.location
          ELSE act_asset.location
        END AS item_location,
        CASE
          WHEN pi.item_type = 'Asset' THEN ta.development_status
          WHEN pi.item_type = 'Plan' THEN dp.plan_status
          ELSE act.activity_status
        END AS item_status,
        CASE
          WHEN pi.item_type = 'Asset' THEN ta.development_status
          WHEN pi.item_type = 'Plan' THEN plan_asset.development_status
          ELSE act_asset.development_status
        END AS asset_status,
        CASE
          WHEN pi.item_type = 'Asset' THEN ta.image_url
          WHEN pi.item_type = 'Plan' THEN plan_asset.image_url
          ELSE act_asset.image_url
        END AS item_image_url
      FROM package_items pi
      LEFT JOIN tourism_assets ta ON pi.item_type = 'Asset' AND ta.id = pi.item_reference_id
      LEFT JOIN development_plans dp ON pi.item_type = 'Plan' AND dp.id = pi.item_reference_id
      LEFT JOIN tourism_assets plan_asset ON pi.item_type = 'Plan' AND plan_asset.id = dp.asset_id
      LEFT JOIN tourism_activities act ON pi.item_type = 'Activity' AND act.id = pi.item_reference_id
      LEFT JOIN tourism_assets act_asset ON pi.item_type = 'Activity' AND act_asset.id = act.asset_id
      WHERE pi.package_id = $1
      ORDER BY pi.sort_order ASC, item_name ASC
    `,
    [packageId],
  )
  return result.rows.map(mapPackageItem)
}

async function listPackageGallery(packageId) {
  const result = await query(
    `
      SELECT DISTINCT ON (tai.id)
        tai.id,
        tai.image_url AS "imageUrl",
        COALESCE(tai.original_name, asset.name || ' image') AS "altText",
        pi.sort_order AS "itemOrder",
        tai.display_order AS "imageOrder",
        asset.name AS "assetName"
      FROM package_items pi
      LEFT JOIN tourism_assets direct_asset
        ON pi.item_type = 'Asset'
       AND direct_asset.id = pi.item_reference_id
      LEFT JOIN development_plans dp
        ON pi.item_type = 'Plan'
       AND dp.id = pi.item_reference_id
      LEFT JOIN tourism_assets plan_asset
        ON pi.item_type = 'Plan'
       AND plan_asset.id = dp.asset_id
      JOIN tourism_assets asset
        ON asset.id = COALESCE(direct_asset.id, plan_asset.id)
      JOIN tourism_asset_images tai
        ON tai.asset_id = asset.id
      WHERE pi.package_id = $1
      ORDER BY tai.id, pi.sort_order ASC, tai.display_order ASC
    `,
    [packageId],
  )

  return result.rows
    .sort((left, right) => left.itemOrder - right.itemOrder || left.imageOrder - right.imageOrder)
    .map(({ itemOrder, imageOrder, assetName, ...image }) => ({
      ...image,
      sourceName: assetName,
      sortOrder: imageOrder,
    }))
}

async function createPackage(data, userId) {
  const client = await require('../../config/db').pool.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `
        INSERT INTO tourism_packages (
          name, description, category, target_market, estimated_duration, duration_days, departure_capacity,
          base_price, base_pax, extra_pax_price, min_pax, max_pax, payment_required,
          package_status, remarks, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `,
      [
        data.name,
        data.description,
        data.category,
        data.targetMarket,
        data.estimatedDuration,
        data.durationDays,
        data.departureCapacity,
        data.basePrice,
        data.basePax,
        data.extraPaxPrice,
        data.minPax,
        data.maxPax,
        Boolean(data.paymentRequired),
        data.packageStatus || 'Draft',
        data.remarks || '',
        userId || null,
      ],
    )
    await insertPackageItems(client, inserted.rows[0].id, data.items)
    await client.query('COMMIT')
    return getPackageById(inserted.rows[0].id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function updatePackage(id, data) {
  const client = await require('../../config/db').pool.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query(
      `
        UPDATE tourism_packages
        SET name = $2, description = $3, category = $4, target_market = $5,
            estimated_duration = $6, duration_days = $7, departure_capacity = $8,
            base_price = $9, base_pax = $10, extra_pax_price = $11,
            min_pax = $12, max_pax = $13, payment_required = $14, package_status = $15,
            remarks = $16
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
        data.name,
        data.description,
        data.category,
        data.targetMarket,
        data.estimatedDuration,
        data.durationDays,
        data.departureCapacity,
        data.basePrice,
        data.basePax,
        data.extraPaxPrice,
        data.minPax,
        data.maxPax,
        Boolean(data.paymentRequired),
        data.packageStatus,
        data.remarks || '',
      ],
    )
    await client.query('DELETE FROM package_items WHERE package_id = $1', [id])
    await insertPackageItems(client, id, data.items)
    await client.query('COMMIT')
    return getPackageById(updated.rows[0]?.id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function insertPackageItems(client, packageId, items) {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    await client.query(
      `
        INSERT INTO package_items (package_id, item_type, item_reference_id, sort_order)
        VALUES ($1, $2, $3, $4)
      `,
      [packageId, item.itemType, item.referenceId, index + 1],
    )
  }
}

async function archivePackage(id) {
  const result = await query("UPDATE tourism_packages SET package_status = 'Archived' WHERE id = $1 RETURNING id", [id])
  return getPackageById(result.rows[0]?.id)
}

async function updatePackageStatus(id, status) {
  const result = await query('UPDATE tourism_packages SET package_status = $2 WHERE id = $1 RETURNING id', [id, status])
  return getPackageById(result.rows[0]?.id)
}

async function createStatusHistoryEntry({ recordType, recordId, previousStatus, newStatus, user, remarks }) {
  const role = user?.roles?.[0] || null
  const result = await query(
    `
      INSERT INTO product_status_history (
        record_type, record_id, previous_status, new_status, changed_by, changed_by_role, changed_by_name, remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      recordType,
      recordId,
      previousStatus || null,
      newStatus,
      user?.id || null,
      role,
      user?.displayName || user?.email || null,
      remarks || '',
    ],
  )
  return mapStatusHistory(result.rows[0])
}

async function listStatusHistory(recordType, recordId) {
  const result = await query(
    `
      SELECT *
      FROM product_status_history
      WHERE record_type = $1 AND record_id = $2
      ORDER BY changed_at DESC, id DESC
    `,
    [recordType, recordId],
  )
  return result.rows.map(mapStatusHistory)
}

async function getReportSummary() {
  const [
    assets,
    plans,
    packages,
  ] = await Promise.all([
    query("SELECT COUNT(*)::integer AS total, COUNT(*) FILTER (WHERE development_status != 'Archived')::integer AS active, COUNT(*) FILTER (WHERE development_status = 'Archived')::integer AS archived FROM tourism_assets"),
    query("SELECT COUNT(*)::integer AS total, COUNT(*) FILTER (WHERE plan_status != 'Archived')::integer AS active, COUNT(*) FILTER (WHERE plan_status = 'Archived')::integer AS archived FROM development_plans"),
    query("SELECT COUNT(*)::integer AS total, COUNT(*) FILTER (WHERE package_status != 'Archived')::integer AS active, COUNT(*) FILTER (WHERE package_status = 'Archived')::integer AS archived, COUNT(*) FILTER (WHERE package_status = 'Ready for Promotion')::integer AS ready_for_promotion FROM tourism_packages"),
  ])

  return {
    assets: assets.rows[0],
    developmentPlans: plans.rows[0],
    packages: {
      total: packages.rows[0].total,
      active: packages.rows[0].active,
      archived: packages.rows[0].archived,
      readyForPromotion: packages.rows[0].ready_for_promotion,
    },
  }
}

module.exports = {
  PACKAGE_CATEGORIES,
  PACKAGE_STATUSES,
  archiveActivity,
  archiveAsset,
  archiveImprovement,
  archivePackage,
  archivePlan,
  createActivity,
  createAsset,
  createImprovement,
  createPackage,
  createPlan,
  createStatusHistoryEntry,
  getActivityById,
  getAccreditedEstablishmentByRecordId,
  getAssetById,
  getImprovementById,
  getPackageById,
  getPlanById,
  getPublicPackageBySlug,
  getReportSummary,
  listActivities,
  listAccreditedEstablishments,
  listAssets,
  listImprovements,
  listPackages,
  listPlans,
  listPublicPackages,
  updateActivity,
  updateAsset,
  updateImprovement,
  updatePackage,
  updatePackageStatus,
  updatePlan,
}
