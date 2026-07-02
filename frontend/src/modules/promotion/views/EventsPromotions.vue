<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getEvents,
  loadItinerary,
  removeFromItinerary,
  saveToItinerary,
  sharePublicItem,
} from '../services/promotionService'
import { useNewsletterForm } from '../composables/useNewsletterForm'

const VISITOR_SESSION_KEY = 'calitoursys_public_visitor'
const PENDING_SAVE_KEY = 'calitoursys_pending_event_save'
const route = useRoute()
const router = useRouter()

const events = ref([])

const featuredEvent = computed(() => events.value[0] || null)
const eventCards = computed(() => events.value.slice(1))
const viewMode = ref('list')
const selectedEvent = ref(null)
const savedEventIds = ref(new Set())
const feedbackMessage = ref('')
const isSaving = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')
const isVisitorAuthenticated = ref(hasVisitorSession())
const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm()

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const calendarEvents = computed(() =>
  events.value.map((event) => ({
    day: Number(event.day),
    title: event.title,
    highlighted: Boolean(event.featured),
  })),
)

const calendarCells = computed(() => {
  const leadingCells = Array.from({ length: 5 }, (_, index) => ({
    key: `blank-${index}`,
    blank: true,
  }))

  const dayCells = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1
    const event = calendarEvents.value.find((item) => item.day === day)

    return {
      key: `day-${day}`,
      day,
      event,
    }
  })

  return [...leadingCells, ...dayCells]
})

function openCalendarEvent(cell) {
  if (!cell.event) return

  const event = events.value.find((item) => item.title === cell.event.title)
  if (event) selectedEvent.value = event
}

async function loadEvents() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    events.value = await getEvents({ limit: 12, sort: 'startsAt' })
    await refreshSavedEvents()
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load public events.'
  } finally {
    isLoading.value = false
  }
}

async function toggleEventItinerary(event) {
  if (!isVisitorAuthenticated.value) {
    promptForSaveAuth(event)
    return
  }

  await performEventItineraryToggle(event)
}

async function performEventItineraryToggle(event) {
  isSaving.value = true
  feedbackMessage.value = ''

  try {
    if (savedEventIds.value.has(event.id)) {
      await removeFromItinerary({ id: event.id, apiId: event.apiId, type: 'event' })
      const next = new Set(savedEventIds.value)
      next.delete(event.id)
      savedEventIds.value = next
      feedbackMessage.value = 'Removed from itinerary'
    } else {
      await saveToItinerary({ id: event.id, apiId: event.apiId, type: 'event', title: event.title })
      savedEventIds.value = new Set([...savedEventIds.value, event.id])
      feedbackMessage.value = 'Saved to itinerary'
    }
  } catch (error) {
    feedbackMessage.value = error.message || 'Unable to update itinerary'
  } finally {
    isSaving.value = false
  }
}

async function refreshSavedEvents() {
  if (!isVisitorAuthenticated.value) {
    savedEventIds.value = new Set()
    return
  }

  try {
    const itinerary = await loadItinerary()
    savedEventIds.value = new Set(
      itinerary.items
        .filter((item) => item.itemType === 'event')
        .map((item) => item.summary?.slug || item.itemId || item.targetId),
    )
  } catch {
    savedEventIds.value = new Set()
  }
}

function hasVisitorSession() {
  try {
    return Boolean(window.localStorage.getItem(VISITOR_SESSION_KEY))
  } catch {
    return false
  }
}

function promptForSaveAuth(event) {
  sessionStorage.setItem(PENDING_SAVE_KEY, event.id)
  router.replace({
    path: route.path,
    query: { ...route.query, auth: 'login', authIntent: 'save', event: event.id },
  })
}

async function resumePendingSave() {
  isVisitorAuthenticated.value = hasVisitorSession()
  if (!isVisitorAuthenticated.value) return
  await refreshSavedEvents()

  const pendingId = sessionStorage.getItem(PENDING_SAVE_KEY)
  if (!pendingId) return
  const pendingEvent = events.value.find((event) => event.id === pendingId)
  if (!pendingEvent) return
  sessionStorage.removeItem(PENDING_SAVE_KEY)
  await performEventItineraryToggle(pendingEvent)
}

async function shareEvent(event) {
  const result = await sharePublicItem({
    title: event.title,
    text: event.desc,
    path: `/events?event=${event.id}`,
  })

  feedbackMessage.value =
    result.method === 'clipboard' ? 'Event link copied' : 'Share action ready'
}

