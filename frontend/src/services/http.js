const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')

function getToken() {
  return localStorage.getItem('calitoursys_token') || localStorage.getItem('token')
}

function buildUrl(path, params) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${cleanPath}`)

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    Accept: 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, options.params), {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : 'Request failed.'
    throw new Error(message)
  }

  return data
}

export const http = {
  get(path, params) {
    return request(path, { method: 'GET', params })
  },
  post(path, body) {
    return request(path, { method: 'POST', body })
  },
  patch(path, body) {
    return request(path, { method: 'PATCH', body })
  },
  put(path, body) {
    return request(path, { method: 'PUT', body })
  },
  delete(path) {
    return request(path, { method: 'DELETE' })
  },
}

export default http
