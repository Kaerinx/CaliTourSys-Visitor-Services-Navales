/**
 * Thin client over the Mapbox Matrix API used to obtain real road/walking
 * distances between points, which become the edge weights for the nearest-POI
 * Dijkstra graph.
 *
 * Docs: https://docs.mapbox.com/api/navigation/matrix/
 * The Matrix API accepts at most 25 coordinates per request for the
 * walking/driving/cycling profiles.
 */

const MATRIX_BASE_URL = 'https://api.mapbox.com/directions-matrix/v1/mapbox'
export const MATRIX_MAX_COORDINATES = 25

const accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || ''

const EARTH_RADIUS_METERS = 6371000

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

/**
 * Straight-line distance in metres. Used as a graceful fallback when the Matrix
 * API is unavailable (missing token, offline, rate limited) so the feature still
 * degrades to a reasonable ordering instead of breaking.
 */
export function haversineMeters(a, b) {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

function haversineMatrix(points) {
  return points.map((from) => points.map((to) => haversineMeters(from, to)))
}

function hasValidToken() {
  return accessToken.startsWith('pk.')
}

/**
 * Fetch an NxN road-distance matrix (metres) for the given points.
 *
 * @param {Array<{ latitude: number, longitude: number }>} points
 * @param {{ profile?: 'walking'|'driving'|'cycling' }} [options]
 * @returns {Promise<{ matrix: number[][], source: 'mapbox'|'haversine' }>}
 */
export async function getDistanceMatrix(points, options = {}) {
  const { profile = 'walking' } = options

  if (!Array.isArray(points) || points.length < 2) {
    return { matrix: [], source: 'haversine' }
  }

  if (!hasValidToken() || points.length > MATRIX_MAX_COORDINATES) {
    return { matrix: haversineMatrix(points), source: 'haversine' }
  }

  const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(';')

  const url =
    `${MATRIX_BASE_URL}/${profile}/${coordinates}` +
    `?annotations=distance&access_token=${accessToken}`

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await response.json()

    if (!response.ok || data.code !== 'Ok' || !Array.isArray(data.distances)) {
      return { matrix: haversineMatrix(points), source: 'haversine' }
    }

    // Mapbox returns null for legs it cannot route; substitute a straight-line
    // estimate so those pairs remain comparable instead of disconnecting nodes.
    const matrix = data.distances.map((row, i) =>
      row.map((value, j) => (value === null ? haversineMeters(points[i], points[j]) : value)),
    )

    return { matrix, source: 'mapbox' }
  } catch {
    return { matrix: haversineMatrix(points), source: 'haversine' }
  }
}
