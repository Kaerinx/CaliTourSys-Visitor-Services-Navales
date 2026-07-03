<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getEvents,
  getMapLocations,
  getMuseumItems,
  getPromotionalPackages,
  getPromotionalProducts,
  getTourismAssets,
} from '../services/promotionService'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import AccreditationBadge from '../components/AccreditationBadge.vue'
import heroBanner from '@/assets/hero-banner.jpg'

const heroBannerUrl = `url(${heroBanner})`

const products = ref([])

const destinations = ref([])
const museumItems = ref([])
const packages = ref([])

const events = ref([])

const locations = ref([])

const isLoading = ref(true)
const errorMessage = ref('')
const failedProductImages = ref(new Set())

const exploreCategories = [
  {
    label: 'Nature',
    description: 'Beaches, rivers, and the foothills of Mt. Isarog.',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg',
    to: '/destinations',
  },
  {
    label: 'Cultural',
    description: 'Centuries-old churches and living heritage sites.',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg',
    to: '/destinations',
  },
  {
    label: 'Food',
    description: 'OTOP pasalubong and local Bicol flavors.',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg',
    to: '/products',
  },
  {
    label: 'Events',
    description: 'Festivals, fiestas, and seasonal celebrations.',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
    to: '/events',
  },
]

// Derived from the real map locations returned by the API — no fabricated counts.
const filters = computed(() => {
  const grouped = new Map()
  locations.value.forEach((location) => {
    const label = location.category || 'Other'
    const current = grouped.get(label) || { label, count: 0, active: true, color: location.color }
    current.count += 1
    grouped.set(label, current)
  })
  return [...grouped.values()].slice(0, 5)
})

function productImageKey(product) {
  return product.apiId || product.id || product.slug || product.name
}

function hasProductImage(product) {
  return Boolean(product.imageUrl) && !failedProductImages.value.has(productImageKey(product))
}

function markProductImageFailed(product) {
  failedProductImages.value = new Set([...failedProductImages.value, productImageKey(product)])
}

async function loadHomeData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [productData, eventData, assetData, locationData, museumData, packageData] =
      await Promise.all([
        getPromotionalProducts({ limit: 8, sort: 'featured' }),
        getEvents({ featured: true, limit: 4 }),
        getTourismAssets({ limit: 3, sort: '-updatedAt' }),
        getMapLocations({ format: 'list' }),
        getMuseumItems({ featured: true, limit: 3 }),
        getPromotionalPackages(),
      ])

    products.value = productData
    events.value = eventData
    destinations.value = assetData.slice(0, 3)
    locations.value = locationData.slice(0, 5)
    museumItems.value = museumData.slice(0, 3)
    packages.value = packageData.slice(0, 3)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public tourism content.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadHomeData)
</script>

