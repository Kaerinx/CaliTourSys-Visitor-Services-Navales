import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Reactive access to the public (guest-facing) visitor session.
 *
 * The session is written by PublicAuthModal into localStorage under
 * `calitoursys_public_visitor` and broadcast via the
 * `calitoursys:visitor-authenticated` custom event. This composable centralises
 * the previously duplicated `hasVisitorSession()` checks scattered across the
 * promotion views so gated features (reviews, itinerary) share one source.
 */

const VISITOR_SESSION_KEY = 'calitoursys_public_visitor'
const AUTH_EVENT = 'calitoursys:visitor-authenticated'
const LOGOUT_EVENT = 'calitoursys:visitor-signed-out'

function readSession() {
  try {
    const raw = window.localStorage.getItem(VISITOR_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearVisitorSession() {
  window.localStorage.removeItem(VISITOR_SESSION_KEY)
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT))
}

export function useVisitorSession() {
  const session = ref(readSession())

  const isAuthenticated = computed(() => Boolean(session.value))
  const visitorName = computed(() => session.value?.name || session.value?.email || 'Guest')
  const visitorEmail = computed(() => session.value?.email || '')

  function sync() {
    session.value = readSession()
  }

  function handleStorage(event) {
    if (!event || event.key === VISITOR_SESSION_KEY) sync()
  }

  onMounted(() => {
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener(LOGOUT_EVENT, sync)
    window.addEventListener('storage', handleStorage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(AUTH_EVENT, sync)
    window.removeEventListener(LOGOUT_EVENT, sync)
    window.removeEventListener('storage', handleStorage)
  })

  return {
    session,
    isAuthenticated,
    visitorName,
    visitorEmail,
    sync,
    signOut: clearVisitorSession,
  }
}
