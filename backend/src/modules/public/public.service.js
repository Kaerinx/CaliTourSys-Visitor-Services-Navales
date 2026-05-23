const repository = require('./public.repository')
const { getPagination, buildPaginationMeta } = require('../../utils/pagination')

function createNotFoundError(message) {
  const error = new Error(message)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = message
  return error
}

async function getHome() {
  return repository.getHome()
}

async function listProducts(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listProducts(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getProductBySlug(slug) {
  const product = await repository.getProductBySlug(slug)
  if (!product) throw createNotFoundError('Product not found.')
  return product
}

async function listEvents(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listEvents(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getEventBySlug(slug) {
  const event = await repository.getEventBySlug(slug)
  if (!event) throw createNotFoundError('Event not found.')
  return event
}

async function listDestinations(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listDestinations(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getDestinationBySlug(slug) {
  const destination = await repository.getDestinationBySlug(slug)
  if (!destination) throw createNotFoundError('Destination not found.')
  return destination
}

async function listMuseumArtifacts(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listMuseumArtifacts(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getMuseumArtifactBySlug(slug) {
  const artifact = await repository.getMuseumArtifactBySlug(slug)
  if (!artifact) throw createNotFoundError('Museum artifact not found.')
  return artifact
}

async function listPromotions(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listPromotions(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getPromotionBySlug(slug) {
  const promotion = await repository.getPromotionBySlug(slug)
  if (!promotion) throw createNotFoundError('Promotion not found.')
  return promotion
}

async function getBusinessBySlug(slug) {
  const business = await repository.getBusinessBySlug(slug)
  if (!business) throw createNotFoundError('Business not found.')
  return business
}

async function listMapLocations(filters) {
  const locations = await repository.listMapLocations(filters)

  if (filters.format === 'geojson') {
    return {
      type: 'FeatureCollection',
      features: locations.map((location) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        properties: {
          id: location.id,
          locationType: location.locationType,
          slug: location.slug,
          label: location.label,
          category: location.category,
          markerColor: location.markerColor,
          markerIcon: location.markerIcon,
          primaryImage: location.primaryImage,
          description: location.description,
        },
      })),
    }
  }

  return locations
}

function listProductCategories() {
  return repository.listCategories('product_categories')
}

function listEventCategories() {
  return repository.listCategories('event_categories')
}

function listDestinationCategories() {
  return repository.listCategories('destination_categories')
}

function listMuseumCategories() {
  return repository.listCategories('artifact_categories')
}

module.exports = {
  getHome,
  listProducts,
  getProductBySlug,
  listEvents,
  getEventBySlug,
  listDestinations,
  getDestinationBySlug,
  listMuseumArtifacts,
  getMuseumArtifactBySlug,
  listPromotions,
  getPromotionBySlug,
  getBusinessBySlug,
  listMapLocations,
  listProductCategories,
  listEventCategories,
  listDestinationCategories,
  listMuseumCategories,
}