<template>
  <div class="twbis-home">
    <PromotionNavbar />

    <main>
      <section class="hero-section">
        <div class="hero-section__inner">
          <div class="hero-copy">
            <p class="eyebrow hero-copy__eyebrow"><span></span>Calabanga Camarines Sur</p>
            <h1>Discover the Heart of Bicol</h1>
            <p>
              Explore Calabanga's coastal wonders, centuries-old churches, and the local treasures
              of its local producers.
            </p>
            <div class="hero-copy__actions">
              <RouterLink to="/destinations" class="button button--white">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m14.8 9.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z" />
                </svg>
                Start exploring
              </RouterLink>
              <RouterLink to="/products" class="button button--white-ghost"
                >Shop local products</RouterLink
              >
            </div>
          </div>
        </div>
      </section>

      <section class="category-explore" aria-labelledby="category-explore-title">
        <div class="page-shell">
          <div class="category-explore__head">
            <p class="eyebrow">Discover Calabanga</p>
            <h2 id="category-explore-title">Explore by Category</h2>
            <p>
              Find your way around Calabanga — from coastlines and heritage churches to local
              flavors and festivals.
            </p>
          </div>

          <div class="category-explore__grid">
            <RouterLink
              v-for="category in exploreCategories"
              :key="category.label"
              :to="category.to"
              class="category-tile"
              :aria-label="`Explore ${category.label}`"
            >
              <span
                class="category-tile__media"
                :style="{ backgroundImage: `url(${category.image})` }"
              ></span>
              <span class="category-tile__overlay"></span>
              <span class="category-tile__content">
                <strong class="category-tile__title">{{ category.label }}</strong>
                <span class="category-tile__desc">{{ category.description }}</span>
                <span class="category-tile__cta">
                  Explore
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section v-if="isLoading || errorMessage" class="api-status page-shell">
        <p v-if="isLoading">Loading the latest public tourism content...</p>
        <p v-else>{{ errorMessage }}</p>
      </section>

      <section class="content-section content-section--white">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Featured Destinations</h2>
              <p>
                Start with visitor-ready places across Calabanga's coast, heritage sites, food
                stops, and nature routes.
              </p>
            </div>
            <RouterLink to="/destinations">Explore destinations -></RouterLink>
          </div>

          <div class="feature-grid feature-grid--three">
            <p v-if="!isLoading && destinations.length === 0" class="empty-copy">
              No featured destinations are available yet.
            </p>
            <RouterLink
              v-for="destination in destinations"
              :key="destination.id"
              :to="`/destinations?location=${destination.id}`"
              class="destination-card"
            >
              <span
                class="destination-card__media"
                :style="{
                  '--card-accent': destination.accent || destination.color || '#1b4332',
                  backgroundImage: destination.imageUrl
                    ? `url(${destination.imageUrl})`
                    : undefined,
                }"
              ></span>
              <span class="destination-card__body">
                <strong>{{ destination.name }}</strong>
                <span>{{
                  destination.location || destination.distance || 'Calabanga, Camarines Sur'
                }}</span>
                <p>{{ destination.description || destination.desc }}</p>
                <span class="card-link">View destination -></span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="content-section content-section--white">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Featured Local Products</h2>
              <p>Discover food, crafts, and local products from accredited Calabanga producers.</p>
            </div>
            <RouterLink to="/products">Shop local products -></RouterLink>
          </div>

          <div class="product-grid product-grid--three">
            <p v-if="!isLoading && products.length === 0" class="empty-copy">
              No published products are available yet.
            </p>
            <RouterLink
              v-for="product in products.slice(0, 3)"
              :key="product.id"
              :to="`/products/${product.id}`"
              class="product-card product-card--home product-card--featured"
            >
              <span
                class="product-card__image"
                :style="{ '--card-accent': product.accent || '#1b4332' }"
              >
                <img
                  v-if="hasProductImage(product)"
                  :src="product.imageUrl"
                  :alt="`${product.name} product photo`"
                  loading="lazy"
                  @error="markProductImageFailed(product)"
                />
                <span v-else class="product-card__placeholder" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <path d="M12 17h24l-2 22H14L12 17Z" />
                    <path d="M18 17a6 6 0 0 1 12 0" />
                    <path d="M18 28h12" />
                  </svg>
                </span>
                <AccreditationBadge v-if="product.accredited" floating />
              </span>
              <span class="product-card__body">
                <span class="category-badge">{{ product.category }}</span>
                <strong>{{ product.name }}</strong>
                <span class="producer-line">
                  {{ product.producer }}
                  <span class="verified-dot">âœ“</span>
                </span>
                <span class="product-card__footer">
                  <span>{{ product.price }}</span>
                  <span>View product -></span>
                </span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="content-section content-section--white">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Featured Tourism Packages</h2>
              <p>
                Visitor-ready packages from the Product Development module, prepared for public
                promotion.
              </p>
            </div>
            <RouterLink to="/packages">Browse packages -></RouterLink>
          </div>

          <div class="feature-grid feature-grid--three">
            <p v-if="!isLoading && packages.length === 0" class="empty-copy">
              No tourism packages are available yet.
            </p>
            <RouterLink
              v-for="tourismPackage in packages"
              :key="tourismPackage.id"
              :to="`/packages/${tourismPackage.slug || tourismPackage.id}`"
              class="destination-card"
            >
              <span
                class="destination-card__media"
                :style="{
                  '--card-accent': tourismPackage.accent || '#1b4332',
                  backgroundImage: tourismPackage.imageUrl
                    ? `url(${tourismPackage.imageUrl})`
                    : undefined,
                }"
              ></span>
              <span class="destination-card__body">
                <strong>{{ tourismPackage.name }}</strong>
                <span>{{ tourismPackage.estimatedDuration || 'Duration to be confirmed' }}</span>
                <p v-if="tourismPackage.remarks">{{ tourismPackage.remarks }}</p>
                <span class="card-link">View package -></span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="content-section content-section--warm">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Explore Calabanga</h2>
              <p>Curated locations from the public tourism records and map database.</p>
            </div>
            <RouterLink to="/destinations">Explore map -></RouterLink>
          </div>

          <div class="map-preview">
            <aside class="map-preview__panel">
              <p class="eyebrow">Filter</p>
              <h3>Find your way</h3>
              <div class="filter-list">
                <label v-for="filter in filters" :key="filter.label" class="filter-row">
                  <span class="fake-check" :class="{ 'fake-check--active': filter.active }">
                    <span v-if="filter.active">âœ“</span>
                  </span>
                  <span class="filter-dot" :style="{ backgroundColor: filter.color }"></span>
                  <span>{{ filter.label }}</span>
                  <small>{{ filter.count }}</small>
                </label>
              </div>

              <div class="map-preview__results">
                <p>
                  Showing {{ locations.length }} highlight{{ locations.length === 1 ? '' : 's' }}
                </p>
                <div
                  v-for="location in locations.slice(0, 3)"
                  :key="location.id"
                  class="result-row"
                >
                  <span :style="{ backgroundColor: location.color }"></span>
                  <strong>{{ location.name }}</strong>
                  <small>{{ location.distance }}</small>
                </div>
              </div>
            </aside>

            <div class="map-preview__canvas">
              <span
                v-for="(location, index) in locations"
                :key="location.id"
                class="map-pin"
                :class="{ 'map-pin--selected': index === 1 }"
                :style="{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                  '--pin-color': location.color,
                }"
              >
                <svg viewBox="0 0 28 36" aria-hidden="true">
                  <path
                    d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z"
                  />
                  <circle cx="14" cy="14" r="5" />
                </svg>
              </span>
              <RouterLink to="/destinations" class="map-preview__button">
                <span>-></span>
                Explore map
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section content-section--warm">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Upcoming Festivals &amp; Events</h2>
              <p>
                Plan your trip around Calabanga's festivals, fiestas, and seasonal celebrations.
              </p>
            </div>
            <RouterLink to="/events">View all events -></RouterLink>
          </div>

          <div class="event-grid">
            <p v-if="!isLoading && events.length === 0" class="empty-copy">
              No upcoming events are available yet.
            </p>
            <RouterLink v-for="event in events" :key="event.id" to="/events" class="event-card">
              <span
                class="event-card__image"
                :style="{
                  '--event-accent': event.accent,
                  backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
                }"
              >
                <span class="date-badge">
                  <strong>{{ event.day }}</strong>
                  <small>{{ event.month }}</small>
                </span>
              </span>
              <span class="event-card__body">
                <span class="category-badge">{{ event.category }}</span>
                <strong>{{ event.title }}</strong>
                <span class="event-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                  {{ event.location }}
                </span>
                <span class="event-desc">{{ event.desc }}</span>
                <span class="event-card__link">View event -></span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="content-section content-section--white">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Museum &amp; Culture Preview</h2>
              <p>Explore stories, artifacts, and cultural memory from Calabanga's communities.</p>
            </div>
            <RouterLink to="/promotion/museum">Visit virtual museum -></RouterLink>
          </div>

          <div class="culture-grid">
            <p v-if="!isLoading && museumItems.length === 0" class="empty-copy">
              No museum highlights are available yet.
            </p>
            <RouterLink
              v-for="artifact in museumItems"
              :key="artifact.id"
              to="/promotion/museum"
              class="culture-card"
            >
              <span
                class="culture-card__media"
                :style="{ '--card-accent': artifact.accent || '#7b341e' }"
              >
                <span class="category-badge">{{ artifact.category }}</span>
              </span>
              <span class="culture-card__body">
                <strong>{{ artifact.name }}</strong>
                <span>{{ artifact.era }}</span>
                <p>{{ artifact.desc }}</p>
                <span class="card-link">View artifact -></span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="trust-strip">
        <div class="page-shell trust-strip__inner">
          <div>
            <span class="trust-strip__badge">
              <AccreditationBadge />
              LGU Accredited
            </span>
            <p>Every producer on Love Calabanga is vetted and accredited by LGU Calabanga.</p>
          </div>
          <RouterLink to="/products">View accredited products -></RouterLink>
        </div>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.twbis-home {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

.page-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
}

