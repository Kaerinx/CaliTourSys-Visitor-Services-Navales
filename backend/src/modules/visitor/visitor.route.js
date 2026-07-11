const express = require('express');
const controller = require('./visitor.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = express.Router();

function normalizeVisitorRole(role) {
  const normalized = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['admin', 'system_admin', 'system_administrator'].includes(normalized)) return 'admin';
  if (['tourism_staff', 'tourism_officer', 'content_editor'].includes(normalized)) return 'tourism_staff';
  if (['receptionist', 'front_desk', 'frontdesk', 'visitor_receptionist'].includes(normalized)) return 'receptionist';
  return '';
}

function visitorAuthorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const roleCandidates = [
      req.user.role,
      ...(Array.isArray(req.user.roles) ? req.user.roles : []),
    ];
    const visitorRole = roleCandidates.map(normalizeVisitorRole).find(Boolean);

    if (!visitorRole || !allowedRoles.includes(visitorRole)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }

    req.user = {
      ...req.user,
      role: visitorRole,
      full_name: req.user.full_name || req.user.fullName || req.user.displayName || req.user.email,
    };
    return next();
  };
}

router.post('/auth/login', controller.login);
router.get('/auth/me', authenticate, controller.me);
router.patch('/auth/profile', authenticate, controller.updateProfile);
router.patch('/auth/password', authenticate, controller.changePassword);

router.get('/dashboard/summary', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.dashboardSummary);
router.get(
  '/dashboard/receptionist-summary',
  authenticate,
  visitorAuthorize('admin', 'receptionist'),
  controller.receptionistSummary
);

router.post('/visitors', authenticate, visitorAuthorize('admin', 'tourism_staff', 'receptionist'), controller.createVisitor);
router.get('/visitors', authenticate, visitorAuthorize('admin', 'tourism_staff', 'receptionist'), controller.listVisitors);
router.get('/visitors/:id', authenticate, visitorAuthorize('admin', 'tourism_staff', 'receptionist'), controller.getVisitor);
router.patch('/visitors/:id', authenticate, visitorAuthorize('admin', 'tourism_staff', 'receptionist'), controller.updateVisitor);
router.patch(
  '/visitors/:id/status',
  authenticate,
  visitorAuthorize('admin', 'tourism_staff', 'receptionist'),
  controller.updateVisitorStatus
);
router.delete('/visitors/:id', authenticate, visitorAuthorize('admin'), controller.deleteVisitor);

router.post('/inquiries', controller.createInquiry);
router.get('/inquiries', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.listInquiries);
router.get('/inquiries/:id', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.getInquiry);
router.patch('/inquiries/:id/respond', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.respondInquiry);
router.patch('/inquiries/:id/status', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.updateInquiryStatus);

router.get('/reports/visitor-summary', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.visitorSummary);
router.get('/reports/visitor-trend', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.visitorTrend);
router.get('/reports/classification', authenticate, visitorAuthorize('admin', 'tourism_staff'), controller.classification);
router.get(
  '/reports/visitor-summary/export',
  authenticate,
  visitorAuthorize('admin', 'tourism_staff'),
  controller.exportVisitorSummary
);

router.get('/establishments', authenticate, visitorAuthorize('admin', 'tourism_staff', 'receptionist'), controller.listEstablishments);
router.post('/establishments', authenticate, visitorAuthorize('admin'), controller.createEstablishment);
router.patch('/establishments/:id', authenticate, visitorAuthorize('admin'), controller.updateEstablishment);
router.delete('/establishments/:id', authenticate, visitorAuthorize('admin'), controller.deactivateEstablishment);

router.get('/users', authenticate, visitorAuthorize('admin'), controller.listUsers);
router.post('/users', authenticate, visitorAuthorize('admin'), controller.createUser);
router.patch('/users/:id', authenticate, visitorAuthorize('admin'), controller.updateUser);
router.delete('/users/:id', authenticate, visitorAuthorize('admin'), controller.deactivateUser);

module.exports = router;
