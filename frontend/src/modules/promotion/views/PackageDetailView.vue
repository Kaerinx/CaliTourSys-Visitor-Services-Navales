<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import CategoryTags from '../components/CategoryTags.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getPackageById } from '../services/promotionService'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const tourismPackage = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const selectedPax = ref(1)
const router = useRouter()
const isDateModalOpen = ref(false)
const selectedBookingDate = ref('')
const bookingDateError = ref('')

const packageItems = computed(() => tourismPackage.value?.items || [])
const hasPackagePrice = computed(() => isFiniteAmount(tourismPackage.value?.basePrice))
const baseAmount = computed(() => toFiniteNumber(tourismPackage.value?.basePrice))
const extraPaxAmount = computed(() => toFiniteNumber(tourismPackage.value?.extraPaxPrice))
const minimumPax = computed(() => Math.max(1, toPositiveInteger(tourismPackage.value?.minPax) || 1))
const maximumPax = computed(() => toPositiveInteger(tourismPackage.value?.maxPax))
const calculationBasePax = computed(() => {
  return (
    toPositiveInteger(tourismPackage.value?.basePax) ||
    toPositiveInteger(tourismPackage.value?.minPax) ||
    1
  )
})
const paxRangeLabel = computed(() => {
  if (!tourismPackage.value?.minPax && !tourismPackage.value?.maxPax) return ''
  if (tourismPackage.value.minPax && tourismPackage.value.maxPax) {
    return `${tourismPackage.value.minPax}-${tourismPackage.value.maxPax} pax`
  }
  if (tourismPackage.value.minPax) return `Minimum ${tourismPackage.value.minPax} pax`
  return `Up to ${tourismPackage.value.maxPax} pax`
})
const goodForLabel = computed(() => {
  const basePax = toPositiveInteger(tourismPackage.value?.basePax)
  if (basePax) return `${basePax} pax`
  return 'Base package amount'
})
const extraPersonLabel = computed(() => {
  if (isFiniteAmount(tourismPackage.value?.extraPaxPrice)) {
    return `${formatCurrency(extraPaxAmount.value)} per extra person`
  }
  return 'Upon inquiry'
})
const canDecreasePax = computed(() => selectedPax.value > minimumPax.value)
const canIncreasePax = computed(() => !maximumPax.value || selectedPax.value < maximumPax.value)
const extraPricingUponInquiry = computed(() => {
  return selectedPax.value > calculationBasePax.value && !isFiniteAmount(tourismPackage.value?.extraPaxPrice)
})
const estimatedTotal = computed(() => {
  if (!hasPackagePrice.value) return null
  if (selectedPax.value <= calculationBasePax.value) return baseAmount.value
  if (!isFiniteAmount(tourismPackage.value?.extraPaxPrice)) return null
  return baseAmount.value + (selectedPax.value - calculationBasePax.value) * extraPaxAmount.value
})
const estimatedTotalLabel = computed(() => {
  return estimatedTotal.value === null ? 'Upon inquiry' : formatCurrency(estimatedTotal.value)
})
const todayDate = computed(() => {
  const today = new Date()
  const offsetDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
})
const packageGallery = computed(() => {
  if (!tourismPackage.value) return []
  const primary = tourismPackage.value.imageUrl
    ? [{ id: 'package-cover', url: tourismPackage.value.imageUrl, altText: `${tourismPackage.value.name} image` }]
    : []
  const gallery = Array.isArray(tourismPackage.value.gallery) ? tourismPackage.value.gallery : []
  return [...primary, ...gallery].filter(
    (image, index, images) => image.url && images.findIndex((item) => item.url === image.url) === index,
  )
})
const heroImage = computed(() => packageGallery.value[0] || null)
const supportingGallery = computed(() => packageGallery.value.slice(1, 5))
const packageHighlights = computed(() => {
  if (!tourismPackage.value) return []

  return [
    { label: 'Duration', value: tourismPackage.value.estimatedDuration || 'To be confirmed' },
    { label: 'Good for', value: goodForLabel.value },
    { label: 'Target market', value: tourismPackage.value.targetMarket || 'General visitors' },
  ]
})

async function loadPackage() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    tourismPackage.value = await getPackageById(props.slug)
    selectedPax.value = initialSelectedPax(tourismPackage.value)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load this tourism package.'
  } finally {
    isLoading.value = false
  }
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isFiniteAmount(value) {
  const parsed = toFiniteNumber(value)
  return parsed !== null && parsed >= 0
}