.hero-section {
  width: 100%;
  max-width: none;
  min-height: 88vh;
  margin: 0;
  text-align: left;
  /* Calabanga banner photo, darkened with a brand-green wash (heavier on the
     left) so the white hero copy stays legible. */
  background-image:
    linear-gradient(
      90deg,
      rgba(16, 40, 29, 0.88) 0%,
      rgba(20, 47, 35, 0.62) 45%,
      rgba(20, 47, 35, 0.35) 100%
    ),
    linear-gradient(180deg, rgba(16, 40, 29, 0.15), rgba(16, 40, 29, 0.55)), v-bind(heroBannerUrl);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-section__inner {
  width: min(100% - 48px, 1120px);
  min-height: 88vh;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 100px 0 140px;
}

.hero-copy {
  max-width: 560px;
  color: #ffffff;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-copy__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.hero-copy__eyebrow span {
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.6);
}

h1,
h2,
h3 {
  margin: 0;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  max-width: 560px;
  margin-top: 18px;
  color: #ffffff;
  font-size: 56px;
  font-weight: 700;
  line-height: 1.05;
}

.hero-copy p:last-of-type {
  max-width: 560px;
  margin: 24px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
}

.hero-copy__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.button {
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.button:active {
  transform: scale(0.98);
}

.button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.button--white {
  background: #ffffff;
  color: #1b4332;
}

.button--white:hover {
  background: #f2f0eb;
}

.button--white-ghost {
  border: 1.5px solid #ffffff;
  color: #ffffff;
}

.button--white-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Explore by Category — dedicated section below the hero */
.category-explore {
  padding: 80px 0;
  background: #ffffff;
}

.category-explore__head {
  max-width: 640px;
  margin-bottom: 40px;
}

.category-explore__head .eyebrow {
  color: #b5451b;
}

.category-explore__head h2 {
  margin: 8px 0;
  font-size: 32px;
  font-weight: 600;
}

.category-explore__head p {
  margin: 0;
  color: #5c5c5c;
  font-size: 16px;
}

.category-explore__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.category-tile {
  position: relative;
  display: flex;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
  isolation: isolate;
  text-decoration: none;
  border: 1px solid #e8e4dc;
}

.category-tile__media {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.category-tile__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(16, 40, 29, 0.1) 0%,
    rgba(16, 40, 29, 0.35) 45%,
    rgba(16, 40, 29, 0.82) 100%
  );
  transition: opacity 0.35s ease;
}

