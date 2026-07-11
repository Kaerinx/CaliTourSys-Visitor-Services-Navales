const express = require('express')
const controller = require('./accreditation.controller')
const { authorize } = require('../../../middleware/authorize')

const router = express.Router()

router.get('/business-accreditation/dashboard', authorize('businesses.view'), controller.getDashboard)
router.get('/business-accreditation/session', authorize('businesses.view'), controller.getSession)
router.get('/business-accreditation/applications', authorize('businesses.view'), controller.listApplications)
router.get('/business-accreditation/applications/:id', authorize('businesses.view'), controller.getApplication)
router.patch('/business-accreditation/applications/:id/review', authorize('businesses.update'), controller.reviewApplication)
router.get('/business-accreditation/records', authorize('businesses.view'), controller.listRecords)

module.exports = router
