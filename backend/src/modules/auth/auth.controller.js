const service = require('./auth.service')
const validators = require('./auth.validators')
const { successResponse } = require('../../utils/apiResponse')
const { setNoStore, setPrivateNoStore } = require('../../utils/cacheHeaders')
const { clearRefreshCookie, readRefreshToken, setRefreshCookie } = require('../../utils/cookies')

function parse(schema, value) {
  return schema.parse(value)
}

async function login(req, res, next) {
  try {
    const body = parse(validators.loginBodySchema, req.body || {})
    const result = await service.login(body, req)

    setRefreshCookie(res, result.refreshToken)
    setPrivateNoStore(res)

    return successResponse(req, res, {
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (error) {
    return next(error)
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = readRefreshToken(req)
    const result = await service.logout(refreshToken, req)

    clearRefreshCookie(res)
    setPrivateNoStore(res)

    return successResponse(req, res, result)
  } catch (error) {
    return next(error)
  }
}

async function refresh(req, res, next) {
  try {
    parse(validators.refreshBodySchema, req.body || {})
    const result = await service.refresh(readRefreshToken(req), req)

    setRefreshCookie(res, result.refreshToken)
    setPrivateNoStore(res)

    return successResponse(req, res, {
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (error) {
    return next(error)
  }
}

async function me(req, res, next) {
  try {
    setNoStore(res)
    return successResponse(req, res, await service.getMe(req.user.id))
  } catch (error) {
    return next(error)
  }
}

async function changePassword(req, res, next) {
  try {
    const body = parse(validators.changePasswordBodySchema, req.body || {})
    const result = await service.changePassword(req.user.id, body, req)

    clearRefreshCookie(res)
    setPrivateNoStore(res)

    return successResponse(req, res, result)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  changePassword,
  login,
  logout,
  me,
  refresh,
}

