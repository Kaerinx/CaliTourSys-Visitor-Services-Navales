<script setup>
import { computed, onMounted, ref } from 'vue'
import { getMuseumItems, sharePublicItem } from '../services/promotionService'
import { useNewsletterForm } from '../composables/useNewsletterForm'

const filters = ['All', 'Pre-colonial', 'Spanish-era', 'Modern']

const artifacts = ref([
  {
    id: 'burnay',
    name: 'Burnay Earthen Jar',
    era: 'Pre-colonial · 14th c.',
    accent: '#7B341E',
    desc: 'Coil-built clay vessel used for storing fermented fish paste across coastal barangays.',
  },
  {
    id: 'bell',
    name: 'Quipayo Church Bell',
    era: 'Spanish era · 1792',
    accent: '#5C3318',
    desc: 'Bronze bell cast in Manila and gifted to the Quipayo parish; bears the seal of the Franciscan order.',
  },
  {
    id: 'abaca',
    name: 'Ceremonial Abaca Cloth',
    era: 'Pre-colonial',
    accent: '#D4711B',
    desc: 'Hand-woven sinamay textile used in pre-Hispanic burial and rite-of-passage ceremonies.',
  },
  {
    id: 'fishing',
    name: 'Outrigger Bow Carving',
    era: 'Late 1800s',
    accent: '#1B4332',
    desc: 'Carved hardwood prow from a San Miguel Bay banca, decorated with protective sea spirits.',
  },
  {
    id: 'coin',
    name: 'Bicol Trade Currency',
    era: '16th-17th c.',
    accent: '#D4AC0D',
    desc: 'Silver tael fragments recovered from a galleon trade route shipwreck off Sabang Point.',
  },
  {
    id: 'mask',
    name: 'Harvest Festival Mask',
    era: 'Early 1900s',
    accent: '#B5451B',
    desc: 'Carved wooden mask used by farmers in the annual rice harvest thanksgiving ritual.',
  },
])

const activeFilter = ref('All')
const selectedItem = ref(null)
const feedbackMessage = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm()

const filteredArtifacts = computed(() => {
  if (activeFilter.value === 'All') return artifacts.value

  return artifacts.value.filter((artifact) => artifact.era.includes(activeFilter.value))
})

async function loadArtifacts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    artifacts.value = await getMuseumItems({ limit: 50 })
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public museum artifacts.'
  } finally {
    isLoading.value = false
  }
}

async function shareArtifact(artifact) {
  const result = await sharePublicItem({
    title: artifact.name,
    text: artifact.desc,
    path: `/promotion/museum?artifact=${artifact.id}`,
  })

  feedbackMessage.value =
    result.method === 'clipboard' ? 'Museum link copied' : 'Share action ready'
}

onMounted(loadArtifacts)
</script>

<template>
  <div class="museum-page">
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
          <RouterLink to="/promotion/products" class="site-nav__link">Products</RouterLink>
          <RouterLink to="/packages" class="site-nav__link">Packages</RouterLink>
          <RouterLink to="/promotion/events" class="site-nav__link">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link site-nav__link--active">
            Museum
          </RouterLink>
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
      <section class="museum-hero">
        <div class="museum-hero__copy">
          <p class="eyebrow">Calabanga Heritage Collection</p>
          <h1>Calabanga Cultural Museum</h1>
          <p>
            Step into centuries of Bicolano craft, faith, and seafaring tradition - digitized for
            the world.
          </p>
          <div class="hero-actions">
            <button class="button button--white" type="button" disabled title="Intro video is planned for a later public content phase">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7L8 5Z" />
              </svg>
              Watch intro
            </button>
            <button class="button button--ghost-white" type="button">Browse collection</button>
          </div>
        </div>
      </section>

      <section class="collection-section">
        <div class="page-shell">
          <div class="collection-heading">
            <div>
              <h2>The Collection</h2>
              <p>
                6 artifacts spanning pre-colonial trade, Spanish-era worship, and 20th-century
                folk tradition.
              </p>
            </div>

            <div class="filter-row">
              <button
                v-for="(filter, index) in filters"
                :key="filter"
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': activeFilter === filter }"
                @click="activeFilter = filter"
              >
                {{ filter }}
              </button>
            </div>
          </div>

          <div v-if="isLoading" class="museum-state">Loading public museum records...</div>
          <div v-else-if="errorMessage" class="museum-state">{{ errorMessage }}</div>

          <div v-else class="artifact-grid">
            <button
              v-for="artifact in filteredArtifacts"
              :key="artifact.id"
              type="button"
              class="artifact-card"
              @click="selectedItem = artifact"
            >
              <span
                class="artifact-card__image"
                :style="{
                  '--artifact-accent': artifact.accent,
                  backgroundImage: artifact.imageUrl ? `url(${artifact.imageUrl})` : undefined,
                }"
              ></span>
              <span class="artifact-card__body">
                <span class="era-badge">{{ artifact.era }}</span>
                <strong>{{ artifact.name }}</strong>
                <span>{{ artifact.desc }}</span>
                <span class="artifact-card__link">
                  Explore
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <div v-if="!isLoading && filteredArtifacts.length === 0" class="museum-empty page-shell">
        <div></div>
        <h2>No artifacts found</h2>
        <p>Try a different museum category.</p>
      </div>
    </main>

    <div v-if="selectedItem" class="artifact-modal" @click.self="selectedItem = null">
      <article class="artifact-modal__panel">
        <div class="artifact-modal__image" :style="{ '--artifact-accent': selectedItem.accent }"></div>
        <div class="artifact-modal__body">
          <button class="artifact-modal__close" type="button" aria-label="Close" @click="selectedItem = null">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <p>Collection / Heritage</p>
          <h2>{{ selectedItem.name }}</h2>
          <span class="era-badge">{{ selectedItem.era }}</span>
          <p>{{ selectedItem.desc }}</p>
          <p>
            Recovered and preserved by the LGU Calabanga heritage program in collaboration with
            local cultural partners.
          </p>
          <div class="artifact-modal__actions">
            <button class="artifact-modal__share" type="button" @click="shareArtifact(selectedItem)">Share artifact</button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="feedbackMessage" class="feedback-toast">{{ feedbackMessage }}</div>

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
            <a aria-label="Instagram page pending" aria-disabled="true">◎</a>
            <a aria-label="Youtube page pending" aria-disabled="true">▶</a>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <RouterLink to="/promotion/map">Map &amp; Discovery</RouterLink>
          <RouterLink to="/promotion/products">Products</RouterLink>
          <RouterLink to="/packages">Packages</RouterLink>
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

