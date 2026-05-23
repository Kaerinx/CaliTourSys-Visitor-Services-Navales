const express = require('express')
const healthRoutes = require('./health.routes')
const publicRoutes = require('../modules/public/public.routes')

const router = express.Router()

router.use('/health', healthRoutes)
router.use('/public', publicRoutes)

module.exports = router
