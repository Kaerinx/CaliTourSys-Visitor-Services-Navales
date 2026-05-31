<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPromotionalPackages } from '../services/promotionService'
import { useNewsletterForm } from '../composables/useNewsletterForm'

const packages = ref([])
const searchQuery = ref('')
const activeCategory = ref('All')
const isLoading = ref(false)
const errorMessage = ref('')
const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm()

const packageCategories = [
  {
    name: 'Faith & Heritage',
    slug: 'faith-heritage',
    accent: '#d4ac0d',
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg',
    description: 'Historic churches, devotion sites, and living faith traditions.',
  },
  {
    name: 'Coastal & Island',
    slug: 'coastal-island',
    accent: '#1565c0',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg',
    description: 'Bay views, island stops, and coastal community experiences.',
  },
  {
    name: 'Nature & Eco',
    slug: 'nature-eco',
    accent: '#2d6a4f',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg',
    description: 'Mangroves, rivers, eco-walks, and outdoor learning trips.',
  },
  {
    name: 'Agri-Tourism & Farm',
    slug: 'agri-farm',
    accent: '#7b341e',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kabgan%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
    description: 'Farm escapes, local livelihoods, and countryside visits.',
  },
  {
    name: 'Food & Local Products',
    slug: 'food-products',
    accent: '#b5451b',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
    description: 'Seafood, local producers, and Calabanga-made products.',
  },
]

const categoryFilters = computed(() => [
  { name: 'All', slug: 'All' },
  ...packageCategories.map((category) => ({ name: category.name, slug: category.name })),
])

const categoryCards = computed(() => {
  return packageCategories.map((category) => ({
    ...category,
    count: packages.value.filter((tourismPackage) => tourismPackage.category === category.name).length,
  }))
})

const filteredPackages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return packages.value.filter((tourismPackage) => {
    const searchable = [
      tourismPackage.name,
      tourismPackage.description,
      tourismPackage.targetMarket,
      tourismPackage.estimatedDuration,
    ]
      .join(' ')
      .toLowerCase()
    const matchesQuery = !query || searchable.includes(query)
    const matchesCategory =
      activeCategory.value === 'All' || tourismPackage.category === activeCategory.value

    return matchesQuery && matchesCategory
  })
})

function selectCategory(categoryName) {
  activeCategory.value = categoryName
}

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = 'All'
}

async function loadPackages() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    packages.value = await getPromotionalPackages()
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load tourism packages.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPackages)
</script>

