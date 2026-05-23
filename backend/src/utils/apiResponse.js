function createMeta(req, extra = {}) {
  return {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...extra,
  }
}

function successResponse(req, res, data, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: createMeta(req, meta),
  })
}

function paginatedResponse(req, res, data, pagination, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: createMeta(req, {
      ...meta,
      pagination,
    }),
  })
}

function errorResponse(req, res, statusCode, code, message, details = []) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: createMeta(req),
  })
}

module.exports = {
  successResponse,
  paginatedResponse,
  errorResponse,
}
