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
  { key: 'products', label: 'Products / OTOP', path: '/cms/products', permission: 'products.view', icon: 'package' },
  { key: 'destinations', label: 'Destinations', path: '/cms/destinations', permission: 'destinations.view', icon: 'destinations' },
  { key: 'businesses', label: 'Businesses', path: '/cms/businesses', permission: 'businesses.view', icon: 'building' },
  { key: 'map', label: 'Map Locations', path: '/cms/map-locations', permission: 'map_locations.view', icon: 'map' },
  { key: 'museum', label: 'Museum', path: '/cms/museum/artifacts', permission: 'museum.view', icon: 'museum' },
  { key: 'media', label: 'Media', path: '/cms/media', permission: 'media.view', icon: 'image' },
  { key: 'inquiries', label: 'Inquiries', path: '/cms/inquiries', permission: 'inquiries.view', icon: 'message' },
  { key: 'newsletter', label: 'Newsletter', path: '/cms/newsletter-subscribers', permission: 'newsletter.view', icon: 'mail' },
  { key: 'users', label: 'Users & Roles', path: '/cms/users', permissions: ['users.view', 'roles.view'], icon: 'users' },
  { key: 'audit', label: 'Audit Logs', path: '/cms/audit-logs', permission: 'audit_logs.view', icon: 'audit' },
]

const navigationItems = computed(() => {
  if (!backendNavigation.value.length) return fallbackNavigation
  return backendNavigation.value.map((item) => ({
    key: item.key,
    label: item.label,
    path: normalizeNavigationPath(item),
    permission: item.requiredPermission || item.permission,
    permissions: item.requiredPermissions || item.permissions,
    icon: resolveNavigationIcon(item),
  }))
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
    museum: '/cms/museum/artifacts',
    'visitor-services': '/cms/inquiries',
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
  }

  return icons[item.key] || item.icon || 'circle'
}
</script>

<template>
  <div class="cms-layout">
    <div v-if="sidebarOpen" class="cms-layout__scrim" @click="sidebarOpen = false"></div>
    <CmsSidebar :items="navigationItems" :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="cms-layout__main">
      <CmsTopbar :user="auth.currentUser" @toggle-sidebar="sidebarOpen = true" @logout="logout" />
      <main id="cms-main-content" class="cms-layout__content" tabindex="-1">
        <RouterView />
      </main>
    </div>
  </div>
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

@media (max-width: 900px) {
  .cms-layout__main {
    margin-left: 0;
  }

  .cms-layout__content {
    padding: 18px 16px 28px;
  }
}
</style>
