const repository = require('./public.repository')
const { getPagination, buildPaginationMeta } = require('../../utils/pagination')
const { createPublicSessionToken } = require('../../utils/token')
const {
  addDateOnlyDays,
  buildSchedule,
  calculatePaymentTerms,
  requireCurrentOrFutureStartDate,
  requireGender,
  roundMoney,
  validateElectronicPaymentEvidence,
  validatePaymentMethod,
} = require('../booking/bookingRules')

function createNotFoundError(message) {
  const error = new Error(message)
  error.statusCode = 404
  error.code = 'NOT_FOUND'
  error.publicMessage = message
  return error
}

function createConflictError(message) {
  const error = new Error(message)
  error.statusCode = 409
  error.code = 'CONFLICT'
  error.publicMessage = message
  return error
}

function createValidationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'VALIDATION_ERROR'
  error.publicMessage = message
  return error
}

const DEFAULT_PAYMENT_INSTRUCTIONS =
  'Manual payment instructions will be provided by the Calabanga Tourism Office after review. Upload proof of payment here after sending the payment.'
const PAY_AT_OFFICE_INSTRUCTIONS =
  'Pay the full amount in cash at the Calabanga Tourism Office no later than one day before departure. Staff will record the payment before approving the booking.'

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isFiniteAmount(value) {
  const parsed = toFiniteNumber(value)
  return parsed !== null && parsed >= 0
}

function toPositiveInteger(value) {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return null
  const integer = Math.trunc(parsed)
  return integer >= 1 ? integer : null
}

function optionalText(value, maxLength, fieldLabel) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.length > maxLength) throw createValidationError(`${fieldLabel} must be ${maxLength} characters or fewer.`)
  return text
}

function normalizeLookupReference(value) {
  const raw = String(value || '').trim()
  if (/^\d{6}-TOUR-\d{6}$/i.test(raw)) return raw.toUpperCase()
  const withoutPrefix = raw.replace(/^pkg[-\s]*/i, '').trim()
  const uuidMatch = withoutPrefix.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )

  return uuidMatch ? withoutPrefix.toLowerCase() : null
}

function normalizePhoneForLookup(value) {
  const normalized = String(value || '').replace(/\D/g, '')
  return normalized || null
}

function buildPublicBookingLookupResponse(request) {
  const hasComputedTotal = isFiniteAmount(request.totalAmount)
  const totalAmount = Number(request.totalAmount || 0)
  const verifiedAndCreditedAmount = Number(request.verifiedPaymentAmount || 0) + Number(request.appliedCreditAmount || 0)
  const initialPaymentAmount = Number(request.initialPaymentAmount || 0)
  const rawPendingPaymentAmount = Number(request.pendingPaymentAmount || 0)
  const pendingPaymentCap = request.paymentPlan === 'deposit_50' && verifiedAndCreditedAmount <= 0
    ? initialPaymentAmount || Math.round(totalAmount * 50) / 100
    : Math.max(0, totalAmount - verifiedAndCreditedAmount)
  const pendingPaymentAmount = hasComputedTotal
    ? Math.min(rawPendingPaymentAmount, Math.max(0, pendingPaymentCap))
    : rawPendingPaymentAmount
  const balanceDueAt = request.paymentPlan === 'deposit_50' && request.endDate
    ? new Date(`${addDateOnlyDays(request.endDate, -1)}T23:59:59+08:00`).toISOString()
    : request.balanceDueAt
  const proof = request.proofOfPayment
    ? {
        originalFilename: request.proofOfPayment.originalFilename,
        mimeType: request.proofOfPayment.mimeType,
        fileSize: request.proofOfPayment.fileSize,
        uploadedAt: request.proofOfPayment.uploadedAt,
      }
    : null

  return {
    id: request.id,
    bookingReference: request.bookingReference || `PKG-${request.id}`,
    packageId: request.packageId,
    packageName: request.packageName,
    bookingSource: request.bookingSource,
    selectedPax: request.selectedPax,
    startDate: request.startDate || request.preferredBookingDate,
    endDate: request.endDate || request.preferredBookingDate,
    durationDays: request.durationDays || 1,
    preferredBookingDate: request.preferredBookingDate,
    totalAmount: request.totalAmount,
    pricingNote: request.pricingNote || (!hasComputedTotal ? 'Price upon inquiry.' : ''),
    bookingStatus: request.bookingStatus,
    paymentStatus: request.paymentStatus,
    paymentRequired: request.paymentRequired,
    paymentPlan: request.paymentPlan,
    paymentMode: request.paymentMode,
    initialPaymentAmount: request.initialPaymentAmount,
    verifiedPaymentAmount: request.verifiedPaymentAmount || 0,
    pendingPaymentAmount,
    appliedCreditAmount: request.appliedCreditAmount || 0,
    remainingAmount: hasComputedTotal
      ? Math.max(
          0,
          totalAmount -
            verifiedAndCreditedAmount -
            pendingPaymentAmount,
        )
      : null,
    depositDueAt: request.depositDueAt,
    balanceDueAt,
    depositStatus: request.depositStatus,
    paymentMethod: request.paymentMethod,
    paymentInstruction: request.paymentRequired && hasComputedTotal ? request.paymentInstruction : '',
    proofOfPayment: proof,
    paymentSubmittedAt: request.paymentSubmittedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }
}

