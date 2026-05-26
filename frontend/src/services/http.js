const DEFAULT_API_BASE_URL = 'http://localhost:5000/api/v1'

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code || 'API_ERROR'
    this.details = options.details || []
    this.requestId = options.requestId
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
let authTokenGetter = () => null

export function setAuthTokenGetter(getter) {
  authTokenGetter = typeof getter === 'function' ? getter : () => null
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

async function apiRequest(method, path, { params, body, headers, auth = false } = {}) {
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
    throw new ApiError(payload?.error?.message || 'The tourism API request failed.', {
      status: response.status,
      code: payload?.error?.code,
      details: payload?.error?.details,
      requestId,
    })
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
    return apiRequest('GET', path, { params })
  },
  patch(path, body, options = {}) {
    return apiRequest('PATCH', path, { body, ...options })
  },
  post(path, body) {
    return apiRequest('POST', path, { body })
  },
  postAuth(path, body) {
    return apiRequest('POST', path, { body, auth: true })
  },
  patchAuth(path, body) {
    return apiRequest('PATCH', path, { body, auth: true })
  },
  getAuth(path, params) {
    return apiRequest('GET', path, { params, auth: true })
  },
  delete(path) {
    return apiRequest('DELETE', path)
  },
  deleteAuth(path) {
    return apiRequest('DELETE', path, { auth: true })
  },
}

export async function request(path, options = {}) {
  const method = options.method || 'GET'
  const legacyToken = window.localStorage.getItem('calitoursys_token')
  const result = await apiRequest(method, path, {
    body: options.body,
    headers: {
      ...(legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {}),
      ...options.headers,
    },
  })

  return result?.data ?? result
}

export { API_BASE_URL }
