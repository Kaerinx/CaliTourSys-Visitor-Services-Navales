const express = require('express')
const { env } = require('../config/env')
const { testDatabaseConnection } = require('../config/db')
const { successResponse } = require('../utils/apiResponse')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    let database = {
      connected: false,
    }

    try {
      database = await testDatabaseConnection()
    } catch (error) {
      req.log?.warn({ err: error, requestId: req.id }, 'Database readiness check failed')
    }

    const data = {
      status: database.connected ? 'ok' : 'degraded',
      service: 'CaliTourSys API',
      version: 'v1',
      database,
      environment: env.NODE_ENV,
    }

    return successResponse(req, res, data)
  } catch (error) {
    return next(error)
  }
})

module.exports = router
