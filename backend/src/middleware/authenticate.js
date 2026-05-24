const jwt = require('jsonwebtoken')
const repository = require('../modules/auth/auth.repository')
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

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

function isTemporarilyLocked(user) {
  return user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()
}

async function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      throw createAuthError(401, 'UNAUTHENTICATED', 'Authentication is required.')
    }

    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createAuthError(401, 'TOKEN_EXPIRED', 'Access token has expired.')
      }

      throw createAuthError(401, 'UNAUTHENTICATED', 'Access token is invalid.')
    }

    const user = await repository.getUserAuthContext(payload.sub)
    if (!user) {
      throw createAuthError(401, 'UNAUTHENTICATED', 'Authenticated user was not found.')
    }

    if (user.status === 'inactive' || user.status === 'pending') {
      throw createAuthError(403, 'ACCOUNT_INACTIVE', 'Account is not active.')
    }

    if (user.status === 'locked' || isTemporarilyLocked(user)) {
      throw createAuthError(423, 'ACCOUNT_LOCKED', 'Account is locked. Please try again later.')
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles || [],
      permissions: user.permissions || [],
      profile: user.profile,
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = { authenticate }

