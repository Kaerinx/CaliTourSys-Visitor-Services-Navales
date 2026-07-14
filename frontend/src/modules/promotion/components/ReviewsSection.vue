<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useVisitorSession } from "../composables/useVisitorSession";
import { getReviews, submitReview } from "../services/reviewsService";

const props = defineProps({
  targetType: {
    type: String,
    required: true,
    validator: (value) =>
      ["product", "destination", "business"].includes(value),
  },
  targetId: {
    type: [String, Number],
    required: true,
  },
  targetName: {
    type: String,
    default: "this place",
  },
});

const route = useRoute();
const router = useRouter();
const { isAuthenticated, visitorName } = useVisitorSession();

const summary = reactive({
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
});
const reviews = ref([]);
const isLoading = ref(true);
const loadError = ref("");

const form = reactive({ rating: 0, comment: "" });
const hoverRating = ref(0);
const isSubmitting = ref(false);
const formError = ref("");
const formSuccess = ref("");

const hasReviews = computed(() => reviews.value.length > 0);

function starsForRow(rating) {
  return [1, 2, 3, 4, 5].map((position) => position <= Math.round(rating));
}

function distributionPercent(star) {
  if (!summary.count) return 0;
  return Math.round((summary.distribution[star] / summary.count) * 100);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function loadReviews() {
  isLoading.value = true;
  loadError.value = "";
  try {
    const data = await getReviews(props.targetType, props.targetId);
    summary.average = data.average;
    summary.count = data.count;
    summary.distribution = data.distribution;
    reviews.value = data.reviews;
  } catch {
    loadError.value =
      "We could not load reviews right now. Please try again later.";
  } finally {
    isLoading.value = false;
  }
}

function setRating(value) {
  form.rating = value;
  if (formError.value) formError.value = "";
}

function openAuth(mode = "login") {
  router.replace({
    path: route.path,
    query: { ...route.query, auth: mode },
  });
}

async function handleSubmit() {
  formError.value = "";
  formSuccess.value = "";

  if (!isAuthenticated.value) {
    openAuth("login");
    return;
  }
  if (!form.rating) {
    formError.value = "Please choose a star rating.";
    return;
  }

  isSubmitting.value = true;
  try {
    await submitReview(props.targetType, props.targetId, {
      rating: form.rating,
      comment: form.comment,
      author: visitorName.value,
    });
    form.rating = 0;
    form.comment = "";
    hoverRating.value = 0;
    formSuccess.value = "Thanks! Your review has been posted.";
    await loadReviews();
  } catch (error) {
    formError.value =
      error?.message || "Your review could not be posted. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => [props.targetType, props.targetId],
  () => loadReviews(),
);

onMounted(loadReviews);
</script>

<template>
  <section class="reviews" aria-labelledby="reviews-title">
    <header class="reviews__header">
      <h2 id="reviews-title" class="reviews__title">Reviews &amp; Ratings</h2>

      <div v-if="summary.count" class="reviews__aggregate">
        <span class="reviews__score">{{ summary.average.toFixed(1) }}</span>
        <span class="reviews__score-max">/ 5</span>
        <span class="reviews__stars" aria-hidden="true">
          <svg
            v-for="(filled, i) in starsForRow(summary.average)"
            :key="i"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            :fill="filled ? '#D4AC0D' : 'none'"
          >
            <path
              d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
              stroke="#D4AC0D"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="reviews__count"
          >{{ summary.count }} review{{ summary.count === 1 ? "" : "s" }}</span
        >
      </div>
    </header>

    <!-- Rating distribution -->
    <div v-if="summary.count" class="reviews__distribution">
      <div
        v-for="star in [5, 4, 3, 2, 1]"
        :key="star"
        class="reviews__dist-row"
      >
        <span class="reviews__dist-label">{{ star }}★</span>
        <span class="reviews__dist-track">
          <span
            class="reviews__dist-fill"
            :style="{ width: `${distributionPercent(star)}%` }"
          ></span>
        </span>
        <span class="reviews__dist-value">{{
          summary.distribution[star]
        }}</span>
      </div>
    </div>

    <!-- Write a review (gated) -->
    <div class="reviews__write">
      <template v-if="isAuthenticated">
        <h3 class="reviews__write-title">
          Share your experience of {{ targetName }}
        </h3>
        <div
          class="reviews__rating-input"
          role="radiogroup"
          aria-label="Your rating"
        >
          <button
            v-for="position in 5"
            :key="position"
            type="button"
            class="reviews__star-btn"
            role="radio"
            :aria-checked="form.rating === position"
            :aria-label="`${position} star${position === 1 ? '' : 's'}`"
            @click="setRating(position)"
            @mouseenter="hoverRating = position"
            @mouseleave="hoverRating = 0"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              :fill="
                position <= (hoverRating || form.rating) ? '#D4AC0D' : 'none'
              "
            >
              <path
                d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
                stroke="#D4AC0D"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <textarea
          v-model="form.comment"
          class="reviews__textarea"
          rows="3"
          maxlength="600"
          placeholder="What did you love? Share tips for other visitors (optional)."
        ></textarea>

        <p v-if="formError" class="reviews__message reviews__message--error">
          {{ formError }}
        </p>
        <p
          v-if="formSuccess"
          class="reviews__message reviews__message--success"
        >
          {{ formSuccess }}
        </p>

        <button
          type="button"
          class="reviews__submit"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? "Posting…" : "Post review" }}
        </button>
      </template>

      <div v-else class="reviews__gate">
        <p>Registered visitors can rate and review this {{ targetType }}.</p>
        <div class="reviews__gate-actions">
          <button
            type="button"
            class="reviews__submit"
            @click="openAuth('login')"
          >
            Log in
          </button>
          <button
            type="button"
            class="reviews__submit reviews__submit--ghost"
            @click="openAuth('register')"
          >
            Create account
          </button>
        </div>
      </div>
    </div>

    <!-- Reviews list -->
    <div class="reviews__list-wrap">
      <p v-if="isLoading" class="reviews__state">Loading reviews…</p>
      <p v-else-if="loadError" class="reviews__state">{{ loadError }}</p>
      <p v-else-if="!hasReviews" class="reviews__state">
        No reviews yet. Be the first to share your experience.
      </p>

      <ul v-else class="reviews__list">
        <li v-for="review in reviews" :key="review.id" class="reviews__item">
          <div class="reviews__item-head">
            <span class="reviews__avatar" aria-hidden="true">{{
              (review.author || "G")[0].toUpperCase()
            }}</span>
            <div>
              <p class="reviews__author">{{ review.author }}</p>
              <p class="reviews__date">{{ formatDate(review.createdAt) }}</p>
            </div>
            <span
              class="reviews__item-stars"
              aria-label="`${review.rating} out of 5`"
            >
              <svg
                v-for="(filled, i) in starsForRow(review.rating)"
                :key="i"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                :fill="filled ? '#D4AC0D' : 'none'"
              >
                <path
                  d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
                  stroke="#D4AC0D"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </div>
          <p v-if="review.comment" class="reviews__comment">
            {{ review.comment }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.reviews {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: "Inter", system-ui, sans-serif;
}

.reviews__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.reviews__title {
  margin: 0;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
  color: #1a1a1a;
}

.reviews__aggregate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviews__score {
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.reviews__score-max {
  font-size: 14px;
  color: #5c5c5c;
}

.reviews__stars {
  display: inline-flex;
  gap: 2px;
}

.reviews__count {
  font-size: 13px;
  color: #5c5c5c;
}

.reviews__distribution {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 360px;
}

.reviews__dist-row {
  display: grid;
  grid-template-columns: 32px 1fr 24px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #5c5c5c;
}

.reviews__dist-track {
  height: 8px;
  border-radius: 999px;
  background: #f2f0eb;
  overflow: hidden;
}

.reviews__dist-fill {
  display: block;
  height: 100%;
  background: #d4ac0d;
}

.reviews__dist-value {
  text-align: right;
}

.reviews__write {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 20px;
  background: #f2f0eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reviews__write-title {
  margin: 0;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.reviews__rating-input {
  display: flex;
  gap: 4px;
}

.reviews__star-btn {
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  line-height: 0;
  border-radius: 8px;
}

.reviews__star-btn:active {
  transform: scale(0.98);
}

.reviews__textarea {
  width: 100%;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  padding: 12px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #1a1a1a;
  background: #ffffff;
  resize: vertical;
}

.reviews__textarea:focus {
  outline: none;
  border-color: #1b4332;
}

.reviews__message {
  margin: 0;
  font-size: 13px;
}

.reviews__message--error {
  color: #c0392b;
}

.reviews__message--success {
  color: #1b7a4a;
}

.reviews__submit {
  align-self: flex-start;
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

.reviews__submit:hover:not(:disabled) {
  background: #14532d;
}

.reviews__submit:active:not(:disabled) {
  transform: scale(0.98);
}

.reviews__submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.reviews__submit--ghost {
  background: transparent;
  border: 1.5px solid #1b4332;
  color: #1b4332;
}

.reviews__submit--ghost:hover:not(:disabled) {
  background: #d8f3dc;
}

.reviews__gate {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #5c5c5c;
  font-size: 14px;
}

.reviews__gate-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.reviews__list-wrap {
  border-top: 1px solid #e8e4dc;
  padding-top: 16px;
}

.reviews__state {
  margin: 0;
  color: #5c5c5c;
  font-size: 14px;
}

.reviews__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 420px;
  overflow-y: auto;
}

.reviews__item {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reviews__item-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reviews__avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #d8f3dc;
  color: #1b4332;
  font-weight: 600;
  flex-shrink: 0;
}

.reviews__author {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.reviews__date {
  margin: 0;
  font-size: 12px;
  color: #5c5c5c;
}

.reviews__item-stars {
  display: inline-flex;
  gap: 2px;
  margin-left: auto;
}

.reviews__comment {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #1a1a1a;
}

@media (max-width: 640px) {
  .reviews {
    padding: 20px;
  }
}
</style>
