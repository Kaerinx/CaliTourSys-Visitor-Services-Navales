<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  getBusinessById,
  getProductById,
  removeFromItinerary,
  saveToItinerary,
  sharePublicItem,
} from '../services/promotionService'

const route = useRoute()
const product = ref(null)
const business = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isSaved = ref(false)
const isSaving = ref(false)
const feedbackMessage = ref('')

const initials = computed(() => {
  if (!business.value?.name) return 'T'

  return business.value.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
})

async function loadProduct() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    product.value = await getProductById(route.params.id)
    business.value = await getBusinessById(product.value.businessId)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load product.'
  } finally {
    isLoading.value = false
  }
}

async function toggleItinerary() {
  if (!product.value) return

  isSaving.value = true

  if (isSaved.value) {
    await removeFromItinerary({ id: product.value.id, type: 'product' })
    isSaved.value = false
    feedbackMessage.value = 'Removed from itinerary'
  } else {
    await saveToItinerary({ id: product.value.id, type: 'product', title: product.value.name })
    isSaved.value = true
    feedbackMessage.value = 'Saved to itinerary'
  }

  isSaving.value = false
}

async function shareProduct() {
  if (!product.value) return

  const result = await sharePublicItem({
    title: product.value.name,
    text: product.value.description,
    path: `/promotion/products/${product.value.id}`,
  })

  feedbackMessage.value =
    result.method === 'clipboard' ? 'Product link copied' : 'Share action ready'
}

onMounted(loadProduct)
</script>

