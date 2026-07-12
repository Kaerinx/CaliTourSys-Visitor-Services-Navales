<script setup>
import AccreditationBadge from '../components/AccreditationBadge.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { computed, onMounted, ref } from 'vue'
import { getAccreditedBusinesses } from '../services/promotionService'

const businesses = ref([])
const searchQuery = ref('')
const activeType = ref('All types')
const isLoading = ref(true)
const errorMessage = ref('')

const typeOptions = computed(() => [
  'All types',
  ...new Set(businesses.value.map((business) => business.type).filter(Boolean)),
])

const filteredBusinesses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return businesses.value.filter((business) => {
    const matchesType = activeType.value === 'All types' || business.type === activeType.value
    const matchesQuery =
      !query ||
      [business.name, business.type, business.owner, business.location, business.description]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesType && matchesQuery
  })
})

function initials(name) {
  return String(name || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function socialEntries(business) {
  const links = business.socialLinks || {}
  return [
    { key: 'website', label: 'Website', url: links.website },
    { key: 'facebook', label: 'Facebook', url: links.facebook },
    { key: 'instagram', label: 'Instagram', url: links.instagram },
    { key: 'tiktok', label: 'TikTok', url: links.tiktok },
    { key: 'twitter', label: 'Twitter / X', url: links.twitter },
  ].filter((item) => item.url)
}

function clearFilters() {
  searchQuery.value = ''
  activeType.value = 'All types'
}

async function loadBusinesses() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    businesses.value = await getAccreditedBusinesses()
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load accredited establishments.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadBusinesses)
</script>

<template>
  <div class="establishments-page">
    <PromotionNavbar />

    <main>
      <section class="establishments-hero">
        <div class="page-shell establishments-hero__inner">
          <div>
            <p class="eyebrow">LGU Accredited</p>
            <h1>Accredited Establishments</h1>
            <p>
              Browse tourism businesses and local producers officially accredited by the LGU Tourism
              Office.
            </p>
          </div>

          <div class="hero-stat" aria-label="Accredited establishment count">
            <strong>{{ businesses.length }}</strong>
            <span>verified businesses</span>
          </div>
        </div>
      </section>

      <section class="directory-section">
        <div class="page-shell">
          <div class="directory-toolbar">
            <label class="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input v-model="searchQuery" placeholder="Search accredited businesses..." />
            </label>

            <label class="select-field">
              <span>Type</span>
              <select v-model="activeType">
                <option v-for="type in typeOptions" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </label>

            <button class="clear-filters" type="button" @click="clearFilters">Reset</button>
          </div>

          <div class="result-summary">
            <p>
              Showing <strong>{{ filteredBusinesses.length }}</strong>
              {{ filteredBusinesses.length === 1 ? 'establishment' : 'establishments' }}
            </p>
          </div>

          <div v-if="isLoading" class="directory-state">Loading accredited establishments...</div>
          <div v-else-if="errorMessage" class="directory-state">{{ errorMessage }}</div>
          <div v-else-if="filteredBusinesses.length === 0" class="empty-state">
            <div></div>
            <h2>No establishments found</h2>
            <p>Try a different search or business type.</p>
            <button type="button" @click="clearFilters">Clear filters</button>
          </div>

          <div v-else class="business-grid">
            <RouterLink
              v-for="business in filteredBusinesses"
              :key="business.id"
              class="business-card"
              :to="{ name: 'promotion-establishment-information', params: { slug: business.slug || business.id } }"
            >
              <div class="business-card__media">
                <img
                  v-if="business.imageUrl"
                  :src="business.imageUrl"
                  :alt="`${business.name} cover photo`"
                />
                <span v-else>{{ initials(business.name) }}</span>
              </div>
              <div class="business-card__body">
                <AccreditationBadge floating />
                <h2>{{ business.name }}</h2>
                <p>{{ business.description }}</p>
                <div v-if="socialEntries(business).length" class="business-socials">
                  <a
                    v-for="link in socialEntries(business)"
                    :key="link.key"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ link.label }}
                  </a>
                </div>
                <dl>
                  <div>
                    <dt>Business Type</dt>
                    <dd>{{ business.type }}</dd>
                  </div>
                  <div>
                    <dt>Owner</dt>
                    <dd>{{ business.owner }}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{{ business.location }}</dd>
                  </div>
                  <div>
                    <dt>Accredited Since</dt>
                    <dd>{{ business.accreditedSince }}</dd>
                  </div>
                </dl>
              </div>
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

