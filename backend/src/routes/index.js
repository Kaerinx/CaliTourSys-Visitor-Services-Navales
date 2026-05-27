const express = require('express')
const healthRoutes = require('./health.routes')
const publicRoutes = require('../modules/public/public.routes')
const authRoutes = require('../modules/auth/auth.routes')
const cmsRoutes = require('../modules/cms/cms.routes')
const productDevelopmentRoutes = require('../modules/productDevelopment/routes')

const router = express.Router()

router.use('/health', healthRoutes)
router.use('/public', publicRoutes)
router.use('/auth', authRoutes)
router.use('/cms', cmsRoutes)
router.use('/', productDevelopmentRoutes)

module.exports = router
