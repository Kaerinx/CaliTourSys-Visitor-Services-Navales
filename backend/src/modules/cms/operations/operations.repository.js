const { query } = require('../../../config/db')

const SORT_COLUMNS = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  status: 'status',
  email: 'email',
  name: 'name',
  fullName: 'full_name',
  displayName: 'display_name',
  fileName: 'file_name',
}

function sortClause(sort, fallback = '-createdAt', alias = '') {
  const selected = sort || fallback
  const direction = selected.startsWith('-') ? 'DESC' : 'ASC'
  const key = selected.replace(/^-/, '')
  const column = SORT_COLUMNS[key] || SORT_COLUMNS.createdAt
  return `${alias ? `${alias}.` : ''}${column} ${direction}`
}

function createNotFoundError(label) {
  const error = new Error(`${label} not found.`)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = `${label} not found.`
  return error
}

function createValidationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'VALIDATION_ERROR'
  error.publicMessage = message
  return error
}

function createConflictError(message) {
  const error = new Error(message)
  error.statusCode = 409
  error.code = 'CONFLICT'
  error.publicMessage = message
  return error
}

function handleWriteError(error) {
  if (error?.code === '23505') return createConflictError('A conflicting record already exists.')
  if (['23503', '23514', '22P02'].includes(error?.code)) return createValidationError('Request violates a database constraint.')
  return error
}

function sanitizeAuditValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue)
  if (!value || typeof value !== 'object') return value

  const output = {}
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.toLowerCase()
    if (
      normalized.includes('password') ||
      normalized.includes('token') ||
      normalized.includes('secret') ||
      normalized.includes('hash')
    ) {
      continue
    }
    output[key] = sanitizeAuditValue(item)
  }
  return output
}

function mapMedia(row) {
  if (!row) return null
  return {
    id: row.id,
    fileUrl: row.file_url,
    fileName: row.file_name,
    mimeType: row.mime_type,
    altText: row.alt_text,
    caption: row.caption,
    credit: row.credit,
    width: row.width,
    height: row.height,
    status: row.status,
    storageProvider: row.storage_provider,
    storageKey: row.storage_key,
    fileSizeBytes: row.file_size_bytes === null || row.file_size_bytes === undefined ? null : Number(row.file_size_bytes),
    checksumSha256: row.checksum_sha256,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    uploadedBy: row.uploaded_by,
  }
}

function mapInquiry(row) {
  if (!row) return null
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    contactNumber: row.contact_number,
    subject: row.subject,
    message: row.message,
    sourcePage: row.source_page,
    status: row.status,
    responseCount: row.response_count === undefined ? undefined : Number(row.response_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPackageBookingRequest(row) {
  if (!row) return null
  return {
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name_snapshot,
    selectedPax: Number(row.selected_pax),
    basePrice: row.base_price_snapshot == null ? null : Number(row.base_price_snapshot),
    basePax: row.base_pax_snapshot == null ? null : Number(row.base_pax_snapshot),
    extraPaxPrice: row.extra_pax_price_snapshot == null ? null : Number(row.extra_pax_price_snapshot),
    totalAmount: row.computed_total_amount == null ? null : Number(row.computed_total_amount),
    visitor: {
      fullName: row.visitor_full_name,
      email: row.visitor_email,
      phoneNumber: row.visitor_phone_number,
    },
    preferredBookingDate: row.preferred_booking_date,
    message: row.message || '',
    paymentRequired: Boolean(row.payment_required_snapshot),
    paymentInstruction: row.payment_instruction_snapshot || '',
    paymentReferenceNumber: row.payment_reference_number || '',
    proofOfPayment: row.proof_file_url
      ? {
          fileUrl: row.proof_file_url,
          originalFilename: row.proof_original_filename,
          mimeType: row.proof_mime_type,
          fileSize: row.proof_file_size == null ? null : Number(row.proof_file_size),
          uploadedAt: row.proof_uploaded_at,
        }
      : null,
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    pricingNote: row.pricing_note,
    bookingReviewNotes: row.booking_review_notes || '',
    bookingDeclineReason: row.booking_decline_reason || '',
    bookingReviewedAt: row.booking_reviewed_at,
    bookingReviewedBy: row.booking_reviewed_by,
    paymentSubmittedAt: row.payment_submitted_at,
    paymentVerifiedAt: row.payment_verified_at,
    paymentVerifiedBy: row.payment_verified_by,
    paymentRejectionReason: row.payment_rejection_reason || '',
    paymentNotes: row.payment_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    verifiedByUser: row.verified_by_email
      ? {
          id: row.payment_verified_by,
          email: row.verified_by_email,
          displayName: row.verified_by_display_name,
        }
      : null,
    reviewedByUser: row.reviewed_by_email
      ? {
          id: row.booking_reviewed_by,
          email: row.reviewed_by_email,
          displayName: row.reviewed_by_display_name,
        }
      : null,
  }
}

function mapInquiryResponse(row) {
  if (!row) return null
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    responseMessage: row.response_message,
    status: row.status,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    responder: row.responder_id
      ? {
          id: row.responder_id,
          email: row.responder_email,
          displayName: row.responder_display_name,
        }
      : null,
  }
}

function mapNewsletterSubscriber(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    status: row.status,
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapUser(row, roles = []) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    lastLoginAt: row.last_login_at,
    lockedUntil: row.locked_until,
    passwordChangedAt: row.password_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    roles,
  }
}

