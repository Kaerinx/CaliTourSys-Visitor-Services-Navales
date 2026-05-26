const repository = require('./operations.repository')
const { buildPaginationMeta, getPagination } = require('../../../utils/pagination')
const { logCmsContentAudit } = require('../../../utils/cmsAudit')

function withPagination(filters, result) {
  const pagination = getPagination(filters)
  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function listMedia(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listMedia(filters, pagination))
}

async function createMedia(data, req) {
  const media = await repository.createMedia(data, req.user.id)
  await logCmsContentAudit({ req, action: 'create', entityType: 'media_asset', entityId: media.id, entityLabel: media.fileName || media.fileUrl, afterValues: media })
  return media
}

async function getMedia(id) {
  const media = await repository.getMediaById(id)
  if (!media) throw notFound('Media asset')
  return media
}

async function updateMedia(id, data, req) {
  const result = await repository.updateMedia(id, data, req.user.id)
  await logCmsContentAudit({ req, action: 'update', entityType: 'media_asset', entityId: result.after.id, entityLabel: result.after.fileName || result.after.fileUrl, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function archiveMedia(id, req) {
  const result = await repository.archiveMedia(id, req.user.id)
  await logCmsContentAudit({ req, action: 'archive', entityType: 'media_asset', entityId: result.after.id, entityLabel: result.after.fileName || result.after.fileUrl, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listInquiries(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listInquiries(filters, pagination))
}

async function getInquiry(id) {
  const inquiry = await repository.getInquiryById(id)
  if (!inquiry) throw notFound('Inquiry')
  return inquiry
}

async function updateInquiryStatus(id, data, req) {
  const result = await repository.updateInquiryStatus(id, data.status)
  await logCmsContentAudit({ req, action: 'update', entityType: 'inquiry', entityId: result.after.id, entityLabel: result.after.subject, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function createInquiryResponse(id, data, req) {
  const response = await repository.createInquiryResponse(id, data, req.user.id)
  await logCmsContentAudit({ req, action: data.status === 'sent' ? 'update' : 'create', entityType: 'inquiry', entityId: id, entityLabel: 'Inquiry response', afterValues: response })
  return response
}

async function listInquiryResponses(id) {
  return { items: await repository.listInquiryResponses(id) }
}

async function listNewsletterSubscribers(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listNewsletterSubscribers(filters, pagination))
}

async function updateNewsletterStatus(id, data, req) {
  const result = await repository.updateNewsletterStatus(id, data.status)
  await logCmsContentAudit({ req, action: 'update', entityType: 'newsletter_subscriber', entityId: result.after.id, entityLabel: result.after.email, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listUsers(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listUsers(filters, pagination))
}

async function getUser(id) {
  const user = await repository.getUserById(id)
  if (!user) throw notFound('User')
  return user
}

async function updateUserStatus(id, data, req) {
  const result = await repository.updateUserStatus(id, data.status)
  await logCmsContentAudit({ req, action: 'update', entityType: 'user', entityId: result.after.id, entityLabel: result.after.email, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listRoles() {
  return { items: await repository.listRoles() }
}

async function listPermissions() {
  return { items: await repository.listPermissions() }
}

async function updateUserRoles(id, data, req) {
  const result = await repository.replaceUserRoles(id, data.roleIds, req.user.id)
  await logCmsContentAudit({ req, action: 'permission_change', entityType: 'user', entityId: result.after.id, entityLabel: result.after.email, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listAuditLogs(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listAuditLogs(filters, pagination))
}

async function getAuditLog(id) {
  const log = await repository.getAuditLogById(id)
  if (!log) throw notFound('Audit log')
  return log
}

function notFound(label) {
  const error = new Error(`${label} not found.`)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = `${label} not found.`
  return error
}

module.exports = {
  archiveMedia,
  createInquiryResponse,
  createMedia,
  getAuditLog,
  getInquiry,
  getMedia,
  getUser,
  listAuditLogs,
  listInquiries,
  listInquiryResponses,
  listMedia,
  listNewsletterSubscribers,
  listPermissions,
  listRoles,
  listUsers,
  updateInquiryStatus,
  updateMedia,
  updateNewsletterStatus,
  updateUserRoles,
  updateUserStatus,
}