function toPositiveInteger(value) {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return null
  const integer = Math.trunc(parsed)
  return integer >= 1 ? integer : null
}

function clampPax(value, tourismPackageValue = tourismPackage.value) {
  const min = Math.max(1, toPositiveInteger(tourismPackageValue?.minPax) || 1)
  const max = toPositiveInteger(tourismPackageValue?.maxPax)
  const parsed = toPositiveInteger(value) || min
  return Math.min(Math.max(parsed, min), max || parsed)
}

function initialSelectedPax(tourismPackageValue) {
  return clampPax(
    toPositiveInteger(tourismPackageValue?.basePax) ||
      toPositiveInteger(tourismPackageValue?.minPax) ||
      1,
    tourismPackageValue,
  )
}

function normalizeSelectedPax() {
  selectedPax.value = clampPax(selectedPax.value)
}

function adjustSelectedPax(delta) {
  selectedPax.value = clampPax(selectedPax.value + delta)
}

function openDateModal() {
  if (!tourismPackage.value?.apiId) {
    bookingDateError.value = 'This package is not ready to accept booking requests yet.'
    return
  }

  normalizeSelectedPax()
  bookingDateError.value = ''
  if (!selectedBookingDate.value) selectedBookingDate.value = todayDate.value
  isDateModalOpen.value = true
}

function closeDateModal() {
  isDateModalOpen.value = false
  bookingDateError.value = ''
}

function continueToBookingInfo() {
  if (!selectedBookingDate.value) {
    bookingDateError.value = 'Choose your preferred booking date first.'
    return
  }

  if (selectedBookingDate.value < todayDate.value) {
    bookingDateError.value = 'Choose today or a future date.'
    return
  }

  bookingDateError.value = ''
  router.push({
    name: 'promotion-package-booking-info',
    params: { slug: props.slug },
    query: {
      packageId: tourismPackage.value?.apiId || tourismPackage.value?.id || '',
      packageName: tourismPackage.value?.name || '',
      selectedPax: String(selectedPax.value),
      preferredDate: selectedBookingDate.value,
      estimatedTotal: estimatedTotal.value === null ? '' : String(estimatedTotal.value),
      paymentRequired: tourismPackage.value?.paymentRequired ? 'true' : 'false',
    },
  })
}

function formatCurrency(value) {
  if (!isFiniteAmount(value)) return 'Price upon inquiry'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value))
}

onMounted(loadPackage)
</script>

