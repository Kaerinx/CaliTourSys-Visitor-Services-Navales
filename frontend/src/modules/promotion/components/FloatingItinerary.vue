<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { loadItinerary, removeFromItinerary } from '../services/promotionService'
import { useVisitorSession } from '../composables/useVisitorSession'

const route = useRoute()
const { isAuthenticated } = useVisitorSession()
const isOpen = ref(false)
const isLoading = ref(false)
const message = ref('')
const items = ref([])

const isPromotionRoute = computed(
  () =>
    ['/', '/destinations', '/products', '/packages', '/events'].some(
      (path) => route.path === path || route.path.startsWith(`${path}/`),
    ) || route.path.startsWith('/promotion'),
)

// Phase 3.1: the itinerary is protected — it stays completely hidden for guests
// and only renders for an authenticated visitor.
const isVisible = computed(() => isPromotionRoute.value && isAuthenticated.value)
const itemCount = computed(() => items.value.length)

async function refreshItinerary() {
  if (!isVisible.value) {
    items.value = []
    message.value = ''
    isLoading.value = false
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    const itinerary = await loadItinerary()
    items.value = itinerary.items.map((item) => ({
      id: item.id,
      backendItemId: item.id,
      itemId: item.targetId,
      apiId: item.targetId,
      itemType: item.itemType,
      title: item.titleSnapshot || item.summary?.title || 'Saved item',
      slug: item.summary?.slug,
      savedAt: item.savedAt,
    }))
  } catch (error) {
    message.value = error.message || 'Unable to load itinerary.'
  } finally {
    isLoading.value = false
  }
}

async function removeItem(item) {
  try {
    await removeFromItinerary(item)
    items.value = items.value.filter((saved) => saved.id !== item.id)
    message.value = 'Removed from itinerary'
    window.dispatchEvent(new CustomEvent('calitoursys:itinerary-updated'))
  } catch (error) {
    message.value = error.message || 'Unable to remove itinerary item.'
  }
}

function targetPath(item) {
  if (item.itemType === 'product' && item.slug) return `/products/${item.slug}`
  if (item.itemType === 'event') return '/events'
  if (item.itemType === 'destination') return '/destinations'
  if (item.itemType === 'artifact') return '/promotion/museum'
  return '/promotion'
}

function handleUpdated() {
  refreshItinerary()
}

watch(
  () => route.path,
  () => {
    if (isVisible.value) refreshItinerary()
  },
)

// useVisitorSession keeps isAuthenticated reactive across login/logout, so we
// just react to it here: load on sign-in, clear and collapse on sign-out.
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    refreshItinerary()
  } else {
    items.value = []
    isOpen.value = false
  }
})

onMounted(() => {
  refreshItinerary()
  window.addEventListener('calitoursys:itinerary-updated', handleUpdated)
})

onUnmounted(() => {
  window.removeEventListener('calitoursys:itinerary-updated', handleUpdated)
})
</script>

<template>
  <aside v-if="isVisible" class="itinerary-widget" :class="{ 'itinerary-widget--open': isOpen }">
    <button
      class="itinerary-widget__trigger"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="public-itinerary-panel"
      @click="isOpen = !isOpen"
    >
      <span>
        <strong>{{ itemCount }}</strong>
      </span>
      Itinerary
    </button>

    <section
      v-if="isOpen"
      id="public-itinerary-panel"
      class="itinerary-widget__panel"
      aria-label="Saved itinerary"
    >
      <header>
        <div>
          <p>Saved trip items</p>
          <h2>Your itinerary</h2>
        </div>
        <button type="button" aria-label="Close itinerary" @click="isOpen = false">x</button>
      </header>

      <p v-if="isLoading" class="itinerary-widget__state">Loading saved items...</p>
      <p v-else-if="message" class="itinerary-widget__state">{{ message }}</p>
      <p v-else-if="items.length === 0" class="itinerary-widget__empty">
        Save products, events, or destinations to build a public trip list.
      </p>

      <div v-else class="itinerary-widget__list">
        <article v-for="item in items" :key="item.id" class="itinerary-widget__item">
          <span>{{ item.itemType }}</span>
          <strong>{{ item.title }}</strong>
          <div>
            <RouterLink :to="targetPath(item)">Open</RouterLink>
            <button type="button" @click="removeItem(item)">Remove</button>
          </div>
        </article>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.itinerary-widget {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 140;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

.itinerary-widget__trigger {
  height: 46px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px 0 8px;
  border: 1px solid #d4ac0d;
  border-radius: 999px;
  background: #ffffff;
  color: #1b4332;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.itinerary-widget__trigger span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1b4332;
  color: #ffffff;
}

.itinerary-widget__panel {
  position: absolute;
  right: 0;
  bottom: 58px;
  width: min(360px, calc(100vw - 32px));
  max-height: min(560px, calc(100vh - 96px));
  overflow: auto;
  border: 1px solid #e8e4dc;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.2);
}

.itinerary-widget__panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid #e8e4dc;
}

.itinerary-widget__panel p,
.itinerary-widget__panel h2 {
  margin: 0;
}

.itinerary-widget__panel header p {
  color: #5c5c5c;
  font-size: 12px;
  text-transform: uppercase;
}

.itinerary-widget__panel h2 {
  margin-top: 4px;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 20px;
}

.itinerary-widget__panel header button {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  cursor: pointer;
}

.itinerary-widget__state,
.itinerary-widget__empty {
  padding: 16px 18px;
  color: #5c5c5c;
  font-size: 14px;
}

div.itinerary-widget__empty {
  display: grid;
  gap: 12px;
}

.itinerary-widget__empty p {
  margin: 0;
}

.itinerary-widget__empty button {
  justify-self: start;
  min-height: 36px;
  padding: 0 14px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.itinerary-widget__list {
  display: grid;
}

.itinerary-widget__item {
  display: grid;
  gap: 8px;
  padding: 15px 18px;
  border-bottom: 1px solid #e8e4dc;
}

.itinerary-widget__item span {
  width: fit-content;
  padding: 2px 9px;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 11px;
  text-transform: capitalize;
}

.itinerary-widget__item strong {
  color: #1a1a1a;
  font-size: 14px;
}

.itinerary-widget__item div {
  display: flex;
  gap: 12px;
}

.itinerary-widget__item a,
.itinerary-widget__item button {
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

@media (max-width: 720px) {
  .itinerary-widget {
    right: 14px;
    bottom: 14px;
  }
}
</style>
