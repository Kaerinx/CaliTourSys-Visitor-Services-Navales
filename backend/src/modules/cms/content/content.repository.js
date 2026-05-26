const { query } = require('../../../config/db')
const {
  mapBusiness,
  mapCategory,
  mapDestination,
  mapEvent,
  mapMapLocation,
  mapMuseumArtifact,
  mapProduct,
  mapPromotion,
} = require('../../../utils/cmsContentMapper')

const SORT_COLUMNS = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  title: 'title',
  name: 'name',
  label: 'label',
  status: 'status',
  startsAt: 'starts_at',
  displayOrder: 'display_order',
  sortPriority: 'sort_priority',
}

const CATEGORY_CONFIGS = {
  event: {
    table: 'event_categories',
    hasColor: false,
    auditEntityType: 'event',
  },
  product: {
    table: 'product_categories',
    hasColor: false,
    auditEntityType: 'product',
  },
  destination: {
    table: 'destination_categories',
    hasColor: true,
    auditEntityType: 'destination',
  },
  artifact: {
    table: 'artifact_categories',
    hasColor: false,
    auditEntityType: 'museum_artifact',
  },
}

function sortClause(sort, fallback = '-createdAt', alias = '') {
  const selected = sort || fallback
  const direction = selected.startsWith('-') ? 'DESC' : 'ASC'
  const key = selected.replace(/^-/, '')
  const column = SORT_COLUMNS[key] || SORT_COLUMNS.createdAt
  const prefix = alias ? `${alias}.` : ''

  return `${prefix}${column} ${direction}`
}

function createDuplicateSlugError(error) {
  if (error?.code !== '23505') return error

  const conflict = new Error('A record with this slug already exists.')
  conflict.statusCode = 409
  conflict.code = 'CONFLICT'
  conflict.publicMessage = 'A record with this slug already exists.'
  return conflict
}

function createNotFoundError(label) {
  const error = new Error(`${label} not found.`)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = `${label} not found.`
  return error
}

function createInvalidReferenceError(message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'VALIDATION_ERROR'
  error.publicMessage = message
  return error
}

function createDatabaseWriteError(error) {
  if (error?.code === '23505') return createDuplicateSlugError(error)

  if (error?.code === '23503' || error?.code === '23514' || error?.code === '22P02') {
    const validation = new Error('Request violates a database constraint.')
    validation.statusCode = 400
    validation.code = 'VALIDATION_ERROR'
    validation.publicMessage = 'Request violates a database constraint.'
    return validation
  }

  return error
}

async function assertRecordExists(table, id, label) {
  const result = await query(`SELECT 1 FROM ${table} WHERE id = $1 LIMIT 1`, [id])
  if (result.rowCount === 0) {
    throw createInvalidReferenceError(`${label} does not exist.`)
  }
}

async function listPromotions(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.featured ?? null]
  const countParams = [filters.search || null, filters.status || null, filters.featured ?? null]
  const where = `
    WHERE ($3::text IS NULL OR p.title ILIKE '%' || $3 || '%' OR p.slug ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR p.status = $4)
      AND ($5::boolean IS NULL OR p.is_featured = $5)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR p.title ILIKE '%' || $1 || '%' OR p.slug ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR p.status = $2)
      AND ($3::boolean IS NULL OR p.is_featured = $3)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'p')

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT p.*
        FROM promotions p
        ${where}
        ORDER BY ${orderBy}, p.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(
      `
        SELECT COUNT(*)::integer AS total_items
        FROM promotions p
        ${countWhere}
      `,
      countParams,
    ),
  ])

  return {
    items: itemsResult.rows.map(mapPromotion),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getPromotionById(id) {
  const result = await query('SELECT * FROM promotions WHERE id = $1 LIMIT 1', [id])
  return mapPromotion(result.rows[0])
}

async function createPromotion(data, userId) {
  try {
    const result = await query(
      `
        INSERT INTO promotions (
          slug,
          title,
          summary,
          description,
          promotion_type,
          accent_color,
          starts_at,
          ends_at,
          status,
          is_featured,
          published_at,
          archived_at,
          created_by,
          updated_by,
          published_by,
          archived_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::content_status, $10,
          CASE WHEN $9::content_status = 'published' THEN now() ELSE NULL END,
          CASE WHEN $9::content_status = 'archived' THEN now() ELSE NULL END,
          $11::uuid, $11::uuid,
          CASE WHEN $9::content_status = 'published' THEN $11::uuid ELSE NULL END,
          CASE WHEN $9::content_status = 'archived' THEN $11::uuid ELSE NULL END
        )
        RETURNING *
      `,
      [
        data.slug,
        data.title,
        data.summary ?? null,
        data.description ?? null,
        data.promotionType,
        data.accentColor ?? null,
        data.startsAt ?? null,
        data.endsAt ?? null,
        data.status || 'draft',
        data.isFeatured ?? false,
        userId,
      ],
    )

    return mapPromotion(result.rows[0])
  } catch (error) {
    throw createDuplicateSlugError(error)
  }
}

async function updatePromotion(id, data, userId) {
  const existing = await getPromotionById(id)
  if (!existing) throw createNotFoundError('Promotion')

  try {
    const result = await query(
      `
        UPDATE promotions
        SET
          slug = COALESCE($2, slug),
          title = COALESCE($3, title),
          summary = COALESCE($4, summary),
          description = COALESCE($5, description),
          promotion_type = COALESCE($6, promotion_type),
          accent_color = COALESCE($7, accent_color),
          starts_at = COALESCE($8, starts_at),
          ends_at = COALESCE($9, ends_at),
          status = COALESCE($10::content_status, status),
          is_featured = COALESCE($11, is_featured),
          updated_by = $12
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        data.slug ?? null,
        data.title ?? null,
        data.summary ?? null,
        data.description ?? null,
        data.promotionType ?? null,
        data.accentColor ?? null,
        data.startsAt ?? null,
        data.endsAt ?? null,
        data.status ?? null,
        data.isFeatured ?? null,
        userId,
      ],
    )

    return {
      before: existing,
      after: mapPromotion(result.rows[0]),
    }
  } catch (error) {
    throw createDuplicateSlugError(error)
  }
}

