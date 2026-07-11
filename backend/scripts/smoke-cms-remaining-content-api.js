const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1'
const CMS_TEST_EMAIL = process.env.CMS_TEST_EMAIL
const CMS_TEST_PASSWORD = process.env.CMS_TEST_PASSWORD

const results = []

function record(name, passed, detail = '') {
  results.push({ name, passed, detail })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`)
  if (detail) console.log(`  ${detail}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function hasAll(permissionSet, permissions) {
  return permissions.every((permission) => permissionSet.has(permission))
}

function headers(accessToken, cookie) {
  const output = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (accessToken) output.Authorization = `Bearer ${accessToken}`
  if (cookie) output.Cookie = cookie
  return output
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers(options.accessToken, options.cookie),
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text }
    }
  }

  return {
    response,
    body,
    cookie: response.headers.get('set-cookie'),
  }
}

function assertSuccess(body) {
  assert(body?.success === true, 'Expected success=true.')
  assert(body?.meta?.requestId, 'Expected meta.requestId.')
  assert(body?.meta?.timestamp, 'Expected meta.timestamp.')
}

function assertPaginated(body) {
  assertSuccess(body)
  assert(Array.isArray(body.data), 'Expected data array.')
  assert(body.meta?.pagination, 'Expected meta.pagination.')
}

function assertError(body, code) {
  assert(body?.success === false, 'Expected success=false.')
  assert(body?.error?.code === code, `Expected error code ${code}.`)
  assert(Array.isArray(body?.error?.details), 'Expected error.details array.')
}

async function runStep(name, fn) {
  try {
    const detail = await fn()
    record(name, true, detail)
  } catch (error) {
    record(name, false, error.message)
  }
}

async function getFirst(path, accessToken, label) {
  const { response, body } = await request(`${path}?limit=1`, { accessToken })
  assert(response.status === 200, `Expected ${label} list 200, got ${response.status}.`)
  assertPaginated(body)
  assert(body.data.length > 0, `Expected at least one ${label}.`)
  return body.data[0]
}