<template>
  <div class="packages-page">
    <header class="site-nav">
      <div class="site-nav__inner">
        <RouterLink to="/" class="brand" aria-label="TWBIS Home">
          <span class="brand__mark">T</span>
          <span class="brand__copy">
            <span class="brand__name">TWBIS</span>
            <span class="brand__tagline">Calabanga Tourism</span>
          </span>
        </RouterLink>

        <nav class="site-nav__links" aria-label="Primary navigation">
          <RouterLink to="/" class="site-nav__link">Home</RouterLink>
          <RouterLink to="/destinations" class="site-nav__link">Destination</RouterLink>
          <RouterLink to="/products" class="site-nav__link">Products</RouterLink>
          <RouterLink to="/packages" class="site-nav__link site-nav__link--active">
            Packages
          </RouterLink>
          <RouterLink to="/events" class="site-nav__link">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
          <RouterLink to="/promotion/inquiry" class="site-nav__link">Inquiries</RouterLink>
        </nav>

        <RouterLink class="login-button" :to="{ path: $route.path, query: { ...$route.query, auth: 'login' } }">
          Login
        </RouterLink>
      </div>
    </header>

    <main>
      <section class="packages-hero">
        <div class="page-shell packages-hero__inner">
          <div class="packages-hero__copy">
            <p class="eyebrow">Tourism Product Development</p>
            <h1>Explore Calabanga through curated packages</h1>
            <p>
              Discover faith, coast, nature, farms, and local flavors through visitor-ready
              experiences prepared by the Tourism Product Development Module.
            </p>
            <div class="hero-actions">
              <a href="#categories" class="primary-link">Browse categories</a>
              <a href="#available-packages" class="secondary-link">View packages</a>
            </div>
          </div>

          <div class="hero-visual" aria-label="Calabanga package highlights">
            <span class="hero-visual__main"></span>
            <span class="hero-visual__tile hero-visual__tile--church"></span>
            <span class="hero-visual__tile hero-visual__tile--bay"></span>
          </div>
        </div>
      </section>

      <section id="categories" class="category-section">
        <div class="page-shell">
          <div class="section-heading">
            <p class="eyebrow">Choose your route</p>
            <h2>Package categories</h2>
            <p>
              Start with the kind of Calabanga experience you want, then browse packages approved
              for public promotion.
            </p>
          </div>

          <div class="category-grid">
            <button
              v-for="category in categoryCards"
              :key="category.slug"
              type="button"
              class="category-card"
              :class="{ 'category-card--active': activeCategory === category.name }"
              :style="{ '--category-accent': category.accent, '--category-image': `url(${category.image})` }"
              @click="selectCategory(category.name)"
            >
              <img class="category-card__image" :src="category.image" :alt="`${category.name} package category`" />
              <span class="category-card__body">
                <strong>{{ category.name }}</strong>
                <small>{{ category.description }}</small>
                <span>
                  {{ category.count }} ready package{{ category.count === 1 ? '' : 's' }}
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section id="available-packages" class="packages-section">
        <div class="page-shell">
          <div class="packages-toolbar">
            <div>
              <p class="eyebrow">Ready packages</p>
              <h2>Available tourism packages</h2>
              <p class="result-count">
                Showing <strong>{{ filteredPackages.length }}</strong> tourism packages
              </p>
            </div>

            <div class="toolbar-controls">
              <label class="search-field">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
                <input v-model="searchQuery" placeholder="Search packages..." />
              </label>
              <button v-if="activeCategory !== 'All' || searchQuery" type="button" @click="clearFilters">
                Clear
              </button>
            </div>
          </div>

          <div class="chip-row">
            <button
              v-for="category in categoryFilters"
              :key="category.slug"
              class="chip"
              :class="{ 'chip--active': activeCategory === category.slug }"
              type="button"
              @click="selectCategory(category.slug)"
            >
              {{ category.name }}
            </button>
          </div>

          <div v-if="isLoading" class="package-grid">
            <div v-for="index in 3" :key="index" class="package-card package-card--loading">
              <span class="skeleton skeleton--title"></span>
              <span class="skeleton"></span>
              <span class="skeleton skeleton--short"></span>
            </div>
          </div>

          <div v-else-if="errorMessage" class="empty-state">
            <h2>Unable to load packages</h2>
            <p>{{ errorMessage }}</p>
            <button type="button" @click="clearFilters">Clear filters</button>
          </div>

          <div v-else-if="filteredPackages.length === 0" class="empty-state">
            <h2>No packages found</h2>
            <p>Try another search term or target market.</p>
            <button type="button" @click="clearFilters">Clear filters</button>
          </div>

          <div v-else class="package-grid">
            <RouterLink
              v-for="tourismPackage in filteredPackages"
              :key="tourismPackage.id"
              class="package-card"
              :to="`/packages/${tourismPackage.id}`"
            >
              <img
                class="package-card__image"
                :src="tourismPackage.imageUrl"
                :alt="`${tourismPackage.name} package image`"
                loading="lazy"
              />
              <span class="status-pill">{{ tourismPackage.packageStatus }}</span>
              <span class="package-category">{{ tourismPackage.category }}</span>
              <h2>{{ tourismPackage.name }}</h2>
              <p>{{ tourismPackage.description }}</p>

              <span class="package-meta">
                <span>
                  <strong>{{ tourismPackage.estimatedDuration }}</strong>
                  Duration
                </span>
                <span>
                  <strong>{{ tourismPackage.itemCount }}</strong>
                  Included item(s)
                </span>
              </span>

              <span class="target-market">{{ tourismPackage.targetMarket }}</span>
              <span class="package-card__footer">
                <span>{{ tourismPackage.price }}</span>
                <span>View package -></span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="visit-section">
        <div class="page-shell visit-panel">
          <div>
            <p class="eyebrow">Plan your visit</p>
            <h2>Need help choosing a package?</h2>
            <p>
              The Calabanga Tourism Office can help visitors choose routes, prepare group requests,
              and connect package inquiries to the right staff.
            </p>
          </div>
          <div class="visit-actions">
            <RouterLink to="/promotion/inquiry">Send inquiry</RouterLink>
            <RouterLink to="/destinations">Explore destinations</RouterLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="site-footer__main page-shell">
        <div>
          <div class="footer-brand">
            <span class="footer-brand__mark">T</span>
            <span>
              <strong>TWBIS</strong>
              <small>Calabanga Tourism</small>
            </span>
          </div>
          <p>
            The official tourism platform of the Local Government of Calabanga, Camarines Sur -
            celebrating our coast, culture, and craft.
          </p>
          <div class="social-row">
            <a aria-label="Facebook page pending" aria-disabled="true">f</a>
            <a aria-label="Instagram page pending" aria-disabled="true">ig</a>
            <a aria-label="Youtube page pending" aria-disabled="true">yt</a>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <RouterLink to="/destinations">Destinations &amp; Map</RouterLink>
          <RouterLink to="/products">Products</RouterLink>
          <RouterLink to="/packages">Packages</RouterLink>
          <RouterLink to="/events">Events</RouterLink>
          <RouterLink to="/promotion/museum">Virtual Museum</RouterLink>
        </div>

        <div>
          <h4>Visit</h4>
          <p>LGU Calabanga, Camarines Sur 4405</p>
          <p>+63 54 871 1234</p>
          <p>tourism@calabanga.gov.ph</p>
        </div>

        <div>
          <h4>Stay updated</h4>
          <p>Festival dates, new producers, and seasonal guides - once a month.</p>
          <form class="subscribe-form" @submit.prevent="submitNewsletter">
            <input v-model="newsletterEmail" aria-label="Email address" placeholder="you@email.com" />
            <button type="submit" :disabled="isSubscribing">
              {{ isSubscribing ? 'Joining...' : 'Join' }}
            </button>
          </form>
          <p v-if="newsletterMessage" class="footer-message">{{ newsletterMessage }}</p>
        </div>
      </div>

      <div class="site-footer__bottom">
        <div class="page-shell">
          <span>Copyright 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
          <span>
            <a aria-disabled="true">Privacy</a>
            <a aria-disabled="true">Accessibility</a>
            <RouterLink to="/promotion/inquiry">Contact</RouterLink>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.packages-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
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