.category-tile__content {
  position: relative;
  z-index: 2;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
  color: #ffffff;
}

.category-tile__title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.category-tile__desc {
  max-width: 34ch;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  /* Hidden by default; slides up + fades in on hover/focus. */
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.category-tile__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  align-self: flex-start;
  height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 14px;
  font-weight: 600;
  /* Hidden by default; reveals with the description. */
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.35s ease 0.04s,
    transform 0.35s ease 0.04s;
}

.category-tile__cta svg {
  width: 18px;
  height: 18px;
}

.category-tile:hover .category-tile__media,
.category-tile:focus-visible .category-tile__media {
  transform: scale(1.08);
}

.category-tile:hover .category-tile__overlay,
.category-tile:focus-visible .category-tile__overlay {
  opacity: 1;
  background: linear-gradient(
    180deg,
    rgba(16, 40, 29, 0.25) 0%,
    rgba(16, 40, 29, 0.55) 45%,
    rgba(16, 40, 29, 0.92) 100%
  );
}

.category-tile:hover .category-tile__desc,
.category-tile:hover .category-tile__cta,
.category-tile:focus-visible .category-tile__desc,
.category-tile:focus-visible .category-tile__cta {
  opacity: 1;
  transform: translateY(0);
}

.category-tile:focus-visible {
  outline: 3px solid #1b4332;
  outline-offset: 2px;
}