async function main() {
  console.log('CaliTourSys remaining CMS content API smoke test')
  console.log(`Base URL: ${API_BASE_URL}`)
  console.log('')

  await runStep('CMS remaining content route rejects unauthenticated requests', async () => {
    const { response, body } = await request('/cms/products')
    assert(response.status === 401, `Expected 401, got ${response.status}.`)
    assertError(body, 'UNAUTHENTICATED')
    return `status=${response.status}, code=${body.error.code}`
  })

  if (!CMS_TEST_EMAIL || !CMS_TEST_PASSWORD) {
    record('Protected remaining content live tests skipped', true, 'Set CMS_TEST_EMAIL and CMS_TEST_PASSWORD to run authenticated tests.')
    summarize()
    return
  }

  let accessToken = null
  let refreshCookie = null
  let permissions = new Set()
  const suffix = Date.now()
  let createdBusinessId = null
  let createdDestinationId = null
  let createdArtifactId = null

  await runStep('login for remaining CMS content smoke test', async () => {
    const { response, body, cookie } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: CMS_TEST_EMAIL,
        password: CMS_TEST_PASSWORD,
      }),
    })
    assert(response.status === 200, `Expected 200, got ${response.status}.`)
    assertSuccess(body)
    accessToken = body.data.accessToken
    refreshCookie = cookie
    permissions = new Set(body.data.user?.permissions || [])
    return `status=${response.status}`
  })

  await runStep('product list/create/update/publish/archive flow works', async () => {
    const required = ['products.view', 'products.create', 'products.update', 'products.publish', 'products.archive']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/products?limit=5', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)

    const business = await getFirst('/cms/businesses', accessToken, 'business')
    const category = await getFirst('/cms/product-categories', accessToken, 'product category')

    const create = await request('/cms/products', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        businessId: business.id,
        categoryId: category.id,
        slug: `smoke-product-${suffix}`,
        name: 'Smoke Product',
        shortDescription: 'CMS smoke test product.',
        priceAmount: 25,
        priceCurrency: 'PHP',
        status: 'draft',
        isFeatured: false,
      }),
    })
    assert(create.response.status === 201, `Expected create 201, got ${create.response.status}.`)
    assertSuccess(create.body)
    const id = create.body.data.id

    const update = await request(`/cms/products/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ name: 'Smoke Product Updated' }),
    })
    assert(update.response.status === 200, `Expected update 200, got ${update.response.status}.`)
    assertSuccess(update.body)

    const publish = await request(`/cms/products/${id}/publish`, { method: 'PATCH', accessToken, body: JSON.stringify({}) })
    assert(publish.response.status === 200, `Expected publish 200, got ${publish.response.status}.`)
    assertSuccess(publish.body)

    const archive = await request(`/cms/products/${id}/archive`, { method: 'PATCH', accessToken, body: JSON.stringify({}) })
    assert(archive.response.status === 200, `Expected archive 200, got ${archive.response.status}.`)
    assertSuccess(archive.body)
    return `productId=${id}`
  })

  await runStep('destination list/create/update/publish/archive flow works', async () => {
    const required = ['destinations.view', 'destinations.create', 'destinations.update', 'destinations.publish', 'destinations.archive']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/destinations?limit=5', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)

    const category = await getFirst('/cms/destination-categories', accessToken, 'destination category')
    const create = await request('/cms/destinations', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        categoryId: category.id,
        slug: `smoke-destination-${suffix}`,
        name: 'Smoke Destination',
        barangay: 'Poblacion',
        status: 'draft',
        isFeatured: false,
      }),
    })
    assert(create.response.status === 201, `Expected create 201, got ${create.response.status}.`)
    assertSuccess(create.body)
    createdDestinationId = create.body.data.id

    const update = await request(`/cms/destinations/${createdDestinationId}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ name: 'Smoke Destination Updated' }),
    })
    assert(update.response.status === 200, `Expected update 200, got ${update.response.status}.`)
    assertSuccess(update.body)

    const publish = await request(`/cms/destinations/${createdDestinationId}/publish`, { method: 'PATCH', accessToken, body: JSON.stringify({}) })
    assert(publish.response.status === 200, `Expected publish 200, got ${publish.response.status}.`)
    assertSuccess(publish.body)

    const archive = await request(`/cms/destinations/${createdDestinationId}/archive`, { method: 'PATCH', accessToken, body: JSON.stringify({}) })
    assert(archive.response.status === 200, `Expected archive 200, got ${archive.response.status}.`)
    assertSuccess(archive.body)
    return `destinationId=${createdDestinationId}`
  })

  await runStep('business list/create/update flow works', async () => {
    const required = ['businesses.view', 'businesses.create', 'businesses.update']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/businesses?limit=5', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)

    const create = await request('/cms/businesses', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        slug: `smoke-business-${suffix}`,
        name: 'Smoke Business',
        businessType: 'OTOP Producer',
        status: 'active',
        isFeatured: false,
      }),
    })
    assert(create.response.status === 201, `Expected create 201, got ${create.response.status}.`)
    assertSuccess(create.body)
    createdBusinessId = create.body.data.id

    const update = await request(`/cms/businesses/${createdBusinessId}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ name: 'Smoke Business Updated' }),
    })
    assert(update.response.status === 200, `Expected update 200, got ${update.response.status}.`)
    assertSuccess(update.body)
    return `businessId=${createdBusinessId}`
  })

  await runStep('museum artifact list/create/update/publish/archive flow works', async () => {
    const required = ['museum.view', 'museum.create', 'museum.update', 'museum.publish', 'museum.archive']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/museum/artifacts?limit=5', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)

    const category = await getFirst('/cms/museum/categories', accessToken, 'museum category')
    const create = await request('/cms/museum/artifacts', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        categoryId: category.id,
        slug: `smoke-artifact-${suffix}`,
        name: 'Smoke Artifact',
        eraLabel: 'Demo era',
        status: 'draft',
        isFeatured: false,
      }),
    })
    assert(create.response.status === 201, `Expected create 201, got ${create.response.status}.`)
    assertSuccess(create.body)
    createdArtifactId = create.body.data.id

    const update = await request(`/cms/museum/artifacts/${createdArtifactId}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ name: 'Smoke Artifact Updated' }),
    })
    assert(update.response.status === 200, `Expected update 200, got ${update.response.status}.`)
    assertSuccess(update.body)

    const publish = await request(`/cms/museum/artifacts/${createdArtifactId}/publish`, { method: 'PATCH', accessToken, body: JSON.stringify({}) })
    assert(publish.response.status === 200, `Expected publish 200, got ${publish.response.status}.`)
    assertSuccess(publish.body)

    const archive = await request(`/cms/museum/artifacts/${createdArtifactId}/archive`, { method: 'PATCH', accessToken, body: JSON.stringify({}) })
    assert(archive.response.status === 200, `Expected archive 200, got ${archive.response.status}.`)
    assertSuccess(archive.body)
    return `artifactId=${createdArtifactId}`
  })

  await runStep('map location list/create/update/delete flow works', async () => {
    const required = ['map_locations.view', 'map_locations.create', 'map_locations.update']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/map-locations?limit=5', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)

    const targetId = createdDestinationId || (await getFirst('/cms/destinations', accessToken, 'destination')).id
    const create = await request('/cms/map-locations', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        locationType: 'destination',
        destinationId: targetId,
        label: 'Smoke Map Location',
        latitude: 13.7,
        longitude: 123.2,
        markerColor: '#174A35',
        markerIcon: 'pin',
        geojsonProperties: { source: 'smoke-test' },
        status: 'published',
      }),
    })
    assert(create.response.status === 201, `Expected create 201, got ${create.response.status}.`)
    assertSuccess(create.body)
    const id = create.body.data.id

    const update = await request(`/cms/map-locations/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ label: 'Smoke Map Location Updated' }),
    })
    assert(update.response.status === 200, `Expected update 200, got ${update.response.status}.`)
    assertSuccess(update.body)

    const remove = await request(`/cms/map-locations/${id}`, {
      method: 'DELETE',
      accessToken,
      body: JSON.stringify({}),
    })
    assert(remove.response.status === 200, `Expected delete 200, got ${remove.response.status}.`)
    assertSuccess(remove.body)
    return `mapLocationId=${id}`
  })

  await runStep('logout after remaining CMS content smoke test', async () => {
    const { response, body } = await request('/auth/logout', {
      method: 'POST',
      accessToken,
      cookie: refreshCookie,
      body: JSON.stringify({}),
    })
    assert(response.status === 200, `Expected 200, got ${response.status}.`)
    assertSuccess(body)
    return `status=${response.status}`
  })

  summarize()
}

function summarize() {
  const passed = results.filter((result) => result.passed).length
  const failed = results.length - passed
  console.log('')
  console.log(`Smoke test summary: ${passed}/${results.length} passed`)
  if (failed > 0) {
    console.log('')
    console.log('Failures:')
    for (const result of results.filter((item) => !item.passed)) {
      console.log(`- ${result.name}: ${result.detail}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Remaining CMS content API smoke test crashed.')
  console.error(error.message)
  process.exit(1)
})
