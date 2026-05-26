const service = require('./operations.service')
const validators = require('./operations.validators')
const { paginatedResponse, successResponse } = require('../../../utils/apiResponse')
const { setNoStore } = require('../../../utils/cacheHeaders')

function parse(schema, value) {
  return schema.parse(value)
}

function listHandler(schema, serviceFn) {
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

function idBodyHandler(schema, serviceFn, statusCode = 200) {
  return async (req, res, next) => {
    try {
      const { id } = parse(validators.uuidParamsSchema, req.params)
      const body = parse(schema, req.body || {})
      setNoStore(res)
      return successResponse(req, res, await serviceFn(id, body, req), statusCode)
    } catch (error) {
      return next(error)
    }
  }
}

function idRequestHandler(serviceFn) {
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

module.exports = {
  archiveMedia: idRequestHandler(service.archiveMedia),
  createInquiryResponse: idBodyHandler(validators.inquiryResponseBodySchema, service.createInquiryResponse, 201),
  createMedia: bodyHandler(validators.mediaBodySchema, service.createMedia, 201),
  getAuditLog: detailHandler(service.getAuditLog),
  getInquiry: detailHandler(service.getInquiry),
  getMedia: detailHandler(service.getMedia),
  getUser: detailHandler(service.getUser),
  listAuditLogs: listHandler(validators.auditLogListQuerySchema, service.listAuditLogs),
  listInquiries: listHandler(validators.inquiryListQuerySchema, service.listInquiries),
  listInquiryResponses: detailHandler(service.listInquiryResponses),
  listMedia: listHandler(validators.mediaListQuerySchema, service.listMedia),
  listNewsletterSubscribers: listHandler(validators.newsletterListQuerySchema, service.listNewsletterSubscribers),
  listPermissions: async (req, res, next) => {
    try {
      setNoStore(res)
      const result = await service.listPermissions()
      return successResponse(req, res, result.items)
    } catch (error) {
      return next(error)
    }
  },
  listRoles: async (req, res, next) => {
    try {
      setNoStore(res)
      const result = await service.listRoles()
      return successResponse(req, res, result.items)
    } catch (error) {
      return next(error)
    }
  },
  listUsers: listHandler(validators.userListQuerySchema, service.listUsers),
  updateInquiryStatus: idBodyHandler(validators.inquiryStatusBodySchema, service.updateInquiryStatus),
  updateMedia: idBodyHandler(validators.mediaPatchSchema, service.updateMedia),
  updateNewsletterStatus: idBodyHandler(validators.newsletterStatusBodySchema, service.updateNewsletterStatus),
  updateUserRoles: idBodyHandler(validators.userRolesBodySchema, service.updateUserRoles),
  updateUserStatus: idBodyHandler(validators.userStatusBodySchema, service.updateUserStatus),
}
