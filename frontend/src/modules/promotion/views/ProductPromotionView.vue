<script setup>
import AccreditationBadge from '../components/AccreditationBadge.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { computed, onMounted, ref } from 'vue'
import { getPromotionalProducts } from '../services/promotionService'

const products = ref([])

const searchQuery = ref('')
const activeCategory = ref('All categories')
const activeProducer = ref('All producers')
const accreditedOnly = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const failedProductImages = ref(new Set())

const categoryOptions = computed(() => [
  'All categories',
  ...new Set(products.value.map((product) => product.category).filter(Boolean)),
])

const producerOptions = computed(() => [
  'All producers',
  ...new Set(products.value.map((product) => product.producer).filter(Boolean)),
])

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const matchesCategory =
      activeCategory.value === 'All categories' || product.category === activeCategory.value
    const matchesProducer =
      activeProducer.value === 'All producers' || product.producer === activeProducer.value
    const matchesAccreditation = !accreditedOnly.value || product.accredited
    const matchesQuery =
      !query ||
      [
        product.name,
        product.producer,
        product.category,
        product.description,
        ...(product.tags || []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesCategory && matchesProducer && matchesAccreditation && matchesQuery
  })
})

function selectCategory(category) {
  activeCategory.value = category
}

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = 'All categories'
  activeProducer.value = 'All producers'
  accreditedOnly.value = false
}

function markImageFailed(product) {
  const key = product.apiId || product.id || product.slug || product.name
  failedProductImages.value = new Set([...failedProductImages.value, key])
}

function hasProductImage(product) {
  const key = product.apiId || product.id || product.slug || product.name
  return Boolean(product.imageUrl) && !failedProductImages.value.has(key)
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
    <PromotionNavbar />

    <main>
      <section class="products-hero">
        <div class="page-shell products-hero__inner">
          <div class="products-hero__copy">
            <p class="eyebrow">Products Â· Local Producers</p>
            <h1>Products</h1>
            <p>
              Discover local products, crafts, food items, and accredited producers from Calabanga.
            </p>
          </div>

          <div class="products-toolbar" aria-label="Product filters">
            <label class="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input v-model="searchQuery" placeholder="Search products..." />
            </label>
            <label class="select-field">
              <span>Producer</span>
              <select v-model="activeProducer">
                <option v-for="producer in producerOptions" :key="producer" :value="producer">
                  {{ producer }}
                </option>
              </select>
            </label>
            <label class="toggle-filter">
              <input v-model="accreditedOnly" type="checkbox" />
              <span>LGU accredited only</span>
            </label>
          </div>
        </div>

        <div class="chip-bar">
          <div class="page-shell chip-bar__inner">
            <div class="chip-row">
              <button
                v-for="category in categoryOptions"
                :key="category"
                type="button"
                class="chip"
                :class="{ 'chip--active': activeCategory === category }"
                @click="selectCategory(category)"
              >
                {{ category === 'All categories' ? 'All' : category }}
              </button>
            </div>
            <button class="clear-filters" type="button" @click="clearFilters">Reset</button>
          </div>
        </div>
      </section>

      <section class="products-section">
        <div class="page-shell">
          <div class="result-summary">
            <p class="result-count">
              Showing <strong>{{ filteredProducts.length }}</strong>
              {{ filteredProducts.length === 1 ? 'product' : 'products' }}
            </p>
            <p
              v-if="
                activeCategory !== 'All categories' ||
                activeProducer !== 'All producers' ||
                accreditedOnly ||
                searchQuery
              "
              class="result-filters"
            >
              Filtered by
              <span v-if="activeCategory !== 'All categories'">{{ activeCategory }}</span>
              <span v-if="activeProducer !== 'All producers'">{{ activeProducer }}</span>
              <span v-if="accreditedOnly">LGU accredited</span>
              <span v-if="searchQuery">"{{ searchQuery }}"</span>
            </p>
          </div>

          <div v-if="isLoading" class="product-grid">
            <div v-for="index in 6" :key="index" class="product-tile product-tile--loading">
              <span class="product-tile__media"></span>
              <span class="product-tile__body">
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
            <button type="button" @click="clearFilters">Clear filters</button>
          </div>

          <div v-else-if="filteredProducts.length === 0" class="empty-state">
            <div class="empty-state__art"></div>
            <h2>No results found</h2>
            <p>Try adjusting your search terms or filters to find what you're looking for.</p>
            <button type="button" @click="clearFilters">Clear filters</button>
          </div>

          <div v-else class="product-grid">
            <RouterLink
              v-for="product in filteredProducts"
              :key="product.id"
              :to="`/products/${product.id}`"
              class="product-tile"
            >
              <span
                class="product-tile__media"
                :style="{ '--card-accent': product.accent || '#1b4332' }"
              >
                <img
                  v-if="hasProductImage(product)"
                  :src="product.imageUrl"
                  :alt="`${product.name} product photo`"
                  loading="lazy"
                  @error="markImageFailed(product)"
                />
                <span v-else class="product-tile__placeholder" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <path d="M12 17h24l-2 22H14L12 17Z" />
                    <path d="M18 17a6 6 0 0 1 12 0" />
                    <path d="M18 28h12" />
                  </svg>
                </span>
                <AccreditationBadge v-if="product.accredited" floating />
              </span>
              <span class="product-tile__body">
                <span class="category-badge">{{ product.category }}</span>
                <strong>{{ product.name }}</strong>
                <span class="producer-line">
                  {{ product.producer }}
                  <span class="verified-dot" aria-label="Verified producer"></span>
                </span>
                <span class="product-tile__footer">
                  <span>{{ product.price }}</span>
                  <span>View product →</span>
                </span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <PromotionFooter />
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

.icon-button svg,
.search-field svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  gap: 10px;
}

