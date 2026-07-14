/**
 * Mapbox Directions API client — fetches a real route (geometry + distance +
 * duration) between two points so the map can draw the path from the visitor's
 * live location to a chosen landmark.
 *
 * Docs: https://docs.mapbox.com/api/navigation/directions/
 */

import { mapboxAccessToken } from "@/config/mapbox";

const DIRECTIONS_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox";
const accessToken = mapboxAccessToken;
const SUPPORTED_PROFILES = new Set(["walking", "driving", "driving-traffic"]);

function hasValidToken() {
  return accessToken.startsWith("pk.");
}

function isCoord(point) {
  return (
    point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  );
}

/**
 * Fetch a route between two coordinates.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @param {{
 *   profile?: 'walking'|'driving'|'driving-traffic',
 *   signal?: AbortSignal,
 *   params?: Record<string, string|number|boolean|null|undefined>
 * }} [options]
 * @returns {Promise<{ geometry: object, distance: number, duration: number, profile: string } | null>}
 *   `geometry` is a GeoJSON LineString; `distance` is metres; `duration` is
 *   seconds. Resolves to null when a route can't be produced.
 */
export async function getRoute(origin, destination, options = {}) {
  const { profile = "driving", signal, params = {} } = options;

  if (
    !hasValidToken() ||
    !SUPPORTED_PROFILES.has(profile) ||
    !isCoord(origin) ||
    !isCoord(destination)
  ) {
    return null;
  }

  const coordinates =
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}`;

  const query = new URLSearchParams({
    geometries: "geojson",
    overview: "full",
  });

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  query.set("access_token", accessToken);

  const url = `${DIRECTIONS_BASE_URL}/${profile}/${coordinates}?${query.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    const data = await response.json();

    if (
      !response.ok ||
      data.code !== "Ok" ||
      !Array.isArray(data.routes) ||
      !data.routes.length
    ) {
      return null;
    }

    const route = data.routes[0];
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      profile,
    };
  } catch {
    return null;
  }
}

export function formatRouteDistance(meters) {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export { formatRouteDuration } from "./travelEstimates";
