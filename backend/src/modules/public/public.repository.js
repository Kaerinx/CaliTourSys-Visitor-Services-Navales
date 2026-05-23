const { query } = require('../../config/db')

function addParam(params, value) {
  params.push(value)
  return `$${params.length}`
}

function toNumber(value) {
  return value === null || value === undefined ? null : Number(value)
}

function toBoolean(value) {
  return Boolean(value)
}

function imageFromRow(row, prefix = 'primary_image') {
  const url = row[`${prefix}_url`]
  const altText = row[`${prefix}_alt_text`]

  if (!url && !altText) return null

  return {
    url,
    altText,
  }
}

function mapCategory(row, prefix = 'category') {
  if (!row[`${prefix}_slug`]) return null

  return {
    id: row[`${prefix}_id`],
    slug: row[`${prefix}_slug`],
    name: row[`${prefix}_name`],
    color: row[`${prefix}_color`] ?? undefined,
    displayOrder: row[`${prefix}_display_order`] ?? undefined,
  }
}

function mapBusinessSummary(row) {
  if (!row.business_slug) return null

  return {
    id: row.business_id,
    slug: row.business_slug,
    name: row.business_name,
    businessType: row.business_type,
  }
}

function mapAccreditation(row) {
  if (!row.accreditation_status) return null

  return {
    status: row.accreditation_status,
    accreditationNumber: row.accreditation_number,
    issuedAt: row.accreditation_issued_at,
    expiresAt: row.accreditation_expires_at,
  }
}

function mapProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    price: {
      amount: toNumber(row.price_amount),
      currency: row.price_currency,
      unitLabel: row.unit_label,
    },
    category: mapCategory(row),
    business: mapBusinessSummary(row),
    accreditationStatus: row.accreditation_status,
    primaryImage: imageFromRow(row),
    tags: row.tags || [],
    isFeatured: toBoolean(row.is_featured),
  }
}

function mapEvent(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    category: mapCategory(row),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venueName: row.venue_name,
    primaryImage: imageFromRow(row),
    isFeatured: toBoolean(row.is_featured),
  }
}

function mapDestination(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    category: mapCategory(row),
    barangay: row.barangay,
    primaryImage: imageFromRow(row),
    hasMapLocation: toBoolean(row.has_map_location),
    isFeatured: toBoolean(row.is_featured),
  }
}

function mapMuseumArtifact(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    eraLabel: row.era_label,
    shortDescription: row.short_description,
    category: mapCategory(row),
    primaryImage: imageFromRow(row),
    isFeatured: toBoolean(row.is_featured),
  }
}

function mapPromotion(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    promotionType: row.promotion_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isFeatured: toBoolean(row.is_featured),
  }
}

function productSelect() {
  return `
    SELECT
      p.id,
      p.slug,
      p.name,
      p.short_description,
      p.description,
      p.price_amount,
      p.price_currency,
      p.unit_label,
      p.is_featured,
      pc.id AS category_id,
      pc.slug AS category_slug,
      pc.name AS category_name,
      pc.display_order AS category_display_order,
      b.id AS business_id,
      b.slug AS business_slug,
      b.name AS business_name,
      b.business_type,
      b.description AS business_description,
      b.barangay AS business_barangay,
      b.municipality AS business_municipality,
      b.province AS business_province,
      img.image_url AS primary_image_url,
      img.alt_text AS primary_image_alt_text,
      tags.tags,
      acc.status AS accreditation_status,
      acc.accreditation_number,
      acc.issued_at AS accreditation_issued_at,
      acc.expires_at AS accreditation_expires_at
    FROM products p
    JOIN product_categories pc ON pc.id = p.category_id AND pc.status = 'published'
    JOIN businesses b ON b.id = p.business_id AND b.status = 'active'
    LEFT JOIN LATERAL (
      SELECT COALESCE(pi.image_url, ma.file_url) AS image_url, COALESCE(pi.alt_text, ma.alt_text) AS alt_text
      FROM product_images pi
      LEFT JOIN media_assets ma ON ma.id = pi.media_asset_id AND ma.status = 'active'
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.display_order ASC, pi.created_at ASC
      LIMIT 1
    ) img ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(json_agg(pt.tag ORDER BY pt.tag), '[]'::json) AS tags
      FROM product_tags pt
      WHERE pt.product_id = p.id
    ) tags ON true
    LEFT JOIN LATERAL (
      SELECT ba.status, ba.accreditation_number, ba.issued_at, ba.expires_at
      FROM business_accreditations ba
      WHERE ba.business_id = b.id
      ORDER BY ba.verified_at DESC NULLS LAST, ba.created_at DESC
      LIMIT 1
    ) acc ON true
  `
}

