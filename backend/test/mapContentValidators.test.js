const test = require('node:test')
const assert = require('node:assert/strict')

const {
  emergencyFacilityBodySchema,
  emergencyFacilityPatchSchema,
  mapLocationExperienceBodySchema,
} = require('../src/modules/cms/content/content.validators')

const UUIDS = {
  activity: 'f3100000-0000-4000-8000-000000000101',
  packageOne: 'f3100000-0000-4000-8000-000000000201',
  packageTwo: 'f3100000-0000-4000-8000-000000000202',
}

test('empty rich map content is a valid CMS state', () => {
  const result = mapLocationExperienceBodySchema.safeParse({})

  assert.equal(result.success, true)
  assert.deepEqual(result.data, {
    details: {},
    galleryImages: [],
    activityLinks: [],
    packageLinks: [],
    overnightOptions: [],
  })
})

test('complete rich map content accepts one primary package and PHP overnight pricing', () => {
  const result = mapLocationExperienceBodySchema.safeParse({
    details: {
      overview: 'A verified visitor overview.',
      howToVisit: 'Follow the signed access road.',
      howToBook: 'Choose the linked package.',
    },
    galleryImages: [
      {
        imageUrl: 'https://example.com/gallery/location.jpg',
        altText: 'Location entrance',
        displayOrder: 0,
        isPrimary: true,
      },
    ],
    activityLinks: [{ activityId: UUIDS.activity, displayOrder: 0 }],
    packageLinks: [
      { packageId: UUIDS.packageOne, displayOrder: 0, isPrimary: true },
      { packageId: UUIDS.packageTwo, displayOrder: 1, isPrimary: false },
    ],
    overnightOptions: [
      {
        optionType: 'tent_rental',
        name: 'Two-person tent',
        capacityMin: 1,
        capacityMax: 2,
        rateAmount: 750,
        currency: 'PHP',
        rateUnit: 'per_tent_per_night',
        inclusions: ['Tent setup'],
        isActive: true,
        displayOrder: 0,
      },
    ],
  })

  assert.equal(result.success, true)
})

test('rich map content rejects duplicate links and multiple primary packages', () => {
  const result = mapLocationExperienceBodySchema.safeParse({
    activityLinks: [
      { activityId: UUIDS.activity, displayOrder: 0 },
      { activityId: UUIDS.activity, displayOrder: 1 },
    ],
    packageLinks: [
      { packageId: UUIDS.packageOne, displayOrder: 0, isPrimary: true },
      { packageId: UUIDS.packageTwo, displayOrder: 1, isPrimary: true },
    ],
  })

  assert.equal(result.success, false)
  const messages = result.error.issues.map((issue) => issue.message)
  assert.ok(messages.includes('Activities may only be linked once.'))
  assert.ok(messages.includes('Choose at most one primary package.'))
})

test('overnight pricing rejects non-PHP currency', () => {
  const result = mapLocationExperienceBodySchema.safeParse({
    overnightOptions: [
      {
        optionType: 'camping',
        name: 'Campsite',
        rateAmount: 500,
        currency: 'USD',
        rateUnit: 'per_site_per_night',
      },
    ],
  })

  assert.equal(result.success, false)
  assert.deepEqual(result.error.issues[0].path, ['overnightOptions', 0, 'currency'])
})

test('overnight pricing permits a null or omitted amount for price-on-inquiry rows', () => {
  const payload = (rateAmount) => ({
    overnightOptions: [
      {
        optionType: 'camping',
        name: 'Campsite',
        currency: 'PHP',
        rateUnit: 'per_site_per_night',
        ...(rateAmount === undefined ? {} : { rateAmount }),
      },
    ],
  })

  assert.equal(mapLocationExperienceBodySchema.safeParse(payload()).success, true)
  assert.equal(mapLocationExperienceBodySchema.safeParse(payload(null)).success, true)
})

test('overnight pricing rejects invalid capacity ranges', () => {
  const result = mapLocationExperienceBodySchema.safeParse({
    overnightOptions: [
      {
        optionType: 'camping',
        name: 'Campsite',
        capacityMin: 4,
        capacityMax: 2,
        rateAmount: 500,
        currency: 'PHP',
        rateUnit: 'per_site_per_night',
      },
    ],
  })

  assert.equal(result.success, false)
  assert.ok(result.error.issues.some((issue) => issue.message.includes('Maximum capacity')))
})

test('overnight pricing rejects unsupported billing units', () => {
  const result = mapLocationExperienceBodySchema.safeParse({
    overnightOptions: [
      {
        optionType: 'camping',
        name: 'Campsite',
        rateAmount: 500,
        currency: 'PHP',
        rateUnit: 'per_hour',
      },
    ],
  })

  assert.equal(result.success, false)
  assert.ok(result.error.issues.some((issue) => issue.path.at(-1) === 'rateUnit'))
})

test('emergency facility authoring requires verified map-safe fields', () => {
  const valid = emergencyFacilityBodySchema.safeParse({
    slug: 'sample-health-center',
    name: 'Sample Health Center',
    facilityType: 'health_center',
    addressLine: 'Calabanga, Camarines Sur',
    latitude: 13.709325,
    longitude: 123.213875,
  })

  assert.equal(valid.success, true)
  assert.equal(Object.hasOwn(valid.data, 'status'), false)
  assert.deepEqual(valid.data.openingHours, {})

  const invalid = emergencyFacilityBodySchema.safeParse({
    slug: 'unsafe-record',
    name: 'Unsafe record',
    facilityType: 'unknown_service',
    addressLine: 'Calabanga',
    latitude: 91,
    longitude: 181,
  })

  assert.equal(invalid.success, false)
})

test('emergency create and update payloads cannot bypass state transition endpoints', () => {
  const createResult = emergencyFacilityBodySchema.safeParse({
    slug: 'published-bypass',
    name: 'Published bypass',
    facilityType: 'health_center',
    addressLine: 'Calabanga',
    latitude: 13.7,
    longitude: 123.2,
    status: 'published',
  })
  const patchResult = emergencyFacilityPatchSchema.safeParse({ status: 'archived' })

  assert.equal(createResult.success, false)
  assert.equal(patchResult.success, false)
})
