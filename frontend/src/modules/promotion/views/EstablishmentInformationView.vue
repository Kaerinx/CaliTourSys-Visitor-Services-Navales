<script setup>
import PromotionFooter from '../components/PromotionFooter.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { getAccreditedBusinessBySlug, getAccreditedBusinesses } from '../services/promotionService'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const business = ref(null)
const relatedEstablishments = ref([])
const selectedImageIndex = ref(0)
const activeTab = ref('overview')
const reviewName = ref('')
const reviewComment = ref('')
const reviewRating = ref(0)
const reviews = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const galleryImages = computed(() => {
  const images = Array.isArray(business.value?.images) ? business.value.images : []
  if (images.length) return images
  if (business.value?.imageUrl) {
    return [{ id: 'cover', url: business.value.imageUrl, altText: `${business.value.name} photo` }]
  }
  return []
})

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || null)

const fullAddress = computed(() => {
  if (!business.value) return ''
  return [
    business.value.addressLine,
    business.value.barangay,
    business.value.municipality,
    business.value.province,
  ]
    .filter(Boolean)
    .join(', ')
})

const mapUrl = computed(() => {
  const latitude = Number(business.value?.latitude)
  const longitude = Number(business.value?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''

  const delta = 0.012
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(',')

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`
})

const ownerManager = computed(() => {
  if (!business.value) return ''
  const structure = String(business.value.legalStructure || '').toLowerCase()
  const partners = Array.isArray(business.value.partners) ? business.value.partners : []

  if (structure.includes('partnership') && partners.length) {
    return partners.join(', ')
  }

  if (structure.includes('corporation') && business.value.authorizedRepresentativeName) {
    return [
      business.value.authorizedRepresentativeName,
      business.value.authorizedRepresentativePosition,
    ]
      .filter(Boolean)
      .join(', ')
  }

  return business.value.owner || 'Registered business owner'
})

const infoRows = computed(() => {
  if (!business.value) return []

  return [
    ['Province', business.value.province],
    ['City / Municipality', business.value.municipality],
    ['Address', fullAddress.value],
    ['Date Accredited', formatDate(business.value.issuedAt) || business.value.accreditedSince],
    ['Status', readableStatus(business.value.accreditationStatus)],
    ['Type of Organization', business.value.type],
    ['Validity', formatDate(business.value.expiresAt) || 'No expiry date set'],
    ['Owner / Manager', ownerManager.value],
    ['Phone', business.value.phone],
    ['Email', business.value.contactEmail],
  ].filter(([, value]) => value)
})

const businessLinks = computed(() => {
  const links = business.value?.socialLinks || {}
  return [
    ['Website', links.website],
    ['Facebook', links.facebook],
    ['Instagram', links.instagram],
    ['TikTok', links.tiktok],
    ['Twitter / X', links.twitter],
  ].filter(([, url]) => url)
})

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function readableStatus(value) {
  return String(value || 'accredited')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function initials(name) {
  return String(name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function selectImage(index) {
  selectedImageIndex.value = index
}

function showPreviousImage() {
  if (!galleryImages.value.length) return
  selectedImageIndex.value =
    (selectedImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

function showNextImage() {
  if (!galleryImages.value.length) return
  selectedImageIndex.value = (selectedImageIndex.value + 1) % galleryImages.value.length
}

function submitReview() {
  if (!reviewName.value.trim()) return

  reviews.value.push({
    id: Date.now(),
    name: reviewName.value.trim(),
    comment: reviewComment.value.trim(),
    rating: reviewRating.value,
  })

  reviewName.value = ''
  reviewComment.value = ''
  reviewRating.value = 0
}

async function loadEstablishment() {
  isLoading.value = true
  errorMessage.value = ''
  selectedImageIndex.value = 0
  activeTab.value = 'overview'

  try {
    const detail = await getAccreditedBusinessBySlug(props.slug)
    business.value = detail

    if (Array.isArray(detail.relatedEstablishments) && detail.relatedEstablishments.length) {
      relatedEstablishments.value = detail.relatedEstablishments
    } else {
      const allEstablishments = await getAccreditedBusinesses({ limit: 5 })
      relatedEstablishments.value = allEstablishments.filter((item) => item.id !== detail.id).slice(0, 4)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    business.value = null
    relatedEstablishments.value = []
    errorMessage.value = error.message || 'Unable to load establishment information.'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.slug, loadEstablishment)
onMounted(loadEstablishment)
</script>

<template>
  <div class="establishment-page">
    <PromotionNavbar />

    <main>
      <section class="detail-section">
        <div class="page-shell">
          <div v-if="isLoading" class="detail-state">Loading establishment information...</div>
          <div v-else-if="errorMessage" class="detail-state">{{ errorMessage }}</div>

          <template v-else-if="business">
            <header class="detail-heading">
              <p>Calabanga Accredited Establishment</p>
              <h1>Establishment Information</h1>
            </header>

            <div class="map-panel">
              <iframe
                v-if="mapUrl"
                :src="mapUrl"
                :title="`${business.name} map location`"
                loading="lazy"
              ></iframe>
              <div v-else class="map-fallback">
                <strong>{{ business.name }}</strong>
                <span>{{ fullAddress || business.location }}</span>
              </div>
            </div>

            <section class="profile-summary">
              <div>
                <h2>{{ business.name }}</h2>
                <p v-if="business.accreditationNumber">
                  Accreditation Number: {{ business.accreditationNumber }}
                </p>
                <span>{{ business.type }}</span>
              </div>
            </section>

            <nav class="detail-tabs" aria-label="Establishment sections">
              <button
                type="button"
                :class="{ active: activeTab === 'overview' }"
                @click="activeTab = 'overview'"
              >
                Overview
              </button>
              <button
                type="button"
                :class="{ active: activeTab === 'reviews' }"
                @click="activeTab = 'reviews'"
              >
                Reviews
              </button>
              <button
                type="button"
                :class="{ active: activeTab === 'about' }"
                @click="activeTab = 'about'"
              >
                About
              </button>
            </nav>

            <section v-if="activeTab === 'overview'" id="overview" class="information-section">
              <h2>Establishment Information</h2>
              <p v-if="business.description" class="description">{{ business.description }}</p>
              <dl>
                <div v-for="[label, value] in infoRows" :key="label">
                  <dt>{{ label }}</dt>
                  <dd>{{ value }}</dd>
                </div>
              </dl>

              <div class="overview-gallery">
                <div v-if="selectedImage" class="carousel">
                  <button type="button" aria-label="Previous photo" @click="showPreviousImage">
                    &lt;
                  </button>
                  <img :src="selectedImage.url" :alt="selectedImage.altText || `${business.name} photo`" />
                  <button type="button" aria-label="Next photo" @click="showNextImage">
                    &gt;
                  </button>
                </div>
                <div v-else class="photo-placeholder">{{ initials(business.name) }}</div>

                <div v-if="galleryImages.length > 1" class="thumbnail-row">
                  <button
                    v-for="(image, index) in galleryImages"
                    :key="image.id || image.url"
                    type="button"
                    :class="{ active: index === selectedImageIndex }"
                    @click="selectImage(index)"
                  >
                    <img :src="image.url" :alt="image.altText || `${business.name} thumbnail`" />
                  </button>
                </div>
              </div>
            </section>

            <section v-else-if="activeTab === 'reviews'" id="reviews" class="reviews-section">
              <form class="review-form" @submit.prevent="submitReview">
                <h2>Submit a review</h2>

                <input v-model="reviewName" type="text" placeholder="Name (required)" required />
                <textarea
                  v-model="reviewComment"
                  rows="5"
                  placeholder="Leave a comment..."
                ></textarea>

                <div class="rating-row">
                  <span>Rate establishment:</span>
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    :class="{ selected: star <= reviewRating }"
                    :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`"
                    @click="reviewRating = star"
                  >
                    ★
                  </button>
                </div>

                <button class="submit-review" type="submit">Submit</button>
              </form>

              <div class="reviews-list">
                <h2>Reviews and ratings ({{ reviews.length }})</h2>
                <article v-for="review in reviews" :key="review.id" class="review-item">
                  <strong>{{ review.name }}</strong>
                  <span>{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
                  <p v-if="review.comment">{{ review.comment }}</p>
                </article>
              </div>
            </section>

            <section v-else id="about" class="about-section">
              <h2>About</h2>
              <p class="description">
                {{ business.description || 'Business profile description is being prepared.' }}
              </p>

              <div v-if="businessLinks.length" class="business-links">
                <a
                  v-for="[label, url] in businessLinks"
                  :key="label"
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ label }}
                </a>
              </div>
              <div v-else class="no-links">
                Business profile links are not available yet.
              </div>
            </section>

            <section id="other-establishments" class="related-section">
              <div class="section-title">
                <p>Explore More</p>
                <h2>Other Establishments</h2>
              </div>

              <div v-if="relatedEstablishments.length" class="related-grid">
                <RouterLink
                  v-for="item in relatedEstablishments"
                  :key="item.id"
                  class="related-card"
                  :to="{ name: 'promotion-establishment-information', params: { slug: item.slug || item.id } }"
                >
                  <div class="related-card__media">
                    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="`${item.name} photo`" />
                    <span v-else>{{ initials(item.name) }}</span>
                  </div>
                  <strong>{{ item.name }}</strong>
                  <p>{{ item.type }}</p>
                </RouterLink>
              </div>
              <p v-else class="related-empty">Other accredited establishments will appear here once available.</p>
            </section>
          </template>
        </div>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.establishment-page {
  min-height: 100vh;
  background: #ffffff;
  color: #173c33;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

.establishment-page,
.establishment-page *,
.establishment-page *::before,
.establishment-page *::after {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
}

.page-shell {
  width: min(100% - 48px, 1120px);
  margin: 0 auto;
}

.detail-section {
  padding: 112px 0 88px;
}

.detail-state {
  margin-top: 32px;
  padding: 28px;
  border: 1px solid #d8e1dc;
  border-radius: 8px;
  color: #4f625c;
}

.detail-heading {
  text-align: center;
}

.detail-heading p,
.section-title p {
  margin: 0;
  color: #c7771a;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-heading h1,
.profile-summary h2,
.information-section h2,
.about-section h2,
.section-title h2 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.15;
}

.detail-heading h1 {
  margin-top: 6px;
  color: #063d77;
  font-size: clamp(32px, 5vw, 54px);
  font-weight: 800;
}

.map-panel {
  height: 280px;
  overflow: hidden;
  margin-top: 34px;
  border: 1px solid #d8e1dc;
  border-radius: 8px;
  background: #e6f2ec;
}

.map-panel iframe,
.map-fallback {
  width: 100%;
  height: 100%;
  border: 0;
}

.map-fallback {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.map-fallback strong {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 20px;
}

.map-fallback span {
  color: #4f625c;
}

.profile-summary {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 12px 18px;
}

.profile-summary h2 {
  color: #061f1a;
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 800;
}

.profile-summary p {
  margin: 4px 0 0;
  color: #213d36;
  font-size: 14px;
}

.profile-summary span {
  display: inline-flex;
  margin-top: 4px;
  color: #35655a;
  font-size: 13px;
  font-weight: 700;
}

.detail-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #173c33;
}

.detail-tabs button {
  padding: 14px 10px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: #0f43b5;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}

.detail-tabs button.active {
  color: #061f1a;
  border-bottom: 3px solid #061f1a;
}

.information-section,
.reviews-section,
.about-section,
.related-section {
  padding: 34px 0 0;
}

.information-section h2,
.reviews-section h2,
.about-section h2,
.section-title h2 {
  color: #061f1a;
  font-size: 24px;
  font-weight: 800;
}

.description {
  max-width: 820px;
  margin: 12px 0 0;
  color: #4f625c;
}

.information-section dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 64px;
  margin: 22px 0 0;
}

.information-section div {
  min-width: 0;
}

.information-section dt {
  color: #63756f;
  font-size: 12px;
  font-weight: 700;
}

.information-section dd {
  margin: 2px 0 0;
  color: #102c26;
  font-size: 14px;
  font-weight: 600;
}

.review-form {
  padding-bottom: 28px;
  border-bottom: 1px solid #e5e8e6;
}

.review-form h2,
.reviews-list h2 {
  font-size: 24px;
}

.review-form input,
.review-form textarea {
  width: 100%;
  display: block;
  margin-top: 20px;
  border: 1px solid #c7d1cc;
  border-radius: 3px;
  background: #ffffff;
  color: #102c26;
  font: inherit;
  font-size: 14px;
}

.review-form input {
  height: 38px;
  padding: 0 14px;
}

.review-form textarea {
  min-height: 108px;
  padding: 12px 14px;
  resize: vertical;
}

.rating-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin-top: 12px;
  color: #061f1a;
  font-size: 15px;
}

.rating-row span {
  margin-right: 2px;
}

.rating-row button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #c5c9c7;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
}

.rating-row button.selected {
  color: #f0a33a;
}

.submit-review {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 18px;
  border: 0;
  border-radius: 4px;
  background: #3fb14f;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.submit-review:hover {
  background: #319440;
}

.reviews-list {
  padding-top: 28px;
}

.review-item {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #d8e1dc;
  border-radius: 6px;
}

.review-item strong {
  display: block;
  color: #061f1a;
}

.review-item span {
  display: block;
  margin-top: 2px;
  color: #f0a33a;
}

.review-item p {
  margin: 8px 0 0;
  color: #4f625c;
}

.overview-gallery {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #d8e1dc;
}

.business-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.business-links a {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border: 1px solid #d7e5dd;
  border-radius: 999px;
  color: #173c33;
  font-size: 13px;
  font-weight: 800;
}

.business-links a:hover {
  background: #e6f2ec;
}

.no-links {
  margin-top: 16px;
  color: #63756f;
  font-size: 14px;
}

.carousel {
  position: relative;
  width: min(100%, 860px);
  aspect-ratio: 16 / 9;
  margin: 22px auto 0;
  overflow: hidden;
  border-radius: 8px;
  background: #e6f2ec;
}

.carousel img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.carousel button {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: rgba(6, 31, 26, 0.7);
  color: #ffffff;
  cursor: pointer;
  transform: translateY(-50%);
}

.carousel button:first-child {
  left: 14px;
}

.carousel button:last-child {
  right: 14px;
}

.thumbnail-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}

