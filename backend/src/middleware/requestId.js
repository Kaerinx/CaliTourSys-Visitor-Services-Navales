const { randomUUID } = require('node:crypto')

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/

function requestId(req, res, next) {
  const incomingRequestId = req.get('x-request-id')
  const safeIncomingRequestId =
    incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId) ? incomingRequestId : null

  req.id = safeIncomingRequestId || `req_${randomUUID()}`
  res.setHeader('X-Request-Id', req.id)

  next()
}

module.exports = { requestId }
