<script setup>
import AccreditationBadge from '../components/AccreditationBadge.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMapLocationGeoJson,
  getTourismAssets,
  loadItinerary,
  removeFromItinerary,
  saveToItinerary,
  sharePublicItem,
} from '../services/promotionService'
import { formatRouteDistance, formatRouteDuration, getRoute } from '../services/mapboxDirections'
import { useGeolocationStore } from '@/stores/geolocation'

const TouristMapBox = defineAsyncComponent(() => import('../components/TouristMapBox.vue'))
const ReviewsSection = defineAsyncComponent(() => import('../components/ReviewsSection.vue'))
const NearbySuggestions = defineAsyncComponent(() => import('../components/NearbySuggestions.vue'))

const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || ''
const VISITOR_SESSION_KEY = 'calitoursys_public_visitor'
const PENDING_SAVE_KEY = 'calitoursys_pending_destination_save'

const route = useRoute()
const router = useRouter()
const geo = useGeolocationStore()

const routeGeoJson = ref(null)
const isRouting = ref(false)

// Fixed public discovery filter taxonomy. Counts are derived from live data,
// but the set of categories (and their order/colors) is curated here.
const FILTER_CATEGORIES = [
  { key: 'Faith & Religious', color: '#7c3aed' },
  { key: 'Food', color: '#d97706' },
  { key: 'Nature', color: '#1b7a4a' },
  { key: 'Beach', color: '#2563eb' },
  { key: 'Cafe', color: '#92400e' },
]

const locations = ref([])

const categories = computed(() => {
  const knownCategories = new Set(FILTER_CATEGORIES.map((category) => category.key))
  const extraCategories = []

  locations.value.forEach((location) => {
    if (!location.category || knownCategories.has(location.category)) return
    knownCategories.add(location.category)
    extraCategories.push({
      key: location.category,
      color: location.color || '#1b4332',
    })
  })

  return [...FILTER_CATEGORIES, ...extraCategories].map((category) => ({
    ...category,
    count: locations.value.filter((location) => location.category === category.key).length,
  }))
})

const searchQuery = ref('')
const selectedId = ref('')
const enabledCategories = ref({})
const hasFilterInteraction = ref(false)
const showDetail = ref(false)
const mobileListCollapsed = ref(false)
const savedIds = ref(new Set())
const isSaving = ref(false)
const feedbackMessage = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const mapRuntimeError = ref('')
const mapGeoJson = ref({ type: 'FeatureCollection', features: [] })
const isVisitorAuthenticated = ref(hasVisitorSession())

const visibleLocations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return locations.value.filter((location) => {
    const matchesCategory = enabledCategories.value[location.category]
    const matchesQuery =
      !query ||
      [location.name, location.category, location.distance].join(' ').toLowerCase().includes(query)

    return matchesCategory && matchesQuery
  })
})

const hasActiveFilters = computed(() => {
  const allCategoriesChecked = categories.value.every(
    (category) => enabledCategories.value[category.key],
  )
  return Boolean(searchQuery.value.trim()) || !allCategoriesChecked
})

const selectedLocation = computed(
  () =>
    visibleLocations.value.find((location) => location.id === selectedId.value) ||
    visibleLocations.value[0],
)

const selectedCanBeSaved = computed(() => Boolean(selectedLocation.value?.apiId))

const selectedLocationTypeLabel = computed(() =>
  selectedLocation.value?.locationType
    ? selectedLocation.value.locationType.replace('-', ' ')
    : 'map location',
)

const visibleMapGeoJson = computed(() => {
  const visibleIds = new Set(visibleLocations.value.map((location) => location.id))

  return {
    type: 'FeatureCollection',
    features: (mapGeoJson.value.features || []).filter((feature) =>
      visibleIds.has(String(feature.properties?.slug || feature.properties?.id || '')),
    ),
  }
})