<template>
  <div class="package-detail-page">
    <PromotionNavbar />

    <main class="page-shell">
      <div v-if="isLoading" class="state-card">
        <p>Loading package...</p>
      </div>

      <div v-else-if="errorMessage" class="state-card">
        <h1>Package unavailable</h1>
        <p>{{ errorMessage }}</p>
        <RouterLink to="/packages">Back to Packages</RouterLink>
      </div>

      <article v-else-if="tourismPackage" class="package-detail">
        <RouterLink to="/packages" class="back-link">Back to Packages</RouterLink>

        <section class="package-hero">
          <div
            class="package-hero__gallery"
            :class="{ 'package-hero__gallery--single': !supportingGallery.length }"
            aria-label="Package photos"
          >
            <img
              v-if="heroImage"
              class="package-hero__image"
              :src="heroImage.url"
              :alt="heroImage.altText || `${tourismPackage.name} package image`"
            />
            <div v-else class="package-hero__image package-hero__image--empty">
              Package image coming soon
            </div>

            <div v-if="supportingGallery.length" class="package-hero__thumbs">
              <img
                v-for="image in supportingGallery"
                :key="image.id || image.url"
                :src="image.url"
                :alt="image.altText || `${tourismPackage.name} package image`"
              />
            </div>
          </div>

          <div class="package-hero__content">
            <div class="hero-pills">
              <span class="status-pill">{{ tourismPackage.packageStatus }}</span>
              <span class="payment-pill">
                {{ tourismPackage.paymentRequired ? 'Payment required' : 'Inquiry basis' }}
              </span>
            </div>

            <CategoryTags class="detail-hero__categories" :categories="tourismPackage.categories" />

            <h1>{{ tourismPackage.name }}</h1>
            <p>{{ tourismPackage.description }}</p>

            <div class="hero-highlights">
              <div v-for="highlight in packageHighlights" :key="highlight.label">
                <span>{{ highlight.label }}</span>
                <strong>{{ highlight.value }}</strong>
              </div>
            </div>
          </div>
        </section>

        <div class="detail-grid">
          <div class="detail-main">
            <section class="content-card">
              <p class="section-kicker">Overview</p>
              <h2>What to expect</h2>
              <p>{{ tourismPackage.description }}</p>
            </section>

            <section class="content-card">
              <p class="section-kicker">Package details</p>
              <h2>Quick information</h2>
              <dl class="info-grid">
                <div>
                  <dt>Target market</dt>
                  <dd>{{ tourismPackage.targetMarket }}</dd>
                </div>
                <div>
                  <dt>Estimated duration</dt>
                  <dd>{{ tourismPackage.estimatedDuration }}</dd>
                </div>
                <div>
                  <dt>Package amount</dt>
                  <dd>{{ tourismPackage.price }}</dd>
                </div>
                <div v-if="tourismPackage.extraPaxLabel">
                  <dt>Extra person</dt>
                  <dd>{{ tourismPackage.extraPaxLabel }}</dd>
                </div>
                <div v-if="paxRangeLabel">
                  <dt>Allowed pax</dt>
                  <dd>{{ paxRangeLabel }}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>{{ tourismPackage.paymentRequired ? 'Required after review' : 'Handled by inquiry' }}</dd>
                </div>
              </dl>
            </section>

            <section class="content-card">
              <p class="section-kicker">Itinerary and inclusions</p>
              <h2>Included package items</h2>
              <p v-if="packageItems.length === 0">
                The Product Development module has not attached detailed package items yet.
              </p>
              <div v-else class="item-list">
                <div
                  v-for="item in packageItems"
                  :key="`${item.itemType}-${item.id || item.referenceId}`"
                  class="item-row"
                >
                  <span>{{ item.itemType }}</span>
                  <div>
                    <strong>{{ item.name }}</strong>
                    <p>{{ item.location || item.status || 'Calabanga tourism package item' }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="tourismPackage.remarks" class="content-card">
              <p class="section-kicker">Important notes</p>
              <h2>Promotion notes</h2>
              <p>{{ tourismPackage.remarks }}</p>
            </section>
          </div>

          <aside class="booking-panel" aria-label="Package pricing and booking">
            <div class="booking-panel__head">
              <span>From</span>
              <strong>{{ tourismPackage.price }}</strong>
              <small v-if="tourismPackage.extraPaxLabel">{{ tourismPackage.extraPaxLabel }}</small>
            </div>

            <div v-if="hasPackagePrice" class="pricing-calculator" aria-label="Package pax calculator">
              <div class="pricing-calculator__head">
                <h3>Package Pricing</h3>
                <span>{{ tourismPackage.paymentRequired ? 'Payment required later' : 'Inquiry payment' }}</span>
              </div>

              <div class="pricing-breakdown">
                <div>
                  <span>Package amount</span>
                  <strong>{{ formatCurrency(tourismPackage.basePrice) }}</strong>
                </div>
                <div>
                  <span>Good for</span>
                  <strong>{{ goodForLabel }}</strong>
                </div>
                <div>
                  <span>Extra person</span>
                  <strong>{{ extraPersonLabel }}</strong>
                </div>
                <div v-if="paxRangeLabel">
                  <span>Pax range</span>
                  <strong>{{ paxRangeLabel }}</strong>
                </div>
              </div>

              <label class="pax-control">
                <span>Selected pax</span>
                <span class="pax-stepper">
                  <button
                    type="button"
                    aria-label="Decrease selected pax"
                    :disabled="!canDecreasePax"
                    @click="adjustSelectedPax(-1)"
                  >
                    -
                  </button>
                  <input
                    v-model.number="selectedPax"
                    type="number"
                    :min="minimumPax"
                    :max="maximumPax || undefined"
                    step="1"
                    @input="normalizeSelectedPax"
                    @change="normalizeSelectedPax"
                  />
                  <button
                    type="button"
                    aria-label="Increase selected pax"
                    :disabled="!canIncreasePax"
                    @click="adjustSelectedPax(1)"
                  >
                    +
                  </button>
                </span>
              </label>

              <div class="estimated-total">
                <span>Estimated total</span>
                <strong>{{ estimatedTotal === null ? 'Upon inquiry' : formatCurrency(estimatedTotal) }}</strong>
              </div>

              <p v-if="extraPricingUponInquiry" class="pricing-note">
                Extra person pricing is upon inquiry.
              </p>
              <p class="pricing-note">
                {{
                  tourismPackage.paymentRequired
                    ? 'Payment will be required once booking is enabled.'
                    : 'Final payment instructions will be handled by inquiry.'
                }}
              </p>
            </div>

            <div v-else class="pricing-calculator pricing-calculator--inquiry">
              <h3>Package Pricing</h3>
              <p>Price upon inquiry.</p>
            </div>

            <div class="booking-cta-panel">
              <div class="booking-cta-panel__summary">
                <span>{{ hasPackagePrice ? 'Estimated total' : 'Package price' }}</span>
                <strong>{{ estimatedTotalLabel }}</strong>
                <small>{{ selectedPax }} pax selected</small>
              </div>
              <button class="primary-button booking-submit" type="button" @click="openDateModal">
                Book Now
              </button>
              <p v-if="bookingDateError" class="booking-message booking-message--error">
                {{ bookingDateError }}
              </p>
              <p>
                Choose your date first. Participant details and contact information will be completed on the next step.
              </p>
            </div>
          </aside>
        </div>
      </article>

      <div
        v-if="isDateModalOpen"
        class="booking-date-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-date-title"
        @click.self="closeDateModal"
      >
        <form class="booking-date-card" @submit.prevent="continueToBookingInfo">
          <div class="booking-date-card__head">
            <div>
              <span>Choose booking</span>
              <h2 id="booking-date-title">Select your preferred date</h2>
            </div>
            <button type="button" aria-label="Close date selection" @click="closeDateModal">x</button>
          </div>

          <div class="booking-date-summary">
            <div>
              <span>Package</span>
              <strong>{{ tourismPackage.name }}</strong>
            </div>
            <div>
              <span>Selected pax</span>
              <strong>{{ selectedPax }} pax</strong>
            </div>
            <div>
              <span>Estimated total</span>
              <strong>{{ estimatedTotalLabel }}</strong>
            </div>
          </div>

          <label class="booking-date-field">
            <span>Preferred booking date</span>
            <input v-model="selectedBookingDate" type="date" :min="todayDate" required />
          </label>

          <p v-if="bookingDateError" class="booking-message booking-message--error">
            {{ bookingDateError }}
          </p>

          <div class="booking-date-actions">
            <button class="secondary-button" type="button" @click="closeDateModal">Cancel</button>
            <button class="primary-button" type="submit">Book Now</button>
          </div>
        </form>
      </div>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.package-detail-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.page-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.login-button,
.primary-button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 700;
}

