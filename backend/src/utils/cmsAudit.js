const { auditContextFromRequest, logAuditEvent } = require('./auditLogger')

async function logCmsContentAudit({
  req,
  action,
  entityType,
  entityId,
  entityLabel,
  beforeValues = null,
  afterValues = null,
}) {
  await logAuditEvent({
    ...auditContextFromRequest(req),
    actorUserId: req.user?.id || null,
    action,
    entityType,
    entityId,
    entityLabel,
    beforeValues,
    afterValues,
  })
}

module.exports = {
  logCmsContentAudit,
}

