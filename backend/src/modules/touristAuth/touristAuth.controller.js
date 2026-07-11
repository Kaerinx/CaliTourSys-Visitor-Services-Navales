const service = require('./touristAuth.service')
const validators = require('./touristAuth.validators')
const { successResponse } = require('../../utils/apiResponse')
const { setPrivateNoStore } = require('../../utils/cacheHeaders')

function parse(schema, value) {
  return schema.parse(value)
}

async function register(req, res, next) {
  try {
    const body = parse(validators.registerBodySchema, req.body || {})
    setPrivateNoStore(res)
    return successResponse(req, res, await service.register(body), 201)
  } catch (error) {
    return next(error)
  }
}

async function login(req, res, next) {
  try {
    const body = parse(validators.loginBodySchema, req.body || {})
    setPrivateNoStore(res)
    return successResponse(req, res, await service.login(body))
  } catch (error) {
    return next(error)
  }
}

async function me(req, res, next) {
  try {
    setPrivateNoStore(res)
    return successResponse(req, res, await service.me(req.tourist.id))
  } catch (error) {
    return next(error)
  }
}

async function logout(req, res, next) {
  try {
    setPrivateNoStore(res)
    return successResponse(req, res, { loggedOut: true })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  login,
  logout,
  me,
  register,
}