.primary-button {
  background: #1b4332;
  color: #ffffff;
}

.secondary-button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 16px;
  border: 1px solid #1b4332;
  border-radius: 999px;
  background: #ffffff;
  color: #1b4332;
  font-weight: 800;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
}

.detail-hero,
.gallery-panel,
.summary-panel,
.items-panel,
.state-card {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
}

.detail-hero {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  padding: 36px;
  background: radial-gradient(circle at 85% 10%, rgba(212, 172, 13, 0.2), transparent 30%), #ffffff;
}

.gallery-panel {
  grid-column: 1 / -1;
  padding: 24px;
}

.gallery-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.gallery-panel__heading h2 {
  margin: 0;
}

.gallery-panel__heading span {
  color: #5c5c5c;
  font-size: 14px;
  font-weight: 700;
}

.package-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 14px;
}

.detail-image {
  width: 100%;
  min-height: 280px;
  max-height: 520px;
  border-radius: 10px;
  background-color: #dfe9e4;
  object-fit: cover;
}

.back-link {
  margin-bottom: 28px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 700;
}

.status-pill {
  align-self: flex-start;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
}

h1,
h2 {
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

h1 {
  max-width: 780px;
  margin: 20px 0 0;
  font-size: 48px;
  line-height: 1.1;
}

.detail-hero p {
  max-width: 720px;
  margin: 18px 0 0;
  color: #5c5c5c;
  font-size: 17px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: auto;
  padding-top: 36px;
  color: #14261f;
  font-weight: 800;
}

.hero-price {
  display: grid;
  gap: 2px;
}

.hero-price strong {
  color: #14261f;
}

.hero-price small {
  color: #5c5c5c;
  font-size: 12px;
}

.summary-panel,
.items-panel,
.state-card {
  padding: 28px;
}

.summary-panel h2,
.items-panel h2 {
  margin: 0 0 18px;
  font-size: 20px;
}

dl {
  display: grid;
  gap: 16px;
  margin: 0;
}

dt {
  color: #6b746f;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

dd {
  margin: 4px 0 0;
  color: #14261f;
  font-weight: 700;
}

.pricing-calculator {
  display: grid;
  gap: 18px;
  margin-top: 28px;
  padding: 20px;
  border: 1px solid #dce6df;
  border-radius: 8px;
  background: #f6f7f4;
}

.pricing-calculator__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.pricing-calculator__head h3,
.pricing-calculator--inquiry h3 {
  margin: 0;
  color: #14261f;
  font-size: 18px;
}

.pricing-calculator__head span {
  flex: 0 0 auto;
  padding: 5px 10px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 11px;
  font-weight: 800;
}

.pricing-breakdown {
  display: grid;
  gap: 12px;
}

.pricing-breakdown div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e8e3;
}

.pricing-breakdown div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.pricing-breakdown span,
.pax-control > span:first-child,
.estimated-total span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.pricing-breakdown strong {
  color: #14261f;
  font-size: 14px;
  text-align: right;
}

.pax-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.pax-stepper {
  display: inline-grid;
  grid-template-columns: 42px 76px 42px;
  overflow: hidden;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #fff;
}

.pax-stepper button,
.pax-stepper input {
  min-height: 42px;
  border: 0;
  background: transparent;
  color: #14261f;
  font: inherit;
  font-weight: 800;
}

.pax-stepper button {
  cursor: pointer;
  color: #1b4332;
}

.pax-stepper button:disabled {
  cursor: not-allowed;
  color: #9ca7a1;
  background: #f1f3ef;
}

.pax-stepper input {
  width: 76px;
  border-right: 1px solid #cbd8d0;
  border-left: 1px solid #cbd8d0;
  text-align: center;
}

.estimated-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px;
  border-radius: 8px;
  background: #1b4332;
}

