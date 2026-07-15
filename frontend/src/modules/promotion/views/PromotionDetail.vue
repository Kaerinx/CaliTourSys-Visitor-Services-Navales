<script setup>
import AccreditationBadge from '../components/AccreditationBadge.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
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
import ReviewsSection from '../components/ReviewsSection.vue'
import { useVisitorSession } from '../composables/useVisitorSession'

const PENDING_SAVE_KEY = 'calitoursys_pending_product_save'
const route = useRoute()
const router = useRouter()
const { isAuthenticated: isVisitorAuthenticated, visitorEmail, visitorName } = useVisitorSession()
const product = ref(null)
const business = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isSaved = ref(false)
const isSaving = ref(false)
const feedbackMessage = ref('')
const isContactOpen = ref(false)
const isContactSubmitting = ref(false)
const contactMessage = ref('')
const contactDialog = ref(null)
const contactNameInput = ref(null)
const contactTrigger = ref(null)
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
const isBusinessAccredited = computed(() => business.value?.accreditationStatus === 'accredited')
const businessLocation = computed(() => business.value?.location || 'Calabanga, Camarines Sur')
const businessAccreditationLabel = computed(() => {
  if (!business.value) return ''
  if (!isBusinessAccredited.value) return 'No linked accreditation yet'
  return business.value.accreditationNumber
    ? `Accredited business ${business.value.accreditationNumber}`
    : 'LGU accredited business'
})
const businessExpiryLabel = computed(() => {
  if (!business.value?.expiresAt) return ''
  const date = new Date(business.value.expiresAt)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
})

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
    .filter(
      (image, index, images) =>
        images.findIndex((item) => item.imageUrl === image.imageUrl) === index,
    )

  const items = [
    ...primaryImage,
    ...imageItems.filter((image) => image.imageUrl !== product.value.imageUrl),
  ]

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
    business.value =
      product.value.businessProfile || (await getBusinessById(product.value.businessId))
    await refreshSavedProduct()
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load product.'
  } finally {
    isLoading.value = false
  }
}

async function toggleItinerary() {
  if (!product.value) return

  if (!isVisitorAuthenticated.value) {
    promptForSaveAuth()
    return
  }

  await performProductItineraryToggle()
}

