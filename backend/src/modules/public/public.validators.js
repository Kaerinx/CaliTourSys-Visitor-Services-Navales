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
  promotionListQuerySchema,
  eventListQuerySchema,
  destinationListQuerySchema,
  museumArtifactListQuerySchema,
  mapLocationsQuerySchema,
}
