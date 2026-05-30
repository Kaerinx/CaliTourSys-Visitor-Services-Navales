<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const DEFAULT_CENTER = [123.2469, 13.7069]

const props = defineProps({
  accessToken: { type: String, default: '' },
  locations: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  canCreate: { type: Boolean, default: false },
})

const emit = defineEmits(['create-at'])

const mapContainer = ref(null)
const mapLoadError = ref('')
const mapReady = ref(false)

let map = null
let activePopup = null
let resizeObserver = null
const markers = new Map()

const hasToken = computed(() => Boolean(props.accessToken))
const hasValidTokenFormat = computed(() => !props.accessToken || props.accessToken.startsWith('pk.'))
const hasUsableToken = computed(() => hasToken.value && hasValidTokenFormat.value)
const publishedLocations = computed(() =>
  props.locations.filter((location) => {
    const latitude = Number(location.latitude)
    const longitude = Number(location.longitude)
    return location.status === 'published' && Number.isFinite(latitude) && Number.isFinite(longitude)
  }),
)

function coordinatesFor(location) {
  return [Number(location.longitude), Number(location.latitude)]
}

function createPopupContent(location) {
  const wrapper = document.createElement('article')
  wrapper.className = 'cms-map-popup'

  const title = document.createElement('strong')
  title.textContent = location.label || 'Map location'
  wrapper.appendChild(title)

  const type = document.createElement('span')
  type.textContent = [location.locationType, location.status].filter(Boolean).join(' / ')
  wrapper.appendChild(type)

  const coordinates = document.createElement('small')
  coordinates.textContent = `${location.latitude}, ${location.longitude}`
  wrapper.appendChild(coordinates)

  return wrapper
}

function fitToLocations() {
  if (!map) return

  if (publishedLocations.value.length === 0) {
    map.setCenter(DEFAULT_CENTER)
    map.setZoom(11)
    return
  }

  if (publishedLocations.value.length === 1) {
    map.setCenter(coordinatesFor(publishedLocations.value[0]))
    map.setZoom(13)
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  publishedLocations.value.forEach((location) => bounds.extend(coordinatesFor(location)))
  map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 0 })
}

function clearMarkers() {
  markers.forEach((marker) => marker.remove())
  markers.clear()
}

function syncMarkers() {
  if (!map || !mapReady.value) return

  clearMarkers()
  publishedLocations.value.forEach((location) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'cms-map-location-marker'
    element.style.setProperty('--marker-color', location.markerColor || '#0f766e')
    element.setAttribute('aria-label', location.label || 'Map location')

    const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
      .setLngLat(coordinatesFor(location))
      .addTo(map)

    element.addEventListener('click', (event) => {
      event.stopPropagation()
      activePopup?.remove()
      activePopup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, offset: 22, maxWidth: '260px' })
        .setLngLat(coordinatesFor(location))
        .setDOMContent(createPopupContent(location))
        .addTo(map)
    })

    markers.set(location.id, marker)
  })

  fitToLocations()
}

function requestCreateAt(lngLat) {
  if (!props.canCreate) return
  emit('create-at', {
    latitude: Number(lngLat.lat).toFixed(6),
    longitude: Number(lngLat.lng).toFixed(6),
  })
}

async function initializeMap() {
  if (!hasUsableToken.value || !mapContainer.value || map) return

  try {
    mapboxgl.accessToken = props.accessToken
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: 11,
      attributionControl: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('click', (event) => requestCreateAt(event.lngLat))
    map.on('load', () => {
      mapReady.value = true
      map.resize()
      syncMarkers()
    })
    map.on('error', (event) => {
      const status = event?.error?.status
      const message = String(event?.error?.message || '')
      if (!mapReady.value && (status === 401 || status === 403 || message.toLowerCase().includes('token'))) {
        mapLoadError.value = 'Mapbox rejected the public token. Please check VITE_MAPBOX_PUBLIC_TOKEN.'
      }
    })

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => map?.resize())
      resizeObserver.observe(mapContainer.value)
    }
  } catch {
    mapLoadError.value = 'Map view is temporarily unavailable.'
  }
}

