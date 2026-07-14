import { computed } from 'vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'

/**
 * Compatibility facade used by reviews and itinerary components. Tourist auth
 * now has one source of truth: the Pinia store and its persisted token/user.
 */
export function useVisitorSession() {
  const auth = useTouristAuthStore()
  const session = computed(() => auth.tourist)
  const isAuthenticated = computed(() => auth.isAuthenticated)
  const visitorName = computed(
    () => auth.tourist?.fullName || auth.tourist?.email || 'Guest',
  )
  const visitorEmail = computed(() => auth.tourist?.email || '')

  return {
    session,
    isAuthenticated,
    visitorName,
    visitorEmail,
    sync: () => auth.fetchMe(),
    signOut: () => auth.logout(),
  }
}
