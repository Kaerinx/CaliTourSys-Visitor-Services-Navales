const jwt = require('jsonwebtoken')
const repository = require('../modules/touristAuth/touristAuth.repository')
const { verifyAccessToken } = require('../utils/tokens')

function createAuthError(statusCode, code, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.publicMessage = message
  return error
}

function extractBearerToken(req) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' && token ? token : null
}

async function resolveTouristFromRequest(req) {
  const token = extractBearerToken(req)
  if (!token) return null

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createAuthError(401, 'TOKEN_EXPIRED', 'Tourist session has expired.')
    }

    throw createAuthError(401, 'UNAUTHENTICATED', 'Tourist session is invalid.')
  }

  const tourist = await repository.findById(payload.sub)
  if (!tourist || tourist.status !== 'active') {
    throw createAuthError(401, 'UNAUTHENTICATED', 'Tourist account was not found.')
  }

  return {
    id: tourist.id,
    email: tourist.email,
    fullName: tourist.fullName,
    phoneNumber: tourist.phoneNumber || '',
  }
}

async function authenticateTourist(req, _res, next) {
  try {
    req.tourist = await resolveTouristFromRequest(req)
    if (!req.tourist) throw createAuthError(401, 'UNAUTHENTICATED', 'Tourist authentication is required.')
    return next()
  } catch (error) {
    return next(error)
  }
}

async function optionalTourist(req, _res, next) {
  try {
    req.tourist = await resolveTouristFromRequest(req)
  } catch {
    req.tourist = null
  }

  return next()
}

module.exports = {
  authenticateTourist,
  optionalTourist,
}
