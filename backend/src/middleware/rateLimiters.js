const rateLimit = require('express-rate-limit')
const { errorResponse } = require('../utils/apiResponse')

function createPublicRateLimiter({ limit, message }) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return errorResponse(req, res, 429, 'RATE_LIMITED', message)
    },
  })
}

const inquiryRateLimiter = createPublicRateLimiter({
  limit: 5,
  message: 'Too many inquiry submissions. Please try again later.',
})

const newsletterRateLimiter = createPublicRateLimiter({
  limit: 5,
  message: 'Too many newsletter subscription attempts. Please try again later.',
})

const itineraryWriteRateLimiter = createPublicRateLimiter({
  limit: 60,
  message: 'Too many itinerary requests. Please try again later.',
})

module.exports = {
  inquiryRateLimiter,
  newsletterRateLimiter,
  itineraryWriteRateLimiter,
}
