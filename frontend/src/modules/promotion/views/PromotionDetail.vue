<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  getBusinessById,
  getProductById,
  loadItinerary,
  removeFromItinerary,
  saveToItinerary,
  sharePublicItem,
  submitTourismInquiry,
} from '../services/promotionService'
import { validateInquiryForm } from '../utils/formValidation'

const route = useRoute()
const product = ref(null)
const business = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isSaved = ref(false)
const isSaving = ref(false)
const feedbackMessage = ref('')
const isContactOpen = ref(false)
const isContactSubmitting = ref(false)
const contactTouched = ref(false)
const contactMessage = ref('')
const selectedGalleryIndex = ref(0)
const contactForm = reactive({
  fullName: '',
  email: '',
  subject: '',
  message: '',
})

const galleryFallbackTones = ['#B5451B', '#2D6A4F', '#D4AC0D', '#7B341E']

const initials = computed(() => {
  if (!business.value?.name) return 'T'

  return business.value.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
})

const contactMessageIsSuccess = computed(() => contactMessage.value.startsWith('Inquiry sent'))

const galleryItems = computed(() => {
  if (!product.value) return []

  const galleryImages = Array.isArray(product.value.gallery) ? product.value.gallery : []
  const primaryImage = product.value.imageUrl
    ? [
        {
          id: 'primary-image',
          imageUrl: product.value.imageUrl,
          altText: product.value.name,
          accent: product.value.accent || galleryFallbackTones[0],
        },
      ]
    : []

  const imageItems = galleryImages
    .map((image, index) => ({
      id: image.id || image.url || image.imageUrl || `gallery-image-${index}`,
      imageUrl: image.url || image.imageUrl,
      altText: image.altText || product.value.name,
      accent: product.value.accent || galleryFallbackTones[index % galleryFallbackTones.length],
    }))
    .filter((image) => image.imageUrl)
    .filter((image, index, images) => images.findIndex((item) => item.imageUrl === image.imageUrl) === index)

  const items = [...primaryImage, ...imageItems.filter((image) => image.imageUrl !== product.value.imageUrl)]

  while (items.length < 4) {
    const index = items.length
    items.push({
      id: `accent-${index}`,
      imageUrl: '',
      altText: `${product.value.name} color preview ${index + 1}`,
      accent: galleryFallbackTones[index % galleryFallbackTones.length],
    })
  }

  return items.slice(0, 4)
})

const selectedGalleryItem = computed(
  () => galleryItems.value[selectedGalleryIndex.value] || galleryItems.value[0] || null,
)

const suggestedProducts = computed(() => product.value?.relatedProducts || [])

async function loadProduct() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    product.value = await getProductById(route.params.slug || route.params.id)
    selectedGalleryIndex.value = 0
    business.value = product.value.businessProfile || await getBusinessById(product.value.businessId)
    const itinerary = await loadItinerary()
    isSaved.value = itinerary.items.some(
      (item) => item.itemType === 'product' && item.targetId === product.value.apiId,
    )
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load product.'
  } finally {
    isLoading.value = false
  }
}

async function toggleItinerary() {
  if (!product.value) return

  isSaving.value = true

  try {
    if (isSaved.value) {
      await removeFromItinerary({ id: product.value.id, apiId: product.value.apiId, type: 'product' })
      isSaved.value = false
      feedbackMessage.value = 'Removed from itinerary'
    } else {
      await saveToItinerary({
        id: product.value.id,
        apiId: product.value.apiId,
        type: 'product',
        title: product.value.name,
      })
      isSaved.value = true
      feedbackMessage.value = 'Saved to itinerary'
    }
  } catch (error) {
    feedbackMessage.value = error.message || 'Unable to update itinerary'
  } finally {
    isSaving.value = false
  }
}