async function publishPromotion(id, userId) {
  const existing = await getPromotionById(id)
  if (!existing) throw createNotFoundError('Promotion')

  const result = await query(
    `
      UPDATE promotions
      SET
        status = 'published',
        published_at = now(),
        published_by = $2,
        updated_by = $2
      WHERE id = $1
      RETURNING *
    `,
    [id, userId],
  )

  return {
    before: existing,
    after: mapPromotion(result.rows[0]),
  }
}

async function archivePromotion(id, userId) {
  const existing = await getPromotionById(id)
  if (!existing) throw createNotFoundError('Promotion')

  const result = await query(
    `
      UPDATE promotions
      SET
        status = 'archived',
        archived_at = now(),
        archived_by = $2,
        updated_by = $2
      WHERE id = $1
      RETURNING *
    `,
    [id, userId],
  )

  return {
    before: existing,
    after: mapPromotion(result.rows[0]),
  }
}

async function listEvents(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.featured ?? null]
  const countParams = [filters.search || null, filters.status || null, filters.featured ?? null]
  const where = `
    WHERE ($3::text IS NULL OR e.title ILIKE '%' || $3 || '%' OR e.slug ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR e.status = $4)
      AND ($5::boolean IS NULL OR e.is_featured = $5)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR e.title ILIKE '%' || $1 || '%' OR e.slug ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR e.status = $2)
      AND ($3::boolean IS NULL OR e.is_featured = $3)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'e')

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          e.*,
          ec.slug AS category_slug,
          ec.name AS category_name
        FROM events e
        JOIN event_categories ec ON ec.id = e.category_id
        ${where}
        ORDER BY ${orderBy}, e.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(
      `
        SELECT COUNT(*)::integer AS total_items
        FROM events e
        ${countWhere}
      `,
      countParams,
    ),
  ])

  return {
    items: itemsResult.rows.map(mapEvent),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getEventById(id) {
  const result = await query(
    `
      SELECT
        e.*,
        ec.slug AS category_slug,
        ec.name AS category_name
      FROM events e
      JOIN event_categories ec ON ec.id = e.category_id
      WHERE e.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapEvent(result.rows[0])
}

async function assertEventCategoryExists(categoryId) {
  const result = await query('SELECT 1 FROM event_categories WHERE id = $1 LIMIT 1', [categoryId])
  if (result.rowCount === 0) {
    throw createInvalidReferenceError('Event category does not exist.')
  }
}

async function createEvent(data, userId) {
  await assertEventCategoryExists(data.categoryId)

  try {
    const result = await query(
      `
        INSERT INTO events (
          category_id,
          slug,
          title,
          short_description,
          description,
          venue_name,
          organizer_name,
          contact_info,
          address_line,
          barangay,
          starts_at,
          ends_at,
          accent_color,
          status,
          is_featured,
          published_at,
          archived_at,
          created_by,
          updated_by,
          published_by,
          archived_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14::content_status, $15,
          CASE WHEN $14::content_status = 'published' THEN now() ELSE NULL END,
          CASE WHEN $14::content_status = 'archived' THEN now() ELSE NULL END,
          $16::uuid, $16::uuid,
          CASE WHEN $14::content_status = 'published' THEN $16::uuid ELSE NULL END,
          CASE WHEN $14::content_status = 'archived' THEN $16::uuid ELSE NULL END
        )
        RETURNING *
      `,
      [
        data.categoryId,
        data.slug,
        data.title,
        data.shortDescription ?? null,
        data.description ?? null,
        data.venueName ?? null,
        data.organizerName ?? null,
        data.contactInfo ?? null,
        data.addressLine ?? null,
        data.barangay ?? null,
        data.startsAt,
        data.endsAt ?? null,
        data.accentColor ?? null,
        data.status || 'draft',
        data.isFeatured ?? false,
        userId,
      ],
    )

    return getEventById(result.rows[0].id)
  } catch (error) {
    throw createDuplicateSlugError(error)
  }
}