function mapRole(row) {
  if (!row) return null
  return {
    id: row.id,
    roleKey: row.role_key,
    name: row.name,
    description: row.description,
    isSystemRole: row.is_system_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPermission(row) {
  if (!row) return null
  return {
    id: row.id,
    permissionKey: row.permission_key,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAuditLog(row, detail = false) {
  if (!row) return null
  const item = {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    actor: row.actor_id
      ? {
          id: row.actor_id,
          email: row.actor_email,
          displayName: row.actor_display_name,
        }
      : null,
    requestId: row.request_id,
    createdAt: row.created_at,
  }
  if (detail) {
    item.beforeValues = sanitizeAuditValue(row.before_values)
    item.afterValues = sanitizeAuditValue(row.after_values)
    item.ipAddress = row.ip_address
    item.userAgent = row.user_agent
  }
  return item
}

async function listMedia(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.mimeType || null, filters.storageProvider || null]
  const countParams = [filters.search || null, filters.status || null, filters.mimeType || null, filters.storageProvider || null]
  const where = `
    WHERE ($3::text IS NULL OR m.file_name ILIKE '%' || $3 || '%' OR m.file_url ILIKE '%' || $3 || '%' OR m.alt_text ILIKE '%' || $3 || '%')
      AND ($4::media_status IS NULL OR m.status = $4)
      AND ($5::text IS NULL OR m.mime_type ILIKE '%' || $5 || '%')
      AND ($6::media_storage_provider IS NULL OR m.storage_provider = $6)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR m.file_name ILIKE '%' || $1 || '%' OR m.file_url ILIKE '%' || $1 || '%' OR m.alt_text ILIKE '%' || $1 || '%')
      AND ($2::media_status IS NULL OR m.status = $2)
      AND ($3::text IS NULL OR m.mime_type ILIKE '%' || $3 || '%')
      AND ($4::media_storage_provider IS NULL OR m.storage_provider = $4)
  `
  const orderBy = sortClause(filters.sort === 'name' ? 'fileName' : filters.sort === '-name' ? '-fileName' : filters.sort, '-createdAt', 'm')

  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT m.* FROM media_assets m ${where} ORDER BY ${orderBy}, m.id ASC LIMIT $1 OFFSET $2`, listParams),
    query(`SELECT COUNT(*)::integer AS total_items FROM media_assets m ${countWhere}`, countParams),
  ])

  return { items: itemsResult.rows.map(mapMedia), totalItems: countResult.rows[0]?.total_items || 0 }
}

async function getMediaById(id) {
  const result = await query('SELECT * FROM media_assets WHERE id = $1 LIMIT 1', [id])
  return mapMedia(result.rows[0])
}

async function createMedia(data, userId) {
  try {
    const result = await query(
      `
        INSERT INTO media_assets (
          file_url, file_name, mime_type, alt_text, caption, credit, width, height,
          status, storage_provider, storage_key, file_size_bytes, checksum_sha256,
          created_by, updated_by, uploaded_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::media_status, $10::media_storage_provider,
          $11, $12, $13, $14::uuid, $14::uuid, $14::uuid
        )
        RETURNING *
      `,
      [
        data.fileUrl,
        data.fileName ?? null,
        data.mimeType ?? null,
        data.altText ?? null,
        data.caption ?? null,
        data.credit ?? null,
        data.width ?? null,
        data.height ?? null,
        data.status || 'active',
        data.storageProvider || 'external',
        data.storageKey ?? null,
        data.fileSizeBytes ?? null,
        data.checksumSha256 ?? null,
        userId,
      ],
    )
    return mapMedia(result.rows[0])
  } catch (error) {
    throw handleWriteError(error)
  }
}

async function updateMedia(id, data, userId) {
  const existing = await getMediaById(id)
  if (!existing) throw createNotFoundError('Media asset')
  try {
    const result = await query(
      `
        UPDATE media_assets
        SET
          file_url = COALESCE($2, file_url),
          file_name = COALESCE($3, file_name),
          mime_type = COALESCE($4, mime_type),
          alt_text = COALESCE($5, alt_text),
          caption = COALESCE($6, caption),
          credit = COALESCE($7, credit),
          width = COALESCE($8, width),
          height = COALESCE($9, height),
          status = COALESCE($10::media_status, status),
          storage_provider = COALESCE($11::media_storage_provider, storage_provider),
          storage_key = COALESCE($12, storage_key),
          file_size_bytes = COALESCE($13, file_size_bytes),
          checksum_sha256 = COALESCE($14, checksum_sha256),
          updated_by = $15::uuid
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        data.fileUrl ?? null,
        data.fileName ?? null,
        data.mimeType ?? null,
        data.altText ?? null,
        data.caption ?? null,
        data.credit ?? null,
        data.width ?? null,
        data.height ?? null,
        data.status ?? null,
        data.storageProvider ?? null,
        data.storageKey ?? null,
        data.fileSizeBytes ?? null,
        data.checksumSha256 ?? null,
        userId,
      ],
    )
    return { before: existing, after: mapMedia(result.rows[0]) }
  } catch (error) {
    throw handleWriteError(error)
  }
}