onMounted(() => {
  loadEvents()
  window.addEventListener('calitoursys:visitor-authenticated', resumePendingSave)
})

onBeforeUnmount(() => {
  window.removeEventListener('calitoursys:visitor-authenticated', resumePendingSave)
})
</script>

<template>
  <div class="events-page">
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
          <RouterLink to="/events" class="site-nav__link site-nav__link--active">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
          <div class="site-nav__dropdown">
            <button class="site-nav__link site-nav__dropdown-trigger" type="button" aria-haspopup="true">
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
      <section class="events-header">
        <div class="page-shell events-header__inner">
          <div>
            <p class="eyebrow">Calendar &middot; 2026</p>
            <h1>Events</h1>
            <p>
              Festivals, regattas, and community celebrations across Calabanga. Plan your visit
              around our calendar.
            </p>
          </div>

          <div class="view-toggle" aria-label="Event view">
            <button
              :class="{ 'view-toggle__active': viewMode === 'list' }"
              type="button"
              @click="viewMode = 'list'"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 6h12M8 12h12M8 18h12" />
                <path d="M4 6h0M4 12h0M4 18h0" />
              </svg>
              List
            </button>
            <button
              :class="{ 'view-toggle__active': viewMode === 'calendar' }"
              type="button"
              @click="viewMode = 'calendar'"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
              </svg>
              Calendar
            </button>
          </div>
        </div>
      </section>

      <section class="events-content">
        <div class="page-shell">
          <div v-if="isLoading" class="event-state">Loading public events...</div>
          <div v-else-if="errorMessage" class="event-state">{{ errorMessage }}</div>
          <div v-else-if="events.length === 0" class="event-state">No public events are available yet.</div>

          <article v-else class="featured-event" :style="{ '--event-accent': featuredEvent.accent }">
            <div class="featured-event__copy">
              <span class="featured-badge"><i></i>Featured</span>
              <h2>{{ featuredEvent.title }}</h2>
              <p class="featured-event__meta">
                <span>{{ featuredEvent.date }}</span>
                <span>&middot;</span>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                  {{ featuredEvent.location }}
                </span>
              </p>
              <p class="featured-event__desc">{{ featuredEvent.desc }}</p>
              <div class="featured-event__actions">
                <button class="button button--white" type="button" @click="selectedEvent = featuredEvent">
                  View event details
                </button>
                <button class="button button--ghost-white" type="button" :disabled="isSaving" @click="toggleEventItinerary(featuredEvent)">
                  {{ savedEventIds.has(featuredEvent.id) ? 'Saved' : 'Add to itinerary' }}
                </button>
              </div>
            </div>

            <div class="featured-date">
              <span>{{ featuredEvent.month }}</span>
              <strong>{{ featuredEvent.day }}</strong>
              <small>2026</small>
            </div>
          </article>

          <section v-if="viewMode === 'calendar'" class="calendar-panel" aria-label="May 2026 events calendar">
            <header class="calendar-panel__header">
              <h2>May 2026</h2>
              <div class="calendar-panel__nav" aria-label="Calendar navigation">
                <button type="button" aria-label="Previous month">&lsaquo;</button>
                <button type="button" aria-label="Next month">&rsaquo;</button>
              </div>
            </header>

            <div class="calendar-weekdays" aria-hidden="true">
              <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
            </div>

            <div class="calendar-grid">
              <button
                v-for="cell in calendarCells"
                :key="cell.key"
                class="calendar-cell"
                :class="{
                  'calendar-cell--blank': cell.blank,
                  'calendar-cell--event': cell.event,
                  'calendar-cell--highlight': cell.event?.highlighted,
                }"
                type="button"
                :disabled="cell.blank"
                @click="openCalendarEvent(cell)"
              >
                <span v-if="!cell.blank" class="calendar-cell__day">{{ cell.day }}</span>
                <strong v-if="cell.event">{{ cell.event.title }}</strong>
              </button>
            </div>
          </section>

          <div v-else class="event-grid">
            <article v-for="event in eventCards" :key="event.id" class="event-card">
              <div
                class="event-card__image"
                :style="{
                  '--card-accent': event.accent,
                  backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
                }"
              >
                <span class="date-badge">
                  <strong>{{ event.day }}</strong>
                  <small>{{ event.month }}</small>
                </span>
              </div>
              <div class="event-card__body">
                <span class="category-badge">{{ event.category }}</span>
                <h3>{{ event.title }}</h3>
                <p class="event-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                  {{ event.location }}
                </p>
                <p class="event-desc">{{ event.desc }}</p>
                <div class="event-card__actions">
                  <button type="button" @click="selectedEvent = event">View event -&gt;</button>
                  <button type="button" :disabled="isSaving" @click="toggleEventItinerary(event)">
                    {{ savedEventIds.has(event.id) ? 'Saved' : 'Save' }}
                  </button>
                  <button type="button" @click="shareEvent(event)">Share</button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>

    <div v-if="selectedEvent" class="event-modal" @click.self="selectedEvent = null">
      <article class="event-modal__panel">
        <div class="event-modal__image" :style="{ '--modal-accent': selectedEvent.accent }">
          <button type="button" aria-label="Close" @click="selectedEvent = null">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div class="event-modal__body">
          <span class="category-badge">{{ selectedEvent.category }}</span>
          <h2>{{ selectedEvent.title }}</h2>
          <div class="event-modal__meta">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
              </svg>
              {{ selectedEvent.month }} {{ selectedEvent.day }}, 2026
            </span>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.3" />
              </svg>
              {{ selectedEvent.location }}
            </span>
          </div>
          <div class="event-modal__divider"></div>
          <p>{{ selectedEvent.desc }}</p>
          <p>
            Join us for a spectacular event in Calabanga. Whether you're coming with family or
            friends, there's something for everyone. Experience local food, performances, and the
            hospitality of our community.
          </p>
          <div class="event-modal__actions">
            <button class="event-modal__close-action" type="button" @click="selectedEvent = null">Close</button>
            <button class="event-modal__calendar-action" type="button" :disabled="isSaving" @click="toggleEventItinerary(selectedEvent)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
                <path d="M12 12v5M9.5 14.5h5" />
              </svg>
              {{
                isSaving
                  ? 'Saving...'
                  : savedEventIds.has(selectedEvent.id)
                    ? 'Added to calendar'
                    : 'Add to calendar'
              }}
            </button>
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
            <a aria-label="Instagram page pending" aria-disabled="true">â—Ž</a>
            <a aria-label="Youtube page pending" aria-disabled="true">â–¶</a>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <RouterLink to="/destinations">Destinations &amp; Map</RouterLink>
          <RouterLink to="/products">Products</RouterLink>
          <RouterLink to="/packages">Packages</RouterLink>
          <RouterLink to="/events">Events</RouterLink>
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