async function updateEvent(id, data, userId) {
  const existing = await getEventById(id)
  if (!existing) throw createNotFoundError('Event')
  if (data.categoryId) await assertEventCategoryExists(data.categoryId)

  try {
    const result = await query(
      `
        UPDATE events
        SET
          category_id = COALESCE($2, category_id),
          slug = COALESCE($3, slug),
          title = COALESCE($4, title),
          short_description = COALESCE($5, short_description),
          description = COALESCE($6, description),
          venue_name = COALESCE($7, venue_name),
          organizer_name = COALESCE($8, organizer_name),
          contact_info = COALESCE($9, contact_info),
          address_line = COALESCE($10, address_line),
          barangay = COALESCE($11, barangay),
          starts_at = COALESCE($12, starts_at),
          ends_at = COALESCE($13, ends_at),
          accent_color = COALESCE($14, accent_color),
          status = COALESCE($15::content_status, status),
          is_featured = COALESCE($16, is_featured),
          updated_by = $17
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
        data.categoryId ?? null,
        data.slug ?? null,
        data.title ?? null,
        data.shortDescription ?? null,
        data.description ?? null,
        data.venueName ?? null,
        data.organizerName ?? null,
        data.contactInfo ?? null,
        data.addressLine ?? null,
        data.barangay ?? null,
        data.startsAt ?? null,
        data.endsAt ?? null,
        data.accentColor ?? null,
        data.status ?? null,
        data.isFeatured ?? null,
        userId,
      ],
    )

    return {
      before: existing,
      after: await getEventById(result.rows[0].id),
    }
  } catch (error) {
    throw createDuplicateSlugError(error)
  }
}

async function publishEvent(id, userId) {
  const existing = await getEventById(id)
  if (!existing) throw createNotFoundError('Event')

  const result = await query(
    `
      UPDATE events
      SET
        status = 'published',
        published_at = now(),
        published_by = $2,
        updated_by = $2
      WHERE id = $1
      RETURNING id
    `,
    [id, userId],
  )

  return {
    before: existing,
    after: await getEventById(result.rows[0].id),
  }
}

async function archiveEvent(id, userId) {
  const existing = await getEventById(id)
  if (!existing) throw createNotFoundError('Event')

  const result = await query(
    `
      UPDATE events
      SET
        status = 'archived',
        archived_at = now(),
        archived_by = $2,
        updated_by = $2
      WHERE id = $1
      RETURNING id
    `,
    [id, userId],
  )

  return {
    before: existing,
    after: await getEventById(result.rows[0].id),
  }
}

function getCategoryConfig(kind) {
  const config = CATEGORY_CONFIGS[kind]
  if (!config) {
    throw new Error(`Unknown category kind: ${kind}`)
  }
  return config
}

async function listCategories(kind, filters, pagination) {
  const config = getCategoryConfig(kind)
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null]
  const countParams = [filters.search || null, filters.status || null]
  const where = `
    WHERE ($3::text IS NULL OR c.name ILIKE '%' || $3 || '%' OR c.slug ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR c.status = $4)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR c.name ILIKE '%' || $1 || '%' OR c.slug ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR c.status = $2)
  `
  const orderBy = sortClause(filters.sort, 'displayOrder', 'c')
  const colorSelect = config.hasColor ? 'c.color,' : 'NULL::varchar AS color,'

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          c.id,
          c.slug,
          c.name,
          ${colorSelect}
          c.description,
          c.display_order,
          c.status,
          c.created_at,
          c.updated_at
        FROM ${config.table} c
        ${where}
        ORDER BY ${orderBy}, c.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(
      `
        SELECT COUNT(*)::integer AS total_items
        FROM ${config.table} c
        ${countWhere}
      `,
      countParams,
    ),
  ])

  return {
    items: itemsResult.rows.map(mapCategory),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getCategoryById(kind, id) {
  const config = getCategoryConfig(kind)
  const colorSelect = config.hasColor ? 'color,' : 'NULL::varchar AS color,'
  const result = await query(
    `
      SELECT
        id,
        slug,
        name,
        ${colorSelect}
        description,
        display_order,
        status,
        created_at,
        updated_at
      FROM ${config.table}
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )

  return mapCategory(result.rows[0])
}

async function createCategory(kind, data) {
  const config = getCategoryConfig(kind)
  const colorColumn = config.hasColor ? ', color' : ''
  const colorValue = config.hasColor ? ', $6' : ''
  const params = config.hasColor
    ? [data.slug, data.name, data.description ?? null, data.displayOrder ?? 0, data.status || 'published', data.color ?? null]
    : [data.slug, data.name, data.description ?? null, data.displayOrder ?? 0, data.status || 'published']

  try {
    const result = await query(
      `
        INSERT INTO ${config.table} (
          slug,
          name,
          description,
          display_order,
          status
          ${colorColumn}
        )
        VALUES ($1, $2, $3, $4, $5::content_status ${colorValue})
        RETURNING id
      `,
      params,
    )

    return getCategoryById(kind, result.rows[0].id)
  } catch (error) {
    throw createDuplicateSlugError(error)
  }
}

async function updateCategory(kind, id, data) {
  const config = getCategoryConfig(kind)
  const existing = await getCategoryById(kind, id)
  if (!existing) throw createNotFoundError('Category')

  const colorSet = config.hasColor ? ', color = COALESCE($6, color)' : ''
  const params = config.hasColor
    ? [
        id,
        data.slug ?? null,
        data.name ?? null,
        data.description ?? null,
        data.displayOrder ?? null,
        data.color ?? null,
        data.status ?? null,
      ]
    : [id, data.slug ?? null, data.name ?? null, data.description ?? null, data.displayOrder ?? null, data.status ?? null]

  const statusParam = config.hasColor ? '$7' : '$6'

  try {
    const result = await query(
      `
        UPDATE ${config.table}
        SET
          slug = COALESCE($2, slug),
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          display_order = COALESCE($5, display_order),
          status = COALESCE(${statusParam}::content_status, status)
          ${colorSet}
        WHERE id = $1
        RETURNING id
      `,
      params,
    )

    return {
      before: existing,
      after: await getCategoryById(kind, result.rows[0].id),
    }
  } catch (error) {
    throw createDuplicateSlugError(error)
  }
}

