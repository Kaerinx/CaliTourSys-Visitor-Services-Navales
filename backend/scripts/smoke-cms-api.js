const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1'
const TEST_EMAIL = process.env.CMS_TEST_EMAIL
const TEST_PASSWORD = process.env.CMS_TEST_PASSWORD

const results = []

function record(name, passed, detail = '') {
  results.push({ name, passed, detail })
  const status = passed ? 'PASS' : 'FAIL'
  console.log(`${status} ${name}${detail ? `\n  ${detail}` : ''}`)
}

function assertEnvelope(body, expectedSuccess) {
  if (!body || typeof body !== 'object') return 'Response body is not an object.'
  if (body.success !== expectedSuccess) return `Expected success=${expectedSuccess}.`
  if (!body.meta?.requestId || !body.meta?.timestamp) return 'Missing meta.requestId or meta.timestamp.'
  if (expectedSuccess && !Object.prototype.hasOwnProperty.call(body, 'data')) return 'Missing data.'
  if (!expectedSuccess && !body.error?.code) return 'Missing error.code.'
  return null
}

function getCookieHeader(response) {
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean)

  return cookies.map((cookie) => cookie.split(';')[0]).join('; ')
}

async function readJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { parseError: text }
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  return {
    response,
    body: await readJson(response),
  }
}

async function testUnauthorizedCmsRoute() {
  const { response, body } = await request('/cms/health')
  const envelopeError = assertEnvelope(body, false)

  record(
    'CMS route rejects unauthenticated requests',
    response.status === 401 && body?.error?.code === 'UNAUTHENTICATED' && !envelopeError,
    envelopeError || `status=${response.status}, code=${body?.error?.code}`,
  )
}

async function login() {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  })

  const envelopeError = assertEnvelope(result.body, true)
  const accessToken = result.body?.data?.accessToken
  const cookieHeader = getCookieHeader(result.response)

  record(
    'login for CMS smoke test',
    result.response.ok && Boolean(accessToken) && !envelopeError,
    envelopeError || `status=${result.response.status}`,
  )

  return {
    accessToken,
    cookieHeader,
    permissions: result.body?.data?.user?.permissions || [],
  }
}

async function testProtectedGet(path, name, accessToken, validateData) {
  const { response, body } = await request(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const envelopeError = assertEnvelope(body, true)
  const dataError = validateData ? validateData(body?.data, body?.meta) : null

  record(
    name,
    response.ok && !envelopeError && !dataError,
    envelopeError || dataError || `status=${response.status}, code=${body?.error?.code}`,
  )

  return { response, body }
}

async function testLiveCmsFlow() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    record(
      'protected CMS live tests',
      true,
      'Skipped because CMS_TEST_EMAIL and CMS_TEST_PASSWORD are not set.',
    )
    return
  }

  const { accessToken, cookieHeader, permissions } = await login()
  if (!accessToken) return

  await testProtectedGet('/cms/health', 'GET /cms/health works with dashboard.view', accessToken, (data) => {
    if (data?.service !== 'CaliTourSys CMS API') return 'Unexpected CMS health service.'
    if (data?.authenticated !== true) return 'CMS health did not mark authenticated=true.'
    return null
  })

  await testProtectedGet('/cms/dashboard', 'GET /cms/dashboard returns safe summary counts', accessToken, (data) => {
    if (typeof data?.totalProducts !== 'number') return 'Missing totalProducts count.'
    if (!Array.isArray(data?.recentAuditLogs)) return 'Missing recentAuditLogs array.'
    return null
  })

  await testProtectedGet('/cms/navigation', 'GET /cms/navigation returns permission-filtered items', accessToken, (data) => {
    if (!Array.isArray(data?.items)) return 'Missing navigation items array.'
    return null
  })

  if (permissions.includes('audit_logs.view')) {
    await testProtectedGet('/cms/audit-logs', 'GET /cms/audit-logs returns paginated safe audit list', accessToken, (data, meta) => {
      if (!Array.isArray(data)) return 'Audit log response data is not an array.'
      if (!meta?.pagination) return 'Missing pagination metadata.'
      const exposesRawJson = data.some((item) => item.beforeValues || item.afterValues)
      if (exposesRawJson) return 'Audit logs expose before/after values.'
      return null
    })
  } else {
    const { response, body } = await request('/cms/audit-logs', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const envelopeError = assertEnvelope(body, false)

    record(
      'GET /cms/audit-logs is forbidden without audit_logs.view',
      response.status === 403 && body?.error?.code === 'FORBIDDEN' && !envelopeError,
      envelopeError || `status=${response.status}, code=${body?.error?.code}`,
    )
  }

  if (cookieHeader) {
    const logoutResult = await request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookieHeader },
      body: JSON.stringify({}),
    })
    const envelopeError = assertEnvelope(logoutResult.body, true)
    record(
      'logout after CMS smoke test',
      logoutResult.response.ok && !envelopeError,
      envelopeError || `status=${logoutResult.response.status}`,
    )
  }
}

async function main() {
  console.log('CaliTourSys protected CMS API smoke test')
  console.log(`Base URL: ${API_BASE_URL}\n`)

  try {
    await testUnauthorizedCmsRoute()
    await testLiveCmsFlow()
  } catch (error) {
    record('CMS API smoke test transport', false, error.message)
  }

  const passed = results.filter((result) => result.passed).length
  console.log(`\nSmoke test summary: ${passed}/${results.length} passed`)

  const failures = results.filter((result) => !result.passed)
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((failure) => console.log(`- ${failure.name}: ${failure.detail}`))
    process.exit(1)
  }
}

main()