async function archiveMedia(id, userId) {
  return updateMedia(id, { status: 'archived' }, userId)
}

async function listInquiries(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.from || null, filters.to || null]
  const countParams = [filters.search || null, filters.status || null, filters.from || null, filters.to || null]
  const where = `
    WHERE ($3::text IS NULL OR i.full_name ILIKE '%' || $3 || '%' OR i.email ILIKE '%' || $3 || '%' OR i.subject ILIKE '%' || $3 || '%')
      AND ($4::inquiry_status IS NULL OR i.status = $4)
      AND ($5::timestamptz IS NULL OR i.created_at >= $5)
      AND ($6::timestamptz IS NULL OR i.created_at <= $6)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR i.full_name ILIKE '%' || $1 || '%' OR i.email ILIKE '%' || $1 || '%' OR i.subject ILIKE '%' || $1 || '%')
      AND ($2::inquiry_status IS NULL OR i.status = $2)
      AND ($3::timestamptz IS NULL OR i.created_at >= $3)
      AND ($4::timestamptz IS NULL OR i.created_at <= $4)
  `
  const orderBy = sortClause(filters.sort === 'name' ? 'fullName' : filters.sort === '-name' ? '-fullName' : filters.sort, '-createdAt', 'i')
  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT i.*, COUNT(ir.id)::integer AS response_count
        FROM tourism_inquiries i
        LEFT JOIN inquiry_responses ir ON ir.inquiry_id = i.id
        ${where}
        GROUP BY i.id
        ORDER BY ${orderBy}, i.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(`SELECT COUNT(*)::integer AS total_items FROM tourism_inquiries i ${countWhere}`, countParams),
  ])
  return { items: itemsResult.rows.map(mapInquiry), totalItems: countResult.rows[0]?.total_items || 0 }
}