async function listProducts(filters, pagination) {
  const listParams = [
    pagination.limit,
    pagination.offset,
    filters.search || null,
    filters.status || null,
    filters.categoryId || null,
    filters.businessId || null,
    filters.featured ?? null,
  ]
  const countParams = [
    filters.search || null,
    filters.status || null,
    filters.categoryId || null,
    filters.businessId || null,
    filters.featured ?? null,
  ]
  const where = `
    WHERE ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.slug ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR p.status = $4)
      AND ($5::uuid IS NULL OR p.category_id = $5)
      AND ($6::uuid IS NULL OR p.business_id = $6)
      AND ($7::boolean IS NULL OR p.is_featured = $7)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%' OR p.slug ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR p.status = $2)
      AND ($3::uuid IS NULL OR p.category_id = $3)
      AND ($4::uuid IS NULL OR p.business_id = $4)
      AND ($5::boolean IS NULL OR p.is_featured = $5)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'p')

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          p.*,
          pc.slug AS category_slug,
          pc.name AS category_name,
          b.slug AS business_slug,
          b.name AS business_name
        FROM products p
        JOIN product_categories pc ON pc.id = p.category_id
        JOIN businesses b ON b.id = p.business_id
        ${where}
        ORDER BY ${orderBy}, p.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(`SELECT COUNT(*)::integer AS total_items FROM products p ${countWhere}`, countParams),
  ])

  return {
    items: itemsResult.rows.map(mapProduct),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getProductById(id) {
  const result = await query(
    `
      SELECT
        p.*,
        pc.slug AS category_slug,
        pc.name AS category_name,
        b.slug AS business_slug,
        b.name AS business_name
      FROM products p
      JOIN product_categories pc ON pc.id = p.category_id
      JOIN businesses b ON b.id = p.business_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapProduct(result.rows[0])
}