.estimated-total span,
.estimated-total strong {
  color: #fff;
}

.estimated-total strong {
  font-size: 22px;
  text-align: right;
}

.pricing-note {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.55;
}

.pricing-calculator--inquiry {
  gap: 8px;
}

.pricing-calculator--inquiry p {
  margin: 0;
  color: #5c5c5c;
  line-height: 1.55;
}

.booking-cta-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  align-items: stretch;
  gap: 14px;
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid #e2e6df;
}

.booking-cta-panel__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 14px;
  align-items: end;
  padding: 16px;
  border-radius: 8px;
  background: #f6f7f4;
}

.booking-cta-panel__summary span,
.booking-date-card__head span,
.booking-date-summary span,
.booking-date-field span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-cta-panel__summary strong {
  grid-column: 2;
  grid-row: 1 / span 2;
  color: #1b4332;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 24px;
  line-height: 1;
  text-align: right;
}

.booking-cta-panel__summary small {
  color: #5c5c5c;
  font-size: 13px;
  font-weight: 700;
}

.booking-cta-panel p {
  grid-column: 1 / -1;
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.55;
}

.booking-date-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(12, 24, 18, 0.58);
  backdrop-filter: blur(6px);
}

.booking-date-card {
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
}

.booking-date-card__head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.booking-date-card__head h2 {
  margin: 4px 0 0;
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 24px;
  letter-spacing: 0;
}

.booking-date-card__head button {
  width: 36px;
  height: 36px;
  border: 1px solid #d7ded8;
  border-radius: 999px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.booking-date-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.booking-date-summary div {
  min-width: 0;
  display: grid;
  gap: 5px;
  padding: 13px;
  border-radius: 8px;
  background: #f6f7f4;
}

.booking-date-summary strong {
  color: #14261f;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.booking-date-field {
  display: grid;
  gap: 8px;
}

.booking-date-field input {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
}

.booking-date-field input:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

.booking-date-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.booking-request-form {
  display: grid;
  gap: 16px;
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #e2e6df;
}

.booking-request-form__head {
  display: grid;
  gap: 6px;
}

.booking-request-form__head h3 {
  margin: 0;
  color: #14261f;
  font-size: 18px;
}

.booking-request-form__head p {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.55;
}

.booking-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.booking-overview div {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 8px;
  background: #f6f7f4;
}

.booking-overview span,
.booking-request-form label span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-overview strong {
  color: #14261f;
  font-size: 16px;
}

.booking-request-form label {
  display: grid;
  gap: 8px;
}

.booking-request-form input,
.booking-request-form textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #fff;
  color: #14261f;
  font: inherit;
}