function locationFromFeature(feature, index, destinationBySlug) {
  const properties = feature.properties || {}
  const coordinates = feature.geometry?.coordinates || []
  const slug = String(properties.slug || properties.id || `map-location-${index}`)
  const destination = destinationBySlug.get(slug)
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  const color = properties.markerColor || destination?.color || '#1b4332'

  return {
    id: slug,
    apiId: destination?.apiId || null,
    mapLocationId: properties.id,
    slug,
    name: properties.label || destination?.name || 'Tourism location',
    category: properties.category || destination?.category || properties.locationType || 'Tourism',
    color,
    distance: properties.locationType ? properties.locationType.replace('-', ' ') : 'Map-ready',
    address:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : 'Calabanga, Camarines Sur',
    hours: destination?.hours || 'Visiting information to be confirmed',
    description:
      properties.description ||
      destination?.description ||
      'Public map discovery details are being prepared.',
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude,
    longitude,
    locationType: properties.locationType,
    imageUrl: properties.primaryImage || destination?.imageUrl,
    accredited: properties.accredited ?? destination?.accredited ?? true,
  }
}

function locationFromTourismAsset(asset, index) {
  const latitude = Number(asset.latitude)
  const longitude = Number(asset.longitude)

  return {
    id: asset.id,
    apiId: null,
    slug: asset.slug || asset.id,
    name: asset.name,
    category: asset.category || 'Tourism',
    color: asset.color || '#1b4332',
    distance: asset.distance || 'Product Development asset',
    address: asset.address || 'Calabanga, Camarines Sur',
    hours: asset.hours || 'Visiting information to be confirmed',
    description: asset.description || 'Tourism asset details are being prepared.',
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    locationType: 'tourism asset',
    imageUrl: asset.imageUrl,
    accredited: asset.accredited ?? true,
  }
}

function featureFromAssetLocation(location) {
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return null

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    },
    properties: {
      id: location.id,
      slug: location.id,
      label: location.name,
      category: location.category,
      markerColor: location.color,
      primaryImage: location.imageUrl,
      locationType: location.locationType,
      accredited: location.accredited,
      description: location.description,
    },
  }
}

function selectLocation(id) {
  if (id !== selectedId.value) clearRoute()
  selectedId.value = id
  if (!id) return
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      location: id,
    },
  })
}

function openLocationDetail(id) {
  if (id) selectLocation(id)
  showDetail.value = true
}

function toggleMobileList() {
  mobileListCollapsed.value = !mobileListCollapsed.value
}

function toggleCategory(category) {
  hasFilterInteraction.value = true
  enabledCategories.value = {
    ...enabledCategories.value,
    [category]: !enabledCategories.value[category],
  }
}

function resetFilters() {
  hasFilterInteraction.value = true
  searchQuery.value = ''
  enabledCategories.value = Object.fromEntries(
    categories.value.map((category) => [category.key, true]),
  )
}

function clearCategories() {
  hasFilterInteraction.value = true
  enabledCategories.value = Object.fromEntries(
    categories.value.map((category) => [category.key, false]),
  )
}

function hasVisitorSession() {
  try {
    return Boolean(window.localStorage.getItem(VISITOR_SESSION_KEY))
  } catch {
    return false
  }
}