/* Tablet: 2 columns */
@media (min-width: 640px) {
  .category-explore__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .category-explore__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Touch / no-hover: reveal description + CTA since there is no hover state */
@media (hover: none) {
  .category-tile__desc,
  .category-tile__cta {
    opacity: 1;
    transform: none;
  }
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  .category-tile__media,
  .category-tile__overlay,
  .category-tile__desc,
  .category-tile__cta {
    transition: none;
  }

  .category-tile:hover .category-tile__media {
    transform: none;
  }

  .category-tile__desc,
  .category-tile__cta {
    opacity: 1;
    transform: none;
  }
}

.content-section {
  padding: 80px 0;
}

.api-status,
.empty-copy {
  color: #5c5c5c;
  font-size: 14px;
}

.api-status {
  padding: 18px 0 0;
}

.empty-copy {
  grid-column: 1 / -1;
  margin: 0;
}

.content-section--white {
  background: #ffffff;
}

.content-section--warm {
  background: #f2f0eb;
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 40px;
  margin-bottom: 34px;
}

/* Title + subtitle stay grouped on the left with a comfortable measure so the
   paragraph never crowds the right-aligned link. */
.section-heading > div {
  max-width: 640px;
}

/* justify-content pushes the "Explore ->" link to the right edge on desktop;
   keep it from shrinking or wrapping. */
.section-heading > a {
  flex: 0 0 auto;
  white-space: nowrap;
}

.section-heading h2 {
  font-size: 32px;
  font-weight: 600;
}

.section-heading p {
  max-width: 600px;
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.section-heading a {
  flex: 0 0 auto;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.product-grid {
  display: grid;
  gap: 24px;
  align-items: stretch;
}

.feature-grid,
.promotion-grid,
.culture-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
  width: 100%;
  overflow: visible;
}

.product-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.product-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.product-card,
.event-card,
.destination-card,
.promotion-card,
.culture-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.product-card:hover,
.event-card:hover,
.destination-card:hover,
.promotion-card:hover,
.culture-card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.product-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  padding: 0;
  color: inherit;
  text-decoration: none;
}

.destination-card,
.promotion-card,
.culture-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  color: inherit;
  text-decoration: none;
}

.product-card--home {
  min-height: 0;
}

.twbis-home .product-card--home span {
  margin-bottom: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
}

.product-card__image,
.event-card__image {
  position: relative;
  display: block;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.26), transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.18), transparent 50%),
    linear-gradient(
      135deg,
      var(--card-accent, #1b4332),
      color-mix(in srgb, var(--card-accent, #1b4332) 60%, white)
    );
}

.twbis-home .product-card--home .product-card__image {
  position: relative;
  display: block;
  flex: 0 0 auto;
  width: 100%;
  height: 188px;
  overflow: hidden;
  border-radius: 0;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.26), transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.18), transparent 50%),
    linear-gradient(
      135deg,
      var(--card-accent, #1b4332),
      color-mix(in srgb, var(--card-accent, #1b4332) 60%, white)
    );
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.twbis-home .product-card--compact .product-card__image {
  height: 164px;
}

.twbis-home .product-card--home .product-card__image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.twbis-home .product-card--home .product-card__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.86);
}

.twbis-home .product-card--home .product-card__placeholder svg {
  width: 62px;
  height: 62px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.product-card__body,
.event-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 16px;
  border-radius: 0;
  background: #ffffff;
}

.twbis-home .product-card--home .product-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 14px 16px 16px;
  border-radius: 0;
  background: #ffffff;
}

.twbis-home .product-card--home .category-badge {
  align-self: flex-start;
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.product-card__body > strong {
  margin-top: 10px;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.twbis-home .product-card--home .producer-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.35;
}

.twbis-home .product-card--home .verified-dot {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #1b7a4a;
  color: #ffffff;
  font-size: 0;
  font-weight: 700;
  line-height: 1;
}

.twbis-home .product-card--home .verified-dot::after {
  width: 6px;
  height: 3px;
  border-bottom: 1.5px solid #ffffff;
  border-left: 1.5px solid #ffffff;
  content: '';
  transform: rotate(-45deg) translate(0, -1px);
}

.twbis-home .product-card--home .product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 500;
}

.twbis-home .product-card--home .product-card__footer span:first-child {
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 700;
}

.twbis-home .product-card--home .product-card__footer span:last-child {
  color: #1b4332;
  font-size: 13px;
  font-weight: 700;
}

