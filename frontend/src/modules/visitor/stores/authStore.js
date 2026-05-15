import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { visitorApi } from '../services/visitorApi'

const TOKEN_KEY = 'calitoursys_token'
const USER_KEY = 'calitoursys_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function normalizeLoginResponse(response) {
  const data = response?.data || response || {}
  return {
    token: data.token || data.accessToken || data.access_token || '',
    user: data.user || data.account || data,
  }
}

function dashboardForRole(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'receptionist') return '/receptionist/dashboard'
  return '/tourism/dashboard'
}

export const useAuthStore = defineStore('visitor-auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(readStoredUser())

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const dashboardRoute = computed(() => dashboardForRole(user.value?.role))

  function setSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  async function login(credentials) {
    const response = await visitorApi.login(credentials)
    const result = normalizeLoginResponse(response)

    if (!result.user || !result.user.role) {
      throw new Error('Login succeeded, but no user role was returned.')
    }

    if (!result.token) {
      throw new Error('Login succeeded, but no authentication token was returned.')
    }

    setSession(result.token, result.user)
    return result.user
  }

  async function fetchMe() {
    if (!token.value) return null
    const response = await visitorApi.me()
    const data = response?.data || response || {}
    const nextUser = data.user || data
    if (nextUser?.role) {
      setSession(token.value, nextUser)
    }
    return user.value
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isAuthenticated,
    dashboardRoute,
    login,
    fetchMe,
    logout,
  }
})