function publicProductWhere() {
  return [
    "p.status = 'published'",
    '(p.published_at IS NULL OR p.published_at <= now())',
  ]
}

async function listProducts(filters, pagination) {
  const params = []
  const where = publicProductWhere()

  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(
      p.name ILIKE ${ref}
      OR p.short_description ILIKE ${ref}
      OR p.description ILIKE ${ref}
      OR EXISTS (SELECT 1 FROM product_tags pts WHERE pts.product_id = p.id AND pts.tag ILIKE ${ref})
    )`)
  }
  if (filters.category) where.push(`pc.slug = ${addParam(params, filters.category)}`)
  if (filters.business) where.push(`b.slug = ${addParam(params, filters.business)}`)
  if (filters.tag) where.push(`EXISTS (
    SELECT 1 FROM product_tags ptf
    WHERE ptf.product_id = p.id AND lower(ptf.tag) = lower(${addParam(params, filters.tag)})
  )`)
  if (filters.featured !== undefined) where.push(`p.is_featured = ${addParam(params, filters.featured)}`)

  const orderBy =
    {
      name: 'p.name ASC',
      '-name': 'p.name DESC',
      publishedAt: 'p.published_at ASC NULLS LAST',
      '-publishedAt': 'p.published_at DESC NULLS LAST',
      price: 'p.price_amount ASC NULLS LAST',
      '-price': 'p.price_amount DESC NULLS LAST',
      featured: 'p.is_featured DESC, p.published_at DESC NULLS LAST',
    }[filters.sort] || 'p.is_featured DESC, p.name ASC'

  const whereSql = where.join(' AND ')
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM products p
    JOIN product_categories pc ON pc.id = p.category_id AND pc.status = 'published'
    JOIN businesses b ON b.id = p.business_id AND b.status = 'active'
    WHERE ${whereSql}
  `
  const countResult = await query(countSql, params)

  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(
    `${productSelect()} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limitRef} OFFSET ${offsetRef}`,
    params,
  )

  return {
    items: rowsResult.rows.map(mapProduct),
    totalItems: countResult.rows[0].total,
  }
}

async function getProductBySlug(slug) {
  const result = await query(
    `${productSelect()} WHERE ${publicProductWhere().join(' AND ')} AND p.slug = $1 LIMIT 1`,
    [slug],
  )
  const row = result.rows[0]
  if (!row) return null

  const galleryResult = await query(
    `
      SELECT COALESCE(pi.image_url, ma.file_url) AS url, COALESCE(pi.alt_text, ma.alt_text) AS "altText"
      FROM product_images pi
      LEFT JOIN media_assets ma ON ma.id = pi.media_asset_id AND ma.status = 'active'
      WHERE pi.product_id = $1
      ORDER BY pi.is_primary DESC, pi.display_order ASC, pi.created_at ASC
    `,
    [row.id],
  )
  const contactsResult = await query(
    `
      SELECT contact_type AS "contactType", contact_value AS "contactValue", label, is_primary AS "isPrimary"
      FROM business_contacts
      WHERE business_id = $1 AND is_public = true
      ORDER BY is_primary DESC, created_at ASC
    `,
    [row.business_id],
  )
  const relatedResult = await query(
    `${productSelect()}
     WHERE ${publicProductWhere().join(' AND ')} AND p.id <> $1 AND p.category_id = $2
     ORDER BY p.is_featured DESC, p.name ASC
     LIMIT 4`,
    [row.id, row.category_id],
  )

  return {
    product: mapProduct(row),
    description: row.description,
    category: mapCategory(row),
    business: {
      ...mapBusinessSummary(row),
      description: row.business_description,
      barangay: row.business_barangay,
      municipality: row.business_municipality,
      province: row.business_province,
      contacts: contactsResult.rows,
      accreditation: mapAccreditation(row),
    },
    accreditation: mapAccreditation(row),
    gallery: galleryResult.rows,
    relatedProducts: relatedResult.rows.map(mapProduct),
  }
}

