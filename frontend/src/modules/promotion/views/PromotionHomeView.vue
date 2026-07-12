<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getEvents,
  getMapLocations,
  getPromotionalPackages,
  getPromotionalProducts,
  getTourismAssets,
} from '../services/promotionService'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import AccreditationBadge from '../components/AccreditationBadge.vue'
import TouristMapBox from '../components/TouristMapBox.vue'
import heroBanner from '@/assets/hero-banner.jpg'
import { SHOW_MUSEUM_MODULE } from '@/config/featureFlags'
import { mapboxAccessToken } from '@/config/mapbox'

const heroBannerUrl = `url(${heroBanner})`
const mapboxToken = mapboxAccessToken
const router = useRouter()

const products = ref([])

const destinations = ref([])
const museumItems = ref([])
const packages = ref([])

const events = ref([])

const locations = ref([])

const isLoading = ref(true)
const errorMessage = ref('')
const failedProductImages = ref(new Set())
const destinationCarousel = ref(null)
const productCarousel = ref(null)
const packageCarousel = ref(null)
const carouselCardsPerPage = ref(4)
const activeCarouselPages = ref({
  destinations: 0,
  products: 0,
  packages: 0,
})
const selectedMapLocationId = ref('')
const isMapCollapsed = ref(false)
const isMapExpanded = ref(false)
const mapRuntimeError = ref('')

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

const mapFeatureCollection = computed(() => ({
  type: 'FeatureCollection',
  features: locations.value
    .map((location) => {
      const latitude = Number(location.latitude)
      const longitude = Number(location.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties: {
          id: location.id,
          slug: location.id,
          label: location.name,
          category: location.category,
          markerColor: location.color,
          primaryImage: location.imageUrl,
          locationType: location.locationType,
          description: location.description,
        },
      }
    })
    .filter(Boolean),
}))

function productImageKey(product) {
  return product.apiId || product.id || product.slug || product.name
}

function hasProductImage(product) {
  return Boolean(product.imageUrl) && !failedProductImages.value.has(productImageKey(product))
}

function markProductImageFailed(product) {
  failedProductImages.value = new Set([...failedProductImages.value, productImageKey(product)])
}

function carouselElement(key) {
  if (key === 'destinations') return destinationCarousel.value
  if (key === 'products') return productCarousel.value
  if (key === 'packages') return packageCarousel.value
  return null
}

function carouselPages(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / carouselCardsPerPage.value))
  return Array.from({ length: totalPages }, (_, index) => index)
}

function activeCarouselPage(key) {
  return activeCarouselPages.value[key] || 0
}

function setActiveCarouselPage(key, page) {
  activeCarouselPages.value = {
    ...activeCarouselPages.value,
    [key]: page,
  }
}

function scrollCarousel(key, direction, totalItems) {
  const currentPage = activeCarouselPage(key)
  scrollToCarouselPage(key, currentPage + direction, totalItems)
}

function scrollToCarouselPage(key, page, totalItems) {
  const carousel = carouselElement(key)
  if (!carousel) return

  const lastPage = Math.max(0, carouselPages(totalItems).length - 1)
  const nextPage = Math.min(Math.max(page, 0), lastPage)

  carousel.scrollTo({
    left: carousel.clientWidth * nextPage,
    behavior: 'smooth',
  })
  setActiveCarouselPage(key, nextPage)
}

function syncCarouselPage(key) {
  const carousel = carouselElement(key)
  if (!carousel?.clientWidth) return

  setActiveCarouselPage(key, Math.round(carousel.scrollLeft / carousel.clientWidth))
}

function updateCardsPerPage() {
  const width = window.innerWidth
  carouselCardsPerPage.value = width >= 1024 ? 4 : width >= 760 ? 2 : 1

  nextTick(() => {
    syncCarouselPage('destinations')
    syncCarouselPage('products')
    syncCarouselPage('packages')
  })
}

function selectMapLocation(id) {
  selectedMapLocationId.value = id
}

function openMapLocationDetails(id = selectedMapLocationId.value) {
  router.push({
    path: '/destinations',
    query: id ? { location: id } : {},
  })
}

function toggleMapCollapsed() {
  const nextCollapsed = !isMapCollapsed.value
  isMapCollapsed.value = nextCollapsed
  if (nextCollapsed) isMapExpanded.value = false
}

function expandMiniMap() {
  isMapCollapsed.value = false
  isMapExpanded.value = true
}

