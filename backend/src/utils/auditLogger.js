const { query } = require('../config/db')

async function logAuditEvent({
  actorUserId = null,
  action,
  entityType,
  entityId = null,
  entityLabel = null,
  beforeValues = null,
  afterValues = null,
  ipAddress = null,
  userAgent = null,
  requestId = null,
}) {
  try {
    await query(
      `
        INSERT INTO content_audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          entity_label,
          before_values,
          after_values,
          ip_address,
          user_agent,
          request_id
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
      `,
      [
        actorUserId,
        action,
        entityType,
        entityId,
        entityLabel,
        beforeValues ? JSON.stringify(beforeValues) : null,
        afterValues ? JSON.stringify(afterValues) : null,
        ipAddress,
        userAgent,
        requestId,
      ],
    )
  } catch (error) {
    // Audit logging must not break the user request path.
    console.error('Failed to write CMS audit log', {
      action,
      entityType,
      requestId,
      error: error.message,
    })
  }
}

function auditContextFromRequest(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    requestId: req.id,
  }
}

module.exports = {
  auditContextFromRequest,
  logAuditEvent,
}

