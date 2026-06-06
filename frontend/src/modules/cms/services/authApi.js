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
      const response = await http.post('/auth/login', payload)
      return {
        ...response,
        data: {
          ...response.data,
          productSession: mapCmsSessionToProductSession(response.data),
        },
      }
    } catch (error) {
      if (!shouldTryProductLogin(error)) throw error
      const session = await request('/auth/login', {
        method: 'POST',
        body: {
          username: payload.identifier || payload.email,
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

function mapCmsSessionToProductSession(data = {}) {
  if (!data.accessToken || !data.user) return null

  return {
    token: data.accessToken,
    user: {
      id: data.user.id,
      username: data.user.username || data.user.email,
      fullName: data.user.displayName,
      role: legacyRoleName(data.user.roles),
    },
  }
}

function legacyRoleName(roles = []) {
  if (roles.includes('system_admin')) return 'System Administrator'
  if (roles.includes('tourism_officer')) return 'Tourism Officer'
  if (roles.includes('tourism_staff') || roles.includes('content_editor')) return 'Tourism Staff'
  return 'LGU Official'
}
