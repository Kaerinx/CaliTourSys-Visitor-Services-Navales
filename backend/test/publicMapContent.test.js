const test = require('node:test')
const assert = require('node:assert/strict')

const repository = require('../src/modules/public/public.repository')
const service = require('../src/modules/public/public.service')
const validators = require('../src/modules/public/public.validators')

async function withRepositoryStub(methodName, implementation, callback) {
  const original = repository[methodName]
  repository[methodName] = implementation
  try {
    return await callback()
  } finally {
    repository[methodName] = original
  }
}

test('map location detail path requires a UUID', () => {
  assert.equal(
    validators.mapLocationParamsSchema.safeParse({
      id: 'f3100000-0000-4000-8000-000000000003',
    }).success,
    true,
  )
  assert.equal(validators.mapLocationParamsSchema.safeParse({ id: 'not-a-uuid' }).success, false)
})

test('emergency facilities are mapped to GeoJSON using longitude-latitude order', async () => {
  await withRepositoryStub(
    'listEmergencyFacilities',
    async () => [
      {
        id: 'f3100000-0000-4000-8000-000000000011',
        slug: 'calabanga-rural-health-unit',
        name: 'Calabanga Rural Health Unit',
        facilityType: 'Community health center',
        description: null,
        addressLine: 'P658+93J, Calabanga, Camarines Sur',
        barangay: null,
        municipality: 'Calabanga',
        province: 'Camarines Sur',
        latitude: 13.709325,
        longitude: 123.213875,
        openingHours: { monday: '8 AM-5 PM' },
        contacts: { publicPhone: null, emergencyHotline: null, email: null },
        accessibilityFeatures: ['Wheelchair accessible entrance'],
        amenities: ['Restroom'],
        verification: { source: null, verifiedAt: null },
      },
    ],
    async () => {
      const result = await service.listEmergencyFacilities()
      assert.equal(result.type, 'FeatureCollection')
      assert.equal(result.features.length, 1)
      assert.deepEqual(result.features[0].geometry, {
        type: 'Point',
        coordinates: [123.213875, 13.709325],
      })
      assert.equal(result.features[0].properties.name, 'Calabanga Rural Health Unit')
      assert.deepEqual(result.features[0].properties.accessibilityFeatures, [
        'Wheelchair accessible entrance',
      ])
    },
  )
})

test('missing or unsupported map location detail returns the public 404 contract', async () => {
  await withRepositoryStub('getMapLocationDetails', async () => null, async () => {
    await assert.rejects(
      () => service.getMapLocationDetails('f3100000-0000-4000-8000-000000000099'),
      (error) =>
        error.statusCode === 404 &&
        error.code === 'NOT_FOUND' &&
        error.publicMessage === 'Map location details not found.',
    )
  })
})
