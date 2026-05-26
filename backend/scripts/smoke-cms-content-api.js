const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1'
const CMS_TEST_EMAIL = process.env.CMS_TEST_EMAIL
const CMS_TEST_PASSWORD = process.env.CMS_TEST_PASSWORD

const results = []

function record(name, passed, detail = '') {
  results.push({ name, passed, detail })
  const label = passed ? 'PASS' : 'FAIL'
  console.log(`${label} ${name}`)
  if (detail) console.log(`  ${detail}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
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

function assertError(body, code) {
  assert(body?.success === false, 'Expected success=false.')
  assert(body?.error?.code === code, `Expected error code ${code}.`)
  assert(Array.isArray(body?.error?.details), 'Expected error.details array.')
  assert(body?.meta?.requestId, 'Expected meta.requestId.')
}

function assertPaginated(body) {
  assertSuccess(body)
  assert(Array.isArray(body.data), 'Expected data array.')
  assert(body.meta?.pagination, 'Expected meta.pagination.')
}

function getPermissionSet(user) {
  return new Set(user?.permissions || [])
}

function hasAll(permissionSet, permissions) {
  return permissions.every((permission) => permissionSet.has(permission))
}

async function runStep(name, fn) {
  try {
    const detail = await fn()
    record(name, true, detail)
  } catch (error) {
    record(name, false, error.message)
  }
}

async function main() {
  console.log('CaliTourSys CMS content API smoke test')
  console.log(`Base URL: ${API_BASE_URL}`)
  console.log('')

  await runStep('CMS content route rejects unauthenticated requests', async () => {
    const { response, body } = await request('/cms/promotions')
    assert(response.status === 401, `Expected 401, got ${response.status}.`)
    assertError(body, 'UNAUTHENTICATED')
    return `status=${response.status}, code=${body.error.code}`
  })

  if (!CMS_TEST_EMAIL || !CMS_TEST_PASSWORD) {
    record(
      'Protected CMS content live tests skipped',
      true,
      'Set CMS_TEST_EMAIL and CMS_TEST_PASSWORD to run authenticated tests.',
    )
    summarize()
    return
  }

  let accessToken = null
  let refreshCookie = null
  let permissions = new Set()
  let createdPromotionId = null

  await runStep('login for CMS content smoke test', async () => {
    const { response, body, cookie } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: CMS_TEST_EMAIL,
        password: CMS_TEST_PASSWORD,
      }),
    })

    assert(response.status === 200, `Expected 200, got ${response.status}.`)
    assertSuccess(body)
    assert(body.data?.accessToken, 'Expected access token.')

    accessToken = body.data.accessToken
    refreshCookie = cookie
    permissions = getPermissionSet(body.data.user)

    return `status=${response.status}`
  })

  await runStep('list promotions returns paginated CMS records', async () => {
    if (!permissions.has('promotions.view')) return 'skipped: missing promotions.view'

    const { response, body } = await request('/cms/promotions?limit=5', { accessToken })
    assert(response.status === 200, `Expected 200, got ${response.status}.`)
    assertPaginated(body)
    return `items=${body.data.length}`
  })

  await runStep('create, update, publish, and archive promotion draft', async () => {
    const required = ['promotions.view', 'promotions.create', 'promotions.update', 'promotions.publish', 'promotions.archive']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const slug = `smoke-promotion-${Date.now()}`
    const createResult = await request('/cms/promotions', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        slug,
        title: 'Smoke Test Promotion',
        summary: 'Development smoke test record.',
        description: 'Created by the CMS content API smoke test.',
        promotionType: 'announcement',
        status: 'draft',
        isFeatured: false,
      }),
    })

    assert(createResult.response.status === 201, `Expected 201, got ${createResult.response.status}.`)
    assertSuccess(createResult.body)
    createdPromotionId = createResult.body.data.id

    const updateResult = await request(`/cms/promotions/${createdPromotionId}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({
        title: 'Smoke Test Promotion Updated',
      }),
    })
    assert(updateResult.response.status === 200, `Expected update 200, got ${updateResult.response.status}.`)
    assertSuccess(updateResult.body)
    assert(updateResult.body.data.title === 'Smoke Test Promotion Updated', 'Promotion title was not updated.')

    const publishResult = await request(`/cms/promotions/${createdPromotionId}/publish`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({}),
    })
    assert(publishResult.response.status === 200, `Expected publish 200, got ${publishResult.response.status}.`)
    assertSuccess(publishResult.body)
    assert(publishResult.body.data.status === 'published', 'Promotion was not published.')

    const archiveResult = await request(`/cms/promotions/${createdPromotionId}/archive`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({}),
    })
    assert(archiveResult.response.status === 200, `Expected archive 200, got ${archiveResult.response.status}.`)
    assertSuccess(archiveResult.body)
    assert(archiveResult.body.data.status === 'archived', 'Promotion was not archived.')

    return `promotionId=${createdPromotionId}`
  })

  await runStep('list events returns paginated CMS records', async () => {
    if (!permissions.has('events.view')) return 'skipped: missing events.view'

    const { response, body } = await request('/cms/events?limit=5', { accessToken })
    assert(response.status === 200, `Expected 200, got ${response.status}.`)
    assertPaginated(body)
    return `items=${body.data.length}`
  })

  await runStep('list category endpoints return paginated CMS records', async () => {
    const checks = [
      ['events.view', '/cms/event-categories'],
      ['products.view', '/cms/product-categories'],
      ['destinations.view', '/cms/destination-categories'],
      ['museum.view', '/cms/museum/categories'],
    ]
    const tested = []

    for (const [permission, path] of checks) {
      if (!permissions.has(permission)) continue
      const { response, body } = await request(`${path}?limit=5`, { accessToken })
      assert(response.status === 200, `Expected ${path} 200, got ${response.status}.`)
      assertPaginated(body)
      tested.push(path)
    }

    if (tested.length === 0) return 'skipped: missing category view permissions'
    return `tested=${tested.join(', ')}`
  })

  await runStep('forbidden behavior works for missing permissions when practical', async () => {
    if (permissions.has('users.manage')) return 'skipped: current user is highly privileged'

    const { response, body } = await request('/cms/users', { accessToken })
    assert([403, 404].includes(response.status), `Expected 403 or 404, got ${response.status}.`)
    if (response.status === 403) assertError(body, 'FORBIDDEN')
    return `status=${response.status}`
  })

  await runStep('logout after CMS content smoke test', async () => {
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
  console.error('CMS content API smoke test crashed.')
  console.error(error.message)
  process.exit(1)
})
