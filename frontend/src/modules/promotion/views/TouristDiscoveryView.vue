<script setup>
import { computed, ref } from 'vue'
import { removeFromItinerary, saveToItinerary, sharePublicItem } from '../services/promotionService'

const categories = [
  { key: 'Nature', color: '#1B7A4A', count: 2 },
  { key: 'Beach', color: '#1565C0', count: 1 },
  { key: 'Food', color: '#B5451B', count: 1 },
  { key: 'Cultural', color: '#7B341E', count: 2 },
]

const locations = [
  {
    id: 'sabang',
    name: 'Sabang Beach',
    category: 'Beach',
    color: '#1565C0',
    distance: '4.2 km',
    address: 'Poblacion, Calabanga, Camarines Sur',
    hours: 'Open daily • 8:00 AM - 5:00 PM',
    description:
      'Experience the rich culture and history of Calabanga at this notable landmark. Perfect for your itinerary. Ensure you visit during operating hours.',
    x: 30,
    y: 34,
  },
  {
    id: 'quipayo',
    name: 'Quipayo Old Church',
    category: 'Cultural',
    color: '#7B341E',
    distance: '2.1 km',
    address: 'Quipayo, Calabanga, Camarines Sur',
    hours: 'Open daily • 8:00 AM - 5:00 PM',
    description:
      'Experience the rich culture and history of Calabanga at this notable landmark. Perfect for your itinerary. Ensure you visit during operating hours.',
    x: 58,
    y: 31,
    selected: true,
  },
  {
    id: 'belen',
    name: 'Belen Pottery Village',
    category: 'Cultural',
    color: '#7B341E',
    distance: '6.8 km',
    address: 'Belen, Calabanga, Camarines Sur',
    hours: 'Open daily • 8:00 AM - 5:00 PM',
    description:
      'Experience the rich culture and history of Calabanga at this notable landmark. Perfect for your itinerary. Ensure you visit during operating hours.',
    x: 72,
    y: 55,
  },
  {
    id: 'isarog',
    name: 'Mt. Isarog Foothills',
    category: 'Nature',
    color: '#1B7A4A',
    distance: '9.4 km',
    address: 'Mt. Isarog Foothills, Calabanga, Camarines Sur',
    hours: 'Open daily • 8:00 AM - 5:00 PM',
    description:
      'Experience the rich culture and history of Calabanga at this notable landmark. Perfect for your itinerary. Ensure you visit during operating hours.',
    x: 83,
    y: 21,
  },
  {
    id: 'market',
    name: 'Calabanga Public Market',
    category: 'Food',
    color: '#B5451B',
    distance: '0.6 km',
    address: 'Calabanga Public Market, Camarines Sur',
    hours: 'Open daily • 8:00 AM - 5:00 PM',
    description:
      'Experience the rich culture and history of Calabanga at this notable landmark. Perfect for your itinerary. Ensure you visit during operating hours.',
    x: 43,
    y: 72,
  },
  {
    id: 'river',
    name: 'Bicol River Boardwalk',
    category: 'Nature',
    color: '#1B7A4A',
    distance: '1.3 km',
    address: 'Bicol River Boardwalk, Calabanga, Camarines Sur',
    hours: 'Open daily • 8:00 AM - 5:00 PM',
    description:
      'Experience the rich culture and history of Calabanga at this notable landmark. Perfect for your itinerary. Ensure you visit during operating hours.',
    x: 24,
    y: 59,
  },
]

const searchQuery = ref('')
const selectedId = ref('quipayo')
const enabledCategories = ref({
  Nature: true,
  Beach: true,
  Food: true,
  Cultural: true,
})
const accreditedOnly = ref(true)
const showDetail = ref(false)
const savedIds = ref(new Set(['sabang']))
const isSaving = ref(false)
const feedbackMessage = ref('')

const visibleLocations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return locations.filter((location) => {
    const matchesCategory = enabledCategories.value[location.category]
    const matchesQuery =
      !query ||
      [location.name, location.category, location.distance]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesCategory && matchesQuery
  })
})

const selectedLocation = computed(
  () => visibleLocations.value.find((location) => location.id === selectedId.value) || visibleLocations.value[0],
)

function selectLocation(id) {
  selectedId.value = id
}

function toggleCategory(category) {
  enabledCategories.value = {
    ...enabledCategories.value,
    [category]: !enabledCategories.value[category],
  }
}

