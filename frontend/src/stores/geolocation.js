import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'calitoursys_geolocation'

/**
 * Lifecycle of the visitor's browser geolocation:
 * - idle: nothing requested yet
 * - prompting: waiting for the user to answer the permission prompt
 * - locating: permission granted, fix in progress
 * - ready: we have coordinates
 * - denied: user refused the permission prompt
 * - unavailable: position could not be determined (timeout / no signal)
 * - unsupported: browser has no Geolocation API
 */
export const GEO_STATUS = Object.freeze({
  IDLE: 'idle',
  PROMPTING: 'prompting',
  LOCATING: 'locating',
  READY: 'ready',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  UNSUPPORTED: 'unsupported',
})

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 60000,
}

function readCachedCoords() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.latitude !== 'number' || typeof parsed?.longitude !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function messageForError(error) {
  if (error?.code === error?.PERMISSION_DENIED) {
    return 'Location access was blocked. Enable it in your browser to see nearby suggestions.'
  }
  if (error?.code === error?.POSITION_UNAVAILABLE) {
    return 'We could not determine your location right now. Please try again.'
  }
  if (error?.code === error?.TIMEOUT) {
    return 'Finding your location took too long. Please try again.'
  }
  return 'Something went wrong while accessing your location.'
}

export const useGeolocationStore = defineStore('geolocation', () => {
  const cached = readCachedCoords()

  const coords = ref(cached)
  const accuracy = ref(cached?.accuracy ?? null)
  const updatedAt = ref(cached?.updatedAt ?? null)
  const status = ref(cached ? GEO_STATUS.READY : GEO_STATUS.IDLE)
  const error = ref('')

  let watchId = null

  const hasLocation = computed(() => Boolean(coords.value))
  const isLocating = computed(
    () => status.value === GEO_STATUS.PROMPTING || status.value === GEO_STATUS.LOCATING,
  )
  const isDenied = computed(() => status.value === GEO_STATUS.DENIED)
  const isSupported = computed(() => typeof navigator !== 'undefined' && 'geolocation' in navigator)

  function persist() {
    try {
      if (!coords.value) {
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          latitude: coords.value.latitude,
          longitude: coords.value.longitude,
          accuracy: accuracy.value,
          updatedAt: updatedAt.value,
        }),
      )
    } catch {
      // Storage may be unavailable (private mode); coordinates still live in memory.
    }
  }

  function applyPosition(position) {
    coords.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
    accuracy.value = position.coords.accuracy ?? null
    updatedAt.value = new Date().toISOString()
    status.value = GEO_STATUS.READY
    error.value = ''
    persist()
  }

  function applyError(geoError) {
    if (geoError?.code === geoError?.PERMISSION_DENIED) {
      status.value = GEO_STATUS.DENIED
    } else {
      status.value = GEO_STATUS.UNAVAILABLE
    }
    error.value = messageForError(geoError)
  }

  /**
   * Request a one-shot position fix. Resolves with the coordinates or null on failure;
   * never rejects, so callers can await it without wrapping in try/catch.
   */
  function requestLocation(options = {}) {
    if (!isSupported.value) {
      status.value = GEO_STATUS.UNSUPPORTED
      error.value = 'Your browser does not support location services.'
      return Promise.resolve(null)
    }

    status.value = GEO_STATUS.PROMPTING
    error.value = ''

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          applyPosition(position)
          resolve(coords.value)
        },
        (geoError) => {
          applyError(geoError)
          resolve(null)
        },
        { ...DEFAULT_OPTIONS, ...options },
      )
    })
  }

  /**
   * Continuously track the visitor's location in real time. Safe to call more than
   * once; a previous watcher is cleared first.
   */
  function startWatching(options = {}) {
    if (!isSupported.value) {
      status.value = GEO_STATUS.UNSUPPORTED
      error.value = 'Your browser does not support location services.'
      return
    }

    stopWatching()
    if (status.value !== GEO_STATUS.READY) status.value = GEO_STATUS.PROMPTING

    watchId = navigator.geolocation.watchPosition(applyPosition, applyError, {
      ...DEFAULT_OPTIONS,
      ...options,
    })
  }

  function stopWatching() {
    if (watchId !== null && isSupported.value) {
      navigator.geolocation.clearWatch(watchId)
    }
    watchId = null
  }

  function clear() {
    stopWatching()
    coords.value = null
    accuracy.value = null
    updatedAt.value = null
    status.value = GEO_STATUS.IDLE
    error.value = ''
    persist()
  }

  return {
    coords,
    accuracy,
    updatedAt,
    status,
    error,
    hasLocation,
    isLocating,
    isDenied,
    isSupported,
    requestLocation,
    startWatching,
    stopWatching,
    clear,
  }
})
