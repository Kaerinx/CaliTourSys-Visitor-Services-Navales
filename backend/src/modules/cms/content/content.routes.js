const express = require('express')
const controller = require('./content.controller')
const { authorize } = require('../../../middleware/authorize')

const router = express.Router()

router.get('/promotions', authorize('promotions.view'), controller.listPromotions)
router.post('/promotions', authorize('promotions.create'), controller.createPromotion)
router.get('/promotions/:id', authorize('promotions.view'), controller.getPromotion)
router.patch('/promotions/:id', authorize('promotions.update'), controller.updatePromotion)
router.patch('/promotions/:id/publish', authorize('promotions.publish'), controller.publishPromotion)
router.patch('/promotions/:id/archive', authorize('promotions.archive'), controller.archivePromotion)

router.get('/events', authorize('events.view'), controller.listEvents)
router.post('/events', authorize('events.create'), controller.createEvent)
router.get('/events/:id', authorize('events.view'), controller.getEvent)
router.patch('/events/:id', authorize('events.update'), controller.updateEvent)
router.patch('/events/:id/publish', authorize('events.publish'), controller.publishEvent)
router.patch('/events/:id/archive', authorize('events.archive'), controller.archiveEvent)

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

