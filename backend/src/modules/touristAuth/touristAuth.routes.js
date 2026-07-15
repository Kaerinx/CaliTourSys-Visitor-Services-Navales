const express = require('express')
const controller = require('./touristAuth.controller')
const {
  touristLoginRateLimiter,
  touristRegisterRateLimiter,
} = require('../../middleware/rateLimiters')
const { authenticateTourist } = require('../../middleware/authenticateTourist')

const router = express.Router()

router.post('/register', touristRegisterRateLimiter, controller.register)
router.post('/login', touristLoginRateLimiter, controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticateTourist, controller.me)
router.patch('/profile', authenticateTourist, controller.updateProfile)
router.patch('/password', authenticateTourist, controller.changePassword)

module.exports = router