.thumbnail-row button {
  width: 54px;
  height: 54px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}

.thumbnail-row button.active {
  border-color: #c7771a;
}

.thumbnail-row img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.photo-placeholder {
  width: min(100%, 860px);
  aspect-ratio: 16 / 9;
  display: grid;
  place-items: center;
  margin: 22px auto 0;
  border-radius: 8px;
  background: #e6f2ec;
  color: #173c33;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 48px;
  font-weight: 800;
}

.related-section {
  margin-top: 34px;
  border-top: 1px solid #d8e1dc;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.related-empty {
  margin: 16px 0 0;
  color: #63756f;
  font-size: 14px;
}

.related-card {
  min-width: 0;
  display: block;
  border: 1px solid #d8e1dc;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.related-card:hover {
  border-color: #173c33;
  box-shadow: 0 16px 28px rgba(23, 60, 51, 0.1);
  transform: translateY(-2px);
}

.related-card__media {
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  background: #e6f2ec;
  color: #173c33;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 800;
}

.related-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.related-card strong,
.related-card p {
  display: block;
  padding: 0 14px;
}

.related-card strong {
  margin-top: 14px;
  color: #061f1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 16px;
}

.related-card p {
  margin: 4px 0 14px;
  color: #4f625c;
  font-size: 13px;
}

@media (max-width: 900px) {
  .detail-section {
    padding-top: 96px;
  }

  .information-section dl,
  .related-grid {
    grid-template-columns: 1fr;
  }

  .detail-tabs {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100% - 32px, 1120px);
  }

  .map-panel {
    height: 220px;
  }

  .profile-summary {
    padding-inline: 0;
  }

  .carousel button {
    width: 34px;
    height: 34px;
  }
}
</style>
