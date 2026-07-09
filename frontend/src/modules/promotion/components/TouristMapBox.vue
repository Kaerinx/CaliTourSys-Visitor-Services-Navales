<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const DEFAULT_CENTER = [123.2469, 13.7069]
const CLUSTER_THRESHOLD = 60
const CLUSTER_SOURCE_ID = 'tourist-public-locations'
const CLUSTER_LAYER_ID = 'tourist-public-clusters'
const CLUSTER_COUNT_LAYER_ID = 'tourist-public-cluster-count'
const UNCLUSTERED_LAYER_ID = 'tourist-public-unclustered'
const SELECTED_LAYER_ID = 'tourist-public-selected'
const ROUTE_SOURCE_ID = 'tourist-route'
const ROUTE_CASING_LAYER_ID = 'tourist-route-casing'
const ROUTE_LINE_LAYER_ID = 'tourist-route-line'
const ORIGIN_SOURCE_ID = 'tourist-route-origin'
const ORIGIN_LAYER_ID = 'tourist-route-origin-dot'

const emptyFeatureCollection = () => ({ type: 'FeatureCollection', features: [] })

const props = defineProps({
  accessToken: {
    type: String,
    default: '',
  },
  featureCollection: {
    type: Object,
    default: () => ({ type: 'FeatureCollection', features: [] }),
  },
  selectedId: {
    type: String,
    default: '',
  },
  // Optional route to draw: { geometry: <GeoJSON LineString> } (or a LineString
  // directly). Null clears any drawn route.
  route: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  emptyTitle: {
    type: String,
    default: 'No map locations yet',
  },
  emptyText: {
    type: String,
    default: 'Published map-ready locations will appear here.',
  },
})

const emit = defineEmits(['select', 'map-error', 'request-details'])

const mapContainer = ref(null)
const mapLoadError = ref('')
const mapLoadWarning = ref('')
const mapReady = ref(false)

let map = null
let activePopup = null
let resizeObserver = null
const markers = new Map()
let clusterLayersReady = false

const features = computed(() =>
  Array.isArray(props.featureCollection?.features) ? props.featureCollection.features : [],
)

const hasToken = computed(() => Boolean(props.accessToken))
const hasValidTokenFormat = computed(
  () => !props.accessToken || props.accessToken.startsWith('pk.'),
)
const hasUsableToken = computed(() => hasToken.value && hasValidTokenFormat.value)
const canRenderMap = computed(() => hasUsableToken.value && !mapLoadError.value)

function featureId(feature) {
  return String(feature?.properties?.slug || feature?.properties?.id || '')
}

function featureCoordinates(feature) {
  const coordinates = feature?.geometry?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null

  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude]
}

function validFeatures() {
  return features.value.filter((feature) => featureId(feature) && featureCoordinates(feature))
}

function markerClassFor(type) {
  return `tourist-map-marker tourist-map-marker--${type || 'location'}`
}

function createPopupContent(feature) {
  const properties = feature.properties || {}
  const wrapper = document.createElement('article')
  wrapper.className = 'tourist-map-popup'

  if (properties.primaryImage) {
    const image = document.createElement('img')
    image.src = properties.primaryImage
    image.alt = properties.label || 'Tourism location'
    wrapper.appendChild(image)
  }

  const body = document.createElement('div')
  body.className = 'tourist-map-popup__body'

  const heading = document.createElement('h3')
  heading.textContent = properties.label || 'Tourism location'
  body.appendChild(heading)

  const meta = document.createElement('p')
  meta.textContent = [properties.category, properties.locationType].filter(Boolean).join(' - ')
  body.appendChild(meta)

  if (properties.description) {
    const description = document.createElement('p')
    description.textContent = properties.description
    body.appendChild(description)
  }

  const detailsButton = document.createElement('button')
  detailsButton.type = 'button'
  detailsButton.textContent = 'View details'
  detailsButton.addEventListener('click', () => emit('request-details', featureId(feature)))
  body.appendChild(detailsButton)

  wrapper.appendChild(body)

  return wrapper
}

function openPopup(feature) {
  if (!map) return

  const coordinates = featureCoordinates(feature)
  if (!coordinates) return

  activePopup?.remove()
  activePopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false,
    maxWidth: '340px',
    offset: 24,
  })
    .setLngLat(coordinates)
    .setDOMContent(createPopupContent(feature))
    .addTo(map)
}

function flyToFeature(feature) {
  if (!map) return

  const coordinates = featureCoordinates(feature)
  if (!coordinates) return

  map.flyTo({
    center: coordinates,
    zoom: Math.max(map.getZoom(), 13),
    essential: true,
  })
}

