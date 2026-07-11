import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { request } from '@/services/http'

const tokenKey = 'calitoursys_token'
const userKey = 'calitoursys_user'

export const USER_ROLES = Object.freeze({
  TOURISM_STAFF: 'Tourism Staff',
  TOURISM_OFFICER: 'Tourism Officer',
  LGU_OFFICIAL: 'LGU Official',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
})

export const useAuthStore = defineStore('auth', () => {
  const token = ref(window.localStorage.getItem(tokenKey))
  const user = ref(JSON.parse(window.localStorage.getItem(userKey) || 'null'))
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const isViewOnly = computed(() => user.value?.role === USER_ROLES.LGU_OFFICIAL)

  function setSession(session) {
    token.value = session.token
    user.value = session.user
    window.localStorage.setItem(tokenKey, session.token)
    window.localStorage.setItem(userKey, JSON.stringify(session.user))
  }

  async function login(credentials) {
    loading.value = true
    error.value = ''

    try {
      const session = await request('/auth/login', {
        method: 'POST',
        body: credentials,
      })
      setSession(session)
      return session
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    window.localStorage.removeItem(tokenKey)
    window.localStorage.removeItem(userKey)
  }

  return {
    error,
    isAuthenticated,
    isViewOnly,
    loading,
    login,
    logout,
    setSession,
    token,
    user,
  }
})
