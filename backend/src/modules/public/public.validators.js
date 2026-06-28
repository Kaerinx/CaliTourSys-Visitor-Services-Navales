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
  })
  .strict()

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
  from: dateQuerySchema,
  to: dateQuerySchema,
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
  productListQuerySchema,
  packageListQuerySchema,
  promotionListQuerySchema,
  eventListQuerySchema,
  businessListQuerySchema,
  destinationListQuerySchema,
  museumArtifactListQuerySchema,
  mapLocationsQuerySchema,
  sessionTokenParamsSchema,
  itineraryItemParamsSchema,
  createItinerarySessionBodySchema,
  createItineraryItemBodySchema,
  createInquiryBodySchema,
  createNewsletterSubscriptionBodySchema,
}
