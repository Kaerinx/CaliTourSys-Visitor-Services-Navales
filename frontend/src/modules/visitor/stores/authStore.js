import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useCmsAuthStore } from '@/modules/cms/stores/authStore'

function normalizeRoles(user = {}) {
  const rawRoles = [
    user.role,
    ...(Array.isArray(user.roles) ? user.roles : []),
    ...(Array.isArray(user.roleKeys) ? user.roleKeys : []),
  ]

  return rawRoles.filter(Boolean).map((role) => String(role).trim().toLowerCase().replace(/[\s-]+/g, '_'))
}

function visitorRoleFor(user) {
  const roles = normalizeRoles(user)

  if (roles.some((role) => ['admin', 'system_admin', 'system_administrator'].includes(role))) return 'admin'
  if (roles.some((role) => ['receptionist', 'receptionist_desk', 'front_desk', 'frontdesk', 'visitor_receptionist'].includes(role))) {
    return 'receptionist'
  }
  if (roles.some((role) => ['tourism_staff', 'tourism_officer', 'content_editor'].includes(role))) {
    return 'tourism_staff'
  }

  return ''
}

function dashboardForRole(role) {
  if (role === 'admin') return '/cms/visitor/admin'
  if (role === 'receptionist') return '/cms/visitor/receptionist'
  if (role === 'tourism_staff') return '/cms/visitor/records'
  return ''
}

function toVisitorUser(user) {
  if (!user) return null

  const role = visitorRoleFor(user)
  return {
    ...user,
    role,
    full_name: user.full_name || user.fullName || user.displayName || user.username || user.email,
    fullName: user.fullName || user.displayName || user.full_name,
    username: user.username || user.email,
    email: user.email || user.username,
    assigned_establishment_id: user.assigned_establishment_id || user.assignedEstablishmentId,
    assigned_establishment_name: user.assigned_establishment_name || user.assignedEstablishmentName,
  }
}

function toCmsUser(user, existingUser) {
  const nextRole = user?.role || visitorRoleFor(existingUser)
  const rolesByVisitorRole = {
    admin: 'system_admin',
    receptionist: 'receptionist',
    tourism_staff: 'tourism_staff',
  }

  return {
    ...existingUser,
    ...user,
    displayName: user?.displayName || user?.fullName || user?.full_name || existingUser?.displayName,
    roles: existingUser?.roles?.length ? existingUser.roles : [rolesByVisitorRole[nextRole]].filter(Boolean),
  }
}

export const useAuthStore = defineStore('visitor-auth', () => {
  const cmsAuth = useCmsAuthStore()

  const token = computed(() => cmsAuth.accessToken)
  const user = computed(() => toVisitorUser(cmsAuth.currentUser))
  const isAuthenticated = computed(() => Boolean(cmsAuth.isAuthenticated && user.value?.role))
  const dashboardRoute = computed(() => dashboardForRole(user.value?.role))

  function setSession(_nextToken, nextUser) {
    if (!nextUser) return
    cmsAuth.currentUser = toCmsUser(nextUser, cmsAuth.currentUser)
  }

  async function login() {
    throw new Error('Visitor Services now uses the CMS sign-in page. Please sign in through /cms/login.')
  }

  async function fetchMe() {
    await cmsAuth.fetchMe()
    return user.value
  }

  async function logout() {
    await cmsAuth.logout()
  }

  return {
    token,
    user,
    isAuthenticated,
    dashboardRoute,
    setSession,
    login,
    fetchMe,
    logout,
  }
})
