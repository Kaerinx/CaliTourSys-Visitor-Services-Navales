const express = require('express')
const healthRoutes = require('./health.routes')
const publicRoutes = require('../modules/public/public.routes')
const authRoutes = require('../modules/auth/auth.routes')

const router = express.Router()

router.use('/health', healthRoutes)
router.use('/public', publicRoutes)
router.use('/auth', authRoutes)

module.exports = router
