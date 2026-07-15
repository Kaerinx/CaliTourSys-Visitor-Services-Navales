const { z } = require('zod')
const {
  ACTIVITY_STATUSES,
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  DEVELOPMENT_PLAN_STATUSES,
  IMPROVEMENT_STATUSES,
  PACKAGE_CATEGORIES,
  PACKAGE_ITEM_TYPES,
  PACKAGE_STATUSES,
} = require('./constants')

const uuidParamsSchema = z.object({
  id: z.uuid('id must be a valid UUID.'),
})

const packageParamsSchema = z.object({
  packageId: z.uuid('packageId must be a valid UUID.'),
})

const packageSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(320),
})

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(80).optional(),
  category: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  targetMarket: z.string().trim().max(120).optional(),
})

const requiredText = (label, max = 5000) => z.string().trim().min(1, `${label} is required.`).max(max)
const optionalText = (max = 5000) => z.string().trim().max(max).optional().nullable()
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.')
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Use HH:mm time format.')

const optionalDate = dateSchema.optional().nullable()
const optionalTime = timeSchema.optional().nullable()
const optionalMoney = (label) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.coerce.number({ message: `${label} must be a number.` }).min(0, `${label} must be non-negative.`).optional().nullable(),
  )
const optionalPositiveInteger = (label) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.coerce.number({ message: `${label} must be a number.` }).int(`${label} must be a whole number.`).min(1, `${label} must be at least 1.`).optional().nullable(),
  )
const optionalCoordinate = (label, min, max) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.coerce
      .number({ message: `${label} must be a number.` })
      .min(min, `${label} must be at least ${min}.`)
      .max(max, `${label} must be at most ${max}.`)
      .optional()
      .nullable(),
  )

const assetImageSchema = z
  .object({
    id: z.uuid().optional().nullable(),
    imageUrl: requiredText('Image URL', 2000),
    originalName: optionalText(255),
    mimeType: optionalText(120),
    fileSize: z.coerce.number().int().nonnegative().optional().nullable(),
  })
  .strict()

function internalImprovementNeeds(value) {
  const trimmed = String(value || '').trim()
  return trimmed || 'Not specified'
}

const assetBodySchema = z
  .object({
    name: requiredText('Asset name', 255),
    description: requiredText('Description'),
    location: requiredText('Location', 255),
    category: z.enum(ASSET_CATEGORIES),
    targetMarket: requiredText('Target market', 255),
    developmentStatus: z.enum(ASSET_STATUSES).default('Draft'),
    imageUrl: optionalText(2000),
    assetImages: z.array(assetImageSchema).max(5, 'Upload up to 5 images only.').default([]),
    remarks: optionalText(),
    sourceAccreditationRecordId: z.uuid().optional().nullable(),
    latitude: optionalCoordinate('Latitude', -90, 90),
    longitude: optionalCoordinate('Longitude', -180, 180),
  })
  .strict()

const planBodySchema = z
  .object({
    assetId: z.uuid('Select a tourism asset.'),
    planTitle: requiredText('Plan title', 255).optional(),
    title: requiredText('Plan title', 255).optional(),
    objectives: requiredText('Objectives'),
    targetMarket: requiredText('Target market', 255),
    improvementNeeds: optionalText(),
    proposedActivities: requiredText('Proposed activities'),
    timelineStart: optionalDate,
    timelineEnd: optionalDate,
    timelineStartTime: optionalTime,
    timelineEndTime: optionalTime,
    assignedPersonnel: requiredText('Assigned personnel', 255),
    planStatus: z.enum(DEVELOPMENT_PLAN_STATUSES).default('Draft'),
    remarks: optionalText(),
  })
  .strict()
  .refine((data) => data.planTitle || data.title, {
    message: 'Plan title is required.',
    path: ['planTitle'],
  })
  .refine(
    (data) =>
      !data.timelineStart ||
      !data.timelineEnd ||
      new Date(data.timelineEnd).getTime() >= new Date(data.timelineStart).getTime(),
    'timelineEnd must be greater than or equal to timelineStart.',
  )
  .refine(
    (data) =>
      !data.timelineStart ||
      !data.timelineEnd ||
      data.timelineStart !== data.timelineEnd ||
      !data.timelineStartTime ||
      !data.timelineEndTime ||
      data.timelineEndTime >= data.timelineStartTime,
    {
      message: 'timelineEndTime must be greater than or equal to timelineStartTime.',
      path: ['timelineEndTime'],
    },
  )
  .transform(({ planTitle, title, improvementNeeds, ...data }) => ({
    ...data,
    title: planTitle || title,
    improvementNeeds: internalImprovementNeeds(improvementNeeds),
  }))

