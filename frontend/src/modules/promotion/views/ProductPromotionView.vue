<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPromotionalProducts } from '../services/promotionService'
import { useNewsletterForm } from '../composables/useNewsletterForm'

const chips = ['All', 'Sweets', 'Crafts', 'Pantry', 'Textiles', 'Beverages', 'Skincare']

const products = ref([
  {
    id: 'pili-candy',
    name: 'Pili Nut Brittle (Glazed)',
    producer: "Aling Marta's Kitchen",
    price: '₱ 250.00',
    category: 'Sweets',
    accent: '#B5451B',
    accredited: true,
  },
  {
    id: 'abaca-mat',
    name: 'Hand-woven Abaca Place Mat',
    producer: 'Quipayo Weavers Coop',
    price: '₱ 480.00',
    category: 'Crafts',
    accent: '#7B341E',
    accredited: true,
  },
  {
    id: 'bagoong',
    name: 'Calabanga Fermented Bagoong',
    producer: 'San Miguel Bay Fishers',
    price: '₱ 180.00',
    category: 'Pantry',
    accent: '#1B4332',
    accredited: true,
  },
  {
    id: 'coco-jam',
    name: 'Slow-cooked Latik Coco Jam',
    producer: 'Sabang Farm',
    price: '₱ 220.00',
    category: 'Sweets',
    accent: '#D4711B',
    accredited: true,
  },
  {
    id: 'pottery',
    name: 'Belen Terra-cotta Water Pot',
    producer: 'Belen Pottery Studio',
    price: '₱ 950.00',
    category: 'Crafts',
    accent: '#7B341E',
    accredited: true,
  },
  {
    id: 'honey',
    name: 'Wild Forest Honey 500ml',
    producer: 'Mt. Isarog Apiary',
    price: '₱ 380.00',
    category: 'Pantry',
    accent: '#D4AC0D',
    accredited: true,
  },
  {
    id: 'abaca-bag',
    name: 'Woven Abaca Market Bag',
    producer: 'Quipayo Weavers Coop',
    price: '₱ 620.00',
    category: 'Crafts',
    accent: '#2D6A4F',
    accredited: false,
  },
  {
    id: 'tablea',
    name: 'Pure Tablea Chocolate Discs',
    producer: 'Cagsao Cacao',
    price: '₱ 290.00',
    category: 'Sweets',
    accent: '#5C3318',
    accredited: true,
  },
  {
    id: 'calamansi',
    name: 'Cold-Pressed Calamansi Juice',
    producer: 'Sabang Farm',
    price: '₱ 160.00',
    category: 'Pantry',
    accent: '#D4AC0D',
    accredited: true,
  },
])

const searchQuery = ref('')
const activeChip = ref('All')
const isLoading = ref(false)
const errorMessage = ref('')
const showEmptyPreview = ref(false)
const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm()

const filteredProducts = computed(() => {
  if (showEmptyPreview.value) return []

  const query = searchQuery.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const matchesCategory = activeChip.value === 'All' || product.category === activeChip.value
    const matchesQuery =
      !query ||
      [product.name, product.producer, product.category]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesCategory && matchesQuery
  })
})

function selectChip(chip) {
  activeChip.value = chip
  showEmptyPreview.value = false
}

function clearFilters() {
  searchQuery.value = ''
  activeChip.value = 'All'
  showEmptyPreview.value = false
}

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    products.value = await getPromotionalProducts({ limit: 50, sort: 'featured' })
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public products.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProducts)
</script>

