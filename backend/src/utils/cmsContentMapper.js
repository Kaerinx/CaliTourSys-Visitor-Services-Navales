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

module.exports = {
  mapCategory,
  mapEvent,
  mapPromotion,
}

