const DEFAULT_BASE_URL = 'http://localhost:5000/api/v1'

const baseUrl = (process.env.API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`

const state = {
  sessionToken: null,
  itineraryItemId: null,
}

const results = []

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function isIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function joinUrl(path) {
  return `${baseUrl}${path}`
}

function jsonBody(body) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function request(path, options = {}) {
  const response = await fetch(joinUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  let body = null
  const text = await response.text()

  if (text) {
    try {
      body = JSON.parse(text)
    } catch (error) {
      throw new Error(`Response from ${path} was not valid JSON: ${text.slice(0, 180)}`)
    }
  }

  return { response, body }
}

function assertSuccessEnvelope(body) {
  assert(body && typeof body === 'object', 'Success response body must be an object.')
  assert(body.success === true, 'Success envelope must have success=true.')
  assert(Object.prototype.hasOwnProperty.call(body, 'data'), 'Success envelope must include data.')
  assert(body.meta && typeof body.meta === 'object', 'Success envelope must include meta.')
  assert(typeof body.meta.requestId === 'string' && body.meta.requestId.length > 0, 'Meta must include requestId.')
  assert(isIsoDate(body.meta.timestamp), 'Meta timestamp must be ISO-compatible.')
}

function assertErrorEnvelope(body, expectedCode) {
  assert(body && typeof body === 'object', 'Error response body must be an object.')
  assert(body.success === false, 'Error envelope must have success=false.')
  assert(body.error && typeof body.error === 'object', 'Error envelope must include error.')
  assert(typeof body.error.code === 'string' && body.error.code.length > 0, 'Error must include code.')
  assert(typeof body.error.message === 'string' && body.error.message.length > 0, 'Error must include message.')
  assert(Array.isArray(body.error.details), 'Error details must be an array.')
  if (expectedCode) assert(body.error.code === expectedCode, `Expected error code ${expectedCode}, got ${body.error.code}.`)
  assert(body.meta && typeof body.meta === 'object', 'Error envelope must include meta.')
  assert(typeof body.meta.requestId === 'string' && body.meta.requestId.length > 0, 'Error meta must include requestId.')
  assert(isIsoDate(body.meta.timestamp), 'Error meta timestamp must be ISO-compatible.')
}

function assertPagination(body) {
  assert(body.meta.pagination && typeof body.meta.pagination === 'object', 'Paginated response must include meta.pagination.')
  const pagination = body.meta.pagination
  for (const key of ['page', 'limit', 'totalItems', 'totalPages']) {
    assert(Number.isInteger(pagination[key]), `Pagination ${key} must be an integer.`)
  }
  assert(typeof pagination.hasNextPage === 'boolean', 'Pagination hasNextPage must be boolean.')
  assert(typeof pagination.hasPreviousPage === 'boolean', 'Pagination hasPreviousPage must be boolean.')
}

function assertNoRawStatusFields(items, label) {
  for (const item of items) {
    assert(!Object.prototype.hasOwnProperty.call(item, 'status'), `${label} item must not expose raw status.`)
    assert(!Object.prototype.hasOwnProperty.call(item, 'publishedAt'), `${label} item must not expose raw publishedAt unless contracted.`)
    assert(!Object.prototype.hasOwnProperty.call(item, 'archivedAt'), `${label} item must not expose raw archivedAt.`)
  }
}

async function expectSuccess(path, { method = 'GET', body, status = 200, paginated = false, cacheIncludes } = {}) {
  const options = { method }
  if (body !== undefined) Object.assign(options, jsonBody(body))

  const { response, body: responseBody } = await request(path, options)
  assert(response.status === status, `${method} ${path} expected ${status}, got ${response.status}.`)
  assertSuccessEnvelope(responseBody)
  if (paginated) assertPagination(responseBody)
  if (cacheIncludes) {
    const cacheControl = response.headers.get('cache-control') || ''
    assert(cacheControl.includes(cacheIncludes), `${method} ${path} expected Cache-Control to include ${cacheIncludes}.`)
  }

  return { response, body: responseBody }
}

async function expectError(path, { method = 'GET', body, status, code } = {}) {
  const options = { method }
  if (body !== undefined) Object.assign(options, jsonBody(body))

  const { response, body: responseBody } = await request(path, options)
  assert(response.status === status, `${method} ${path} expected ${status}, got ${response.status}.`)
  assertErrorEnvelope(responseBody, code)
  assert(!JSON.stringify(responseBody).toLowerCase().includes('stack'), 'Error response must not expose stack traces.')
  return { response, body: responseBody }
}

async function expectNoContent(path, { method = 'DELETE' } = {}) {
  const { response, body } = await request(path, { method })
  assert(response.status === 204, `${method} ${path} expected 204, got ${response.status}.`)
  assert(body === null, `${method} ${path} expected empty 204 body.`)
}

async function test(name, fn) {
  try {
    await fn()
    results.push({ name, passed: true })
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push({ name, passed: false, error })
    console.error(`FAIL ${name}`)
    console.error(`  ${error.message}`)
  }
}

async function main() {
  console.log(`CaliTourSys public API smoke test`)
  console.log(`Base URL: ${baseUrl}`)
  console.log('')

  await test('health endpoint returns standard success envelope', async () => {
    const { response, body } = await expectSuccess('/health')
    assert(body.data.status === 'ok', 'Health data.status must be ok.')
    assert(response.headers.get('x-request-id'), 'Health response must include X-Request-Id header.')
    assert(response.headers.get('x-content-type-options') === 'nosniff', 'Helmet X-Content-Type-Options header expected.')
    assert(response.headers.get('content-security-policy'), 'Helmet Content-Security-Policy header expected.')
  })

  await test('home endpoint returns public content blocks', async () => {
    const { body } = await expectSuccess('/public/home', { cacheIncludes: 'public' })
    for (const key of [
      'featuredPromotions',
      'featuredProducts',
      'featuredDestinations',
      'upcomingEvents',
      'featuredMuseumArtifacts',
      'publicStats',
    ]) {
      assert(Object.prototype.hasOwnProperty.call(body.data, key), `Home data must include ${key}.`)
    }
  })

  await test('promotions list and detail match contract', async () => {
    const list = await expectSuccess('/public/promotions', { paginated: true, cacheIncludes: 'public' })
    assert(Array.isArray(list.body.data), 'Promotions data must be an array.')
    assertNoRawStatusFields(list.body.data, 'Promotion')
    const detail = await expectSuccess('/public/promotions/demo-summer-otop-picks', { cacheIncludes: 'public' })
    assert(detail.body.data.slug === 'demo-summer-otop-picks', 'Promotion detail slug mismatch.')
  })

  await test('events list, detail, and categories match contract', async () => {
    const list = await expectSuccess('/public/events', { paginated: true, cacheIncludes: 'public' })
    assertNoRawStatusFields(list.body.data, 'Event')
    await expectSuccess('/public/events/demo-pili-festival-2026', { cacheIncludes: 'public' })
    const categories = await expectSuccess('/public/event-categories', { cacheIncludes: 'public' })
    assert(Array.isArray(categories.body.data), 'Event categories data must be an array.')
  })

  await test('products list, detail, and categories match contract', async () => {
    const list = await expectSuccess('/public/products', { paginated: true, cacheIncludes: 'public' })
    assertNoRawStatusFields(list.body.data, 'Product')
    const detail = await expectSuccess('/public/products/demo-pili-nut-brittle', { cacheIncludes: 'public' })
    assert(detail.body.data.product.slug === 'demo-pili-nut-brittle', 'Product detail slug mismatch.')
    assert(Array.isArray(detail.body.data.business.contacts), 'Product business contacts must be an array.')
    for (const contact of detail.body.data.business.contacts) {
      assert(!Object.prototype.hasOwnProperty.call(contact, 'isPublic'), 'Public contact response must not expose isPublic.')
    }
    const categories = await expectSuccess('/public/product-categories', { cacheIncludes: 'public' })
    assert(Array.isArray(categories.body.data), 'Product categories data must be an array.')
  })

  await test('business profile returns active public profile only', async () => {
    const { body } = await expectSuccess('/public/businesses/demo-pili-kitchen', { cacheIncludes: 'public' })
    assert(body.data.slug === 'demo-pili-kitchen', 'Business detail slug mismatch.')
    assert(Array.isArray(body.data.contacts), 'Business contacts must be an array.')
    for (const contact of body.data.contacts) {
      assert(!Object.prototype.hasOwnProperty.call(contact, 'isPublic'), 'Public contact response must not expose isPublic.')
    }
  })

  await test('destinations list, detail, and categories match contract', async () => {
    const list = await expectSuccess('/public/destinations', { paginated: true, cacheIncludes: 'public' })
    assertNoRawStatusFields(list.body.data, 'Destination')
    await expectSuccess('/public/destinations/demo-sabang-beach', { cacheIncludes: 'public' })
    const categories = await expectSuccess('/public/destination-categories', { cacheIncludes: 'public' })
    assert(Array.isArray(categories.body.data), 'Destination categories data must be an array.')
  })

  await test('map locations support list and GeoJSON formats', async () => {
    const list = await expectSuccess('/public/map/locations?format=list', { cacheIncludes: 'public' })
    assert(Array.isArray(list.body.data), 'Map list data must be an array.')
    const geojson = await expectSuccess('/public/map/locations?format=geojson', { cacheIncludes: 'public' })
    assert(geojson.body.data.type === 'FeatureCollection', 'GeoJSON response must be a FeatureCollection.')
    assert(Array.isArray(geojson.body.data.features), 'GeoJSON features must be an array.')
  })

  await test('museum artifacts list, detail, and categories match contract', async () => {
    const list = await expectSuccess('/public/museum/artifacts', { paginated: true, cacheIncludes: 'public' })
    assertNoRawStatusFields(list.body.data, 'Museum artifact')
    await expectSuccess('/public/museum/artifacts/demo-heritage-bell', { cacheIncludes: 'public' })
    const categories = await expectSuccess('/public/museum/categories', { cacheIncludes: 'public' })
    assert(Array.isArray(categories.body.data), 'Museum categories data must be an array.')
  })

  await test('itinerary write flow creates, reads, adds, idempotently adds, and deletes items', async () => {
    const created = await expectSuccess('/public/itinerary/sessions', {
      method: 'POST',
      status: 201,
      body: { visitorLabel: 'Smoke Test Visitor' },
      cacheIncludes: 'private',
    })
    state.sessionToken = created.body.data.sessionToken
    assert(/^itn_[A-Za-z0-9_-]+$/.test(state.sessionToken), 'sessionToken must be opaque and public-safe.')

    const empty = await expectSuccess(`/public/itinerary/${state.sessionToken}`, { cacheIncludes: 'private' })
    assert(empty.body.data.itemCount === 0, 'New itinerary should have zero items.')

    const added = await expectSuccess(`/public/itinerary/${state.sessionToken}/items`, {
      method: 'POST',
      status: 201,
      body: {
        itemType: 'product',
        targetId: '30000000-0000-4000-8000-000000000001',
      },
      cacheIncludes: 'private',
    })
    state.itineraryItemId = added.body.data.id
    assert(added.body.data.itemType === 'product', 'Added itinerary item type mismatch.')

    const duplicate = await expectSuccess(`/public/itinerary/${state.sessionToken}/items`, {
      method: 'POST',
      status: 200,
      body: {
        itemType: 'product',
        targetId: '30000000-0000-4000-8000-000000000001',
      },
      cacheIncludes: 'private',
    })
    assert(duplicate.body.data.id === state.itineraryItemId, 'Duplicate itinerary save should return existing item.')

    const read = await expectSuccess(`/public/itinerary/${state.sessionToken}`, { cacheIncludes: 'private' })
    assert(read.body.data.itemCount === 1, 'Itinerary should have one item after add.')

    await expectNoContent(`/public/itinerary/${state.sessionToken}/items/${state.itineraryItemId}`)

    const afterDelete = await expectSuccess(`/public/itinerary/${state.sessionToken}`, { cacheIncludes: 'private' })
    assert(afterDelete.body.data.itemCount === 0, 'Itinerary should have zero items after delete.')
  })

  await test('inquiry submission returns receipt envelope', async () => {
    const { body } = await expectSuccess('/public/inquiries', {
      method: 'POST',
      status: 201,
      body: {
        fullName: 'Smoke Test Visitor',
        email: `smoke-inquiry-${runId}@example.test`,
        contactNumber: '+63 900 000 0000',
        subject: 'Smoke test inquiry',
        message: 'This is a development smoke test inquiry.',
        sourcePage: '/smoke-test',
      },
      cacheIncludes: 'no-store',
    })
    assert(body.data.status === 'new', 'Inquiry status must be new.')
    assert(isIsoDate(body.data.receivedAt), 'Inquiry receivedAt must be date-compatible.')
  })

  await test('newsletter subscription is idempotent for duplicate email', async () => {
    const email = `smoke-newsletter-${runId}@example.test`
    const first = await expectSuccess('/public/newsletter-subscriptions', {
      method: 'POST',
      status: 201,
      body: { email, fullName: 'Smoke Test Subscriber' },
      cacheIncludes: 'no-store',
    })
    assert(first.body.data.email === email, 'Newsletter email should be normalized and returned.')

    const duplicate = await expectSuccess('/public/newsletter-subscriptions', {
      method: 'POST',
      status: 200,
      body: { email, fullName: 'Smoke Test Subscriber' },
      cacheIncludes: 'no-store',
    })
    assert(duplicate.body.data.email === email, 'Duplicate newsletter response email mismatch.')
    assert(duplicate.body.data.status === 'subscribed', 'Duplicate newsletter response status must be subscribed.')
  })

  await test('validation errors use standard envelope', async () => {
    await expectError('/public/products/INVALID-SLUG', { status: 400, code: 'VALIDATION_ERROR' })
    await expectError(`/public/itinerary/${state.sessionToken}/items`, {
      method: 'POST',
      status: 400,
      code: 'VALIDATION_ERROR',
      body: {
        itemType: 'product',
        targetId: 'not-a-uuid',
      },
    })
    await expectError(`/public/itinerary/${state.sessionToken}/items`, {
      method: 'POST',
      status: 400,
      code: 'VALIDATION_ERROR',
      body: {
        itemType: 'invalid-type',
        targetId: '30000000-0000-4000-8000-000000000001',
      },
    })
    await expectError('/public/inquiries', {
      method: 'POST',
      status: 400,
      code: 'VALIDATION_ERROR',
      body: {
        fullName: 'Smoke Test Visitor',
        email: 'bad-email',
        subject: 'Invalid email',
        message: 'This should fail validation.',
      },
    })
  })

  await test('not found errors use standard envelope', async () => {
    await expectError('/public/products/demo-missing-product', { status: 404, code: 'NOT_FOUND' })
    await expectError('/public/no-such-route', { status: 404, code: 'NOT_FOUND' })
  })

  const failed = results.filter((result) => !result.passed)
  console.log('')
  console.log(`Smoke test summary: ${results.length - failed.length}/${results.length} passed`)

  if (failed.length > 0) {
    console.log('')
    console.log('Failures:')
    for (const failure of failed) {
      console.log(`- ${failure.name}: ${failure.error.message}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Smoke test crashed before completion.')
  console.error(error)
  process.exitCode = 1
})
