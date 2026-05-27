import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, setAuthTokenGetter } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '../services/authApi'

const TOKEN_KEY = 'calitoursys_cms_access_token'
const USER_KEY = 'calitoursys_cms_user'
const PRODUCT_TOKEN_KEY = 'calitoursys_token'
const PRODUCT_USER_KEY = 'calitoursys_user'

export const useCmsAuthStore = defineStore('cmsAuth', () => {
  const accessToken = ref(sessionStorage.getItem(TOKEN_KEY) || '')
  const currentUser = ref(readStoredUser())
  const isLoading = ref(false)
  const error = ref('')
  const hasBootstrapped = ref(false)

  setAuthTokenGetter(() => accessToken.value)

  const roles = computed(() => currentUser.value?.roles || [])
  const permissions = computed(() => currentUser.value?.permissions || [])
  const isAuthenticated = computed(() => Boolean(accessToken.value && currentUser.value))

  function persistToken(token) {
    accessToken.value = token || ''
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  }

  function setUser(user) {
    currentUser.value = user || null
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(USER_KEY)
  }

  function clearAuth() {
    persistToken('')
    setUser(null)
    window.localStorage.removeItem(PRODUCT_TOKEN_KEY)
    window.localStorage.removeItem(PRODUCT_USER_KEY)
  }

  async function login(email, password) {
    isLoading.value = true
    error.value = ''
    try {
      const { data } = await authApi.login({ email, password })
      persistToken(data.accessToken)
      setUser(data.user)
      syncProductSession(data.productSession)
      return data.user
    } catch (err) {
      clearAuth()
      error.value = friendlyAuthError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      if (accessToken.value) await authApi.logout()
    } catch {
      // Local logout still wins if the server cannot be reached.
    } finally {
      clearAuth()
      isLoading.value = false
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return null
    const { data } = await authApi.me()
    setUser(data.user || data)
    syncProductSession(cmsUserToProductSession(currentUser.value, accessToken.value))
    return currentUser.value
  }

  async function refreshSession() {
    isLoading.value = true
    error.value = ''
    try {
      const { data } = await authApi.refresh()
      persistToken(data.accessToken)
      setUser(data.user)
      syncProductSession(cmsUserToProductSession(data.user, data.accessToken))
      return data.user
    } catch (err) {
      if (accessToken.value) {
        try {
          return await fetchMe()
        } catch {
          clearAuth()
        }
      } else {
        clearAuth()
      }
      if (err instanceof ApiError && err.status !== 401) error.value = friendlyAuthError(err)
      return null
    } finally {
      isLoading.value = false
      hasBootstrapped.value = true
    }
  }

  async function bootstrap() {
    if (accessToken.value && currentUser.value) {
      syncProductSession(cmsUserToProductSession(currentUser.value, accessToken.value))
      hasBootstrapped.value = true
      return currentUser.value
    }
    if (hasBootstrapped.value && (isAuthenticated.value || !accessToken.value)) return currentUser.value
    return refreshSession()
  }

  function hasPermission(permissionKey) {
    return permissions.value.includes(permissionKey)
  }

  function hasAnyPermission(permissionKeys) {
    return (permissionKeys || []).some((permissionKey) => hasPermission(permissionKey))
  }

  return {
    accessToken,
    currentUser,
    error,
    hasAnyPermission,
    hasBootstrapped,
    hasPermission,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchMe,
    refreshSession,
    bootstrap,
    roles,
    permissions,
  }
})

function friendlyAuthError(error) {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_CREDENTIALS') return 'Invalid email or password.'
    if (error.code === 'ACCOUNT_LOCKED') return 'This account is temporarily locked.'
    if (error.code === 'ACCOUNT_INACTIVE') return 'This account is not active.'
    if (error.status === 429) return 'Too many attempts. Please try again later.'
    if (error.status === 403) return 'You do not have permission to access this area.'
    if (error.code === 'NETWORK_ERROR') return error.message
  }

  return 'Unable to sign in. Please try again.'
}

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')
  } catch {
    sessionStorage.removeItem(USER_KEY)
    return null
  }
}

function syncProductSession(session) {
  if (!session?.token || !session?.user) return
  window.localStorage.setItem(PRODUCT_TOKEN_KEY, session.token)
  window.localStorage.setItem(PRODUCT_USER_KEY, JSON.stringify(session.user))
  useAuthStore().setSession(session)
}

function cmsUserToProductSession(user, token) {
  if (!user || !token) return null

  return {
    token,
    user: {
      id: user.id,
      username: user.email,
      fullName: user.displayName,
      role: legacyRoleName(user.roles),
    },
  }
}

function legacyRoleName(roles = []) {
  if (roles.includes('system_admin')) return 'System Administrator'
  if (roles.includes('tourism_officer')) return 'Tourism Officer'
  if (roles.includes('tourism_staff') || roles.includes('content_editor')) return 'Tourism Staff'
  return 'LGU Official'
}
