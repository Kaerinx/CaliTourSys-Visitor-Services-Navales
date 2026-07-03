const { z } = require('zod')
const { CMS_SLUG_PATTERN } = require('../../../utils/cmsSlug')

const uuidParamsSchema = z.object({
  id: z.uuid('id must be a valid UUID.'),
})

const contentStatusSchema = z.enum(['draft', 'published', 'archived'])
const businessStatusSchema = z.enum(['active', 'inactive', 'archived'])
const promotionTypeSchema = z.enum(['campaign', 'featured', 'seasonal', 'announcement'])
const mapLocationTypeSchema = z.enum(['destination', 'business', 'event'])

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

function filteredListQuery(sortValues, extra = {}) {
  return z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(120).optional(),
    status: contentStatusSchema.optional(),
    featured: booleanQuerySchema,
    sort: z.enum(sortValues).default('-createdAt'),
    ...extra,
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

const productListQuerySchema = filteredListQuery(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'status'], {
  categoryId: z.uuid().optional(),
  businessId: z.uuid().optional(),
})

const destinationListQuerySchema = filteredListQuery(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'status'], {
  categoryId: z.uuid().optional(),
  barangay: z.string().trim().max(120).optional(),
})

const businessListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: businessStatusSchema.optional(),
  businessType: z.string().trim().max(120).optional(),
  featured: booleanQuerySchema,
  accredited: booleanQuerySchema,
  sort: z.enum(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'status']).default('-createdAt'),
})

const accreditedEstablishmentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  search: z.string().trim().max(120).optional(),
})

const museumArtifactListQuerySchema = filteredListQuery(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'status'], {
  categoryId: z.uuid().optional(),
})

const mapLocationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: contentStatusSchema.optional(),
  locationType: mapLocationTypeSchema.optional(),
  sort: z.enum(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'status', 'displayOrder', '-displayOrder']).default('-createdAt'),
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

const moneySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null
  return Number(value)
}, z.number().nonnegative().nullable().optional())

