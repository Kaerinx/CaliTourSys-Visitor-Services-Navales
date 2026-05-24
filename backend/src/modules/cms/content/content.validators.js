const { z } = require('zod')
const { CMS_SLUG_PATTERN } = require('../../../utils/cmsSlug')

const uuidParamsSchema = z.object({
  id: z.uuid('id must be a valid UUID.'),
})

const contentStatusSchema = z.enum(['draft', 'published', 'archived'])
const promotionTypeSchema = z.enum(['campaign', 'featured', 'seasonal', 'announcement'])

const optionalDateSchema = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable()

const slugSchema = z
  .string()
  .trim()
  .regex(CMS_SLUG_PATTERN, 'Slug must contain lowercase letters, numbers, and hyphens only.')

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return undefined
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return value
}, z.boolean().optional())

function listQuery(sortValues) {
  return z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(120).optional(),
    status: contentStatusSchema.optional(),
    featured: booleanQuerySchema,
    sort: z.enum(sortValues).default('-createdAt'),
  })
}

const promotionListQuerySchema = listQuery([
  'createdAt',
  '-createdAt',
  'updatedAt',
  '-updatedAt',
  'title',
  '-title',
  'status',
])

const eventListQuerySchema = listQuery([
  'createdAt',
  '-createdAt',
  'updatedAt',
  '-updatedAt',
  'title',
  '-title',
  'status',
  'startsAt',
  '-startsAt',
])

const categoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: contentStatusSchema.optional(),
  sort: z.enum(['displayOrder', '-displayOrder', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'status']).default('displayOrder'),
})

const promotionBaseSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(1).max(255),
    summary: z.string().trim().max(5000).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    promotionType: promotionTypeSchema,
    accentColor: z.string().trim().max(32).optional().nullable(),
    startsAt: optionalDateSchema,
    endsAt: optionalDateSchema,
    status: contentStatusSchema.default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict()

const promotionBodySchema = promotionBaseSchema.refine(
  (data) =>
    !data.startsAt ||
    !data.endsAt ||
    new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(),
  'endsAt must be greater than or equal to startsAt.',
)

const promotionPatchSchema = promotionBaseSchema.partial().refine(
  (data) =>
    !data.startsAt ||
    !data.endsAt ||
    new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(),
  'endsAt must be greater than or equal to startsAt.',
)

const eventBaseSchema = z
  .object({
    categoryId: z.uuid('categoryId must be a valid UUID.'),
    slug: slugSchema,
    title: z.string().trim().min(1).max(255),
    shortDescription: z.string().trim().max(5000).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    venueName: z.string().trim().max(255).optional().nullable(),
    organizerName: z.string().trim().max(255).optional().nullable(),
    contactInfo: z.string().trim().max(255).optional().nullable(),
    addressLine: z.string().trim().max(5000).optional().nullable(),
    barangay: z.string().trim().max(120).optional().nullable(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: optionalDateSchema,
    accentColor: z.string().trim().max(32).optional().nullable(),
    status: contentStatusSchema.default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict()

const eventBodySchema = eventBaseSchema.refine(
  (data) => !data.endsAt || new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(),
  'endsAt must be greater than or equal to startsAt.',
)

const eventPatchSchema = eventBaseSchema.partial().refine(
  (data) =>
    !data.startsAt ||
    !data.endsAt ||
    new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(),
  'endsAt must be greater than or equal to startsAt.',
)

const categoryBodySchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(5000).optional().nullable(),
    displayOrder: z.number().int().default(0),
    status: contentStatusSchema.default('published'),
    color: z.string().trim().max(32).optional().nullable(),
  })
  .strict()

const categoryPatchSchema = categoryBodySchema.partial()

module.exports = {
  categoryBodySchema,
  categoryListQuerySchema,
  categoryPatchSchema,
  eventBodySchema,
  eventListQuerySchema,
  eventPatchSchema,
  promotionBodySchema,
  promotionListQuerySchema,
  promotionPatchSchema,
  uuidParamsSchema,
}