function selectFeature(feature, shouldEmit = true) {
  const id = featureId(feature)
  if (!id) return

  markers.forEach(({ element }, markerId) => {
    element.classList.toggle('tourist-map-marker--selected', markerId === id)
  })
  if (map?.getLayer(SELECTED_LAYER_ID)) {
    map.setFilter(SELECTED_LAYER_ID, [
      '==',
      ['to-string', ['coalesce', ['get', 'slug'], ['get', 'id']]],
      id,
    ])
  }

  flyToFeature(feature)
  openPopup(feature)

  if (shouldEmit) emit('select', id)
}

function fitToFeatures() {
  if (!map) return

  const mappedFeatures = validFeatures()
  if (mappedFeatures.length === 0) {
    map.setCenter(DEFAULT_CENTER)
    map.setZoom(11)
    return
  }

  if (mappedFeatures.length === 1) {
    const coordinates = featureCoordinates(mappedFeatures[0])
    map.setCenter(coordinates)
    map.setZoom(13)
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  mappedFeatures.forEach((feature) => bounds.extend(featureCoordinates(feature)))

  map.fitBounds(bounds, {
    padding: 72,
    maxZoom: 14,
    duration: 0,
  })
}

function clearMarkers() {
  markers.forEach(({ marker }) => marker.remove())
  markers.clear()
}

function ensureClusterLayers() {
  if (!map || clusterLayersReady) return

  map.addSource(CLUSTER_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 48,
  })

  map.addLayer({
    id: CLUSTER_LAYER_ID,
    type: 'circle',
    source: CLUSTER_SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#1b4332',
      'circle-radius': ['step', ['get', 'point_count'], 20, 25, 26, 75, 34],
      'circle-opacity': 0.92,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  })

  map.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: CLUSTER_SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 13,
    },
    paint: {
      'text-color': '#ffffff',
    },
  })

  map.addLayer({
    id: UNCLUSTERED_LAYER_ID,
    type: 'circle',
    source: CLUSTER_SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['coalesce', ['get', 'markerColor'], '#1b4332'],
      'circle-radius': 8,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  })

  map.addLayer({
    id: SELECTED_LAYER_ID,
    type: 'circle',
    source: CLUSTER_SOURCE_ID,
    filter: [
      '==',
      ['to-string', ['coalesce', ['get', 'slug'], ['get', 'id']]],
      props.selectedId || '',
    ],
    paint: {
      'circle-color': '#b5451b',
      'circle-radius': 13,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  })

  map.on('click', CLUSTER_LAYER_ID, (event) => {
    const featuresAtPoint = map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER_ID] })
    const clusterId = featuresAtPoint[0]?.properties?.cluster_id
    const source = map.getSource(CLUSTER_SOURCE_ID)
    if (clusterId === undefined || !source) return

    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error) return
      map.easeTo({ center: featuresAtPoint[0].geometry.coordinates, zoom })
    })
  })

  map.on('click', UNCLUSTERED_LAYER_ID, (event) => {
    const feature = event.features?.[0]
    if (feature) selectFeature(feature)
  })

  map.on('mouseenter', CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = ''
  })
  map.on('mouseenter', UNCLUSTERED_LAYER_ID, (event) => {
    map.getCanvas().style.cursor = 'pointer'
    const feature = event.features?.[0]
    if (feature) openPopup(feature)
  })
  map.on('mouseleave', UNCLUSTERED_LAYER_ID, () => {
    map.getCanvas().style.cursor = ''
  })

  clusterLayersReady = true
}

function setClusterVisibility(visible) {
  if (!map || !clusterLayersReady) return
  const visibility = visible ? 'visible' : 'none'
  ;[CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID, UNCLUSTERED_LAYER_ID, SELECTED_LAYER_ID].forEach(
    (layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visibility)
    },
  )
}

function syncClusterSource(mappedFeatures) {
  ensureClusterLayers()
  const source = map?.getSource(CLUSTER_SOURCE_ID)
  if (!source) return
  source.setData({ type: 'FeatureCollection', features: mappedFeatures })
  setClusterVisibility(true)
}

