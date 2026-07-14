export const TRAVEL_MODES = Object.freeze([
  Object.freeze({ key: "walking", profile: "walking", params: {} }),
  Object.freeze({ key: "driving", profile: "driving", params: {} }),
  Object.freeze({
    key: "motorcycle",
    profile: "driving-traffic",
    params: { depart_at: "now" },
  }),
]);

/**
 * Request each public travel estimate concurrently. A failure in one profile
 * remains local to that mode so successful estimates can still be displayed.
 */
export async function getTravelEstimates(
  origin,
  destination,
  { routeClient, signal } = {},
) {
  if (typeof routeClient !== "function") {
    throw new TypeError("A routeClient function is required.");
  }

  const results = await Promise.allSettled(
    TRAVEL_MODES.map((mode) =>
      routeClient(origin, destination, {
        profile: mode.profile,
        signal,
        params: mode.params,
      }),
    ),
  );

  return Object.fromEntries(
    TRAVEL_MODES.map((mode, index) => [
      mode.key,
      results[index].status === "fulfilled"
        ? results[index].value || null
        : null,
    ]),
  );
}

export function hasTravelEstimate(estimates) {
  return TRAVEL_MODES.some((mode) => Boolean(estimates?.[mode.key]));
}

export function formatRouteDuration(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
