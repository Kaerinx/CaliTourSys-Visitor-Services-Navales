const { errorResponse } = require('../utils/apiResponse')

function notFound(req, res) {
  return errorResponse(req, res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`)
}

module.exports = { notFound }
