const { pool, query } = require('../../config/db')
const { PUBLIC_PACKAGE_STATUSES } = require('../productDevelopment/constants')

const REVIEW_TARGET_COLUMNS = new Set([
  'product_id',
  'destination_id',
  'tourism_asset_id',
  'business_profile_id',
  'business_id',
])

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

function reviewTargetColumn(target) {
  if (!REVIEW_TARGET_COLUMNS.has(target?.targetColumn)) {
    throw new Error('Unsupported review target column.')
  }
  return target.targetColumn
}

function mapPublicReview(row) {
  return {
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment || '',
    author: row.author || 'Anonymous Tourist',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toDateOnly(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

function mapAccreditedBusiness(row) {
  return {
    id: row.id,
    source: row.source,
    businessId: row.business_id,
    slug: row.business_slug,
    name: row.business_name,
    businessType: row.business_type,
    ownerName: row.owner_name,
    description: row.description,
    addressLine: row.address_line,
    barangay: row.barangay,
    municipality: row.municipality,
    province: row.province,
    region: row.region,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    contactEmail: row.contact_email,
    phone: row.phone,
    legalStructure: row.legal_structure,
    partners: Array.isArray(row.partners) ? row.partners : [],
    authorizedRepresentativeName: row.authorized_representative_name,
    authorizedRepresentativePosition: row.authorized_representative_position,
    primaryImage: row.primary_image_url
      ? {
          url: row.primary_image_url,
          altText: `${row.business_name} photo`,
        }
      : null,
    images: row.gallery_images || [],
    socialLinks: {
      facebook: row.facebook_url,
      instagram: row.instagram_url,
      tiktok: row.tiktok_url,
      twitter: row.twitter_url,
      website: row.website_url,
    },
    accreditation: {
      status: row.accreditation_status,
      accreditationNumber: row.accreditation_number,
      issuedAt: row.accreditation_issued_at,
      expiresAt: row.accreditation_expires_at,
    },
    ratingAverage: toNumber(row.rating_average) || 0,
    reviewCount: Number(row.review_count || 0),
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

function slugify(value) {
  return String(value || 'tourism-package')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function packageSlug(row) {
  return row?.id ? `package-${slugify(row.name)}-${row.id}` : null
}

function packageCategoryImage(category) {
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

  return images[packageCategoryImageKey(category)] || images.Nature
}

function packageCategoryImageKey(category) {
  const value = String(category || '').toLowerCase()
  if (value.includes('food')) return 'Food'
  if (value.includes('event')) return 'Events'
  if (value.includes('cultural')) return 'Cultural'
  return 'Nature'
}

function mapPackage(row) {
  return {
    id: row.id,
    slug: packageSlug(row),
    name: row.name,
    description: row.description,
    category: {
      slug: slugify(row.category),
      name: row.category,
    },
    targetMarket: row.target_market,
    estimatedDuration: row.estimated_duration,
    durationDays: row.duration_days == null ? null : Number(row.duration_days),
    departureCapacity: row.departure_capacity == null ? null : Number(row.departure_capacity),
    basePrice: toNumber(row.base_price),
    basePax: row.base_pax == null ? null : Number(row.base_pax),
    extraPaxPrice: toNumber(row.extra_pax_price),
    minPax: row.min_pax == null ? null : Number(row.min_pax),
    maxPax: row.max_pax == null ? null : Number(row.max_pax),
    paymentRequired: toBoolean(row.payment_required),
    packageStatus: row.package_status,
    remarks: row.remarks || '',
    items: row.items || [],
    primaryImage: {
      url: row.image_url || packageCategoryImage(row.category),
      altText: `${row.name} package image`,
    },
    itemCount: Number(row.item_count || 0),
    planCount: Number(row.plan_count || 0),
    assetCount: Number(row.asset_count || 0),
    activityCount: Number(row.activity_count || 0),
    isFeatured: row.package_status === 'Ready for Promotion',
    updatedAt: row.updated_at,
  }
}

function mapPackageItem(row) {
  return {
    id: row.id,
    itemType: row.item_type,
    referenceId: row.item_reference_id,
    name: row.item_name,
    description: row.item_description,
    proposedActivities: row.item_proposed_activities || '',
    location: row.item_location,
    status: row.item_status,
    assetStatus: row.asset_status,
    imageUrl: row.item_image_url,
  }
}

function mapPackageBookingRequest(row) {
  return {
    id: row.id,
    bookingReference: row.booking_reference || null,
    packageId: row.package_id,
    packageName: row.package_name_snapshot,
    bookingSource: row.booking_source || 'online',
    paymentMode: row.payment_mode || (row.selected_payment_method === 'cash' ? 'pay_at_office' : 'online'),
    selectedPax: Number(row.selected_pax),
    basePrice: toNumber(row.base_price_snapshot),
    basePax: row.base_pax_snapshot == null ? null : Number(row.base_pax_snapshot),
    extraPaxPrice: toNumber(row.extra_pax_price_snapshot),
    totalAmount: toNumber(row.computed_total_amount),
    visitor: {
      fullName: row.visitor_full_name,
      email: row.visitor_email,
      phoneNumber: row.visitor_phone_number,
    },
    representative: {
      fullName: row.representative_full_name || row.visitor_full_name,
      email: row.representative_email || row.visitor_email,
      phoneNumber: row.representative_phone_number || row.visitor_phone_number,
      gender: row.representative_gender || null,
    },
    participants: Array.isArray(row.participants) ? row.participants : [],
    preferredBookingDate: toDateOnly(row.preferred_booking_date),
    startDate: toDateOnly(row.start_date || row.preferred_booking_date),
    endDate: toDateOnly(row.end_date || row.preferred_booking_date),
    durationDays: row.duration_days_snapshot == null ? 1 : Number(row.duration_days_snapshot),
    message: row.message || '',
    paymentRequired: toBoolean(row.payment_required_snapshot),
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    paymentPlan: row.payment_plan || null,
    initialPaymentAmount: toNumber(row.initial_payment_amount),
    verifiedPaymentAmount: toNumber(row.verified_payment_amount) || 0,
    pendingPaymentAmount: toNumber(row.pending_payment_amount) || 0,
    appliedCreditAmount: toNumber(row.applied_credit_amount) || 0,
    depositDueAt: row.deposit_due_at || null,
    balanceDueAt: row.balance_due_at || null,
    depositStatus: row.deposit_status || null,
    paymentMethod: row.selected_payment_method || null,
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
    paymentSubmittedAt: row.payment_submitted_at,
    paymentVerifiedAt: row.payment_verified_at,
    paymentVerifiedBy: row.payment_verified_by,
    paymentRejectionReason: row.payment_rejection_reason,
    paymentNotes: row.payment_notes,
    pricingNote: row.pricing_note,
    touristAccountId: row.tourist_account_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEvent(row) {
  const primaryCategory = mapCategory(row)
  const categories = Array.isArray(row.categories) && row.categories.length
    ? row.categories
    : primaryCategory
      ? [primaryCategory]
      : []
  const relatedAssets = Array.isArray(row.related_assets) && row.related_assets.length
    ? row.related_assets
    : row.related_asset_name
      ? [
          {
            id: row.related_asset_id,
            name: row.related_asset_name,
            location: row.related_asset_location,
            category: row.related_asset_category,
          },
        ]
      : []
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    category: primaryCategory,
    categories,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venueName: row.venue_name,
    relatedAsset: row.related_asset_name
      ? {
          id: row.related_asset_id,
          name: row.related_asset_name,
          location: row.related_asset_location,
          category: row.related_asset_category,
      }
      : null,
    relatedAssets,
    primaryImage: imageFromRow(row),
    isFeatured: toBoolean(row.is_featured),
    isRecurring: toBoolean(row.is_recurring),
    recurrenceType: row.recurrence_type,
    usualMonth: row.usual_month,
    nextOccurrenceDate: row.next_occurrence_date,
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

function tourismAssetSlug(row) {
  return row?.id ? `asset-${slugify(row.name)}-${row.id}` : null
}

function mapTourismAsset(row) {
  return {
    id: row.id,
    slug: tourismAssetSlug(row),
    name: row.name,
    shortDescription: row.remarks || row.description,
    description: row.description,
    category: {
      slug: slugify(row.category),
      name: row.category,
      color: undefined,
    },
    barangay: row.location,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    sourceBusinessName: row.source_business_name || '',
    sourceBusinessType: row.source_business_type || '',
    sourceAccreditationRecordNumber: row.source_accreditation_record_number || '',
    targetMarket: row.target_market,
    remarks: row.remarks || '',
    developmentStatus: row.development_status,
    primaryImage: {
      url: row.image_url,
      altText: `${row.name} tourism asset photo`,
    },
    isFeatured: true,
    sourceModule: 'product-development',
    updatedAt: row.updated_at,
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
      b.owner_name AS business_owner_name,
      b.address_line AS business_address_line,
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
      ownerName: row.business_owner_name,
      addressLine: row.business_address_line,
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

function packageSelect() {
  return `
    SELECT
      tp.*,
      COALESCE(first_asset.image_url, category_asset.image_url) AS image_url,
      COALESCE(package_item_refs.items, '[]'::jsonb) AS items,
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
    LEFT JOIN LATERAL (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', item.id,
            'itemType', item.item_type,
            'referenceId', item.item_reference_id,
            'assetId', COALESCE(direct_asset.id, plan_asset.id, activity_asset.id)
          )
          ORDER BY item.sort_order ASC, item.created_at ASC
        ),
        '[]'::jsonb
      ) AS items
      FROM package_items item
      LEFT JOIN tourism_assets direct_asset
        ON item.item_type = 'Asset'
       AND direct_asset.id = item.item_reference_id
      LEFT JOIN development_plans dp
        ON item.item_type = 'Plan'
       AND dp.id = item.item_reference_id
      LEFT JOIN tourism_assets plan_asset
        ON plan_asset.id = dp.asset_id
      LEFT JOIN tourism_activities activity
        ON item.item_type = 'Activity'
       AND activity.id = item.item_reference_id
      LEFT JOIN tourism_assets activity_asset
        ON activity_asset.id = activity.asset_id
      WHERE item.package_id = tp.id
    ) package_item_refs ON true
  `
}

function publicPackageWhere() {
  return ['tp.package_status = ANY($1::text[])']
}

async function listPackages(filters, pagination) {
  const params = [[...PUBLIC_PACKAGE_STATUSES]]
  const where = publicPackageWhere()

  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(tp.name ILIKE ${ref} OR tp.description ILIKE ${ref} OR tp.target_market ILIKE ${ref})`)
  }
  if (filters.category) where.push(`tp.category ILIKE ${addParam(params, `%${filters.category}%`)}`)
  if (filters.targetMarket) where.push(`tp.target_market ILIKE ${addParam(params, `%${filters.targetMarket}%`)}`)

  const orderBy =
    {
      name: 'tp.name ASC',
      '-name': 'tp.name DESC',
      updatedAt: 'tp.updated_at ASC',
      '-updatedAt': 'tp.updated_at DESC',
    }[filters.sort] || 'tp.updated_at DESC'

  const whereSql = where.join(' AND ')
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM tourism_packages tp WHERE ${whereSql}`,
    params,
  )
  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(
    `
      ${packageSelect()}
      WHERE ${whereSql}
      GROUP BY tp.id, first_asset.image_url, category_asset.image_url, package_item_refs.items
      ORDER BY ${orderBy}, tp.name ASC
      LIMIT ${limitRef} OFFSET ${offsetRef}
    `,
    params,
  )

  return {
    items: rowsResult.rows.map(mapPackage),
    totalItems: countResult.rows[0].total,
  }
}

async function getPackageBySlug(slug) {
  const listResult = await listPackages({}, { limit: 200, offset: 0 })
  const summary = listResult.items.find((item) => item.slug === slug || item.id === slug)
  if (!summary) return null

  const detailResult = await query(
    `
      ${packageSelect()}
      WHERE tp.id = $1
      GROUP BY tp.id, first_asset.image_url, category_asset.image_url, package_item_refs.items
      LIMIT 1
    `,
    [summary.id],
  )
  const row = detailResult.rows[0]
  if (!row) return null

  const itemsResult = await query(
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
          WHEN pi.item_type = 'Plan' THEN dp.proposed_activities
          ELSE NULL
        END AS item_proposed_activities,
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
      ORDER BY pi.sort_order ASC
    `,
    [summary.id],
  )
  const galleryResult = await query(
    `
      SELECT DISTINCT ON (tai.id)
        tai.id,
        tai.image_url AS url,
        COALESCE(tai.original_name, asset.name || ' image') AS "altText",
        pi.sort_order AS item_order,
        tai.display_order AS image_order,
        asset.name AS "sourceName"
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
    [summary.id],
  )

  return {
    ...mapPackage(row),
    items: itemsResult.rows.map(mapPackageItem),
    gallery: galleryResult.rows
      .sort((left, right) => left.item_order - right.item_order || left.image_order - right.image_order)
      .map(({ item_order, image_order, ...image }) => image),
  }
}

async function getPackageForBooking(packageId) {
  const result = await query(
    `
      SELECT
        id,
        name,
        base_price,
        base_pax,
        extra_pax_price,
        min_pax,
        max_pax,
        duration_days,
        departure_capacity,
        payment_required,
        package_status
      FROM tourism_packages
      WHERE id = $1
        AND package_status = ANY($2::text[])
      LIMIT 1
    `,
    [packageId, [...PUBLIC_PACKAGE_STATUSES]],
  )

  return result.rows[0] || null
}

async function createPackageBookingRequest(data) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const capacityResult = await client.query(
      `
        SELECT COALESCE(inventory.capacity_pax, tp.departure_capacity, tp.max_pax) AS capacity_pax
        FROM tourism_packages tp
        LEFT JOIN package_departure_inventory inventory
          ON inventory.package_id = tp.id
         AND inventory.start_date = $2::date
        WHERE tp.id = $1
        FOR UPDATE OF tp
      `,
      [data.packageId, data.startDate],
    )
    const capacity = capacityResult.rows[0]?.capacity_pax == null
      ? null
      : Number(capacityResult.rows[0].capacity_pax)
    if (capacity !== null) {
      const reservedResult = await client.query(
        `
          SELECT COALESCE(SUM(selected_pax), 0)::integer AS reserved_pax
          FROM package_booking_requests
          WHERE package_id = $1
            AND start_date = $2::date
            AND booking_status IN ('pending', 'reviewed', 'approved', 'rescheduled')
        `,
        [data.packageId, data.startDate],
      )
      const reserved = Number(reservedResult.rows[0]?.reserved_pax || 0)
      if (reserved + data.selectedPax > capacity) {
        const error = new Error('The selected departure does not have enough available slots.')
        error.statusCode = 409
        error.code = 'PACKAGE_CAPACITY_EXCEEDED'
        error.publicMessage = error.message
        throw error
      }
    }

    const result = await client.query(
      `
        INSERT INTO package_booking_requests (
          package_id,
          package_name_snapshot,
          selected_pax,
          base_price_snapshot,
          base_pax_snapshot,
          extra_pax_price_snapshot,
          computed_total_amount,
          visitor_full_name,
          visitor_email,
          visitor_phone_number,
          representative_full_name,
          representative_email,
          representative_phone_number,
          representative_gender,
          other_participant_names,
          preferred_booking_date,
          start_date,
          end_date,
          duration_days_snapshot,
          booking_source,
          payment_mode,
          message,
          payment_required_snapshot,
          payment_instruction_snapshot,
          payment_plan,
          initial_payment_amount,
          balance_due_at,
          deposit_due_at,
          deposit_status,
          selected_payment_method,
          booking_status,
          payment_status,
          pricing_note,
          tourist_account_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, lower($9), $10, $11, lower($12), $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        )
        RETURNING *
      `,
      [
        data.packageId,
        data.packageNameSnapshot,
        data.selectedPax,
        data.basePriceSnapshot,
        data.basePaxSnapshot,
        data.extraPaxPriceSnapshot,
        data.computedTotalAmount,
        data.visitorFullName,
        data.visitorEmail,
        data.visitorPhoneNumber,
        data.representativeFullName,
        data.representativeEmail,
        data.representativePhoneNumber,
        data.representativeGender || null,
        (data.participants || []).map((participant) => participant.fullName).join('\n') || null,
        data.preferredBookingDate,
        data.startDate,
        data.endDate,
        data.durationDays,
        data.bookingSource,
        data.paymentMode,
        data.message,
        data.paymentRequiredSnapshot,
        data.paymentInstructionSnapshot,
        data.paymentPlan,
        data.initialPaymentAmount,
        data.balanceDueAt,
        data.depositDueAt,
        data.depositStatus,
        data.paymentMethod,
        data.bookingStatus,
        data.paymentStatus,
        data.pricingNote,
        data.touristAccountId || null,
      ],
    )

    const booking = result.rows[0]
    const participants = []

    for (const participant of data.participants || []) {
      const participantResult = await client.query(
        `
          INSERT INTO package_booking_request_participants (
            package_booking_request_id,
            participant_order,
            full_name,
            age,
            gender,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, participant_order, full_name, age, gender, notes
        `,
        [
          booking.id,
          participant.participantOrder,
          participant.fullName,
          participant.age,
          participant.gender,
          participant.notes || '',
        ],
      )
      const inserted = participantResult.rows[0]
      participants.push({
        id: inserted.id,
        participantOrder: inserted.participant_order,
        fullName: inserted.full_name,
        age: inserted.age == null ? null : Number(inserted.age),
        gender: inserted.gender,
        notes: inserted.notes || '',
      })
    }

    await client.query('COMMIT')
    return mapPackageBookingRequest({ ...booking, participants })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function getPackageBookingRequestById(requestId) {
  const result = await query(
    `${packageBookingWithPaymentTotalsSelect()} WHERE pbr.id = $1 LIMIT 1`,
    [requestId],
  )

  return result.rows[0] || null
}

async function findPackageBookingRequestForPublicLookup({ requestId, email, phoneNumber }) {
  const result = await query(
    `
      ${packageBookingWithPaymentTotalsSelect()}
      WHERE (pbr.id::text = $1 OR upper(pbr.booking_reference) = upper($1))
        AND (
          ($2::text IS NOT NULL AND pbr.visitor_email = lower($2))
          OR (
            $3::text IS NOT NULL
            AND regexp_replace(pbr.visitor_phone_number, '\\D', '', 'g') = $3
          )
        )
      LIMIT 1
    `,
    [requestId, email || null, phoneNumber || null],
  )

  return result.rows[0] ? mapPackageBookingRequest(result.rows[0]) : null
}

async function listPackageBookingRequestsByTouristId(touristAccountId) {
  const result = await query(
    `
      ${packageBookingWithPaymentTotalsSelect()}
      WHERE pbr.tourist_account_id = $1
      ORDER BY pbr.created_at DESC, pbr.preferred_booking_date DESC
    `,
    [touristAccountId],
  )

  return result.rows.map(mapPackageBookingRequest)
}

async function getPackageBookingRequestByTouristId({ requestId, touristAccountId }) {
  const result = await query(
    `
      ${packageBookingWithPaymentTotalsSelect()}
      WHERE pbr.id = $1
        AND pbr.tourist_account_id = $2
      LIMIT 1
    `,
    [requestId, touristAccountId],
  )

  return result.rows[0] ? mapPackageBookingRequest(result.rows[0]) : null
}

async function updatePackageBookingPaymentProof(requestId, data) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const bookingResult = await client.query(
      'SELECT computed_total_amount FROM package_booking_requests WHERE id = $1 FOR UPDATE',
      [requestId],
    )
    const totalAmount = Number(bookingResult.rows[0]?.computed_total_amount || 0)
    const allocatedResult = await client.query(
      `
        SELECT (
          COALESCE((SELECT SUM(amount) FROM package_booking_payments
                    WHERE package_booking_request_id = $1
                      AND payment_status IN ('pending_verification', 'verified')), 0)
          + COALESCE((SELECT SUM(amount - refundable_excess) FROM package_booking_credit_transfers
                      WHERE to_booking_request_id = $1 AND status = 'applied'), 0)
        )::numeric AS allocated_amount
      `,
      [requestId],
    )
    const allocatedAmount = Number(allocatedResult.rows[0]?.allocated_amount || 0)
    if (data.amount > Math.max(0, totalAmount - allocatedAmount)) {
      const error = new Error('Payment amount exceeds the remaining booking balance.')
      error.statusCode = 400
      error.code = 'VALIDATION_ERROR'
      error.publicMessage = error.message
      throw error
    }
    if (data.paymentReferenceNumber) {
      const duplicate = await client.query(
        `
          SELECT id
          FROM package_booking_payments
          WHERE lower(transaction_reference) = lower($1)
            AND payment_status NOT IN ('rejected', 'voided')
          LIMIT 1
        `,
        [data.paymentReferenceNumber],
      )
      if (duplicate.rows[0]) {
        const error = new Error('This payment reference has already been submitted.')
        error.statusCode = 409
        error.code = 'DUPLICATE_PAYMENT_REFERENCE'
        error.publicMessage = error.message
        throw error
      }
    }

    await client.query(
      `
        INSERT INTO package_booking_payments (
          package_booking_request_id, amount, payment_method, payment_status,
          transaction_reference, proof_file_url, proof_original_filename,
          proof_mime_type, proof_file_size, notes
        )
        VALUES ($1, $2, $3, 'pending_verification', $4, $5, $6, $7, $8, $9)
      `,
      [
        requestId,
        data.amount,
        data.paymentMethod,
        data.paymentReferenceNumber,
        data.fileUrl,
        data.originalFilename,
        data.mimeType,
        data.fileSize,
        data.paymentNotes || '',
      ],
    )

    const result = await client.query(
      `
        UPDATE package_booking_requests
        SET payment_reference_number = $2,
            proof_file_url = $3,
            proof_original_filename = $4,
            proof_mime_type = $5,
            proof_file_size = $6,
            proof_uploaded_at = now(),
            payment_submitted_at = now(),
            payment_status = 'proof_submitted',
            deposit_status = 'proof_submitted',
            selected_payment_method = $7,
            payment_rejection_reason = NULL,
            payment_notes = COALESCE($8, payment_notes)
        WHERE id = $1
        RETURNING *
      `,
      [
        requestId,
        data.paymentReferenceNumber,
        data.fileUrl,
        data.originalFilename,
        data.mimeType,
        data.fileSize,
        data.paymentMethod,
        data.paymentNotes || null,
      ],
    )

    await client.query('COMMIT')
    return result.rows[0] ? mapPackageBookingRequest(result.rows[0]) : null
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') {
      const conflict = new Error('This payment reference has already been submitted.')
      conflict.statusCode = 409
      conflict.code = 'DUPLICATE_PAYMENT_REFERENCE'
      conflict.publicMessage = conflict.message
      throw conflict
    }
    throw error
  } finally {
    client.release()
  }
}

function packageBookingWithPaymentTotalsSelect() {
  return `
    SELECT pbr.*,
      COALESCE((SELECT SUM(payment.amount) FROM package_booking_payments payment
                WHERE payment.package_booking_request_id = pbr.id
                  AND payment.payment_status = 'verified'), 0)::numeric AS verified_payment_amount,
      COALESCE((SELECT SUM(payment.amount) FROM package_booking_payments payment
                WHERE payment.package_booking_request_id = pbr.id
                  AND payment.payment_status = 'pending_verification'), 0)::numeric AS pending_payment_amount,
      COALESCE((SELECT SUM(credit.amount - credit.refundable_excess)
                FROM package_booking_credit_transfers credit
                WHERE credit.to_booking_request_id = pbr.id AND credit.status = 'applied'), 0)::numeric AS applied_credit_amount
    FROM package_booking_requests pbr
  `
}

async function createPackageBookingDateChangeRequest(data) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const booking = await client.query(
      `
        SELECT id
        FROM package_booking_requests
        WHERE id = $1 AND tourist_account_id = $2
        FOR UPDATE
      `,
      [data.requestId, data.touristAccountId],
    )
    if (!booking.rows[0]) return null

    const result = await client.query(
      `
        INSERT INTO package_booking_date_change_requests (
          package_booking_request_id,
          requested_by_tourist_account_id,
          requested_start_date,
          requested_end_date,
          requested_duration_days,
          reason
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        data.requestId,
        data.touristAccountId,
        data.startDate,
        data.endDate,
        data.durationDays,
        data.reason,
      ],
    )
    await client.query(
      `
        INSERT INTO package_booking_events (
          package_booking_request_id, event_type, actor_tourist_account_id, after_values, reason
        )
        VALUES ($1, 'date_change_requested', $2, $3::jsonb, $4)
      `,
      [
        data.requestId,
        data.touristAccountId,
        JSON.stringify({ startDate: data.startDate, endDate: data.endDate, durationDays: data.durationDays }),
        data.reason,
      ],
    )
    await client.query('COMMIT')
    const row = result.rows[0]
    return {
      id: row.id,
      bookingRequestId: row.package_booking_request_id,
      startDate: toDateOnly(row.requested_start_date),
      endDate: toDateOnly(row.requested_end_date),
      durationDays: Number(row.requested_duration_days),
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') {
      const conflict = new Error('A date-change request is already pending for this booking.')
      conflict.statusCode = 409
      conflict.code = 'DATE_CHANGE_ALREADY_PENDING'
      conflict.publicMessage = conflict.message
      throw conflict
    }
    throw error
  } finally {
    client.release()
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
      COALESCE(e.venue_name, ta.name) AS venue_name,
      e.organizer_name,
      e.contact_info,
      e.address_line,
      e.barangay,
      e.starts_at,
      e.ends_at,
      e.is_featured,
      e.is_recurring,
      e.recurrence_type,
      e.usual_month,
      e.next_occurrence_date,
      e.related_asset_id,
      ta.name AS related_asset_name,
      ta.location AS related_asset_location,
      ta.category AS related_asset_category,
      asset_links.related_assets,
      ec.id AS category_id,
      ec.slug AS category_slug,
      ec.name AS category_name,
      ec.display_order AS category_display_order,
      category_links.categories,
      img.image_url AS primary_image_url,
      img.alt_text AS primary_image_alt_text
    FROM events e
    JOIN event_categories ec ON ec.id = e.category_id AND ec.status = 'published'
    LEFT JOIN LATERAL (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', linked_ec.id,
            'slug', linked_ec.slug,
            'name', linked_ec.name
          )
          ORDER BY ecl.display_order ASC, linked_ec.name ASC
        ),
        '[]'::json
      ) AS categories
      FROM event_category_links ecl
      JOIN event_categories linked_ec ON linked_ec.id = ecl.category_id AND linked_ec.status = 'published'
      WHERE ecl.event_id = e.id
    ) category_links ON true
    LEFT JOIN tourism_assets ta ON ta.id = e.related_asset_id AND ta.development_status != 'Archived'
    LEFT JOIN LATERAL (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', linked_asset.id,
            'name', linked_asset.name,
            'location', linked_asset.location,
            'category', linked_asset.category
          )
          ORDER BY eal.display_order ASC, linked_asset.name ASC
        ),
        '[]'::json
      ) AS related_assets
      FROM event_asset_links eal
      JOIN tourism_assets linked_asset ON linked_asset.id = eal.asset_id AND linked_asset.development_status != 'Archived'
      WHERE eal.event_id = e.id
    ) asset_links ON true
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
  if (filters.category) {
    const ref = addParam(params, filters.category)
    where.push(`(
      ec.slug = ${ref}
      OR EXISTS (
        SELECT 1
        FROM event_category_links filter_ecl
        JOIN event_categories filter_ec ON filter_ec.id = filter_ecl.category_id AND filter_ec.status = 'published'
        WHERE filter_ecl.event_id = e.id AND filter_ec.slug = ${ref}
      )
    )`)
  }
  if (filters.featured !== undefined) where.push(`e.is_featured = ${addParam(params, filters.featured)}`)
  if (filters.period === 'upcoming') {
    where.push('(e.starts_at >= now() OR (e.ends_at IS NOT NULL AND e.ends_at >= now()))')
  } else if (filters.period === 'past') {
    where.push('COALESCE(e.ends_at, e.starts_at) < now()')
  }
  if (filters.from) {
    const ref = addParam(params, filters.from)
    where.push(`(e.starts_at >= ${ref} OR (e.ends_at IS NOT NULL AND e.ends_at >= ${ref}))`)
  }
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

async function listTourismAssets(filters, pagination) {
  const params = []
  const where = ["ta.development_status != 'Archived'"]

  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(ta.name ILIKE ${ref} OR ta.description ILIKE ${ref} OR ta.location ILIKE ${ref} OR ta.remarks ILIKE ${ref})`)
  }
  if (filters.category) where.push(`ta.category ILIKE ${addParam(params, filters.category)}`)
  if (filters.targetMarket) where.push(`ta.target_market ILIKE ${addParam(params, `%${filters.targetMarket}%`)}`)

  const orderBy =
    {
      name: 'ta.name ASC',
      '-name': 'ta.name DESC',
      updatedAt: 'ta.updated_at ASC',
      '-updatedAt': 'ta.updated_at DESC',
      featured: 'ta.updated_at DESC',
    }[filters.sort] || 'ta.updated_at DESC'

  const whereSql = where.join(' AND ')
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM tourism_assets ta WHERE ${whereSql}`, params)
  const limitRef = addParam(params, pagination.limit)
  const offsetRef = addParam(params, pagination.offset)
  const rowsResult = await query(
    `
      SELECT
        ta.id,
        ta.name,
        ta.description,
        ta.location,
        ta.category,
        ta.target_market,
        ta.development_status,
        COALESCE(ta.latitude, bp.latitude) AS latitude,
        COALESCE(ta.longitude, bp.longitude) AS longitude,
        bp.business_name AS source_business_name,
        bp.business_type AS source_business_type,
        ar.record_number AS source_accreditation_record_number,
        COALESCE(primary_photo.image_url, ta.image_url) AS image_url,
        ta.remarks,
        ta.updated_at
      FROM tourism_assets ta
      LEFT JOIN business_profiles bp ON bp.id = ta.source_business_profile_id
      LEFT JOIN accreditation_records ar ON ar.id = ta.source_accreditation_record_id
      LEFT JOIN LATERAL (
        SELECT tai.image_url
        FROM tourism_asset_images tai
        WHERE tai.asset_id = ta.id
        ORDER BY tai.is_primary DESC, tai.display_order ASC, tai.created_at ASC
        LIMIT 1
      ) primary_photo ON true
      WHERE ${whereSql}
      ORDER BY ${orderBy}, ta.name ASC
      LIMIT ${limitRef} OFFSET ${offsetRef}
    `,
    params,
  )

  return { items: rowsResult.rows.map(mapTourismAsset), totalItems: countResult.rows[0].total }
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
  const accreditedResult = await query(
    `
      SELECT *
      FROM (${accreditedBusinessesSelect()}) accredited
      WHERE business_slug = $1 OR id = $1
      LIMIT 1
    `,
    [slug],
  )
  const accreditedRow = accreditedResult.rows[0]

  if (accreditedRow) {
    const relatedResult = await query(
      `
        SELECT *
        FROM (${accreditedBusinessesSelect()}) accredited
        WHERE id <> $1
        ORDER BY accreditation_issued_at DESC NULLS LAST, business_name ASC
        LIMIT 4
      `,
      [accreditedRow.id],
    )

    return {
      ...mapAccreditedBusiness(accreditedRow),
      relatedEstablishments: relatedResult.rows.map(mapAccreditedBusiness),
    }
  }

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

function accreditedBusinessesSelect() {
  return `
    WITH active_module_records AS (
      SELECT DISTINCT ON (r.business_profile_id)
        r.id::text AS id,
        'accreditation_module' AS source,
        b.id AS business_id,
        concat(
          trim(both '-' from regexp_replace(lower(b.business_name), '[^a-z0-9]+', '-', 'g')),
          '-',
          left(r.id::text, 8)
        ) AS business_slug,
        b.business_name,
        b.business_type,
          concat_ws(' ', u.first_name, u.last_name) AS owner_name,
          b.description,
          b.street_address AS address_line,
          b.barangay,
          b.city_municipality AS municipality,
        b.province,
        b.region,
          b.latitude,
          b.longitude,
          u.email AS contact_email,
          u.phone,
          b.legal_structure,
          COALESCE(b.partners, '[]'::jsonb) AS partners,
          b.authorized_representative_name,
          b.authorized_representative_position,
          profile_images.primary_image_url,
          COALESCE(profile_images.gallery_images, '[]'::jsonb) AS gallery_images,
          b.facebook_url,
          b.instagram_url,
          b.tiktok_url,
          b.twitter_url,
          b.website_url,
          r.status::text AS accreditation_status,
          r.record_number AS accreditation_number,
          r.issued_at AS accreditation_issued_at,
          r.expires_at AS accreditation_expires_at,
          COALESCE(review_stats.rating_average, 0) AS rating_average,
          COALESCE(review_stats.review_count, 0)::integer AS review_count
        FROM accreditation_records r
        JOIN business_profiles b ON b.id = r.business_profile_id
        JOIN users u ON u.id = b.owner_id
        LEFT JOIN LATERAL (
          SELECT
            (
              SELECT bpi.image_url
              FROM business_profile_images bpi
              WHERE bpi.business_profile_id = b.id
              ORDER BY bpi.display_order ASC, bpi.uploaded_at ASC
              LIMIT 1
            ) AS primary_image_url,
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', image_rows.id,
                  'url', image_rows.image_url,
                  'altText', COALESCE(image_rows.original_name, b.business_name || ' photo'),
                  'displayOrder', image_rows.display_order,
                  'uploadedAt', image_rows.uploaded_at
                )
                ORDER BY image_rows.display_order ASC, image_rows.uploaded_at ASC
              )
              FROM (
                SELECT id, image_url, original_name, display_order, uploaded_at
                FROM business_profile_images
                WHERE business_profile_id = b.id
                ORDER BY display_order ASC, uploaded_at ASC
                LIMIT 5
              ) image_rows
            ) AS gallery_images
        ) profile_images ON true
        LEFT JOIN LATERAL (
          SELECT
            ROUND(AVG(review.rating)::numeric, 1) AS rating_average,
            COUNT(review.id)::integer AS review_count
          FROM tourism_reviews review
          WHERE review.business_profile_id = b.id
            OR review.business_id IN (
              SELECT public_business.id
              FROM businesses public_business
              WHERE public_business.source_business_profile_id = b.id
            )
        ) review_stats ON true
        WHERE r.status = 'active'
        AND (r.expires_at IS NULL OR r.expires_at >= NOW())
      ORDER BY r.business_profile_id, r.issued_at DESC
    ),
    public_records AS (
      SELECT DISTINCT ON (b.id)
        acc.id::text AS id,
        'public_business' AS source,
        b.id AS business_id,
        b.slug AS business_slug,
        b.name AS business_name,
        b.business_type,
        b.owner_name,
        b.description,
        b.address_line,
        b.barangay,
        b.municipality,
        b.province,
        NULL::varchar AS region,
        NULL::numeric AS latitude,
        NULL::numeric AS longitude,
        (
          SELECT bc.contact_value
          FROM business_contacts bc
          WHERE bc.business_id = b.id AND bc.is_public = true AND bc.contact_type = 'email'
          ORDER BY bc.is_primary DESC, bc.created_at ASC
          LIMIT 1
        ) AS contact_email,
        (
          SELECT bc.contact_value
          FROM business_contacts bc
          WHERE bc.business_id = b.id AND bc.is_public = true AND bc.contact_type = 'phone'
          ORDER BY bc.is_primary DESC, bc.created_at ASC
          LIMIT 1
          ) AS phone,
          NULL::varchar AS legal_structure,
          '[]'::jsonb AS partners,
          NULL::varchar AS authorized_representative_name,
          NULL::varchar AS authorized_representative_position,
          NULL::text AS primary_image_url,
          '[]'::jsonb AS gallery_images,
          NULL::text AS facebook_url,
          NULL::text AS instagram_url,
          NULL::text AS tiktok_url,
          NULL::text AS twitter_url,
          NULL::text AS website_url,
          acc.status::text AS accreditation_status,
        acc.accreditation_number,
        acc.issued_at::timestamptz AS accreditation_issued_at,
        acc.expires_at::timestamptz AS accreditation_expires_at,
        COALESCE(review_stats.rating_average, 0) AS rating_average,
        COALESCE(review_stats.review_count, 0)::integer AS review_count
      FROM businesses b
      JOIN LATERAL (
        SELECT ba.id, ba.status, ba.accreditation_number, ba.issued_at, ba.expires_at, ba.verified_at
        FROM business_accreditations ba
        WHERE ba.business_id = b.id
        ORDER BY ba.verified_at DESC NULLS LAST, ba.created_at DESC
        LIMIT 1
      ) acc ON true
      LEFT JOIN LATERAL (
        SELECT
          ROUND(AVG(review.rating)::numeric, 1) AS rating_average,
          COUNT(review.id)::integer AS review_count
        FROM tourism_reviews review
        WHERE review.business_id = b.id
          OR (
            b.source_business_profile_id IS NOT NULL
            AND review.business_profile_id = b.source_business_profile_id
          )
      ) review_stats ON true
      WHERE b.status = 'active'
        AND acc.status = 'accredited'
        AND (acc.expires_at IS NULL OR acc.expires_at >= CURRENT_DATE)
        AND NOT EXISTS (
          SELECT 1
          FROM active_module_records module_record
          WHERE (
            b.source_business_profile_id IS NOT NULL
            AND module_record.business_id = b.source_business_profile_id
          )
          OR (
            b.source_business_profile_id IS NULL
            AND lower(module_record.business_name) = lower(b.name)
          )
        )
      ORDER BY b.id, acc.verified_at DESC NULLS LAST
    )
    SELECT * FROM active_module_records
    UNION ALL
    SELECT * FROM public_records
  `
}

async function listAccreditedBusinesses(filters, pagination) {
  const params = []
  const where = []

  if (filters.search) {
    const ref = addParam(params, `%${filters.search}%`)
    where.push(`(
      business_name ILIKE ${ref}
      OR business_type ILIKE ${ref}
      OR owner_name ILIKE ${ref}
      OR barangay ILIKE ${ref}
      OR municipality ILIKE ${ref}
      OR province ILIKE ${ref}
      OR accreditation_number ILIKE ${ref}
    )`)
  }

  if (filters.businessType) {
    where.push(`business_type ILIKE ${addParam(params, `%${filters.businessType}%`)}`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const sortSql = {
    name: 'business_name ASC',
    '-name': 'business_name DESC',
    issuedAt: 'accreditation_issued_at ASC NULLS LAST',
    '-issuedAt': 'accreditation_issued_at DESC NULLS LAST',
  }[filters.sort || '-issuedAt']

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM (${accreditedBusinessesSelect()}) accredited ${whereSql}`,
    params,
  )

  const listParams = [...params]
  const limitRef = addParam(listParams, pagination.limit)
  const offsetRef = addParam(listParams, pagination.offset)
  const result = await query(
    `
      SELECT *
      FROM (${accreditedBusinessesSelect()}) accredited
      ${whereSql}
      ORDER BY ${sortSql}, business_name ASC
      LIMIT ${limitRef} OFFSET ${offsetRef}
    `,
    listParams,
  )

  return {
    items: result.rows.map(mapAccreditedBusiness),
    totalItems: countResult.rows[0]?.total || 0,
  }
}

function mapMapLocation(row) {
  return {
    id: row.id,
    targetId: row.target_id,
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

function mapEmergencyFacility(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    facilityType: row.facility_type,
    description: row.description,
    addressLine: row.address_line,
    barangay: row.barangay,
    municipality: row.municipality,
    province: row.province,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    openingHours: row.opening_hours && typeof row.opening_hours === 'object'
      ? row.opening_hours
      : {},
    contacts: {
      publicPhone: row.public_phone,
      emergencyHotline: row.emergency_hotline,
      email: row.email,
    },
    accessibilityFeatures: Array.isArray(row.accessibility_features)
      ? row.accessibility_features
      : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    verification: {
      source: row.verification_source,
      verifiedAt: row.verified_at,
    },
  }
}

function mapRichGalleryImage(row) {
  return {
    id: row.id,
    url: row.url,
    altText: row.alt_text,
    displayOrder: Number(row.display_order || 0),
    isPrimary: toBoolean(row.is_primary),
    source: row.source,
  }
}

function mapLinkedActivity(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    duration: row.duration,
    targetMarket: row.target_market,
    displayOrder: Number(row.display_order || 0),
    imageUrl: row.image_url,
  }
}

function mapLinkedPackage(row) {
  return {
    id: row.id,
    slug: packageSlug(row),
    name: row.name,
    description: row.description,
    category: {
      slug: slugify(row.category),
      name: row.category,
    },
    targetMarket: row.target_market,
    estimatedDuration: row.estimated_duration,
    durationDays: row.duration_days == null ? null : Number(row.duration_days),
    basePrice: toNumber(row.base_price),
    currency: 'PHP',
    minPax: row.min_pax == null ? null : Number(row.min_pax),
    maxPax: row.max_pax == null ? null : Number(row.max_pax),
    displayOrder: Number(row.display_order || 0),
    isPrimary: toBoolean(row.is_primary),
    primaryImage: {
      url: row.image_url || packageCategoryImage(row.category),
      altText: `${row.name} package image`,
    },
  }
}

function mapOvernightOption(row) {
  return {
    id: row.id,
    optionType: row.option_type,
    name: row.name,
    description: row.description,
    capacityMin: row.capacity_min == null ? null : Number(row.capacity_min),
    capacityMax: row.capacity_max == null ? null : Number(row.capacity_max),
    rate: {
      amount: toNumber(row.rate_amount),
      currency: row.currency,
      unit: row.rate_unit,
    },
    inclusions: Array.isArray(row.inclusions) ? row.inclusions : [],
    notes: row.notes,
    displayOrder: Number(row.display_order || 0),
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
        COALESCE(d.id, b.id, e.id) AS target_id,
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

  const assetParams = []
  const assetWhere = [
    "ta.development_status != 'Archived'",
    'ta.latitude IS NOT NULL',
    'ta.longitude IS NOT NULL',
  ]

  if (filters.type && !['tourism asset', 'tourism_asset'].includes(String(filters.type).toLowerCase())) {
    assetWhere.push('false')
  }
  if (filters.category) {
    assetWhere.push(
      `regexp_replace(lower(ta.category), '[^a-z0-9]+', '-', 'g') = ${addParam(assetParams, filters.category)}`,
    )
  }
  if (filters.featured !== undefined && filters.featured !== true && filters.featured !== 'true') {
    assetWhere.push('false')
  }

  const assetResult = await query(
    `
      SELECT
        ta.id,
        ta.id AS target_id,
        'tourism asset'::text AS location_type,
        ta.name AS label,
        ta.latitude,
        ta.longitude,
        CASE
          WHEN ta.category ILIKE '%Food%' THEN '#d97706'
          WHEN ta.category ILIKE '%Cultural%' THEN '#a16207'
          WHEN ta.category ILIKE '%Beach%' THEN '#2563eb'
          WHEN ta.category ILIKE '%Event%' THEN '#1f2937'
          ELSE '#1b7a4a'
        END AS marker_color,
        'pin'::text AS marker_icon,
        'asset-' || trim(both '-' from regexp_replace(lower(ta.name), '[^a-z0-9]+', '-', 'g')) || '-' || ta.id AS slug,
        ta.description,
        ta.category AS category_name,
        COALESCE(primary_photo.image_url, ta.image_url) AS primary_image_url
      FROM tourism_assets ta
      LEFT JOIN LATERAL (
        SELECT tai.image_url
        FROM tourism_asset_images tai
        WHERE tai.asset_id = ta.id
        ORDER BY tai.is_primary DESC, tai.display_order ASC, tai.created_at ASC
        LIMIT 1
      ) primary_photo ON true
      WHERE ${assetWhere.join(' AND ')}
      ORDER BY ta.updated_at DESC, ta.name ASC
    `,
    assetParams,
  )

  return [...result.rows, ...assetResult.rows].map(mapMapLocation)
}

async function listEmergencyFacilities() {
  const result = await query(`
    SELECT
      id,
      slug,
      name,
      facility_type,
      description,
      address_line,
      barangay,
      municipality,
      province,
      latitude,
      longitude,
      opening_hours,
      public_phone,
      emergency_hotline,
      email,
      accessibility_features,
      amenities,
      verification_source,
      verified_at
    FROM emergency_facilities
    WHERE status = 'published'
      AND (published_at IS NULL OR published_at <= now())
    ORDER BY sort_priority ASC, name ASC
  `)

  return result.rows.map(mapEmergencyFacility)
}

async function getFallbackMapLocationGallery(location) {
  if (location.location_type === 'destination') {
    const result = await query(
      `
        SELECT
          di.id,
          COALESCE(di.image_url, ma.file_url) AS url,
          COALESCE(di.alt_text, ma.alt_text, $2 || ' photo') AS alt_text,
          di.display_order,
          di.is_primary,
          'destination'::text AS source
        FROM destination_images di
        LEFT JOIN media_assets ma
          ON ma.id = di.media_asset_id
         AND ma.status = 'active'
        WHERE di.destination_id = $1
          AND COALESCE(di.image_url, ma.file_url) IS NOT NULL
        ORDER BY di.is_primary DESC, di.display_order ASC, di.created_at ASC
      `,
      [location.target_id, location.name],
    )
    return result.rows.map(mapRichGalleryImage)
  }

  const result = await query(
    `
      SELECT
        pi.id,
        COALESCE(pi.image_url, ma.file_url) AS url,
        COALESCE(pi.alt_text, ma.alt_text, p.name || ' photo') AS alt_text,
        row_number() OVER (
          ORDER BY p.is_featured DESC, pi.is_primary DESC, pi.display_order ASC, pi.created_at ASC
        ) - 1 AS display_order,
        pi.is_primary,
        'business_product'::text AS source
      FROM products p
      JOIN product_images pi ON pi.product_id = p.id
      LEFT JOIN media_assets ma
        ON ma.id = pi.media_asset_id
       AND ma.status = 'active'
      WHERE p.business_id = $1
        AND p.status = 'published'
        AND (p.published_at IS NULL OR p.published_at <= now())
        AND COALESCE(pi.image_url, ma.file_url) IS NOT NULL
      ORDER BY p.is_featured DESC, pi.is_primary DESC, pi.display_order ASC, pi.created_at ASC
      LIMIT 12
    `,
    [location.target_id],
  )
  return result.rows.map(mapRichGalleryImage)
}

async function getMapLocationDetails(id) {
  const locationResult = await query(
    `
      SELECT
        ml.id,
        ml.location_type,
        ml.latitude,
        ml.longitude,
        COALESCE(d.id, b.id) AS target_id,
        COALESCE(d.slug, b.slug) AS slug,
        COALESCE(d.name, b.name, ml.label) AS name,
        COALESCE(dc.slug, NULL) AS category_slug,
        COALESCE(dc.name, b.business_type) AS category_name,
        COALESCE(
          NULLIF(trim(mld.overview), ''),
          NULLIF(trim(d.description), ''),
          NULLIF(trim(b.description), ''),
          d.short_description
        ) AS overview,
        COALESCE(NULLIF(trim(mld.opening_hours_text), ''), d.opening_hours_text) AS opening_hours_text,
        COALESCE(NULLIF(trim(mld.admission_information), ''), d.entrance_fee_text) AS admission_information,
        COALESCE(NULLIF(trim(mld.best_time_to_visit), ''), d.best_time_to_visit) AS best_time_to_visit,
        COALESCE(NULLIF(trim(mld.accessibility_notes), ''), d.accessibility_notes) AS accessibility_notes,
        mld.how_to_visit,
        mld.how_to_book,
        COALESCE(d.address_line, b.address_line) AS address_line,
        COALESCE(d.barangay, b.barangay) AS barangay,
        COALESCE(d.municipality, b.municipality) AS municipality,
        COALESCE(d.province, b.province) AS province
      FROM map_locations ml
      LEFT JOIN destinations d ON d.id = ml.destination_id
      LEFT JOIN destination_categories dc
        ON dc.id = d.category_id
       AND dc.status = 'published'
      LEFT JOIN businesses b ON b.id = ml.business_id
      LEFT JOIN map_location_details mld ON mld.map_location_id = ml.id
      WHERE ml.id = $1
        AND ml.status = 'published'
        AND (
          (
            ml.location_type = 'destination'
            AND d.status = 'published'
            AND (d.published_at IS NULL OR d.published_at <= now())
            AND dc.id IS NOT NULL
          )
          OR
          (ml.location_type = 'business' AND b.status = 'active')
        )
      LIMIT 1
    `,
    [id],
  )
  const location = locationResult.rows[0]
  if (!location) return null

  const [customGalleryResult, activitiesResult, packagesResult, overnightResult] = await Promise.all([
    query(
      `
        SELECT
          mlgi.id,
          COALESCE(NULLIF(trim(mlgi.image_url), ''), ma.file_url) AS url,
          COALESCE(mlgi.alt_text, ma.alt_text, $2 || ' photo') AS alt_text,
          mlgi.display_order,
          mlgi.is_primary,
          'map_location'::text AS source
        FROM map_location_gallery_images mlgi
        LEFT JOIN media_assets ma
          ON ma.id = mlgi.media_asset_id
         AND ma.status = 'active'
        WHERE mlgi.map_location_id = $1
          AND COALESCE(NULLIF(trim(mlgi.image_url), ''), ma.file_url) IS NOT NULL
        ORDER BY mlgi.is_primary DESC, mlgi.display_order ASC, mlgi.created_at ASC
      `,
      [id, location.name],
    ),
    query(
      `
        SELECT
          activity.id,
          activity.name,
          activity.description,
          activity.duration,
          activity.target_market,
          link.display_order,
          asset.image_url
        FROM map_location_activity_links link
        JOIN tourism_activities activity
          ON activity.id = link.activity_id
         AND activity.activity_status = 'Ready for Promotion'
        LEFT JOIN tourism_assets asset ON asset.id = activity.asset_id
        WHERE link.map_location_id = $1
        ORDER BY link.display_order ASC, link.created_at ASC, activity.name ASC
      `,
      [id],
    ),
    query(
      `
        SELECT
          package.id,
          package.name,
          package.description,
          package.category,
          package.target_market,
          package.estimated_duration,
          package.duration_days,
          package.base_price,
          package.min_pax,
          package.max_pax,
          link.display_order,
          link.is_primary,
          first_asset.image_url
        FROM map_location_package_links link
        JOIN tourism_packages package
          ON package.id = link.package_id
         AND package.package_status = ANY($2::text[])
        LEFT JOIN LATERAL (
          SELECT COALESCE(direct_asset.image_url, plan_asset.image_url, activity_asset.image_url) AS image_url
          FROM package_items item
          LEFT JOIN tourism_assets direct_asset
            ON item.item_type = 'Asset'
           AND direct_asset.id = item.item_reference_id
          LEFT JOIN development_plans plan
            ON item.item_type = 'Plan'
           AND plan.id = item.item_reference_id
          LEFT JOIN tourism_assets plan_asset ON plan_asset.id = plan.asset_id
          LEFT JOIN tourism_activities activity
            ON item.item_type = 'Activity'
           AND activity.id = item.item_reference_id
          LEFT JOIN tourism_assets activity_asset ON activity_asset.id = activity.asset_id
          WHERE item.package_id = package.id
            AND COALESCE(direct_asset.image_url, plan_asset.image_url, activity_asset.image_url) IS NOT NULL
          ORDER BY item.sort_order ASC
          LIMIT 1
        ) first_asset ON true
        WHERE link.map_location_id = $1
        ORDER BY link.is_primary DESC, link.display_order ASC, link.created_at ASC, package.name ASC
      `,
      [id, [...PUBLIC_PACKAGE_STATUSES]],
    ),
    query(
      `
        SELECT
          id,
          option_type,
          name,
          description,
          capacity_min,
          capacity_max,
          rate_amount,
          currency,
          rate_unit,
          inclusions,
          notes,
          display_order
        FROM map_location_overnight_options
        WHERE map_location_id = $1
          AND is_active = true
        ORDER BY display_order ASC, created_at ASC, name ASC
      `,
      [id],
    ),
  ])

  const gallery = customGalleryResult.rows.length
    ? customGalleryResult.rows.map(mapRichGalleryImage)
    : await getFallbackMapLocationGallery(location)
  const packages = packagesResult.rows.map(mapLinkedPackage)

  return {
    id: location.id,
    locationType: location.location_type,
    slug: location.slug,
    name: location.name,
    coordinates: {
      latitude: toNumber(location.latitude),
      longitude: toNumber(location.longitude),
    },
    category: location.category_name
      ? {
          slug: location.category_slug || slugify(location.category_name),
          name: location.category_name,
        }
      : null,
    overview: location.overview,
    visitInformation: {
      addressLine: location.address_line,
      barangay: location.barangay,
      municipality: location.municipality,
      province: location.province,
      openingHoursText: location.opening_hours_text,
      admissionInformation: location.admission_information,
      bestTimeToVisit: location.best_time_to_visit,
      accessibilityNotes: location.accessibility_notes,
    },
    howToVisit: location.how_to_visit,
    howToBook: location.how_to_book,
    gallery,
    activities: activitiesResult.rows.map(mapLinkedActivity),
    packages,
    primaryPackage: packages.find((item) => item.isPrimary) || packages[0] || null,
    overnightOptions: overnightResult.rows.map(mapOvernightOption),
  }
}

async function getHome() {
  const [promotions, products, packages, destinations, events, artifacts, stats] = await Promise.all([
    listPromotions({ featured: true }, { limit: 3, offset: 0 }),
    listProducts({ featured: true }, { limit: 4, offset: 0 }),
    listPackages({}, { limit: 3, offset: 0 }),
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
    featuredPackages: packages.items,
    featuredDestinations: destinations.items,
    upcomingEvents: events.items,
    featuredMuseumArtifacts: artifacts.items,
    publicStats: stats.rows[0],
  }
}

function mapItineraryItem(row) {
  return {
    id: row.id,
    itemType: row.item_type,
    targetId: row.target_id,
    titleSnapshot: row.title_snapshot,
    savedAt: row.saved_at,
    summary: {
      slug: row.slug,
      title: row.title,
      primaryImage: row.primary_image_url,
    },
  }
}

async function createItinerarySession({ sessionToken, visitorLabel }) {
  const result = await query(
    `
      INSERT INTO itinerary_sessions (session_token, visitor_label, expires_at)
      VALUES ($1, $2, now() + interval '90 days')
      RETURNING session_token, created_at
    `,
    [sessionToken, visitorLabel || null],
  )

  return {
    sessionToken: result.rows[0].session_token,
    itemCount: 0,
    items: [],
  }
}

async function getItineraryByToken(sessionToken) {
  const sessionResult = await query(
    `
      SELECT id, session_token
      FROM itinerary_sessions
      WHERE session_token = $1
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1
    `,
    [sessionToken],
  )
  const session = sessionResult.rows[0]
  if (!session) return null

  const itemsResult = await query(
    `
      SELECT
        ii.id,
        ii.item_type,
        COALESCE(p.id, e.id, d.id, ma.id) AS target_id,
        ii.title_snapshot,
        ii.saved_at,
        COALESCE(p.slug, e.slug, d.slug, ma.slug) AS slug,
        COALESCE(p.name, e.title, d.name, ma.name) AS title,
        COALESCE(pimg.image_url, eimg.image_url, dimg.image_url, aimg.image_url) AS primary_image_url
      FROM itinerary_items ii
      LEFT JOIN products p ON p.id = ii.product_id AND p.status = 'published'
      LEFT JOIN events e ON e.id = ii.event_id AND e.status = 'published'
      LEFT JOIN destinations d ON d.id = ii.destination_id AND d.status = 'published'
      LEFT JOIN museum_artifacts ma ON ma.id = ii.artifact_id AND ma.status = 'published'
      LEFT JOIN LATERAL (
        SELECT COALESCE(pi.image_url, media.file_url) AS image_url
        FROM product_images pi
        LEFT JOIN media_assets media ON media.id = pi.media_asset_id AND media.status = 'active'
        WHERE pi.product_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) pimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(ei.image_url, media.file_url) AS image_url
        FROM event_images ei
        LEFT JOIN media_assets media ON media.id = ei.media_asset_id AND media.status = 'active'
        WHERE ei.event_id = e.id
        ORDER BY ei.is_primary DESC, ei.display_order ASC
        LIMIT 1
      ) eimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(di.image_url, media.file_url) AS image_url
        FROM destination_images di
        LEFT JOIN media_assets media ON media.id = di.media_asset_id AND media.status = 'active'
        WHERE di.destination_id = d.id
        ORDER BY di.is_primary DESC, di.display_order ASC
        LIMIT 1
      ) dimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(ai.image_url, media.file_url) AS image_url
        FROM artifact_images ai
        LEFT JOIN media_assets media ON media.id = ai.media_asset_id AND media.status = 'active'
        WHERE ai.artifact_id = ma.id
        ORDER BY ai.is_primary DESC, ai.display_order ASC
        LIMIT 1
      ) aimg ON true
      WHERE ii.itinerary_session_id = $1
        AND (
          (ii.item_type = 'product' AND p.id IS NOT NULL)
          OR (ii.item_type = 'event' AND e.id IS NOT NULL)
          OR (ii.item_type = 'destination' AND d.id IS NOT NULL)
          OR (ii.item_type = 'artifact' AND ma.id IS NOT NULL)
        )
      ORDER BY ii.saved_at ASC, ii.created_at ASC
    `,
    [session.id],
  )

  const items = itemsResult.rows.map(mapItineraryItem)

  return {
    sessionToken: session.session_token,
    itemCount: items.length,
    items,
  }
}

async function getPublicTarget(itemType, targetId) {
  const queries = {
    product: {
      sql: `
        SELECT product.id, product.slug, product.name AS title
        FROM products product
        JOIN product_categories category
          ON category.id = product.category_id
         AND category.status = 'published'
        JOIN businesses business
          ON business.id = product.business_id
         AND business.status = 'active'
        WHERE product.id = $1
          AND product.status = 'published'
          AND (product.published_at IS NULL OR product.published_at <= now())
        LIMIT 1
      `,
    },
    event: {
      sql: `
        SELECT id, slug, title
        FROM events
        WHERE id = $1 AND status = 'published'
          AND (published_at IS NULL OR published_at <= now())
        LIMIT 1
      `,
    },
    destination: {
      sql: `
        SELECT destination.id, destination.slug, destination.name AS title
        FROM destinations destination
        JOIN destination_categories category
          ON category.id = destination.category_id
         AND category.status = 'published'
        WHERE destination.id = $1
          AND destination.status = 'published'
          AND (destination.published_at IS NULL OR destination.published_at <= now())
        LIMIT 1
      `,
    },
    artifact: {
      sql: `
        SELECT id, slug, name AS title
        FROM museum_artifacts
        WHERE id = $1 AND status = 'published'
          AND (published_at IS NULL OR published_at <= now())
        LIMIT 1
      `,
    },
  }

  const config = queries[itemType]
  if (!config) return null

  const result = await query(config.sql, [targetId])
  return result.rows[0] || null
}

async function getExistingItineraryItem(sessionToken, itemType, targetId) {
  const result = await query(
    `
      SELECT ii.id
      FROM itinerary_items ii
      JOIN itinerary_sessions s ON s.id = ii.itinerary_session_id
      WHERE s.session_token = $1
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND ii.item_type = $2
        AND (
          ($2 = 'product' AND ii.product_id = $3::uuid)
          OR ($2 = 'event' AND ii.event_id = $3::uuid)
          OR ($2 = 'destination' AND ii.destination_id = $3::uuid)
          OR ($2 = 'artifact' AND ii.artifact_id = $3::uuid)
        )
      LIMIT 1
    `,
    [sessionToken, itemType, targetId],
  )

  return result.rows[0] || null
}

async function getItineraryItemById(sessionToken, itemId) {
  const result = await query(
    `
      SELECT
        ii.id,
        ii.item_type,
        COALESCE(p.id, e.id, d.id, ma.id) AS target_id,
        ii.title_snapshot,
        ii.saved_at,
        COALESCE(p.slug, e.slug, d.slug, ma.slug) AS slug,
        COALESCE(p.name, e.title, d.name, ma.name) AS title,
        COALESCE(pimg.image_url, eimg.image_url, dimg.image_url, aimg.image_url) AS primary_image_url
      FROM itinerary_items ii
      JOIN itinerary_sessions s ON s.id = ii.itinerary_session_id
      LEFT JOIN products p ON p.id = ii.product_id AND p.status = 'published'
      LEFT JOIN events e ON e.id = ii.event_id AND e.status = 'published'
      LEFT JOIN destinations d ON d.id = ii.destination_id AND d.status = 'published'
      LEFT JOIN museum_artifacts ma ON ma.id = ii.artifact_id AND ma.status = 'published'
      LEFT JOIN LATERAL (
        SELECT COALESCE(pi.image_url, media.file_url) AS image_url
        FROM product_images pi
        LEFT JOIN media_assets media ON media.id = pi.media_asset_id AND media.status = 'active'
        WHERE pi.product_id = p.id
        ORDER BY pi.is_primary DESC, pi.display_order ASC
        LIMIT 1
      ) pimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(ei.image_url, media.file_url) AS image_url
        FROM event_images ei
        LEFT JOIN media_assets media ON media.id = ei.media_asset_id AND media.status = 'active'
        WHERE ei.event_id = e.id
        ORDER BY ei.is_primary DESC, ei.display_order ASC
        LIMIT 1
      ) eimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(di.image_url, media.file_url) AS image_url
        FROM destination_images di
        LEFT JOIN media_assets media ON media.id = di.media_asset_id AND media.status = 'active'
        WHERE di.destination_id = d.id
        ORDER BY di.is_primary DESC, di.display_order ASC
        LIMIT 1
      ) dimg ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(ai.image_url, media.file_url) AS image_url
        FROM artifact_images ai
        LEFT JOIN media_assets media ON media.id = ai.media_asset_id AND media.status = 'active'
        WHERE ai.artifact_id = ma.id
        ORDER BY ai.is_primary DESC, ai.display_order ASC
        LIMIT 1
      ) aimg ON true
      WHERE s.session_token = $1
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND ii.id = $2
      LIMIT 1
    `,
    [sessionToken, itemId],
  )

  return result.rows[0] ? mapItineraryItem(result.rows[0]) : null
}

async function createItineraryItem({ sessionToken, itemType, targetId, titleSnapshot }) {
  const sessionResult = await query(
    `
      SELECT id
      FROM itinerary_sessions
      WHERE session_token = $1
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1
    `,
    [sessionToken],
  )
  const session = sessionResult.rows[0]
  if (!session) return null

  const columns = {
    product: ['product_id', targetId, null, null, null],
    event: ['event_id', null, targetId, null, null],
    destination: ['destination_id', null, null, targetId, null],
    artifact: ['artifact_id', null, null, null, targetId],
  }
  const columnValues = columns[itemType]
  if (!columnValues) return null

  const result = await query(
    `
      INSERT INTO itinerary_items (
        itinerary_session_id,
        item_type,
        product_id,
        event_id,
        destination_id,
        artifact_id,
        title_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [session.id, itemType, columnValues[1], columnValues[2], columnValues[3], columnValues[4], titleSnapshot],
  )

  return getItineraryItemById(sessionToken, result.rows[0].id)
}

async function deleteItineraryItem({ sessionToken, itemId }) {
  const result = await query(
    `
      DELETE FROM itinerary_items ii
      USING itinerary_sessions s
      WHERE ii.itinerary_session_id = s.id
        AND s.session_token = $1
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND ii.id = $2
      RETURNING ii.id
    `,
    [sessionToken, itemId],
  )

  return result.rowCount > 0
}

async function resolveReviewTarget({ targetType, targetId }) {
  if (targetType === 'tourism_asset') {
    const result = await query(
      `SELECT id
       FROM tourism_assets
       WHERE id = $1
         AND development_status != 'Archived'
       LIMIT 1`,
      [targetId],
    )
    if (!result.rows[0]) return null

    return {
      targetType,
      targetId: result.rows[0].id,
      targetColumn: 'tourism_asset_id',
    }
  }

  if (targetType === 'product' || targetType === 'destination') {
    const target = await getPublicTarget(targetType, targetId)
    if (!target) return null

    return {
      targetType,
      targetId: target.id,
      targetColumn: targetType === 'product' ? 'product_id' : 'destination_id',
    }
  }

  if (targetType !== 'business') return null

  const profileResult = await query(
    `SELECT profile.id
     FROM business_profiles profile
     WHERE profile.id = $1
       AND EXISTS (
         SELECT 1
         FROM accreditation_records record
         WHERE record.business_profile_id = profile.id
           AND record.status = 'active'
           AND (record.expires_at IS NULL OR record.expires_at >= now())
       )
     LIMIT 1`,
    [targetId],
  )
  if (profileResult.rows[0]) {
    return {
      targetType,
      targetId: profileResult.rows[0].id,
      targetColumn: 'business_profile_id',
    }
  }

  const businessResult = await query(
    `
      SELECT id, source_business_profile_id
      FROM businesses
      WHERE id = $1
        AND status = 'active'
        AND (
          EXISTS (
            SELECT 1
            FROM business_accreditations accreditation
            WHERE accreditation.business_id = businesses.id
              AND accreditation.status = 'accredited'
              AND (accreditation.expires_at IS NULL OR accreditation.expires_at >= CURRENT_DATE)
          )
          OR EXISTS (
            SELECT 1
            FROM accreditation_records record
            WHERE record.business_profile_id = businesses.source_business_profile_id
              AND record.status = 'active'
              AND (record.expires_at IS NULL OR record.expires_at >= now())
          )
        )
      LIMIT 1
    `,
    [targetId],
  )
  const business = businessResult.rows[0]
  if (!business) return null

  return business.source_business_profile_id
    ? {
        targetType,
        targetId: business.source_business_profile_id,
        targetColumn: 'business_profile_id',
      }
    : {
        targetType,
        targetId: business.id,
        targetColumn: 'business_id',
      }
}

async function listReviews(target) {
  const targetColumn = reviewTargetColumn(target)
  const result = await query(
    `
      SELECT
        review.id,
        review.rating,
        review.comment,
        review.created_at,
        review.updated_at,
        COALESCE(NULLIF(trim(tourist.full_name), ''), 'Anonymous Tourist') AS author
      FROM tourism_reviews review
      LEFT JOIN tourist_accounts tourist ON tourist.id = review.tourist_account_id
      WHERE review.${targetColumn} = $1
      ORDER BY review.created_at DESC, review.id DESC
    `,
    [target.targetId],
  )

  const reviews = result.rows.map(mapPublicReview)
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let ratingTotal = 0

  for (const review of reviews) {
    distribution[review.rating] += 1
    ratingTotal += review.rating
  }

  return {
    average: reviews.length ? Math.round((ratingTotal / reviews.length) * 10) / 10 : 0,
    count: reviews.length,
    distribution,
    reviews,
  }
}

async function upsertReview({ target, touristAccountId, rating, comment }) {
  const targetColumn = reviewTargetColumn(target)
  const result = await query(
    `
      WITH saved_review AS (
        INSERT INTO tourism_reviews (
          tourist_account_id,
          ${targetColumn},
          rating,
          comment
        )
        VALUES ($1, $2, $3, NULLIF($4, ''))
        ON CONFLICT (tourist_account_id, ${targetColumn})
          WHERE tourist_account_id IS NOT NULL AND ${targetColumn} IS NOT NULL
        DO UPDATE SET
          rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          updated_at = now()
        RETURNING *
      )
      SELECT
        saved_review.*,
        COALESCE(NULLIF(trim(tourist.full_name), ''), 'Anonymous Tourist') AS author
      FROM saved_review
      LEFT JOIN tourist_accounts tourist ON tourist.id = saved_review.tourist_account_id
    `,
    [touristAccountId, target.targetId, rating, comment],
  )

  return mapPublicReview(result.rows[0])
}

async function getProductInquiryTarget(productId) {
  const result = await query(
    `
      SELECT
        product.id AS product_id,
        product.business_id,
        business.source_business_profile_id AS business_profile_id
      FROM products product
      JOIN businesses business ON business.id = product.business_id
      JOIN product_categories category
        ON category.id = product.category_id
       AND category.status = 'published'
      WHERE product.id = $1
        AND product.status = 'published'
        AND (product.published_at IS NULL OR product.published_at <= now())
        AND business.status = 'active'
      LIMIT 1
    `,
    [productId],
  )
  const row = result.rows[0]
  if (!row) return null

  return {
    productId: row.product_id,
    businessId: row.business_id,
    businessProfileId: row.business_profile_id,
  }
}

async function createInquiry({
  fullName,
  email,
  contactNumber,
  subject,
  message,
  sourcePage,
  touristAccountId,
  productId,
  businessId,
  businessProfileId,
}) {
  const result = await query(
    `
      INSERT INTO tourism_inquiries (
        full_name,
        email,
        contact_number,
        subject,
        message,
        source_page,
        tourist_account_id,
        product_id,
        business_id,
        business_profile_id,
        status
      )
      VALUES ($1, lower($2), $3, $4, $5, $6, $7, $8, $9, $10, 'new')
      RETURNING id, status, created_at AS received_at
    `,
    [
      fullName,
      email,
      contactNumber || null,
      subject,
      message,
      sourcePage || null,
      touristAccountId || null,
      productId || null,
      businessId || null,
      businessProfileId || null,
    ],
  )

  return {
    id: result.rows[0].id,
    status: result.rows[0].status,
    receivedAt: result.rows[0].received_at,
  }
}

async function getNewsletterSubscriberByEmail(email) {
  const result = await query(
    `
      SELECT id, email, status, subscribed_at
      FROM newsletter_subscribers
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email],
  )

  return result.rows[0] || null
}

async function createNewsletterSubscription({ email, fullName }) {
  const normalizedEmail = email.toLowerCase()
  const existing = await getNewsletterSubscriberByEmail(normalizedEmail)

  if (existing) {
    if (existing.status === 'subscribed') {
      return {
        email: existing.email,
        status: existing.status,
        subscribedAt: existing.subscribed_at,
        wasExisting: true,
      }
    }

    const updated = await query(
      `
        UPDATE newsletter_subscribers
        SET status = 'subscribed',
            full_name = COALESCE($2, full_name),
            subscribed_at = now(),
            unsubscribed_at = NULL
        WHERE id = $1
        RETURNING email, status, subscribed_at
      `,
      [existing.id, fullName || null],
    )

    return {
      email: updated.rows[0].email,
      status: updated.rows[0].status,
      subscribedAt: updated.rows[0].subscribed_at,
      wasExisting: true,
    }
  }

  let inserted

  try {
    inserted = await query(
      `
        INSERT INTO newsletter_subscribers (email, full_name, status)
        VALUES ($1, $2, 'subscribed')
        RETURNING email, status, subscribed_at
      `,
      [normalizedEmail, fullName || null],
    )
  } catch (error) {
    if (error.code !== '23505') throw error

    const duplicate = await getNewsletterSubscriberByEmail(normalizedEmail)
    return {
      email: duplicate.email,
      status: duplicate.status,
      subscribedAt: duplicate.subscribed_at,
      wasExisting: true,
    }
  }

  return {
    email: inserted.rows[0].email,
    status: inserted.rows[0].status,
    subscribedAt: inserted.rows[0].subscribed_at,
    wasExisting: false,
  }
}

module.exports = {
  listProducts,
  getProductBySlug,
  listPackages,
  getPackageBySlug,
  getPackageForBooking,
  createPackageBookingRequest,
  createPackageBookingDateChangeRequest,
  getPackageBookingRequestById,
  getPackageBookingRequestByTouristId,
  findPackageBookingRequestForPublicLookup,
  listPackageBookingRequestsByTouristId,
  updatePackageBookingPaymentProof,
  listTourismAssets,
  listEvents,
  getEventBySlug,
  listDestinations,
  getDestinationBySlug,
  listMuseumArtifacts,
  getMuseumArtifactBySlug,
  listPromotions,
  getPromotionBySlug,
  listAccreditedBusinesses,
  getBusinessBySlug,
  listMapLocations,
  listEmergencyFacilities,
  getMapLocationDetails,
  listCategories,
  getHome,
  createItinerarySession,
  getItineraryByToken,
  getPublicTarget,
  getExistingItineraryItem,
  createItineraryItem,
  getItineraryItemById,
  deleteItineraryItem,
  resolveReviewTarget,
  listReviews,
  upsertReview,
  getProductInquiryTarget,
  createInquiry,
  createNewsletterSubscription,
}
