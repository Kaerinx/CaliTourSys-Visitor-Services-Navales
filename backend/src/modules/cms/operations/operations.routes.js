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

router.get('/package-booking-requests', authorize('package_bookings.view'), controller.listPackageBookingRequests)
router.get('/package-booking-requests/:id', authorize('package_bookings.view'), controller.getPackageBookingRequest)
router.patch('/package-booking-requests/:id/status', authorize('package_bookings.review'), controller.updatePackageBookingStatus)
router.patch('/package-booking-requests/:id/payment/verify', authorize('package_bookings.review'), controller.verifyPackageBookingPayment)
router.patch('/package-booking-requests/:id/payment/reject', authorize('package_bookings.review'), controller.rejectPackageBookingPayment)
router.patch('/package-booking-requests/:id/notes', authorize('package_bookings.review'), controller.updatePackageBookingNotes)
router.get('/package-bookings', authorize('package_bookings.view'), controller.listPackageBookingRequests)
router.post('/package-bookings', authorize('package_bookings.create_walkin'), controller.createWalkInPackageBooking)
router.get('/package-bookings/:id', authorize('package_bookings.view'), controller.getPackageBookingRequest)
router.delete('/package-bookings/:id', authorize('package_bookings.review'), controller.deletePackageBookingRequest)
router.patch('/package-bookings/:id/status', authorize('package_bookings.review'), controller.updatePackageBookingStatus)
router.patch('/package-bookings/:id/schedule', authorize('package_bookings.edit_schedule'), controller.updatePackageBookingSchedule)
router.patch('/package-bookings/:id/deposit-deadline', authorize('package_bookings.extend_deposit'), controller.extendPackageBookingDepositDeadline)
router.post('/package-bookings/:id/credit-transfers', authorize('package_bookings.transfer_credit'), controller.transferPackageBookingCredit)
router.post('/package-bookings/:id/payments', authorize('package_bookings.review'), controller.recordPackageBookingPayment)
router.patch('/package-bookings/:id/payment/verify', authorize('package_bookings.review'), controller.verifyPackageBookingPayment)
router.patch('/package-bookings/:id/payment/reject', authorize('package_bookings.review'), controller.rejectPackageBookingPayment)
router.patch('/package-bookings/:id/notes', authorize('package_bookings.review'), controller.updatePackageBookingNotes)

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