async function listCategories(tableName) {
  const configs = {
    product_categories: {
      table: 'product_categories',
      color: 'NULL::varchar AS color',
    },
    event_categories: {
      table: 'event_categories',
      color: 'NULL::varchar AS color',
    },
    destination_categories: {
      table: 'destination_categories',
      color: 'color',
    },
    artifact_categories: {
      table: 'artifact_categories',
      color: 'NULL::varchar AS color',
    },
  }
  const config = configs[tableName]
  if (!config) throw new Error('Unsupported category table.')

  const result = await query(
    `
      SELECT id, slug, name, ${config.color}, display_order AS "displayOrder"
      FROM ${config.table}
      WHERE status = 'published'
      ORDER BY display_order ASC, name ASC
    `,
  )
  return result.rows
}

function eventSelect() {
  return `
    SELECT
      e.id,
      e.slug,
      e.title,
      e.short_description,
      e.description,
      e.venue_name,
      e.organizer_name,
      e.contact_info,
      e.address_line,
      e.barangay,
      e.starts_at,
      e.ends_at,
      e.is_featured,
      ec.id AS category_id,
      ec.slug AS category_slug,
      ec.name AS category_name,
      ec.display_order AS category_display_order,
      img.image_url AS primary_image_url,
      img.alt_text AS primary_image_alt_text
    FROM events e
    JOIN event_categories ec ON ec.id = e.category_id AND ec.status = 'published'
    LEFT JOIN LATERAL (
      SELECT COALESCE(ei.image_url, ma.file_url) AS image_url, COALESCE(ei.alt_text, ma.alt_text) AS alt_text
      FROM event_images ei
      LEFT JOIN media_assets ma ON ma.id = ei.media_asset_id AND ma.status = 'active'
      WHERE ei.event_id = e.id
      ORDER BY ei.is_primary DESC, ei.display_order ASC, ei.created_at ASC
      LIMIT 1
    ) img ON true
  `
}

function publicEventWhere() {
  return ["e.status = 'published'", '(e.published_at IS NULL OR e.published_at <= now())']
}

async function listEvents(filters, pagination) {
  const params = []
  const where = publicEventWhere()
  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(e.title ILIKE ${ref} OR e.short_description ILIKE ${ref} OR e.description ILIKE ${ref})`)
  }
  if (filters.category) where.push(`ec.slug = ${addParam(params, filters.category)}`)
  if (filters.featured !== undefined) where.push(`e.is_featured = ${addParam(params, filters.featured)}`)
  if (filters.from) where.push(`e.starts_at >= ${addParam(params, filters.from)}`)
  if (filters.to) where.push(`e.starts_at <= ${addParam(params, filters.to)}`)

  const orderBy =
    {
      startsAt: 'e.starts_at ASC',
      '-startsAt': 'e.starts_at DESC',
      title: 'e.title ASC',
      '-title': 'e.title DESC',
      featured: 'e.is_featured DESC, e.starts_at ASC',
    }[filters.sort] || 'e.starts_at ASC'
  const whereSql = where.join(' AND ')
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM events e JOIN event_categories ec ON ec.id = e.category_id AND ec.status = 'published' WHERE ${whereSql}`,
    params,
  )
  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(`${eventSelect()} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limitRef} OFFSET ${offsetRef}`, params)
  return { items: rowsResult.rows.map(mapEvent), totalItems: countResult.rows[0].total }
}

async function getEventBySlug(slug) {
  const result = await query(`${eventSelect()} WHERE ${publicEventWhere().join(' AND ')} AND e.slug = $1 LIMIT 1`, [slug])
  const row = result.rows[0]
  if (!row) return null
  const galleryResult = await query(
    `
      SELECT COALESCE(ei.image_url, ma.file_url) AS url, COALESCE(ei.alt_text, ma.alt_text) AS "altText"
      FROM event_images ei
      LEFT JOIN media_assets ma ON ma.id = ei.media_asset_id AND ma.status = 'active'
      WHERE ei.event_id = $1
      ORDER BY ei.is_primary DESC, ei.display_order ASC, ei.created_at ASC
    `,
    [row.id],
  )
  return {
    ...mapEvent(row),
    description: row.description,
    organizerName: row.organizer_name,
    contactInfo: row.contact_info,
    addressLine: row.address_line,
    barangay: row.barangay,
    gallery: galleryResult.rows,
  }
}

