<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CmsSidebar from '../components/CmsSidebar.vue'
import CmsTopbar from '../components/CmsTopbar.vue'
import { cmsApi } from '../services/cmsApi'
import { useCmsAuthStore } from '../stores/authStore'

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
  { key: 'destinations', label: 'Destinations', path: '/cms/destinations', permission: 'destinations.view', icon: 'destinations' },
  { key: 'businesses', label: 'Businesses', path: '/cms/businesses', permission: 'businesses.view', icon: 'building' },
  { key: 'map', label: 'Map Locations', path: '/cms/map-locations', permission: 'map_locations.view', icon: 'map' },
  { key: 'museum', label: 'Museum', path: '/cms/museum', permission: 'museum.view', icon: 'museum' },
  { key: 'visitor-services', label: 'Visitor Services', path: '/cms/visitor', permissions: ['inquiries.view', 'dashboard.view'], icon: 'users' },
  { key: 'media', label: 'Media', path: '/cms/media', permission: 'media.view', icon: 'image' },
  { key: 'inquiries', label: 'Inquiries', path: '/cms/inquiries', permission: 'inquiries.view', icon: 'message' },
  { key: 'newsletter', label: 'Newsletter', path: '/cms/newsletter-subscribers', permission: 'newsletter.view', icon: 'mail' },
  { key: 'users', label: 'Users & Roles', path: '/cms/users', permissions: ['users.view', 'roles.view'], icon: 'users' },
  { key: 'audit', label: 'Audit Logs', path: '/cms/audit-logs', permission: 'audit_logs.view', icon: 'audit' },
]

const productDevelopmentNavigation = [
  { key: 'product-development', label: 'Dashboard', path: '/cms/product-development', permission: 'products.view', icon: 'dashboard', exact: true, group: 'Product Development' },
  { key: 'product-development-assets', label: 'Assets', path: '/cms/product-development/assets', permission: 'products.view', icon: 'destinations', group: 'Product Development' },
  { key: 'product-development-plans', label: 'Plans', path: '/cms/product-development/development-plans', permission: 'products.view', icon: 'calendar', group: 'Product Development' },
  { key: 'product-development-improvements', label: 'Improvements', path: '/cms/product-development/improvements', permission: 'products.view', icon: 'audit', group: 'Product Development' },
  { key: 'product-development-activities', label: 'Activities', path: '/cms/product-development/activities', permission: 'products.view', icon: 'message', group: 'Product Development' },
  { key: 'product-development-packages', label: 'Packages', path: '/cms/product-development/packages', permission: 'products.view', icon: 'package', group: 'Product Development' },
]

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

  const mapped = [...baseItems]

  if (!mapped.some((item) => item.key === 'categories')) {
    mapped.splice(3, 0, {
      key: 'categories',
      label: 'Categories',
      path: '/cms/categories',
      permissions: ['events.view', 'products.view', 'destinations.view', 'museum.view'],
      icon: 'audit',
    })
  }

  return mergeNavigationItems(mapped, productDevelopmentNavigation)
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
    inquiries: 'message',
    map: 'map',
    'map-locations': 'map',
    media: 'image',
    museum: 'museum',
    newsletter: 'mail',
    products: 'package',
    promotions: 'message',
    users: 'users',
    'visitor-services': 'users',
  }

  return icons[item.key] || item.icon || 'circle'
}

function mergeNavigationItems(baseItems, additionalItems) {
  const existingKeys = new Set(baseItems.map((item) => item.key))
  const existingPaths = new Set(baseItems.map((item) => item.path))

  return [
    ...baseItems,
    ...additionalItems.filter((item) => !existingKeys.has(item.key) && !existingPaths.has(item.path)),
  ]
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
