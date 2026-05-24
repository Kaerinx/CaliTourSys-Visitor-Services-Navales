<script setup>
import { onMounted, ref } from 'vue'
import {
  getEvents,
  getMapLocations,
  getPromotionalProducts,
} from '../services/promotionService'
import { useNewsletterForm } from '../composables/useNewsletterForm'

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
])

const events = ref([
  {
    id: 'pili-fest',
    title: 'Pili Festival 2026',
    day: '24',
    month: 'MAY',
    location: 'Calabanga Town Plaza',
    category: 'Festival',
    accent: '#B5451B',
    desc: 'A week-long celebration of the pili nut harvest with parades, cooking competitions, and live cultural performances along the plaza.',
  },
  {
    id: 'regatta',
    title: 'San Miguel Bay Regatta',
    day: '08',
    month: 'JUN',
    location: 'Sabang Beach Front',
    category: 'Sports',
    accent: '#1565C0',
    desc: 'Traditional outrigger boats race across the bay at sunrise - a centuries-old tradition of our fishing barangays.',
  },
  {
    id: 'art-walk',
    title: 'Quipayo Heritage Art Walk',
    day: '15',
    month: 'JUN',
    location: 'Quipayo Old Stone Church',
    category: 'Culture',
    accent: '#7B341E',
    desc: 'Walking tour of murals, weaving demos, and the 18th-century Quipayo church bell tower.',
  },
])

const locations = ref([
  { id: 'sabang', name: 'Sabang Beach', color: '#1565C0', distance: '4.2 km', x: 42, y: 40 },
  { id: 'quipayo', name: 'Quipayo Old Church', color: '#7B341E', distance: '2.1 km', x: 56, y: 30 },
  { id: 'belen', name: 'Belen Pottery Village', color: '#7B341E', distance: '6.8 km', x: 70, y: 60 },
  { id: 'isarog', name: 'Mt. Isarog Foothills', color: '#1B7A4A', distance: '9.4 km', x: 82, y: 20 },
  { id: 'market', name: 'Calabanga Public Market', color: '#B5451B', distance: '0.6 km', x: 58, y: 72 },
])

const isLoading = ref(true)
const errorMessage = ref('')
const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm()

const quickCategories = [
  { label: 'Nature', helper: 'Browse nature', icon: 'leaf' },
  { label: 'Cultural', helper: 'Browse cultural', icon: 'landmark' },
  { label: 'Food', helper: 'Browse food', icon: 'food' },
  { label: 'Events', helper: 'Browse events', icon: 'calendar' },
]

const filters = [
  { label: 'Nature & Outdoors', count: 18, active: true, color: '#1B7A4A' },
  { label: 'Beaches', count: 7, active: true, color: '#1565C0' },
  { label: 'Cultural Sites', count: 12, active: false, color: '#7B341E' },
  { label: 'Food & Markets', count: 9, active: true, color: '#B5451B' },
]

async function loadHomeData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [productData, eventData, locationData] = await Promise.all([
      getPromotionalProducts({ featured: true, limit: 8 }),
      getEvents({ featured: true, limit: 4 }),
      getMapLocations({ format: 'list' }),
    ])

    products.value = productData
    events.value = eventData
    locations.value = locationData.slice(0, 5)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public tourism content.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadHomeData)
</script>

