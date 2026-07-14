const { z } = require('zod')
const { CMS_SLUG_PATTERN } = require('../../../utils/cmsSlug')

const uuidParamsSchema = z.object({
  id: z.uuid('id must be a valid UUID.'),
})

const contentStatusSchema = z.enum(['draft', 'published', 'archived'])
const businessStatusSchema = z.enum(['active', 'inactive', 'archived'])
const promotionTypeSchema = z.enum(['campaign', 'featured', 'seasonal', 'announcement'])
const mapLocationTypeSchema = z.enum(['destination', 'business', 'event'])
const eventRecurrenceTypeSchema = z.enum(['one_time', 'yearly', 'twice_a_year'])
const emergencyFacilityTypeSchema = z.enum([
  'emergency_service',
  'health_center',
  'hospital',
  'first_aid',
  'fire_station',
  'police_station',
  'responder',
  'other',
])

const optionalDateSchema = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable()

const imageUrlSchema = z
  .string()
  .trim()
  .max(5000)
  .refine((value) => {
    if (value.startsWith('/uploads/')) return true
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol)
    } catch {
      return false
    }
  }, 'Use a valid image URL.')

const optionalMonthSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null
  return Number(value)
}, z.number().int().min(1).max(12).nullable().optional())

const optionalDateOnlySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null
  return value
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.').nullable().optional())

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

const booleanBodySchema = z.preprocess((value) => {
  if (value === undefined) return undefined
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return value
}, z.boolean())

const optionalUuidSchema = (message) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return null
    return value
  }, z.uuid(message).nullable().optional())

const optionalUuidArraySchema = (message) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    }
    return value
  }, z.array(z.uuid(message)).min(1).max(2).optional())

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

const emergencyFacilityListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: contentStatusSchema.optional(),
  facilityType: emergencyFacilityTypeSchema.optional(),
  sort: z.enum([
    'createdAt',
    '-createdAt',
    'updatedAt',
    '-updatedAt',
    'name',
    '-name',
    'status',
    'displayOrder',
    '-displayOrder',
  ]).default('displayOrder'),
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
    categoryIds: optionalUuidArraySchema('categoryIds must contain valid UUIDs.'),
    slug: slugSchema,
    title: z.string().trim().min(1).max(255),
    shortDescription: z.string().trim().max(5000).optional().nullable(),
    description: z.string().trim().max(20000).optional().nullable(),
    relatedAssetId: optionalUuidSchema('relatedAssetId must be a valid UUID.'),
    relatedAssetIds: optionalUuidArraySchema('relatedAssetIds must contain valid UUIDs.'),
    venueName: z.string().trim().max(255).optional().nullable(),
    organizerName: z.string().trim().max(255).optional().nullable(),
    contactInfo: z.string().trim().max(255).optional().nullable(),
    addressLine: z.string().trim().max(5000).optional().nullable(),
    barangay: z.string().trim().max(120).optional().nullable(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: optionalDateSchema,
    primaryImageUrl: imageUrlSchema.optional().nullable(),
    accentColor: z.string().trim().max(32).optional().nullable(),
    status: contentStatusSchema.default('draft'),
    isFeatured: booleanBodySchema.default(false),
    isRecurring: booleanBodySchema.default(false),
    recurrenceType: eventRecurrenceTypeSchema.default('one_time'),
    usualMonth: optionalMonthSchema,
    nextOccurrenceDate: optionalDateOnlySchema,
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

const optionalText = (max) => z.string().trim().max(max).optional().nullable()
const nullableInteger = (minimum = 0) => z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null
  return Number(value)
}, z.number().int().min(minimum).nullable().optional())

const emergencyFacilityBaseSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(255),
  facilityType: emergencyFacilityTypeSchema,
  description: optionalText(20000),
  addressLine: z.string().trim().min(1).max(5000),
  barangay: optionalText(120),
  municipality: z.string().trim().min(1).max(120).default('Calabanga'),
  province: z.string().trim().min(1).max(120).default('Camarines Sur'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  openingHours: z.record(z.string().max(40), z.string().trim().max(255)).default({}),
  publicPhone: optionalText(80),
  emergencyHotline: optionalText(80),
  email: z.preprocess(
    (value) => (value === '' ? null : value),
    z.email('Use a valid email address.').max(255).optional().nullable(),
  ),
  accessibilityFeatures: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
  amenities: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
  verificationSource: optionalText(5000),
  verifiedAt: optionalDateSchema,
  sortPriority: z.number().int().default(0),
}).strict()

