import test from "node:test";
import assert from "node:assert/strict";

import {
  formatRouteDuration,
  getTravelEstimates,
  hasTravelEstimate,
} from "../src/modules/promotion/services/travelEstimates.js";

const origin = { latitude: 13.7, longitude: 123.2 };
const destination = { latitude: 13.71, longitude: 123.22 };

test("requests walking, driving, and traffic estimates concurrently", async () => {
  const calls = [];
  const resolvers = [];
  const routeClient = (...args) => {
    calls.push(args);
    return new Promise((resolve) => resolvers.push(resolve));
  };

  const pending = getTravelEstimates(origin, destination, { routeClient });
  assert.equal(calls.length, 3);
  assert.deepEqual(
    calls.map(([, , options]) => options.profile),
    ["walking", "driving", "driving-traffic"],
  );
  assert.deepEqual(calls[2][2].params, { depart_at: "now" });

  resolvers.forEach((resolve, index) =>
    resolve({ duration: (index + 1) * 60 }),
  );
  const estimates = await pending;

  assert.equal(estimates.walking.duration, 60);
  assert.equal(estimates.driving.duration, 120);
  assert.equal(estimates.motorcycle.duration, 180);
});

test("keeps successful profiles when another profile fails", async () => {
  const routeClient = async (_origin, _destination, { profile }) => {
    if (profile === "driving") throw new Error("temporary routing failure");
    return { profile, duration: 90 };
  };

  const estimates = await getTravelEstimates(origin, destination, {
    routeClient,
  });

  assert.equal(estimates.driving, null);
  assert.equal(estimates.walking.duration, 90);
  assert.equal(estimates.motorcycle.duration, 90);
  assert.equal(hasTravelEstimate(estimates), true);
});

test("forwards one cancellation signal to every profile", async () => {
  const controller = new AbortController();
  const signals = [];
  const routeClient = async (_origin, _destination, { signal }) => {
    signals.push(signal);
    return null;
  };

  const estimates = await getTravelEstimates(origin, destination, {
    routeClient,
    signal: controller.signal,
  });

  assert.equal(signals.length, 3);
  assert.ok(signals.every((signal) => signal === controller.signal));
  assert.equal(hasTravelEstimate(estimates), false);
});

test("formats short, hour, and unavailable durations", () => {
  assert.equal(formatRouteDuration(20), "1 min");
  assert.equal(formatRouteDuration(59 * 60), "59 min");
  assert.equal(formatRouteDuration(60 * 60), "1 hr");
  assert.equal(formatRouteDuration(90 * 60), "1 hr 30 min");
  assert.equal(formatRouteDuration(Number.NaN), "");
});
