const repository = require('./public.repository')
const { getPagination, buildPaginationMeta } = require('../../utils/pagination')
const { createPublicSessionToken } = require('../../utils/token')

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
    bookingReference: `PKG-${request.id}`,
    packageId: request.packageId,
    packageName: request.packageName,
    selectedPax: request.selectedPax,
    preferredBookingDate: request.preferredBookingDate,
    totalAmount: request.totalAmount,
    pricingNote: request.pricingNote || (!hasComputedTotal ? 'Price upon inquiry.' : ''),
    bookingStatus: request.bookingStatus,
    paymentStatus: request.paymentStatus,
    paymentRequired: request.paymentRequired,
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
        age: participant.age,
        gender: participant.gender,
        notes: participant.notes || '',
      }))
    : []
  const selectedPax = toPositiveInteger(body.selectedPax)
  if (!selectedPax) throw createValidationError('Selected pax must be at least 1.')
  if (participants.length && participants.length !== selectedPax) {
    throw createValidationError('Participant count must match selected pax.')
  }

  const pricing = buildPackageBookingPricing(tourismPackage, selectedPax)
  const paymentRequired = Boolean(tourismPackage.payment_required)
  const hasComputedTotal = isFiniteAmount(pricing.computedTotalAmount)
  const representative = body.representativeContact || {
    fullName: body.fullName,
    email: body.email,
    phoneNumber: body.phoneNumber,
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
    participants,
    preferredBookingDate: body.preferredBookingDate,
    message: body.message || '',
    touristAccountId: context.touristAccountId || null,
    paymentRequiredSnapshot: paymentRequired,
    paymentInstructionSnapshot: paymentRequired && hasComputedTotal ? DEFAULT_PAYMENT_INSTRUCTIONS : null,
    bookingStatus: 'pending',
    paymentStatus: paymentRequired && hasComputedTotal ? 'unpaid' : 'pending_inquiry',
  })
}

async function uploadPackageBookingPaymentProof(requestId, proof, body = {}) {
  if (!proof) throw createValidationError('Upload a proof of payment file.')

  const request = await repository.getPackageBookingRequestById(requestId)
  if (!request) throw createNotFoundError('Booking request not found.')

  if (!request.payment_required_snapshot) {
    throw createValidationError('This booking request does not require payment proof.')
  }

  if (!isFiniteAmount(request.computed_total_amount)) {
    throw createValidationError('This booking request is still inquiry-based and does not accept payment proof yet.')
  }

  if (request.payment_status === 'verified') {
    throw createValidationError('This payment has already been verified and can no longer be replaced.')
  }

  return repository.updatePackageBookingPaymentProof(requestId, {
    ...proof,
    paymentReferenceNumber: optionalText(body.paymentReferenceNumber, 120, 'Payment reference number'),
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

async function createInquiry(body) {
  return repository.createInquiry(body)
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
  listProductCategories,
  listEventCategories,
  listDestinationCategories,
  listMuseumCategories,
  createItinerarySession,
  getItineraryByToken,
  addItineraryItem,
  deleteItineraryItem,
  createInquiry,
  createNewsletterSubscription,
}
