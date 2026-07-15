<script setup>
import { computed, onMounted, ref } from "vue";
import {
  MessageSquareText,
  MapPin,
  Package,
  RefreshCw,
  Star,
  Store,
} from "@lucide/vue";
import { getOwnerRatings } from "@/modules/accreditation/services/accreditationApi";
import { ensureAccreditationBackendSession } from "@/modules/accreditation/services/accreditationSession";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const isLoading = ref(true);
const errorMessage = ref("");
const ratings = ref(emptyRatings());
const targetFilter = ref("all");

const visibleReviews = computed(() => {
  if (targetFilter.value === "all") return ratings.value.recentReviews;
  return ratings.value.recentReviews.filter(
    (review) => review.targetType === targetFilter.value,
  );
});

const hasAnyRatings = computed(() => Number(ratings.value.summary.count) > 0);

function emptyRatings() {
  return {
    summary: {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    establishments: [],
    products: [],
    tourismAssets: [],
    recentReviews: [],
  };
}

function normalizedDistribution(value = {}) {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...value };
}

function normalizeResponse(result = {}) {
  const summary = result.summary || result.overall || {};
  return {
    summary: {
      average: Number(summary.average || 0),
      count: Number(summary.count || 0),
      distribution: normalizedDistribution(summary.distribution),
    },
    establishments: Array.isArray(result.establishments)
      ? result.establishments
      : [],
    products: Array.isArray(result.products) ? result.products : [],
    tourismAssets: Array.isArray(result.tourismAssets)
      ? result.tourismAssets
      : [],
    recentReviews: Array.isArray(result.recentReviews || result.reviews)
      ? result.recentReviews || result.reviews
      : [],
  };
}

async function loadRatings() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const isConnected = await ensureAccreditationBackendSession(auth);
    if (!isConnected) {
      throw new Error(
        "The demo account could not connect to live rating data. Please try again.",
      );
    }
    ratings.value = normalizeResponse(await getOwnerRatings());
  } catch (error) {
    ratings.value = emptyRatings();
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "Unable to load your ratings right now.";
  } finally {
    isLoading.value = false;
  }
}

function distributionPercent(star) {
  if (!ratings.value.summary.count) return 0;
  return Math.round(
    (Number(ratings.value.summary.distribution?.[star] || 0) /
      ratings.value.summary.count) *
      100,
  );
}

