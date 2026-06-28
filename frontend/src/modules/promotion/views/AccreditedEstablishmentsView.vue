<script setup>
import { computed, onMounted, ref } from 'vue'
import { getAccreditedBusinesses } from '../services/promotionService'
import { useNewsletterForm } from '../composables/useNewsletterForm'

const businesses = ref([])
const searchQuery = ref('')
const activeType = ref('All types')
const isLoading = ref(true)
const errorMessage = ref('')
const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm()

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
          <RouterLink to="/packages" class="site-nav__link">Packages</RouterLink>
          <RouterLink to="/events" class="site-nav__link">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
          <div class="site-nav__dropdown">
            <button
              class="site-nav__link site-nav__dropdown-trigger site-nav__link--active"
              type="button"
              aria-haspopup="true"
            >
              Accreditation
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div class="site-nav__dropdown-menu">
              <RouterLink to="/accreditation">Online Accreditation</RouterLink>
              <RouterLink to="/accredited-establishments">Accredited Establishments</RouterLink>
            </div>
          </div>
          <RouterLink to="/promotion/inquiry" class="site-nav__link">Inquiries</RouterLink>
        </nav>

        <div class="site-nav__actions">
          <button class="icon-button" type="button" aria-label="Search planned for later" disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </button>
          <RouterLink class="login-button" :to="{ path: $route.path, query: { ...$route.query, auth: 'login' } }" aria-label="Open visitor login">
            Login
          </RouterLink>
          <button class="icon-button icon-button--menu" type="button" aria-label="Menu" disabled title="Mobile menu is planned for a later phase">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main>
      <section class="establishments-hero">
        <div class="page-shell establishments-hero__inner">
          <div>
            <p class="eyebrow">LGU Accredited</p>
            <h1>Accredited Establishments</h1>
            <p>
              Browse tourism businesses and local producers officially accredited by the LGU
              Tourism Office.
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
            <article v-for="business in filteredBusinesses" :key="business.id" class="business-card">
              <div class="business-card__mark" aria-hidden="true">
                {{ initials(business.name) }}
              </div>
              <div class="business-card__body">
                <span class="accreditation-badge">
                  <span></span>
                  LGU Accredited
                </span>
                <h2>{{ business.name }}</h2>
                <p>{{ business.description }}</p>
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
            </article>
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
            <a aria-label="Instagram page pending" aria-disabled="true">o</a>
            <a aria-label="Youtube page pending" aria-disabled="true">></a>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <RouterLink to="/destinations">Destinations &amp; Map</RouterLink>
          <RouterLink to="/products">Products</RouterLink>
          <RouterLink to="/packages">Packages</RouterLink>
          <RouterLink to="/events">Events</RouterLink>
          <RouterLink to="/promotion/museum">Virtual Museum</RouterLink>
          <RouterLink to="/accredited-establishments">Accredited Establishments</RouterLink>
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
          <span>&copy; 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
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
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
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
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
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
  grid-template-columns: 84px minmax(0, 1fr);
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

.business-card__mark {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.28), transparent 45%),
    linear-gradient(135deg, #1b4332, #1b7a4a);
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
}

.business-card__body {
  min-width: 0;
}

.accreditation-badge {
  min-height: 24px;
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
