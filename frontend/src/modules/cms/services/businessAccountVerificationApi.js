import { API_BASE_URL, ApiError } from '@/services/http'

const TOKEN_KEY = 'calitoursys_cms_access_token'

async function request(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(payload?.message || payload?.error?.message || 'Unable to complete the request.', {
      status: response.status,
      code: payload?.code || payload?.error?.code,
    })
  }

  return payload
}

export const businessAccountVerificationApi = {
  async listBusinessOwners(params = {}) {
    const search = new URLSearchParams({ role: 'business_owner' })
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value)
    })
    return request(`/accreditation/admin/users?${search.toString()}`)
  },
  async updateStatus(id, status) {
    return request(`/accreditation/admin/users/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },
}