async function loadHomeData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [productData, eventData, assetData, locationData, packageData] =
      await Promise.all([
        getPromotionalProducts({ limit: 8, sort: 'featured' }),
        getEvents({ featured: true, limit: 4 }),
        getTourismAssets({ limit: 8, sort: '-updatedAt' }),
        getMapLocations({ format: 'list' }),
        getPromotionalPackages(),
      ])

    products.value = productData
    events.value = eventData
    destinations.value = assetData.slice(0, 8)
    locations.value = locationData
    museumItems.value = []
    packages.value = packageData.slice(0, 8)
    selectedMapLocationId.value = locationData[0]?.id || ''
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public tourism content.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  updateCardsPerPage()
  window.addEventListener('resize', updateCardsPerPage)
  loadHomeData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCardsPerPage)
})
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

      <section class="content-section content-section--white content-section--featured">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Featured Destinations</h2>
              <p>
                Start with visitor-ready places across Calabanga's coast, heritage sites, food
                stops, and nature routes.
              </p>
            </div>
            <div class="section-heading__actions">
              <RouterLink to="/destinations">Explore destinations -></RouterLink>
            </div>
          </div>

          <div
            class="feature-carousel-shell"
            :class="{ 'feature-carousel-shell--static': carouselPages(destinations.length).length <= 1 }"
          >
            <button
              v-if="carouselPages(destinations.length).length > 1"
              type="button"
              class="carousel-edge carousel-edge--prev"
              aria-label="Previous featured destinations"
              :disabled="activeCarouselPage('destinations') === 0"
              @click="scrollCarousel('destinations', -1, destinations.length)"
            >
              &lt;
            </button>
            <div
              ref="destinationCarousel"
              class="feature-grid feature-grid--three feature-carousel"
              @scroll.passive="syncCarouselPage('destinations')"
            >
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
            <button
              v-if="carouselPages(destinations.length).length > 1"
              type="button"
              class="carousel-edge carousel-edge--next"
              aria-label="Next featured destinations"
              :disabled="
                activeCarouselPage('destinations') ===
                carouselPages(destinations.length).length - 1
              "
              @click="scrollCarousel('destinations', 1, destinations.length)"
            >
              &gt;
            </button>
          </div>

          <div
            v-if="carouselPages(destinations.length).length > 1"
            class="carousel-dots"
            aria-label="Featured destinations carousel pagination"
          >
            <button
              v-for="page in carouselPages(destinations.length)"
              :key="`destination-page-${page}`"
              type="button"
              :class="{ 'carousel-dot--active': activeCarouselPage('destinations') === page }"
              :aria-label="`Go to featured destinations page ${page + 1}`"
              @click="scrollToCarouselPage('destinations', page, destinations.length)"
            ></button>
          </div>
        </div>
      </section>

      <section class="content-section content-section--white content-section--featured">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Featured Local Products</h2>
              <p>Discover food, crafts, and local products from accredited Calabanga producers.</p>
            </div>
            <div class="section-heading__actions">
              <RouterLink to="/products">Shop local products -></RouterLink>
            </div>
          </div>

          <div
            class="feature-carousel-shell"
            :class="{ 'feature-carousel-shell--static': carouselPages(products.length).length <= 1 }"
          >
            <button
              v-if="carouselPages(products.length).length > 1"
              type="button"
              class="carousel-edge carousel-edge--prev"
              aria-label="Previous featured products"
              :disabled="activeCarouselPage('products') === 0"
              @click="scrollCarousel('products', -1, products.length)"
            >
              &lt;
            </button>
            <div
              ref="productCarousel"
              class="product-grid product-grid--three feature-carousel"
              @scroll.passive="syncCarouselPage('products')"
            >
              <p v-if="!isLoading && products.length === 0" class="empty-copy">
                No published products are available yet.
              </p>
              <RouterLink
                v-for="product in products"
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
            <button
              v-if="carouselPages(products.length).length > 1"
              type="button"
              class="carousel-edge carousel-edge--next"
              aria-label="Next featured products"
              :disabled="
                activeCarouselPage('products') === carouselPages(products.length).length - 1
              "
              @click="scrollCarousel('products', 1, products.length)"
            >
              &gt;
            </button>
          </div>

          <div
            v-if="carouselPages(products.length).length > 1"
            class="carousel-dots"
            aria-label="Featured products carousel pagination"
          >
            <button
              v-for="page in carouselPages(products.length)"
              :key="`product-page-${page}`"
              type="button"
              :class="{ 'carousel-dot--active': activeCarouselPage('products') === page }"
              :aria-label="`Go to featured products page ${page + 1}`"
              @click="scrollToCarouselPage('products', page, products.length)"
            ></button>
          </div>
        </div>
      </section>

      <section class="content-section content-section--white content-section--featured">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Featured Tourism Packages</h2>
              <p>
                Visitor-ready packages from the Product Development module, prepared for public
                promotion.
              </p>
            </div>
            <div class="section-heading__actions">
              <RouterLink to="/packages">Browse packages -></RouterLink>
            </div>
          </div>

          <div
            class="feature-carousel-shell"
            :class="{ 'feature-carousel-shell--static': carouselPages(packages.length).length <= 1 }"
          >
            <button
              v-if="carouselPages(packages.length).length > 1"
              type="button"
              class="carousel-edge carousel-edge--prev"
              aria-label="Previous featured packages"
              :disabled="activeCarouselPage('packages') === 0"
              @click="scrollCarousel('packages', -1, packages.length)"
            >
              &lt;
            </button>
            <div
              ref="packageCarousel"
              class="feature-grid feature-grid--three feature-carousel"
              @scroll.passive="syncCarouselPage('packages')"
            >
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
                  <span class="package-price">{{ tourismPackage.price }}</span>
                  <p v-if="tourismPackage.remarks">{{ tourismPackage.remarks }}</p>
                  <span class="card-link">View package -></span>
                </span>
              </RouterLink>
            </div>
            <button
              v-if="carouselPages(packages.length).length > 1"
              type="button"
              class="carousel-edge carousel-edge--next"
              aria-label="Next featured packages"
              :disabled="
                activeCarouselPage('packages') === carouselPages(packages.length).length - 1
              "
              @click="scrollCarousel('packages', 1, packages.length)"
            >
              &gt;
            </button>
          </div>

          <div
            v-if="carouselPages(packages.length).length > 1"
            class="carousel-dots"
            aria-label="Featured packages carousel pagination"
          >
            <button
              v-for="page in carouselPages(packages.length)"
              :key="`package-page-${page}`"
              type="button"
              :class="{ 'carousel-dot--active': activeCarouselPage('packages') === page }"
              :aria-label="`Go to featured packages page ${page + 1}`"
              @click="scrollToCarouselPage('packages', page, packages.length)"
            ></button>
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

      <section v-if="SHOW_MUSEUM_MODULE" class="content-section content-section--white">
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

    <aside
      class="floating-mini-map"
      :class="{
        'floating-mini-map--collapsed': isMapCollapsed,
        'floating-mini-map--expanded': isMapExpanded,
      }"
      aria-label="Sticky Calabanga mini map"
    >
      <div class="floating-mini-map__controls">
        <button
          type="button"
          class="floating-mini-map__control"
          :aria-label="isMapCollapsed ? 'Expand mini map' : 'Minimize mini map'"
          @click="toggleMapCollapsed"
        >
          {{ isMapCollapsed ? '+' : '-' }}
        </button>
        <button
          v-if="!isMapCollapsed"
          type="button"
          class="floating-mini-map__control"
          aria-label="Make mini map larger"
          :disabled="isMapExpanded"
          @click="expandMiniMap"
        >
          +
        </button>
      </div>

      <template v-if="!isMapCollapsed">
        <div class="floating-mini-map__frame">
          <TouristMapBox
            :access-token="mapboxToken"
            :feature-collection="mapFeatureCollection"
            :selected-id="selectedMapLocationId"
            :loading="isLoading"
            :error="errorMessage"
            empty-title="No map-ready locations yet"
            empty-text="Published Calabanga establishments and landmarks will appear here once coordinates are set."
            @select="selectMapLocation"
            @request-details="openMapLocationDetails"
            @map-error="mapRuntimeError = $event"
          />
        </div>

        <div class="floating-mini-map__label">
          <strong>Calabanga</strong>
          <span>{{ mapFeatureCollection.features.length }} map points</span>
        </div>

        <p v-if="mapRuntimeError" class="floating-mini-map__warning">{{ mapRuntimeError }}</p>

        <button type="button" class="floating-mini-map__details" @click="openMapLocationDetails()">
          Explore map
          <span aria-hidden="true">-&gt;</span>
        </button>
      </template>
    </aside>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.twbis-home {
  --home-card-gap: 16px;
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
  gap: var(--home-card-gap);
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

.content-section--featured {
  padding: 44px 0 0;
}

.content-section--featured + .content-section--featured {
  padding-top: 40px;
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

.section-heading a,
.section-heading__actions a {
  flex: 0 0 auto;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.section-heading__actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-heading__actions a {
  white-space: nowrap;
}

.feature-carousel-shell {
  position: relative;
  padding: 0 52px;
}

.feature-carousel-shell--static {
  padding-inline: 0;
}

.carousel-edge {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid #d6d0c6;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(27, 67, 50, 0.12);
  transform: translateY(-50%);
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.carousel-edge--prev {
  left: 0;
}

.carousel-edge--next {
  right: 0;
}

.carousel-edge:hover {
  border-color: #1b4332;
  background: #f2f0eb;
}

.carousel-edge:disabled {
  cursor: default;
  opacity: 0.36;
}

.carousel-edge:disabled:hover {
  border-color: #d6d0c6;
  background: #ffffff;
}

.carousel-edge:active {
  transform: translateY(-50%) scale(0.96);
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 26px;
}

.carousel-dots button {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #b8e7f0;
  cursor: pointer;
  transition:
    background 160ms ease,
    transform 160ms ease,
    width 160ms ease;
}

.carousel-dots button:hover,
.carousel-dots button:focus-visible {
  background: #63c7df;
}

.carousel-dots .carousel-dot--active {
  width: 22px;
  background: #1b4332;
}

.product-grid {
  display: grid;
  gap: var(--home-card-gap);
  align-items: stretch;
}

.feature-grid,
.promotion-grid,
.culture-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--home-card-gap);
  align-items: stretch;
  width: 100%;
  margin-bottom: 0;
  overflow: visible;
}

.product-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.product-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.feature-carousel {
  display: flex;
  grid-template-columns: none;
  gap: var(--home-card-gap);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-padding-inline: 2px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.feature-carousel::-webkit-scrollbar {
  display: none;
}

.feature-carousel > * {
  flex: 0 0 calc((100% - (var(--home-card-gap) * 3)) / 4);
  scroll-snap-align: start;
}

.feature-carousel > .empty-copy {
  flex-basis: 100%;
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

.destination-card__body .package-price {
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 800;
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

.floating-mini-map {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: 135;
  width: min(340px, calc(100vw - 32px));
  height: 238px;
  overflow: hidden;
  border: 1px solid rgba(27, 67, 50, 0.2);
  border-radius: 14px;
  background: #1b4332;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.24);
  transition:
    width 180ms ease,
    height 180ms ease,
    border-radius 180ms ease;
}

.floating-mini-map--collapsed {
  width: 54px;
  height: 54px;
  border-radius: 14px;
}

.floating-mini-map--expanded {
  width: min(520px, calc(100vw - 48px));
  height: min(360px, calc(100vh - 140px));
}

.floating-mini-map__frame {
  position: absolute;
  inset: 0;
}

.floating-mini-map__controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 4;
  display: flex;
  gap: 8px;
}

.floating-mini-map__control {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 8px;
  background: rgba(27, 67, 50, 0.92);
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.floating-mini-map__control:disabled {
  cursor: default;
  opacity: 0.48;
}

.floating-mini-map--collapsed .floating-mini-map__controls {
  inset: 10px;
}

.floating-mini-map__label,
.floating-mini-map__warning {
  position: absolute;
  left: 12px;
  z-index: 3;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 24px rgba(27, 67, 50, 0.16);
}

.floating-mini-map__label {
  top: 56px;
  display: grid;
  gap: 1px;
  padding: 9px 11px;
}

.floating-mini-map__label strong {
  color: #1a1a1a;
  font-size: 13px;
  line-height: 1.2;
}

.floating-mini-map__label span {
  color: #5c5c5c;
  font-size: 11px;
}

.floating-mini-map__warning {
  right: 12px;
  bottom: 48px;
  margin: 0;
  padding: 9px 11px;
  color: #7a2d0e;
  font-size: 12px;
  line-height: 1.35;
}

.floating-mini-map__details {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
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
  gap: var(--home-card-gap);
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

@media (max-width: 1023px) {
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

  .feature-carousel {
    display: flex;
  }

  .feature-carousel > * {
    flex-basis: calc((100% - var(--home-card-gap)) / 2);
  }

  .floating-mini-map {
    width: min(300px, calc(100vw - 32px));
    height: 208px;
  }

  .floating-mini-map--expanded {
    width: min(440px, calc(100vw - 32px));
    height: min(320px, calc(100vh - 120px));
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
  .section-heading__actions,
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

  .feature-carousel {
    display: flex;
  }

  .feature-carousel-shell {
    padding: 0 42px;
  }

  .feature-carousel-shell--static {
    padding-inline: 0;
  }

  .carousel-edge {
    width: 32px;
    height: 36px;
    font-size: 22px;
  }

  .feature-carousel > * {
    flex-basis: 100%;
  }

  .floating-mini-map {
    right: 16px;
    bottom: 76px;
    width: min(280px, calc(100vw - 32px));
    height: 190px;
  }

  .floating-mini-map--collapsed {
    width: 54px;
    height: 54px;
  }

  .floating-mini-map--expanded {
    width: calc(100vw - 32px);
    height: min(300px, calc(100vh - 112px));
  }

  .floating-mini-map__label {
    top: 52px;
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
