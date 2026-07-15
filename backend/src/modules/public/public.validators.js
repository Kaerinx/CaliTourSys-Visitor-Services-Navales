const { z } = require('zod')
const { SLUG_PATTERN } = require('../../utils/slug')

const slugSchema = z.string().regex(SLUG_PATTERN, 'Slug must contain lowercase letters, numbers, and hyphens only.')

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return undefined
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return value
}, z.boolean().optional())

const pageSchema = z.coerce.number().int().positive().default(1)
const limitSchema = z.coerce.number().int().positive().max(50).default(12)
const searchSchema = z.string().trim().max(120).optional()
const categorySchema = slugSchema.optional()
const statusSchema = z.enum(['published']).optional()

const dateQuerySchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be a valid date or date-time string.')
  .optional()

function listQuery(sortValues) {
  return z.object({
    page: pageSchema,
    limit: limitSchema,
    search: searchSchema,
    category: categorySchema,
    status: statusSchema,
    featured: booleanQuerySchema,
    sort: z.enum(sortValues).optional(),
  })
}

const slugParamsSchema = z.object({
  slug: slugSchema,
})

const mapLocationParamsSchema = z.object({
  id: z.uuid('id must be a valid map location UUID.'),
})

const sessionTokenParamsSchema = z.object({
  sessionToken: z
    .string()
    .min(16)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/, 'sessionToken must be a safe opaque token string.'),
})

const itineraryItemParamsSchema = sessionTokenParamsSchema.extend({
  itemId: z.uuid('itemId must be a valid UUID.'),
})

const packageBookingRequestParamsSchema = z.object({
  requestId: z.uuid('requestId must be a valid UUID.'),
})

const createItinerarySessionBodySchema = z
  .object({
    visitorLabel: z.string().trim().min(1).max(120).optional(),
  })
  .strict()

const createItineraryItemBodySchema = z
  .object({
    itemType: z.enum(['product', 'event', 'destination', 'artifact']),
    targetId: z.uuid('targetId must be a valid UUID.'),
  })
  .strict()

const createInquiryBodySchema = z
  .object({
    fullName: z.string().trim().min(1).max(255),
    email: z.email().max(255),
    contactNumber: z.string().trim().max(80).optional(),
    subject: z.string().trim().min(1).max(255),
    message: z.string().trim().min(1).max(5000),
    sourcePage: z.string().trim().max(255).optional(),
    productId: z.uuid('productId must be a valid UUID.').optional(),
  })
  .strict()

const reviewTargetTypeSchema = z.enum([
  'product',
  'destination',
  'tourism_asset',
  'business',
])

const reviewListQuerySchema = z.object({
  targetType: reviewTargetTypeSchema,
  targetId: z.uuid('targetId must be a valid UUID.'),
})