.site-nav {
  position: fixed;
  z-index: 50;
  top: 0;
  right: 0;
  left: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.site-nav__inner {
  width: min(100% - 48px, 1200px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #1b4332;
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-weight: 700;
}

.footer-brand__mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #ffffff;
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-weight: 700;
}

.brand__copy {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.footer-brand span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.brand__name {
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.footer-brand strong {
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.brand__tagline {
  color: #5c5c5c;
  font-size: 11px;
}

.footer-brand small {
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
}

.site-nav__links {
  display: flex;
  align-self: stretch;
  align-items: stretch;
  justify-content: center;
  gap: 14px;
}

.site-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 6px;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 500;
}

.site-nav__link--active,
.site-nav__link:hover {
  color: #1b4332;
}

.site-nav__link--active::after {
  position: absolute;
  right: 6px;
  bottom: 19px;
  left: 6px;
  height: 2px;
  border-radius: 999px;
  background: #1b4332;
  content: '';
}

.login-button {
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 500;
}

.packages-hero {
  padding-top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.packages-hero__inner {
  min-height: 250px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: end;
  gap: 48px;
  padding: 54px 0 42px;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1 {
  margin: 14px 0 0;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 44px;
  line-height: 1.15;
}

.packages-hero p:last-child {
  max-width: 680px;
  margin: 12px 0 0;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.65;
}

.search-field {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  background: #f2f0eb;
  color: #5c5c5c;
}

.search-field svg {
  position: absolute;
  left: 13px;
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.search-field input {
  width: 100%;
  height: 100%;
  padding: 0 12px 0 40px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1a1a1a;
  font-size: 14px;
}

.chip-bar {
  position: sticky;
  z-index: 30;
  top: 64px;
  background: #ffffff;
  border-top: 1px solid #e8e4dc;
}

.chip-row {
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.chip {
  height: 36px;
  flex: 0 0 auto;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.chip--active {
  background: #1b4332;
  color: #ffffff;
}

.packages-section {
  min-height: 60vh;
  padding: 42px 0 96px;
}

.result-count {
  margin: 0 0 26px;
  color: #5c5c5c;
  font-size: 13px;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.package-card {
  min-height: 340px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background:
    radial-gradient(circle at 85% 10%, rgba(212, 172, 13, 0.2), transparent 32%),
    #ffffff;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.package-card > :not(.package-card__image) {
  margin-right: 26px;
  margin-left: 26px;
}

.package-card__image {
  width: 100%;
  min-height: 150px;
  display: block;
  margin: 0;
  background-color: #dfe9e4;
  object-fit: cover;
}

.package-card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.status-pill,
.target-market {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 700;
}

.package-card .status-pill {
  margin-top: 22px;
}

.package-card h2 {
  margin: 18px 0 0;
  color: #14261f;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 22px;
  line-height: 1.2;
}

.package-card p {
  margin: 12px 0 0;
  color: #5c5c5c;
  line-height: 1.6;
}

.package-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 22px 0;
}

.package-meta span {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  border-radius: 8px;
  background: #f6f7f4;
  color: #6b746f;
  font-size: 12px;
}

.package-meta strong {
  color: #14261f;
  font-size: 15px;
}

.package-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 24px;
  padding-bottom: 26px;
  color: #14261f;
  font-size: 14px;
  font-weight: 700;
}

.package-card__footer span:last-child {
  color: #1b4332;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  text-align: center;
}

.empty-state h2 {
  margin: 0;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
}

.empty-state p {
  max-width: 380px;
  margin: 10px 0 0;
  color: #5c5c5c;
}

.empty-state button {
  height: 40px;
  margin-top: 22px;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: transparent;
  color: #1b4332;
  font-weight: 600;
  cursor: pointer;
}

.skeleton {
  height: 16px;
  margin-top: 12px;
  border-radius: 999px;
  background: #e8e4dc;
}

.skeleton--title {
  width: 70%;
  height: 28px;
  margin-top: 50px;
}

.skeleton--short {
  width: 45%;
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .packages-hero__inner,
  .package-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-shell,
  .site-nav__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy,
  .login-button {
    display: none;
  }

  h1 {
    font-size: 38px;
  }

  .package-meta {
    grid-template-columns: 1fr;
  }
}

.packages-hero {
  padding-top: 64px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.78)),
    url('https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg');
  background-position: center;
  background-size: cover;
}

.packages-hero__inner {
  min-height: 520px;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 0.75fr);
  align-items: center;
  padding: 72px 0 64px;
}

.packages-hero__copy h1 {
  max-width: 820px;
  font-size: clamp(44px, 6vw, 76px);
  letter-spacing: 0;
}

.packages-hero__copy p:last-of-type {
  max-width: 720px;
  font-size: 18px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.primary-link,
.secondary-link,
.visit-actions a,
.toolbar-controls button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}

.primary-link {
  padding: 0 20px;
  background: #1b4332;
  color: #ffffff;
}

.secondary-link {
  padding: 0 20px;
  border: 1.5px solid #1b4332;
  background: rgba(255, 255, 255, 0.72);
  color: #1b4332;
}

.hero-visual {
  position: relative;
  min-height: 420px;
}

.hero-visual span {
  position: absolute;
  display: block;
  overflow: hidden;
  border: 8px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  background-position: center;
  background-size: cover;
  box-shadow: 0 24px 70px rgba(27, 67, 50, 0.18);
}

.hero-visual__main {
  inset: 26px 72px 72px 0;
  background-image: url('https://commons.wikimedia.org/wiki/Special:FilePath/Kabgan%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg');
}

.hero-visual__tile--church {
  right: 0;
  bottom: 20px;
  width: 52%;
  height: 42%;
  background-image: url('https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg');
}

.hero-visual__tile--bay {
  top: 0;
  right: 8%;
  width: 38%;
  height: 34%;
  background-image: url('https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg');
}

.category-section {
  padding: 64px 0;
  background: #ffffff;
}

.section-heading {
  max-width: 760px;
  margin-bottom: 28px;
}

.section-heading h2,
.packages-toolbar h2,
.visit-panel h2 {
  margin: 8px 0 0;
  color: #14261f;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 34px;
  line-height: 1.2;
}

.section-heading p:last-child,
.visit-panel p {
  margin: 10px 0 0;
  color: #5c5c5c;
  line-height: 1.65;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.category-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 360px;
  padding: 0;
  border: 1px solid #e8e4dc;
  border-top: 5px solid var(--category-accent);
  border-radius: 8px;
  background: #ffffff;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.category-card:hover,
.category-card--active {
  border-color: var(--category-accent);
  box-shadow: 0 16px 44px rgba(27, 67, 50, 0.12);
  transform: translateY(-2px);
}

.category-card__image {
  width: 100%;
  min-height: 150px;
  display: block;
  object-fit: cover;
}

.category-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 18px;
}

.category-card strong {
  color: #14261f;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  line-height: 1.2;
}

.category-card small {
  margin-top: 12px;
  color: #5c5c5c;
  font-size: 14px;
  line-height: 1.55;
}

.category-card__body > span:last-child {
  margin-top: auto;
  padding-top: 22px;
  color: #1b4332;
  font-size: 13px;
  font-weight: 800;
}

.packages-section {
  padding: 56px 0 82px;
  background: #f2f0eb;
}

.packages-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.result-count {
  margin: 8px 0 0;
}

.toolbar-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.toolbar-controls .search-field {
  width: min(360px, 100vw);
  background: #ffffff;
}

.toolbar-controls button {
  padding: 0 16px;
  border: 1px solid #e8e4dc;
  background: #ffffff;
  color: #1b4332;
  cursor: pointer;
}

.packages-section .chip-row {
  min-height: auto;
  margin-bottom: 28px;
}

.package-card {
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 249, 230, 0.9), rgba(255, 255, 255, 0.94)),
    #ffffff;
}

.package-category {
  align-self: flex-start;
  margin-top: 10px;
  color: #7a2d0e;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.visit-section {
  padding: 0 0 96px;
  background: #f2f0eb;
}

.visit-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 34px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
}

.visit-panel > div:first-child {
  max-width: 720px;
}

.visit-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.visit-actions a:first-child {
  padding: 0 18px;
  background: #1b4332;
  color: #ffffff;
}

.visit-actions a:last-child {
  padding: 0 18px;
  border: 1px solid #e8e4dc;
  color: #1b4332;
}

.site-footer {
  background: #1b4332;
  color: #ffffff;
}

.site-footer__main {
  display: grid;
  grid-template-columns: 1.35fr 1fr 1.25fr 1.25fr;
  gap: 56px;
  padding: 64px 0;
}

.site-footer p,
.site-footer a,
.site-footer small {
  color: rgba(255, 255, 255, 0.72);
}

.site-footer p {
  max-width: 290px;
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.6;
}

.social-row {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.social-row a {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.site-footer h4 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.site-footer__main > div:not(:first-child) a {
  display: block;
  margin-top: 11px;
  font-size: 14px;
}

.subscribe-form {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.subscribe-form input {
  min-width: 0;
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  outline: 0;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 14px;
}

.subscribe-form input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.subscribe-form button {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 13px;
  font-weight: 600;
}

.subscribe-form button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.footer-message {
  margin-top: 10px !important;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px !important;
}

.site-footer__bottom {
  background: #14532d;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.site-footer__bottom .page-shell {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.site-footer__bottom a {
  margin-left: 24px;
}

@media (max-width: 1100px) {
  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .packages-hero__inner,
  .packages-toolbar,
  .visit-panel {
    align-items: start;
    flex-direction: column;
    grid-template-columns: 1fr;
  }

  .hero-visual {
    width: 100%;
  }

  .site-footer__main {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .packages-hero__inner {
    min-height: auto;
    padding: 52px 0 42px;
  }

  .hero-actions,
  .toolbar-controls,
  .toolbar-controls .search-field,
  .visit-actions,
  .visit-actions a {
    width: 100%;
  }

  .hero-visual {
    min-height: 300px;
  }

  .hero-visual__main {
    inset: 0 48px 62px 0;
  }

  .category-grid {
    grid-template-columns: 1fr;
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


