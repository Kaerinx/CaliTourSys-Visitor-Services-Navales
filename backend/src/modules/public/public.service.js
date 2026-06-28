const repository = require('./public.repository')
const { getPagination, buildPaginationMeta } = require('../../utils/pagination')
const { createPublicSessionToken } = require('../../utils/token')

function createNotFoundError(message) {
  const error = new Error(message)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = message
  return error
}

function createConflictError(message) {
  const error = new Error(message)
  error.statusCode = 409
  error.code = 'CONFLICT'
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

async function listPackages(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listPackages(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getPackageBySlug(slug) {
  const tourismPackage = await repository.getPackageBySlug(slug)
  if (!tourismPackage) throw createNotFoundError('Package not found.')
  return tourismPackage
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

async function listAccreditedBusinesses(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listAccreditedBusinesses(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
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

async function createItinerarySession(body) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await repository.createItinerarySession({
        sessionToken: createPublicSessionToken(),
        visitorLabel: body.visitorLabel,
      })
    } catch (error) {
      if (error.code !== '23505') throw error
    }
  }

  throw createConflictError('Unable to create itinerary session. Please try again.')
}

async function getItineraryByToken(sessionToken) {
  const itinerary = await repository.getItineraryByToken(sessionToken)
  if (!itinerary) throw createNotFoundError('Itinerary session not found.')
  return itinerary
}

async function addItineraryItem(sessionToken, body) {
  const target = await repository.getPublicTarget(body.itemType, body.targetId)
  if (!target) throw createNotFoundError('Public itinerary target not found.')

  const existing = await repository.getExistingItineraryItem(sessionToken, body.itemType, body.targetId)
  if (existing) {
    const item = await repository.getItineraryItemById(sessionToken, existing.id)
    if (!item) throw createNotFoundError('Itinerary session not found.')

    return {
      data: item,
      statusCode: 200,
      duplicateBehavior: 'idempotent',
    }
  }

  try {
    const item = await repository.createItineraryItem({
      sessionToken,
      itemType: body.itemType,
      targetId: body.targetId,
      titleSnapshot: target.title,
    })

    if (!item) throw createNotFoundError('Itinerary session not found.')

    return {
      data: item,
      statusCode: 201,
      duplicateBehavior: 'created',
    }
  } catch (error) {
    if (error.code === '23505') {
      const duplicate = await repository.getExistingItineraryItem(sessionToken, body.itemType, body.targetId)
      if (duplicate) {
        return {
          data: await repository.getItineraryItemById(sessionToken, duplicate.id),
          statusCode: 200,
          duplicateBehavior: 'idempotent',
        }
      }
    }

    throw error
  }
}

async function deleteItineraryItem(sessionToken, itemId) {
  const wasDeleted = await repository.deleteItineraryItem({ sessionToken, itemId })
  if (!wasDeleted) throw createNotFoundError('Itinerary item not found.')
}

async function createInquiry(body) {
  return repository.createInquiry(body)
}

async function createNewsletterSubscription(body) {
  const result = await repository.createNewsletterSubscription(body)

  return {
    data: {
      email: result.email,
      status: result.status,
      subscribedAt: result.subscribedAt,
    },
    statusCode: result.wasExisting ? 200 : 201,
  }
}

module.exports = {
  getHome,
  listProducts,
  getProductBySlug,
  listPackages,
  getPackageBySlug,
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
  listProductCategories,
  listEventCategories,
  listDestinationCategories,
  listMuseumCategories,
  createItinerarySession,
  getItineraryByToken,
  addItineraryItem,
  deleteItineraryItem,
  createInquiry,
  createNewsletterSubscription,
}