.events-page {
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

.icon-button svg,
.view-toggle svg,
.featured-event svg,
.event-location svg {
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

.events-header {
  padding-top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.events-header__inner {
  min-height: 226px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 48px;
  padding: 48px 0 40px;
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
h2,
h3 {
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

.events-header p:last-child {
  max-width: 610px;
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.view-toggle {
  height: 44px;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: #f2f0eb;
}

.view-toggle button {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #5c5c5c;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.view-toggle__active {
  background: #ffffff !important;
  color: #1b4332 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.view-toggle svg {
  width: 16px;
  height: 16px;
}

.events-content {
  padding: 40px 0 120px;
  background: #f2f0eb;
}

.event-state {
  padding: 28px 24px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  color: #5c5c5c;
  font-size: 14px;
}

.featured-event {
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: end;
  overflow: hidden;
  border-radius: 16px;
  background:
    radial-gradient(circle at 74% 47%, rgba(255, 255, 255, 0.14), transparent 44%),
    linear-gradient(105deg, var(--event-accent) 0%, color-mix(in srgb, var(--event-accent) 85%, #1b4332) 52%, #1b4332 100%);
}

.featured-event__copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
  padding: 48px 40px;
  color: #ffffff;
}

.featured-badge {
  height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #d4ac0d;
  border-radius: 999px;
  background: #fff9e6;
  color: #7d5a00;
  font-size: 12px;
  font-weight: 500;
}

.featured-badge i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d4ac0d;
}

.featured-event h2 {
  margin-top: 20px;
  color: #ffffff;
  font-size: 40px;
  font-weight: 600;
}

.featured-event__meta,
.featured-event__desc {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.featured-event__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.featured-event__meta span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.featured-event__meta svg {
  width: 15px;
  height: 15px;
}

.featured-event__desc {
  max-width: 460px;
  margin-top: 18px;
  font-size: 15px;
}

.featured-event__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.button {
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.button--white {
  border: 0;
  background: #ffffff;
  color: #1b4332;
}

.button--ghost-white {
  border: 1.5px solid #ffffff;
  background: transparent;
  color: #ffffff;
}

.button:disabled,
.event-card__actions button:disabled,
.event-modal__actions button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.featured-date {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 78px;
  min-height: 100px;
  display: grid;
  justify-items: center;
  padding: 14px 8px;
  border-radius: 12px;
  background: #ffffff;
  line-height: 1;
}

.featured-date span {
  color: #5c5c5c;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.featured-date strong {
  margin-top: 8px;
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 36px;
  font-weight: 700;
}

.featured-date small {
  margin-top: 8px;
  color: #5c5c5c;
  font-size: 11px;
}

.calendar-panel {
  margin-top: 40px;
  padding: 28px 24px 24px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
}

.calendar-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.calendar-panel__header h2 {
  color: #1a1a1a;
  font-size: 20px;
  font-weight: 600;
}

.calendar-panel__nav {
  display: flex;
  gap: 8px;
}

.calendar-panel__nav button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.calendar-panel__nav button:hover {
  border-color: #1b4332;
  color: #1b4332;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 12px;
  color: #5c5c5c;
  font-size: 12px;
}

.calendar-weekdays span {
  text-align: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.calendar-cell {
  min-height: 132px;
  padding: 10px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
  text-align: left;
  vertical-align: top;
  cursor: pointer;
}

.calendar-cell:hover:not(:disabled) {
  border-color: #1b4332;
}

.calendar-cell:disabled {
  cursor: default;
}

.calendar-cell--blank {
  border-color: transparent;
  background: transparent;
}

.calendar-cell--event strong {
  display: block;
  margin-top: 14px;
  color: #1b4332;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
}

.calendar-cell--highlight {
  border-color: #1b4332;
  background: #d8f3dc;
}

.calendar-cell__day {
  color: #5c5c5c;
  font-size: 13px;
  font-weight: 500;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 40px;
}

.event-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.event-card:hover {
  border-color: #1b4332;
  transform: translateY(-2px);
}

.event-card__image {
  position: relative;
  aspect-ratio: 16 / 9;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%),
    linear-gradient(135deg, var(--card-accent), color-mix(in srgb, var(--card-accent) 65%, white));
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
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 20px;
}

.category-badge {
  align-self: flex-start;
  min-height: 22px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 12px;
  font-weight: 500;
}

.event-card h3 {
  margin-top: 12px;
  color: #1a1a1a;
  font-size: 20px;
  font-weight: 600;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 9px 0 0;
  color: #5c5c5c;
  font-size: 13px;
}

.event-location svg {
  width: 15px;
  height: 15px;
}

.event-desc {
  margin: 12px 0 0;
  color: #5c5c5c;
  font-size: 14px;
}

.event-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.event-card__actions button {
  align-self: flex-start;
  margin-top: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.event-modal {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.48);
}

.event-modal__panel {
  width: min(512px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 16px;
  background: #ffffff;
  animation: fadeUp 200ms ease-out both;
}

.event-modal__image {
  position: relative;
  height: 240px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%),
    linear-gradient(135deg, var(--modal-accent), color-mix(in srgb, var(--modal-accent) 65%, white));
}

.event-modal__image button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  color: #ffffff;
  cursor: pointer;
}

.event-modal__image svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.event-modal__body {
  padding: 32px;
}

.event-modal__body .category-badge {
  align-self: flex-start;
  min-height: 24px;
  padding: 0 10px;
}

.event-modal__body h2 {
  margin-top: 14px;
  color: #1a1a1a;
  font-size: 32px;
  font-weight: 600;
}

.event-modal__body p {
  margin: 20px 0 0;
  color: #1a1a1a;
  font-size: 16px;
  line-height: 1.55;
}

.event-modal__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  color: #5c5c5c;
  font-size: 14px;
}

.event-modal__meta span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.event-modal__meta svg,
.event-modal__calendar-action svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.event-modal__divider {
  height: 1px;
  margin-top: 28px;
  background: #e8e4dc;
}

.event-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.event-modal__actions button {
  min-width: 92px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 22px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.event-modal__actions .event-modal__close-action {
  background: transparent;
  color: #1b4332 !important;
}

.event-modal__actions .event-modal__calendar-action {
  color: #ffffff;
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

  .events-header__inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .event-grid,
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

  h1 {
    font-size: 38px;
  }

  .featured-event {
    min-height: 520px;
  }

  .featured-event__copy {
    padding: 112px 24px 32px;
  }

  .featured-event h2 {
    font-size: 32px;
  }

  .event-grid,
  .site-footer__main {
    grid-template-columns: 1fr;
  }

  .calendar-panel {
    overflow-x: auto;
    padding: 20px 14px;
  }

  .calendar-weekdays,
  .calendar-grid {
    min-width: 760px;
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