function resetFilters() {
  searchQuery.value = ''
  enabledCategories.value = {
    Nature: true,
    Beach: true,
    Food: true,
    Cultural: true,
  }
  accreditedOnly.value = true
}

async function toggleItinerary(location) {
  if (!location) return

  isSaving.value = true
  feedbackMessage.value = ''

  if (savedIds.value.has(location.id)) {
    await removeFromItinerary({ id: location.id, type: 'destination' })
    const next = new Set(savedIds.value)
    next.delete(location.id)
    savedIds.value = next
    feedbackMessage.value = 'Removed from itinerary'
  } else {
    await saveToItinerary({ id: location.id, type: 'destination', title: location.name })
    savedIds.value = new Set([...savedIds.value, location.id])
    feedbackMessage.value = 'Saved to itinerary'
  }

  isSaving.value = false
}

async function shareLocation(location) {
  if (!location) return

  const result = await sharePublicItem({
    title: location.name,
    text: `Explore ${location.name} in Calabanga.`,
    path: `/promotion/map?location=${location.id}`,
  })

  feedbackMessage.value =
    result.method === 'clipboard' ? 'Share link copied' : 'Share action ready'
}

function getDirections(location) {
  if (!location) return

  feedbackMessage.value = `Directions ready for ${location.name}`
}
</script>

