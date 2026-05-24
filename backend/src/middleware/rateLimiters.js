const rateLimit = require('express-rate-limit')
const { env } = require('../config/env')
const { errorResponse } = require('../utils/apiResponse')

function createRateLimiter({ windowMs = 15 * 60 * 1000, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return errorResponse(req, res, 429, 'RATE_LIMITED', message)
    },
  })
}

function createPublicRateLimiter({ limit, message }) {
  return createRateLimiter({ limit, message })
}

const loginRateLimiter = createRateLimiter({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  message: 'Too many login attempts. Please try again later.',
})

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
  loginRateLimiter,
  inquiryRateLimiter,
  newsletterRateLimiter,
  itineraryWriteRateLimiter,
}