async function getInquiryById(id) {
  const result = await query(
    `
      SELECT i.*, COUNT(ir.id)::integer AS response_count
      FROM tourism_inquiries i
      LEFT JOIN inquiry_responses ir ON ir.inquiry_id = i.id
      WHERE i.id = $1
      GROUP BY i.id
      LIMIT 1
    `,
    [id],
  )
  return mapInquiry(result.rows[0])
}

async function updateInquiryStatus(id, status) {
  const existing = await getInquiryById(id)
  if (!existing) throw createNotFoundError('Inquiry')
  const result = await query('UPDATE tourism_inquiries SET status = $2::inquiry_status WHERE id = $1 RETURNING *', [id, status])
  return { before: existing, after: mapInquiry(result.rows[0]) }
}

async function createInquiryResponse(id, data, userId) {
  const inquiry = await getInquiryById(id)
  if (!inquiry) throw createNotFoundError('Inquiry')
  const result = await query(
    `
      INSERT INTO inquiry_responses (inquiry_id, responder_user_id, response_message, status, sent_at)
      VALUES ($1, $2::uuid, $3, $4::inquiry_response_status, CASE WHEN $4::inquiry_response_status = 'sent' THEN now() ELSE NULL END)
      RETURNING *
    `,
    [id, userId, data.responseMessage, data.status || 'draft'],
  )
  if ((data.status || 'draft') === 'sent') {
    await query("UPDATE tourism_inquiries SET status = 'responded' WHERE id = $1", [id])
  }
  return mapInquiryResponse(result.rows[0])
}

async function listInquiryResponses(id) {
  const inquiry = await getInquiryById(id)
  if (!inquiry) throw createNotFoundError('Inquiry')
  const result = await query(
    `
      SELECT
        ir.*,
        u.id AS responder_id,
        u.email AS responder_email,
        u.display_name AS responder_display_name
      FROM inquiry_responses ir
      LEFT JOIN users u ON u.id = ir.responder_user_id
      WHERE ir.inquiry_id = $1
      ORDER BY ir.created_at DESC
    `,
    [id],
  )
  return result.rows.map(mapInquiryResponse)
}

function packageBookingSelect() {
  return `
    SELECT
      pbr.*,
      verified_user.email AS verified_by_email,
      verified_user.display_name AS verified_by_display_name,
      reviewed_user.email AS reviewed_by_email,
      reviewed_user.display_name AS reviewed_by_display_name
    FROM package_booking_requests pbr
    LEFT JOIN users verified_user ON verified_user.id = pbr.payment_verified_by
    LEFT JOIN users reviewed_user ON reviewed_user.id = pbr.booking_reviewed_by
  `
}

function packageBookingWhere(filters, startIndex = 1) {
  const params = []
  const where = []

  function add(value) {
    params.push(value)
    return `$${startIndex + params.length - 1}`
  }

  if (filters.search) {
    const ref = add(`%${filters.search}%`)
    where.push(`(
      pbr.id::text ILIKE ${ref}
      OR pbr.package_name_snapshot ILIKE ${ref}
      OR pbr.visitor_full_name ILIKE ${ref}
      OR pbr.visitor_email ILIKE ${ref}
      OR pbr.visitor_phone_number ILIKE ${ref}
    )`)
  }

  if (filters.bookingStatus) where.push(`pbr.booking_status = ${add(filters.bookingStatus)}`)
  if (filters.paymentStatus) where.push(`pbr.payment_status = ${add(filters.paymentStatus)}`)
  if (filters.from) where.push(`pbr.created_at >= ${add(filters.from)}::timestamptz`)
  if (filters.to) where.push(`pbr.created_at <= ${add(filters.to)}::timestamptz`)

  return {
    params,
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
  }
}

function packageBookingOrderBy(sort) {
  return {
    createdAt: 'pbr.created_at ASC',
    '-createdAt': 'pbr.created_at DESC',
    preferredDate: 'pbr.preferred_booking_date ASC',
    '-preferredDate': 'pbr.preferred_booking_date DESC',
    packageName: 'pbr.package_name_snapshot ASC',
    '-packageName': 'pbr.package_name_snapshot DESC',
  }[sort || '-createdAt'] || 'pbr.created_at DESC'
}

