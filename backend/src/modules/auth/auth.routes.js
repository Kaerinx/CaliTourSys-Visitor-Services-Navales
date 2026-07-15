const express = require('express')
const controller = require('./auth.controller')
const { cmsLoginRateLimiter } = require('../../middleware/rateLimiters')
const { authenticate } = require('../../middleware/authenticate')

const router = express.Router()

router.post('/login', cmsLoginRateLimiter, controller.login)
router.post('/logout', controller.logout)
router.post('/refresh', controller.refresh)
router.get('/me', authenticate, controller.me)
router.post('/change-password', authenticate, controller.changePassword)

module.exports = router