<template>
  <main class="detail-page">
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
          <button class="icon-button" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </button>
          <button class="login-button">Login</button>
        </div>
      </div>
    </header>

    <div class="breadcrumb-bar">
      <div class="page-shell">
        <RouterLink to="/promotion">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/promotion/products">Products</RouterLink>
        <span>/</span>
        <span>{{ product?.name || 'Product Detail' }}</span>
      </div>
    </div>

    <section v-if="isLoading" class="page-shell detail-loading">
      <div></div>
      <div></div>
    </section>

    <section v-else-if="errorMessage" class="page-shell detail-empty">
      <div></div>
      <h1>Product not found</h1>
      <p>{{ errorMessage }}</p>
      <RouterLink to="/promotion/products">Back to Products</RouterLink>
    </section>

    <section v-else class="page-shell detail-layout">
      <div>
        <div class="gallery-main" :style="{ '--product-accent': product.accent }">
          <span v-if="product.accredited" class="accreditation-badge"><span></span>LGU Accredited</span>
        </div>
        <div class="thumbnail-row">
          <button
            v-for="tone in [product.accent, '#2D6A4F', '#D4AC0D', '#7B341E']"
            :key="tone"
            :style="{ '--product-accent': tone }"
          ></button>
        </div>

        <section class="about-section">
          <h2>About this product</h2>
          <p>{{ product.description }}</p>
          <ul>
            <li>Hand-made in small batches in Calabanga, Camarines Sur</li>
            <li>Supports a registered local producer or cooperative</li>
            <li>Vetted for public tourism promotion by LGU Calabanga mock data</li>
          </ul>
        </section>
      </div>

      <aside class="detail-card">
        <div class="badge-row">
          <span class="category-badge">{{ product.category }}</span>
          <span v-if="product.accredited" class="accreditation-badge accreditation-badge--static">
            <span></span>
            LGU Accredited
          </span>
        </div>
        <h1>{{ product.name }}</h1>
        <p class="price">{{ product.price }}</p>
        <p>{{ product.description }}</p>

        <div class="action-stack">
          <button>Contact producer</button>
          <button @click="toggleItinerary">
            {{ isSaving ? 'Saving...' : isSaved ? 'Remove from itinerary' : 'Save to itinerary' }}
          </button>
          <button @click="shareProduct">Share product</button>
        </div>

        <div v-if="business" class="producer-card">
          <span class="producer-avatar">{{ initials }}</span>
          <span>
            <strong>By {{ business.name }}</strong>
            <small>Accredited since {{ business.accreditedSince }} · {{ business.location }}</small>
            <small>{{ business.description }}</small>
          </span>
        </div>
      </aside>
    </section>

    <div v-if="feedbackMessage" class="feedback-toast">{{ feedbackMessage }}</div>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.detail-page {
  min-height: 100vh;
  padding-top: 64px;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
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

.brand {
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

.brand__copy {
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

.brand__tagline {
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

.icon-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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

.breadcrumb-bar {
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.breadcrumb-bar .page-shell {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5c5c5c;
  font-size: 13px;
}

.breadcrumb-bar a:hover,
.breadcrumb-bar span:last-child {
  color: #1b4332;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(360px, 2fr);
  gap: 40px;
  padding: 48px 0 96px;
}

.gallery-main,
.thumbnail-row button {
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.28), transparent 40%),
    radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.26), transparent 50%),
    linear-gradient(135deg, var(--product-accent), color-mix(in srgb, var(--product-accent) 62%, white));
}

.gallery-main {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
}

.thumbnail-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.thumbnail-row button {
  width: 80px;
  height: 60px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  cursor: pointer;
}

.thumbnail-row button:first-child {
  border: 2px solid #1b4332;
}

.about-section {
  margin-top: 40px;
}

h1,
h2 {
  margin: 0;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  line-height: 1.2;
}

.about-section h2 {
  font-size: 22px;
}

.about-section p,
.detail-card p {
  color: #5c5c5c;
  font-size: 15px;
  line-height: 1.7;
}

.about-section ul {
  display: grid;
  gap: 10px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  color: #1a1a1a;
  font-size: 14px;
}

.about-section li::before {
  width: 6px;
  height: 6px;
  display: inline-block;
  margin-right: 12px;
  border-radius: 999px;
  background: #1b4332;
  content: '';
  vertical-align: middle;
}

.detail-card {
  position: sticky;
  top: 88px;
  align-self: start;
  padding: 24px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-badge {
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

.accreditation-badge {
  position: absolute;
  top: 14px;
  right: 14px;
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
}

.accreditation-badge span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d4ac0d;
}

.accreditation-badge--static {
  position: static;
}

.detail-card h1 {
  margin-top: 16px;
  font-size: 32px;
}

.price {
  margin: 16px 0 0;
  color: #1a1a1a !important;
  font-size: 28px !important;
  font-weight: 500;
}

.action-stack {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

.action-stack button {
  height: 48px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.action-stack button:not(:first-child) {
  background: transparent;
  color: #1b4332;
}

.producer-card {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
}

.producer-avatar {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #d8f3dc;
  color: #1b4332;
  font-weight: 600;
}

.producer-card strong,
.producer-card small {
  display: block;
}

.producer-card strong {
  font-size: 14px;
}

.producer-card small {
  margin-top: 4px;
  color: #5c5c5c;
  font-size: 12px;
}

.detail-loading {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 40px;
  padding: 48px 0;
}

.detail-loading div,
.detail-empty div {
  min-height: 300px;
  border-radius: 16px;
  background: #e8e4dc;
  animation: skeletonPulse 1.4s ease-in-out infinite;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  text-align: center;
}

.detail-empty h1 {
  margin-top: 24px;
  font-size: 32px;
}

.detail-empty p {
  color: #5c5c5c;
}

.detail-empty a {
  height: 44px;
  display: inline-flex;
  align-items: center;
  margin-top: 20px;
  padding: 0 18px;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.feedback-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
  width: 280px;
  padding: 14px 16px;
  border-left: 4px solid #1b7a4a;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
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

@media (max-width: 900px) {
  .site-nav__links {
    display: none;
  }

  .brand__copy,
  .login-button {
    display: none;
  }

  .detail-layout,
  .detail-loading {
    grid-template-columns: 1fr;
  }

  .detail-card {
    position: static;
  }
}
</style>
