<script setup>
import PromotionFooter from '../components/PromotionFooter.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import { computed, onMounted, ref } from 'vue'
import { getAccreditedBusinesses } from '../services/promotionService'

const businesses = ref([])
const searchQuery = ref('')
const selectedRatings = ref([])
const selectedBarangays = ref([])
const selectedTypes = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const ratingOptions = [5, 4, 3, 2, 1]

const barangayOptions = computed(() =>
  [...new Set(businesses.value.map((business) => business.barangay).filter(Boolean))].sort(),
)

const typeOptions = computed(() =>
  [...new Set(businesses.value.map((business) => business.type).filter(Boolean))].sort(),
)

const businessTypeLabel = computed(() => {
  if (selectedTypes.value.length === 0) {
    return 'Business Type'
  }

  if (selectedTypes.value.length === 1) {
    return selectedTypes.value[0]
  }

  return `${selectedTypes.value.length} types selected`
})

const filteredBusinesses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return businesses.value.filter((business) => {
    const rating = businessRating(business)
    const matchesRating =
      selectedRatings.value.length === 0 ||
      selectedRatings.value.some((minimumRating) => rating >= minimumRating)
    const matchesBarangay =
      selectedBarangays.value.length === 0 || selectedBarangays.value.includes(business.barangay)
    const matchesType =
      selectedTypes.value.length === 0 || selectedTypes.value.includes(business.type)
    const matchesQuery =
      !query ||
      [business.name, business.barangay, business.type]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesRating && matchesBarangay && matchesType && matchesQuery
  })
})