<template>
  <div class="otop-page">
    <header class="site-nav">
      <div class="site-nav__inner">
        <RouterLink to="/promotion" class="brand" aria-label="TWBIS Home">
          <span class="brand__mark">T</span>
          <span class="brand__copy">
            <span class="brand__name">TWBIS</span>
            <span class="brand__tagline">Calabanga Tourism</span>
          </span>
        </RouterLink>

        <nav class="site-nav__links" aria-label="Primary navigation">
          <RouterLink to="/promotion" class="site-nav__link">Home</RouterLink>
          <RouterLink to="/promotion/map" class="site-nav__link">Destination</RouterLink>
          <RouterLink to="/promotion/products" class="site-nav__link site-nav__link--active">
            Products
          </RouterLink>
          <RouterLink to="/promotion/events" class="site-nav__link">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
          <RouterLink to="/promotion/inquiry" class="site-nav__link">Inquiries</RouterLink>
        </nav>

        <div class="site-nav__actions">
          <button class="icon-button" type="button" aria-label="Search planned for later" disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </button>
          <button class="login-button" type="button" disabled title="Public login is planned for a later phase">
            Public Site
          </button>
          <button class="icon-button icon-button--menu" aria-label="Menu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main>
      <section class="products-hero">
        <div class="page-shell products-hero__inner">
          <div class="products-hero__copy">
            <p class="eyebrow">Products · Local Producers</p>
            <h1>Products</h1>
            <p>
              Explore locally-made products from Calabanga's accredited producers - every item is
              vetted by the LGU for quality and authenticity.
            </p>
          </div>

          <div class="products-toolbar" aria-label="Product search and filters">
            <label class="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input v-model="searchQuery" placeholder="Search products..." />
            </label>
            <button class="toolbar-button" type="button" disabled title="Sorting will be connected in a later phase">
              Sort: Featured
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button class="toolbar-button" type="button" disabled title="Advanced filters will be connected in a later phase">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
                <path d="M14 4v4M8 10v4M16 16v4" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        <div class="chip-bar">
          <div class="page-shell chip-bar__inner">
            <div class="chip-row">
              <button
                v-for="(chip, index) in chips"
                :key="chip"
                class="chip"
                :class="{ 'chip--active': activeChip === chip }"
                @click="selectChip(chip)"
              >
                {{ chip }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="products-section">
        <div class="page-shell">
          <p class="result-count">
            Showing <strong>{{ filteredProducts.length }}</strong> products
          </p>

          <div v-if="isLoading" class="product-grid">
            <div v-for="index in 6" :key="index" class="product-card product-card--loading">
              <span class="product-card__image"></span>
              <span class="product-card__body">
                <span class="skeleton-line skeleton-line--short"></span>
                <span class="skeleton-line"></span>
                <span class="skeleton-line skeleton-line--medium"></span>
                <span class="skeleton-line skeleton-line--footer"></span>
              </span>
            </div>
          </div>

          <div v-else-if="errorMessage" class="empty-state">
            <div class="empty-state__art"></div>
            <h2>Unable to load products</h2>
            <p>{{ errorMessage }}</p>
            <button @click="clearFilters">Clear filters</button>
          </div>

          <div v-else-if="filteredProducts.length === 0" class="empty-state">
            <div class="empty-state__art"></div>
            <h2>No results found</h2>
            <p>Try adjusting your search terms or filters to find what you're looking for.</p>
            <button @click="clearFilters">Clear filters</button>
          </div>

          <div v-else class="product-grid">
            <RouterLink
              v-for="product in filteredProducts"
              :key="product.id"
              :to="`/promotion/products/${product.id}`"
              class="product-card"
            >
              <span
                class="product-card__image"
                :style="{
                  '--card-accent': product.accent,
                  backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : undefined,
                }"
              >
                <span v-if="product.accredited" class="accreditation-badge">
                  <span></span>
                  LGU Accredited
                </span>
              </span>
              <span class="product-card__body">
                <span class="category-badge">{{ product.category }}</span>
                <strong>{{ product.name }}</strong>
                <span class="producer-line">
                  {{ product.producer }}
                  <span class="verified-dot">✓</span>
                </span>
                <span class="product-card__footer">
                  <span>{{ product.price }}</span>
                  <span>View product -></span>
                </span>
              </span>
            </RouterLink>
          </div>

          <nav class="pagination" aria-label="Product pages">
            <button>Previous</button>
            <button class="pagination__active">1</button>
            <button>2</button>
            <button>3</button>
            <button>4</button>
            <span>...</span>
            <button>12</button>
            <button>Next</button>
          </nav>
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
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="Youtube">▶</a>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <RouterLink to="/promotion/map">Map &amp; Discovery</RouterLink>
          <RouterLink to="/promotion/products">Products</RouterLink>
          <RouterLink to="/promotion/events">Events</RouterLink>
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
          <span>© 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
          <span>
            <a href="#">Privacy</a>
            <a href="#">Accessibility</a>
            <RouterLink to="/promotion/inquiry">Contact</RouterLink>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.otop-page {
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
  gap: 32px;
}

