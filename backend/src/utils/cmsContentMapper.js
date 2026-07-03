function mapPromotion(row) {
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    promotionType: row.promotion_type,
    accentColor: row.accent_color,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedBy: row.published_by,
    archivedBy: row.archived_by,
  }
}

function mapEvent(row) {
  if (!row) return null

  return {
    id: row.id,
    categoryId: row.category_id,
    category: row.category_slug
      ? {
          id: row.category_id,
          slug: row.category_slug,
          name: row.category_name,
        }
      : undefined,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    venueName: row.venue_name,
    organizerName: row.organizer_name,
    contactInfo: row.contact_info,
    addressLine: row.address_line,
    barangay: row.barangay,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    accentColor: row.accent_color,
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedBy: row.published_by,
    archivedBy: row.archived_by,
  }
}

function mapCategory(row) {
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
    description: row.description,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapProduct(row) {
  if (!row) return null

  return {
    id: row.id,
    businessId: row.business_id,
    categoryId: row.category_id,
    category: row.category_slug
      ? {
          id: row.category_id,
          slug: row.category_slug,
          name: row.category_name,
        }
      : undefined,
    business: row.business_slug
      ? {
          id: row.business_id,
          slug: row.business_slug,
          name: row.business_name,
        }
      : undefined,
    primaryImage: row.primary_image_url
      ? {
          id: row.primary_image_id,
          url: row.primary_image_url,
          altText: row.primary_image_alt_text,
          displayOrder: row.primary_image_display_order,
        }
      : null,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    priceAmount: row.price_amount === null || row.price_amount === undefined ? null : Number(row.price_amount),
    priceCurrency: row.price_currency,
    unitLabel: row.unit_label,
    availabilityText: row.availability_text,
    accentColor: row.accent_color,
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedBy: row.published_by,
    archivedBy: row.archived_by,
  }
}

function mapDestination(row) {
  if (!row) return null

  return {
    id: row.id,
    categoryId: row.category_id,
    businessId: row.business_id,
    category: row.category_slug
      ? {
          id: row.category_id,
          slug: row.category_slug,
          name: row.category_name,
        }
      : undefined,
    business: row.business_slug
      ? {
          id: row.business_id,
          slug: row.business_slug,
          name: row.business_name,
        }
      : undefined,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    addressLine: row.address_line,
    barangay: row.barangay,
    municipality: row.municipality,
    province: row.province,
    openingHoursText: row.opening_hours_text,
    entranceFeeText: row.entrance_fee_text,
    bestTimeToVisit: row.best_time_to_visit,
    accessibilityNotes: row.accessibility_notes,
    accentColor: row.accent_color,
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedBy: row.published_by,
    archivedBy: row.archived_by,
  }
}

function mapBusiness(row) {
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    businessType: row.business_type,
    ownerName: row.owner_name,
    description: row.description,
    addressLine: row.address_line,
    barangay: row.barangay,
    municipality: row.municipality,
    province: row.province,
    status: row.status,
    isFeatured: row.is_featured,
    accreditation: row.accreditation_status
      ? {
          status: row.accreditation_status,
          number: row.accreditation_number,
          issuedAt: row.accreditation_issued_at,
          expiresAt: row.accreditation_expires_at,
          verifiedAt: row.accreditation_verified_at,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  }
}

function mapMuseumArtifact(row) {
  if (!row) return null

  return {
    id: row.id,
    categoryId: row.category_id,
    category: row.category_slug
      ? {
          id: row.category_id,
          slug: row.category_slug,
          name: row.category_name,
        }
      : undefined,
    slug: row.slug,
    name: row.name,
    eraLabel: row.era_label,
    shortDescription: row.short_description,
    description: row.description,
    historicalNotes: row.historical_notes,
    accentColor: row.accent_color,
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    publishedBy: row.published_by,
    archivedBy: row.archived_by,
  }
}

function mapMapLocation(row) {
  if (!row) return null

  return {
    id: row.id,
    locationType: row.location_type,
    destinationId: row.destination_id,
    businessId: row.business_id,
    eventId: row.event_id,
    label: row.label,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    mapboxPlaceId: row.mapbox_place_id,
    markerColor: row.marker_color,
    markerIcon: row.marker_icon,
    clusterGroup: row.cluster_group,
    geojsonProperties: row.geojson_properties,
    isPrimary: row.is_primary,
    isClusterable: row.is_clusterable,
    sortPriority: row.sort_priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  }
}

module.exports = {
  mapCategory,
  mapBusiness,
  mapDestination,
  mapEvent,
  mapMapLocation,
  mapMuseumArtifact,
  mapProduct,
  mapPromotion,
}