<template>
  <div class="twbis-home">
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
          <RouterLink to="/promotion" class="site-nav__link site-nav__link--active">Home</RouterLink>
          <RouterLink to="/promotion/map" class="site-nav__link">Destination</RouterLink>
          <RouterLink to="/promotion/products" class="site-nav__link">Products</RouterLink>
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
      <section class="hero-section">
        <div class="hero-section__inner">
          <div class="hero-copy">
            <p class="eyebrow hero-copy__eyebrow"><span></span>Calabanga · Camarines Sur</p>
            <h1>Discover the Heart of Bicol</h1>
            <p>
              Explore Calabanga's coastal wonders, centuries-old churches, and the local treasures
              of its local producers.
            </p>
            <div class="hero-copy__actions">
              <RouterLink to="/promotion/map" class="button button--white">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m14.8 9.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z" />
                </svg>
                Start exploring
              </RouterLink>
              <RouterLink to="/promotion/products" class="button button--white-ghost">Shop Products</RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section v-if="isLoading || errorMessage" class="api-status page-shell">
        <p v-if="isLoading">Loading the latest public tourism content...</p>
        <p v-else>{{ errorMessage }}</p>
      </section>

      <section class="quick-strip" aria-label="Quick discovery categories">
        <div class="quick-strip__inner">
          <RouterLink
            v-for="category in quickCategories"
            :key="category.label"
            :to="category.label === 'Events' ? '/promotion/events' : '/promotion/map'"
            class="quick-card"
          >
            <span class="quick-card__icon">
              <svg v-if="category.icon === 'leaf'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 4c-7.2.4-12 3.6-14.2 9.6C4.6 17 6.9 20 10.3 20c5.9 0 8.9-6.8 9.7-16Z" />
                <path d="M5 19c3.6-4.7 7.4-7.6 11.5-8.8" />
              </svg>
              <svg v-else-if="category.icon === 'landmark'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 10h16L12 5 4 10Z" />
                <path d="M6 10v7M10 10v7M14 10v7M18 10v7M4 19h16" />
              </svg>
              <svg v-else-if="category.icon === 'food'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10" />
                <path d="M16 3v18M16 3c2.4 1.5 3.7 3.8 3.7 6.8H16" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
              </svg>
            </span>
            <span>
              <strong>{{ category.label }}</strong>
              <small>{{ category.helper }}</small>
            </span>
          </RouterLink>
        </div>
      </section>

      <section class="content-section content-section--white">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>What's On</h2>
              <p>Seasonal promotions and partner offers from Calabanga's accredited producers and homestays.</p>
            </div>
            <RouterLink to="/promotion/products">View all promotions -></RouterLink>
          </div>

          <div class="product-grid product-grid--three">
            <p v-if="!isLoading && products.length === 0" class="empty-copy">No featured products are available yet.</p>
            <RouterLink
              v-for="product in products.slice(0, 3)"
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
        </div>
      </section>

      <section class="content-section content-section--warm">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Explore Calabanga</h2>
              <p>Hundreds of curated locations across the coast, mountains, and town center.</p>
            </div>
            <RouterLink to="/promotion/map">Open full map -></RouterLink>
          </div>

          <div class="map-preview">
            <aside class="map-preview__panel">
              <p class="eyebrow">Filter</p>
              <h3>Find your way</h3>
              <div class="filter-list">
                <label v-for="filter in filters" :key="filter.label" class="filter-row">
                  <span class="fake-check" :class="{ 'fake-check--active': filter.active }">
                    <span v-if="filter.active">✓</span>
                  </span>
                  <span class="filter-dot" :style="{ backgroundColor: filter.color }"></span>
                  <span>{{ filter.label }}</span>
                  <small>{{ filter.count }}</small>
                </label>
              </div>

              <div class="map-preview__results">
                <p>Showing 5 highlights</p>
                <div v-for="location in locations.slice(0, 3)" :key="location.id" class="result-row">
                  <span :style="{ backgroundColor: location.color }"></span>
                  <strong>{{ location.name }}</strong>
                  <small>{{ location.distance }}</small>
                </div>
              </div>
            </aside>

            <div class="map-preview__canvas">
              <span
                v-for="(location, index) in locations"
                :key="location.id"
                class="map-pin"
                :class="{ 'map-pin--selected': index === 1 }"
                :style="{ left: `${location.x}%`, top: `${location.y}%`, '--pin-color': location.color }"
              >
                <svg viewBox="0 0 28 36" aria-hidden="true">
                  <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" />
                  <circle cx="14" cy="14" r="5" />
                </svg>
              </span>
              <RouterLink to="/promotion/map" class="map-preview__button">
                <span>-></span>
                Open full map
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section content-section--white">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Calabanga's Finest</h2>
              <p>Hand-picked products from Calabanga's accredited producers.</p>
            </div>
            <RouterLink to="/promotion/products">Shop all Products -></RouterLink>
          </div>

          <div class="chip-row">
            <button class="chip chip--active">All</button>
            <button class="chip">Sweets</button>
            <button class="chip">Crafts</button>
            <button class="chip">Pantry</button>
            <button class="chip">Textiles</button>
          </div>

          <div class="product-grid product-grid--four">
            <RouterLink
              v-for="product in products"
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
        </div>
      </section>

      <section class="content-section content-section--warm">
        <div class="page-shell">
          <div class="section-heading">
            <div>
              <h2>Upcoming Festivals &amp; Events</h2>
              <p>From the Pili Festival to the San Miguel Bay Regatta - plan your trip around our calendar.</p>
            </div>
            <RouterLink to="/promotion/events">View all events -></RouterLink>
          </div>

          <div class="event-grid">
            <p v-if="!isLoading && events.length === 0" class="empty-copy">No upcoming events are available yet.</p>
            <RouterLink v-for="event in events" :key="event.id" to="/promotion/events" class="event-card">
              <span
                class="event-card__image"
                :style="{
                  '--event-accent': event.accent,
                  backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
                }"
              >
                <span class="date-badge">
                  <strong>{{ event.day }}</strong>
                  <small>{{ event.month }}</small>
                </span>
              </span>
              <span class="event-card__body">
                <span class="category-badge">{{ event.category }}</span>
                <strong>{{ event.title }}</strong>
                <span class="event-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                  {{ event.location }}
                </span>
                <span class="event-desc">{{ event.desc }}</span>
                <span class="event-card__link">View event -></span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="trust-strip">
        <div class="page-shell trust-strip__inner">
          <div>
            <span class="accreditation-badge accreditation-badge--static">
              <span></span>
              LGU Accredited
            </span>
            <p>Every producer on TWBIS is vetted and accredited by LGU Calabanga.</p>
          </div>
          <RouterLink to="/promotion/products">View accredited products -></RouterLink>
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

