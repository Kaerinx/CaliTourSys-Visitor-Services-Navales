const publicService = require('../public/public.service')
const { successResponse } = require('../../utils/apiResponse')
const { setPrivateNoStore } = require('../../utils/cacheHeaders')

function notFoundBooking() {
  const error = new Error('Booking request not found.')
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = 'Booking request not found.'
  return error
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

async function listBookings(req, res, next) {
  try {
    setPrivateNoStore(res)
    return successResponse(req, res, await publicService.listTouristPackageBookingRequests(req.tourist.id))
  } catch (error) {
    return next(error)
  }
}

async function getBooking(req, res, next) {
  try {
    if (!isUuid(req.params.requestId)) throw notFoundBooking()
    setPrivateNoStore(res)
    return successResponse(
      req,
      res,
      await publicService.getTouristPackageBookingRequest({
        requestId: req.params.requestId,
        touristAccountId: req.tourist.id,
      }),
    )
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getBooking,
  listBookings,
}
