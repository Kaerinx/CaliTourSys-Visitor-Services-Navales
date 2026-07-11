const express = require('express')
const controller = require('./touristAuth.controller')
const { loginRateLimiter } = require('../../middleware/rateLimiters')
const { authenticateTourist } = require('../../middleware/authenticateTourist')

const router = express.Router()

router.post('/register', loginRateLimiter, controller.register)
router.post('/login', loginRateLimiter, controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticateTourist, controller.me)

module.exports = router
