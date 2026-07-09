import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as touristAuthApi from '../services/touristAuthApi'

const TOKEN_KEY = 'calitoursys_tourist_access_token'
const USER_KEY = 'calitoursys_tourist_user'

export const useTouristAuthStore = defineStore('touristAuth', () => {
  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || '')
  const tourist = ref(readStoredTourist())
  const isLoading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(accessToken.value && tourist.value))

  function persistSession(session) {
    accessToken.value = session?.accessToken || ''
    tourist.value = session?.tourist || null

    if (accessToken.value) localStorage.setItem(TOKEN_KEY, accessToken.value)
    else localStorage.removeItem(TOKEN_KEY)

    if (tourist.value) localStorage.setItem(USER_KEY, JSON.stringify(tourist.value))
    else localStorage.removeItem(USER_KEY)
  }

  function clearSession() {
    accessToken.value = ''
    tourist.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function register(payload) {
    isLoading.value = true
    error.value = ''
    try {
      const { data } = await touristAuthApi.register(payload)
      persistSession(data)
      return tourist.value
    } catch (err) {
      error.value = friendlyError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(payload) {
    isLoading.value = true
    error.value = ''
    try {
      const { data } = await touristAuthApi.login(payload)
      persistSession(data)
      return tourist.value
    } catch (err) {
      clearSession()
      error.value = friendlyError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return null
    try {
      const { data } = await touristAuthApi.me()
      tourist.value = data
      localStorage.setItem(USER_KEY, JSON.stringify(data))
      return tourist.value
    } catch (err) {
      clearSession()
      throw err
    }
  }

  async function logout() {
    try {
      if (accessToken.value) await touristAuthApi.logout()
    } catch {
      // Local logout still wins when the API is unavailable.
    } finally {
      clearSession()
    }
  }

  return {
    accessToken,
    clearSession,
    error,
    fetchMe,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    tourist,
  }
})

function readStoredTourist() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function friendlyError(error) {
  if (error?.code === 'EMAIL_ALREADY_REGISTERED') return 'An account already exists for this email address.'
  if (error?.code === 'INVALID_CREDENTIALS') return 'Invalid email or password.'
  if (error?.code === 'ACCOUNT_INACTIVE') return 'This account is not active.'
  if (error?.status === 429) return 'Too many attempts. Please try again later.'
  return error?.message || 'Unable to continue. Please try again.'
}