async function loadLocations() {
  isLoading.value = true
  errorMessage.value = ''
  mapRuntimeError.value = ''

  try {
    const [tourismAssetData, mapLocationData] = await Promise.all([
      getTourismAssets({ limit: 50, sort: '-updatedAt' }),
      getMapLocationGeoJson(),
    ])
    const mapFeatures = Array.isArray(mapLocationData?.features) ? mapLocationData.features : []
    const destinationBySlug = new Map()
    tourismAssetData.forEach((asset) => {
      if (asset.id) destinationBySlug.set(String(asset.id), asset)
      if (asset.slug) destinationBySlug.set(String(asset.slug), asset)
    })

    const locationData = mapFeatures.length
      ? mapFeatures.map((feature, index) => locationFromFeature(feature, index, destinationBySlug))
      : tourismAssetData.map((asset, index) => locationFromTourismAsset(asset, index))

    mapGeoJson.value = mapFeatures.length
      ? mapLocationData
      : {
          type: 'FeatureCollection',
          features: locationData.map(featureFromAssetLocation).filter(Boolean),
        }
    locations.value = locationData
    enabledCategories.value = Object.fromEntries(
      categories.value.map((category) => [category.key, true]),
    )
    selectedId.value = String(route.query.location || locationData[0]?.id || '')
    await refreshSavedDestinations()
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public map locations.'
  } finally {
    isLoading.value = false
  }
}

async function toggleItinerary(location) {
  if (!location) return
  if (!location.apiId) {
    feedbackMessage.value = 'This map location is not available for itinerary saving yet.'
    return
  }

  if (!isVisitorAuthenticated.value) {
    promptForSaveAuth(location)
    return
  }

  await performItineraryToggle(location)
}

async function performItineraryToggle(location) {
  if (!location?.apiId) return

  isSaving.value = true
  feedbackMessage.value = ''

  if (savedIds.value.has(location.id)) {
    try {
      await removeFromItinerary({ id: location.id, apiId: location.apiId, type: 'destination' })
      const next = new Set(savedIds.value)
      next.delete(location.id)
      savedIds.value = next
      feedbackMessage.value = 'Removed from itinerary'
    } catch (error) {
      feedbackMessage.value = error.message || 'Unable to update itinerary'
    }
  } else {
    try {
      await saveToItinerary({
        id: location.id,
        apiId: location.apiId,
        type: 'destination',
        title: location.name,
      })
      savedIds.value = new Set([...savedIds.value, location.id])
      feedbackMessage.value = 'Saved to itinerary'
    } catch (error) {
      feedbackMessage.value = error.message || 'Unable to update itinerary'
    }
  }

  isSaving.value = false
}

async function refreshSavedDestinations() {
  if (!isVisitorAuthenticated.value) {
    savedIds.value = new Set()
    return
  }

  try {
    const itinerary = await loadItinerary()
    savedIds.value = new Set(
      itinerary.items
        .filter((item) => item.itemType === 'destination')
        .map((item) => item.summary?.slug || item.itemId || item.targetId),
    )
  } catch {
    savedIds.value = new Set()
  }
}

function promptForSaveAuth(location) {
  sessionStorage.setItem(PENDING_SAVE_KEY, location.id)
  selectedId.value = location.id
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      auth: 'login',
      authIntent: 'save',
      location: location.id,
    },
  })
}

async function resumePendingSave() {
  isVisitorAuthenticated.value = hasVisitorSession()
  if (!isVisitorAuthenticated.value) return

  await refreshSavedDestinations()

  const pendingId = sessionStorage.getItem(PENDING_SAVE_KEY)
  if (!pendingId) return

  const pendingLocation = locations.value.find((location) => location.id === pendingId)
  if (!pendingLocation) return

  sessionStorage.removeItem(PENDING_SAVE_KEY)
  selectedId.value = pendingId
  await performItineraryToggle(pendingLocation)
}

async function shareLocation(location) {
  if (!location) return

  const result = await sharePublicItem({
    title: location.name,
    text: `Explore ${location.name} in Calabanga.`,
    path: `/destinations?location=${location.id}`,
  })

  feedbackMessage.value = result.method === 'clipboard' ? 'Share link copied' : 'Share action ready'
}

function clearRoute() {
  routeGeoJson.value = null
}

