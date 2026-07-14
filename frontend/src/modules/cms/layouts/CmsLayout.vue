<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CmsSidebar from '../components/CmsSidebar.vue'
import CmsTopbar from '../components/CmsTopbar.vue'
import { cmsApi } from '../services/cmsApi'
import { useCmsAuthStore } from '../stores/authStore'
import { SHOW_MUSEUM_MODULE } from '@/config/featureFlags'

const router = useRouter()
const auth = useCmsAuthStore()
const sidebarOpen = ref(false)
const backendNavigation = ref([])

const fallbackNavigation = [
  { key: 'dashboard', label: 'Dashboard', path: '/cms/dashboard', permission: 'dashboard.view', icon: 'dashboard' },
  { key: 'promotions', label: 'Promotions', path: '/cms/promotions', permission: 'promotions.view', icon: 'message' },
  { key: 'events', label: 'Events', path: '/cms/events', permission: 'events.view', icon: 'calendar' },
  { key: 'categories', label: 'Categories', path: '/cms/categories', permissions: ['events.view', 'products.view', 'destinations.view', 'museum.view'], icon: 'audit' },
  { key: 'products', label: 'Products / OTOP', path: '/cms/products', permission: 'products.view', icon: 'package' },
  { key: 'businesses', label: 'Businesses', path: '/cms/businesses', permission: 'businesses.view', icon: 'building' },
  { key: 'business-account-verification', label: 'Account Verification', path: '/cms/businesses/account-verification', permission: 'businesses.view', icon: 'users' },
  { key: 'map', label: 'Map Locations', path: '/cms/map-locations', permission: 'map_locations.view', icon: 'map' },
  { key: 'emergency-facilities', label: 'Emergency Facilities', path: '/cms/emergency-facilities', permission: 'map_locations.view', icon: 'alert' },
  { key: 'museum', label: 'Museum', path: '/cms/museum', permission: 'museum.view', icon: 'museum' },
  { key: 'visitor-services', label: 'Visitor Services / Inquiries', path: '/cms/visitor', permissions: ['inquiries.view', 'dashboard.view'], icon: 'users' },
  { key: 'inquiries', label: 'Inquiries', path: '/cms/visitor/inquiries', permission: 'inquiries.view', icon: 'message' },
  { key: 'package-bookings', label: 'Package Bookings', path: '/cms/package-bookings', permissions: ['package_bookings.view', 'package_bookings.review'], icon: 'package' },
  { key: 'users', label: 'Users & Roles', path: '/cms/users', permissions: ['users.view', 'roles.view'], icon: 'users' },
  { key: 'audit', label: 'Audit Logs', path: '/cms/audit-logs', permission: 'audit_logs.view', icon: 'audit' },
]

// Modules removed from the CMS sidebar (not built yet). Filtered out regardless
// of whether navigation comes from the backend or the local fallback.
const HIDDEN_NAV = new Set([
  'newsletter',
  'media',
  'reports',
  ...(SHOW_MUSEUM_MODULE ? [] : ['museum']),
])

const navigationItems = computed(() => {
  const baseItems = backendNavigation.value.length
    ? backendNavigation.value.map((item) => ({
        key: item.key,
        label: item.label,
        path: normalizeNavigationPath(item),
        permission: item.requiredPermission || item.permission,
        permissions: item.requiredPermissions || item.permissions,
        icon: resolveNavigationIcon(item),
      }))
    : fallbackNavigation

  const mapped = baseItems.filter((item) => item.key !== 'destinations')

  if (!mapped.some((item) => item.key === 'categories')) {
    mapped.splice(3, 0, {
      key: 'categories',
      label: 'Categories',
      path: '/cms/categories',
      permissions: ['events.view', 'products.view', 'destinations.view', 'museum.view'],
      icon: 'audit',
    })
  }

  if (!mapped.some((item) => item.key === 'product-development')) {
    const insertIndex = mapped.findIndex((item) => item.key === 'categories')
    mapped.splice(insertIndex >= 0 ? insertIndex : 3, 0, {
      key: 'product-development',
      label: 'Product Development',
      path: '/cms/product-development/assets',
      permission: 'products.view',
      icon: 'package',
    })
  }

  if (!mapped.some((item) => item.key === 'business-account-verification')) {
    const insertIndex = mapped.findIndex((item) => item.key === 'businesses')
    mapped.splice(insertIndex >= 0 ? insertIndex + 1 : mapped.length, 0, {
      key: 'business-account-verification',
      label: 'Account Verification',
      path: '/cms/businesses/account-verification',
      permission: 'businesses.view',
      icon: 'users',
    })
  }

  if (!mapped.some((item) => item.key === 'emergency-facilities')) {
    const insertIndex = mapped.findIndex((item) => ['map', 'map-locations'].includes(item.key))
    mapped.splice(insertIndex >= 0 ? insertIndex + 1 : mapped.length, 0, {
      key: 'emergency-facilities',
      label: 'Emergency Facilities',
      path: '/cms/emergency-facilities',
      permission: 'map_locations.view',
      icon: 'alert',
    })
  }

  return mapped.filter(
    (item) =>
      !HIDDEN_NAV.has(item.key) && !HIDDEN_NAV.has(String(item.label).trim().toLowerCase()),
  )
})