.twbis-home {
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
  width: 22px;
  height: 22px;
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

.login-button:disabled {
  cursor: default;
  opacity: 0.72;
}

.hero-section {
  min-height: 88vh;
  background:
    radial-gradient(ellipse at 30% 70%, rgba(0, 0, 0, 0.35), transparent 60%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.6)),
    linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%);
}

.hero-section__inner {
  width: min(100% - 48px, 1120px);
  min-height: 88vh;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 100px 0 140px;
}

.hero-copy {
  max-width: 560px;
  color: #ffffff;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-copy__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.hero-copy__eyebrow span {
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.6);
}

h1,
h2,
h3 {
  margin: 0;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  max-width: 560px;
  margin-top: 18px;
  color: #ffffff;
  font-size: 56px;
  font-weight: 700;
  line-height: 1.05;
}

.hero-copy p:last-of-type {
  max-width: 560px;
  margin: 24px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
}

.hero-copy__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
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
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.button:active {
  transform: scale(0.98);
}

.button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.button--white {
  background: #ffffff;
  color: #1b4332;
}

.button--white:hover {
  background: #f2f0eb;
}

.button--white-ghost {
  border: 1.5px solid #ffffff;
  color: #ffffff;
}

.button--white-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.quick-strip {
  position: relative;
  z-index: 5;
  display: flex;
  justify-content: center;
  padding: 0 24px;
  margin-top: -44px;
}

.quick-strip__inner {
  width: min(100%, 1100px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  box-shadow: 0 2px 24px rgba(0, 0, 0, 0.06);
}

.quick-card {
  min-height: 84px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-right: 1px solid #e8e4dc;
}

.quick-card:last-child {
  border-right: 0;
}

.quick-card:hover {
  background: #f2f0eb;
}

.quick-card__icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1b4332;
  color: #ffffff;
}

.quick-card__icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.quick-card strong {
  display: block;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
}

.quick-card small {
  display: block;
  color: #5c5c5c;
  font-size: 12px;
}

.content-section {
  padding: 80px 0;
}

.api-status,
.empty-copy {
  color: #5c5c5c;
  font-size: 14px;
}

.api-status {
  padding: 18px 0 0;
}

.empty-copy {
  grid-column: 1 / -1;
  margin: 0;
}

.content-section--white {
  background: #ffffff;
}