async function getDirections(location) {
  if (!location) return

  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    feedbackMessage.value = 'This place has no map coordinates yet, so directions are unavailable.'
    return
  }

  isRouting.value = true
  feedbackMessage.value = 'Getting your location…'

  // 1. Ask for the visitor's live location (Phase 1.1 geolocation store).
  const origin = await geo.requestLocation()
  if (!origin) {
    isRouting.value = false
    feedbackMessage.value =
      geo.error || 'Enable location access to get directions from where you are.'
    return
  }

  // 2. Fetch a real route from the visitor to the landmark.
  feedbackMessage.value = 'Calculating the best route…'
  const result = await getRoute(origin, location, { profile: 'driving' })

  isRouting.value = false

  if (!result) {
    feedbackMessage.value = 'We could not calculate a route right now. Please try again.'
    return
  }

  // 3. Draw it on the map and keep the map visible.
  routeGeoJson.value = result
  feedbackMessage.value =
    `Route to ${location.name} · ${formatRouteDistance(result.distance)} · ` +
    `${formatRouteDuration(result.duration)} drive`
}

watch(searchQuery, () => {
  if (searchQuery.value.trim()) hasFilterInteraction.value = true
})

onMounted(() => {
  loadLocations()
  window.addEventListener('calitoursys:visitor-authenticated', resumePendingSave)
})

onBeforeUnmount(() => {
  window.removeEventListener('calitoursys:visitor-authenticated', resumePendingSave)
})
</script>

