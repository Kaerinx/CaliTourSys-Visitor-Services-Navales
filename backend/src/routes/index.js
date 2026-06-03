const express = require('express')
const healthRoutes = require('./health.routes')
const publicRoutes = require('../modules/public/public.routes')
const authRoutes = require('../modules/auth/auth.routes')
const cmsRoutes = require('../modules/cms/cms.routes')
const accreditationRoutes = require('../modules/accreditation/accreditation.route')
const productDevelopmentRoutes = require('../modules/productDevelopment/routes')
const visitorRoutes = require('../modules/visitor/visitor.route')

const router = express.Router()

router.use('/health', healthRoutes)
router.use('/public', publicRoutes)
router.use('/auth', authRoutes)
router.use('/cms', cmsRoutes)
router.use('/accreditation', accreditationRoutes)
router.use('/visitor', visitorRoutes)
router.use('/', productDevelopmentRoutes)

module.exports = router
