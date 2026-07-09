const express = require('express')
const controller = require('./content.controller')
const { authorize } = require('../../../middleware/authorize')
const { assetImageUpload } = require('../../productDevelopment/uploads')

const router = express.Router()

router.get('/promotions', authorize('promotions.view'), controller.listPromotions)
router.post('/promotions', authorize('promotions.create'), controller.createPromotion)
router.get('/promotions/:id', authorize('promotions.view'), controller.getPromotion)
router.patch('/promotions/:id', authorize('promotions.update'), controller.updatePromotion)
router.patch('/promotions/:id/publish', authorize('promotions.publish'), controller.publishPromotion)
router.patch('/promotions/:id/archive', authorize('promotions.archive'), controller.archivePromotion)

router.get('/events', authorize('events.view'), controller.listEvents)
router.post('/events', authorize('events.create'), assetImageUpload.single('image'), controller.createEvent)
router.get('/events/:id', authorize('events.view'), controller.getEvent)
router.patch('/events/:id', authorize('events.update'), assetImageUpload.single('image'), controller.updateEvent)
router.patch('/events/:id/publish', authorize('events.publish'), controller.publishEvent)
router.patch('/events/:id/archive', authorize('events.archive'), controller.archiveEvent)

router.get('/products', authorize('products.view'), controller.listProducts)
router.post('/products', authorize('products.create'), assetImageUpload.single('image'), controller.createProduct)
router.get('/products/accredited-establishments', authorize('products.view'), controller.listAccreditedEstablishments)
router.get('/products/:id', authorize('products.view'), controller.getProduct)
router.patch('/products/:id', authorize('products.update'), assetImageUpload.single('image'), controller.updateProduct)
router.patch('/products/:id/publish', authorize('products.publish'), controller.publishProduct)
router.patch('/products/:id/archive', authorize('products.archive'), controller.archiveProduct)

router.get('/destinations', authorize('destinations.view'), controller.listDestinations)
router.post('/destinations', authorize('destinations.create'), controller.createDestination)
router.get('/destinations/:id', authorize('destinations.view'), controller.getDestination)
router.patch('/destinations/:id', authorize('destinations.update'), controller.updateDestination)
router.patch('/destinations/:id/publish', authorize('destinations.publish'), controller.publishDestination)
router.patch('/destinations/:id/archive', authorize('destinations.archive'), controller.archiveDestination)

router.get('/businesses', authorize('businesses.view'), controller.listBusinesses)
router.post('/businesses', authorize('businesses.create'), controller.createBusiness)
router.get('/businesses/:id', authorize('businesses.view'), controller.getBusiness)
router.patch('/businesses/:id', authorize('businesses.update'), controller.updateBusiness)

router.get('/museum/artifacts', authorize('museum.view'), controller.listMuseumArtifacts)
router.post('/museum/artifacts', authorize('museum.create'), controller.createMuseumArtifact)
router.get('/museum/artifacts/:id', authorize('museum.view'), controller.getMuseumArtifact)
router.patch('/museum/artifacts/:id', authorize('museum.update'), controller.updateMuseumArtifact)
router.patch('/museum/artifacts/:id/publish', authorize('museum.publish'), controller.publishMuseumArtifact)
router.patch('/museum/artifacts/:id/archive', authorize('museum.archive'), controller.archiveMuseumArtifact)

router.get('/map-locations', authorize('map_locations.view'), controller.listMapLocations)
router.post('/map-locations', authorize('map_locations.create'), controller.createMapLocation)
router.get('/map-locations/:id', authorize('map_locations.view'), controller.getMapLocation)
router.patch('/map-locations/:id', authorize('map_locations.update'), controller.updateMapLocation)
router.delete('/map-locations/:id', authorize('map_locations.update'), controller.deleteMapLocation)

router.get('/event-categories', authorize('events.view'), controller.listEventCategories)
router.post('/event-categories', authorize('events.update'), controller.createEventCategory)
router.patch('/event-categories/:id', authorize('events.update'), controller.updateEventCategory)

router.get('/product-categories', authorize('products.view'), controller.listProductCategories)
router.post('/product-categories', authorize('products.update'), controller.createProductCategory)
router.patch('/product-categories/:id', authorize('products.update'), controller.updateProductCategory)

router.get('/destination-categories', authorize('destinations.view'), controller.listDestinationCategories)
router.post('/destination-categories', authorize('destinations.update'), controller.createDestinationCategory)
router.patch('/destination-categories/:id', authorize('destinations.update'), controller.updateDestinationCategory)

router.get('/museum/categories', authorize('museum.view'), controller.listArtifactCategories)
router.post('/museum/categories', authorize('museum.update'), controller.createArtifactCategory)
router.patch('/museum/categories/:id', authorize('museum.update'), controller.updateArtifactCategory)

module.exports = router