.content-section--warm {
  background: #f2f0eb;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}

.section-heading h2 {
  font-size: 32px;
  font-weight: 600;
}

.section-heading p {
  max-width: 600px;
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.section-heading a {
  flex: 0 0 auto;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.product-grid {
  display: grid;
  gap: 24px;
}

.product-grid--three {
  grid-template-columns: repeat(3, 1fr);
}

.product-grid--four {
  grid-template-columns: repeat(4, 1fr);
}

.product-card,
.event-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.product-card:hover,
.event-card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.product-card {
  display: flex;
  flex-direction: column;
}

.product-card__image,
.event-card__image {
  position: relative;
  display: block;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.26), transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.18), transparent 50%),
    linear-gradient(135deg, var(--card-accent, #1b4332), color-mix(in srgb, var(--card-accent, #1b4332) 60%, white));
}

.product-card__image {
  aspect-ratio: 4 / 3;
  background-position: center;
  background-size: cover;
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

.product-card__body,
.event-card__body {
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

.map-preview {
  height: 480px;
  display: grid;
  grid-template-columns: 320px 1fr;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #1b4332;
}

.map-preview__panel {
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.96);
  border-right: 1px solid #e8e4dc;
}

.map-preview__panel h3 {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}

.filter-list {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.filter-row {
  display: grid;
  grid-template-columns: 16px 8px 1fr auto;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
}

.fake-check {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1.5px solid #5c5c5c;
  border-radius: 4px;
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
}

.fake-check--active {
  border-color: #1b4332;
  background: #1b4332;
}

.filter-dot,
.result-row > span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.filter-row small,
.result-row small {
  color: #5c5c5c;
  font-size: 12px;
}

.map-preview__results {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #e8e4dc;
}

.map-preview__results p {
  margin: 0 0 14px;
  color: #5c5c5c;
  font-size: 12px;
}

.result-row {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.result-row strong {
  overflow: hidden;
  color: #1a1a1a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-preview__canvas {
  position: relative;
  overflow: hidden;
  background-color: #1b4332;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}

.map-pin {
  position: absolute;
  width: 28px;
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.map-pin svg {
  width: 28px;
  height: 36px;
}

.map-pin path {
  fill: var(--pin-color);
}

.map-pin circle {
  fill: #ffffff;
}

.map-pin--selected {
  transform: translate(-50%, -100%) scale(1.25);
}

.map-pin--selected path {
  fill: #b5451b;
}

.map-preview__button {
  position: absolute;
  right: 28px;
  bottom: 28px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}

.map-preview__button span {
  font-size: 24px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.chip {
  height: 36px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.chip--active {
  background: #1b4332;
  color: #ffffff;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.event-card {
  display: flex;
  flex-direction: column;
}

.event-card__image {
  aspect-ratio: 16 / 9;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%),
    linear-gradient(135deg, var(--event-accent), color-mix(in srgb, var(--event-accent) 65%, white));
  background-position: center;
  background-size: cover;
}

.date-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  min-width: 54px;
  display: grid;
  justify-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  line-height: 1;
}

.date-badge strong {
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
}

.date-badge small {
  margin-top: 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.event-card__body {
  gap: 10px;
  padding: 20px;
}

.event-card__body > strong {
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
}

.event-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #5c5c5c;
  font-size: 13px;
}

.event-location svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}

.event-desc {
  color: #5c5c5c;
  font-size: 14px;
}

.event-card__link {
  margin-top: auto;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.trust-strip {
  padding: 46px 0;
  background: #ffffff;
  border-top: 1px solid #e8e4dc;
}

.trust-strip__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.trust-strip__inner > div {
  display: flex;
  align-items: center;
  gap: 16px;
}

.trust-strip p {
  margin: 0;
  color: #5c5c5c;
  font-size: 14px;
}

.trust-strip a {
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.accreditation-badge--static {
  position: static;
  flex: 0 0 auto;
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

  .product-grid--four,
  .product-grid--three,
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .map-preview {
    grid-template-columns: 280px 1fr;
  }

  .site-footer__main {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .page-shell,
  .site-nav__inner,
  .hero-section__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy {
    display: none;
  }

  .login-button {
    display: none;
  }

  .hero-section,
  .hero-section__inner {
    min-height: 760px;
  }

  h1 {
    font-size: 42px;
  }

  .quick-strip__inner {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-card:nth-child(2n) {
    border-right: 0;
  }

  .quick-card:nth-child(-n + 2) {
    border-bottom: 1px solid #e8e4dc;
  }

  .section-heading,
  .trust-strip__inner,
  .trust-strip__inner > div {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-grid--four,
  .product-grid--three,
  .event-grid {
    grid-template-columns: 1fr;
  }

  .map-preview {
    height: auto;
    grid-template-columns: 1fr;
  }

  .map-preview__panel {
    border-right: 0;
    border-bottom: 1px solid #e8e4dc;
  }

  .map-preview__canvas {
    min-height: 360px;
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