function selectGalleryItem(index) {
  selectedGalleryIndex.value = index
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

function openContactProducer() {
  contactTouched.value = false
  contactMessage.value = ''
  contactForm.subject = product.value ? `Product inquiry: ${product.value.name}` : 'Product inquiry'
  isContactOpen.value = true
}

function closeContactProducer() {
  if (isContactSubmitting.value) return
  isContactOpen.value = false
}

async function submitProducerInquiry() {
  contactTouched.value = true
  contactMessage.value = validateInquiryForm(contactForm)

  if (contactMessage.value) return

  isContactSubmitting.value = true

  try {
    await submitTourismInquiry({
      ...contactForm,
      sourcePage: product.value?.id ? `/promotion/products/${product.value.id}` : '/promotion/products',
    })

    contactForm.fullName = ''
    contactForm.email = ''
    contactForm.message = ''
    contactMessage.value = 'Inquiry sent. The Tourism Office will review and route your message.'
    feedbackMessage.value = 'Inquiry sent successfully'
  } catch (error) {
    contactMessage.value = error.message || 'Unable to send inquiry. Please try again later.'
  } finally {
    isContactSubmitting.value = false
  }
}

watch(() => route.params.slug || route.params.id, loadProduct, { immediate: true })
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
          <button class="icon-button" type="button" aria-label="Search planned for later" disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </button>
          <RouterLink class="login-button" to="/cms/login" aria-label="Open CMS login">
            Login
          </RouterLink>
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
        <div
          class="gallery-main"
          :style="{
            '--product-accent': selectedGalleryItem?.accent || product.accent,
            backgroundImage: selectedGalleryItem?.imageUrl ? `url(${selectedGalleryItem.imageUrl})` : undefined,
          }"
        >
          <span v-if="product.accredited" class="accreditation-badge"><span></span>LGU Accredited</span>
        </div>
        <div class="thumbnail-row">
          <button
            v-for="(item, index) in galleryItems"
            :key="item.id"
            type="button"
            :class="{ 'thumbnail-row__button--active': selectedGalleryIndex === index }"
            :aria-label="`Show ${item.altText || product.name}`"
            :aria-pressed="selectedGalleryIndex === index"
            :style="{
              '--product-accent': item.accent,
              backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
            }"
            @click="selectGalleryItem(index)"
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
          <button type="button" @click="openContactProducer">Contact producer</button>
          <button type="button" :disabled="isSaving" @click="toggleItinerary">
            {{ isSaving ? 'Saving...' : isSaved ? 'Remove from itinerary' : 'Save to itinerary' }}
          </button>
          <button type="button" @click="shareProduct">Share product</button>
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

    <section
      v-if="!isLoading && !errorMessage && suggestedProducts.length"
      class="page-shell suggested-products"
      aria-labelledby="suggested-products-title"
    >
      <h2 id="suggested-products-title">You might also like</h2>

      <div class="suggested-products__grid">
        <RouterLink
          v-for="suggestedProduct in suggestedProducts"
          :key="suggestedProduct.id"
          class="suggested-card"
          :to="`/promotion/products/${suggestedProduct.id}`"
        >
          <div
            class="suggested-card__media"
            :style="{
              '--product-accent': suggestedProduct.accent,
              backgroundImage: suggestedProduct.imageUrl ? `url(${suggestedProduct.imageUrl})` : undefined,
            }"
          >
            <span v-if="suggestedProduct.accredited" class="accreditation-badge">
              <span></span>
              LGU Accredited
            </span>
          </div>

          <div class="suggested-card__body">
            <span class="category-badge">{{ suggestedProduct.category }}</span>
            <h3>{{ suggestedProduct.name }}</h3>
            <p>
              {{ suggestedProduct.producer }}
              <span v-if="suggestedProduct.accredited" class="suggested-card__verified" aria-label="Accredited producer"></span>
            </p>

            <div class="suggested-card__footer">
              <strong>{{ suggestedProduct.price }}</strong>
              <span>View product -&gt;</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <div v-if="isContactOpen" class="contact-modal" @click.self="closeContactProducer">
      <form class="contact-modal__panel" role="dialog" aria-modal="true" aria-labelledby="contact-producer-title" @submit.prevent="submitProducerInquiry">
        <header class="contact-modal__header">
          <h2 id="contact-producer-title">Contact Producer</h2>
          <button type="button" aria-label="Close contact producer form" @click="closeContactProducer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div class="contact-modal__body">
          <label>
            <span>Name</span>
            <input v-model="contactForm.fullName" type="text" autocomplete="name" :disabled="isContactSubmitting" />
          </label>

          <label>
            <span>Email</span>
            <input v-model="contactForm.email" type="email" autocomplete="email" :disabled="isContactSubmitting" />
          </label>

          <label>
            <span>Message</span>
            <textarea v-model="contactForm.message" rows="4" :disabled="isContactSubmitting"></textarea>
          </label>

          <p
            v-if="contactMessage"
            class="contact-modal__message"
            :class="{ 'contact-modal__message--success': contactMessageIsSuccess }"
          >
            {{ contactMessage }}
          </p>

          <div class="contact-modal__actions">
            <button type="button" :disabled="isContactSubmitting" @click="closeContactProducer">Cancel</button>
            <button type="submit" :disabled="isContactSubmitting">
              {{ isContactSubmitting ? 'Sending...' : 'Send inquiry' }}
            </button>
          </div>
        </div>
      </form>
    </div>

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