function formatAverage(value) {
  return Number(value || 0).toFixed(1);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function reviewTargetLabel(review) {
  return (
    review.targetName ||
    review.tourismAssetName ||
    review.productName ||
    review.businessName ||
    "Tourism listing"
  );
}

onMounted(loadRatings);
</script>

<template>
  <section class="page owner-ratings-page">
    <div class="page-header">
      <div>
        <h1>Ratings &amp; Reviews</h1>
        <p>
          Monitor what tourists are saying about your establishment and
          products, including tourism assets and destinations.
        </p>
      </div>
      <button
        class="btn outline"
        type="button"
        :disabled="isLoading"
        @click="loadRatings"
      >
        <RefreshCw :size="17" :class="{ spinning: isLoading }" />
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="card ratings-state" role="status">
      Loading your ratings...
    </div>

    <div v-else-if="errorMessage" class="ratings-alert" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadRatings">Try again</button>
    </div>

    <template v-else>
      <div class="rating-overview-grid">
        <article class="card rating-score-card">
          <span class="rating-card-icon"><Star :size="22" /></span>
          <div>
            <p>Overall rating</p>
            <strong v-if="ratings.summary.count">{{
              formatAverage(ratings.summary.average)
            }}</strong>
            <strong v-else class="not-rated">Not rated</strong>
            <span
              v-if="ratings.summary.count"
              class="rating-stars"
              :aria-label="`${formatAverage(ratings.summary.average)} out of 5 stars`"
            >
              <span
                v-for="star in 5"
                :key="star"
                :class="{ filled: star <= Math.round(ratings.summary.average) }"
                >★</span
              >
            </span>
            <small
              >{{ ratings.summary.count }} total review{{
                ratings.summary.count === 1 ? "" : "s"
              }}</small
            >
          </div>
        </article>

        <article class="card rating-metric-card">
          <span><Store :size="21" /></span>
          <div>
            <strong>{{ ratings.establishments.length }}</strong>
            <p>
              Establishment listing{{
                ratings.establishments.length === 1 ? "" : "s"
              }}
            </p>
          </div>
        </article>

        <article class="card rating-metric-card">
          <span><Package :size="21" /></span>
          <div>
            <strong>{{ ratings.products.length }}</strong>
            <p>
              Monitored product{{ ratings.products.length === 1 ? "" : "s" }}
            </p>
          </div>
        </article>

        <article class="card rating-metric-card">
          <span><MapPin :size="21" /></span>
          <div>
            <strong>{{ ratings.tourismAssets.length }}</strong>
            <p>
              Tourism asset{{ ratings.tourismAssets.length === 1 ? "" : "s" }}
              / destination{{ ratings.tourismAssets.length === 1 ? "" : "s" }}
            </p>
          </div>
        </article>

        <article class="card rating-distribution-card">
          <h2>Rating breakdown</h2>
          <div
            v-for="star in [5, 4, 3, 2, 1]"
            :key="star"
            class="distribution-row"
          >
            <span>{{ star }} ★</span>
            <span class="distribution-track"
              ><span :style="{ width: `${distributionPercent(star)}%` }"></span
            ></span>
            <small>{{ ratings.summary.distribution?.[star] || 0 }}</small>
          </div>
        </article>
      </div>

      <section class="card monitored-section">
        <div class="card-header">
          <div>
            <h2>Ratings by listing</h2>
            <p>
              Compare performance across your establishment, products, and
              tourism assets.
            </p>
          </div>
        </div>

        <div
          v-if="
            ratings.establishments.length ||
            ratings.products.length ||
            ratings.tourismAssets.length
          "
          class="listing-grid"
        >
          <article
            v-for="item in ratings.establishments"
            :key="`business-${item.id}`"
            class="listing-rating-card"
          >
            <span class="listing-type"><Store :size="15" /> Establishment</span>
            <h3>{{ item.name || "Business establishment" }}</h3>
            <div v-if="Number(item.count) > 0">
              <strong>{{ formatAverage(item.average) }}</strong
              ><span>★</span><small>{{ item.count || 0 }} reviews</small>
            </div>
            <div v-else class="listing-no-rating">
              <strong>Not rated</strong><small>No reviews yet</small>
            </div>
          </article>
          <article
            v-for="item in ratings.products"
            :key="`product-${item.id}`"
            class="listing-rating-card"
          >
            <span class="listing-type"><Package :size="15" /> Product</span>
            <h3>{{ item.name }}</h3>
            <div v-if="Number(item.count) > 0">
              <strong>{{ formatAverage(item.average) }}</strong
              ><span>★</span><small>{{ item.count || 0 }} reviews</small>
            </div>
            <div v-else class="listing-no-rating">
              <strong>Not rated</strong><small>No reviews yet</small>
            </div>
          </article>
          <article
            v-for="item in ratings.tourismAssets"
            :key="`tourism-asset-${item.id}`"
            class="listing-rating-card"
          >
            <span class="listing-type"
              ><MapPin :size="15" /> Tourism Asset / Destination</span
            >
            <h3>{{ item.name || "Tourism asset" }}</h3>
            <div v-if="Number(item.count) > 0">
              <strong>{{ formatAverage(item.average) }}</strong
              ><span aria-hidden="true">&#9733;</span
              ><small>{{ item.count || 0 }} reviews</small>
            </div>
            <div v-else class="listing-no-rating">
              <strong>Not rated</strong><small>No reviews yet</small>
            </div>
          </article>
        </div>
        <div v-else class="ratings-empty">
          <Package :size="34" />
          <h3>No public listings to monitor yet</h3>
          <p>
            Your approved establishment, published products, and tourism assets
            will appear here.
          </p>
        </div>
      </section>

      <section class="card recent-reviews-section">
        <div class="card-header reviews-heading">
          <div>
            <h2>Recent tourist reviews</h2>
            <p>Newest feedback across all of your listings.</p>
          </div>
          <select v-model="targetFilter" aria-label="Filter recent reviews">
            <option value="all">All listings</option>
            <option value="business">Establishment</option>
            <option value="product">Products</option>
            <option value="tourism_asset">Tourism Assets / Destinations</option>
          </select>
        </div>

        <div v-if="visibleReviews.length" class="owner-review-list">
          <article
            v-for="review in visibleReviews"
            :key="review.id"
            class="owner-review-item"
          >
            <span class="review-avatar">{{
              String(review.author || "T")
                .charAt(0)
                .toUpperCase()
            }}</span>
            <div class="review-copy">
              <div class="review-meta">
                <div>
                  <strong>{{ review.author || "Tourist" }}</strong
                  ><span>{{ reviewTargetLabel(review) }}</span>
                </div>
                <div>
                  <span class="review-stars"
                    >{{ "★".repeat(review.rating)
                    }}{{ "☆".repeat(5 - review.rating) }}</span
                  ><small>{{ formatDate(review.createdAt) }}</small>
                </div>
              </div>
              <p v-if="review.comment">{{ review.comment }}</p>
              <p v-else class="muted">
                The tourist left a star rating without a written comment.
              </p>
            </div>
          </article>
        </div>
        <div v-else class="ratings-empty compact-empty">
          <MessageSquareText :size="32" />
          <h3>
            {{
              hasAnyRatings
                ? "No reviews match this filter"
                : "No tourist reviews yet"
            }}
          </h3>
          <p>
            New ratings submitted on the public tourism website will appear
            here.
          </p>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.owner-ratings-page {
  display: grid;
  gap: 24px;
}
.page-header .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.spinning {
  animation: spin 0.8s linear infinite;
}
.ratings-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff7f7;
  color: #991b1b;
}
.ratings-alert p {
  margin: 0;
}
.ratings-alert button {
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: 700;
  cursor: pointer;
}
.rating-overview-grid {
  display: grid;
  grid-template-columns: 1.35fr repeat(3, 0.8fr) 1.35fr;
  gap: 16px;
}
.rating-score-card,
.rating-metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 150px;
}
.rating-card-icon,
.rating-metric-card > span {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fff5d6;
  color: #9a6700;
}
.rating-score-card p,
.rating-metric-card p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}
.rating-score-card strong {
  display: inline-block;
  margin: 2px 8px 0 0;
  font-size: 38px;
  line-height: 1;
}
.rating-score-card strong.not-rated {
  font-size: 22px;
}
.rating-score-card small {
  display: block;
  margin-top: 8px;
  color: #64748b;
}
.rating-stars {
  color: #cbd5e1;
  letter-spacing: 2px;
}
.rating-stars .filled {
  color: #e5a400;
}
.rating-metric-card strong {
  font-size: 32px;
}
.rating-distribution-card {
  min-height: 150px;
}
.rating-distribution-card h2 {
  margin-bottom: 12px;
  font-size: 15px;
}
.distribution-row {
  display: grid;
  grid-template-columns: 30px minmax(80px, 1fr) 24px;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  font-size: 11px;
  color: #64748b;
}
.distribution-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #e9eef2;
}
.distribution-track > span {
  height: 100%;
  display: block;
  border-radius: inherit;
  background: #e5a400;
}
.distribution-row small {
  text-align: right;
}
.ratings-state {
  padding: 48px;
  text-align: center;
  color: #64748b;
}
.monitored-section,
.recent-reviews-section {
  overflow: hidden;
  padding: 0;
}
.monitored-section .card-header,
.recent-reviews-section .card-header {
  padding: 22px 24px;
}
.card-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}
.listing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 0 24px 24px;
}
.listing-rating-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e6ece9;
  border-radius: 12px;
  background: #fbfdfc;
}
.listing-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #36725c;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.listing-rating-card h3 {
  min-height: 44px;
  margin: 12px 0 18px;
  font-size: 16px;
}
.listing-rating-card div {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.listing-rating-card div strong {
  font-size: 28px;
}
.listing-rating-card div span {
  color: #e5a400;
}
.listing-rating-card div small {
  margin-left: auto;
  color: #64748b;
}
.listing-rating-card .listing-no-rating strong {
  font-size: 16px;
}
.reviews-heading {
  gap: 18px;
}
.reviews-heading select {
  min-width: 150px;
  padding: 9px 32px 9px 11px;
  border: 1px solid #d9e1dd;
  border-radius: 8px;
  background: #fff;
}
.owner-review-list {
  padding: 0 24px 10px;
}
.owner-review-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 13px;
  padding: 18px 0;
  border-top: 1px solid #edf0ee;
}
.review-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e0efe8;
  color: #245844;
  font-weight: 800;
}
.review-meta {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.review-meta > div {
  display: grid;
}
.review-meta > div:last-child {
  justify-items: end;
}
.review-meta span:not(.review-stars),
.review-meta small {
  color: #64748b;
  font-size: 12px;
}
.review-stars {
  color: #d89b00;
  letter-spacing: 1px;
}
.review-copy p {
  margin: 10px 0 0;
  color: #374151;
  line-height: 1.6;
}
.ratings-empty {
  display: grid;
  justify-items: center;
  padding: 42px 24px;
  color: #64748b;
  text-align: center;
}
.ratings-empty h3 {
  margin: 12px 0 4px;
  color: #1f2937;
}
.ratings-empty p {
  margin: 0;
}
.compact-empty {
  border-top: 1px solid #edf0ee;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 1100px) {
  .rating-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .listing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 680px) {
  .rating-overview-grid,
  .listing-grid {
    grid-template-columns: 1fr;
  }
  .review-meta {
    display: grid;
  }
  .review-meta > div:last-child {
    justify-items: start;
  }
  .owner-review-list {
    padding-inline: 18px;
  }
  .ratings-alert {
    align-items: flex-start;
  }
}
</style>