.destination-card__media,
.promotion-card__media,
.culture-card__media {
  position: relative;
  height: 178px;
  display: block;
  overflow: hidden;
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, 0.28), transparent 42%),
    radial-gradient(circle at 74% 72%, rgba(0, 0, 0, 0.14), transparent 54%),
    linear-gradient(
      135deg,
      var(--card-accent, #1b4332),
      color-mix(in srgb, var(--card-accent, #1b4332) 62%, white)
    );
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.promotion-card__media .category-badge,
.culture-card__media .category-badge {
  position: absolute;
  left: 14px;
  bottom: 14px;
}

.destination-card__body,
.promotion-card__body,
.culture-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  background: #ffffff;
}

.destination-card__body > strong,
.promotion-card__body > strong,
.culture-card__body > strong {
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.destination-card__body > span:not(.card-link),
.culture-card__body > span:not(.card-link) {
  color: #5c5c5c;
  font-size: 13px;
}

.destination-card__body p,
.promotion-card__body p,
.culture-card__body p {
  margin: 0;
  color: #5c5c5c;
  font-size: 14px;
  line-height: 1.5;
}

.card-link {
  margin-top: auto;
  padding-top: 14px;
  color: #1b4332;
  font-size: 13px;
  font-weight: 700;
}

.map-preview {
  height: 480px;
  display: grid;
  grid-template-columns: 320px 1fr;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #1b4332;
}

.map-preview__panel {
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.96);
  border-right: 1px solid #e8e4dc;
}

.map-preview__panel h3 {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}

.filter-list {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.filter-row {
  display: grid;
  grid-template-columns: 16px 8px 1fr auto;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
}

.fake-check {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1.5px solid #5c5c5c;
  border-radius: 4px;
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
}

.fake-check--active {
  border-color: #1b4332;
  background: #1b4332;
}

.filter-dot,
.result-row > span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.filter-row small,
.result-row small {
  color: #5c5c5c;
  font-size: 12px;
}

.map-preview__results {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #e8e4dc;
}

.map-preview__results p {
  margin: 0 0 14px;
  color: #5c5c5c;
  font-size: 12px;
}

.result-row {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.result-row strong {
  overflow: hidden;
  color: #1a1a1a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-preview__canvas {
  position: relative;
  overflow: hidden;
  background-color: #1b4332;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}

.map-pin {
  position: absolute;
  width: 28px;
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.map-pin svg {
  width: 28px;
  height: 36px;
}

.map-pin path {
  fill: var(--pin-color);
}

.map-pin circle {
  fill: #ffffff;
}

.map-pin--selected {
  transform: translate(-50%, -100%) scale(1.25);
}

.map-pin--selected path {
  fill: #b5451b;
}

.map-preview__button {
  position: absolute;
  right: 28px;
  bottom: 28px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}

.map-preview__button span {
  font-size: 24px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.chip {
  height: 36px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.chip--active {
  background: #1b4332;
  color: #ffffff;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.event-card {
  display: flex;
  flex-direction: column;
}

.event-card__image {
  aspect-ratio: 16 / 9;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%),
    linear-gradient(135deg, var(--event-accent), color-mix(in srgb, var(--event-accent) 65%, white));
  background-position: center;
  background-size: cover;
}

.date-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  min-width: 54px;
  display: grid;
  justify-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  line-height: 1;
}

.date-badge strong {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
}

.date-badge small {
  margin-top: 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.event-card__body {
  gap: 10px;
  padding: 20px;
}

.event-card__body > strong {
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
}

.event-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #5c5c5c;
  font-size: 13px;
}

.event-location svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}

.event-desc {
  color: #5c5c5c;
  font-size: 14px;
}

.event-card__link {
  margin-top: auto;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.trust-strip {
  padding: 46px 0;
  background: #ffffff;
  border-top: 1px solid #e8e4dc;
}

.trust-strip__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.trust-strip__inner > div {
  display: flex;
  align-items: center;
  gap: 16px;
}

.trust-strip p {
  margin: 0;
  color: #5c5c5c;
  font-size: 14px;
}

.trust-strip a {
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .product-grid--four,
  .product-grid--three,
  .feature-grid,
  .promotion-grid,
  .culture-grid,
  .event-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-preview {
    grid-template-columns: 280px 1fr;
  }

  .site-footer__main {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .page-shell,
  .site-nav__inner,
  .hero-section__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy {
    display: none;
  }

  .login-button {
    display: none;
  }

  .hero-section,
  .hero-section__inner {
    min-height: 760px;
  }

  h1 {
    font-size: 42px;
  }

  .section-heading,
  .trust-strip__inner,
  .trust-strip__inner > div {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-grid--four,
  .product-grid--three,
  .feature-grid,
  .promotion-grid,
  .culture-grid,
  .event-grid {
    grid-template-columns: 1fr;
  }

  .map-preview {
    height: auto;
    grid-template-columns: 1fr;
  }

  .map-preview__panel {
    border-right: 0;
    border-bottom: 1px solid #e8e4dc;
  }

  .map-preview__canvas {
    min-height: 360px;
  }

  .site-footer__main {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .site-footer__bottom .page-shell {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 0;
  }

  .site-footer__bottom a {
    margin: 0 18px 0 0;
  }
}
</style>