.icon-button:disabled {
  cursor: default;
  opacity: 0.55;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.login-button:hover {
  background: #d8f3dc;
}

.login-button:disabled {
  cursor: default;
  opacity: 0.72;
}

.breadcrumb-bar {
  position: sticky;
  z-index: 45;
  top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
  box-shadow: 0 4px 18px rgba(27, 67, 50, 0.04);
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
  padding: 48px 0;
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
  background-position: center;
  background-size: cover;
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
  background-position: center;
  background-size: cover;
  cursor: pointer;
}

.thumbnail-row__button--active {
  border: 2px solid #1b4332;
}

.thumbnail-row button:focus-visible {
  outline: 3px solid rgba(27, 67, 50, 0.22);
  outline-offset: 2px;
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

.action-stack button:disabled {
  cursor: wait;
  opacity: 0.72;
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

.suggested-products {
  margin-bottom: 96px;
  padding: 32px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
}

.suggested-products h2 {
  font-size: 24px;
}

.suggested-products__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.suggested-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.suggested-card:hover {
  border-color: rgba(27, 67, 50, 0.34);
  box-shadow: 0 14px 32px rgba(27, 67, 50, 0.1);
  transform: translateY(-2px);
}

.suggested-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.28), transparent 40%),
    radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.18), transparent 50%),
    linear-gradient(135deg, var(--product-accent), color-mix(in srgb, var(--product-accent) 62%, white));
  background-position: center;
  background-size: cover;
}

.suggested-card__media .accreditation-badge {
  top: 12px;
  right: 10px;
}

.suggested-card__body {
  display: grid;
  gap: 8px;
  padding: 16px;
}

.suggested-card__body .category-badge {
  justify-self: start;
}

.suggested-card h3 {
  min-height: 44px;
  margin: 0;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.25;
}

.suggested-card p {
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.4;
}

.suggested-card__verified {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #1b7a4a;
}

.suggested-card__verified::after {
  width: 5px;
  height: 3px;
  border-bottom: 1.5px solid #ffffff;
  border-left: 1.5px solid #ffffff;
  content: '';
  transform: rotate(-45deg) translate(0, -1px);
}

.suggested-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
  color: #1b4332;
  font-size: 13px;
}

.suggested-card__footer strong {
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.suggested-card__footer span {
  font-weight: 600;
  white-space: nowrap;
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

.contact-modal {
  position: fixed;
  z-index: 150;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(6px);
}

.contact-modal__panel {
  width: min(100%, 448px);
  overflow: hidden;
  border: 0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
}

.contact-modal__header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid #e8e4dc;
}

.contact-modal__header h2 {
  color: #1b4332;
  font-size: 20px;
}

.contact-modal__header button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #1a1a1a;
  cursor: pointer;
}

.contact-modal__header button:hover {
  background: #f2f0eb;
}

.contact-modal__header svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.contact-modal__body {
  display: grid;
  gap: 18px;
  padding: 24px;
}

.contact-modal__body label {
  display: grid;
  gap: 8px;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
}

.contact-modal__body input,
.contact-modal__body textarea {
  width: 100%;
  border: 1px solid #ddd7cd;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font: inherit;
  outline: none;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.contact-modal__body input {
  height: 44px;
  padding: 0 12px;
}

.contact-modal__body textarea {
  min-height: 96px;
  resize: vertical;
  padding: 12px;
}

.contact-modal__body input:focus,
.contact-modal__body textarea:focus {
  border-color: #1b4332;
  box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.12);
}

.contact-modal__body input:disabled,
.contact-modal__body textarea:disabled {
  background: #f7f5f0;
  cursor: wait;
}

.contact-modal__message {
  margin: -4px 0 0;
  color: #8a2d18;
  font-size: 13px;
  line-height: 1.5;
}

.contact-modal__message--success {
  color: #1b7a4a;
}

.contact-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 2px;
}

.contact-modal__actions button {
  min-width: 100px;
  height: 48px;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.contact-modal__actions button:first-child {
  background: #ffffff;
  color: #1b4332;
}

.contact-modal__actions button:last-child {
  background: #1b4332;
  color: #ffffff;
}

.contact-modal__actions button:disabled {
  cursor: wait;
  opacity: 0.72;
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

  .suggested-products__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .suggested-products {
    width: min(100% - 32px, 1200px);
    padding: 20px;
  }

  .suggested-products__grid {
    grid-template-columns: 1fr;
  }

  .suggested-card h3,
  .suggested-card p {
    min-height: 0;
  }

  .contact-modal {
    padding: 16px;
  }

  .contact-modal__header,
  .contact-modal__body {
    padding-right: 18px;
    padding-left: 18px;
  }

  .contact-modal__actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .contact-modal__actions button {
    width: 100%;
  }
}
</style>