function destinationSelect() {
  return `
    SELECT
      d.id,
      d.slug,
      d.name,
      d.short_description,
      d.description,
      d.barangay,
      d.opening_hours_text,
      d.entrance_fee_text,
      d.best_time_to_visit,
      d.accessibility_notes,
      d.is_featured,
      dc.id AS category_id,
      dc.slug AS category_slug,
      dc.name AS category_name,
      dc.color AS category_color,
      dc.display_order AS category_display_order,
      img.image_url AS primary_image_url,
      img.alt_text AS primary_image_alt_text,
      EXISTS (
        SELECT 1 FROM map_locations ml WHERE ml.destination_id = d.id AND ml.status = 'published'
      ) AS has_map_location
    FROM destinations d
    JOIN destination_categories dc ON dc.id = d.category_id AND dc.status = 'published'
    LEFT JOIN LATERAL (
      SELECT COALESCE(di.image_url, ma.file_url) AS image_url, COALESCE(di.alt_text, ma.alt_text) AS alt_text
      FROM destination_images di
      LEFT JOIN media_assets ma ON ma.id = di.media_asset_id AND ma.status = 'active'
      WHERE di.destination_id = d.id
      ORDER BY di.is_primary DESC, di.display_order ASC, di.created_at ASC
      LIMIT 1
    ) img ON true
  `
}

function publicDestinationWhere() {
  return ["d.status = 'published'", '(d.published_at IS NULL OR d.published_at <= now())']
}

async function listDestinations(filters, pagination) {
  const params = []
  const where = publicDestinationWhere()
  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(d.name ILIKE ${ref} OR d.short_description ILIKE ${ref} OR d.description ILIKE ${ref})`)
  }
  if (filters.category) where.push(`dc.slug = ${addParam(params, filters.category)}`)
  if (filters.barangay) where.push(`d.barangay ILIKE ${addParam(params, filters.barangay)}`)
  if (filters.featured !== undefined) where.push(`d.is_featured = ${addParam(params, filters.featured)}`)

  const orderBy =
    {
      name: 'd.name ASC',
      '-name': 'd.name DESC',
      publishedAt: 'd.published_at ASC NULLS LAST',
      '-publishedAt': 'd.published_at DESC NULLS LAST',
      featured: 'd.is_featured DESC, d.name ASC',
    }[filters.sort] || 'd.is_featured DESC, d.name ASC'
  const whereSql = where.join(' AND ')
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM destinations d JOIN destination_categories dc ON dc.id = d.category_id AND dc.status = 'published' WHERE ${whereSql}`,
    params,
  )
  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(`${destinationSelect()} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limitRef} OFFSET ${offsetRef}`, params)
  return { items: rowsResult.rows.map(mapDestination), totalItems: countResult.rows[0].total }
}

async function getDestinationBySlug(slug) {
  const result = await query(`${destinationSelect()} WHERE ${publicDestinationWhere().join(' AND ')} AND d.slug = $1 LIMIT 1`, [slug])
  const row = result.rows[0]
  if (!row) return null
  const galleryResult = await query(
    `
      SELECT COALESCE(di.image_url, ma.file_url) AS url, COALESCE(di.alt_text, ma.alt_text) AS "altText"
      FROM destination_images di
      LEFT JOIN media_assets ma ON ma.id = di.media_asset_id AND ma.status = 'active'
      WHERE di.destination_id = $1
      ORDER BY di.is_primary DESC, di.display_order ASC, di.created_at ASC
    `,
    [row.id],
  )
  const mapResult = await query(
    `
      SELECT id, location_type, label, latitude, longitude, marker_color, marker_icon
      FROM map_locations
      WHERE destination_id = $1 AND status = 'published'
      ORDER BY is_primary DESC, sort_priority ASC
      LIMIT 1
    `,
    [row.id],
  )
  return {
    ...mapDestination(row),
    description: row.description,
    openingHoursText: row.opening_hours_text,
    entranceFeeText: row.entrance_fee_text,
    bestTimeToVisit: row.best_time_to_visit,
    accessibilityNotes: row.accessibility_notes,
    gallery: galleryResult.rows,
    mapLocation: mapResult.rows[0] ? mapMapLocation(mapResult.rows[0]) : null,
  }
}

