const repository = require('./touristAuth.repository')
const { hashPassword, verifyPassword } = require('../../utils/password')
const { createAccessToken } = require('../../utils/tokens')

function createAuthError(statusCode, code, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.publicMessage = message
  return error
}

function publicTourist(tourist) {
  return {
    id: tourist.id,
    fullName: tourist.fullName,
    email: tourist.email,
    phoneNumber: tourist.phoneNumber || '',
    status: tourist.status,
    createdAt: tourist.createdAt,
  }
}

function assertCanAuthenticate(tourist) {
  if (!tourist || tourist.status !== 'active') {
    throw createAuthError(403, 'ACCOUNT_INACTIVE', 'Tourist account is not active.')
  }
}

function createTouristToken(tourist) {
  return createAccessToken({
    id: tourist.id,
    email: tourist.email,
    roles: ['tourist'],
    permissions: [],
  })
}

async function register(body) {
  const existing = await repository.findByEmail(body.email)
  if (existing) {
    throw createAuthError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email address.')
  }

  const tourist = await repository.createTouristAccount({
    fullName: body.fullName,
    email: body.email,
    phoneNumber: body.phoneNumber || '',
    passwordHash: await hashPassword(body.password),
  })

  return {
    accessToken: createTouristToken(tourist),
    tourist: publicTourist(tourist),
  }
}

async function login(body) {
  const genericError = createAuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.')
  const tourist = await repository.findByEmail(body.email)

  if (!tourist) throw genericError
  assertCanAuthenticate(tourist)

  const passwordMatches = await verifyPassword(body.password, tourist.passwordHash)
  if (!passwordMatches) throw genericError

  await repository.markSuccessfulLogin(tourist.id)

  return {
    accessToken: createTouristToken(tourist),
    tourist: publicTourist(tourist),
  }
}

async function me(touristId) {
  const tourist = await repository.findById(touristId)
  assertCanAuthenticate(tourist)
  return publicTourist(tourist)
}

async function updateProfile(touristId, body) {
  const tourist = await repository.findById(touristId)
  assertCanAuthenticate(tourist)

  const updated = await repository.updateProfile(touristId, body)
  return publicTourist(updated)
}

async function changePassword(touristId, body) {
  const tourist = await repository.findById(touristId)
  assertCanAuthenticate(tourist)

  const passwordMatches = await verifyPassword(body.currentPassword, tourist.passwordHash)
  if (!passwordMatches) {
    throw createAuthError(401, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect.')
  }

  const passwordHash = await hashPassword(body.newPassword)
  await repository.updatePasswordHash(touristId, passwordHash)
  return { passwordChanged: true }
}

module.exports = {
  changePassword,
  login,
  me,
  publicTourist,
  register,
  updateProfile,
}