<template>
  <div class="discovery-page">
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
          <RouterLink to="/promotion/map" class="site-nav__link site-nav__link--active">Destination</RouterLink>
          <RouterLink to="/promotion/products" class="site-nav__link">Products</RouterLink>
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
          <button class="icon-button icon-button--menu" aria-label="Menu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="discovery-shell">
      <aside class="discovery-sidebar">
        <section class="sidebar-block sidebar-block--search">
          <h1>Discover</h1>
          <label class="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input v-model="searchQuery" placeholder="Search places, food, crafts..." />
          </label>
        </section>

        <section class="sidebar-block">
          <div class="filter-heading">
            <h2>Filter results</h2>
            <button @click="resetFilters">Reset</button>
          </div>

          <div class="filter-list">
            <label v-for="category in categories" :key="category.key" class="filter-row">
              <span
                class="fake-checkbox"
                :class="{ 'fake-checkbox--off': !enabledCategories[category.key] }"
                @click="toggleCategory(category.key)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
              <span class="category-dot" :style="{ backgroundColor: category.color }"></span>
              <span>{{ category.key }}</span>
              <small>{{ category.count }}</small>
            </label>
          </div>

          <div class="toggle-row">
            <span>
              <strong>LGU Accredited only</strong>
              <small>Vetted producers &amp; sites</small>
            </span>
            <button
              :aria-label="accreditedOnly ? 'LGU Accredited only enabled' : 'LGU Accredited only disabled'"
              :class="{ 'toggle-off': !accreditedOnly }"
              @click="accreditedOnly = !accreditedOnly"
            >
              <span></span>
            </button>
          </div>
        </section>

        <section class="results-block">
          <p>Showing {{ visibleLocations.length }} locations</p>
          <div class="result-list">
            <div v-if="visibleLocations.length === 0" class="map-empty-state">
              <strong>No locations found</strong>
              <span>Try another search or reset filters.</span>
            </div>
            <button
              v-for="location in visibleLocations"
              :key="location.id"
              class="result-card"
              :class="{ 'result-card--selected': location.id === selectedLocation?.id }"
              @click="selectLocation(location.id)"
            >
              <span class="result-thumb" :style="{ '--thumb-color': location.color }"></span>
              <span class="result-card__copy">
                <strong>{{ location.name }}</strong>
                <span class="category-badge">{{ location.category }}</span>
                <span class="result-meta">
                  <span>{{ location.distance }}</span>
                </span>
              </span>
            </button>
          </div>
        </section>
      </aside>

      <section class="map-area" aria-label="Map-ready visual placeholder">
        <div class="map-badge">
          <strong>Calabanga</strong>
          <span>&middot; Camarines Sur</span>
        </div>

        <div class="map-actions">
          <button>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16l-6.5 7.2V18l-3 1v-6.8L4 5Z" />
            </svg>
            Layers
          </button>
          <RouterLink to="/promotion/products">Browse Products</RouterLink>
        </div>

        <button
          v-for="location in visibleLocations"
          :key="location.id"
          class="map-pin"
          :class="{ 'map-pin--selected': location.id === selectedLocation?.id }"
          :style="{ left: `${location.x}%`, top: `${location.y}%`, '--pin-color': location.color }"
          :aria-label="location.name"
          @click="selectLocation(location.id)"
        >
          <svg viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" />
            <circle cx="14" cy="14" r="5" />
          </svg>
        </button>

        <div class="cluster-marker">12</div>

        <article
          v-if="selectedLocation"
          class="location-popup"
          :style="{ left: `${selectedLocation.x + 5}%`, top: `${selectedLocation.y - 2}%` }"
        >
          <div class="location-popup__image" :style="{ '--popup-color': selectedLocation.color }">
            <button aria-label="Close">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <span class="accreditation-badge"><span></span>LGU Accredited</span>
          </div>
          <div class="location-popup__body">
            <h2>{{ selectedLocation.name }}</h2>
            <div class="popup-meta">
              <span class="category-badge">{{ selectedLocation.category }}</span>
              <span>{{ selectedLocation.distance }}</span>
            </div>
            <div class="popup-actions">
              <button @click="showDetail = true">View details -&gt;</button>
              <button @click="toggleItinerary(selectedLocation)">
                {{ savedIds.has(selectedLocation.id) ? 'Saved' : 'Save' }}
              </button>
              <button @click="shareLocation(selectedLocation)">Share</button>
            </div>
          </div>
        </article>

        <div class="map-legend">
          <span v-for="category in categories" :key="category.key">
            <i :style="{ backgroundColor: category.color }"></i>
            {{ category.key }}
          </span>
        </div>

        <div v-if="feedbackMessage" class="feedback-toast">{{ feedbackMessage }}</div>
      </section>

      <div v-if="showDetail && selectedLocation" class="detail-backdrop" @click="showDetail = false"></div>

      <aside v-if="showDetail && selectedLocation" class="detail-drawer">
        <div class="detail-drawer__hero" :style="{ '--drawer-color': selectedLocation.color }">
          <button aria-label="Close details" @click="showDetail = false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <span class="accreditation-badge"><span></span>LGU Accredited</span>
        </div>
        <div class="detail-drawer__body">
          <div class="detail-drawer__meta">
            <span class="category-badge">{{ selectedLocation.category }}</span>
            <span>{{ selectedLocation.distance }}</span>
          </div>
          <h2>{{ selectedLocation.name }}</h2>
          <p>{{ selectedLocation.description }}</p>
          <div class="detail-drawer__facts">
            <p>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.3" />
              </svg>
              {{ selectedLocation.address }}
            </p>
            <p>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {{ selectedLocation.hours }}
            </p>
          </div>
          <div class="detail-drawer__actions">
            <button class="detail-drawer__primary-action" @click="getDirections(selectedLocation)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 18 3 15V5l6 3 6-3 6 3v10l-6-3-6 3Z" />
                <path d="M9 8v10M15 5v10" />
              </svg>
              Get directions
            </button>
            <button class="detail-drawer__secondary-action" @click="toggleItinerary(selectedLocation)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h12v17l-6-3-6 3V4Z" />
              </svg>
              {{
                isSaving
                  ? 'Saving...'
                  : savedIds.has(selectedLocation.id)
                    ? 'Saved to itinerary'
                    : 'Save to itinerary'
              }}
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.discovery-page {
  min-height: 100vh;
  overflow: hidden;
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

.icon-button svg,
.search-field svg,
.map-actions svg {
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

.discovery-shell {
  height: calc(100vh - 64px);
  display: flex;
  padding-top: 64px;
}

.discovery-sidebar {
  width: 360px;
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e8e4dc;
}

.sidebar-block {
  padding: 20px;
  border-bottom: 1px solid #e8e4dc;
}

.sidebar-block--search {
  padding-top: 18px;
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
  font-size: 22px;
  font-weight: 700;
}

.search-field {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  margin-top: 16px;
  border-radius: 8px;
  background: #f2f0eb;
  color: #5c5c5c;
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

.filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filter-heading h2 {
  font-size: 18px;
  font-weight: 600;
}

.filter-heading button {
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.filter-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
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

.fake-checkbox {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1.5px solid #1b4332;
  border-radius: 4px;
  background: #1b4332;
  color: #ffffff;
}

.fake-checkbox--off {
  background: #ffffff;
  color: transparent;
}

.fake-checkbox svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.filter-row small {
  color: #5c5c5c;
  font-size: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 24px;
}

.toggle-row strong {
  display: block;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
}

.toggle-row small {
  display: block;
  color: #5c5c5c;
  font-size: 12px;
}

.toggle-row button {
  position: relative;
  width: 44px;
  height: 24px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: #1b4332;
  cursor: pointer;
}

.toggle-row button.toggle-off {
  background: #e8e4dc;
}

.toggle-row button span {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
}

.toggle-row button.toggle-off span {
  right: 22px;
}

.results-block {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.results-block > p {
  margin: 0;
  padding: 16px 20px 10px;
  color: #5c5c5c;
  font-size: 13px;
}

.result-list {
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 20px;
}

.map-empty-state {
  display: grid;
  gap: 4px;
  padding: 24px 20px;
  color: #5c5c5c;
  font-size: 13px;
}

.map-empty-state strong {
  color: #1a1a1a;
  font-size: 14px;
}

.result-card {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border: 0;
  border-bottom: 1px solid #e8e4dc;
  background: #ffffff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.result-card:hover {
  background: #f2f0eb;
}

.result-card--selected {
  border-left: 3px solid #1b4332;
  background: #d8f3dc;
  padding-left: 17px;
}

.result-thumb {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.22), transparent 38%),
    linear-gradient(135deg, var(--thumb-color), color-mix(in srgb, var(--thumb-color) 65%, white));
}

.result-card__copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.result-card__copy strong {
  overflow: hidden;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  align-self: flex-start;
  height: 22px;
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 12px;
  font-weight: 500;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 5px;
  color: #5c5c5c;
  font-size: 12px;
}

.map-area {
  position: relative;
  flex: 1;
  overflow: hidden;
  background-color: #e8e3da;
  background-image:
    radial-gradient(circle at 18% 30%, rgba(200, 214, 192, 0.9) 0, rgba(200, 214, 192, 0.9) 76px, rgba(0, 0, 0, 0.22) 90px, transparent 128px),
    radial-gradient(circle at 80% 58%, rgba(200, 214, 192, 0.9) 0, rgba(200, 214, 192, 0.9) 110px, rgba(0, 0, 0, 0.2) 130px, transparent 184px),
    radial-gradient(circle at 48% 84%, rgba(200, 214, 192, 0.9) 0, rgba(200, 214, 192, 0.9) 70px, rgba(0, 0, 0, 0.18) 88px, transparent 124px),
    linear-gradient(115deg, transparent 47%, #f2ede3 47%, #f2ede3 52%, transparent 52%),
    linear-gradient(35deg, transparent 59%, #f2ede3 59%, #f2ede3 63%, transparent 63%),
    linear-gradient(205deg, transparent 35%, rgba(242, 237, 227, 0.72) 35%, rgba(242, 237, 227, 0.72) 39%, transparent 39%);
}

.map-area::before {
  position: absolute;
  inset: -8%;
  background:
    linear-gradient(24deg, transparent 0 43%, rgba(255, 255, 255, 0.28) 43% 47%, transparent 47%),
    linear-gradient(152deg, transparent 0 50%, rgba(255, 255, 255, 0.24) 50% 55%, transparent 55%);
  content: '';
  pointer-events: none;
}

.map-badge,
.map-actions,
.map-legend,
.location-popup,
.cluster-marker,
.map-pin {
  position: absolute;
  z-index: 2;
}

.map-badge {
  top: 22px;
  left: 22px;
  display: inline-flex;
  gap: 4px;
  padding: 10px 13px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
  font-size: 13px;
}

.map-badge strong {
  color: #1a1a1a;
  font-weight: 500;
}

.map-actions {
  top: 22px;
  right: 20px;
  display: flex;
  gap: 10px;
}

.map-actions button,
.map-actions a {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
}

.map-actions button {
  cursor: pointer;
}

.map-actions a {
  border-color: #1b4332;
  background: #1b4332;
  color: #ffffff;
}

.map-actions svg {
  width: 16px;
  height: 16px;
}

.map-pin {
  width: 32px;
  border: 0;
  background: transparent;
  padding: 0;
  transform: translate(-50%, -100%);
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

.map-pin svg {
  width: 32px;
  height: 42px;
}

.map-pin path {
  fill: var(--pin-color);
}

.map-pin circle {
  fill: #ffffff;
}

.map-pin--selected {
  transform: translate(-50%, -100%) scale(1.3);
}

.map-pin--selected path {
  fill: #b5451b;
}

.cluster-marker {
  top: 48%;
  left: 50%;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1b4332;
  box-shadow: 0 0 0 6px rgba(27, 67, 50, 0.15);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}

.location-popup {
  width: 280px;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  transform: translateY(-50%);
  animation: fadeUp 240ms ease-out both;
}

.location-popup__image {
  position: relative;
  height: 140px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), transparent 45%),
    linear-gradient(135deg, var(--popup-color), color-mix(in srgb, var(--popup-color) 62%, white));
}

.location-popup__image button {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  cursor: pointer;
}

.location-popup__image button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.accreditation-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
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

.location-popup__body {
  padding: 14px 16px 16px;
}

.location-popup__body h2 {
  font-size: 15px;
  font-weight: 600;
}

.popup-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: #5c5c5c;
  font-size: 12px;
}

.location-popup__body button {
  margin-top: 9px;
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.popup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 9px;
}

.popup-actions button {
  margin-top: 0;
}

.map-legend {
  bottom: 22px;
  left: 22px;
  display: flex;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid #e8e4dc;
  border-radius: 10px;
  background: #ffffff;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1a1a1a;
  font-size: 12px;
}

.map-legend i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.feedback-toast {
  position: absolute;
  right: 20px;
  bottom: 22px;
  z-index: 4;
  width: 280px;
  padding: 14px 16px;
  border-left: 4px solid #1b7a4a;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
}

.detail-backdrop {
  position: fixed;
  z-index: 65;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
}

.detail-drawer {
  position: fixed;
  z-index: 70;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(600px, 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: #ffffff;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.18);
  animation: slideIn 240ms ease-out both;
}

.detail-drawer__hero {
  position: relative;
  height: 240px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), transparent 45%),
    linear-gradient(135deg, var(--drawer-color), color-mix(in srgb, var(--drawer-color) 62%, white));
}

.detail-drawer__hero button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(27, 67, 50, 0.22);
  color: #ffffff;
  cursor: pointer;
}

.detail-drawer__hero button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.detail-drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 32px;
}

