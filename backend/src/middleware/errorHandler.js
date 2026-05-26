const { ZodError } = require('zod')
const { env } = require('../config/env')
const { errorResponse } = require('../utils/apiResponse')

function normalizeError(error) {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: error.issues,
    }
  }

  if (error?.type === 'entity.too.large') {
    return {
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body is too large.',
      details: [],
    }
  }

  if (error?.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request body must be valid JSON.',
      details: [],
    }
  }

  const statusCode = Number(error?.statusCode || error?.status || 500)

  return {
    statusCode: statusCode >= 400 && statusCode <= 599 ? statusCode : 500,
    code: error?.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: error?.publicMessage || error?.message || 'An unexpected error occurred.',
    details: Array.isArray(error?.details) ? error.details : [],
  }
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  const normalized = normalizeError(error)
  const message =
    env.IS_PRODUCTION && normalized.statusCode >= 500
      ? 'An unexpected error occurred.'
      : normalized.message

  req.log?.error(
    {
      err: error,
      requestId: req.id,
      statusCode: normalized.statusCode,
      code: normalized.code,
    },
    'Request failed',
  )

  return errorResponse(
    req,
    res,
    normalized.statusCode,
    normalized.code,
    message,
    normalized.statusCode >= 500 && env.IS_PRODUCTION ? [] : normalized.details,
  )
}

module.exports = { errorHandler }