async function createProduct(data, userId) {
  await assertRecordExists('businesses', data.businessId, 'Business')
  await assertRecordExists('product_categories', data.categoryId, 'Product category')

  try {
    const result = await query(
      `
        INSERT INTO products (
          business_id,
          category_id,
          slug,
          name,
          short_description,
          description,
          price_amount,
          price_currency,
          unit_label,
          availability_text,
          accent_color,
          status,
          is_featured,
          published_at,
          archived_at,
          created_by,
          updated_by,
          published_by,
          archived_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12::content_status, $13,
          CASE WHEN $12::content_status = 'published' THEN now() ELSE NULL END,
          CASE WHEN $12::content_status = 'archived' THEN now() ELSE NULL END,
          $14::uuid, $14::uuid,
          CASE WHEN $12::content_status = 'published' THEN $14::uuid ELSE NULL END,
          CASE WHEN $12::content_status = 'archived' THEN $14::uuid ELSE NULL END
        )
        RETURNING id
      `,
      [
        data.businessId,
        data.categoryId,
        data.slug,
        data.name,
        data.shortDescription ?? null,
        data.description ?? null,
        data.priceAmount ?? null,
        data.priceCurrency || 'PHP',
        data.unitLabel ?? null,
        data.availabilityText ?? null,
        data.accentColor ?? null,
        data.status || 'draft',
        data.isFeatured ?? false,
        userId,
      ],
    )

    return getProductById(result.rows[0].id)
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function updateProduct(id, data, userId) {
  const existing = await getProductById(id)
  if (!existing) throw createNotFoundError('Product')
  if (data.businessId) await assertRecordExists('businesses', data.businessId, 'Business')
  if (data.categoryId) await assertRecordExists('product_categories', data.categoryId, 'Product category')

  try {
    const result = await query(
      `
        UPDATE products
        SET
          business_id = COALESCE($2, business_id),
          category_id = COALESCE($3, category_id),
          slug = COALESCE($4, slug),
          name = COALESCE($5, name),
          short_description = COALESCE($6, short_description),
          description = COALESCE($7, description),
          price_amount = COALESCE($8, price_amount),
          price_currency = COALESCE($9, price_currency),
          unit_label = COALESCE($10, unit_label),
          availability_text = COALESCE($11, availability_text),
          accent_color = COALESCE($12, accent_color),
          status = COALESCE($13::content_status, status),
          is_featured = COALESCE($14, is_featured),
          updated_by = $15::uuid
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
        data.businessId ?? null,
        data.categoryId ?? null,
        data.slug ?? null,
        data.name ?? null,
        data.shortDescription ?? null,
        data.description ?? null,
        data.priceAmount ?? null,
        data.priceCurrency ?? null,
        data.unitLabel ?? null,
        data.availabilityText ?? null,
        data.accentColor ?? null,
        data.status ?? null,
        data.isFeatured ?? null,
        userId,
      ],
    )

    return {
      before: existing,
      after: await getProductById(result.rows[0].id),
    }
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function publishProduct(id, userId) {
  const existing = await getProductById(id)
  if (!existing) throw createNotFoundError('Product')
  const result = await query(
    `
      UPDATE products
      SET status = 'published', published_at = now(), published_by = $2::uuid, updated_by = $2::uuid
      WHERE id = $1
      RETURNING id
    `,
    [id, userId],
  )
  return { before: existing, after: await getProductById(result.rows[0].id) }
}

async function archiveProduct(id, userId) {
  const existing = await getProductById(id)
  if (!existing) throw createNotFoundError('Product')
  const result = await query(
    `
      UPDATE products
      SET status = 'archived', archived_at = now(), archived_by = $2::uuid, updated_by = $2::uuid
      WHERE id = $1
      RETURNING id
    `,
    [id, userId],
  )
  return { before: existing, after: await getProductById(result.rows[0].id) }
}

async function listDestinations(filters, pagination) {
  const listParams = [
    pagination.limit,
    pagination.offset,
    filters.search || null,
    filters.status || null,
    filters.categoryId || null,
    filters.barangay || null,
    filters.featured ?? null,
  ]
  const countParams = [
    filters.search || null,
    filters.status || null,
    filters.categoryId || null,
    filters.barangay || null,
    filters.featured ?? null,
  ]
  const where = `
    WHERE ($3::text IS NULL OR d.name ILIKE '%' || $3 || '%' OR d.slug ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR d.status = $4)
      AND ($5::uuid IS NULL OR d.category_id = $5)
      AND ($6::text IS NULL OR d.barangay ILIKE '%' || $6 || '%')
      AND ($7::boolean IS NULL OR d.is_featured = $7)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR d.name ILIKE '%' || $1 || '%' OR d.slug ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR d.status = $2)
      AND ($3::uuid IS NULL OR d.category_id = $3)
      AND ($4::text IS NULL OR d.barangay ILIKE '%' || $4 || '%')
      AND ($5::boolean IS NULL OR d.is_featured = $5)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'd')

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          d.*,
          dc.slug AS category_slug,
          dc.name AS category_name,
          b.slug AS business_slug,
          b.name AS business_name
        FROM destinations d
        JOIN destination_categories dc ON dc.id = d.category_id
        LEFT JOIN businesses b ON b.id = d.business_id
        ${where}
        ORDER BY ${orderBy}, d.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(`SELECT COUNT(*)::integer AS total_items FROM destinations d ${countWhere}`, countParams),
  ])

  return {
    items: itemsResult.rows.map(mapDestination),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getDestinationById(id) {
  const result = await query(
    `
      SELECT
        d.*,
        dc.slug AS category_slug,
        dc.name AS category_name,
        b.slug AS business_slug,
        b.name AS business_name
      FROM destinations d
      JOIN destination_categories dc ON dc.id = d.category_id
      LEFT JOIN businesses b ON b.id = d.business_id
      WHERE d.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapDestination(result.rows[0])
}

async function createDestination(data, userId) {
  await assertRecordExists('destination_categories', data.categoryId, 'Destination category')
  if (data.businessId) await assertRecordExists('businesses', data.businessId, 'Business')

  try {
    const result = await query(
      `
        INSERT INTO destinations (
          category_id, business_id, slug, name, short_description, description,
          address_line, barangay, municipality, province, opening_hours_text,
          entrance_fee_text, best_time_to_visit, accessibility_notes, accent_color,
          status, is_featured, published_at, archived_at, created_by, updated_by,
          published_by, archived_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16::content_status, $17,
          CASE WHEN $16::content_status = 'published' THEN now() ELSE NULL END,
          CASE WHEN $16::content_status = 'archived' THEN now() ELSE NULL END,
          $18::uuid, $18::uuid,
          CASE WHEN $16::content_status = 'published' THEN $18::uuid ELSE NULL END,
          CASE WHEN $16::content_status = 'archived' THEN $18::uuid ELSE NULL END
        )
        RETURNING id
      `,
      [
        data.categoryId,
        data.businessId ?? null,
        data.slug,
        data.name,
        data.shortDescription ?? null,
        data.description ?? null,
        data.addressLine ?? null,
        data.barangay ?? null,
        data.municipality || 'Calabanga',
        data.province || 'Camarines Sur',
        data.openingHoursText ?? null,
        data.entranceFeeText ?? null,
        data.bestTimeToVisit ?? null,
        data.accessibilityNotes ?? null,
        data.accentColor ?? null,
        data.status || 'draft',
        data.isFeatured ?? false,
        userId,
      ],
    )

    return getDestinationById(result.rows[0].id)
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function updateDestination(id, data, userId) {
  const existing = await getDestinationById(id)
  if (!existing) throw createNotFoundError('Destination')
  if (data.categoryId) await assertRecordExists('destination_categories', data.categoryId, 'Destination category')
  if (data.businessId) await assertRecordExists('businesses', data.businessId, 'Business')

  try {
    const result = await query(
      `
        UPDATE destinations
        SET
          category_id = COALESCE($2, category_id),
          business_id = COALESCE($3, business_id),
          slug = COALESCE($4, slug),
          name = COALESCE($5, name),
          short_description = COALESCE($6, short_description),
          description = COALESCE($7, description),
          address_line = COALESCE($8, address_line),
          barangay = COALESCE($9, barangay),
          municipality = COALESCE($10, municipality),
          province = COALESCE($11, province),
          opening_hours_text = COALESCE($12, opening_hours_text),
          entrance_fee_text = COALESCE($13, entrance_fee_text),
          best_time_to_visit = COALESCE($14, best_time_to_visit),
          accessibility_notes = COALESCE($15, accessibility_notes),
          accent_color = COALESCE($16, accent_color),
          status = COALESCE($17::content_status, status),
          is_featured = COALESCE($18, is_featured),
          updated_by = $19::uuid
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
        data.categoryId ?? null,
        data.businessId ?? null,
        data.slug ?? null,
        data.name ?? null,
        data.shortDescription ?? null,
        data.description ?? null,
        data.addressLine ?? null,
        data.barangay ?? null,
        data.municipality ?? null,
        data.province ?? null,
        data.openingHoursText ?? null,
        data.entranceFeeText ?? null,
        data.bestTimeToVisit ?? null,
        data.accessibilityNotes ?? null,
        data.accentColor ?? null,
        data.status ?? null,
        data.isFeatured ?? null,
        userId,
      ],
    )

    return { before: existing, after: await getDestinationById(result.rows[0].id) }
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function publishDestination(id, userId) {
  const existing = await getDestinationById(id)
  if (!existing) throw createNotFoundError('Destination')
  const result = await query(
    `UPDATE destinations SET status = 'published', published_at = now(), published_by = $2::uuid, updated_by = $2::uuid WHERE id = $1 RETURNING id`,
    [id, userId],
  )
  return { before: existing, after: await getDestinationById(result.rows[0].id) }
}

async function archiveDestination(id, userId) {
  const existing = await getDestinationById(id)
  if (!existing) throw createNotFoundError('Destination')
  const result = await query(
    `UPDATE destinations SET status = 'archived', archived_at = now(), archived_by = $2::uuid, updated_by = $2::uuid WHERE id = $1 RETURNING id`,
    [id, userId],
  )
  return { before: existing, after: await getDestinationById(result.rows[0].id) }
}

async function listBusinesses(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.businessType || null, filters.featured ?? null]
  const countParams = [filters.search || null, filters.status || null, filters.businessType || null, filters.featured ?? null]
  const where = `
    WHERE ($3::text IS NULL OR b.name ILIKE '%' || $3 || '%' OR b.slug ILIKE '%' || $3 || '%')
      AND ($4::business_status IS NULL OR b.status = $4)
      AND ($5::text IS NULL OR b.business_type ILIKE '%' || $5 || '%')
      AND ($6::boolean IS NULL OR b.is_featured = $6)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR b.name ILIKE '%' || $1 || '%' OR b.slug ILIKE '%' || $1 || '%')
      AND ($2::business_status IS NULL OR b.status = $2)
      AND ($3::text IS NULL OR b.business_type ILIKE '%' || $3 || '%')
      AND ($4::boolean IS NULL OR b.is_featured = $4)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'b')

  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT b.* FROM businesses b ${where} ORDER BY ${orderBy}, b.id ASC LIMIT $1 OFFSET $2`, listParams),
    query(`SELECT COUNT(*)::integer AS total_items FROM businesses b ${countWhere}`, countParams),
  ])

  return {
    items: itemsResult.rows.map(mapBusiness),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getBusinessById(id) {
  const result = await query('SELECT * FROM businesses WHERE id = $1 LIMIT 1', [id])
  return mapBusiness(result.rows[0])
}

async function createBusiness(data, userId) {
  try {
    const result = await query(
      `
        INSERT INTO businesses (
          slug, name, business_type, owner_name, description, address_line,
          barangay, municipality, province, status, is_featured, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::business_status, $11, $12::uuid, $12::uuid)
        RETURNING *
      `,
      [
        data.slug,
        data.name,
        data.businessType,
        data.ownerName ?? null,
        data.description ?? null,
        data.addressLine ?? null,
        data.barangay ?? null,
        data.municipality || 'Calabanga',
        data.province || 'Camarines Sur',
        data.status || 'active',
        data.isFeatured ?? false,
        userId,
      ],
    )

    return mapBusiness(result.rows[0])
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function updateBusiness(id, data, userId) {
  const existing = await getBusinessById(id)
  if (!existing) throw createNotFoundError('Business')

  try {
    const result = await query(
      `
        UPDATE businesses
        SET
          slug = COALESCE($2, slug),
          name = COALESCE($3, name),
          business_type = COALESCE($4, business_type),
          owner_name = COALESCE($5, owner_name),
          description = COALESCE($6, description),
          address_line = COALESCE($7, address_line),
          barangay = COALESCE($8, barangay),
          municipality = COALESCE($9, municipality),
          province = COALESCE($10, province),
          status = COALESCE($11::business_status, status),
          is_featured = COALESCE($12, is_featured),
          updated_by = $13::uuid
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        data.slug ?? null,
        data.name ?? null,
        data.businessType ?? null,
        data.ownerName ?? null,
        data.description ?? null,
        data.addressLine ?? null,
        data.barangay ?? null,
        data.municipality ?? null,
        data.province ?? null,
        data.status ?? null,
        data.isFeatured ?? null,
        userId,
      ],
    )

    return { before: existing, after: mapBusiness(result.rows[0]) }
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function listMuseumArtifacts(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.categoryId || null, filters.featured ?? null]
  const countParams = [filters.search || null, filters.status || null, filters.categoryId || null, filters.featured ?? null]
  const where = `
    WHERE ($3::text IS NULL OR m.name ILIKE '%' || $3 || '%' OR m.slug ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR m.status = $4)
      AND ($5::uuid IS NULL OR m.category_id = $5)
      AND ($6::boolean IS NULL OR m.is_featured = $6)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR m.name ILIKE '%' || $1 || '%' OR m.slug ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR m.status = $2)
      AND ($3::uuid IS NULL OR m.category_id = $3)
      AND ($4::boolean IS NULL OR m.is_featured = $4)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'm')

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          m.*,
          ac.slug AS category_slug,
          ac.name AS category_name
        FROM museum_artifacts m
        JOIN artifact_categories ac ON ac.id = m.category_id
        ${where}
        ORDER BY ${orderBy}, m.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(`SELECT COUNT(*)::integer AS total_items FROM museum_artifacts m ${countWhere}`, countParams),
  ])

  return {
    items: itemsResult.rows.map(mapMuseumArtifact),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getMuseumArtifactById(id) {
  const result = await query(
    `
      SELECT
        m.*,
        ac.slug AS category_slug,
        ac.name AS category_name
      FROM museum_artifacts m
      JOIN artifact_categories ac ON ac.id = m.category_id
      WHERE m.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapMuseumArtifact(result.rows[0])
}

async function createMuseumArtifact(data, userId) {
  await assertRecordExists('artifact_categories', data.categoryId, 'Artifact category')

  try {
    const result = await query(
      `
        INSERT INTO museum_artifacts (
          category_id, slug, name, era_label, short_description, description,
          historical_notes, accent_color, status, is_featured, published_at,
          archived_at, created_by, updated_by, published_by, archived_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::content_status, $10,
          CASE WHEN $9::content_status = 'published' THEN now() ELSE NULL END,
          CASE WHEN $9::content_status = 'archived' THEN now() ELSE NULL END,
          $11::uuid, $11::uuid,
          CASE WHEN $9::content_status = 'published' THEN $11::uuid ELSE NULL END,
          CASE WHEN $9::content_status = 'archived' THEN $11::uuid ELSE NULL END
        )
        RETURNING id
      `,
      [
        data.categoryId,
        data.slug,
        data.name,
        data.eraLabel ?? null,
        data.shortDescription ?? null,
        data.description ?? null,
        data.historicalNotes ?? null,
        data.accentColor ?? null,
        data.status || 'draft',
        data.isFeatured ?? false,
        userId,
      ],
    )

    return getMuseumArtifactById(result.rows[0].id)
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function updateMuseumArtifact(id, data, userId) {
  const existing = await getMuseumArtifactById(id)
  if (!existing) throw createNotFoundError('Museum artifact')
  if (data.categoryId) await assertRecordExists('artifact_categories', data.categoryId, 'Artifact category')

  try {
    const result = await query(
      `
        UPDATE museum_artifacts
        SET
          category_id = COALESCE($2, category_id),
          slug = COALESCE($3, slug),
          name = COALESCE($4, name),
          era_label = COALESCE($5, era_label),
          short_description = COALESCE($6, short_description),
          description = COALESCE($7, description),
          historical_notes = COALESCE($8, historical_notes),
          accent_color = COALESCE($9, accent_color),
          status = COALESCE($10::content_status, status),
          is_featured = COALESCE($11, is_featured),
          updated_by = $12::uuid
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
        data.categoryId ?? null,
        data.slug ?? null,
        data.name ?? null,
        data.eraLabel ?? null,
        data.shortDescription ?? null,
        data.description ?? null,
        data.historicalNotes ?? null,
        data.accentColor ?? null,
        data.status ?? null,
        data.isFeatured ?? null,
        userId,
      ],
    )

    return { before: existing, after: await getMuseumArtifactById(result.rows[0].id) }
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function publishMuseumArtifact(id, userId) {
  const existing = await getMuseumArtifactById(id)
  if (!existing) throw createNotFoundError('Museum artifact')
  const result = await query(
    `UPDATE museum_artifacts SET status = 'published', published_at = now(), published_by = $2::uuid, updated_by = $2::uuid WHERE id = $1 RETURNING id`,
    [id, userId],
  )
  return { before: existing, after: await getMuseumArtifactById(result.rows[0].id) }
}

async function archiveMuseumArtifact(id, userId) {
  const existing = await getMuseumArtifactById(id)
  if (!existing) throw createNotFoundError('Museum artifact')
  const result = await query(
    `UPDATE museum_artifacts SET status = 'archived', archived_at = now(), archived_by = $2::uuid, updated_by = $2::uuid WHERE id = $1 RETURNING id`,
    [id, userId],
  )
  return { before: existing, after: await getMuseumArtifactById(result.rows[0].id) }
}

async function assertMapTargetExists(data) {
  if (data.locationType === 'destination') await assertRecordExists('destinations', data.destinationId, 'Destination')
  if (data.locationType === 'business') await assertRecordExists('businesses', data.businessId, 'Business')
  if (data.locationType === 'event') await assertRecordExists('events', data.eventId, 'Event')
}

async function listMapLocations(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.locationType || null]
  const countParams = [filters.search || null, filters.status || null, filters.locationType || null]
  const where = `
    WHERE ($3::text IS NULL OR ml.label ILIKE '%' || $3 || '%')
      AND ($4::content_status IS NULL OR ml.status = $4)
      AND ($5::map_location_type IS NULL OR ml.location_type = $5)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR ml.label ILIKE '%' || $1 || '%')
      AND ($2::content_status IS NULL OR ml.status = $2)
      AND ($3::map_location_type IS NULL OR ml.location_type = $3)
  `
  const normalizedSort =
    filters.sort === 'name'
      ? 'label'
      : filters.sort === '-name'
        ? '-label'
        : filters.sort === 'displayOrder'
          ? 'sortPriority'
          : filters.sort === '-displayOrder'
            ? '-sortPriority'
            : filters.sort
  const orderBy = sortClause(normalizedSort, '-createdAt', 'ml')

  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT ml.* FROM map_locations ml ${where} ORDER BY ${orderBy}, ml.id ASC LIMIT $1 OFFSET $2`, listParams),
    query(`SELECT COUNT(*)::integer AS total_items FROM map_locations ml ${countWhere}`, countParams),
  ])

  return {
    items: itemsResult.rows.map(mapMapLocation),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getMapLocationById(id) {
  const result = await query('SELECT * FROM map_locations WHERE id = $1 LIMIT 1', [id])
  return mapMapLocation(result.rows[0])
}

async function createMapLocation(data, userId) {
  await assertMapTargetExists(data)

  try {
    const result = await query(
      `
        INSERT INTO map_locations (
          location_type, destination_id, business_id, event_id, label, latitude,
          longitude, mapbox_place_id, marker_color, marker_icon, cluster_group,
          geojson_properties, is_primary, is_clusterable, sort_priority, status,
          created_by, updated_by
        )
        VALUES (
          $1::map_location_type, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12::jsonb, $13, $14, $15, $16::content_status, $17::uuid, $17::uuid
        )
        RETURNING *
      `,
      [
        data.locationType,
        data.destinationId ?? null,
        data.businessId ?? null,
        data.eventId ?? null,
        data.label,
        data.latitude,
        data.longitude,
        data.mapboxPlaceId ?? null,
        data.markerColor ?? null,
        data.markerIcon ?? null,
        data.clusterGroup ?? null,
        data.geojsonProperties ? JSON.stringify(data.geojsonProperties) : null,
        data.isPrimary ?? true,
        data.isClusterable ?? true,
        data.sortPriority ?? 0,
        data.status || 'published',
        userId,
      ],
    )

    return mapMapLocation(result.rows[0])
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function updateMapLocation(id, data, userId) {
  const existing = await getMapLocationById(id)
  if (!existing) throw createNotFoundError('Map location')
  if (data.locationType) await assertMapTargetExists(data)

  try {
    const result = await query(
      `
        UPDATE map_locations
        SET
          location_type = COALESCE($2::map_location_type, location_type),
          destination_id = CASE WHEN $2::map_location_type IS NULL THEN COALESCE($3, destination_id) ELSE $3 END,
          business_id = CASE WHEN $2::map_location_type IS NULL THEN COALESCE($4, business_id) ELSE $4 END,
          event_id = CASE WHEN $2::map_location_type IS NULL THEN COALESCE($5, event_id) ELSE $5 END,
          label = COALESCE($6, label),
          latitude = COALESCE($7, latitude),
          longitude = COALESCE($8, longitude),
          mapbox_place_id = COALESCE($9, mapbox_place_id),
          marker_color = COALESCE($10, marker_color),
          marker_icon = COALESCE($11, marker_icon),
          cluster_group = COALESCE($12, cluster_group),
          geojson_properties = COALESCE($13::jsonb, geojson_properties),
          is_primary = COALESCE($14, is_primary),
          is_clusterable = COALESCE($15, is_clusterable),
          sort_priority = COALESCE($16, sort_priority),
          status = COALESCE($17::content_status, status),
          updated_by = $18::uuid
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        data.locationType ?? null,
        data.destinationId ?? null,
        data.businessId ?? null,
        data.eventId ?? null,
        data.label ?? null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.mapboxPlaceId ?? null,
        data.markerColor ?? null,
        data.markerIcon ?? null,
        data.clusterGroup ?? null,
        data.geojsonProperties ? JSON.stringify(data.geojsonProperties) : null,
        data.isPrimary ?? null,
        data.isClusterable ?? null,
        data.sortPriority ?? null,
        data.status ?? null,
        userId,
      ],
    )

    return { before: existing, after: mapMapLocation(result.rows[0]) }
  } catch (error) {
    throw createDatabaseWriteError(error)
  }
}

async function deleteMapLocation(id) {
  const existing = await getMapLocationById(id)
  if (!existing) throw createNotFoundError('Map location')
  await query('DELETE FROM map_locations WHERE id = $1', [id])
  return { before: existing }
}

module.exports = {
  archiveDestination,
  createCategory,
  createBusiness,
  createDestination,
  createEvent,
  createMapLocation,
  createMuseumArtifact,
  createProduct,
  createPromotion,
  deleteMapLocation,
  getBusinessById,
  getCategoryById,
  getCategoryConfig,
  getDestinationById,
  getEventById,
  getMapLocationById,
  getMuseumArtifactById,
  getProductById,
  getPromotionById,
  listBusinesses,
  listCategories,
  listDestinations,
  listEvents,
  listMapLocations,
  listMuseumArtifacts,
  listProducts,
  listPromotions,
  archiveEvent,
  archiveMuseumArtifact,
  archiveProduct,
  archivePromotion,
  publishDestination,
  publishEvent,
  publishMuseumArtifact,
  publishProduct,
  publishPromotion,
  updateBusiness,
  updateCategory,
  updateDestination,
  updateEvent,
  updateMapLocation,
  updateMuseumArtifact,
  updateProduct,
  updatePromotion,
}
