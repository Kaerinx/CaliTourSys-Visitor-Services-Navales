const { env } = require('../../config/env')
const repository = require('./auth.repository')
const { hashPassword, verifyPassword } = require('../../utils/password')
const {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} = require('../../utils/tokens')
const { auditContextFromRequest, logAuditEvent } = require('../../utils/auditLogger')

function createAuthError(statusCode, code, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.publicMessage = message
  return error
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    profile: user.profile,
    roles: user.roles || [],
    permissions: user.permissions || [],
  }
}

function isTemporarilyLocked(user) {
  return user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()
}

function assertCanAuthenticate(user) {
  if (!user || user.status === 'inactive') {
    throw createAuthError(403, 'ACCOUNT_INACTIVE', 'Account is not active.')
  }

  if (user.status === 'pending') {
    throw createAuthError(403, 'ACCOUNT_INACTIVE', 'Account is not active.')
  }

  if (user.status === 'locked' || isTemporarilyLocked(user)) {
    throw createAuthError(423, 'ACCOUNT_LOCKED', 'Account is locked. Please try again later.')
  }
}

async function login({ identifier, password }, req) {
  const auditContext = auditContextFromRequest(req)
  const genericError = createAuthError(401, 'INVALID_CREDENTIALS', 'Invalid username/email or password.')
  const user = await repository.findUserByIdentifier(identifier)

  if (!user) {
    await logAuditEvent({
      ...auditContext,
      action: 'failed_login',
      entityType: 'user',
      entityLabel: identifier,
    })
    throw genericError
  }

  try {
    assertCanAuthenticate(user)
  } catch (error) {
    await logAuditEvent({
      ...auditContext,
      actorUserId: user.id,
      action: 'failed_login',
      entityType: 'user',
      entityId: user.id,
      entityLabel: user.email,
    })
    throw error
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash)

  if (!passwordMatches) {
    const nextFailedCount = Number(user.failedLoginCount || 0) + 1
    let lockedUntil = null

    if (nextFailedCount >= env.LOGIN_RATE_LIMIT_MAX) {
      lockedUntil = new Date(Date.now() + env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    }

    await repository.incrementFailedLogin(user.id, lockedUntil)
    await logAuditEvent({
      ...auditContext,
      actorUserId: user.id,
      action: 'failed_login',
      entityType: 'user',
      entityId: user.id,
      entityLabel: user.email,
    })
    throw genericError
  }

  await repository.resetSuccessfulLogin(user.id)
  const authUser = await repository.getUserAuthContext(user.id)
  const accessToken = createAccessToken(authUser)
  const refreshToken = createRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken)
  const expiresAt = getRefreshTokenExpiry()

  await repository.createAuthSession({
    userId: user.id,
    refreshTokenHash,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    expiresAt,
  })

  await logAuditEvent({
    ...auditContext,
    actorUserId: user.id,
    action: 'login',
    entityType: 'user',
    entityId: user.id,
    entityLabel: user.email,
  })

  return {
    accessToken,
    refreshToken,
    user: publicUser(authUser),
  }
}

async function refresh(refreshToken, req) {
  if (!refreshToken) {
    throw createAuthError(401, 'UNAUTHENTICATED', 'Refresh token is required.')
  }

  const refreshTokenHash = hashRefreshToken(refreshToken)
  const session = await repository.findSessionByRefreshTokenHash(refreshTokenHash)

  if (!session) {
    throw createAuthError(401, 'UNAUTHENTICATED', 'Refresh session was not found.')
  }

  if (session.status === 'revoked') {
    throw createAuthError(401, 'SESSION_REVOKED', 'Refresh session has been revoked.')
  }

  if (session.status === 'expired' || new Date(session.expires_at).getTime() <= Date.now()) {
    throw createAuthError(401, 'TOKEN_EXPIRED', 'Refresh session has expired.')
  }

  const user = await repository.getUserAuthContext(session.user_id)
  assertCanAuthenticate(user)

  const nextRefreshToken = createRefreshToken()
  const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken)
  await repository.rotateAuthSession({
    sessionId: session.id,
    refreshTokenHash: nextRefreshTokenHash,
    expiresAt: getRefreshTokenExpiry(),
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  })

  return {
    accessToken: createAccessToken(user),
    refreshToken: nextRefreshToken,
    user: publicUser(user),
  }
}

async function logout(refreshToken, req) {
  let actorUserId = req.user?.id || null
  let entityLabel = req.user?.email || null

  if (refreshToken) {
    const session = await repository.revokeSessionByRefreshTokenHash(hashRefreshToken(refreshToken))
    if (session && !actorUserId) {
      actorUserId = session.user_id
    }
  }

  await logAuditEvent({
    ...auditContextFromRequest(req),
    actorUserId,
    action: 'logout',
    entityType: 'user',
    entityId: actorUserId,
    entityLabel,
  })

  return { loggedOut: true }
}

async function getMe(userId) {
  const user = await repository.getUserAuthContext(userId)
  assertCanAuthenticate(user)
  return publicUser(user)
}

async function changePassword(userId, { currentPassword, newPassword }, req) {
  const user = await repository.getUserAuthContext(userId)
  assertCanAuthenticate(user)

  const passwordMatches = await verifyPassword(currentPassword, user.passwordHash)
  if (!passwordMatches) {
    throw createAuthError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.')
  }

  const passwordHash = await hashPassword(newPassword)
  await repository.updatePassword(user.id, passwordHash)
  await repository.revokeOtherSessions(user.id, req.authSessionId || '00000000-0000-0000-0000-000000000000')

  await logAuditEvent({
    ...auditContextFromRequest(req),
    actorUserId: user.id,
    action: 'password_change',
    entityType: 'user',
    entityId: user.id,
    entityLabel: user.email,
  })

  return { passwordChanged: true }
}

module.exports = {
  changePassword,
  getMe,
  login,
  logout,
  publicUser,
  refresh,
}