const emergencyFacilityPatchSchema = z.object({
  slug: slugSchema.optional(),
  name: z.string().trim().min(1).max(255).optional(),
  facilityType: emergencyFacilityTypeSchema.optional(),
  description: optionalText(20000),
  addressLine: z.string().trim().min(1).max(5000).optional(),
  barangay: optionalText(120),
  municipality: z.string().trim().min(1).max(120).optional(),
  province: z.string().trim().min(1).max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  openingHours: z.record(z.string().max(40), z.string().trim().max(255)).optional(),
  publicPhone: optionalText(80),
  emergencyHotline: optionalText(80),
  email: z.preprocess(
    (value) => (value === '' ? null : value),
    z.email('Use a valid email address.').max(255).optional().nullable(),
  ),
  accessibilityFeatures: z.array(z.string().trim().min(1).max(255)).max(50).optional(),
  amenities: z.array(z.string().trim().min(1).max(255)).max(50).optional(),
  verificationSource: optionalText(5000),
  verifiedAt: optionalDateSchema,
  sortPriority: z.number().int().optional(),
}).strict()

const mapLocationDetailsSchema = z.object({
  overview: optionalText(20000),
  openingHoursText: optionalText(5000),
  admissionInformation: optionalText(5000),
  bestTimeToVisit: optionalText(5000),
  accessibilityNotes: optionalText(10000),
  howToVisit: optionalText(20000),
  howToBook: optionalText(20000),
}).strict()

const galleryImageSchema = z.object({
  mediaAssetId: optionalUuidSchema('mediaAssetId must be a valid UUID.'),
  imageUrl: imageUrlSchema.optional().nullable(),
  altText: optionalText(255),
  displayOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
}).strict().refine(
  (image) => Boolean(image.mediaAssetId) !== Boolean(image.imageUrl),
  'Each gallery image must use exactly one media asset or image URL.',
)

const activityLinkSchema = z.object({
  activityId: z.uuid('activityId must be a valid UUID.'),
  displayOrder: z.number().int().default(0),
}).strict()

const packageLinkSchema = z.object({
  packageId: z.uuid('packageId must be a valid UUID.'),
  displayOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
}).strict()

const overnightOptionSchema = z.object({
  optionType: z.enum(['camping', 'tent_rental', 'other']),
  name: z.string().trim().min(1).max(255),
  description: optionalText(10000),
  capacityMin: nullableInteger(1),
  capacityMax: nullableInteger(1),
  rateAmount: z.preprocess(
    (value) => (value === '' || value === undefined || value === null ? null : Number(value)),
    z.number().nonnegative().nullable().optional(),
  ),
  currency: z.literal('PHP').default('PHP'),
  rateUnit: z.enum([
    'per_person_per_night',
    'per_tent_per_night',
    'per_site_per_night',
    'flat_rate',
  ]),
  inclusions: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
  notes: optionalText(10000),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
}).strict().refine(
  (option) => option.capacityMin === null || option.capacityMax === null || option.capacityMax >= option.capacityMin,
  'Maximum capacity must be greater than or equal to minimum capacity.',
)

const mapLocationExperienceBodySchema = z.object({
  details: mapLocationDetailsSchema.default({}),
  galleryImages: z.array(galleryImageSchema).max(50).default([]),
  activityLinks: z.array(activityLinkSchema).max(100).default([]),
  packageLinks: z.array(packageLinkSchema).max(100).default([]),
  overnightOptions: z.array(overnightOptionSchema).max(100).default([]),
}).strict().superRefine((data, ctx) => {
  const uniqueActivities = new Set(data.activityLinks.map((item) => item.activityId))
  if (uniqueActivities.size !== data.activityLinks.length) {
    ctx.addIssue({ code: 'custom', path: ['activityLinks'], message: 'Activities may only be linked once.' })
  }

  const uniquePackages = new Set(data.packageLinks.map((item) => item.packageId))
  if (uniquePackages.size !== data.packageLinks.length) {
    ctx.addIssue({ code: 'custom', path: ['packageLinks'], message: 'Packages may only be linked once.' })
  }

  if (data.packageLinks.filter((item) => item.isPrimary).length > 1) {
    ctx.addIssue({ code: 'custom', path: ['packageLinks'], message: 'Choose at most one primary package.' })
  }

  if (data.galleryImages.filter((item) => item.isPrimary).length > 1) {
    ctx.addIssue({ code: 'custom', path: ['galleryImages'], message: 'Choose at most one primary gallery image.' })
  }
})

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
  emergencyFacilityBodySchema: emergencyFacilityBaseSchema,
  emergencyFacilityListQuerySchema,
  emergencyFacilityPatchSchema,
  mapLocationBodySchema,
  mapLocationExperienceBodySchema,
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
