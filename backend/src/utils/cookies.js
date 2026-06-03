const { env } = require('../config/env')

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.IS_PRODUCTION ? true : env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.CMS_COOKIE_NAME, refreshToken, getRefreshCookieOptions())
}

function clearRefreshCookie(res) {
  res.clearCookie(env.CMS_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  })
}

function readRefreshToken(req) {
  return req.cookies?.[env.CMS_COOKIE_NAME] || req.body?.refreshToken || null
}

module.exports = {
  clearRefreshCookie,
  readRefreshToken,
  setRefreshCookie,
}

