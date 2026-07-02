<script setup>
import { computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { GEO_STATUS, useGeolocationStore } from '@/stores/geolocation'
import { useNearbySuggestions } from '../composables/useNearbySuggestions'

const props = defineProps({
  // Starting node for routing. When the visitor is on an establishment page,
  // pass that establishment's coordinates; otherwise the component falls back to
  // the visitor's live geolocation.
  origin: {
    type: Object,
    default: null,
  },
  title: {
    type: String,
    default: 'Nearest to You',
  },
  subtitle: {
    type: String,
    default: 'Smart suggestions for your next stop, sorted by how close they are.',
  },
  limit: {
    type: Number,
    default: 5,
  },
})

const geo = useGeolocationStore()
const { suggestions, loading, error, distanceSource, load } = useNearbySuggestions({
  limit: props.limit,
})

const originHasCoords = computed(
  () =>
    props.origin &&
    Number.isFinite(Number(props.origin.latitude)) &&
    Number.isFinite(Number(props.origin.longitude)),
)

// Prefer the explicit establishment origin; otherwise use the visitor's live
// location once it is available.
const activeOrigin = computed(() => {
  if (originHasCoords.value) {
    return {
      id: props.origin.id ?? props.origin.slug,
      name: props.origin.name,
      latitude: Number(props.origin.latitude),
      longitude: Number(props.origin.longitude),
    }
  }
  if (geo.hasLocation) {
    return {
      id: '__visitor__',
      name: 'Your location',
      latitude: geo.coords.latitude,
      longitude: geo.coords.longitude,
    }
  }
  return null
})

const needsLocationPrompt = computed(
  () => !originHasCoords.value && !geo.hasLocation && !geo.isLocating,
)

const isBusy = computed(() => loading.value || geo.isLocating)

const locationError = computed(() => {
  if (originHasCoords.value) return ''
  if (geo.status === GEO_STATUS.UNSUPPORTED) {
    return 'Your browser does not support location services, so nearby suggestions are unavailable.'
  }
  if (geo.isDenied || geo.status === GEO_STATUS.UNAVAILABLE) return geo.error
  return ''
})

function refresh() {
  if (activeOrigin.value) load(activeOrigin.value)
}

async function useMyLocation() {
  const coords = await geo.requestLocation()
  if (coords) refresh()
}

watch(activeOrigin, (next, previous) => {
  if (!next) return
  if (previous && next.latitude === previous.latitude && next.longitude === previous.longitude)
    return
  refresh()
})

onMounted(() => {
  if (activeOrigin.value) refresh()
})
</script>

<template>
  <section class="nearby" aria-labelledby="nearby-title">
    <header class="nearby__header">
      <div>
        <p class="nearby__eyebrow">Location-aware</p>
        <h2 id="nearby-title" class="nearby__title">{{ title }}</h2>
        <p class="nearby__subtitle">{{ subtitle }}</p>
      </div>
      <button
        v-if="!needsLocationPrompt && !isBusy"
        type="button"
        class="nearby__refresh"
        @click="refresh"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Refresh
      </button>
    </header>

    <!-- Graceful permission prompt (Phase 1.1) -->
    <div v-if="needsLocationPrompt" class="nearby__prompt">
      <div class="nearby__prompt-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
      <div class="nearby__prompt-copy">
        <h3>See what's around you</h3>
        <p>Enable location to discover the closest shops, pasalubong centers, and landmarks.</p>
      </div>
      <button type="button" class="nearby__cta" @click="useMyLocation">Use my location</button>
    </div>

    <!-- Loading skeleton (Phase 1.1) -->
    <div v-else-if="isBusy" class="nearby__grid" aria-hidden="true">
      <div v-for="n in Math.min(limit, 3)" :key="n" class="nearby__skeleton">
        <div class="nearby__skeleton-line nearby__skeleton-line--pill"></div>
        <div class="nearby__skeleton-line nearby__skeleton-line--title"></div>
        <div class="nearby__skeleton-line nearby__skeleton-line--meta"></div>
      </div>
    </div>

    <!-- Clean fallback UI on error (Phase 1.1) -->
    <div v-else-if="locationError || error" class="nearby__fallback">
      <p>{{ locationError || error }}</p>
      <button type="button" class="nearby__cta nearby__cta--ghost" @click="useMyLocation">
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="suggestions.length === 0" class="nearby__empty">
      <p>No nearby stops to suggest just yet. Check back as more places are added.</p>
    </div>

    <!-- Dijkstra results (Phase 1.2) -->
    <ul v-else class="nearby__grid nearby__grid--list">
      <li v-for="(poi, index) in suggestions" :key="poi.id" class="nearby__card">
        <RouterLink
          class="nearby__card-link"
          :to="{ path: '/destinations', query: { focus: poi.slug || poi.id } }"
        >
          <span class="nearby__rank">{{ index + 1 }}</span>
          <span class="nearby__card-body">
            <span
              v-if="poi.category"
              class="nearby__pill"
              :style="{ '--pill-color': poi.color || '#1B4332' }"
              >{{ poi.category }}</span
            >
            <span class="nearby__name">{{ poi.name }}</span>
            <span class="nearby__meta">
              <span class="nearby__distance">{{ poi.distanceLabel }}</span>
              <span v-if="poi.walkLabel" class="nearby__dot" aria-hidden="true">·</span>
              <span v-if="poi.walkLabel">{{ poi.walkLabel }}</span>
            </span>
            <span v-if="poi.viaPath && poi.viaPath.length" class="nearby__via">
              via {{ poi.viaPath.join(' → ') }}
            </span>
          </span>
          <svg
            class="nearby__arrow"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </RouterLink>
      </li>
    </ul>

    <p v-if="distanceSource === 'haversine' && suggestions.length" class="nearby__note">
      Showing straight-line estimates — live road distances are temporarily unavailable.
    </p>
  </section>
</template>

<style scoped>
.nearby {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Inter', system-ui, sans-serif;
}

.nearby__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.nearby__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #b5451b;
}