<template>
  <div class="discovery-page">
    <PromotionNavbar />

    <main class="discovery-shell">
      <aside
        class="discovery-sidebar"
        :class="{ 'discovery-sidebar--collapsed': mobileListCollapsed }"
      >
        <button
          type="button"
          class="sheet-handle"
          :aria-label="mobileListCollapsed ? 'Expand list' : 'Collapse list'"
          @click="toggleMobileList"
        >
          <span class="sheet-handle__bar"></span>
        </button>

        <section class="sidebar-block sidebar-block--search">
          <h1>Discover</h1>
          <label class="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input v-model="searchQuery" placeholder="Search places, food, crafts..." />
          </label>
        </section>

        <section class="sidebar-block">
          <div class="filter-heading">
            <h2>Filter results</h2>
            <span>
              <button type="button" @click="clearCategories">Clear all</button>
              <button type="button" @click="resetFilters">Reset</button>
            </span>
          </div>

          <div class="filter-list">
            <label
              v-for="category in categories"
              :key="category.key"
              class="filter-row"
              role="checkbox"
              tabindex="0"
              :aria-checked="Boolean(enabledCategories[category.key])"
              @click="toggleCategory(category.key)"
              @keydown.enter.prevent="toggleCategory(category.key)"
              @keydown.space.prevent="toggleCategory(category.key)"
            >
              <span
                class="fake-checkbox"
                :class="{ 'fake-checkbox--off': !enabledCategories[category.key] }"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
              <span class="category-dot" :style="{ backgroundColor: category.color }"></span>
              <span>{{ category.key }}</span>
              <small>{{ category.count }}</small>
            </label>
          </div>
        </section>

        <section class="results-block">
          <p v-if="isLoading">Loading public locations...</p>
          <p v-else-if="errorMessage">{{ errorMessage }}</p>
          <p v-else>Showing {{ visibleLocations.length }} locations</p>
          <div class="result-list">
            <div
              v-if="
                !isLoading &&
                visibleLocations.length === 0 &&
                (hasFilterInteraction || hasActiveFilters)
              "
              class="map-empty-state"
            >
              <strong>No locations match your filters.</strong>
              <span>Try selecting more categories.</span>
            </div>
            <div v-else-if="!isLoading && visibleLocations.length === 0" class="map-empty-state">
              <strong>No published map locations yet</strong>
              <span>Published tourism places will appear here once available.</span>
            </div>
            <button
              v-for="location in visibleLocations"
              :key="location.id"
              class="result-card"
              :class="{ 'result-card--selected': location.id === selectedLocation?.id }"
              @click="selectLocation(location.id)"
            >
              <span class="result-thumb" :style="{ '--thumb-color': location.color }"></span>
              <span class="result-card__copy">
                <strong>{{ location.name }}</strong>
                <span class="category-badge">{{ location.category }}</span>
                <span class="result-meta">
                  <span>{{ location.distance }}</span>
                </span>
              </span>
            </button>
          </div>
        </section>
      </aside>

      <section class="map-area" aria-label="Interactive tourist map">
        <TouristMapBox
          :access-token="mapboxToken"
          :feature-collection="visibleMapGeoJson"
          :selected-id="selectedLocation?.id || ''"
          :route="routeGeoJson"
          :loading="isLoading"
          :error="errorMessage"
          :empty-title="hasFilterInteraction || hasActiveFilters ? 'No locations match your filters.' : 'Asset coordinates not set yet'"
          :empty-text="hasFilterInteraction || hasActiveFilters ? 'Try selecting more categories.' : 'Product Development assets are listed here. Add map coordinates later to place them on the map.'"
          @select="selectLocation"
          @request-details="openLocationDetail"
          @map-error="mapRuntimeError = $event"
        />

        <div class="map-badge">
          <strong>Calabanga</strong>
          <span>&middot; Camarines Sur</span>
        </div>

        <div class="map-actions">
          <button type="button" disabled title="Map layers will be refined in a later phase">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16l-6.5 7.2V18l-3 1v-6.8L4 5Z" />
            </svg>
            Mapbox
          </button>
          <RouterLink to="/products">Browse Products</RouterLink>
          <button v-if="routeGeoJson" type="button" class="map-actions__clear" @click="clearRoute">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            Clear route
          </button>
        </div>

        <div class="map-legend">
          <span v-for="category in categories" :key="category.key">
            <i :style="{ backgroundColor: category.color }"></i>
            {{ category.key }}
          </span>
        </div>

        <div v-if="mapRuntimeError" class="feedback-toast feedback-toast--warning">
          {{ mapRuntimeError }}
        </div>
        <div v-if="feedbackMessage" class="feedback-toast">{{ feedbackMessage }}</div>
      </section>

      <div
        v-if="showDetail && selectedLocation"
        class="detail-backdrop"
        @click="showDetail = false"
      ></div>

      <aside v-if="showDetail && selectedLocation" class="detail-drawer">
        <div
          class="detail-drawer__hero"
          :style="{
            '--drawer-color': selectedLocation.color,
            backgroundImage: selectedLocation.imageUrl
              ? `url(${selectedLocation.imageUrl})`
              : undefined,
          }"
        >
          <button type="button" aria-label="Close details" @click="showDetail = false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <AccreditationBadge floating />
        </div>
        <div class="detail-drawer__body">
          <div class="detail-drawer__meta">
            <span class="category-badge">{{ selectedLocation.category }}</span>
            <span>{{ selectedLocationTypeLabel }}</span>
          </div>
          <h2>{{ selectedLocation.name }}</h2>
          <p>{{ selectedLocation.description }}</p>
          <div class="detail-drawer__facts">
            <p>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.3" />
              </svg>
              {{ selectedLocation.address }}
            </p>
            <p>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {{ selectedLocation.hours }}
            </p>
          </div>
          <div class="detail-drawer__actions">
            <button
              class="detail-drawer__primary-action"
              type="button"
              :disabled="isRouting"
              @click="getDirections(selectedLocation)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 18 3 15V5l6 3 6-3 6 3v10l-6-3-6 3Z" />
                <path d="M9 8v10M15 5v10" />
              </svg>
              {{ isRouting ? 'Finding route…' : 'Get directions' }}
            </button>
            <button
              class="detail-drawer__secondary-action"
              type="button"
              :disabled="isSaving || !selectedCanBeSaved"
              @click="toggleItinerary(selectedLocation)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h12v17l-6-3-6 3V4Z" />
              </svg>
              {{
                !selectedCanBeSaved
                  ? 'Save unavailable'
                  : isSaving
                    ? 'Saving...'
                    : savedIds.has(selectedLocation.id)
                      ? 'Saved to itinerary'
                      : 'Save to itinerary'
              }}
            </button>
          </div>

          <div class="detail-drawer__nearby">
            <NearbySuggestions
              :origin="selectedLocation"
              title="Suggested Next Stops"
              :subtitle="`Closest places to ${selectedLocation.name}, routed by walking distance.`"
              :limit="4"
            />
          </div>

          <div class="detail-drawer__reviews">
            <ReviewsSection
              target-type="destination"
              :target-id="selectedLocation.id"
              :target-name="selectedLocation.name"
            />
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.discovery-page {
  min-height: 100vh;
  overflow: hidden;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

.icon-button svg,
.search-field svg,
.map-actions svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.login-button:disabled,
.map-actions button:disabled {
  cursor: default;
  opacity: 0.72;
}

.discovery-shell {
  height: calc(100vh - 64px);
  display: flex;
  padding-top: 64px;
}

.discovery-sidebar {
  width: 360px;
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e8e4dc;
}

.sidebar-block {
  padding: 20px;
  border-bottom: 1px solid #e8e4dc;
}

.sidebar-block--search {
  padding-top: 18px;
}

/* Bottom-sheet drag handle + close button — only shown on mobile. */
.sheet-handle,
.sheet-topbar,
.sheet-close {
  display: none;
}

.sheet-handle {
  width: 100%;
  padding: 10px 0 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.sheet-handle__bar {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto;
  border-radius: 999px;
  background: #cfd6cf;
}

.sheet-topbar {
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 10px;
}

.sheet-topbar .sheet-handle {
  flex: 1;
}

.sheet-close {
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  cursor: pointer;
}

.sheet-close svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

h1,
h2,
h3 {
  margin: 0;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  font-size: 22px;
  font-weight: 700;
}

.search-field {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  margin-top: 16px;
  border-radius: 8px;
  background: #f2f0eb;
  color: #5c5c5c;
}

.search-field svg {
  position: absolute;
  left: 13px;
  width: 17px;
  height: 17px;
}

.search-field input {
  width: 100%;
  height: 100%;
  padding: 0 12px 0 40px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1a1a1a;
  font-size: 14px;
}

.search-field input::placeholder {
  color: #8a8782;
}

.filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filter-heading span {
  display: inline-flex;
  gap: 10px;
}

.filter-heading h2 {
  font-size: 18px;
  font-weight: 600;
}

.filter-heading button {
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.filter-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.filter-row {
  display: grid;
  grid-template-columns: 16px 8px 1fr auto;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
}

.filter-row:focus-visible,
.result-card:focus-visible {
  outline: 3px solid rgba(27, 67, 50, 0.22);
  outline-offset: 2px;
}

.fake-checkbox {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1.5px solid #1b4332;
  border-radius: 4px;
  background: #1b4332;
  color: #ffffff;
}

.fake-checkbox--off {
  background: #ffffff;
  color: transparent;
}

.fake-checkbox svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.filter-row small {
  color: #5c5c5c;
  font-size: 12px;
}

.results-block {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.results-block > p {
  margin: 0;
  padding: 16px 20px 10px;
  color: #5c5c5c;
  font-size: 13px;
}

.result-list {
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 20px;
}

.map-empty-state {
  display: grid;
  gap: 4px;
  padding: 24px 20px;
  color: #5c5c5c;
  font-size: 13px;
}

.map-empty-state strong {
  color: #1a1a1a;
  font-size: 14px;
}

.result-card {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border: 0;
  border-bottom: 1px solid #e8e4dc;
  background: #ffffff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.result-card:hover {
  background: #f2f0eb;
}

.result-card--selected {
  border-left: 3px solid #1b4332;
  background: #d8f3dc;
  padding-left: 17px;
}

.result-thumb {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.22), transparent 38%),
    linear-gradient(135deg, var(--thumb-color), color-mix(in srgb, var(--thumb-color) 65%, white));
}

.result-card__copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.result-card__copy strong {
  overflow: hidden;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  align-self: flex-start;
  height: 22px;
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 12px;
  font-weight: 500;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 5px;
  color: #5c5c5c;
  font-size: 12px;
}

.map-area {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: #e8e3da;
}

.map-area::before {
  display: none;
}

.map-badge,
.map-actions,
.map-legend,
.location-popup,
.cluster-marker,
.map-pin {
  position: absolute;
  z-index: 2;
}

.map-badge {
  top: 22px;
  left: 22px;
  display: inline-flex;
  gap: 4px;
  padding: 10px 13px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
  font-size: 13px;
}

.map-badge strong {
  color: #1a1a1a;
  font-weight: 500;
}

.map-actions {
  top: 22px;
  right: 20px;
  display: flex;
  gap: 10px;
}

.map-actions button,
.map-actions a {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
}

.map-actions button {
  cursor: pointer;
}

.map-actions button.map-actions__clear {
  border-color: #b5451b;
  color: #b5451b;
}

.map-actions button.map-actions__clear svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.map-actions a {
  border-color: #1b4332;
  background: #1b4332;
  color: #ffffff;
}

.map-actions svg {
  width: 16px;
  height: 16px;
}

.map-pin {
  width: 32px;
  border: 0;
  background: transparent;
  padding: 0;
  transform: translate(-50%, -100%);
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

.map-pin svg {
  width: 32px;
  height: 42px;
}

.map-pin path {
  fill: var(--pin-color);
}

.map-pin circle {
  fill: #ffffff;
}

.map-pin--selected {
  transform: translate(-50%, -100%) scale(1.3);
}

.map-pin--selected path {
  fill: #b5451b;
}

.cluster-marker {
  top: 48%;
  left: 50%;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1b4332;
  box-shadow: 0 0 0 6px rgba(27, 67, 50, 0.15);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}

.location-popup {
  width: 280px;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  transform: translateY(-50%);
  animation: fadeUp 240ms ease-out both;
}

.location-popup__image {
  position: relative;
  height: 140px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), transparent 45%),
    linear-gradient(135deg, var(--popup-color), color-mix(in srgb, var(--popup-color) 62%, white));
}

.location-popup__image button {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  cursor: pointer;
}

.location-popup__image button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.location-popup__body {
  padding: 14px 16px 16px;
}

.location-popup__body h2 {
  font-size: 15px;
  font-weight: 600;
}

.popup-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: #5c5c5c;
  font-size: 12px;
}

