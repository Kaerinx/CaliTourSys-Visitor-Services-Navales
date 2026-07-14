const service = require('./public.service')
const validators = require('./public.validators')
const { uploadedPaymentProof } = require('./paymentProofUploads')
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

function detailHandler(serviceFn, cacheFn = setPublicReadCache) {
  return async (req, res, next) => {
    try {
      const { slug } = parse(validators.slugParamsSchema, req.params)
      cacheFn(res)
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

async function listEmergencyFacilities(req, res, next) {
  try {
    setMapCache(res)
    return successResponse(req, res, await service.listEmergencyFacilities())
  } catch (error) {
    return next(error)
  }
}

async function getMapLocationDetails(req, res, next) {
  try {
    const { id } = parse(validators.mapLocationParamsSchema, req.params)
    setMapCache(res)
    return successResponse(req, res, await service.getMapLocationDetails(id))
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

async function createPackageBookingRequest(req, res, next) {
  try {
    const body = parse(validators.createPackageBookingRequestBodySchema, req.body || {})
    setNoStore(res)
    return successResponse(
      req,
      res,
      await service.createPackageBookingRequest(body, { touristAccountId: req.tourist?.id || null }),
      201,
    )
  } catch (error) {
    return next(error)
  }
}

async function lookupPackageBookingRequest(req, res, next) {
  try {
    const body = parse(validators.lookupPackageBookingRequestBodySchema, req.body || {})
    setNoStore(res)
    return successResponse(req, res, await service.lookupPackageBookingRequest(body))
  } catch (error) {
    return next(error)
  }
}

async function uploadPackageBookingPaymentProof(req, res, next) {
  try {
    const { requestId } = parse(validators.packageBookingRequestParamsSchema, req.params)
    const proof = uploadedPaymentProof(req)
    setNoStore(res)
    return successResponse(
      req,
      res,
      await service.uploadPackageBookingPaymentProof(
        requestId,
        proof,
        req.body || {},
        { touristAccountId: req.tourist?.id || null },
      ),
    )
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
  listPackages: paginatedHandler(validators.packageListQuerySchema, service.listPackages, setNoStore),
  getPackageBySlug: detailHandler(service.getPackageBySlug, setNoStore),
  createPackageBookingRequest,
  lookupPackageBookingRequest,
  uploadPackageBookingPaymentProof,
  listTourismAssets: paginatedHandler(validators.tourismAssetListQuerySchema, service.listTourismAssets),
  listProductCategories: categoryHandler(service.listProductCategories),
  listAccreditedBusinesses: paginatedHandler(
    validators.businessListQuerySchema,
    service.listAccreditedBusinesses,
  ),
  getBusinessBySlug: detailHandler(service.getBusinessBySlug),
  listDestinations: paginatedHandler(validators.destinationListQuerySchema, service.listDestinations),
  getDestinationBySlug: detailHandler(service.getDestinationBySlug),
  listDestinationCategories: categoryHandler(service.listDestinationCategories),
  listMapLocations,
  listEmergencyFacilities,
  getMapLocationDetails,
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