.nearby__title {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
  color: #1a1a1a;
}

.nearby__subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #5c5c5c;
}

.nearby__refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.nearby__refresh:hover {
  background: #d8f3dc;
}

.nearby__refresh:active {
  transform: scale(0.98);
}

.nearby__prompt {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #f2f0eb;
}

.nearby__prompt-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #d8f3dc;
  color: #1b4332;
  flex-shrink: 0;
}

.nearby__prompt-copy {
  flex: 1 1 240px;
}

.nearby__prompt-copy h3 {
  margin: 0 0 4px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.nearby__prompt-copy p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #5c5c5c;
}

.nearby__cta {
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.nearby__cta:hover {
  background: #14532d;
}

.nearby__cta:active {
  transform: scale(0.98);
}

.nearby__cta--ghost {
  background: transparent;
  border: 1.5px solid #1b4332;
  color: #1b4332;
}

.nearby__cta--ghost:hover {
  background: #d8f3dc;
}

.nearby__grid {
  display: grid;
  gap: 12px;
}

.nearby__grid--list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nearby__skeleton {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nearby__skeleton-line {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f2f0eb 25%, #e8e4dc 37%, #f2f0eb 63%);
  background-size: 400% 100%;
  animation: nearby-shimmer 1.4s ease infinite;
}

.nearby__skeleton-line--pill {
  width: 88px;
}

.nearby__skeleton-line--title {
  width: 70%;
  height: 16px;
}

.nearby__skeleton-line--meta {
  width: 45%;
}

@keyframes nearby-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

.nearby__fallback,
.nearby__empty {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #5c5c5c;
  font-size: 14px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.nearby__card {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.nearby__card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.nearby__card-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  text-decoration: none;
  color: inherit;
}

.nearby__rank {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #1b4332;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

.nearby__card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.nearby__pill {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--pill-color) 14%, white);
  color: var(--pill-color);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.nearby__name {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nearby__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #5c5c5c;
}

.nearby__distance {
  color: #1b4332;
  font-weight: 500;
}

.nearby__via {
  font-size: 12px;
  color: #5c5c5c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nearby__arrow {
  color: #1b4332;
  flex-shrink: 0;
}

.nearby__note {
  margin: 0;
  font-size: 12px;
  color: #5c5c5c;
}

@media (max-width: 640px) {
  .nearby {
    padding: 20px;
  }

  .nearby__header {
    flex-direction: column;
  }
}
</style>