.location-popup__body button {
  margin-top: 9px;
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.detail-drawer__actions button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.map-legend {
  bottom: 22px;
  left: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: calc(100% - 420px);
  padding: 12px 14px;
  border: 1px solid #e8e4dc;
  border-radius: 10px;
  background: #ffffff;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1a1a1a;
  font-size: 12px;
  white-space: nowrap;
}

.map-legend i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.feedback-toast {
  position: absolute;
  right: 20px;
  bottom: 22px;
  z-index: 4;
  width: 280px;
  padding: 14px 16px;
  border-left: 4px solid #1b7a4a;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
}

.feedback-toast--warning {
  border-left-color: #d4ac0d;
}

.detail-backdrop {
  position: fixed;
  z-index: 65;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
}

.detail-drawer {
  position: fixed;
  z-index: 70;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(600px, 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: #ffffff;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.18);
  animation: slideIn 240ms ease-out both;
}

.detail-drawer__hero {
  position: relative;
  height: 240px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), transparent 45%),
    linear-gradient(135deg, var(--drawer-color), color-mix(in srgb, var(--drawer-color) 62%, white));
  background-position: center;
  background-size: cover;
}

.detail-drawer__hero button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(27, 67, 50, 0.22);
  color: #ffffff;
  cursor: pointer;
}