const createReviewBodySchema = z
  .object({
    targetType: reviewTargetTypeSchema,
    targetId: z.uuid('targetId must be a valid UUID.'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict()

const bookingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Must be a valid booking date.')

const packageBookingParticipantSchema = z
  .object({
    fullName: z.string().trim().min(1).max(255),
    age: z.coerce.number().int().min(0).max(130).optional(),
    gender: z.enum(['M', 'F', 'Male', 'Female', 'male', 'female']),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict()

const packageBookingRepresentativeSchema = z
  .object({
    fullName: z.string().trim().min(1).max(255),
    email: z.email().max(255),
    phoneNumber: z.string().trim().min(1).max(80),
    gender: z.enum(['M', 'F', 'Male', 'Female', 'male', 'female']).optional(),
  })
  .strict()

const createPackageBookingRequestBodySchema = z
  .object({
    packageId: z.uuid('packageId must be a valid UUID.'),
    selectedPax: z.coerce.number().int().min(1, 'selectedPax must be at least 1.'),
    fullName: z.string().trim().min(1).max(255).optional(),
    email: z.email().max(255).optional(),
    phoneNumber: z.string().trim().min(1).max(80).optional(),
    representativeContact: packageBookingRepresentativeSchema.optional(),
    participants: z.array(packageBookingParticipantSchema).min(1).max(80).optional(),
    preferredBookingDate: bookingDateSchema.optional(),
    startDate: bookingDateSchema.optional(),
    endDate: bookingDateSchema.optional(),
    durationDays: z.coerce.number().int().min(1).optional(),
    paymentMode: z.enum(['pay_at_office', 'online']).default('online'),
    paymentPlan: z.enum(['deposit_50', 'full_payment']).default('full_payment'),
    paymentMethod: z.enum(['qr_instapay', 'credit_debit_card', 'cash']).default('qr_instapay'),
    message: z.string().trim().max(5000).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.representativeContact ||
      (data.fullName && data.email && data.phoneNumber),
    {
      message: 'Representative contact information is required.',
      path: ['representativeContact'],
    },
  )
  .refine((data) => data.startDate || data.preferredBookingDate, {
    message: 'Start date is required.',
    path: ['startDate'],
  })

const lookupPackageBookingRequestBodySchema = z
  .object({
    bookingReference: z.string().trim().min(1).max(120).optional(),
    requestId: z.string().trim().min(1).max(120).optional(),
    email: z.email().max(255).optional(),
    phoneNumber: z.string().trim().max(80).optional(),
  })
  .strict()
  .refine((data) => data.bookingReference || data.requestId, {
    message: 'Booking reference is required.',
    path: ['bookingReference'],
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: 'Email address or phone number is required.',
    path: ['email'],
  })

const createNewsletterSubscriptionBodySchema = z
  .object({
    email: z.email().max(255),
    fullName: z.string().trim().min(1).max(255).optional(),
  })
  .strict()

const productListQuerySchema = listQuery([
  'name',
  '-name',
  'publishedAt',
  '-publishedAt',
  'price',
  '-price',
  'featured',
]).extend({
  business: slugSchema.optional(),
  tag: z.string().trim().max(80).optional(),
})

const packageListQuerySchema = listQuery(['name', '-name', 'updatedAt', '-updatedAt']).extend({
  category: z.string().trim().max(120).optional(),
  targetMarket: z.string().trim().max(120).optional(),
})

const tourismAssetListQuerySchema = listQuery(['name', '-name', 'updatedAt', '-updatedAt', 'featured']).extend({
  category: z.string().trim().max(120).optional(),
  targetMarket: z.string().trim().max(120).optional(),
})

const promotionListQuerySchema = listQuery([
  'startsAt',
  '-startsAt',
  'title',
  '-title',
  'featured',
])

const eventListQuerySchema = listQuery([
  'startsAt',
  '-startsAt',
  'title',
  '-title',
  'featured',
]).extend({
  category: z.string().trim().max(120).optional(),
  from: dateQuerySchema,
  to: dateQuerySchema,
  period: z.enum(['upcoming', 'past', 'all']).optional(),
})

const destinationListQuerySchema = listQuery([
  'name',
  '-name',
  'publishedAt',
  '-publishedAt',
  'featured',
]).extend({
  barangay: z.string().trim().max(120).optional(),
})

const museumArtifactListQuerySchema = listQuery(['name', '-name', 'publishedAt', '-publishedAt', 'featured'])

const businessListQuerySchema = listQuery(['name', '-name', 'issuedAt', '-issuedAt']).extend({
  businessType: z.string().trim().max(120).optional(),
})

const mapLocationsQuerySchema = z.object({
  type: z.enum(['destination', 'business', 'event']).optional(),
  category: categorySchema,
  status: statusSchema,
  featured: booleanQuerySchema,
  bounds: z.string().trim().max(120).optional(),
  format: z.enum(['list', 'geojson']).default('list'),
})

module.exports = {
  slugParamsSchema,
  mapLocationParamsSchema,
  productListQuerySchema,
  packageListQuerySchema,
  tourismAssetListQuerySchema,
  promotionListQuerySchema,
  eventListQuerySchema,
  businessListQuerySchema,
  destinationListQuerySchema,
  museumArtifactListQuerySchema,
  mapLocationsQuerySchema,
  sessionTokenParamsSchema,
  itineraryItemParamsSchema,
  packageBookingRequestParamsSchema,
  createItinerarySessionBodySchema,
  createItineraryItemBodySchema,
  createInquiryBodySchema,
  reviewListQuerySchema,
  createReviewBodySchema,
  createPackageBookingRequestBodySchema,
  lookupPackageBookingRequestBodySchema,
  createNewsletterSubscriptionBodySchema,
}
