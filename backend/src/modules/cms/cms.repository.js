const { query } = require('../../config/db')

async function getDashboardSummary() {
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::integer FROM products) AS total_products,
      (SELECT COUNT(*)::integer FROM products WHERE status = 'published') AS published_products,
      (SELECT COUNT(*)::integer FROM products WHERE status = 'draft') AS draft_products,
      (SELECT COUNT(*)::integer FROM events) AS total_events,
      (SELECT COUNT(*)::integer FROM events WHERE status = 'published') AS published_events,
      (SELECT COUNT(*)::integer FROM destinations) AS total_destinations,
      (SELECT COUNT(*)::integer FROM destinations WHERE status = 'published') AS published_destinations,
      (SELECT COUNT(*)::integer FROM businesses) AS total_businesses,
      (SELECT COUNT(*)::integer FROM businesses WHERE status = 'active') AS active_businesses,
      (SELECT COUNT(*)::integer FROM museum_artifacts) AS total_museum_artifacts,
      (SELECT COUNT(*)::integer FROM museum_artifacts WHERE status = 'published') AS published_museum_artifacts,
      (SELECT COUNT(*)::integer FROM tourism_inquiries WHERE status = 'new') AS pending_inquiries,
      (SELECT COUNT(*)::integer FROM newsletter_subscribers WHERE status = 'subscribed') AS newsletter_subscribers
  `)

  const row = result.rows[0]
  return {
    totalProducts: row.total_products,
    publishedProducts: row.published_products,
    draftProducts: row.draft_products,
    totalEvents: row.total_events,
    publishedEvents: row.published_events,
    totalDestinations: row.total_destinations,
    publishedDestinations: row.published_destinations,
    totalBusinesses: row.total_businesses,
    activeBusinesses: row.active_businesses,
    totalMuseumArtifacts: row.total_museum_artifacts,
    publishedMuseumArtifacts: row.published_museum_artifacts,
    pendingInquiries: row.pending_inquiries,
    newsletterSubscribers: row.newsletter_subscribers,
  }
}

async function listRecentAuditLogs(limit = 5) {
  const result = await query(
    `
      SELECT
        al.id,
        al.action::text AS action,
        al.entity_type::text AS entity_type,
        al.entity_id,
        al.entity_label,
        al.request_id,
        al.created_at,
        u.id AS actor_id,
        u.email AS actor_email,
        u.display_name AS actor_display_name
      FROM content_audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      ORDER BY al.created_at DESC
      LIMIT $1
    `,
    [limit],
  )

  return result.rows.map(mapAuditLogRow)
}

async function listAuditLogs({ pagination, action, entityType }) {
  const itemParams = [pagination.limit, pagination.offset, action || null, entityType || null]
  const countParams = [action || null, entityType || null]
  const itemWhere = `
    WHERE ($3::text IS NULL OR al.action::text = $3)
      AND ($4::text IS NULL OR al.entity_type::text = $4)
  `
  const countWhere = `
    WHERE ($1::text IS NULL OR al.action::text = $1)
      AND ($2::text IS NULL OR al.entity_type::text = $2)
  `

  const [itemsResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          al.id,
          al.action::text AS action,
          al.entity_type::text AS entity_type,
          al.entity_id,
          al.entity_label,
          al.request_id,
          al.created_at,
          u.id AS actor_id,
          u.email AS actor_email,
          u.display_name AS actor_display_name
        FROM content_audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        ${itemWhere}
        ORDER BY al.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      itemParams,
    ),
    query(
      `
        SELECT COUNT(*)::integer AS total_items
        FROM content_audit_logs al
        ${countWhere}
      `,
      countParams,
    ),
  ])

  return {
    items: itemsResult.rows.map(mapAuditLogRow),
    totalItems: countResult.rows[0]?.total_items || 0,
  }
}

function mapAuditLogRow(row) {
  return {
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
}

module.exports = {
  getDashboardSummary,
  listAuditLogs,
  listRecentAuditLogs,
}
