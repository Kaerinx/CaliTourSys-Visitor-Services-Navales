const express = require('express')
const controller = require('./controller')
const { authenticate } = require('../../middleware/authenticate')
const { authorize } = require('../../middleware/authorize')
const { assetImageUpload } = require('./uploads')

const router = express.Router()

router.get('/public/packages', controller.listPublicPackages)
router.get('/public/packages/:slug', controller.getPublicPackage)

router.use(
  [
    '/product/status',
    '/reports',
    '/accredited-establishments',
    '/assets',
    '/development-plans',
    '/improvements',
    '/activities',
    '/packages',
  ],
  authenticate,
)

router.get('/product/status', authorize('products.view'), controller.getStatus)
router.get('/reports', authorize('products.view'), controller.getReports)
router.get('/accredited-establishments', authorize('products.view'), controller.listAccreditedEstablishments)

router.get('/assets', authorize('products.view'), controller.listAssets)
router.post('/assets', authorize('products.create'), assetImageUpload.array('images', 5), controller.createAsset)
router.get('/assets/:id', authorize('products.view'), controller.getAsset)
router.put('/assets/:id', authorize('products.update'), assetImageUpload.array('images', 5), controller.updateAsset)
router.patch('/assets/:id/archive', authorize('products.archive'), controller.archiveAsset)

router.get('/development-plans', authorize('products.view'), controller.listPlans)
router.post('/development-plans', authorize('products.create'), controller.createPlan)
router.get('/development-plans/:id', authorize('products.view'), controller.getPlan)
router.put('/development-plans/:id', authorize('products.update'), controller.updatePlan)
router.patch('/development-plans/:id/archive', authorize('products.archive'), controller.archivePlan)

router.get('/improvements', authorize('products.view'), controller.listImprovements)
router.post('/improvements', authorize('products.create'), controller.createImprovement)
router.get('/improvements/:id', authorize('products.view'), controller.getImprovement)
router.put('/improvements/:id', authorize('products.update'), controller.updateImprovement)
router.patch('/improvements/:id/archive', authorize('products.archive'), controller.archiveImprovement)

router.get('/activities', authorize('products.view'), controller.listActivities)
router.post('/activities', authorize('products.create'), controller.createActivity)
router.get('/activities/:id', authorize('products.view'), controller.getActivity)
router.put('/activities/:id', authorize('products.update'), controller.updateActivity)
router.patch('/activities/:id/archive', authorize('products.archive'), controller.archiveActivity)

router.get('/packages/ready-for-promotion', authorize('products.view'), controller.listPublicPackages)
router.get('/packages', authorize('products.view'), controller.listPackages)
router.post('/packages', authorize('products.create'), controller.createPackage)
router.get('/packages/:packageId', authorize('products.view'), controller.getPackage)
router.put('/packages/:packageId', authorize('products.update'), controller.updatePackage)
router.patch('/packages/:packageId/archive', authorize('products.archive'), controller.archivePackage)
router.patch('/packages/:packageId/ready-for-promotion', authorize('products.publish'), controller.markPackageReady)

module.exports = router
