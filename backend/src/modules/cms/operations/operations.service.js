const repository = require('./operations.repository')
const publicBookingService = require('../../public/public.service')
const { buildPaginationMeta, getPagination } = require('../../../utils/pagination')
const { logCmsContentAudit } = require('../../../utils/cmsAudit')
const {
  buildSchedule,
  requireCurrentOrFutureStartDate,
  roundMoney,
  validateDepositExtension,
  validateElectronicPaymentEvidence,
  validatePaymentMethod,
} = require('../../booking/bookingRules')

function withPagination(filters, result) {
  const pagination = getPagination(filters)
  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function listMedia(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listMedia(filters, pagination))
}

async function createMedia(data, req) {
  const media = await repository.createMedia(data, req.user.id)
  await logCmsContentAudit({ req, action: 'create', entityType: 'media_asset', entityId: media.id, entityLabel: media.fileName || media.fileUrl, afterValues: media })
  return media
}

async function getMedia(id) {
  const media = await repository.getMediaById(id)
  if (!media) throw notFound('Media asset')
  return media
}

async function updateMedia(id, data, req) {
  const result = await repository.updateMedia(id, data, req.user.id)
  await logCmsContentAudit({ req, action: 'update', entityType: 'media_asset', entityId: result.after.id, entityLabel: result.after.fileName || result.after.fileUrl, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function archiveMedia(id, req) {
  const result = await repository.archiveMedia(id, req.user.id)
  await logCmsContentAudit({ req, action: 'archive', entityType: 'media_asset', entityId: result.after.id, entityLabel: result.after.fileName || result.after.fileUrl, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listInquiries(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listInquiries(filters, pagination))
}

async function getInquiry(id) {
  const inquiry = await repository.getInquiryById(id)
  if (!inquiry) throw notFound('Inquiry')
  return inquiry
}

async function updateInquiryStatus(id, data, req) {
  const result = await repository.updateInquiryStatus(id, data.status)
  await logCmsContentAudit({ req, action: 'update', entityType: 'inquiry', entityId: result.after.id, entityLabel: result.after.subject, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function createInquiryResponse(id, data, req) {
  const response = await repository.createInquiryResponse(id, data, req.user.id)
  await logCmsContentAudit({ req, action: data.status === 'sent' ? 'update' : 'create', entityType: 'inquiry', entityId: id, entityLabel: 'Inquiry response', afterValues: response })
  return response
}

async function listInquiryResponses(id) {
  return { items: await repository.listInquiryResponses(id) }
}

async function listPackageBookingRequests(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listPackageBookingRequests(filters, pagination))
}

async function getPackageBookingRequest(id) {
  const request = await repository.getPackageBookingRequestById(id)
  if (!request) throw notFound('Package booking request')
  return request
}

async function createWalkInPackageBooking(data, req) {
  const booking = await publicBookingService.createPackageBookingRequest(
    {
      ...data,
      preferredBookingDate: data.startDate,
      participants: (data.participants || []).map((participant) => ({
        ...participant,
        age: undefined,
        notes: undefined,
      })),
    },
    { bookingSource: 'walk_in', touristAccountId: null },
  )
  await logCmsContentAudit({
    req,
    action: 'create',
    entityType: 'package_booking_request',
    entityId: booking.id,
    entityLabel: booking.packageName,
    afterValues: booking,
  })
  return booking
}

async function updatePackageBookingSchedule(id, data, req) {
  const existing = await getPackageBookingRequest(id)
  if (['declined', 'cancelled', 'expired'].includes(existing.bookingStatus)) {
    const error = new Error('This booking can no longer be rescheduled.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  const schedule = buildSchedule(data)
  requireCurrentOrFutureStartDate(schedule.startDate)
  const result = await repository.updatePackageBookingSchedule(
    id,
    { ...data, ...schedule },
    req.user.id,
  )
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: id,
    entityLabel: result.after.packageName,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function extendPackageBookingDepositDeadline(id, data, req) {
  const existing = await getPackageBookingRequest(id)
  if (existing.bookingSource !== 'online') {
    const error = new Error('Deposit deadline extensions apply only to online bookings.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  if (['paid', 'expired', 'transferred', 'refunded', 'not_required'].includes(existing.depositStatus)) {
    const error = new Error('This booking does not have an extendable deposit deadline.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  const depositDueAt = validateDepositExtension({
    createdAt: existing.createdAt,
    requestedDueAt: data.depositDueAt,
  })
  const result = await repository.extendPackageBookingDepositDeadline(
    id,
    { ...data, depositDueAt },
    req.user.id,
  )
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: id,
    entityLabel: result.after.packageName,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

function normalizedContact(value) {
  return String(value || '').trim().toLowerCase().replace(/\D/g, '')
}

async function transferPackageBookingCredit(id, data, req) {
  const [source, destination] = await Promise.all([
    getPackageBookingRequest(id),
    getPackageBookingRequest(data.toBookingRequestId),
  ])
  if (source.bookingStatus !== 'cancelled') {
    const error = new Error('Only a cancelled booking can transfer payment credit.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  if (source.packageId !== destination.packageId) {
    const error = new Error('Booking credit may only be transferred to the same package.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  if (normalizedContact(source.representative.phoneNumber) !== normalizedContact(destination.representative.phoneNumber)) {
    const error = new Error('Booking credit must remain with the same representative.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  const availableCredit = await repository.getTransferablePackageBookingCredit(id)
  if (Number(data.amount) > availableCredit) {
    const error = new Error('Transfer amount exceeds the verified payment credit.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  const cancelledAt = new Date(source.cancelledAt || source.updatedAt || Date.now())
  const expiresAt = new Date(cancelledAt)
  expiresAt.setMonth(expiresAt.getMonth() + 6)
  if (expiresAt.getTime() < Date.now()) {
    const error = new Error('The six-month booking credit validity period has expired.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  const refundableExcess = Math.max(0, Number(data.amount) - Number(destination.totalAmount || 0))
  const transfer = await repository.transferPackageBookingCredit(
    {
      fromBookingRequestId: id,
      toBookingRequestId: data.toBookingRequestId,
      amount: Number(data.amount),
      reason: data.reason,
      expiresAt: expiresAt.toISOString(),
      refundableExcess,
    },
    req.user.id,
  )
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: id,
    entityLabel: `${source.packageName} credit transfer`,
    beforeValues: source,
    afterValues: transfer,
  })
  return transfer
}

async function recordPackageBookingPayment(id, data, req) {
  const booking = await getPackageBookingRequest(id)
  const paymentMethod = validatePaymentMethod(booking.bookingSource, data.paymentMethod)
  validateElectronicPaymentEvidence({
    paymentMethod,
    transactionReference: data.transactionReference,
    proofFileUrl: data.proofFileUrl,
  })
  const amount = roundMoney(data.amount)
  const totals = await repository.getPackageBookingPaymentTotals(id)
  const totalAmount = Number(booking.totalAmount || 0)
  if (totalAmount <= 0) {
    const error = new Error('The booking total must be confirmed before recording payment.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  if (amount > Math.max(0, totalAmount - totals.verifiedAmount - totals.pendingAmount)) {
    const error = new Error('Payment amount exceeds the remaining booking balance.')
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }
  const result = await repository.recordPackageBookingPayment(
    id,
    { ...data, amount, paymentMethod },
    req.user.id,
  )
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: id,
    entityLabel: `${booking.packageName} payment`,
    beforeValues: booking,
    afterValues: result,
  })
  return result
}

async function updatePackageBookingStatus(id, data, req) {
  if (['declined', 'cancelled'].includes(data.status) && !data.reason) {
    const error = new Error(`${data.status === 'cancelled' ? 'Cancellation' : 'Decline'} reason is required.`)
    error.statusCode = 400
    error.code = 'VALIDATION_ERROR'
    error.publicMessage = error.message
    throw error
  }

  const result = await repository.updatePackageBookingStatus(id, data, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: result.after.id,
    entityLabel: result.after.packageName,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function verifyPackageBookingPayment(id, req) {
  const result = await repository.verifyPackageBookingPayment(id, req.user.id)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: result.after.id,
    entityLabel: `${result.after.packageName} payment`,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function rejectPackageBookingPayment(id, data, req) {
  const result = await repository.rejectPackageBookingPayment(id, data)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: result.after.id,
    entityLabel: `${result.after.packageName} payment`,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function updatePackageBookingNotes(id, data, req) {
  const result = await repository.updatePackageBookingNotes(id, data)
  await logCmsContentAudit({
    req,
    action: 'update',
    entityType: 'package_booking_request',
    entityId: result.after.id,
    entityLabel: result.after.packageName,
    beforeValues: result.before,
    afterValues: result.after,
  })
  return result.after
}

async function listNewsletterSubscribers(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listNewsletterSubscribers(filters, pagination))
}

async function updateNewsletterStatus(id, data, req) {
  const result = await repository.updateNewsletterStatus(id, data.status)
  await logCmsContentAudit({ req, action: 'update', entityType: 'newsletter_subscriber', entityId: result.after.id, entityLabel: result.after.email, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listUsers(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listUsers(filters, pagination))
}

async function getUser(id) {
  const user = await repository.getUserById(id)
  if (!user) throw notFound('User')
  return user
}

async function updateUserStatus(id, data, req) {
  const result = await repository.updateUserStatus(id, data.status)
  await logCmsContentAudit({ req, action: 'update', entityType: 'user', entityId: result.after.id, entityLabel: result.after.email, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listRoles() {
  return { items: await repository.listRoles() }
}

async function listPermissions() {
  return { items: await repository.listPermissions() }
}

async function updateUserRoles(id, data, req) {
  const result = await repository.replaceUserRoles(id, data.roleIds, req.user.id)
  await logCmsContentAudit({ req, action: 'permission_change', entityType: 'user', entityId: result.after.id, entityLabel: result.after.email, beforeValues: result.before, afterValues: result.after })
  return result.after
}

async function listAuditLogs(filters) {
  const pagination = getPagination(filters)
  return withPagination(filters, await repository.listAuditLogs(filters, pagination))
}

async function getAuditLog(id) {
  const log = await repository.getAuditLogById(id)
  if (!log) throw notFound('Audit log')
  return log
}

function notFound(label) {
  const error = new Error(`${label} not found.`)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = `${label} not found.`
  return error
}

module.exports = {
  archiveMedia,
  createInquiryResponse,
  createMedia,
  createWalkInPackageBooking,
  extendPackageBookingDepositDeadline,
  getAuditLog,
  getInquiry,
  getMedia,
  getUser,
  listAuditLogs,
  listInquiries,
  listInquiryResponses,
  listMedia,
  listNewsletterSubscribers,
  listPackageBookingRequests,
  listPermissions,
  listRoles,
  listUsers,
  getPackageBookingRequest,
  updateInquiryStatus,
  updateMedia,
  updateNewsletterStatus,
  updatePackageBookingNotes,
  updatePackageBookingSchedule,
  updatePackageBookingStatus,
  rejectPackageBookingPayment,
  recordPackageBookingPayment,
  verifyPackageBookingPayment,
  transferPackageBookingCredit,
  updateUserRoles,
  updateUserStatus,
}
