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

async function request(method, path, { params, body, headers } = {}) {
  let response

  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
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
    return request('GET', path, { params })
  },
  post(path, body) {
    return request('POST', path, { body })
  },
  delete(path) {
    return request('DELETE', path)
  },
}

export { API_BASE_URL }
