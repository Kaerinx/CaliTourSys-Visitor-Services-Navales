const service = require('./content.service')
const validators = require('./content.validators')
const { paginatedResponse, successResponse } = require('../../../utils/apiResponse')
const { setNoStore } = require('../../../utils/cacheHeaders')

function parse(schema, value) {
  return schema.parse(value)
}

function paginatedHandler(schema, serviceFn) {
  return async (req, res, next) => {
    try {
      const filters = parse(schema, req.query)
      const result = await serviceFn(filters)
      setNoStore(res)
      return paginatedResponse(req, res, result.data, result.pagination)
    } catch (error) {
      return next(error)
    }
  }
}

function detailHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const { id } = parse(validators.uuidParamsSchema, req.params)
      setNoStore(res)
      return successResponse(req, res, await serviceFn(id))
    } catch (error) {
      return next(error)
    }
  }
}

function bodyHandler(schema, serviceFn, statusCode = 200) {
  return async (req, res, next) => {
    try {
      const body = parse(schema, req.body || {})
      setNoStore(res)
      return successResponse(req, res, await serviceFn(body, req), statusCode)
    } catch (error) {
      return next(error)
    }
  }
}

function idBodyHandler(schema, serviceFn) {
  return async (req, res, next) => {
    try {
      const { id } = parse(validators.uuidParamsSchema, req.params)
      const body = parse(schema, req.body || {})
      setNoStore(res)
      return successResponse(req, res, await serviceFn(id, body, req))
    } catch (error) {
      return next(error)
    }
  }
}

function stateHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const { id } = parse(validators.uuidParamsSchema, req.params)
      setNoStore(res)
      return successResponse(req, res, await serviceFn(id, req))
    } catch (error) {
      return next(error)
    }
  }
}

function categoryListHandler(kind) {
  return paginatedHandler(validators.categoryListQuerySchema, (filters) =>
    service.listCategories(kind, filters),
  )
}

function categoryCreateHandler(kind) {
  return bodyHandler(
    validators.categoryBodySchema,
    (body, req) => service.createCategory(kind, body, req),
    201,
  )
}

function categoryUpdateHandler(kind) {
  return idBodyHandler(validators.categoryPatchSchema, (id, body, req) =>
    service.updateCategory(kind, id, body, req),
  )
}

module.exports = {
  archiveDestination: stateHandler(service.archiveDestination),
  archiveEvent: stateHandler(service.archiveEvent),
  archiveMuseumArtifact: stateHandler(service.archiveMuseumArtifact),
  archiveProduct: stateHandler(service.archiveProduct),
  archivePromotion: stateHandler(service.archivePromotion),
  createBusiness: bodyHandler(validators.businessBodySchema, service.createBusiness, 201),
  createEvent: bodyHandler(validators.eventBodySchema, service.createEvent, 201),
  createDestination: bodyHandler(validators.destinationBodySchema, service.createDestination, 201),
  createMapLocation: bodyHandler(validators.mapLocationBodySchema, service.createMapLocation, 201),
  createMuseumArtifact: bodyHandler(validators.museumArtifactBodySchema, service.createMuseumArtifact, 201),
  createProduct: bodyHandler(validators.productBodySchema, service.createProduct, 201),
  createPromotion: bodyHandler(validators.promotionBodySchema, service.createPromotion, 201),
  deleteMapLocation: stateHandler(service.deleteMapLocation),
  getBusiness: detailHandler(service.getBusiness),
  getDestination: detailHandler(service.getDestination),
  getEvent: detailHandler(service.getEvent),
  getMapLocation: detailHandler(service.getMapLocation),
  getMuseumArtifact: detailHandler(service.getMuseumArtifact),
  getProduct: detailHandler(service.getProduct),
  getPromotion: detailHandler(service.getPromotion),
  listBusinesses: paginatedHandler(validators.businessListQuerySchema, service.listBusinesses),
  listDestinations: paginatedHandler(validators.destinationListQuerySchema, service.listDestinations),
  listEvents: paginatedHandler(validators.eventListQuerySchema, service.listEvents),
  listMapLocations: paginatedHandler(validators.mapLocationListQuerySchema, service.listMapLocations),
  listMuseumArtifacts: paginatedHandler(validators.museumArtifactListQuerySchema, service.listMuseumArtifacts),
  listProducts: paginatedHandler(validators.productListQuerySchema, service.listProducts),
  listPromotions: paginatedHandler(validators.promotionListQuerySchema, service.listPromotions),
  publishDestination: stateHandler(service.publishDestination),
  publishEvent: stateHandler(service.publishEvent),
  publishMuseumArtifact: stateHandler(service.publishMuseumArtifact),
  publishProduct: stateHandler(service.publishProduct),
  publishPromotion: stateHandler(service.publishPromotion),
  updateBusiness: idBodyHandler(validators.businessPatchSchema, service.updateBusiness),
  updateDestination: idBodyHandler(validators.destinationPatchSchema, service.updateDestination),
  updateEvent: idBodyHandler(validators.eventPatchSchema, service.updateEvent),
  updateMapLocation: idBodyHandler(validators.mapLocationPatchSchema, service.updateMapLocation),
  updateMuseumArtifact: idBodyHandler(validators.museumArtifactPatchSchema, service.updateMuseumArtifact),
  updateProduct: idBodyHandler(validators.productPatchSchema, service.updateProduct),
  updatePromotion: idBodyHandler(validators.promotionPatchSchema, service.updatePromotion),

  createArtifactCategory: categoryCreateHandler('artifact'),
  createDestinationCategory: categoryCreateHandler('destination'),
  createEventCategory: categoryCreateHandler('event'),
  createProductCategory: categoryCreateHandler('product'),
  listArtifactCategories: categoryListHandler('artifact'),
  listDestinationCategories: categoryListHandler('destination'),
  listEventCategories: categoryListHandler('event'),
  listProductCategories: categoryListHandler('product'),
  updateArtifactCategory: categoryUpdateHandler('artifact'),
  updateDestinationCategory: categoryUpdateHandler('destination'),
  updateEventCategory: categoryUpdateHandler('event'),
  updateProductCategory: categoryUpdateHandler('product'),
}
