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
  archiveEvent: stateHandler(service.archiveEvent),
  archivePromotion: stateHandler(service.archivePromotion),
  createEvent: bodyHandler(validators.eventBodySchema, service.createEvent, 201),
  createPromotion: bodyHandler(validators.promotionBodySchema, service.createPromotion, 201),
  getEvent: detailHandler(service.getEvent),
  getPromotion: detailHandler(service.getPromotion),
  listEvents: paginatedHandler(validators.eventListQuerySchema, service.listEvents),
  listPromotions: paginatedHandler(validators.promotionListQuerySchema, service.listPromotions),
  publishEvent: stateHandler(service.publishEvent),
  publishPromotion: stateHandler(service.publishPromotion),
  updateEvent: idBodyHandler(validators.eventPatchSchema, service.updateEvent),
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