async function listPackageBookingRequests(filters, pagination) {
  const builtWhere = packageBookingWhere(filters, 3)
  const countWhere = packageBookingWhere(filters, 1)
  const orderBy = packageBookingOrderBy(filters.sort)

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        ${packageBookingSelect()}
        ${builtWhere.sql}
        ORDER BY ${orderBy}, pbr.id ASC
        LIMIT $1 OFFSET $2
      `,
      [pagination.limit, pagination.offset, ...builtWhere.params],
    ),
    query(
      `SELECT COUNT(*)::integer AS total_items FROM package_booking_requests pbr ${countWhere.sql}`,
      countWhere.params,
    ),
  ])

  return {
    items: itemsResult.rows.map(mapPackageBookingRequest),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

async function getPackageBookingRequestById(id) {
  const result = await query(
    `
      ${packageBookingSelect()}
      WHERE pbr.id = $1
      LIMIT 1
    `,
    [id],
  )

  return mapPackageBookingRequest(result.rows[0])
}

async function updatePackageBookingStatus(id, data, userId) {
  const existing = await getPackageBookingRequestById(id)
  if (!existing) throw createNotFoundError('Package booking request')

  const result = await query(
    `
      UPDATE package_booking_requests
      SET booking_status = $2::varchar,
          booking_decline_reason = CASE WHEN $2::varchar = 'declined' THEN $3 ELSE booking_decline_reason END,
          booking_review_notes = COALESCE($4, booking_review_notes),
          booking_reviewed_at = now(),
          booking_reviewed_by = $5::uuid
      WHERE id = $1
      RETURNING *
    `,
    [id, data.status, data.reason || null, data.notes || null, userId],
  )

  return { before: existing, after: await getPackageBookingRequestById(result.rows[0].id) }
}

async function verifyPackageBookingPayment(id, userId) {
  const existing = await getPackageBookingRequestById(id)
  if (!existing) throw createNotFoundError('Package booking request')
  if (existing.paymentStatus !== 'proof_submitted') {
    throw createValidationError('Payment proof can only be verified while status is proof_submitted.')
  }

  const result = await query(
    `
      UPDATE package_booking_requests
      SET payment_status = 'verified',
          payment_verified_at = now(),
          payment_verified_by = $2::uuid,
          payment_rejection_reason = NULL
      WHERE id = $1
      RETURNING *
    `,
    [id, userId],
  )

  return { before: existing, after: await getPackageBookingRequestById(result.rows[0].id) }
}

async function rejectPackageBookingPayment(id, data) {
  const existing = await getPackageBookingRequestById(id)
  if (!existing) throw createNotFoundError('Package booking request')
  if (existing.paymentStatus !== 'proof_submitted') {
    throw createValidationError('Payment proof can only be rejected while status is proof_submitted.')
  }

  const result = await query(
    `
      UPDATE package_booking_requests
      SET payment_status = 'rejected',
          payment_rejection_reason = $2,
          payment_notes = COALESCE($3, payment_notes),
          payment_verified_at = NULL,
          payment_verified_by = NULL
      WHERE id = $1
      RETURNING *
    `,
    [id, data.reason, data.notes || null],
  )

  return { before: existing, after: await getPackageBookingRequestById(result.rows[0].id) }
}

async function updatePackageBookingNotes(id, data) {
  const existing = await getPackageBookingRequestById(id)
  if (!existing) throw createNotFoundError('Package booking request')

  const result = await query(
    `
      UPDATE package_booking_requests
      SET payment_notes = $2,
          booking_review_notes = $3
      WHERE id = $1
      RETURNING *
    `,
    [id, data.paymentNotes ?? null, data.bookingReviewNotes ?? null],
  )

  return { before: existing, after: await getPackageBookingRequestById(result.rows[0].id) }
}

async function listNewsletterSubscribers(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null]
  const countParams = [filters.search || null, filters.status || null]
  const where = `
    WHERE ($3::text IS NULL OR ns.email ILIKE '%' || $3 || '%' OR ns.full_name ILIKE '%' || $3 || '%')
      AND ($4::subscription_status IS NULL OR ns.status = $4)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR ns.email ILIKE '%' || $1 || '%' OR ns.full_name ILIKE '%' || $1 || '%')
      AND ($2::subscription_status IS NULL OR ns.status = $2)
  `
  const orderBy = sortClause(filters.sort === 'name' ? 'fullName' : filters.sort === '-name' ? '-fullName' : filters.sort, '-createdAt', 'ns')
  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT ns.* FROM newsletter_subscribers ns ${where} ORDER BY ${orderBy}, ns.id ASC LIMIT $1 OFFSET $2`, listParams),
    query(`SELECT COUNT(*)::integer AS total_items FROM newsletter_subscribers ns ${countWhere}`, countParams),
  ])
  return { items: itemsResult.rows.map(mapNewsletterSubscriber), totalItems: countResult.rows[0]?.total_items || 0 }
}

