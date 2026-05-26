const express = require('express')
const controller = require('./auth.controller')
const { loginRateLimiter } = require('../../middleware/rateLimiters')
const { authenticate } = require('../../middleware/authenticate')

const router = express.Router()

router.post('/login', loginRateLimiter, controller.login)
router.post('/logout', controller.logout)
router.post('/refresh', controller.refresh)
router.get('/me', authenticate, controller.me)
router.post('/change-password', authenticate, controller.changePassword)

module.exports = router

