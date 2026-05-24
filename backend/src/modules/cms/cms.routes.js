const express = require('express')
const controller = require('./cms.controller')
const contentRoutes = require('./content/content.routes')
const operationsRoutes = require('./operations/operations.routes')
const { authenticate } = require('../../middleware/authenticate')
const { authorize } = require('../../middleware/authorize')

const router = express.Router()

router.use(authenticate)

router.get('/health', authorize('dashboard.view'), controller.getHealth)
router.get('/dashboard', authorize('dashboard.view'), controller.getDashboard)
router.get('/navigation', controller.getNavigation)
router.use('/', contentRoutes)
router.use('/', operationsRoutes)

module.exports = router