.detail-drawer__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5c5c5c;
  font-size: 14px;
}

.detail-drawer__body .category-badge {
  align-self: flex-start;
}

.detail-drawer__body h2 {
  margin-top: 14px;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 32px;
  font-weight: 600;
}

.detail-drawer__body p {
  margin: 28px 0 0;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.6;
}

.detail-drawer__facts {
  display: grid;
  gap: 18px;
  margin-top: 28px;
}

.detail-drawer__facts p {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  color: #1a1a1a;
  font-size: 16px;
}

.detail-drawer__facts svg,
.detail-drawer__actions svg {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.detail-drawer__facts svg {
  color: #1b4332;
}

.detail-drawer__actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 32px;
  border-top: 1px solid #e8e4dc;
}

.detail-drawer__actions button {
  height: 48px;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.detail-drawer__actions .detail-drawer__secondary-action {
  background: transparent;
  color: #1b4332;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(calc(-50% + 8px));
  }

  to {
    opacity: 1;
    transform: translateY(-50%);
  }
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .discovery-sidebar {
    width: 330px;
    flex-basis: 330px;
  }
}

@media (max-width: 760px) {
  .site-nav__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy,
  .login-button {
    display: none;
  }

  .discovery-shell {
    position: relative;
    display: block;
  }

  .discovery-sidebar {
    position: absolute;
    z-index: 10;
    right: 12px;
    bottom: 12px;
    left: 12px;
    width: auto;
    max-height: 50vh;
    overflow: hidden;
    border: 1px solid #e8e4dc;
    border-radius: 16px;
  }

  .sidebar-block:not(.sidebar-block--search) {
    display: none;
  }

  .results-block {
    display: none;
  }

  .map-area {
    height: 100%;
  }

  .map-actions {
    top: 74px;
    right: 12px;
    flex-direction: column;
  }

  .map-badge {
    left: 12px;
  }

  .location-popup {
    display: none;
  }

  .map-legend {
    display: none;
  }

  .detail-drawer {
    width: 100%;
  }

  .detail-drawer__body {
    padding: 28px 20px;
  }

  .detail-drawer__actions {
    flex-direction: column;
  }
}
</style>