onMounted(async () => {
  try {
    const { data } = await cmsApi.getNavigation()
    backendNavigation.value = data.items || data.navigation || []
  } catch (error) {
    if (import.meta.env.DEV) console.warn('CMS navigation fallback active.', error)
  }
})

async function logout() {
  await auth.logout()
  router.push({ name: 'cms-login' })
}

function normalizeNavigationPath(item) {
  const overrides = {
    newsletter: '/cms/newsletter-subscribers',
    museum: '/cms/museum',
    'visitor-services': '/cms/visitor',
    inquiries: '/cms/visitor/inquiries',
    'package-bookings': '/cms/package-bookings',
    'content-management': '/cms/promotions',
    'otop-support': '/cms/products',
    'business-accreditation': '/cms/businesses',
  }

  if (overrides[item.key]) return overrides[item.key]
  if (item.path?.startsWith('/cms')) return item.path
  return `/cms${item.path || ''}`
}

function resolveNavigationIcon(item) {
  const icons = {
    audit: 'audit',
    businesses: 'building',
    dashboard: 'dashboard',
    categories: 'audit',
    destinations: 'destinations',
    events: 'calendar',
    'emergency-facilities': 'alert',
    inquiries: 'message',
    map: 'map',
    'map-locations': 'map',
    media: 'image',
    museum: 'museum',
    newsletter: 'mail',
    products: 'package',
    'product-development': 'package',
    'package-bookings': 'package',
    promotions: 'message',
    users: 'users',
    'visitor-services': 'users',
  }

  return icons[item.key] || item.icon || 'circle'
}

</script>

<template>
  <div v-if="auth.isAuthenticated" class="cms-layout">
    <div v-if="sidebarOpen" class="cms-layout__scrim" @click="sidebarOpen = false"></div>
    <CmsSidebar :items="navigationItems" :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="cms-layout__main">
      <CmsTopbar :user="auth.currentUser" @toggle-sidebar="sidebarOpen = true" @logout="logout" />
      <main id="cms-main-content" class="cms-layout__content" tabindex="-1">
        <RouterView />
      </main>
    </div>
  </div>

  <main v-else class="cms-layout__handoff" aria-live="polite">
    <strong>Redirecting to CMS sign in...</strong>
    <span>Your secure staff session needs to be restored.</span>
  </main>
</template>

<style scoped>
.cms-layout {
  min-height: 100vh;
  background: #f6f8fb;
}

.cms-layout__main {
  min-height: 100vh;
  margin-left: 280px;
}

.cms-layout__content {
  width: min(1240px, 100%);
  padding: 24px 28px 32px;
  margin: 0 auto;
}

.cms-layout__scrim {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: rgba(15, 23, 42, 0.35);
}

.cms-layout__handoff {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  color: #475569;
  background: #f6f8fb;
  text-align: center;
}

.cms-layout__handoff strong {
  color: #0f172a;
  font-size: 1.1rem;
}

@media (max-width: 900px) {
  .cms-layout__main {
    margin-left: 0;
  }

  .cms-layout__content {
    padding: 18px 16px 28px;
  }
}
</style>