function artifactSelect() {
  return `
    SELECT
      ma.id,
      ma.slug,
      ma.name,
      ma.era_label,
      ma.short_description,
      ma.description,
      ma.historical_notes,
      ma.is_featured,
      ac.id AS category_id,
      ac.slug AS category_slug,
      ac.name AS category_name,
      ac.display_order AS category_display_order,
      img.image_url AS primary_image_url,
      img.alt_text AS primary_image_alt_text
    FROM museum_artifacts ma
    JOIN artifact_categories ac ON ac.id = ma.category_id AND ac.status = 'published'
    LEFT JOIN LATERAL (
      SELECT COALESCE(ai.image_url, m.file_url) AS image_url, COALESCE(ai.alt_text, m.alt_text) AS alt_text
      FROM artifact_images ai
      LEFT JOIN media_assets m ON m.id = ai.media_asset_id AND m.status = 'active'
      WHERE ai.artifact_id = ma.id
      ORDER BY ai.is_primary DESC, ai.display_order ASC, ai.created_at ASC
      LIMIT 1
    ) img ON true
  `
}

function publicArtifactWhere() {
  return ["ma.status = 'published'", '(ma.published_at IS NULL OR ma.published_at <= now())']
}

async function listMuseumArtifacts(filters, pagination) {
  const params = []
  const where = publicArtifactWhere()
  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(ma.name ILIKE ${ref} OR ma.short_description ILIKE ${ref} OR ma.description ILIKE ${ref} OR ma.era_label ILIKE ${ref})`)
  }
  if (filters.category) where.push(`ac.slug = ${addParam(params, filters.category)}`)
  if (filters.featured !== undefined) where.push(`ma.is_featured = ${addParam(params, filters.featured)}`)
  const orderBy =
    {
      name: 'ma.name ASC',
      '-name': 'ma.name DESC',
      publishedAt: 'ma.published_at ASC NULLS LAST',
      '-publishedAt': 'ma.published_at DESC NULLS LAST',
      featured: 'ma.is_featured DESC, ma.name ASC',
    }[filters.sort] || 'ma.is_featured DESC, ma.name ASC'
  const whereSql = where.join(' AND ')
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM museum_artifacts ma JOIN artifact_categories ac ON ac.id = ma.category_id AND ac.status = 'published' WHERE ${whereSql}`,
    params,
  )
  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(`${artifactSelect()} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limitRef} OFFSET ${offsetRef}`, params)
  return { items: rowsResult.rows.map(mapMuseumArtifact), totalItems: countResult.rows[0].total }
}

async function getMuseumArtifactBySlug(slug) {
  const result = await query(`${artifactSelect()} WHERE ${publicArtifactWhere().join(' AND ')} AND ma.slug = $1 LIMIT 1`, [slug])
  const row = result.rows[0]
  if (!row) return null
  const galleryResult = await query(
    `
      SELECT COALESCE(ai.image_url, m.file_url) AS url, COALESCE(ai.alt_text, m.alt_text) AS "altText"
      FROM artifact_images ai
      LEFT JOIN media_assets m ON m.id = ai.media_asset_id AND m.status = 'active'
      WHERE ai.artifact_id = $1
      ORDER BY ai.is_primary DESC, ai.display_order ASC, ai.created_at ASC
    `,
    [row.id],
  )
  return {
    ...mapMuseumArtifact(row),
    description: row.description,
    historicalNotes: row.historical_notes,
    gallery: galleryResult.rows,
  }
}

function promotionSelect() {
  return `
    SELECT id, slug, title, summary, description, promotion_type, starts_at, ends_at, is_featured
    FROM promotions pr
  `
}

function publicPromotionWhere() {
  return ["pr.status = 'published'", '(pr.published_at IS NULL OR pr.published_at <= now())']
}

async function listPromotions(filters, pagination) {
  const params = []
  const where = publicPromotionWhere()
  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(pr.title ILIKE ${ref} OR pr.summary ILIKE ${ref} OR pr.description ILIKE ${ref})`)
  }
  if (filters.featured !== undefined) where.push(`pr.is_featured = ${addParam(params, filters.featured)}`)
  const orderBy =
    {
      startsAt: 'pr.starts_at ASC NULLS LAST',
      '-startsAt': 'pr.starts_at DESC NULLS LAST',
      title: 'pr.title ASC',
      '-title': 'pr.title DESC',
      featured: 'pr.is_featured DESC, pr.starts_at ASC NULLS LAST',
    }[filters.sort] || 'pr.is_featured DESC, pr.starts_at ASC NULLS LAST, pr.title ASC'
  const whereSql = where.join(' AND ')
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM promotions pr WHERE ${whereSql}`, params)
  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(`${promotionSelect()} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limitRef} OFFSET ${offsetRef}`, params)
  return { items: rowsResult.rows.map(mapPromotion), totalItems: countResult.rows[0].total }
}