function initials(name) {
  return String(name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function businessRating(business) {
  const rating = Number(business.ratingAverage)
  return Number.isFinite(rating) ? Math.min(Math.max(rating, 0), 5) : 5
}

function formattedRating(business) {
  return businessRating(business).toFixed(1)
}

function ratingStars(rating) {
  return Array.from({ length: rating }, () => '\u2605').join('')
}

function filterId(group, value) {
  return `${group}-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

async function loadBusinesses() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    businesses.value = await getAccreditedBusinesses()
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load accredited establishments.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadBusinesses)
</script>

<template>
  <div class="establishments-page">
    <PromotionNavbar />

    <main>
      <section class="establishments-hero">
        <div class="page-shell establishments-hero__inner">
          <div>
            <p class="eyebrow">LGU Accredited</p>
            <h1>Accredited Establishments</h1>
            <p>
              Browse tourism businesses and local producers officially accredited by the LGU Tourism
              Office.
            </p>
          </div>

          <div class="hero-stat" aria-label="Accredited establishment count">
            <strong>{{ businesses.length }}</strong>
            <span>verified businesses</span>
          </div>
        </div>
      </section>

      <section class="directory-section">
        <div class="directory-shell">
          <aside class="filter-panel" aria-label="Accredited establishment filters">
            <section>
              <h2>Star Rating</h2>
              <label
                v-for="rating in ratingOptions"
                :key="rating"
                class="filter-check"
                :for="filterId('rating', rating)"
              >
                <input
                  :id="filterId('rating', rating)"
                  v-model="selectedRatings"
                  type="checkbox"
                  :value="rating"
                />
                <span class="filter-stars">
                  <span aria-hidden="true">{{ ratingStars(rating) }}</span>
                </span>
              </label>
            </section>

            <section>
              <h2>Barangay</h2>
              <label
                v-for="barangay in barangayOptions"
                :key="barangay"
                class="filter-check"
                :for="filterId('barangay', barangay)"
              >
                <input
                  :id="filterId('barangay', barangay)"
                  v-model="selectedBarangays"
                  type="checkbox"
                  :value="barangay"
                />
                <span>{{ barangay }}</span>
              </label>
            </section>
          </aside>

          <div class="directory-content">
            <div class="directory-toolbar">
              <label class="search-field">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
                <input v-model="searchQuery" placeholder="Search..." />
              </label>

              <details class="type-dropdown">
                <summary>
                  <span>{{ businessTypeLabel }}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>

                <div class="type-dropdown__menu">
                  <label
                    v-for="type in typeOptions"
                    :key="type"
                    class="filter-check type-dropdown__option"
                    :for="filterId('type', type)"
                  >
                    <input
                      :id="filterId('type', type)"
                      v-model="selectedTypes"
                      type="checkbox"
                      :value="type"
                    />
                    <span>{{ type }}</span>
                  </label>
                </div>
              </details>
            </div>

            <div class="result-summary">
              <p>
                Showing <strong>{{ filteredBusinesses.length }}</strong>
                {{ filteredBusinesses.length === 1 ? 'establishment' : 'establishments' }}
              </p>
            </div>

            <div class="establishments-container">
              <div v-if="isLoading" class="directory-state">Loading accredited establishments...</div>
              <div v-else-if="errorMessage" class="directory-state">{{ errorMessage }}</div>
              <div v-else-if="filteredBusinesses.length === 0" class="empty-state">
                <div></div>
                <h2>No establishments found</h2>
                <p>Try a different search, rating, barangay, or business type.</p>
              </div>

              <div v-else class="business-grid">
                <RouterLink
                  v-for="business in filteredBusinesses"
                  :key="business.id"
                  class="business-card"
                  :to="{ name: 'promotion-establishment-information', params: { slug: business.slug || business.id } }"
                >
                  <div class="business-card__media">
                    <img
                      v-if="business.imageUrl"
                      :src="business.imageUrl"
                      :alt="`${business.name} cover photo`"
                    />
                    <span v-else>{{ initials(business.name) }}</span>
                  </div>

                  <div class="business-card__body">
                    <div class="business-card__heading">
                      <h2>{{ business.name }}</h2>
                      <p>{{ business.barangay || 'Barangay to be confirmed' }}</p>
                    </div>

                    <div class="business-card__meta-row">
                      <span>{{ business.type }}</span>
                      <div class="rating-pill" aria-label="Establishment rating">
                        <span aria-hidden="true">&#9733;</span>
                        <strong>{{ formattedRating(business) }}</strong>
                      </div>
                    </div>
                  </div>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.establishments-page {
  min-height: 100vh;
  background: #ffffff;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

.establishments-page,
.establishments-page *,
.establishments-page *::before,
.establishments-page *::after {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
summary {
  font: inherit;
}

.page-shell {
  width: min(100% - 48px, 1280px);
  margin: 0 auto;
}

.establishments-hero {
  padding-top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.establishments-hero__inner {
  min-height: 250px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 48px;
  padding: 54px 0 44px;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  margin-top: 14px;
  color: #1a1a1a;
  font-size: 44px;
  font-weight: 700;
}

.establishments-hero p:last-child {
  max-width: 670px;
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.hero-stat {
  min-width: 210px;
  padding: 24px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #f2f0eb;
}

.hero-stat strong {
  display: block;
  color: #1b4332;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 40px;
  line-height: 1;
}

.hero-stat span {
  display: block;
  margin-top: 8px;
  color: #5c5c5c;
  font-size: 13px;
  font-weight: 500;
}

.directory-section {
  min-height: 60vh;
  padding: 42px 0 96px;
  background: #ffffff;
}

.directory-shell {
  width: min(100% - 48px, 1680px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  align-items: start;
  gap: 36px;
}

.filter-panel {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 24px;
  padding-top: 8px;
  align-self: start;
}

.filter-panel h2 {
  margin: 0 0 12px;
  color: #0b0b0b;
  font-size: 18px;
  font-weight: 800;
}

.filter-check {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #0b0b0b;
  font-size: 14px;
  line-height: 1.35;
  cursor: pointer;
}

.filter-check input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #1b4332;
}

.filter-stars {
  display: inline-flex;
  align-items: center;
  min-width: 98px;
  color: #f5a400;
  font-size: 17px;
  line-height: 1;
  letter-spacing: 1px;
  white-space: nowrap;
}

.directory-content {
  min-width: 0;
}

.directory-toolbar {
  position: relative;
  width: min(980px, 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
}

.search-field {
  position: relative;
  flex: 1 1 auto;
  height: 38px;
  display: flex;
  align-items: center;
  border: 1px solid #cfd8d3;
  border-radius: 4px;
  background: #ffffff;
  color: #5c5c5c;
}

.search-field svg {
  position: absolute;
  left: 12px;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.search-field input {
  width: 100%;
  height: 100%;
  padding: 0 12px 0 34px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1a1a1a;
  font-size: 14px;
}

.type-dropdown {
  position: relative;
  flex: 0 0 220px;
  color: #1a1a1a;
  font-size: 14px;
}

.type-dropdown summary {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid #cfd8d3;
  border-radius: 4px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
  list-style: none;
}

.type-dropdown summary::-webkit-details-marker {
  display: none;
}

.type-dropdown summary span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-dropdown summary svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  fill: none;
  stroke: #1b4332;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 160ms ease;
}

.type-dropdown[open] summary {
  border-color: #1b4332;
}

.type-dropdown[open] summary svg {
  transform: rotate(180deg);
}

.type-dropdown__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  right: 0;
  width: min(300px, 80vw);
  max-height: 280px;
  overflow: auto;
  padding: 10px;
  border: 1px solid #cfd8d3;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 16px 30px rgba(27, 67, 50, 0.12);
}

.type-dropdown__option {
  margin-top: 0;
  padding: 7px 6px;
  border-radius: 4px;
}

.type-dropdown__option:hover {
  background: #f2f7f4;
}

.result-summary {
  width: 100%;
  margin: 0 auto 22px;
}

.result-summary p {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
}

.result-summary strong {
  color: #1a1a1a;
  font-weight: 600;
}

.establishments-container {
  width: 100%;
  margin: 0 auto;
  overflow: visible;
}

.directory-state,
.empty-state {
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
}

.directory-state {
  padding: 28px 24px;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 24px;
  text-align: center;
}

.empty-state div {
  width: 150px;
  height: 150px;
  border: 2px dashed #bdbdbd;
  border-radius: 16px;
}

.empty-state h2 {
  margin-top: 24px;
  color: #1a1a1a;
  font-size: 20px;
}

.empty-state p {
  max-width: 380px;
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 22px;
}

.business-card {
  min-width: 0;
  display: block;
  overflow: hidden;
  border: 1px solid #d7ded9;
  border-radius: 8px;
  background: #ffffff;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.business-card:hover {
  border-color: #1b4332;
  box-shadow: 0 16px 30px rgba(27, 67, 50, 0.1);
  transform: translateY(-2px);
}

.business-card__media {
  width: calc(100% - 16px);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  display: grid;
  place-items: center;
  margin: 8px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.28), transparent 45%),
    linear-gradient(135deg, #1b4332, #1b7a4a);
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
}

.business-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.business-card__body {
  min-width: 0;
  padding: 0 12px 14px;
}

.business-card h2 {
  margin: 0;
  color: #0b0b0b;
  font-size: 18px;
  font-weight: 800;
}

.business-card p {
  margin: 0;
  color: #4f5d58;
  font-size: 12px;
  line-height: 1.35;
}

.business-card__meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: #0b0b0b;
  font-size: 12px;
  font-weight: 600;
}

.rating-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #0b0b0b;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.rating-pill span {
  color: #f5a400;
  font-size: 15px;
  line-height: 1;
}

@media (max-width: 1024px) {
  .establishments-hero__inner,
  .directory-shell {
    grid-template-columns: 1fr;
  }

  .filter-panel {
    position: static;
    padding-top: 0;
  }

  .business-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }

  .hero-stat {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .page-shell,
  .directory-shell {
    width: min(100% - 32px, 1280px);
  }

  h1 {
    font-size: 38px;
  }

  .directory-toolbar {
    width: 100%;
    flex-direction: column;
  }

  .search-field,
  .type-dropdown {
    width: 100%;
    flex-basis: auto;
  }

  .type-dropdown__menu {
    left: 0;
    right: auto;
    width: 100%;
  }

  .business-grid {
    grid-template-columns: 1fr;
  }
}
</style>
