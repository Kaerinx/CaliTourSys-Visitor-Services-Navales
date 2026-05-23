const service = require('./public.service')
const validators = require('./public.validators')
const { successResponse, paginatedResponse } = require('../../utils/apiResponse')
const {
  setMapCache,
  setNoStore,
  setPrivateNoStore,
  setPublicReadCache,
} = require('../../utils/cacheHeaders')

function parse(schema, value) {
  return schema.parse(value)
}

async function getHome(req, res, next) {
  try {
    setPublicReadCache(res)
    return successResponse(req, res, await service.getHome())
  } catch (error) {
    return next(error)
  }
}

function paginatedHandler(schema, serviceFn, cacheFn = setPublicReadCache) {
  return async (req, res, next) => {
    try {
      const filters = parse(schema, req.query)
      const result = await serviceFn(filters)
      cacheFn(res)
      return paginatedResponse(req, res, result.data, result.pagination)
    } catch (error) {
      return next(error)
    }
  }
}

function detailHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const { slug } = parse(validators.slugParamsSchema, req.params)
      setPublicReadCache(res)
      return successResponse(req, res, await serviceFn(slug))
    } catch (error) {
      return next(error)
    }
  }
}

function categoryHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      setPublicReadCache(res)
      return successResponse(req, res, await serviceFn())
    } catch (error) {
      return next(error)
    }
  }
}

async function listMapLocations(req, res, next) {
  try {
    const filters = parse(validators.mapLocationsQuerySchema, req.query)
    setMapCache(res)
    return successResponse(req, res, await service.listMapLocations(filters))
  } catch (error) {
    return next(error)
  }
}

async function createItinerarySession(req, res, next) {
  try {
    const body = parse(validators.createItinerarySessionBodySchema, req.body || {})
    setPrivateNoStore(res)
    return successResponse(req, res, await service.createItinerarySession(body), 201)
  } catch (error) {
    return next(error)
  }
}

async function getItinerary(req, res, next) {
  try {
    const { sessionToken } = parse(validators.sessionTokenParamsSchema, req.params)
    setPrivateNoStore(res)
    return successResponse(req, res, await service.getItineraryByToken(sessionToken))
  } catch (error) {
    return next(error)
  }
}

async function addItineraryItem(req, res, next) {
  try {
    const { sessionToken } = parse(validators.sessionTokenParamsSchema, req.params)
    const body = parse(validators.createItineraryItemBodySchema, req.body || {})
    const result = await service.addItineraryItem(sessionToken, body)

    setPrivateNoStore(res)
    return successResponse(req, res, result.data, result.statusCode)
  } catch (error) {
    return next(error)
  }
}

async function deleteItineraryItem(req, res, next) {
  try {
    const { sessionToken, itemId } = parse(validators.itineraryItemParamsSchema, req.params)
    await service.deleteItineraryItem(sessionToken, itemId)

    setPrivateNoStore(res)
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

async function createInquiry(req, res, next) {
  try {
    const body = parse(validators.createInquiryBodySchema, req.body || {})
    setNoStore(res)
    return successResponse(req, res, await service.createInquiry(body), 201)
  } catch (error) {
    return next(error)
  }
}

async function createNewsletterSubscription(req, res, next) {
  try {
    const body = parse(validators.createNewsletterSubscriptionBodySchema, req.body || {})
    const result = await service.createNewsletterSubscription(body)

    setNoStore(res)
    return successResponse(req, res, result.data, result.statusCode)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getHome,
  listPromotions: paginatedHandler(validators.promotionListQuerySchema, service.listPromotions),
  getPromotionBySlug: detailHandler(service.getPromotionBySlug),
  listEvents: paginatedHandler(validators.eventListQuerySchema, service.listEvents),
  getEventBySlug: detailHandler(service.getEventBySlug),
  listEventCategories: categoryHandler(service.listEventCategories),
  listProducts: paginatedHandler(validators.productListQuerySchema, service.listProducts),
  getProductBySlug: detailHandler(service.getProductBySlug),
  listProductCategories: categoryHandler(service.listProductCategories),
  getBusinessBySlug: detailHandler(service.getBusinessBySlug),
  listDestinations: paginatedHandler(validators.destinationListQuerySchema, service.listDestinations),
  getDestinationBySlug: detailHandler(service.getDestinationBySlug),
  listDestinationCategories: categoryHandler(service.listDestinationCategories),
  listMapLocations,
  listMuseumArtifacts: paginatedHandler(
    validators.museumArtifactListQuerySchema,
    service.listMuseumArtifacts,
  ),
  getMuseumArtifactBySlug: detailHandler(service.getMuseumArtifactBySlug),
  listMuseumCategories: categoryHandler(service.listMuseumCategories),
  createItinerarySession,
  getItinerary,
  addItineraryItem,
  deleteItineraryItem,
  createInquiry,
  createNewsletterSubscription,
}
