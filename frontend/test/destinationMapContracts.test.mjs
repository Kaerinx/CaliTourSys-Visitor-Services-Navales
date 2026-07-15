import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("driving route remains green, dashed, and independently cased", async () => {
  const source = await readSource(
    "../src/modules/promotion/components/TouristMapBox.vue",
  );

  assert.match(
    source,
    /id:\s*ROUTE_CASING_LAYER_ID[\s\S]*?"line-color":\s*"#ffffff"/,
  );
  assert.match(
    source,
    /id:\s*ROUTE_LINE_LAYER_ID[\s\S]*?"line-color":\s*"#16A34A"/,
  );
  assert.match(source, /"line-dasharray":\s*\[2,\s*2\]/);
});

test("reviews precede suggested next stops in the detail drawer DOM", async () => {
  const source = await readSource(
    "../src/modules/promotion/views/TouristDiscoveryView.vue",
  );
  const reviewsIndex = source.indexOf("<ReviewsSection");
  const suggestionsIndex = source.indexOf("<NearbySuggestions");

  assert.ok(reviewsIndex >= 0);
  assert.ok(suggestionsIndex > reviewsIndex);
});

test("tourism assets are reviewable without enabling rich destination details", async () => {
  const discovery = await readSource(
    "../src/modules/promotion/views/TouristDiscoveryView.vue",
  );
  const reviews = await readSource(
    "../src/modules/promotion/components/ReviewsSection.vue",
  );
  const service = await readSource(
    "../src/modules/promotion/services/reviewsService.js",
  );

  assert.match(discovery, /"tourism asset":\s*"tourism_asset"/);
  assert.match(discovery, /const canReviewSelectedLocation = computed/);
  assert.match(discovery, /v-if="canReviewSelectedLocation"/);
  assert.doesNotMatch(
    discovery,
    /v-if="selectedLocation\.apiId\s*&&\s*supportsRichDetails"/,
  );
  assert.match(reviews, /tourism_asset:\s*"tourism asset"/);
  assert.match(service, /"tourism_asset"/);
});

test("emergency markers expose pulse and reduced-motion contracts", async () => {
  const source = await readSource(
    "../src/modules/promotion/components/TouristMapBox.vue",
  );

  assert.match(source, /tourist-emergency-marker--pulse/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.match(source, /mouseenter/);
  assert.match(source, /mouseleave/);
  assert.match(source, /focus/);
  assert.match(source, /blur/);
});

test("emergency CMS form defines weekly hours before creating default state", async () => {
  const source = await readSource(
    "../src/modules/cms/components/content/CmsEmergencyFacilityForm.vue",
  );
  const daysIndex = source.indexOf("const DAYS =");
  const formIndex = source.indexOf("const form = reactive(defaultForm())");

  assert.ok(daysIndex >= 0);
  assert.ok(formIndex > daysIndex);
});

test("carousel exposes keyboard, lazy-image, and scroll-snap behavior", async () => {
  const source = await readSource(
    "../src/modules/promotion/components/LocationImageCarousel.vue",
  );

  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
    assert.match(source, new RegExp(key));
  }
  assert.match(source, /loading="lazy"/);
  assert.match(source, /scroll-snap-type:\s*x mandatory/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
});

test("detail drawer keeps cancellable loads, package fallback, and focus guards", async () => {
  const source = await readSource(
    "../src/modules/promotion/views/TouristDiscoveryView.vue",
  );

  assert.match(source, /detailCache\s*=\s*new Map/);
  assert.match(source, /detailController\?\.abort/);
  assert.match(source, /:disabled="!primaryBookPackage"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key === "Escape"/);
});
