const express = require('express')
const { authenticateTourist } = require('../../middleware/authenticateTourist')
const controller = require('./tourist.controller')

const router = express.Router()

router.get('/bookings', authenticateTourist, controller.listBookings)
router.get('/bookings/:requestId', authenticateTourist, controller.getBooking)
router.post('/bookings/:requestId/date-change-requests', authenticateTourist, controller.createDateChangeRequest)

module.exports = router