const improvementBodySchema = z
  .object({
    planId: z.uuid('Select a development plan.'),
    progressPercentage: z.coerce.number().int().min(0).max(100),
    improvementStatus: z.enum(IMPROVEMENT_STATUSES).default('Not Started'),
    updateDate: dateSchema,
    remarks: requiredText('Remarks'),
  })
  .strict()

const activityBodySchema = z
  .object({
    assetId: z.uuid('Select a tourism asset.'),
    planId: z.uuid().optional().nullable(),
    name: requiredText('Activity name', 255),
    description: requiredText('Description'),
    duration: requiredText('Duration', 120),
    targetMarket: requiredText('Target market', 255),
    activityStatus: z.enum(ACTIVITY_STATUSES).default('Draft'),
    remarks: optionalText(),
  })
  .strict()

const packageItemSchema = z
  .object({
    itemType: z.enum(PACKAGE_ITEM_TYPES),
    referenceId: z.uuid('Package item reference must be a valid UUID.'),
  })
  .strict()

const packageBodySchema = z
  .object({
    name: requiredText('Package name', 255),
    description: requiredText('Description'),
    category: z.enum(PACKAGE_CATEGORIES),
    targetMarket: requiredText('Target market', 255),
    estimatedDuration: requiredText('Estimated duration', 120),
    durationDays: optionalPositiveInteger('Duration days'),
    departureCapacity: optionalPositiveInteger('Departure capacity'),
    basePrice: optionalMoney('Base price'),
    basePax: optionalPositiveInteger('Base pax'),
    extraPaxPrice: optionalMoney('Extra person price'),
    minPax: optionalPositiveInteger('Minimum pax'),
    maxPax: optionalPositiveInteger('Maximum pax'),
    paymentRequired: z.boolean().default(false),
    packageStatus: z.enum(PACKAGE_STATUSES).default('Draft'),
    remarks: optionalText(),
    items: z.array(packageItemSchema).min(1, 'Select at least one development plan.'),
  })
  .strict()
  .refine((data) => data.items.some((item) => item.itemType === 'Plan'), {
    message: 'Select at least one development plan.',
    path: ['items'],
  })
  .refine((data) => data.packageStatus !== 'Ready for Promotion', {
    message: 'Use the readiness review action to mark packages as Ready for Promotion.',
    path: ['packageStatus'],
  })
  .refine((data) => !data.minPax || !data.maxPax || data.maxPax >= data.minPax, {
    message: 'Maximum pax must be greater than or equal to minimum pax.',
    path: ['maxPax'],
  })
  .refine((data) => !data.basePax || !data.minPax || data.basePax >= data.minPax, {
    message: 'Base pax must be greater than or equal to minimum pax.',
    path: ['basePax'],
  })
  .refine((data) => !data.basePax || !data.maxPax || data.basePax <= data.maxPax, {
    message: 'Base pax must be less than or equal to maximum pax.',
    path: ['basePax'],
  })

const readinessBodySchema = z
  .object({
    remarks: optionalText(),
  })
  .strict()

module.exports = {
  activityBodySchema,
  assetBodySchema,
  improvementBodySchema,
  listQuerySchema,
  packageBodySchema,
  packageParamsSchema,
  packageSlugParamsSchema,
  planBodySchema,
  readinessBodySchema,
  uuidParamsSchema,
}
