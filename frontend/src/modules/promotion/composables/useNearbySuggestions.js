import { ref } from 'vue'

import { getMapLocations } from '../services/promotionService'
import { getDistanceMatrix, MATRIX_MAX_COORDINATES } from '../services/mapboxMatrix'
import { buildKNearestGraph, dijkstra, reconstructPath } from '../utils/dijkstra'

const AVERAGE_WALK_METERS_PER_MINUTE = 80 // ~4.8 km/h

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Normalise a public map-location record into a POI node with real coordinates.
 * Records without coordinates cannot participate in routing and are dropped.
 */
function toPoi(location) {
  const latitude = toNumber(location.latitude)
  const longitude = toNumber(location.longitude)
  if (latitude === null || longitude === null) return null

  return {
    id: String(location.id ?? location.slug ?? location.name),
    slug: location.slug,
    name: location.name,
    category: location.category,
    color: location.color,
    description: location.description,
    imageUrl: location.imageUrl,
    locationType: location.locationType,
    accredited: location.accredited,
    latitude,
    longitude,
  }
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m away`
  return `${(meters / 1000).toFixed(1)} km away`
}

export function formatWalkTime(meters) {
  if (!Number.isFinite(meters)) return ''
  const minutes = Math.max(1, Math.round(meters / AVERAGE_WALK_METERS_PER_MINUTE))
  return `${minutes} min walk`
}

/**
 * Discover the nearest points of interest to a starting location using real
 * Mapbox road distances as Dijkstra edge weights.
 *
 * Returns reactive state plus a `load(origin)` function. `origin` is the
 * starting node — typically the establishment the visitor is currently at, or
 * their live coordinates: `{ id?, name?, latitude, longitude }`.
 */
export function useNearbySuggestions(options = {}) {
  const { limit = 5, profile = 'walking' } = options

  const suggestions = ref([])
  const loading = ref(false)
  const error = ref('')
  const distanceSource = ref('') // 'mapbox' | 'haversine'

  async function load(origin) {
    if (!origin || !Number.isFinite(origin.latitude) || !Number.isFinite(origin.longitude)) {
      error.value = 'A starting location is required to find nearby stops.'
      return []
    }

    loading.value = true
    error.value = ''

    try {
      const locations = await getMapLocations({ format: 'list' })

      const originId = String(origin.id ?? '__origin__')
      const pois = (Array.isArray(locations) ? locations : [])
        .map(toPoi)
        .filter((poi) => poi && poi.id !== originId)
        // Matrix API caps total coordinates; reserve one slot for the origin.
        .slice(0, MATRIX_MAX_COORDINATES - 1)

      if (pois.length === 0) {
        suggestions.value = []
        return []
      }

      const originNode = {
        id: originId,
        latitude: origin.latitude,
        longitude: origin.longitude,
      }
      const nodes = [originNode, ...pois]
      const ids = nodes.map((node) => node.id)

      const { matrix, source } = await getDistanceMatrix(nodes, { profile })
      distanceSource.value = source

      const adjacency = buildKNearestGraph(ids, matrix, 3)
      const { distances, previous } = dijkstra(adjacency, originId)

      const poiById = new Map(pois.map((poi) => [poi.id, poi]))

      suggestions.value = pois
        .map((poi) => {
          const distanceMeters = distances[poi.id]
          const path = reconstructPath(previous, originId, poi.id)
            .filter((id) => id !== originId)
            .map((id) => poiById.get(id)?.name)
            .filter(Boolean)

          return {
            ...poi,
            distanceMeters,
            distanceLabel: formatDistance(distanceMeters),
            walkLabel: formatWalkTime(distanceMeters),
            viaPath: path.slice(0, -1), // intermediate stops, excludes the POI itself
          }
        })
        .filter((poi) => Number.isFinite(poi.distanceMeters))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, limit)

      return suggestions.value
    } catch (err) {
      error.value = 'We could not calculate nearby stops right now. Please try again.'
      suggestions.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    suggestions,
    loading,
    error,
    distanceSource,
    load,
  }
}