const productBaseSchema = z
  .object({
    businessId: z.uuid('businessId must be a valid UUID.').optional(),
    sourceAccreditationRecordId: z.uuid('sourceAccreditationRecordId must be a valid UUID.').optional(),
    businessName: z.string().trim().min(1).max(255).optional(),
    categoryId: z.uuid('categoryId must be a valid UUID.'),
    slug: slugSchema,
    name: z.string().trim().min(1).max(255),
    shortDescription: z.string().trim().max(5000).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    priceAmount: moneySchema,
    priceCurrency: z.string().trim().length(3).default('PHP'),
    unitLabel: z.string().trim().max(120).optional().nullable(),
    availabilityText: z.string().trim().max(255).optional().nullable(),
    accentColor: z.string().trim().max(32).optional().nullable(),
    status: contentStatusSchema.default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict()

const productBodySchema = productBaseSchema

const destinationBaseSchema = z
  .object({
    categoryId: z.uuid('categoryId must be a valid UUID.'),
    businessId: z.uuid('businessId must be a valid UUID.').optional().nullable(),
    slug: slugSchema,
    name: z.string().trim().min(1).max(255),
    shortDescription: z.string().trim().max(5000).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    addressLine: z.string().trim().max(5000).optional().nullable(),
    barangay: z.string().trim().max(120).optional().nullable(),
    municipality: z.string().trim().max(120).default('Calabanga'),
    province: z.string().trim().max(120).default('Camarines Sur'),
    openingHoursText: z.string().trim().max(255).optional().nullable(),
    entranceFeeText: z.string().trim().max(255).optional().nullable(),
    bestTimeToVisit: z.string().trim().max(255).optional().nullable(),
    accessibilityNotes: z.string().trim().max(5000).optional().nullable(),
    accentColor: z.string().trim().max(32).optional().nullable(),
    status: contentStatusSchema.default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict()

const businessBaseSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(255),
    businessType: z.string().trim().min(1).max(120),
    ownerName: z.string().trim().max(255).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    addressLine: z.string().trim().max(5000).optional().nullable(),
    barangay: z.string().trim().max(120).optional().nullable(),
    municipality: z.string().trim().max(120).default('Calabanga'),
    province: z.string().trim().max(120).default('Camarines Sur'),
    status: businessStatusSchema.default('active'),
    isFeatured: z.boolean().default(false),
  })
  .strict()

const museumArtifactBaseSchema = z
  .object({
    categoryId: z.uuid('categoryId must be a valid UUID.'),
    slug: slugSchema,
    name: z.string().trim().min(1).max(255),
    eraLabel: z.string().trim().max(255).optional().nullable(),
    shortDescription: z.string().trim().max(5000).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    historicalNotes: z.string().trim().max(20000).optional().nullable(),
    accentColor: z.string().trim().max(32).optional().nullable(),
    status: contentStatusSchema.default('draft'),
    isFeatured: z.boolean().default(false),
  })
  .strict()

const geojsonPropertiesSchema = z.record(z.string(), z.unknown()).optional().nullable()

const mapLocationBaseSchema = z
  .object({
    locationType: mapLocationTypeSchema,
    destinationId: z.uuid().optional().nullable(),
    businessId: z.uuid().optional().nullable(),
    eventId: z.uuid().optional().nullable(),
    label: z.string().trim().min(1).max(255),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    mapboxPlaceId: z.string().trim().max(255).optional().nullable(),
    markerColor: z.string().trim().max(32).optional().nullable(),
    markerIcon: z.string().trim().max(120).optional().nullable(),
    clusterGroup: z.string().trim().max(120).optional().nullable(),
    geojsonProperties: geojsonPropertiesSchema,
    isPrimary: z.boolean().default(true),
    isClusterable: z.boolean().default(true),
    sortPriority: z.number().int().default(0),
    status: contentStatusSchema.default('published'),
  })
  .strict()

function mapLocationTargetRefinement(data) {
  const targets = [data.destinationId, data.businessId, data.eventId].filter(Boolean)
  if (targets.length !== 1) return false
  if (data.locationType === 'destination') return Boolean(data.destinationId)
  if (data.locationType === 'business') return Boolean(data.businessId)
  if (data.locationType === 'event') return Boolean(data.eventId)
  return false
}

const mapLocationBodySchema = mapLocationBaseSchema.refine(
  mapLocationTargetRefinement,
  'locationType must match exactly one target ID.',
)

const mapLocationPatchSchema = mapLocationBaseSchema.partial().refine((data) => {
  const hasTargetUpdate =
    data.locationType !== undefined ||
    data.destinationId !== undefined ||
    data.businessId !== undefined ||
    data.eventId !== undefined

  if (!hasTargetUpdate) return true
  return mapLocationTargetRefinement(data)
}, 'locationType updates must include exactly one matching target ID.')

module.exports = {
  accreditedEstablishmentListQuerySchema,
  businessBodySchema: businessBaseSchema,
  businessListQuerySchema,
  businessPatchSchema: businessBaseSchema.partial(),
  categoryBodySchema,
  categoryListQuerySchema,
  categoryPatchSchema,
  destinationBodySchema: destinationBaseSchema,
  destinationListQuerySchema,
  destinationPatchSchema: destinationBaseSchema.partial(),
  eventBodySchema,
  eventListQuerySchema,
  eventPatchSchema,
  mapLocationBodySchema,
  mapLocationListQuerySchema,
  mapLocationPatchSchema,
  museumArtifactBodySchema: museumArtifactBaseSchema,
  museumArtifactListQuerySchema,
  museumArtifactPatchSchema: museumArtifactBaseSchema.partial(),
  productBodySchema,
  productListQuerySchema,
  productPatchSchema: productBaseSchema.partial(),
  promotionBodySchema,
  promotionListQuerySchema,
  promotionPatchSchema,
  uuidParamsSchema,
}