async function performProductItineraryToggle() {
  if (!product.value) return

  isSaving.value = true

  try {
    if (isSaved.value) {
      await removeFromItinerary({
        id: product.value.id,
        apiId: product.value.apiId,
        type: 'product',
      })
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

async function refreshSavedProduct() {
  if (!isVisitorAuthenticated.value || !product.value) {
    isSaved.value = false
    return
  }

  try {
    const itinerary = await loadItinerary()
    isSaved.value = itinerary.items.some(
      (item) => item.itemType === 'product' && item.targetId === product.value.apiId,
    )
  } catch {
    isSaved.value = false
  }
}

function promptForSaveAuth() {
  if (!product.value) return
  sessionStorage.setItem(PENDING_SAVE_KEY, product.value.id)
  router.replace({
    path: route.path,
    query: { ...route.query, auth: 'login', authIntent: 'save', product: product.value.id },
  })
}

async function resumePendingSave() {
  if (!isVisitorAuthenticated.value) return
  await refreshSavedProduct()

  const pendingId = sessionStorage.getItem(PENDING_SAVE_KEY)
  if (!pendingId || pendingId !== product.value?.id) return
  sessionStorage.removeItem(PENDING_SAVE_KEY)
  await performProductItineraryToggle()
}

function selectGalleryItem(index) {
  selectedGalleryIndex.value = index
}

async function shareProduct() {
  if (!product.value) return

  const result = await sharePublicItem({
    title: product.value.name,
    text: product.value.description,
    path: `/products/${product.value.id}`,
  })

  feedbackMessage.value =
    result.method === 'clipboard' ? 'Product link copied' : 'Share action ready'
}

async function openContactProducer() {
  contactMessage.value = ''
  contactForm.subject = product.value ? `Product inquiry: ${product.value.name}` : 'Product inquiry'
  if (isVisitorAuthenticated.value) {
    contactForm.fullName = visitorName.value || contactForm.fullName
    contactForm.email = visitorEmail.value || contactForm.email
  }
  isContactOpen.value = true
  await nextTick()
  contactNameInput.value?.focus()
}

async function closeContactProducer() {
  if (isContactSubmitting.value) return
  isContactOpen.value = false
  await nextTick()
  contactTrigger.value?.focus()
}

function handleContactDialogKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeContactProducer()
    return
  }

  if (event.key !== 'Tab') return

  const focusable = Array.from(
    contactDialog.value?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
    ) || [],
  )
  if (!focusable.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

async function submitProducerInquiry() {
  contactMessage.value = validateInquiryForm(contactForm)

  if (contactMessage.value) return

  isContactSubmitting.value = true

  try {
    await submitTourismInquiry({
      ...contactForm,
      productId: product.value?.apiId,
      sourcePage: product.value?.id ? `/products/${product.value.id}` : '/products',
    })

    contactForm.fullName = ''
    contactForm.email = ''
    contactForm.message = ''
    contactMessage.value = 'Inquiry sent. The producer can now view your message and reply by email.'
    feedbackMessage.value = 'Inquiry sent successfully'
  } catch (error) {
    contactMessage.value = error.message || 'Unable to send inquiry. Please try again later.'
  } finally {
    isContactSubmitting.value = false
  }
}

watch(() => route.params.slug || route.params.id, loadProduct, { immediate: true })

onMounted(() => {
  window.addEventListener('calitoursys:visitor-authenticated', resumePendingSave)
})

onBeforeUnmount(() => {
  window.removeEventListener('calitoursys:visitor-authenticated', resumePendingSave)
})
</script>

<template>
  <main class="detail-page">
    <PromotionNavbar />

    <div class="breadcrumb-bar">
      <div class="page-shell">
        <RouterLink to="/">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/products">Products</RouterLink>
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
      <RouterLink to="/products">Back to Products</RouterLink>
    </section>

    <section v-else class="page-shell detail-layout">
      <div>
        <div
          class="gallery-main"
          :style="{
            '--product-accent': selectedGalleryItem?.accent || product.accent,
            backgroundImage: selectedGalleryItem?.imageUrl
              ? `url(${selectedGalleryItem.imageUrl})`
              : undefined,
          }"
        >
          <AccreditationBadge v-if="product.accredited" floating />
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
            <li>Vetted for public tourism promotion by LGU Calabanga</li>
          </ul>
        </section>
      </div>

      <aside class="detail-card">
        <div class="badge-row">
          <span class="category-badge">{{ product.category }}</span>
          <AccreditationBadge v-if="product.accredited" />
        </div>
        <h1>{{ product.name }}</h1>
        <p class="price">{{ product.price }}</p>
        <p>{{ product.description }}</p>

        <div class="action-stack">
          <button ref="contactTrigger" type="button" @click="openContactProducer">
            Contact producer
          </button>
          <button type="button" :disabled="isSaving" @click="toggleItinerary">
            {{ isSaving ? 'Saving...' : isSaved ? 'Remove from itinerary' : 'Save to itinerary' }}
          </button>
          <button type="button" @click="shareProduct">Share product</button>
        </div>

        <div v-if="business" class="producer-card">
          <span class="producer-avatar">{{ initials }}</span>
          <span>
            <strong>By {{ business.name }}</strong>
            <small v-if="isBusinessAccredited">
              Accredited since {{ business.accreditedSince }} · {{ businessLocation }}
            </small>
            <small v-else>{{ businessAccreditationLabel }} · {{ businessLocation }}</small>
            <small>{{ business.description }}</small>
          </span>
        </div>
      </aside>
    </section>

    <section
      v-if="!isLoading && !errorMessage && business"
      class="page-shell business-info-section"
      aria-labelledby="business-info-title"
    >
      <div class="business-info-section__header">
        <span>{{ isBusinessAccredited ? 'Verified Producer' : 'Producer Information' }}</span>
        <h2 id="business-info-title">
          {{ isBusinessAccredited ? 'Accredited Business & Location' : 'Business & Location' }}
        </h2>
      </div>

      <div class="business-info-grid">
        <article class="business-info-card business-info-card--main">
          <div class="business-info-card__title">
            <span class="producer-avatar">{{ initials }}</span>
            <div>
              <h3>{{ business.name }}</h3>
              <p>{{ business.type || 'Local Producer' }}</p>
            </div>
          </div>

          <p>{{ business.description }}</p>
          <dl>
            <div>
              <dt>Accreditation</dt>
              <dd>{{ businessAccreditationLabel }}</dd>
            </div>
            <div v-if="isBusinessAccredited && businessExpiryLabel">
              <dt>Valid Until</dt>
              <dd>{{ businessExpiryLabel }}</dd>
            </div>
            <div v-if="business.owner">
              <dt>Owner / Contact Person</dt>
              <dd>{{ business.owner }}</dd>
            </div>
          </dl>
        </article>

        <article class="business-info-card">
          <h3>Location</h3>
          <p>{{ businessLocation }}</p>
          <dl>
            <div v-if="business.addressLine">
              <dt>Address</dt>
              <dd>{{ business.addressLine }}</dd>
            </div>
            <div v-if="business.barangay">
              <dt>Barangay</dt>
              <dd>{{ business.barangay }}</dd>
            </div>
            <div>
              <dt>Municipality</dt>
              <dd>{{ business.municipality || 'Calabanga' }}</dd>
            </div>
          </dl>
        </article>
      </div>
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
          :to="`/products/${suggestedProduct.id}`"
        >
          <div
            class="suggested-card__media"
            :style="{
              '--product-accent': suggestedProduct.accent,
              backgroundImage: suggestedProduct.imageUrl
                ? `url(${suggestedProduct.imageUrl})`
                : undefined,
            }"
          >
            <AccreditationBadge v-if="suggestedProduct.accredited" floating />
          </div>

          <div class="suggested-card__body">
            <span class="category-badge">{{ suggestedProduct.category }}</span>
            <h3>{{ suggestedProduct.name }}</h3>
            <p>
              {{ suggestedProduct.producer }}
              <span
                v-if="suggestedProduct.accredited"
                class="suggested-card__verified"
                aria-label="Accredited producer"
              ></span>
            </p>

            <div class="suggested-card__footer">
              <strong>{{ suggestedProduct.price }}</strong>
              <span>View product -&gt;</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <section v-if="!isLoading && !errorMessage && product" class="page-shell detail-reviews">
      <ReviewsSection target-type="product" :target-id="product.apiId" :target-name="product.name" />
    </section>

    <div v-if="isContactOpen" class="contact-modal" @click.self="closeContactProducer">
      <form
        ref="contactDialog"
        class="contact-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-producer-title"
        @submit.prevent="submitProducerInquiry"
        @keydown="handleContactDialogKeydown"
      >
        <header class="contact-modal__header">
          <h2 id="contact-producer-title">Contact Producer</h2>
          <button
            type="button"
            aria-label="Close contact producer form"
            @click="closeContactProducer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div class="contact-modal__body">
          <label>
            <span>Name</span>
            <input
              ref="contactNameInput"
              v-model="contactForm.fullName"
              type="text"
              autocomplete="name"
              :disabled="isContactSubmitting"
            />
          </label>

          <label>
            <span>Email</span>
            <input
              v-model="contactForm.email"
              type="email"
              autocomplete="email"
              :disabled="isContactSubmitting"
            />
          </label>

          <label>
            <span>Message</span>
            <textarea
              v-model="contactForm.message"
              rows="4"
              :disabled="isContactSubmitting"
            ></textarea>
          </label>

          <p
            v-if="contactMessage"
            class="contact-modal__message"
            :class="{ 'contact-modal__message--success': contactMessageIsSuccess }"
            :role="contactMessageIsSuccess ? 'status' : 'alert'"
            aria-live="polite"
          >
            {{ contactMessage }}
          </p>

          <div class="contact-modal__actions">
            <button type="button" :disabled="isContactSubmitting" @click="closeContactProducer">
              Cancel
            </button>
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
    linear-gradient(
      135deg,
      var(--product-accent),
      color-mix(in srgb, var(--product-accent) 62%, white)
    );
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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

