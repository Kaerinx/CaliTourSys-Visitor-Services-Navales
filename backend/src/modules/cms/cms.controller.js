const service = require('./cms.service')
const validators = require('./cms.validators')
const { paginatedResponse, successResponse } = require('../../utils/apiResponse')
const { setNoStore } = require('../../utils/cacheHeaders')

function parse(schema, value) {
  return schema.parse(value)
}

async function getHealth(req, res, next) {
  try {
    setNoStore(res)
    return successResponse(req, res, await service.getHealth())
  } catch (error) {
    return next(error)
  }
}

async function getDashboard(req, res, next) {
  try {
    setNoStore(res)
    return successResponse(req, res, await service.getDashboard())
  } catch (error) {
    return next(error)
  }
}

async function getNavigation(req, res, next) {
  try {
    setNoStore(res)
    return successResponse(req, res, service.getNavigation(req.user))
  } catch (error) {
    return next(error)
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const filters = parse(validators.auditLogListQuerySchema, req.query)
    const result = await service.listAuditLogs(filters)

    setNoStore(res)
    return paginatedResponse(req, res, result.data, result.pagination)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getDashboard,
  getHealth,
  getNavigation,
  listAuditLogs,
}

