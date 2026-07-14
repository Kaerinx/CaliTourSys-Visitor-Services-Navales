const repository = require('./content.repository')
const { buildPaginationMeta, getPagination } = require('../../../utils/pagination')
const { logCmsContentAudit } = require('../../../utils/cmsAudit')
const { uploadedAssetImages } = require('../../productDevelopment/uploads')

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
  const [image] = uploadedAssetImages(req)
  const event = await repository.createEvent(
    {
      ...data,
      ...(image?.imageUrl ? { primaryImageUrl: image.imageUrl } : {}),
    },
    req.user.id,
  )
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
  const [image] = uploadedAssetImages(req)
  const result = await repository.updateEvent(
    id,
    {
      ...data,
      ...(image?.imageUrl ? { primaryImageUrl: image.imageUrl } : {}),
    },
    req.user.id,
  )
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

function auditLabel(prefix, value) {
  return prefix ? `${prefix}: ${value}` : value
}

async function listProducts(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listProducts(filters, pagination))
}

async function listAccreditedEstablishments(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listAccreditedEstablishments(filters, pagination))
}

async function createProduct(data, req) {
  const [image] = uploadedAssetImages(req)
  const product = await repository.createProduct(data, req.user.id, image)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'product',
    entityId: product.id,
    entityLabel: product.name,
    afterValues: product,
  })
  return product
}

async function getProduct(id) {
  const product = await repository.getProductById(id)
  if (!product) throw createNotFoundError('Product')
  return product
}

async function updateProduct(id, data, req) {
  const [image] = uploadedAssetImages(req)
  const result = await repository.updateProduct(id, data, req.user.id, image)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'product',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function publishProduct(id, req) {
  const result = await repository.publishProduct(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'publish',
    entityType: 'product',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function archiveProduct(id, req) {
  const result = await repository.archiveProduct(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'archive',
    entityType: 'product',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listDestinations(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listDestinations(filters, pagination))
}

async function createDestination(data, req) {
  const destination = await repository.createDestination(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'destination',
    entityId: destination.id,
    entityLabel: destination.name,
    afterValues: destination,
  })
  return destination
}

async function getDestination(id) {
  const destination = await repository.getDestinationById(id)
  if (!destination) throw createNotFoundError('Destination')
  return destination
}

async function updateDestination(id, data, req) {
  const result = await repository.updateDestination(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'destination',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function publishDestination(id, req) {
  const result = await repository.publishDestination(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'publish',
    entityType: 'destination',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function archiveDestination(id, req) {
  const result = await repository.archiveDestination(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'archive',
    entityType: 'destination',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listBusinesses(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listBusinesses(filters, pagination))
}

async function createBusiness(data, req) {
  const business = await repository.createBusiness(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'business',
    entityId: business.id,
    entityLabel: business.name,
    afterValues: business,
  })
  return business
}

async function getBusiness(id) {
  const business = await repository.getBusinessById(id)
  if (!business) throw createNotFoundError('Business')
  return business
}

async function updateBusiness(id, data, req) {
  const result = await repository.updateBusiness(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'business',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listMuseumArtifacts(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listMuseumArtifacts(filters, pagination))
}

async function createMuseumArtifact(data, req) {
  const artifact = await repository.createMuseumArtifact(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'museum_artifact',
    entityId: artifact.id,
    entityLabel: artifact.name,
    afterValues: artifact,
  })
  return artifact
}

async function getMuseumArtifact(id) {
  const artifact = await repository.getMuseumArtifactById(id)
  if (!artifact) throw createNotFoundError('Museum artifact')
  return artifact
}

async function updateMuseumArtifact(id, data, req) {
  const result = await repository.updateMuseumArtifact(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'museum_artifact',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function publishMuseumArtifact(id, req) {
  const result = await repository.publishMuseumArtifact(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'publish',
    entityType: 'museum_artifact',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function archiveMuseumArtifact(id, req) {
  const result = await repository.archiveMuseumArtifact(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'archive',
    entityType: 'museum_artifact',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listMapLocations(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listMapLocations(filters, pagination))
}

async function createMapLocation(data, req) {
  const location = await repository.createMapLocation(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'map_location',
    entityId: location.id,
    entityLabel: location.label,
    afterValues: location,
  })
  return location
}

async function getMapLocation(id) {
  const location = await repository.getMapLocationById(id)
  if (!location) throw createNotFoundError('Map location')
  if (location.locationType === 'event') return location
  return {
    ...location,
    experience: await repository.getMapLocationExperience(id),
  }
}

async function updateMapLocation(id, data, req) {
  const result = await repository.updateMapLocation(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'map_location',
    entityId: result.after.id,
    entityLabel: result.after.label,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function deleteMapLocation(id, req) {
  const result = await repository.deleteMapLocation(id)
  await logCmsContentAudit({
    req,
    action: 'delete',
    entityType: 'map_location',
    entityId: result.before.id,
    entityLabel: auditLabel(null, result.before.label),
    beforeValues: result.before,
  })
  return { id: result.before.id, deleted: true }
}

async function getMapLocationExperienceOptions() {
  return repository.getMapLocationExperienceOptions()
}

async function updateMapLocationExperience(id, data, req) {
  const result = await repository.replaceMapLocationExperience(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'map_location',
    entityId: id,
    entityLabel: result.location.label,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listEmergencyFacilities(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listEmergencyFacilities(filters, pagination))
}

async function createEmergencyFacility(data, req) {
  const facility = await repository.createEmergencyFacility(data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'emergency_facility',
    entityId: facility.id,
    entityLabel: facility.name,
    afterValues: facility,
  })
  return facility
}

async function getEmergencyFacility(id) {
  const facility = await repository.getEmergencyFacilityById(id)
  if (!facility) throw createNotFoundError('Emergency facility')
  return facility
}

async function updateEmergencyFacility(id, data, req) {
  const result = await repository.updateEmergencyFacility(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'emergency_facility',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function publishEmergencyFacility(id, req) {
  const result = await repository.publishEmergencyFacility(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'publish',
    entityType: 'emergency_facility',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function archiveEmergencyFacility(id, req) {
  const result = await repository.archiveEmergencyFacility(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'archive',
    entityType: 'emergency_facility',
    entityId: result.after.id,
    entityLabel: result.after.name,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

module.exports = {
  archiveEmergencyFacility,
  archiveDestination,
  archiveEvent,
  archiveMuseumArtifact,
  archiveProduct,
  archivePromotion,
  createBusiness,
  createCategory,
  createDestination,
  createEvent,
  createEmergencyFacility,
  createMapLocation,
  createMuseumArtifact,
  createProduct,
  createPromotion,
  deleteMapLocation,
  getBusiness,
  getDestination,
  getEvent,
  getEmergencyFacility,
  getMapLocationExperienceOptions,
  getMapLocation,
  getMuseumArtifact,
  getProduct,
  getPromotion,
  listAccreditedEstablishments,
  listBusinesses,
  listCategories,
  listDestinations,
  listEvents,
  listEmergencyFacilities,
  listMapLocations,
  listMuseumArtifacts,
  listProducts,
  listPromotions,
  publishDestination,
  publishEmergencyFacility,
  publishEvent,
  publishMuseumArtifact,
  publishProduct,
  publishPromotion,
  updateBusiness,
  updateCategory,
  updateDestination,
  updateEvent,
  updateEmergencyFacility,
  updateMapLocationExperience,
  updateMapLocation,
  updateMuseumArtifact,
  updateProduct,
  updatePromotion,
}