.business-info-section {
  margin-bottom: 64px;
  padding: 32px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
}

.business-info-section__header {
  display: grid;
  gap: 6px;
  margin-bottom: 24px;
}

.business-info-section__header span {
  color: #1b7a4a;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.business-info-section__header h2 {
  font-size: 24px;
}

.business-info-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.8fr);
  gap: 20px;
}

.business-info-card {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #fbfaf7;
}

.business-info-card--main {
  background: #f7fbf8;
  border-color: #cfe9d5;
}

.business-info-card__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.business-info-card h3 {
  margin: 0;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 18px;
}

.business-info-card p {
  margin: 0;
  color: #5c5c5c;
  font-size: 14px;
  line-height: 1.6;
}

.business-info-card dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.business-info-card dl div {
  display: grid;
  gap: 3px;
}

.business-info-card dt {
  color: #7a746b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.business-info-card dd {
  margin: 0;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.45;
}

.suggested-products {
  margin-bottom: 96px;
  padding: 32px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
}

.detail-reviews {
  margin-bottom: 96px;
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
    linear-gradient(
      135deg,
      var(--product-accent),
      color-mix(in srgb, var(--product-accent) 62%, white)
    );
  background-position: center;
  background-size: cover;
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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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

  .business-info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .suggested-products,
  .business-info-section {
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