.establishments-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

.establishments-page,
.establishments-page *,
.establishments-page *::before,
.establishments-page *::after {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select {
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

.establishments-hero {
  padding-top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.establishments-hero__inner {
  min-height: 250px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 48px;
  padding: 54px 0 44px;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  margin-top: 14px;
  color: #1a1a1a;
  font-size: 44px;
  font-weight: 700;
}

.establishments-hero p:last-child {
  max-width: 670px;
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.hero-stat {
  min-width: 210px;
  padding: 24px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #f2f0eb;
}

.hero-stat strong {
  display: block;
  color: #1b4332;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 40px;
  line-height: 1;
}

.hero-stat span {
  display: block;
  margin-top: 8px;
  color: #5c5c5c;
  font-size: 13px;
  font-weight: 500;
}

.directory-section {
  min-height: 60vh;
  padding: 42px 0 96px;
  background: #f2f0eb;
}

.directory-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.search-field,
.select-field {
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
  width: min(420px, 100%);
  background: #ffffff;
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

.select-field {
  min-width: 230px;
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
  font-size: 14px;
}

.clear-filters,
.empty-state button {
  height: 44px;
  padding: 0 16px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.clear-filters:hover,
.empty-state button:hover {
  background: #d8f3dc;
}

.result-summary {
  margin-bottom: 24px;
}

.result-summary p {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
}

.result-summary strong {
  color: #1a1a1a;
  font-weight: 600;
}

.directory-state,
.empty-state {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  color: #5c5c5c;
}

.directory-state {
  padding: 28px 24px;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 24px;
  text-align: center;
}

.empty-state div {
  width: 150px;
  height: 150px;
  border: 2px dashed #bdbdbd;
  border-radius: 16px;
}

.empty-state h2 {
  margin-top: 24px;
  color: #1a1a1a;
  font-size: 20px;
}

.empty-state p {
  max-width: 380px;
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.empty-state button {
  margin-top: 24px;
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.business-card {
  min-width: 0;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 18px;
  padding: 22px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.business-card:hover {
  border-color: #1b4332;
  box-shadow: 0 18px 36px rgba(27, 67, 50, 0.1);
  transform: translateY(-2px);
}

.business-card__media {
  width: 180px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.28), transparent 45%),
    linear-gradient(135deg, #1b4332, #1b7a4a);
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
}

.business-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.business-card__media span {
  display: grid;
  place-items: center;
}

.business-card__body {
  min-width: 0;
}

.business-card h2 {
  margin-top: 12px;
  color: #1a1a1a;
  font-size: 22px;
  font-weight: 700;
}

.business-card p {
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.business-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.business-socials a {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid #d7e5dd;
  border-radius: 999px;
  color: #1b4332;
  font-size: 12px;
  font-weight: 700;
}

.business-socials a:hover {
  background: #d8f3dc;
}

dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 18px 0 0;
}

dt {
  color: #7a7771;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

dd {
  margin: 3px 0 0;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.35;
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .establishments-hero__inner,
  .business-grid,
  .site-footer__main {
    grid-template-columns: 1fr;
  }

  .hero-stat {
    width: 100%;
  }
}

@media (max-width: 760px) {
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

  .directory-toolbar,
  .search-field,
  .select-field,
  .clear-filters {
    width: 100%;
  }

  .business-card {
    grid-template-columns: 1fr;
  }

  .business-card__media {
    width: 100%;
  }

  dl {
    grid-template-columns: 1fr;
  }

  .site-footer__main {
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
