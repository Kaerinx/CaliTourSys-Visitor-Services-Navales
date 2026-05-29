const DEFAULT_API_BASE_URL = 'http://localhost:5000/api/v1'

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code || 'API_ERROR'
    this.details = options.details || []
    this.requestId = options.requestId
    this.isAuthFailure = Boolean(options.isAuthFailure)
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
const AUTH_FAILURE_CODES = new Set([
  'ACCOUNT_INACTIVE',
  'FORBIDDEN',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
  'TOKEN_EXPIRED',
  'UNAUTHENTICATED',
])

let authTokenGetter = () => null
let authFailureHandler = () => {}

export function setAuthTokenGetter(getter) {
  authTokenGetter = typeof getter === 'function' ? getter : () => null
}

export function setAuthFailureHandler(handler) {
  authFailureHandler = typeof handler === 'function' ? handler : () => {}
}

export function isAuthFailureError(error) {
  return (
    error instanceof ApiError &&
    (error.isAuthFailure ||
      error.status === 401 ||
      error.status === 403 ||
      AUTH_FAILURE_CODES.has(error.code))
  )
}

function normalizeAuthFailureCode(error) {
  if (error.status === 401 && (!error.code || error.code === 'API_ERROR' || error.code === 'UNAUTHENTICATED')) {
    return 'SESSION_EXPIRED'
  }

  if (error.status === 403 && (!error.code || error.code === 'API_ERROR')) return 'FORBIDDEN'
  return error.code || 'SESSION_EXPIRED'
}

function shouldHandleAuthFailure(auth, error) {
  if (!auth) return false
  return error.status === 401 || error.status === 403 || AUTH_FAILURE_CODES.has(error.code)
}

function notifyAuthFailure(error, context) {
  authFailureHandler({ error, ...context })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('calitoursys:cms-auth-failed', {
        detail: { code: error.code, path: context.path, status: error.status },
      }),
    )
  }
}

function buildUrl(path, params) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`)

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

async function parseJsonSafely(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError('The server returned an invalid response.', {
      status: response.status,
      code: 'INVALID_JSON_RESPONSE',
    })
  }
}

async function request(method, path, { params, body, headers, auth = false } = {}) {
  let response
  const token = auth ? authTokenGetter() : null

  try {
    response = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Unable to connect to the tourism API. Please try again later.', {
      code: 'NETWORK_ERROR',
    })
  }

  if (response.status === 204) return null

  const payload = await parseJsonSafely(response)
  const requestId = payload?.meta?.requestId

  if (!response.ok || payload?.success === false) {
    const error = new ApiError(payload?.error?.message || 'The tourism API request failed.', {
      status: response.status,
      code: payload?.error?.code,
      details: payload?.error?.details,
      requestId,
    })

    if (shouldHandleAuthFailure(auth, error)) {
      error.code = normalizeAuthFailureCode(error)
      error.isAuthFailure = true
      notifyAuthFailure(error, { method, path })
    }

    throw error
  }

  if (payload?.success !== true || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
    throw new ApiError('The tourism API response did not match the expected format.', {
      status: response.status,
      code: 'INVALID_API_ENVELOPE',
      requestId,
    })
  }

  return {
    data: payload.data,
    meta: payload.meta,
  }
}

export const http = {
  get(path, params) {
    return request('GET', path, { params })
  },
  patch(path, body, options = {}) {
    return request('PATCH', path, { body, ...options })
  },
  post(path, body) {
    return request('POST', path, { body })
  },
  postAuth(path, body) {
    return request('POST', path, { body, auth: true })
  },
  patchAuth(path, body) {
    return request('PATCH', path, { body, auth: true })
  },
  getAuth(path, params) {
    return request('GET', path, { params, auth: true })
  },
  delete(path) {
    return request('DELETE', path)
  },
  deleteAuth(path) {
    return request('DELETE', path, { auth: true })
  },
}

export { API_BASE_URL }