async function getNewsletterSubscriberById(id) {
  const result = await query('SELECT * FROM newsletter_subscribers WHERE id = $1 LIMIT 1', [id])
  return mapNewsletterSubscriber(result.rows[0])
}

async function updateNewsletterStatus(id, status) {
  const existing = await getNewsletterSubscriberById(id)
  if (!existing) throw createNotFoundError('Newsletter subscriber')
  const result = await query(
    `
      UPDATE newsletter_subscribers
      SET
        status = $2::subscription_status,
        unsubscribed_at = CASE WHEN $2::subscription_status = 'unsubscribed' THEN now() ELSE unsubscribed_at END
      WHERE id = $1
      RETURNING *
    `,
    [id, status],
  )
  return { before: existing, after: mapNewsletterSubscriber(result.rows[0]) }
}

async function getRolesForUser(userId) {
  const result = await query(
    `
      SELECT r.id, r.role_key, r.name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.role_key
    `,
    [userId],
  )
  return result.rows.map((row) => ({
    id: row.id,
    roleKey: row.role_key,
    name: row.name,
  }))
}

async function listUsers(filters, pagination) {
  const listParams = [pagination.limit, pagination.offset, filters.search || null, filters.status || null, filters.role || null]
  const countParams = [filters.search || null, filters.status || null, filters.role || null]
  const where = `
    WHERE ($3::text IS NULL OR u.email ILIKE '%' || $3 || '%' OR u.display_name ILIKE '%' || $3 || '%')
      AND ($4::user_status IS NULL OR u.status = $4)
      AND ($5::text IS NULL OR EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r2 ON r2.id = ur2.role_id
        WHERE ur2.user_id = u.id AND r2.role_key = $5
      ))
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR u.email ILIKE '%' || $1 || '%' OR u.display_name ILIKE '%' || $1 || '%')
      AND ($2::user_status IS NULL OR u.status = $2)
      AND ($3::text IS NULL OR EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r2 ON r2.id = ur2.role_id
        WHERE ur2.user_id = u.id AND r2.role_key = $3
      ))
  `
  const orderBy = sortClause(filters.sort === 'name' ? 'displayName' : filters.sort === '-name' ? '-displayName' : filters.sort, '-createdAt', 'u')
  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT u.id, u.email, u.display_name, u.status, u.last_login_at, u.locked_until, u.password_changed_at, u.created_at, u.updated_at FROM users u ${where} ORDER BY ${orderBy}, u.id ASC LIMIT $1 OFFSET $2`, listParams),
    query(`SELECT COUNT(*)::integer AS total_items FROM users u ${countWhere}`, countParams),
  ])
  const items = []
  for (const row of itemsResult.rows) {
    items.push(mapUser(row, await getRolesForUser(row.id)))
  }
  return { items, totalItems: countResult.rows[0]?.total_items || 0 }
}

async function getUserById(id) {
  const result = await query(
    'SELECT id, email, display_name, status, last_login_at, locked_until, password_changed_at, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
    [id],
  )
  if (!result.rows[0]) return null
  return mapUser(result.rows[0], await getRolesForUser(id))
}

async function updateUserStatus(id, status) {
  const existing = await getUserById(id)
  if (!existing) throw createNotFoundError('User')
  const result = await query(
    'UPDATE users SET status = $2::user_status WHERE id = $1 RETURNING id, email, display_name, status, last_login_at, locked_until, password_changed_at, created_at, updated_at',
    [id, status],
  )
  return { before: existing, after: mapUser(result.rows[0], await getRolesForUser(id)) }
}

async function listRoles() {
  const result = await query('SELECT * FROM roles ORDER BY role_key')
  return result.rows.map(mapRole)
}

async function listPermissions() {
  const result = await query('SELECT * FROM permissions ORDER BY permission_key')
  return result.rows.map(mapPermission)
}

async function replaceUserRoles(userId, roleIds, actorUserId) {
  const existing = await getUserById(userId)
  if (!existing) throw createNotFoundError('User')
  if (roleIds.length > 0) {
    const found = await query('SELECT id FROM roles WHERE id = ANY($1::uuid[])', [roleIds])
    if (found.rowCount !== roleIds.length) throw createValidationError('One or more roles do not exist.')
  }
  await query('DELETE FROM user_roles WHERE user_id = $1', [userId])
  for (const roleId of roleIds) {
    await query(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3::uuid) ON CONFLICT (user_id, role_id) DO NOTHING',
      [userId, roleId, actorUserId],
    )
  }
  return { before: existing, after: await getUserById(userId) }
}

async function listAuditLogs(filters, pagination) {
  const listParams = [
    pagination.limit,
    pagination.offset,
    filters.action || null,
    filters.entityType || null,
    filters.actorUserId || null,
    filters.from || null,
    filters.to || null,
  ]
  const countParams = [filters.action || null, filters.entityType || null, filters.actorUserId || null, filters.from || null, filters.to || null]
  const where = `
    WHERE ($3::audit_action_type IS NULL OR al.action = $3)
      AND ($4::cms_entity_type IS NULL OR al.entity_type = $4)
      AND ($5::uuid IS NULL OR al.actor_user_id = $5)
      AND ($6::timestamptz IS NULL OR al.created_at >= $6)
      AND ($7::timestamptz IS NULL OR al.created_at <= $7)
  `
  const countWhere = `
    WHERE ($1::audit_action_type IS NULL OR al.action = $1)
      AND ($2::cms_entity_type IS NULL OR al.entity_type = $2)
      AND ($3::uuid IS NULL OR al.actor_user_id = $3)
      AND ($4::timestamptz IS NULL OR al.created_at >= $4)
      AND ($5::timestamptz IS NULL OR al.created_at <= $5)
  `
  const orderBy = sortClause(filters.sort, '-createdAt', 'al')
  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT al.id, al.action::text AS action, al.entity_type::text AS entity_type, al.entity_id, al.entity_label,
          al.request_id, al.created_at, u.id AS actor_id, u.email AS actor_email, u.display_name AS actor_display_name
        FROM content_audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        ${where}
        ORDER BY ${orderBy}, al.id ASC
        LIMIT $1 OFFSET $2
      `,
      listParams,
    ),
    query(`SELECT COUNT(*)::integer AS total_items FROM content_audit_logs al ${countWhere}`, countParams),
  ])
  return { items: itemsResult.rows.map((row) => mapAuditLog(row)), totalItems: countResult.rows[0]?.total_items || 0 }
}

async function getAuditLogById(id) {
  const result = await query(
    `
      SELECT al.id, al.action::text AS action, al.entity_type::text AS entity_type, al.entity_id, al.entity_label,
        al.before_values, al.after_values, al.ip_address::text, al.user_agent, al.request_id, al.created_at,
        u.id AS actor_id, u.email AS actor_email, u.display_name AS actor_display_name
      FROM content_audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      WHERE al.id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapAuditLog(result.rows[0], true)
}

module.exports = {
  archiveMedia,
  createInquiryResponse,
  createMedia,
  getAuditLogById,
  getInquiryById,
  getMediaById,
  getPackageBookingRequestById,
  getUserById,
  listAuditLogs,
  listInquiries,
  listInquiryResponses,
  listMedia,
  listNewsletterSubscribers,
  listPackageBookingRequests,
  listPermissions,
  listRoles,
  listUsers,
  rejectPackageBookingPayment,
  replaceUserRoles,
  updateInquiryStatus,
  updateMedia,
  updateNewsletterStatus,
  updatePackageBookingNotes,
  updatePackageBookingStatus,
  updateUserStatus,
  verifyPackageBookingPayment,
}
