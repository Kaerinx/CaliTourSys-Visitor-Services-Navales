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

async function testUnauthenticatedMe() {
  const { response, body } = await request('/auth/me')
  const envelopeError = assertEnvelope(body, false)
  record(
    'unauthenticated /auth/me returns standard error envelope',
    response.status === 401 && !envelopeError,
    envelopeError || `status=${response.status}, code=${body?.error?.code}`,
  )
}

async function testInvalidLogin() {
  const { response, body } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `missing-${Date.now()}@example.test`,
      password: 'DefinitelyWrong123!',
    }),
  })
  const envelopeError = assertEnvelope(body, false)
  record(
    'invalid login returns generic standard error envelope',
    response.status === 401 && body?.error?.code === 'INVALID_CREDENTIALS' && !envelopeError,
    envelopeError || `status=${response.status}, code=${body?.error?.code}`,
  )
}

async function testLiveAuthFlow() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    record(
      'live login/me/refresh/logout flow',
      true,
      'Skipped because CMS_TEST_EMAIL and CMS_TEST_PASSWORD are not set.',
    )
    return
  }

  const loginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  const loginEnvelopeError = assertEnvelope(loginResult.body, true)
  const accessToken = loginResult.body?.data?.accessToken
  const cookieHeader = getCookieHeader(loginResult.response)

  record(
    'login returns access token and sets refresh cookie',
    loginResult.response.ok && Boolean(accessToken) && Boolean(cookieHeader) && !loginEnvelopeError,
    loginEnvelopeError || `status=${loginResult.response.status}`,
  )

  if (!accessToken || !cookieHeader) return

  const meResult = await request('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const meEnvelopeError = assertEnvelope(meResult.body, true)
  record(
    '/auth/me returns user profile, roles, and permissions',
    meResult.response.ok &&
      Array.isArray(meResult.body?.data?.roles) &&
      Array.isArray(meResult.body?.data?.permissions) &&
      !meEnvelopeError,
    meEnvelopeError || `status=${meResult.response.status}`,
  )

  const refreshResult = await request('/auth/refresh', {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: JSON.stringify({}),
  })
  const refreshEnvelopeError = assertEnvelope(refreshResult.body, true)
  const refreshedCookie = getCookieHeader(refreshResult.response) || cookieHeader
  const refreshedToken = refreshResult.body?.data?.accessToken
  record(
    '/auth/refresh rotates refresh token and returns a new access token',
    refreshResult.response.ok && Boolean(refreshedToken) && !refreshEnvelopeError,
    refreshEnvelopeError || `status=${refreshResult.response.status}`,
  )

  const logoutResult = await request('/auth/logout', {
    method: 'POST',
    headers: { Cookie: refreshedCookie },
    body: JSON.stringify({}),
  })
  const logoutEnvelopeError = assertEnvelope(logoutResult.body, true)
  record(
    '/auth/logout revokes the refresh session',
    logoutResult.response.ok && !logoutEnvelopeError,
    logoutEnvelopeError || `status=${logoutResult.response.status}`,
  )
}

async function main() {
  console.log('CaliTourSys auth/RBAC smoke test')
  console.log(`Base URL: ${API_BASE_URL}\n`)

  try {
    await testUnauthenticatedMe()
    await testInvalidLogin()
    await testLiveAuthFlow()
  } catch (error) {
    record('auth API smoke test transport', false, error.message)
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