.brand,
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand__mark,
.footer-brand__mark {
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

.brand__copy,
.footer-brand span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.brand__name,
.footer-brand strong {
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.brand__tagline,
.footer-brand small {
  color: #5c5c5c;
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

.site-nav__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button,
.login-button {
  border: 0;
  background: transparent;
  color: #1a1a1a;
  cursor: pointer;
}

.icon-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 999px;
}

.icon-button:hover {
  background: #f2f0eb;
}

.icon-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.icon-button svg,
.toolbar-button svg,
.search-field svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.icon-button--menu {
  display: none;
}

.login-button {
  height: 38px;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 500;
}

.login-button:hover {
  background: #d8f3dc;
}

.products-hero {
  padding-top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.products-hero__inner {
  min-height: 226px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 48px;
  padding: 48px 0 40px;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1 {
  margin: 14px 0 0;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 44px;
  font-weight: 700;
  line-height: 1.2;
}

.products-hero__copy p:last-child {
  max-width: 640px;
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.6;
}

.products-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.search-field {
  position: relative;
  width: 280px;
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

.search-field input::placeholder {
  color: #8a8782;
}

.toolbar-button {
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.toolbar-button:hover {
  border-color: #1b4332;
}

.toolbar-button:disabled,
.login-button:disabled {
  cursor: default;
  opacity: 0.72;
}

.toolbar-button svg {
  width: 16px;
  height: 16px;
}

.chip-bar {
  position: sticky;
  z-index: 30;
  top: 64px;
  background: #ffffff;
  border-top: 1px solid #e8e4dc;
}

.chip-bar__inner {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 0;
}

.chip-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.chip-row::-webkit-scrollbar {
  display: none;
}

.chip {
  height: 36px;
  flex: 0 0 auto;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.chip--active {
  background: #1b4332;
  color: #ffffff;
}

.empty-preview {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: #5c5c5c;
  font-size: 12px;
  cursor: pointer;
}

.products-section {
  min-height: 60vh;
  padding: 42px 0 96px;
  background: #f2f0eb;
}

.result-count {
  margin: 0 0 26px;
  color: #5c5c5c;
  font-size: 13px;
}

.result-count strong {
  color: #1a1a1a;
  font-weight: 500;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.product-card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.product-card--loading {
  pointer-events: none;
}

.product-card__image {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.26), transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.18), transparent 50%),
    linear-gradient(135deg, var(--card-accent), color-mix(in srgb, var(--card-accent) 62%, white));
  background-position: center;
  background-size: cover;
}

.product-card--loading .product-card__image {
  background: #e8e4dc;
}

.accreditation-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid #d4ac0d;
  border-radius: 999px;
  background: #fff9e6;
  color: #7d5a00;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.accreditation-badge span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d4ac0d;
}

.product-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
}

.category-badge {
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
}

.product-card__body > strong {
  margin-top: 10px;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.producer-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #5c5c5c;
  font-size: 13px;
}

.verified-dot {
  width: 14px;
  height: 14px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #1b7a4a;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 500;
}

.product-card__footer span:last-child {
  color: #1b4332;
  font-size: 13px;
}

.skeleton-line {
  height: 16px;
  margin-top: 10px;
  border-radius: 999px;
  background: #e8e4dc;
  animation: skeletonPulse 1.4s ease-in-out infinite;
}

.skeleton-line--short {
  width: 72px;
  height: 22px;
  margin-top: 0;
}

.skeleton-line--medium {
  width: 60%;
}

.skeleton-line--footer {
  width: 42%;
  margin-top: 28px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
}

.empty-state__art {
  width: 160px;
  height: 160px;
  border: 2px dashed #bdbdbd;
  border-radius: 16px;
}

.empty-state h2 {
  margin: 24px 0 0;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
}

.empty-state p {
  max-width: 380px;
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.empty-state button {
  height: 40px;
  margin-top: 24px;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

@keyframes skeletonPulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 50px;
}

.pagination button {
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
}

.pagination button:hover {
  border-color: #1b4332;
}

.pagination__active {
  border-color: #1b4332 !important;
  background: #1b4332 !important;
  color: #ffffff !important;
}

.pagination span {
  padding: 0 8px;
  color: #5c5c5c;
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
}

.footer-brand__mark {
  background: #ffffff;
  color: #1b4332;
}

.footer-brand strong {
  color: #ffffff;
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
  font-size: 14px;
}

.site-footer h4 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
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
  font-weight: 500;
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

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .products-hero__inner {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .products-toolbar {
    justify-content: flex-start;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .site-footer__main {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .page-shell,
  .site-nav__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy {
    display: none;
  }

  .login-button {
    display: none;
  }

  h1 {
    font-size: 38px;
  }

  .products-toolbar,
  .search-field {
    width: 100%;
  }

  .chip-bar__inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .product-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-wrap: wrap;
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
