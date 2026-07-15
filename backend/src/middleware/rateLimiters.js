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

function createLoginRateLimiter() {
  return createRateLimiter({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    limit: env.IS_PRODUCTION ? env.LOGIN_RATE_LIMIT_MAX : Math.max(env.LOGIN_RATE_LIMIT_MAX, 50),
    message: 'Too many login attempts. Please try again later.',
  })
}

// Separate stores prevent tourist, registration, and staff attempts from
// consuming one another's allowance when they share the same network address.
const cmsLoginRateLimiter = createLoginRateLimiter()
const touristLoginRateLimiter = createLoginRateLimiter()
const touristRegisterRateLimiter = createLoginRateLimiter()

const inquiryRateLimiter = createPublicRateLimiter({
  limit: 5,
  message: 'Too many inquiry submissions. Please try again later.',
})

const reviewRateLimiter = createPublicRateLimiter({
  limit: 30,
  message: 'Too many review submissions. Please try again later.',
})

const bookingRequestRateLimiter = createPublicRateLimiter({
  limit: 10,
  message: 'Too many booking requests. Please try again later.',
})

const bookingLookupRateLimiter = createPublicRateLimiter({
  limit: 30,
  message: 'Too many booking lookups. Please try again later.',
})

const paymentProofRateLimiter = createPublicRateLimiter({
  limit: 15,
  message: 'Too many payment proof submissions. Please try again later.',
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
  bookingLookupRateLimiter,
  bookingRequestRateLimiter,
  cmsLoginRateLimiter,
  inquiryRateLimiter,
  newsletterRateLimiter,
  paymentProofRateLimiter,
  reviewRateLimiter,
  touristLoginRateLimiter,
  touristRegisterRateLimiter,
  itineraryWriteRateLimiter,
}