.search-field,
.select-field,
.toggle-filter {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
}

.search-field {
  width: 280px;
  background: #f2f0eb;
  border-color: transparent;
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

.select-field {
  min-width: 210px;
  gap: 10px;
  padding: 0 12px;
}

.select-field span {
  color: #7a7771;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.select-field select {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1a1a1a;
  font: inherit;
  font-size: 14px;
}

.toggle-filter {
  display: inline-flex;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.toggle-filter input {
  width: 16px;
  height: 16px;
  accent-color: #1b4332;
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

.clear-filters {
  flex: 0 0 auto;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.clear-filters:hover {
  border-color: #1b4332;
}

.products-section {
  min-height: 60vh;
  padding: 42px 0 96px;
  background: #f2f0eb;
}

.result-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 26px;
}

.result-count {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
}

.result-count strong {
  color: #1a1a1a;
  font-weight: 500;
}

.result-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  margin: 0;
  color: #77736d;
  font-size: 12px;
}

.result-filters span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: #ffffff;
  color: #1b4332;
  font-weight: 600;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  align-items: stretch;
}

.product-tile {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.product-tile:hover {
  border-color: #1b4332;
  box-shadow: 0 18px 36px rgba(27, 67, 50, 0.1);
  transform: translateY(-2px);
}

.product-tile--loading {
  pointer-events: none;
}

.product-tile__media {
  position: relative;
  display: block;
  flex: 0 0 auto;
  width: 100%;
  height: 240px;
  overflow: hidden;
  border-radius: 0;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.26), transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.18), transparent 50%),
    linear-gradient(135deg, var(--card-accent), color-mix(in srgb, var(--card-accent) 62%, white));
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.product-tile__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.product-tile__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.86);
}

.product-tile__placeholder svg {
  width: 72px;
  height: 72px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.product-tile--loading .product-tile__media {
  background: #e8e4dc;
}

.product-tile__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 166px;
  padding: 16px 16px 18px;
  border-radius: 0;
  background: #ffffff;
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

.product-tile__body > strong {
  margin-top: 10px;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.producer-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.35;
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

.verified-dot::after {
  width: 6px;
  height: 3px;
  border-bottom: 1.5px solid #ffffff;
  border-left: 1.5px solid #ffffff;
  content: '';
  transform: rotate(-45deg) translate(0, -1px);
}

.product-tile__footer {
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

.product-tile__footer span:first-child {
  font-weight: 700;
}

.product-tile__footer span:last-child {
  color: #1b4332;
  font-size: 13px;
  font-weight: 700;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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

.pagination button:disabled {
  cursor: default;
  opacity: 0.55;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-tile__media {
    height: 220px;
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
  .search-field,
  .select-field,
  .toggle-filter {
    width: 100%;
  }

  .products-hero__inner {
    padding: 38px 0 30px;
  }

  .products-toolbar {
    gap: 10px;
  }

  .select-field,
  .toggle-filter {
    justify-content: flex-start;
  }

  .chip-bar__inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .clear-filters {
    width: 100%;
  }

  .result-summary {
    flex-direction: column;
  }

  .result-filters {
    justify-content: flex-start;
  }

  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-tile__media {
    height: 210px;
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
