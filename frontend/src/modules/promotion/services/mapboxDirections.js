/**
 * Mapbox Directions API client — fetches a real route (geometry + distance +
 * duration) between two points so the map can draw the path from the visitor's
 * live location to a chosen landmark.
 *
 * Docs: https://docs.mapbox.com/api/navigation/directions/
 */

import { mapboxAccessToken } from '@/config/mapbox'

const DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox'
const accessToken = mapboxAccessToken

function hasValidToken() {
  return accessToken.startsWith('pk.')
}

function isCoord(point) {
  return point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
}

/**
 * Fetch a route between two coordinates.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @param {{ profile?: 'driving'|'walking'|'cycling' }} [options]
 * @returns {Promise<{ geometry: object, distance: number, duration: number, profile: string } | null>}
 *   `geometry` is a GeoJSON LineString; `distance` is metres; `duration` is
 *   seconds. Resolves to null when a route can't be produced.
 */
export async function getRoute(origin, destination, options = {}) {
  const { profile = 'driving' } = options

  if (!hasValidToken() || !isCoord(origin) || !isCoord(destination)) return null

  const coordinates =
    `${origin.longitude},${origin.latitude};` + `${destination.longitude},${destination.latitude}`

  const url =
    `${DIRECTIONS_BASE_URL}/${profile}/${coordinates}` +
    `?geometries=geojson&overview=full&access_token=${accessToken}`

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await response.json()

    if (!response.ok || data.code !== 'Ok' || !Array.isArray(data.routes) || !data.routes.length) {
      return null
    }

    const route = data.routes[0]
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      profile,
    }
  } catch {
    return null
  }
}

export function formatRouteDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatRouteDuration(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${Math.max(1, minutes)} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}