async function getPromotionBySlug(slug) {
  const result = await query(`${promotionSelect()} WHERE ${publicPromotionWhere().join(' AND ')} AND pr.slug = $1 LIMIT 1`, [slug])
  const row = result.rows[0]
  if (!row) return null
  const itemsResult = await query(
    `
      SELECT
        pi.item_type,
        pi.display_order,
        p.slug AS product_slug,
        p.name AS product_name,
        e.slug AS event_slug,
        e.title AS event_title,
        d.slug AS destination_slug,
        d.name AS destination_name,
        b.slug AS business_slug,
        b.name AS business_name
      FROM promotion_items pi
      LEFT JOIN products p ON p.id = pi.product_id AND p.status = 'published'
      LEFT JOIN events e ON e.id = pi.event_id AND e.status = 'published'
      LEFT JOIN destinations d ON d.id = pi.destination_id AND d.status = 'published'
      LEFT JOIN businesses b ON b.id = pi.business_id AND b.status = 'active'
      WHERE pi.promotion_id = $1
      ORDER BY pi.display_order ASC, pi.created_at ASC
    `,
    [row.id],
  )
  return {
    ...mapPromotion(row),
    description: row.description,
    items: itemsResult.rows.map((item) => ({
      itemType: item.item_type,
      displayOrder: item.display_order,
      item: {
        slug:
          item.product_slug || item.event_slug || item.destination_slug || item.business_slug,
        title:
          item.product_name || item.event_title || item.destination_name || item.business_name,
      },
    })),
  }
}

async function getBusinessBySlug(slug) {
  const result = await query(
    `
      SELECT
        b.id AS business_id,
        b.slug AS business_slug,
        b.name AS business_name,
        b.business_type,
        b.description,
        b.barangay,
        b.municipality,
        b.province,
        acc.status AS accreditation_status,
        acc.accreditation_number,
        acc.issued_at AS accreditation_issued_at,
        acc.expires_at AS accreditation_expires_at
      FROM businesses b
      LEFT JOIN LATERAL (
        SELECT ba.status, ba.accreditation_number, ba.issued_at, ba.expires_at
        FROM business_accreditations ba
        WHERE ba.business_id = b.id
        ORDER BY ba.verified_at DESC NULLS LAST, ba.created_at DESC
        LIMIT 1
      ) acc ON true
      WHERE b.status = 'active' AND b.slug = $1
      LIMIT 1
    `,
    [slug],
  )
  const row = result.rows[0]
  if (!row) return null
  const contactsResult = await query(
    `
      SELECT contact_type AS "contactType", contact_value AS "contactValue", label, is_primary AS "isPrimary"
      FROM business_contacts
      WHERE business_id = $1 AND is_public = true
      ORDER BY is_primary DESC, created_at ASC
    `,
    [row.business_id],
  )
  const productsResult = await query(
    `${productSelect()}
     WHERE ${publicProductWhere().join(' AND ')} AND p.business_id = $1
     ORDER BY p.is_featured DESC, p.name ASC
     LIMIT 6`,
    [row.business_id],
  )
  return {
    ...mapBusinessSummary(row),
    description: row.description,
    barangay: row.barangay,
    municipality: row.municipality,
    province: row.province,
    contacts: contactsResult.rows,
    accreditation: mapAccreditation(row),
    featuredProducts: productsResult.rows.map(mapProduct),
  }
}

function mapMapLocation(row) {
  return {
    id: row.id,
    locationType: row.location_type,
    slug: row.slug,
    label: row.label,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    category: row.category_name,
    markerColor: row.marker_color,
    markerIcon: row.marker_icon,
    primaryImage: row.primary_image_url,
    description: row.description,
  }
}

