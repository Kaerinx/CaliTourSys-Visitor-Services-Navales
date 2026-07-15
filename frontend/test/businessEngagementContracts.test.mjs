import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("owner navigation places ratings immediately after applications", async () => {
  const source = await readSource(
    "../src/modules/accreditation/components/ModuleLayout.vue",
  );
  const applicationsIndex = source.indexOf('label: "My Applications"');
  const ratingsIndex = source.indexOf('label: "Ratings & Reviews"');
  const inquiriesIndex = source.indexOf('label: "Product Inquiries"');

  assert.ok(applicationsIndex >= 0);
  assert.ok(ratingsIndex > applicationsIndex);
  assert.ok(inquiriesIndex > ratingsIndex);
});

test("public reviews use the API and stable database identifiers", async () => {
  const service = await readSource(
    "../src/modules/promotion/services/reviewsService.js",
  );
  const productDetail = await readSource(
    "../src/modules/promotion/views/PromotionDetail.vue",
  );
  const establishment = await readSource(
    "../src/modules/promotion/views/EstablishmentInformationView.vue",
  );
  const discovery = await readSource(
    "../src/modules/promotion/views/TouristDiscoveryView.vue",
  );

  assert.match(service, /getPublicReviews/);
  assert.match(service, /submitPublicReview/);
  assert.doesNotMatch(service, /localStorage|STORAGE_KEY/);
  assert.match(productDetail, /:target-id="product\.apiId"/);
  assert.match(productDetail, /productId:\s*product\.value\?\.apiId/);
  assert.match(establishment, /target-type="business"/);
  assert.match(establishment, /business\.apiId \|\| business\.id/);
  assert.match(discovery, /properties\.targetId \|\| destination\?\.apiId/);
});

test("tourist profile updates use the tourist authentication token", async () => {
  const source = await readSource(
    "../src/modules/promotion/services/touristAuthApi.js",
  );

  assert.match(source, /updateProfile[\s\S]*http\.patchTourist/);
  assert.match(source, /changePassword[\s\S]*http\.patchTourist/);
  assert.doesNotMatch(source, /http\.patchAuth/);
});

test("owner inquiry view provides email reply and tracked statuses", async () => {
  const source = await readSource(
    "../src/modules/accreditation/views/ProductInquiriesView.vue",
  );

  assert.match(source, /mailto:/);
  assert.match(source, /Reply via email/);
  assert.match(source, /Mark responded/);
  assert.match(source, /updateProductInquiryStatus/);
});

test("owner ratings monitor linked tourism assets", async () => {
  const source = await readSource(
    "../src/modules/accreditation/views/BusinessRatingsView.vue",
  );

  assert.match(source, /tourismAssets/);
  assert.match(source, /value="tourism_asset"/);
  assert.match(source, /Tourism Asset \/ Destination/);
});
