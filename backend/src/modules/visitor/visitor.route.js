const express = require('express');
const controller = require('./visitor.controller');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

router.post('/auth/login', controller.login);
router.get('/auth/me', authenticate, controller.me);
router.patch('/auth/profile', authenticate, controller.updateProfile);
router.patch('/auth/password', authenticate, controller.changePassword);

router.get('/dashboard/summary', authenticate, authorize('admin', 'tourism_staff'), controller.dashboardSummary);
router.get(
  '/dashboard/receptionist-summary',
  authenticate,
  authorize('admin', 'receptionist'),
  controller.receptionistSummary
);

router.post('/visitors', authenticate, authorize('admin', 'tourism_staff', 'receptionist'), controller.createVisitor);
router.get('/visitors', authenticate, authorize('admin', 'tourism_staff', 'receptionist'), controller.listVisitors);
router.get('/visitors/:id', authenticate, authorize('admin', 'tourism_staff', 'receptionist'), controller.getVisitor);
router.patch('/visitors/:id', authenticate, authorize('admin', 'tourism_staff', 'receptionist'), controller.updateVisitor);
router.patch(
  '/visitors/:id/status',
  authenticate,
  authorize('admin', 'tourism_staff', 'receptionist'),
  controller.updateVisitorStatus
);
router.delete('/visitors/:id', authenticate, authorize('admin'), controller.deleteVisitor);

router.post('/inquiries', controller.createInquiry);
router.get('/inquiries', authenticate, authorize('admin', 'tourism_staff'), controller.listInquiries);
router.get('/inquiries/:id', authenticate, authorize('admin', 'tourism_staff'), controller.getInquiry);
router.patch('/inquiries/:id/respond', authenticate, authorize('admin', 'tourism_staff'), controller.respondInquiry);
router.patch('/inquiries/:id/status', authenticate, authorize('admin', 'tourism_staff'), controller.updateInquiryStatus);

router.get('/reports/visitor-summary', authenticate, authorize('admin', 'tourism_staff'), controller.visitorSummary);
router.get('/reports/visitor-trend', authenticate, authorize('admin', 'tourism_staff'), controller.visitorTrend);
router.get('/reports/classification', authenticate, authorize('admin', 'tourism_staff'), controller.classification);
router.get(
  '/reports/visitor-summary/export',
  authenticate,
  authorize('admin', 'tourism_staff'),
  controller.exportVisitorSummary
);

router.get('/establishments', authenticate, authorize('admin', 'tourism_staff', 'receptionist'), controller.listEstablishments);
router.post('/establishments', authenticate, authorize('admin'), controller.createEstablishment);
router.patch('/establishments/:id', authenticate, authorize('admin'), controller.updateEstablishment);
router.delete('/establishments/:id', authenticate, authorize('admin'), controller.deactivateEstablishment);

router.get('/users', authenticate, authorize('admin'), controller.listUsers);
router.post('/users', authenticate, authorize('admin'), controller.createUser);
router.patch('/users/:id', authenticate, authorize('admin'), controller.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), controller.deactivateUser);

module.exports = router;
