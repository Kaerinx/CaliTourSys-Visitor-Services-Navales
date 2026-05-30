<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const CALABANGA_CENTER = [123.2469, 13.7069]
const DEFAULT_ZOOM = 12
const SELECTED_ZOOM = 13

const props = defineProps({
  accessToken: { type: String, default: '' },
  latitude: { type: [String, Number], default: '' },
  longitude: { type: [String, Number], default: '' },
})

const emit = defineEmits(['select'])

const mapContainer = ref(null)
const mapLoadError = ref('')
const mapReady = ref(false)

let map = null
let marker = null
let resizeObserver = null

const hasToken = computed(() => Boolean(props.accessToken))
const hasValidTokenFormat = computed(() => !props.accessToken || props.accessToken.startsWith('pk.'))
const hasUsableToken = computed(() => hasToken.value && hasValidTokenFormat.value)
const selectedCoordinates = computed(() => {
  const latitude = Number(props.latitude)
  const longitude = Number(props.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude === 0 || longitude === 0) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return [longitude, latitude]
})

function emitSelected(lngLat) {
  emit('select', {
    latitude: Number(lngLat.lat).toFixed(6),
    longitude: Number(lngLat.lng).toFixed(6),
  })
}

function syncMarker() {
  if (!map || !mapReady.value) return

  const coordinates = selectedCoordinates.value
  if (!coordinates) {
    marker?.remove()
    marker = null
    return
  }

  if (!marker) {
    marker = new mapboxgl.Marker({ color: '#0f766e' }).setLngLat(coordinates).addTo(map)
  } else {
    marker.setLngLat(coordinates)
  }

  map.easeTo({ center: coordinates, zoom: Math.max(map.getZoom(), SELECTED_ZOOM), duration: 250 })
}

async function initializeMap() {
  if (!hasUsableToken.value || !mapContainer.value || map) return

  try {
    mapboxgl.accessToken = props.accessToken
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: selectedCoordinates.value || CALABANGA_CENTER,
      zoom: selectedCoordinates.value ? SELECTED_ZOOM : DEFAULT_ZOOM,
      attributionControl: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      mapReady.value = true
      map.resize()
      syncMarker()
    })
    map.on('click', (event) => emitSelected(event.lngLat))
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
    mapLoadError.value = 'Map picker is temporarily unavailable.'
  }
}

watch(selectedCoordinates, syncMarker)

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
  resizeObserver?.disconnect()
  marker?.remove()
  map?.remove()
  map = null
})
</script>

<template>
  <section class="cms-map-picker" aria-label="Pick map coordinates">
    <div v-show="hasUsableToken && !mapLoadError" ref="mapContainer" class="cms-map-picker__canvas"></div>

    <div v-if="!hasToken" class="cms-map-picker__state">
      <strong>Map picker unavailable</strong>
      <span>Add VITE_MAPBOX_PUBLIC_TOKEN to enable click-to-pick coordinates. Manual entry is still available.</span>
    </div>

    <div v-else-if="!hasValidTokenFormat" class="cms-map-picker__state">
      <strong>Map picker unavailable</strong>
      <span>VITE_MAPBOX_PUBLIC_TOKEN must be a public Mapbox token that starts with pk.</span>
    </div>

    <div v-else-if="mapLoadError" class="cms-map-picker__state">
      <strong>Map picker unavailable</strong>
      <span>{{ mapLoadError }}</span>
    </div>
  </section>
</template>

<style scoped>
.cms-map-picker {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #e2e8f0;
}

.cms-map-picker__canvas {
  position: absolute;
  inset: 0;
}

.cms-map-picker__state {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  color: #475569;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  text-align: center;
}

.cms-map-picker__state strong {
  color: #0f172a;
}

.cms-map-picker__state span {
  max-width: 420px;
  font-size: 0.86rem;
  line-height: 1.5;
}

:deep(.mapboxgl-ctrl-group) {
  overflow: hidden;
  border-radius: 8px;
}

@media (max-width: 520px) {
  .cms-map-picker {
    min-height: 230px;
  }
}
</style>
