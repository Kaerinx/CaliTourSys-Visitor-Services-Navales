const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

function hashRefreshToken(refreshToken) {
  return crypto.createHash('sha256').update(refreshToken).digest('hex')
}

function getRefreshTokenExpiry() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS)
  return expiresAt
}

function createAccessToken(user) {
  return jwt.sign(
    {
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: user.id,
      expiresIn: env.ACCESS_TOKEN_TTL,
    },
  )
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET)
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
  verifyAccessToken,
}