.museum-page {
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

.icon-button svg {
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

.login-button:disabled {
  cursor: default;
  opacity: 0.72;
}

.museum-hero {
  min-height: 660px;
  display: grid;
  place-items: center;
  padding: 128px 24px 72px;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.55)),
    linear-gradient(120deg, #7b341e 0%, #b5451b 60%, #d4711b 100%);
  text-align: center;
}

.museum-hero__copy {
  max-width: 720px;
  color: #ffffff;
}

.eyebrow {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  line-height: 1.2;
}

.museum-hero h1 {
  margin-top: 18px;
  color: #ffffff;
  font-size: 56px;
  font-weight: 700;
  line-height: 1.05;
}

.museum-hero p:not(.eyebrow) {
  max-width: 670px;
  margin: 24px auto 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 17px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}

.button {
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.button svg {
  width: 18px;
  height: 18px;
}

.button--white {
  border: 0;
  background: #ffffff;
  color: #1b4332;
}

.button--white svg {
  fill: currentColor;
}

.button--ghost-white {
  border: 1.5px solid #ffffff;
  background: transparent;
  color: #ffffff;
}

.collection-section {
  padding: 64px 0 128px;
  background: #f2f0eb;
}

.collection-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 34px;
}

.collection-heading h2 {
  color: #1a1a1a;
  font-size: 32px;
  font-weight: 600;
}

.collection-heading p {
  max-width: 620px;
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.filter-chip {
  height: 36px;
  padding: 0 18px;
  border: 1px solid #e8e4dc;
  border-radius: 999px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.filter-chip--active {
  border-color: #1b4332;
  background: #1b4332;
  color: #ffffff;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.museum-state {
  padding: 28px 24px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  color: #5c5c5c;
  font-size: 14px;
}

.artifact-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.artifact-card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.artifact-card__image {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  background:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.35), transparent 45%),
    radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.24), transparent 55%),
    linear-gradient(135deg, var(--artifact-accent), color-mix(in srgb, var(--artifact-accent) 62%, white));
  background-position: center;
  background-size: cover;
}

.artifact-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 20px;
}

.era-badge {
  align-self: flex-start;
  min-height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: #fff9e6;
  color: #7d5a00;
  font-size: 12px;
  font-weight: 500;
}

.artifact-card strong {
  margin-top: 12px;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
}

.artifact-card__body > span:not(.era-badge):not(.artifact-card__link) {
  margin-top: 9px;
  color: #5c5c5c;
  font-size: 14px;
}

.artifact-card__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.artifact-card__link svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.museum-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -80px;
  margin-bottom: 96px;
  padding: 64px 24px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
}

.museum-empty div {
  width: 160px;
  height: 160px;
  border: 2px dashed #bdbdbd;
  border-radius: 16px;
}

.museum-empty h2 {
  margin-top: 24px;
  color: #1a1a1a;
  font-size: 20px;
}

.museum-empty p {
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.artifact-modal {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.6);
}

.artifact-modal__panel {
  width: min(800px, 100%);
  max-height: 90vh;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 16px;
  background: #ffffff;
  animation: fadeUp 200ms ease-out both;
}

.artifact-modal__image {
  min-height: 420px;
  background:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.35), transparent 45%),
    radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.24), transparent 55%),
    linear-gradient(135deg, var(--artifact-accent), color-mix(in srgb, var(--artifact-accent) 62%, white));
}

.artifact-modal__body {
  position: relative;
  overflow-y: auto;
  padding: 32px;
}

.artifact-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  cursor: pointer;
}

.artifact-modal__close svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.artifact-modal__body > p:first-of-type {
  margin: 0 0 8px;
  color: #5c5c5c;
  font-size: 12px;
}

.artifact-modal__body h2 {
  margin: 0 40px 12px 0;
  color: #1a1a1a;
  font-size: 30px;
}

.artifact-modal__body > p:not(:first-of-type) {
  margin: 18px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.artifact-modal__share {
  height: 40px;
  margin-top: 24px;
  padding: 0 16px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.artifact-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.artifact-modal__actions .artifact-modal__share {
  margin-top: 0;
}

.subscribe-form button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.feedback-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 120;
  width: 280px;
  padding: 14px 16px;
  border-left: 4px solid #1b7a4a;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
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

  .artifact-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .site-footer__main {
    grid-template-columns: repeat(2, 1fr);
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

  .museum-hero {
    min-height: 620px;
  }

  .museum-hero h1 {
    font-size: 42px;
  }

  .hero-actions,
  .collection-heading {
    align-items: center;
    flex-direction: column;
  }

  .collection-heading {
    align-items: flex-start;
  }

  .filter-row {
    justify-content: flex-start;
  }

  .artifact-grid {
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