function syncMarkers() {
  if (!map || !mapReady.value) return

  const mappedFeatures = validFeatures()

  if (mappedFeatures.length >= CLUSTER_THRESHOLD) {
    clearMarkers()
    syncClusterSource(mappedFeatures)
    fitToFeatures()

    const selectedFeature = mappedFeatures.find(
      (feature) => featureId(feature) === props.selectedId,
    )
    if (selectedFeature) selectFeature(selectedFeature, false)
    return
  }

  setClusterVisibility(false)
  clearMarkers()

  mappedFeatures.forEach((feature) => {
    const id = featureId(feature)
    const properties = feature.properties || {}
    const coordinates = featureCoordinates(feature)
    const element = document.createElement('button')

    element.type = 'button'
    element.className = markerClassFor(properties.locationType)
    element.style.setProperty('--marker-color', properties.markerColor || '#1b4332')
    element.setAttribute('aria-label', properties.label || 'Select tourism location')
    element.addEventListener('click', () => selectFeature(feature))
    element.addEventListener('mouseenter', () => openPopup(feature))
    element.addEventListener('focus', () => openPopup(feature))
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectFeature(feature)
      }
    })

    const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
      .setLngLat(coordinates)
      .addTo(map)
    markers.set(id, { marker, element, feature })
  })

  fitToFeatures()

  const selectedFeature = mappedFeatures.find((feature) => featureId(feature) === props.selectedId)
  if (selectedFeature) selectFeature(selectedFeature, false)
}

let routeLayersReady = false

function ensureRouteLayers() {
  if (!map || routeLayersReady) return

  map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: emptyFeatureCollection() })
  map.addSource(ORIGIN_SOURCE_ID, { type: 'geojson', data: emptyFeatureCollection() })

  // White casing beneath the coloured line for contrast over any basemap.
  map.addLayer({
    id: ROUTE_CASING_LAYER_ID,
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.9 },
  })

  map.addLayer({
    id: ROUTE_LINE_LAYER_ID,
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#1b4332', 'line-width': 5 },
  })

  // "You are here" origin dot at the start of the route.
  map.addLayer({
    id: ORIGIN_LAYER_ID,
    type: 'circle',
    source: ORIGIN_SOURCE_ID,
    paint: {
      'circle-color': '#b5451b',
      'circle-radius': 7,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  })

  routeLayersReady = true
}

function routeCoordinates() {
  const geometry = props.route?.geometry || props.route
  const coordinates = geometry?.coordinates
  return Array.isArray(coordinates) && coordinates.length >= 2 ? coordinates : null
}

function syncRoute() {
  if (!map || !mapReady.value) return
  ensureRouteLayers()

  const routeSource = map.getSource(ROUTE_SOURCE_ID)
  const originSource = map.getSource(ORIGIN_SOURCE_ID)
  if (!routeSource || !originSource) return

  const coordinates = routeCoordinates()

  if (!coordinates) {
    routeSource.setData(emptyFeatureCollection())
    originSource.setData(emptyFeatureCollection())
    return
  }

  routeSource.setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: {},
  })
  originSource.setData({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: coordinates[0] },
    properties: {},
  })

  const bounds = new mapboxgl.LngLatBounds()
  coordinates.forEach((coordinate) => bounds.extend(coordinate))
  map.fitBounds(bounds, {
    padding: { top: 90, right: 60, bottom: 90, left: 60 },
    maxZoom: 15,
    duration: 600,
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
    map.on('load', () => {
      mapReady.value = true
      map.resize()
      ensureRouteLayers()
      syncMarkers()
      syncRoute()
    })
    map.on('error', (event) => {
      const status = event?.error?.status
      const message = String(event?.error?.message || '')
      const tokenRelated =
        message.toLowerCase().includes('token') || status === 401 || status === 403

      if (!mapReady.value && tokenRelated) {
        mapLoadError.value =
          'Mapbox rejected the public token. Please check VITE_MAPBOX_PUBLIC_TOKEN.'
        emit('map-error', mapLoadError.value)
        return
      }

      if (!mapReady.value) {
        mapLoadWarning.value = 'Some map resources are still loading or temporarily unavailable.'
        emit('map-error', mapLoadWarning.value)
      }
    })

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => map?.resize())
      resizeObserver.observe(mapContainer.value)
    }
  } catch {
    mapLoadError.value = 'Map is temporarily unavailable.'
    emit('map-error', mapLoadError.value)
  }
}

watch(
  () => props.accessToken,
  async () => {
    if (map || !props.accessToken) return
    await nextTick()
    initializeMap()
  },
)

watch(features, () => syncMarkers(), { deep: true })

watch(
  () => props.selectedId,
  (id) => {
    if (!id || !mapReady.value) return

    const selectedMarker = markers.get(id)
    if (selectedMarker) selectFeature(selectedMarker.feature, false)
  },
)

watch(() => props.route, syncRoute, { deep: true })

onMounted(initializeMap)

onBeforeUnmount(() => {
  activePopup?.remove()
  resizeObserver?.disconnect()
  clearMarkers()
  map?.remove()
  map = null
  clusterLayersReady = false
  routeLayersReady = false
})
</script>

