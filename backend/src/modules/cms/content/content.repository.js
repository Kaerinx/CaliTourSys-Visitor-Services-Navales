const { query } = require('../../../config/db')
const { mapCategory, mapEvent, mapPromotion } = require('../../../utils/cmsContentMapper')

const SORT_COLUMNS = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  title: 'title',
  name: 'name',
  status: 'status',
  startsAt: 'starts_at',
  displayOrder: 'display_order',
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

module.exports = {
  createCategory,
  createEvent,
  createPromotion,
  getCategoryById,
  getCategoryConfig,
  getEventById,
  getPromotionById,
  listCategories,
  listEvents,
  listPromotions,
  archiveEvent,
  archivePromotion,
  publishEvent,
  publishPromotion,
  updateCategory,
  updateEvent,
  updatePromotion,
}