async function listMapLocations(filters) {
  const params = []
  const where = ["ml.status = 'published'"]
  if (filters.type) where.push(`ml.location_type = ${addParam(params, filters.type)}`)
  if (filters.category) where.push(`COALESCE(dc.slug, ec.slug) = ${addParam(params, filters.category)}`)
  if (filters.featured !== undefined) {
    const ref = addParam(params, filters.featured)
    where.push(`COALESCE(d.is_featured, e.is_featured, b.is_featured, false) = ${ref}`)
  }
  const result = await query(
    `
      SELECT
        ml.id,
        ml.location_type,
        ml.label,
        ml.latitude,
        ml.longitude,
        ml.marker_color,
        ml.marker_icon,
        COALESCE(d.slug, b.slug, e.slug) AS slug,
        COALESCE(d.short_description, b.description, e.short_description) AS description,
        COALESCE(dc.name, ec.name, b.business_type) AS category_name,
        COALESCE(dimg.image_url, bimg.image_url, eimg.image_url) AS primary_image_url
      FROM map_locations ml
      LEFT JOIN destinations d ON d.id = ml.destination_id AND d.status = 'published'
      LEFT JOIN destination_categories dc ON dc.id = d.category_id AND dc.status = 'published'
      LEFT JOIN businesses b ON b.id = ml.business_id AND b.status = 'active'
      LEFT JOIN events e ON e.id = ml.event_id AND e.status = 'published'
      LEFT JOIN event_categories ec ON ec.id = e.category_id AND ec.status = 'published'
      LEFT JOIN LATERAL (
        SELECT COALESCE(di.image_url, ma.file_url) AS image_url
        FROM destination_images di
        LEFT JOIN media_assets ma ON ma.id = di.media_asset_id AND ma.status = 'active'
        WHERE di.destination_id = d.id
        ORDER BY di.is_primary DESC, di.display_order ASC
        LIMIT 1
      ) dimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(pi.image_url, ma.file_url) AS image_url
        FROM products p
        JOIN product_images pi ON pi.product_id = p.id
        LEFT JOIN media_assets ma ON ma.id = pi.media_asset_id AND ma.status = 'active'
        WHERE p.business_id = b.id AND p.status = 'published'
        ORDER BY p.is_featured DESC, pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) bimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(ei.image_url, ma.file_url) AS image_url
        FROM event_images ei
        LEFT JOIN media_assets ma ON ma.id = ei.media_asset_id AND ma.status = 'active'
        WHERE ei.event_id = e.id
        ORDER BY ei.is_primary DESC, ei.display_order ASC
        LIMIT 1
      ) eimg ON true
      WHERE ${where.join(' AND ')}
        AND (
          (ml.location_type = 'destination' AND d.id IS NOT NULL)
          OR (ml.location_type = 'business' AND b.id IS NOT NULL)
          OR (ml.location_type = 'event' AND e.id IS NOT NULL)
        )
      ORDER BY ml.sort_priority ASC, ml.label ASC
    `,
    params,
  )
  return result.rows.map(mapMapLocation)
}

async function getHome() {
  const [promotions, products, destinations, events, artifacts, stats] = await Promise.all([
    listPromotions({ featured: true }, { limit: 3, offset: 0 }),
    listProducts({ featured: true }, { limit: 4, offset: 0 }),
    listDestinations({ featured: true }, { limit: 4, offset: 0 }),
    listEvents({ from: new Date().toISOString() }, { limit: 4, offset: 0 }),
    listMuseumArtifacts({ featured: true }, { limit: 4, offset: 0 }),
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM products WHERE status = 'published') AS "publishedProducts",
        (SELECT COUNT(*)::int FROM destinations WHERE status = 'published') AS "publishedDestinations",
        (SELECT COUNT(*)::int FROM events WHERE status = 'published' AND starts_at >= now()) AS "upcomingEvents",
        (
          SELECT COUNT(DISTINCT business_id)::int
          FROM business_accreditations
          WHERE status = 'accredited'
        ) AS "accreditedBusinesses"
    `),
  ])

  return {
    featuredPromotions: promotions.items,
    featuredProducts: products.items,
    featuredDestinations: destinations.items,
    upcomingEvents: events.items,
    featuredMuseumArtifacts: artifacts.items,
    publicStats: stats.rows[0],
  }
}

module.exports = {
  listProducts,
  getProductBySlug,
  listEvents,
  getEventBySlug,
  listDestinations,
  getDestinationBySlug,
  listMuseumArtifacts,
  getMuseumArtifactBySlug,
  listPromotions,
  getPromotionBySlug,
  getBusinessBySlug,
  listMapLocations,
  listCategories,
  getHome,
}
