const express = require('express')
const controller = require('./cms.controller')
const contentRoutes = require('./content/content.routes')
const { authenticate } = require('../../middleware/authenticate')
const { authorize } = require('../../middleware/authorize')

const router = express.Router()

router.use(authenticate)

router.get('/health', authorize('dashboard.view'), controller.getHealth)
router.get('/dashboard', authorize('dashboard.view'), controller.getDashboard)
router.get('/navigation', controller.getNavigation)
router.get('/audit-logs', authorize('audit_logs.view'), controller.listAuditLogs)
router.use('/', contentRoutes)

module.exports = router