async function getHome() {
  return repository.getHome()
}

async function listProducts(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listProducts(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getProductBySlug(slug) {
  const product = await repository.getProductBySlug(slug)
  if (!product) throw createNotFoundError('Product not found.')
  return product
}

async function listPackages(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listPackages(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getPackageBySlug(slug) {
  const tourismPackage = await repository.getPackageBySlug(slug)
  if (!tourismPackage) throw createNotFoundError('Package not found.')
  return tourismPackage
}

function buildPackageBookingPricing(tourismPackage, selectedPax) {
  const minimumPax = toPositiveInteger(tourismPackage.min_pax) || 1
  const maximumPax = toPositiveInteger(tourismPackage.max_pax)

  if (selectedPax < minimumPax) {
    throw createValidationError(`Selected pax must be at least ${minimumPax}.`)
  }

  if (maximumPax && selectedPax > maximumPax) {
    throw createValidationError(`Selected pax cannot exceed ${maximumPax}.`)
  }

  const basePrice = toFiniteNumber(tourismPackage.base_price)
  const basePaxSnapshot = toPositiveInteger(tourismPackage.base_pax)
  const calculationBasePax = basePaxSnapshot || minimumPax || 1
  const extraPaxPrice = toFiniteNumber(tourismPackage.extra_pax_price)

  if (!isFiniteAmount(basePrice)) {
    return {
      basePriceSnapshot: null,
      basePaxSnapshot,
      extraPaxPriceSnapshot: isFiniteAmount(extraPaxPrice) ? extraPaxPrice : null,
      computedTotalAmount: null,
      pricingNote: 'Price upon inquiry.',
    }
  }

  if (selectedPax <= calculationBasePax) {
    return {
      basePriceSnapshot: basePrice,
      basePaxSnapshot,
      extraPaxPriceSnapshot: isFiniteAmount(extraPaxPrice) ? extraPaxPrice : null,
      computedTotalAmount: basePrice,
      pricingNote: null,
    }
  }

  if (!isFiniteAmount(extraPaxPrice)) {
    return {
      basePriceSnapshot: basePrice,
      basePaxSnapshot,
      extraPaxPriceSnapshot: null,
      computedTotalAmount: null,
      pricingNote: 'Extra person pricing is upon inquiry.',
    }
  }

  return {
    basePriceSnapshot: basePrice,
    basePaxSnapshot,
    extraPaxPriceSnapshot: extraPaxPrice,
    computedTotalAmount: basePrice + (selectedPax - calculationBasePax) * extraPaxPrice,
    pricingNote: null,
  }
}

async function createPackageBookingRequest(body, context = {}) {
  const tourismPackage = await repository.getPackageForBooking(body.packageId)
  if (!tourismPackage) throw createNotFoundError('Package not found.')

  const participants = Array.isArray(body.participants)
    ? body.participants.map((participant, index) => ({
        participantOrder: index + 1,
        fullName: participant.fullName,
        age: participant.age ?? null,
        gender: requireGender(participant.gender, `Participant ${index + 1} gender`),
        notes: participant.notes || '',
      }))
    : []
  const selectedPax = toPositiveInteger(body.selectedPax)
  if (!selectedPax) throw createValidationError('Selected pax must be at least 1.')
  if (participants.length > selectedPax) {
    throw createValidationError('Participant entries cannot exceed selected pax.')
  }

  const pricing = buildPackageBookingPricing(tourismPackage, selectedPax)
  const hasComputedTotal = isFiniteAmount(pricing.computedTotalAmount)
  const paymentRequired = Boolean(tourismPackage.payment_required) || hasComputedTotal
  const representative = body.representativeContact || {
    fullName: body.fullName,
    email: body.email,
    phoneNumber: body.phoneNumber,
  }
  const bookingSource = context.bookingSource || 'online'
  const paymentMode = body.paymentMode || (body.paymentMethod === 'cash' ? 'pay_at_office' : 'online')
  const paymentPlan = paymentMode === 'pay_at_office' ? 'full_payment' : body.paymentPlan
  const paymentMethod = paymentMode === 'pay_at_office'
    ? 'cash'
    : body.paymentMethod || (bookingSource === 'walk_in' ? 'cash' : 'qr_instapay')
  const schedule = buildSchedule({
    startDate: body.startDate || body.preferredBookingDate,
    durationDays: body.durationDays || tourismPackage.duration_days || 1,
    endDate: body.endDate,
  })
  requireCurrentOrFutureStartDate(schedule.startDate)
  const paymentTerms = paymentRequired && hasComputedTotal
    ? calculatePaymentTerms({
        totalAmount: pricing.computedTotalAmount,
        paymentRequired,
        paymentPlan,
        paymentMode,
        bookingSource,
        paymentMethod,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      })
    : {
        paymentPlan: null,
        paymentMode,
        paymentMethod: null,
        initialPaymentAmount: null,
        depositDueAt: null,
        balanceDueAt: null,
        depositStatus: paymentRequired ? 'pending' : 'not_required',
      }

  return repository.createPackageBookingRequest({
    packageId: tourismPackage.id,
    packageNameSnapshot: tourismPackage.name,
    selectedPax,
    ...pricing,
    visitorFullName: representative.fullName,
    visitorEmail: representative.email,
    visitorPhoneNumber: representative.phoneNumber,
    representativeFullName: representative.fullName,
    representativeEmail: representative.email,
    representativePhoneNumber: representative.phoneNumber,
    representativeGender: representative.gender ? requireGender(representative.gender, 'Representative gender') : null,
    participants,
    preferredBookingDate: schedule.startDate,
    bookingSource,
    ...schedule,
    ...paymentTerms,
    message: body.message || '',
    touristAccountId: context.touristAccountId || null,
    paymentRequiredSnapshot: paymentRequired,
    paymentInstructionSnapshot: paymentRequired && hasComputedTotal
      ? paymentMode === 'pay_at_office'
        ? PAY_AT_OFFICE_INSTRUCTIONS
        : DEFAULT_PAYMENT_INSTRUCTIONS
      : null,
    bookingStatus: 'pending',
    paymentStatus: paymentRequired && hasComputedTotal ? 'unpaid' : 'pending_inquiry',
  })
}

async function uploadPackageBookingPaymentProof(requestId, proof, body = {}, context = {}) {
  if (!proof) throw createValidationError('Upload a proof of payment file.')

  const request = await repository.getPackageBookingRequestById(requestId)
  if (!request) throw createNotFoundError('Booking request not found.')
  if (!context.touristAccountId || request.tourist_account_id !== context.touristAccountId) {
    throw createNotFoundError('Booking request not found.')
  }

  if (!request.payment_required_snapshot) {
    throw createValidationError('This booking request does not require payment proof.')
  }

  if (!isFiniteAmount(request.computed_total_amount)) {
    throw createValidationError('This booking request is still inquiry-based and does not accept payment proof yet.')
  }

  if (request.payment_mode === 'pay_at_office' || request.selected_payment_method === 'cash') {
    throw createValidationError('Walk-in cash payments must be recorded by Tourism Office staff.')
  }

  const paymentMethod = validatePaymentMethod(
    request.booking_source || 'online',
    body.paymentMethod || request.selected_payment_method || 'qr_instapay',
  )
  if (paymentMethod === 'credit_debit_card') {
    throw createValidationError('Card payments must be completed through the secure card checkout. Card details and payment proof cannot be submitted through this upload form.')
  }
  const paymentReferenceNumber = optionalText(body.paymentReferenceNumber, 120, 'Payment reference number')
  validateElectronicPaymentEvidence({
    paymentMethod,
    transactionReference: paymentReferenceNumber,
    proofFileUrl: proof.fileUrl,
  })
  const amount = roundMoney(
    body.amount || request.initial_payment_amount || request.computed_total_amount,
  )
  if (amount <= 0 || amount > Number(request.computed_total_amount)) {
    throw createValidationError('Payment amount must be greater than zero and cannot exceed the booking total.')
  }

  return repository.updatePackageBookingPaymentProof(requestId, {
    ...proof,
    amount,
    paymentMethod,
    paymentReferenceNumber,
    paymentNotes: optionalText(body.paymentNotes, 2000, 'Payment notes'),
  })
}

async function lookupPackageBookingRequest(body) {
  const requestId = normalizeLookupReference(body.bookingReference || body.requestId)
  const email = body.email ? String(body.email).trim().toLowerCase() : null
  const phoneNumber = normalizePhoneForLookup(body.phoneNumber)

  if (!requestId) throw createNotFoundError('No booking request matched those details.')
  if (!email && !phoneNumber) throw createValidationError('Email address or phone number is required.')

  const request = await repository.findPackageBookingRequestForPublicLookup({
    requestId,
    email,
    phoneNumber,
  })

  if (!request) throw createNotFoundError('No booking request matched those details.')

  return buildPublicBookingLookupResponse(request)
}

async function listTouristPackageBookingRequests(touristAccountId) {
  const requests = await repository.listPackageBookingRequestsByTouristId(touristAccountId)
  return requests.map(buildPublicBookingLookupResponse)
}

async function getTouristPackageBookingRequest({ requestId, touristAccountId }) {
  const request = await repository.getPackageBookingRequestByTouristId({ requestId, touristAccountId })
  if (!request) throw createNotFoundError('Booking request not found.')
  return buildPublicBookingLookupResponse(request)
}

async function createTouristPackageBookingDateChangeRequest({
  requestId,
  touristAccountId,
  startDate,
  endDate,
  durationDays,
  reason,
}) {
  const request = await repository.getPackageBookingRequestByTouristId({ requestId, touristAccountId })
  if (!request) throw createNotFoundError('Booking request not found.')
  if (['declined', 'cancelled', 'expired'].includes(request.bookingStatus)) {
    throw createValidationError('This booking can no longer be rescheduled.')
  }
  const schedule = buildSchedule({ startDate, endDate, durationDays })
  requireCurrentOrFutureStartDate(schedule.startDate)
  return repository.createPackageBookingDateChangeRequest({
    requestId,
    touristAccountId,
    ...schedule,
    reason,
  })
}

async function listEvents(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listEvents(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getEventBySlug(slug) {
  const event = await repository.getEventBySlug(slug)
  if (!event) throw createNotFoundError('Event not found.')
  return event
}

async function listDestinations(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listDestinations(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function listTourismAssets(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listTourismAssets(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getDestinationBySlug(slug) {
  const destination = await repository.getDestinationBySlug(slug)
  if (!destination) throw createNotFoundError('Destination not found.')
  return destination
}

async function listMuseumArtifacts(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listMuseumArtifacts(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getMuseumArtifactBySlug(slug) {
  const artifact = await repository.getMuseumArtifactBySlug(slug)
  if (!artifact) throw createNotFoundError('Museum artifact not found.')
  return artifact
}

async function listPromotions(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listPromotions(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function getPromotionBySlug(slug) {
  const promotion = await repository.getPromotionBySlug(slug)
  if (!promotion) throw createNotFoundError('Promotion not found.')
  return promotion
}

async function getBusinessBySlug(slug) {
  const business = await repository.getBusinessBySlug(slug)
  if (!business) throw createNotFoundError('Business not found.')
  return business
}

async function listAccreditedBusinesses(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listAccreditedBusinesses(filters, pagination)

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

async function listMapLocations(filters) {
  const locations = await repository.listMapLocations(filters)

  if (filters.format === 'geojson') {
    return {
      type: 'FeatureCollection',
      features: locations.map((location) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        properties: {
          id: location.id,
          targetId: location.targetId,
          locationType: location.locationType,
          slug: location.slug,
          label: location.label,
          category: location.category,
          markerColor: location.markerColor,
          markerIcon: location.markerIcon,
          primaryImage: location.primaryImage,
          description: location.description,
        },
      })),
    }
  }

  return locations
}

async function listEmergencyFacilities() {
  const facilities = await repository.listEmergencyFacilities()

  return {
    type: 'FeatureCollection',
    features: facilities.map((facility) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [facility.longitude, facility.latitude],
      },
      properties: {
        id: facility.id,
        slug: facility.slug,
        name: facility.name,
        facilityType: facility.facilityType,
        description: facility.description,
        addressLine: facility.addressLine,
        barangay: facility.barangay,
        municipality: facility.municipality,
        province: facility.province,
        openingHours: facility.openingHours,
        contacts: facility.contacts,
        accessibilityFeatures: facility.accessibilityFeatures,
        amenities: facility.amenities,
        verification: facility.verification,
      },
    })),
  }
}

async function getMapLocationDetails(id) {
  const details = await repository.getMapLocationDetails(id)
  if (!details) throw createNotFoundError('Map location details not found.')
  return details
}

function listProductCategories() {
  return repository.listCategories('product_categories')
}

function listEventCategories() {
  return repository.listCategories('event_categories')
}

function listDestinationCategories() {
  return repository.listCategories('destination_categories')
}

function listMuseumCategories() {
  return repository.listCategories('artifact_categories')
}

async function createItinerarySession(body) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await repository.createItinerarySession({
        sessionToken: createPublicSessionToken(),
        visitorLabel: body.visitorLabel,
      })
    } catch (error) {
      if (error.code !== '23505') throw error
    }
  }

  throw createConflictError('Unable to create itinerary session. Please try again.')
}

async function getItineraryByToken(sessionToken) {
  const itinerary = await repository.getItineraryByToken(sessionToken)
  if (!itinerary) throw createNotFoundError('Itinerary session not found.')
  return itinerary
}

async function addItineraryItem(sessionToken, body) {
  const target = await repository.getPublicTarget(body.itemType, body.targetId)
  if (!target) throw createNotFoundError('Public itinerary target not found.')

  const existing = await repository.getExistingItineraryItem(sessionToken, body.itemType, body.targetId)
  if (existing) {
    const item = await repository.getItineraryItemById(sessionToken, existing.id)
    if (!item) throw createNotFoundError('Itinerary session not found.')

    return {
      data: item,
      statusCode: 200,
      duplicateBehavior: 'idempotent',
    }
  }

  try {
    const item = await repository.createItineraryItem({
      sessionToken,
      itemType: body.itemType,
      targetId: body.targetId,
      titleSnapshot: target.title,
    })

    if (!item) throw createNotFoundError('Itinerary session not found.')

    return {
      data: item,
      statusCode: 201,
      duplicateBehavior: 'created',
    }
  } catch (error) {
    if (error.code === '23505') {
      const duplicate = await repository.getExistingItineraryItem(sessionToken, body.itemType, body.targetId)
      if (duplicate) {
        return {
          data: await repository.getItineraryItemById(sessionToken, duplicate.id),
          statusCode: 200,
          duplicateBehavior: 'idempotent',
        }
      }
    }

    throw error
  }
}

async function deleteItineraryItem(sessionToken, itemId) {
  const wasDeleted = await repository.deleteItineraryItem({ sessionToken, itemId })
  if (!wasDeleted) throw createNotFoundError('Itinerary item not found.')
}

async function getReviews(filters) {
  const target = await repository.resolveReviewTarget(filters)
  if (!target) throw createNotFoundError('Review target not found.')
  return repository.listReviews(target)
}

async function upsertReview(body, context) {
  const target = await repository.resolveReviewTarget(body)
  if (!target) throw createNotFoundError('Review target not found.')

  return repository.upsertReview({
    target,
    touristAccountId: context.touristAccountId,
    rating: body.rating,
    comment: body.comment || null,
  })
}

async function createInquiry(body, context = {}) {
  const tourist = context.tourist || null
  let productTarget = null

  if (body.productId) {
    productTarget = await repository.getProductInquiryTarget(body.productId)
    if (!productTarget) throw createNotFoundError('Product not found.')
    if (!productTarget.businessProfileId) {
      throw createValidationError('This producer is not connected to a business-owner account yet.')
    }
  }

  return repository.createInquiry({
    ...body,
    fullName: tourist?.fullName || body.fullName,
    email: tourist?.email || body.email,
    contactNumber: tourist?.phoneNumber || body.contactNumber,
    touristAccountId: tourist?.id || null,
    productId: productTarget?.productId || null,
    businessId: productTarget?.businessId || null,
    businessProfileId: productTarget?.businessProfileId || null,
  })
}

async function createNewsletterSubscription(body) {
  const result = await repository.createNewsletterSubscription(body)

  return {
    data: {
      email: result.email,
      status: result.status,
      subscribedAt: result.subscribedAt,
    },
    statusCode: result.wasExisting ? 200 : 201,
  }
}

module.exports = {
  getHome,
  listProducts,
  getProductBySlug,
  listPackages,
  getPackageBySlug,
  createPackageBookingRequest,
  createTouristPackageBookingDateChangeRequest,
  getTouristPackageBookingRequest,
  lookupPackageBookingRequest,
  listTouristPackageBookingRequests,
  uploadPackageBookingPaymentProof,
  listEvents,
  getEventBySlug,
  listDestinations,
  listTourismAssets,
  getDestinationBySlug,
  listMuseumArtifacts,
  getMuseumArtifactBySlug,
  listPromotions,
  getPromotionBySlug,
  listAccreditedBusinesses,
  getBusinessBySlug,
  listMapLocations,
  listEmergencyFacilities,
  getMapLocationDetails,
  listProductCategories,
  listEventCategories,
  listDestinationCategories,
  listMuseumCategories,
  createItinerarySession,
  getItineraryByToken,
  addItineraryItem,
  deleteItineraryItem,
  getReviews,
  upsertReview,
  createInquiry,
  createNewsletterSubscription,
}
