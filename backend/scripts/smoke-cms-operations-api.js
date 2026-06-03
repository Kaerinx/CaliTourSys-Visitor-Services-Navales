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

function hasAll(permissionSet, permissions) {
  return permissions.every((permission) => permissionSet.has(permission))
}

function headers(accessToken, cookie) {
  const output = { Accept: 'application/json', 'Content-Type': 'application/json' }
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
  return { response, body, cookie: response.headers.get('set-cookie') }
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
  console.log('CaliTourSys CMS operations API smoke test')
  console.log(`Base URL: ${API_BASE_URL}`)
  console.log('')

  await runStep('CMS operations route rejects unauthenticated requests', async () => {
    const { response, body } = await request('/cms/media')
    assert(response.status === 401, `Expected 401, got ${response.status}.`)
    assertError(body, 'UNAUTHENTICATED')
    return `status=${response.status}, code=${body.error.code}`
  })

  if (!CMS_TEST_EMAIL || !CMS_TEST_PASSWORD) {
    record('Protected CMS operations live tests skipped', true, 'Set CMS_TEST_EMAIL and CMS_TEST_PASSWORD to run authenticated tests.')
    summarize()
    return
  }

  let accessToken = null
  let refreshCookie = null
  let permissions = new Set()
  const suffix = Date.now()
  let mediaId = null
  let inquiryId = null
  let subscriberId = null
  let auditLogId = null

  await runStep('login for CMS operations smoke test', async () => {
    const { response, body, cookie } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: CMS_TEST_EMAIL, password: CMS_TEST_PASSWORD }),
    })
    assert(response.status === 200, `Expected 200, got ${response.status}.`)
    assertSuccess(body)
    accessToken = body.data.accessToken
    refreshCookie = cookie
    permissions = new Set(body.data.user?.permissions || [])
    return `status=${response.status}`
  })

  await runStep('media list/create/update/archive flow works', async () => {
    const required = ['media.view', 'media.upload', 'media.archive']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/media?limit=5', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)

    const create = await request('/cms/media', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({
        fileUrl: `https://example.test/calitoursys-smoke-${suffix}.jpg`,
        fileName: 'Smoke Media',
        mimeType: 'image/jpeg',
        altText: 'Smoke test media asset.',
        status: 'active',
        storageProvider: 'external',
      }),
    })
    assert(create.response.status === 201, `Expected create 201, got ${create.response.status}.`)
    assertSuccess(create.body)
    mediaId = create.body.data.id

    const update = await request(`/cms/media/${mediaId}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ caption: 'Smoke media caption updated.' }),
    })
    assert(update.response.status === 200, `Expected update 200, got ${update.response.status}.`)
    assertSuccess(update.body)

    const archive = await request(`/cms/media/${mediaId}/archive`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({}),
    })
    assert(archive.response.status === 200, `Expected archive 200, got ${archive.response.status}.`)
    assertSuccess(archive.body)
    return `mediaId=${mediaId}`
  })

  await runStep('inquiry list/detail/status/response flow works', async () => {
    const required = ['inquiries.view', 'inquiries.respond']
    if (!hasAll(permissions, required)) return `skipped: missing one of ${required.join(', ')}`

    const list = await request('/cms/inquiries?limit=1', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)
    if (list.body.data.length === 0) return 'skipped: no seeded inquiry'
    inquiryId = list.body.data[0].id

    const detail = await request(`/cms/inquiries/${inquiryId}`, { accessToken })
    assert(detail.response.status === 200, `Expected detail 200, got ${detail.response.status}.`)
    assertSuccess(detail.body)

    const status = await request(`/cms/inquiries/${inquiryId}/status`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ status: 'read' }),
    })
    assert(status.response.status === 200, `Expected status 200, got ${status.response.status}.`)
    assertSuccess(status.body)

    const response = await request(`/cms/inquiries/${inquiryId}/responses`, {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ responseMessage: 'CMS smoke test response draft.', status: 'draft' }),
    })
    assert(response.response.status === 201, `Expected response create 201, got ${response.response.status}.`)
    assertSuccess(response.body)

    const responses = await request(`/cms/inquiries/${inquiryId}/responses`, { accessToken })
    assert(responses.response.status === 200, `Expected responses 200, got ${responses.response.status}.`)
    assertSuccess(responses.body)
    assert(Array.isArray(responses.body.data.items), 'Expected response items array.')
    return `inquiryId=${inquiryId}`
  })

  await runStep('newsletter list/status flow works', async () => {
    if (!permissions.has('newsletter.view')) return 'skipped: missing newsletter.view'

    const list = await request('/cms/newsletter-subscribers?limit=1', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)
    if (list.body.data.length === 0) return 'skipped: no seeded subscriber'
    subscriberId = list.body.data[0].id

    const update = await request(`/cms/newsletter-subscribers/${subscriberId}/status`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ status: 'subscribed' }),
    })
    assert(update.response.status === 200, `Expected status 200, got ${update.response.status}.`)
    assertSuccess(update.body)
    return `subscriberId=${subscriberId}`
  })

  await runStep('users, roles, and permissions lists work safely', async () => {
    if (!hasAll(permissions, ['users.view', 'roles.view'])) return 'skipped: missing users.view or roles.view'

    const users = await request('/cms/users?limit=5', { accessToken })
    assert(users.response.status === 200, `Expected users 200, got ${users.response.status}.`)
    assertPaginated(users.body)
    assert(!JSON.stringify(users.body).includes('password_hash'), 'Response must not include password_hash.')

    const roles = await request('/cms/roles', { accessToken })
    assert(roles.response.status === 200, `Expected roles 200, got ${roles.response.status}.`)
    assertSuccess(roles.body)
    assert(Array.isArray(roles.body.data), 'Expected roles array.')

    const permissionsResponse = await request('/cms/permissions', { accessToken })
    assert(permissionsResponse.response.status === 200, `Expected permissions 200, got ${permissionsResponse.response.status}.`)
    assertSuccess(permissionsResponse.body)
    assert(Array.isArray(permissionsResponse.body.data), 'Expected permissions array.')
    return `users=${users.body.data.length}, roles=${roles.body.data.length}`
  })

  await runStep('audit logs list/detail works', async () => {
    if (!permissions.has('audit_logs.view')) return 'skipped: missing audit_logs.view'

    const list = await request('/cms/audit-logs?limit=1', { accessToken })
    assert(list.response.status === 200, `Expected list 200, got ${list.response.status}.`)
    assertPaginated(list.body)
    if (list.body.data.length === 0) return 'skipped: no audit logs'
    auditLogId = list.body.data[0].id

    const detail = await request(`/cms/audit-logs/${auditLogId}`, { accessToken })
    assert(detail.response.status === 200, `Expected detail 200, got ${detail.response.status}.`)
    assertSuccess(detail.body)
    const serialized = JSON.stringify(detail.body).toLowerCase()
    assert(!serialized.includes('password_hash'), 'Audit detail must not expose password_hash.')
    assert(!serialized.includes('refresh_token_hash'), 'Audit detail must not expose refresh_token_hash.')
    return `auditLogId=${auditLogId}`
  })

  await runStep('logout after CMS operations smoke test', async () => {
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
  console.error('CMS operations API smoke test crashed.')
  console.error(error.message)
  process.exit(1)
})
