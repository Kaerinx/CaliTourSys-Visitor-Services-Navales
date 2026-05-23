const express = require('express')
const controller = require('./public.controller')

const router = express.Router()

router.get('/home', controller.getHome)

router.get('/promotions', controller.listPromotions)
router.get('/promotions/:slug', controller.getPromotionBySlug)

router.get('/event-categories', controller.listEventCategories)
router.get('/events', controller.listEvents)
router.get('/events/:slug', controller.getEventBySlug)

router.get('/product-categories', controller.listProductCategories)
router.get('/products', controller.listProducts)
router.get('/products/:slug', controller.getProductBySlug)

router.get('/businesses/:slug', controller.getBusinessBySlug)

router.get('/destination-categories', controller.listDestinationCategories)
router.get('/destinations', controller.listDestinations)
router.get('/destinations/:slug', controller.getDestinationBySlug)

router.get('/map/locations', controller.listMapLocations)

router.get('/museum/categories', controller.listMuseumCategories)
router.get('/museum/artifacts', controller.listMuseumArtifacts)
router.get('/museum/artifacts/:slug', controller.getMuseumArtifactBySlug)

module.exports = router