.detail-drawer__hero button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.detail-drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 32px;
}

.detail-drawer__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5c5c5c;
  font-size: 14px;
}

.detail-drawer__body .category-badge {
  align-self: flex-start;
}

.detail-drawer__body h2 {
  margin-top: 14px;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 32px;
  font-weight: 600;
}

.detail-drawer__body p {
  margin: 28px 0 0;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.6;
}

.detail-drawer__facts {
  display: grid;
  gap: 18px;
  margin-top: 28px;
}

.detail-drawer__facts p {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  color: #1a1a1a;
  font-size: 16px;
}

.detail-drawer__facts svg,
.detail-drawer__actions svg {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.detail-drawer__facts svg {
  color: #1b4332;
}

.detail-drawer__actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 32px;
  border-top: 1px solid #e8e4dc;
}

.detail-drawer__nearby,
.detail-drawer__reviews {
  margin-top: 24px;
}

.detail-drawer__actions button {
  height: 48px;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.detail-drawer__actions .detail-drawer__secondary-action {
  background: transparent;
  color: #1b4332;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(calc(-50% + 8px));
  }

  to {
    opacity: 1;
    transform: translateY(-50%);
  }
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .discovery-sidebar {
    width: 330px;
    flex-basis: 330px;
  }

  .map-legend {
    max-width: calc(100% - 380px);
  }
}