.booking-request-form textarea {
  min-height: 112px;
  resize: vertical;
}

.booking-request-form input:focus,
.booking-request-form textarea:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

.booking-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.booking-message--success {
  background: #e6f3ee;
  color: #1b4332;
}

.booking-message--error {
  background: #fdecea;
  color: #9f2d20;
}

.booking-result-panel,
.payment-proof-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dce6df;
  border-radius: 8px;
  background: #f6f7f4;
}

.confirmation-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.confirmation-head span:first-child,
.booking-reference-card > span,
.next-steps-panel > span,
.amount-due-panel > span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.confirmation-status {
  flex: 0 0 auto;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
}

.booking-reference-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 12px;
  padding: 14px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
}

.booking-reference-card > span,
.booking-reference-card strong {
  grid-column: 1;
}

.booking-reference-card strong {
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.booking-reference-card button {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #1b4332;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.copy-message {
  margin: -4px 0 0;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
}

.confirmation-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.confirmation-summary div,
.next-steps-panel,
.amount-due-panel {
  padding: 14px;
  border-radius: 8px;
  background: #ffffff;
}

.confirmation-summary dt {
  color: #6b746f;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.confirmation-summary dd {
  margin-top: 5px;
  color: #14261f;
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.next-steps-panel {
  border-left: 4px solid #1b4332;
}

.status-lookup-link {
  display: inline-flex;
  width: fit-content;
  margin-top: 12px;
  color: #1b4332;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.amount-due-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #1b4332;
}

.amount-due-panel span,
.amount-due-panel strong {
  color: #ffffff;
}

.amount-due-panel strong {
  font-size: 20px;
}

.booking-result-panel h4,
.booking-result-panel p,
.payment-proof-panel p {
  margin: 0;
}

.booking-result-panel h4 {
  color: #14261f;
  font-size: 16px;
}

.booking-result-panel p,
.payment-proof-panel p {
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.55;
}

.payment-proof-panel {
  background: #fff;
}

.payment-proof-panel > div > span {
  display: block;
  margin-bottom: 6px;
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-submit {
  width: 100%;
  justify-content: center;
  border: 0;
}

.payment-proof-submit {
  width: 100%;
  border-radius: 8px;
}

.booking-submit:disabled,
.payment-proof-submit:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.items-panel {
  grid-column: 1 / -1;
}

.items-panel > p {
  margin: 0;
  color: #5c5c5c;
  line-height: 1.65;
}

.item-list {
  display: grid;
  gap: 12px;
}

.item-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  padding: 16px;
  border-radius: 8px;
  background: #f6f7f4;
}

.item-row > span {
  align-self: start;
  justify-self: start;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.item-row strong {
  color: #14261f;
}

.item-row p {
  margin: 4px 0 0;
  color: #5c5c5c;
}

.state-card {
  max-width: 680px;
}

.state-card h1 {
  margin-top: 0;
}

.state-card a {
  display: inline-flex;
  margin-top: 18px;
  color: #1b4332;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .detail-layout {
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
    font-size: 36px;
  }

  .detail-hero,
  .summary-panel,
  .items-panel,
  .state-card {
    padding: 22px;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .pricing-calculator__head,
  .pricing-breakdown div,
  .pax-control,
  .estimated-total {
    align-items: flex-start;
    flex-direction: column;
  }

  .pricing-breakdown strong,
  .estimated-total strong {
    text-align: left;
  }

  .pax-stepper {
    width: 100%;
    grid-template-columns: 42px minmax(0, 1fr) 42px;
  }

  .pax-stepper input {
    width: 100%;
  }

  .booking-overview {
    grid-template-columns: 1fr;
  }

  .confirmation-head,
  .amount-due-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .booking-reference-card,
  .confirmation-summary {
    grid-template-columns: 1fr;
  }

  .booking-reference-card button {
    grid-column: 1;
    grid-row: auto;
    justify-self: start;
  }

  .item-row {
    grid-template-columns: 1fr;
  }

  .site-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .site-footer a {
    margin: 0 18px 0 0;
  }
}

.package-detail {
  display: grid;
  gap: 22px;
}

.package-detail .back-link {
  width: fit-content;
  margin-bottom: 0;
}

.package-hero {
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.72fr);
  gap: 0;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(20, 38, 31, 0.08);
}

.package-hero__gallery {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 148px;
  gap: 8px;
  min-height: 520px;
  padding: 8px;
  background: #dfe9e4;
}

.package-hero__gallery--single {
  grid-template-columns: 1fr;
}

.package-hero__image {
  width: 100%;
  height: 100%;
  min-height: 504px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #dfe9e4;
  color: #5c5c5c;
  object-fit: cover;
  object-position: center;
}

.package-hero__image--empty {
  font-weight: 800;
}

.package-hero__thumbs {
  display: grid;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.package-hero__thumbs img {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 6px;
  object-fit: cover;
  object-position: center;
}

.package-hero__content {
  display: flex;
  flex-direction: column;
  padding: 34px;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.payment-pill {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: #fff3d4;
  color: #7c4b00;
  font-size: 12px;
  font-weight: 800;
}

.package-hero .detail-hero__categories {
  margin-bottom: 0;
}

.package-hero h1 {
  margin-top: 18px;
  font-size: clamp(34px, 4vw, 54px);
  letter-spacing: 0;
}

.package-hero p {
  margin: 16px 0 0;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.7;
}

.hero-highlights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: auto;
  padding-top: 28px;
}

.hero-highlights div {
  min-height: 82px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 14px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #f6f7f4;
}

.hero-highlights span,
.section-kicker {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-highlights strong {
  color: #14261f;
  font-size: 15px;
  line-height: 1.35;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  align-items: start;
  gap: 22px;
}

.detail-main {
  display: grid;
  gap: 18px;
}

.content-card,
.booking-panel {
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(20, 38, 31, 0.05);
}

.content-card {
  padding: 28px;
}

.content-card h2 {
  margin: 6px 0 0;
  font-size: 26px;
}

.content-card > p:last-child,
.content-card > p:not(.section-kicker) {
  margin: 12px 0 0;
  color: #5c5c5c;
  line-height: 1.7;
}

.info-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.info-grid div {
  padding: 16px;
  border-radius: 8px;
  background: #f6f7f4;
}

.booking-panel {
  position: sticky;
  top: 84px;
  padding: 20px;
}

.booking-panel__head {
  display: grid;
  gap: 4px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e8e4dc;
}

.booking-panel__head span,
.booking-panel__head small {
  color: #5c5c5c;
  font-size: 13px;
  font-weight: 700;
}

.booking-panel__head strong {
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 26px;
  line-height: 1.2;
}

.booking-panel .pricing-calculator {
  margin-top: 18px;
}

.booking-panel .booking-request-form {
  margin-top: 20px;
  padding-top: 20px;
}

.booking-panel .primary-button {
  min-height: 46px;
}

.booking-request-form input,
.booking-request-form textarea,
.pax-stepper {
  box-sizing: border-box;
}

.payment-proof-panel input[type='file'] {
  padding: 10px;
}

@media (max-width: 1120px) {
  .package-hero,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .booking-panel {
    position: static;
  }
}

@media (max-width: 820px) {
  .package-hero__gallery {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .package-hero__image {
    min-height: 320px;
    aspect-ratio: 16 / 10;
  }

  .package-hero__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: none;
  }

  .package-hero__thumbs img {
    aspect-ratio: 1;
  }

  .package-hero__content,
  .content-card,
  .booking-panel {
    padding: 20px;
  }

  .hero-highlights,
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .page-shell {
    width: min(100% - 28px, 1200px);
    padding-top: 96px;
  }

  .package-hero__image {
    min-height: 240px;
  }

  .package-hero__thumbs {
    display: none;
  }

  .booking-panel__head strong {
    font-size: 22px;
  }

  .booking-cta-panel {
    grid-template-columns: 1fr;
  }

  .booking-cta-panel__summary strong {
    grid-column: 1;
    grid-row: auto;
    text-align: left;
  }

  .booking-date-summary,
  .booking-date-actions {
    grid-template-columns: 1fr;
  }
}
</style>
