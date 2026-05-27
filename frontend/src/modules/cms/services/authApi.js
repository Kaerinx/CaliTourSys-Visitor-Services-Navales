import { http, request } from '@/services/http'

const cmsPermissions = Object.freeze([
  'dashboard.view',
  'products.view',
  'promotions.view',
  'events.view',
  'destinations.view',
  'businesses.view',
  'map_locations.view',
  'museum.view',
  'media.view',
  'inquiries.view',
  'newsletter.view',
  'audit_logs.view',
])

const viewerPermissions = Object.freeze(['dashboard.view', 'products.view'])

export const authApi = {
  async login(payload) {
    try {
      return await http.post('/auth/login', payload)
    } catch (error) {
      if (!shouldTryProductLogin(error)) throw error
      const session = await request('/auth/login', {
        method: 'POST',
        body: {
          username: payload.email,
          password: payload.password,
        },
      })

      return {
        data: {
          accessToken: session.token,
          user: mapProductUserToCmsUser(session.user),
          productSession: session,
        },
      }
    }
  },
  logout() {
    return http.postAuth('/auth/logout', {})
  },
  refresh() {
    return http.post('/auth/refresh', {})
  },
  me() {
    return http.getAuth('/auth/me')
  },
}

function shouldTryProductLogin(error) {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.code === 'INVALID_JSON_RESPONSE' ||
    error?.code === 'INVALID_API_ENVELOPE' ||
    error?.status === 404
  )
}

function mapProductUserToCmsUser(user = {}) {
  const isViewOnly = user.role === 'LGU Official'
  const permissions = isViewOnly ? viewerPermissions : cmsPermissions

  return {
    id: user.id,
    email: user.username ? `${user.username}@product.local` : '',
    username: user.username,
    displayName: user.fullName || user.username || 'Tourism Staff',
    fullName: user.fullName,
    role: user.role,
    roles: [user.role].filter(Boolean),
    permissions: [...permissions],
  }
}