@media (max-width: 760px) {
  /* The navbar is a fixed component (z-index 50, solid white). The shell holds a
     full-height map with UI layered above it. z-order: map < list < detail. */
  .discovery-shell {
    position: relative;
    display: block;
    /* Use dynamic viewport height so bottom-anchored sheets sit above the phone
       browser's toolbar instead of behind it (fallback to vh for old browsers). */
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
    min-height: calc(100vh - 64px);
    min-height: calc(100dvh - 64px);
    margin-top: 64px;
    padding-top: 0;
    overflow: hidden;
  }

  .map-area {
    position: absolute;
    inset: 0;
    height: 100%;
    z-index: 1;
  }

  .map-badge {
    top: 12px;
    left: 12px;
  }

  .map-actions {
    top: 12px;
    right: 12px;
    flex-direction: column;
  }

  .map-legend,
  .location-popup {
    display: none;
  }

  /* Reveal the sheet controls on mobile. */
  .sheet-handle {
    display: block;
  }

  .sheet-topbar {
    display: flex;
  }

  .sheet-close {
    display: inline-grid;
  }

  /* ---- Discover list: persistent bottom sheet, capped at 40vh ---- */
  .discovery-sidebar {
    position: absolute;
    z-index: 20;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    max-height: 40vh;
    max-height: 40dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 0;
    border-top: 1px solid #e8e4dc;
    border-radius: 18px 18px 0 0;
    background: #ffffff;
    box-shadow: 0 -12px 32px rgba(27, 67, 50, 0.16);
    transition: transform 0.28s ease;
  }

  /* Collapsed: slide down, leaving the handle + search peeking above the fold. */
  .discovery-sidebar--collapsed {
    transform: translateY(calc(100% - 118px));
  }

  .sidebar-block:not(.sidebar-block--search) {
    display: none;
  }

  .results-block {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .results-block > p {
    padding: 10px 16px 6px;
  }

  .result-list {
    max-height: none;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }

  .result-card {
    padding: 12px 16px;
  }

  .result-card--selected {
    padding-left: 13px;
  }

  .result-thumb {
    width: 44px;
    height: 44px;
  }

  .detail-drawer {
    width: 100%;
  }

  .detail-drawer__body {
    padding: 28px 20px;
  }

  .detail-drawer__actions {
    flex-direction: column;
  }

  @media (prefers-reduced-motion: reduce) {
    .discovery-sidebar {
      transition: none;
    }
  }
}
</style>
