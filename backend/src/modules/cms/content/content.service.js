const repository = require('./content.repository')
const { buildPaginationMeta, getPagination } = require('../../../utils/pagination')
const { logCmsContentAudit } = require('../../../utils/cmsAudit')

function createNotFoundError(label) {
  const error = new Error(`${label} not found.`)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = `${label} not found.`
  return error
}

function withPagination(filters, result) {
  const pagination = getPagination(filters)
  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function listPromotions(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listPromotions(filters, pagination))
}

async function createPromotion(data, req) {
  const promotion = await repository.createPromotion(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'promotion',
    entityId: promotion.id,
    entityLabel: promotion.title,
    afterValues: promotion,
  })
  return promotion
}

async function getPromotion(id) {
  const promotion = await repository.getPromotionById(id)
  if (!promotion) throw createNotFoundError('Promotion')
  return promotion
}

async function updatePromotion(id, data, req) {
  const result = await repository.updatePromotion(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'promotion',
    entityId: result.after.id,
    entityLabel: result.after.title,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function publishPromotion(id, req) {
  const result = await repository.publishPromotion(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'publish',
    entityType: 'promotion',
    entityId: result.after.id,
    entityLabel: result.after.title,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function archivePromotion(id, req) {
  const result = await repository.archivePromotion(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'archive',
    entityType: 'promotion',
    entityId: result.after.id,
    entityLabel: result.after.title,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listEvents(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listEvents(filters, pagination))
}

async function createEvent(data, req) {
  const event = await repository.createEvent(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'event',
    entityId: event.id,
    entityLabel: event.title,
    afterValues: event,
  })
  return event
}

async function getEvent(id) {
  const event = await repository.getEventById(id)
  if (!event) throw createNotFoundError('Event')
  return event
}

async function updateEvent(id, data, req) {
  const result = await repository.updateEvent(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'event',
    entityId: result.after.id,
    entityLabel: result.after.title,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function publishEvent(id, req) {
  const result = await repository.publishEvent(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'publish',
    entityType: 'event',
    entityId: result.after.id,
    entityLabel: result.after.title,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function archiveEvent(id, req) {
  const result = await repository.archiveEvent(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'archive',
    entityType: 'event',
    entityId: result.after.id,
    entityLabel: result.after.title,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listCategories(kind, filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listCategories(kind, filters, pagination))
}

async function createCategory(kind, data, req) {
  const category = await repository.createCategory(kind, data)
  const config = repository.getCategoryConfig(kind)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: config.auditEntityType,
    entityId: category.id,
    entityLabel: `Category: ${category.name}`,
    afterValues: category,
  })
  return category
}

async function updateCategory(kind, id, data, req) {
  const result = await repository.updateCategory(kind, id, data)
  const config = repository.getCategoryConfig(kind)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: config.auditEntityType,
    entityId: result.after.id,
    entityLabel: `Category: ${result.after.name}`,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

module.exports = {
  archiveEvent,
  archivePromotion,
  createCategory,
  createEvent,
  createPromotion,
  getEvent,
  getPromotion,
  listCategories,
  listEvents,
  listPromotions,
  publishEvent,
  publishPromotion,
  updateCategory,
  updateEvent,
  updatePromotion,
}