<template>
  <div class="tourist-mapbox">
    <div v-show="canRenderMap" ref="mapContainer" class="tourist-mapbox__canvas"></div>

    <div v-if="!hasToken" class="tourist-mapbox__state">
      <strong>Map unavailable</strong>
      <span
        >Add VITE_MAPBOX_PUBLIC_TOKEN to the frontend environment to enable the interactive
        map.</span
      >
    </div>

    <div v-else-if="!hasValidTokenFormat" class="tourist-mapbox__state">
      <strong>Map unavailable</strong>
      <span>VITE_MAPBOX_PUBLIC_TOKEN must be a public Mapbox token that starts with pk.</span>
    </div>

    <div v-else-if="mapLoadError" class="tourist-mapbox__state">
      <strong>Map unavailable</strong>
      <span>{{ mapLoadError }}</span>
    </div>

    <div v-else-if="mapLoadWarning" class="tourist-mapbox__state tourist-mapbox__state--floating">
      <strong>Map warning</strong>
      <span>{{ mapLoadWarning }}</span>
    </div>

    <div v-else-if="loading" class="tourist-mapbox__state tourist-mapbox__state--floating">
      <strong>Loading map locations...</strong>
    </div>

    <div v-else-if="error" class="tourist-mapbox__state tourist-mapbox__state--floating">
      <strong>Unable to load locations</strong>
      <span>{{ error }}</span>
    </div>

    <div
      v-else-if="features.length === 0"
      class="tourist-mapbox__state tourist-mapbox__state--floating tourist-mapbox__state--empty"
    >
      <strong>{{ emptyTitle }}</strong>
      <span>{{ emptyText }}</span>
    </div>
  </div>
</template>

<style scoped>
.tourist-mapbox {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #e8e3da;
}

.tourist-mapbox__canvas {
  position: absolute;
  inset: 0;
}

.tourist-mapbox :global(.mapboxgl-ctrl-top-right) {
  top: 72px;
  right: 16px;
}

.tourist-mapbox :global(.mapboxgl-ctrl-group) {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(27, 67, 50, 0.14);
}

.tourist-mapbox__state {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 32px;
  background:
    radial-gradient(circle at 24% 28%, rgba(216, 243, 220, 0.92), transparent 32%),
    linear-gradient(135deg, #f2f0eb, #e8e4dc);
  color: #5c5c5c;
  text-align: center;
}

.tourist-mapbox__state--floating {
  inset: auto 24px 24px auto;
  max-width: 320px;
  display: grid;
  place-content: initial;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(27, 67, 50, 0.14);
  text-align: left;
}

.tourist-mapbox__state--empty {
  right: 16px;
  bottom: 16px;
  max-width: min(300px, calc(100% - 32px));
  padding: 14px 16px;
}

.tourist-mapbox__state strong {
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 16px;
}

.tourist-mapbox__state span {
  font-size: 13px;
  line-height: 1.5;
}

:global(.tourist-map-marker) {
  width: 32px;
  height: 42px;
  border: 0;
  background: transparent;
  cursor: pointer;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.28));
}

:global(.tourist-map-marker::before) {
  position: absolute;
  inset: 0;
  background: var(--marker-color, #1b4332);
  clip-path: path(
    'M16 0C7.2 0 0 7.1 0 15.9 0 26.7 16 42 16 42s16-15.3 16-26.1C32 7.1 24.8 0 16 0Z'
  );
  content: '';
}

:global(.tourist-map-marker::after) {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #ffffff;
  content: '';
}

:global(.tourist-map-marker--event::after) {
  border-radius: 3px;
}

:global(.tourist-map-marker--business::after) {
  width: 14px;
  height: 10px;
  border-radius: 2px;
}

:global(.tourist-map-marker--selected) {
  transform: scale(1.24);
}

:global(.tourist-map-marker:focus-visible) {
  outline: 3px solid rgba(27, 67, 50, 0.28);
  outline-offset: 4px;
}

:global(.tourist-map-popup) {
  overflow: hidden;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

:global(.mapboxgl-popup-content) {
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 16px 42px rgba(27, 67, 50, 0.2);
}

:global(.mapboxgl-popup-close-button) {
  width: 28px;
  height: 28px;
  margin: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #1a1a1a;
  font-size: 18px;
  line-height: 1;
}

:global(.tourist-map-popup img) {
  width: 100%;
  height: 132px;
  display: block;
  object-fit: cover;
}

:global(.tourist-map-popup__body) {
  display: grid;
  gap: 10px;
  padding: 16px;
}

:global(.tourist-map-popup h3) {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 18px;
  line-height: 1.25;
}

:global(.tourist-map-popup p) {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.5;
}

:global(.tourist-map-popup button) {
  justify-self: start;
  min-height: 36px;
  margin-top: 2px;
  padding: 0 14px;
  border: 1px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
</style>
