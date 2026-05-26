const express = require('express')
const controller = require('./operations.controller')
const { authorize } = require('../../../middleware/authorize')

const router = express.Router()

router.get('/media', authorize('media.view'), controller.listMedia)
router.post('/media', authorize('media.upload'), controller.createMedia)
router.get('/media/:id', authorize('media.view'), controller.getMedia)
router.patch('/media/:id', authorize('media.upload'), controller.updateMedia)
router.patch('/media/:id/archive', authorize('media.archive'), controller.archiveMedia)

router.get('/inquiries', authorize('inquiries.view'), controller.listInquiries)
router.get('/inquiries/:id', authorize('inquiries.view'), controller.getInquiry)
router.patch('/inquiries/:id/status', authorize('inquiries.respond'), controller.updateInquiryStatus)
router.post('/inquiries/:id/responses', authorize('inquiries.respond'), controller.createInquiryResponse)
router.get('/inquiries/:id/responses', authorize('inquiries.view'), controller.listInquiryResponses)

router.get('/newsletter-subscribers', authorize('newsletter.view'), controller.listNewsletterSubscribers)
router.patch('/newsletter-subscribers/:id/status', authorize('newsletter.view'), controller.updateNewsletterStatus)

router.get('/users', authorize('users.view'), controller.listUsers)
router.get('/users/:id', authorize('users.view'), controller.getUser)
router.patch('/users/:id/status', authorize('users.manage'), controller.updateUserStatus)
router.patch('/users/:id/roles', authorize('users.manage', 'roles.manage'), controller.updateUserRoles)

router.get('/roles', authorize('roles.view'), controller.listRoles)
router.get('/permissions', authorize('roles.view'), controller.listPermissions)

router.get('/audit-logs/:id', authorize('audit_logs.view'), controller.getAuditLog)
router.get('/audit-logs', authorize('audit_logs.view'), controller.listAuditLogs)

module.exports = router