watch(
  () => props.locations,
  () => syncMarkers(),
  { deep: true },
)

watch(
  () => props.accessToken,
  async () => {
    if (map || !props.accessToken) return
    await nextTick()
    initializeMap()
  },
)

onMounted(initializeMap)

onBeforeUnmount(() => {
  activePopup?.remove()
  resizeObserver?.disconnect()
  clearMarkers()
  map?.remove()
  map = null
})
</script>

<template>
  <section class="cms-map-view" aria-label="Published map locations">
    <div v-show="hasUsableToken && !mapLoadError" ref="mapContainer" class="cms-map-view__canvas" :class="{ 'cms-map-view__canvas--create': canCreate }"></div>

    <div v-if="!hasToken" class="cms-map-view__state">
      <strong>Map view unavailable</strong>
      <span>Add VITE_MAPBOX_PUBLIC_TOKEN to show published pins visually.</span>
    </div>

    <div v-else-if="!hasValidTokenFormat" class="cms-map-view__state">
      <strong>Map view unavailable</strong>
      <span>VITE_MAPBOX_PUBLIC_TOKEN must be a public Mapbox token that starts with pk.</span>
    </div>

    <div v-else-if="mapLoadError" class="cms-map-view__state">
      <strong>Map view unavailable</strong>
      <span>{{ mapLoadError }}</span>
    </div>

    <div v-else-if="loading" class="cms-map-view__state cms-map-view__state--floating">
      <strong>Loading published pins...</strong>
    </div>

    <div v-else-if="error" class="cms-map-view__state cms-map-view__state--floating">
      <strong>Unable to load pins</strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="publishedLocations.length === 0" class="cms-map-view__state cms-map-view__state--floating">
      <strong>No published pins yet</strong>
      <span>Published map locations will appear here.</span>
    </div>
  </section>
</template>

<style scoped>
.cms-map-view {
  position: relative;
  min-height: 560px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #e2e8f0;
}

.cms-map-view__canvas {
  position: absolute;
  inset: 0;
}

.cms-map-view__canvas--create {
  cursor: crosshair;
}

.cms-map-view__state {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 32px;
  color: #475569;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  text-align: center;
}

.cms-map-view__state--floating {
  inset: auto 20px 20px auto;
  max-width: min(340px, calc(100% - 40px));
  place-content: initial;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16);
  text-align: left;
}

.cms-map-view__state strong {
  color: #0f172a;
}

.cms-map-view__state span {
  font-size: 0.86rem;
  line-height: 1.5;
}

:global(.cms-map-location-marker) {
  width: 30px;
  height: 40px;
  border: 0;
  background: transparent;
  cursor: pointer;
  filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.26));
}

:global(.cms-map-location-marker::before) {
  position: absolute;
  inset: 0;
  background: var(--marker-color, #0f766e);
  clip-path: path('M15 0C6.7 0 0 6.7 0 15c0 10.2 15 25 15 25s15-14.8 15-25C30 6.7 23.3 0 15 0Z');
  content: '';
}

:global(.cms-map-location-marker::after) {
  position: absolute;
  top: 9px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #fff;
  content: '';
}

:global(.cms-map-location-marker:focus-visible) {
  outline: 3px solid rgba(14, 165, 233, 0.28);
  outline-offset: 4px;
}

:global(.cms-map-popup) {
  display: grid;
  gap: 5px;
  color: #334155;
  font-family: Inter, system-ui, sans-serif;
}

:global(.cms-map-popup strong) {
  color: #0f172a;
  font-size: 0.92rem;
}

:global(.cms-map-popup span),
:global(.cms-map-popup small) {
  color: #64748b;
  font-size: 0.78rem;
}

@media (max-width: 720px) {
  .cms-map-view {
    min-height: 420px;
  }
}
</style>
