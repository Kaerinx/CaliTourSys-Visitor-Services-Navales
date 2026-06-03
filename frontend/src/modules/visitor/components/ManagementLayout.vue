<script setup>
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { adminNav, receptionistNav, tourismNav } from '../views/nav'
import '../styles.css'

defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const auth = useAuthStore()

const navItems = computed(() => {
  if (auth.user?.role === 'admin') return adminNav
  if (auth.user?.role === 'receptionist') return receptionistNav
  return tourismNav
})

const roleLabel = computed(() => {
  if (auth.user?.role === 'admin') return 'System Administrator'
  if (auth.user?.role === 'receptionist') return 'Receptionist Desk'
  if (auth.user?.role === 'tourism_staff') return 'Tourism Staff'
  return 'Authorized User'
})

function logout() {
  auth.logout()
  router.push('/visitor/login')
}

const svgAttrs = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '22',
  height: '22',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}

function svg(children) {
  return { render: () => h('svg', svgAttrs, children) }
}

const icons = {
  location: svg([
    h('path', { d: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z' }),
    h('circle', { cx: '12', cy: '10', r: '3' }),
  ]),
  dashboard: svg([
    h('rect', { x: '3', y: '3', width: '7', height: '7' }),
    h('rect', { x: '14', y: '3', width: '7', height: '7' }),
    h('rect', { x: '14', y: '14', width: '7', height: '7' }),
    h('rect', { x: '3', y: '14', width: '7', height: '7' }),
  ]),
  users: svg([
    h('path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }),
    h('circle', { cx: '9', cy: '7', r: '4' }),
    h('path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }),
    h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }),
  ]),
  building: svg([
    h('rect', { x: '4', y: '2', width: '16', height: '20', rx: '2' }),
    h('path', { d: 'M9 22v-4h6v4' }),
    h('path', { d: 'M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01' }),
  ]),
  message: svg([
    h('path', { d: 'M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z' }),
  ]),
  chart: svg([
    h('path', { d: 'M3 3v18h18' }),
    h('path', { d: 'M7 16V9M12 16V5M17 16v-3' }),
  ]),
  'user-cog': svg([
    h('circle', { cx: '9', cy: '7', r: '4' }),
    h('path', { d: 'M2 21v-2a4 4 0 0 1 4-4h4' }),
    h('circle', { cx: '18', cy: '18', r: '3' }),
    h('path', { d: 'M18 14v1M18 21v1M14 18h1M21 18h1' }),
  ]),
  settings: svg([
    h('path', { d: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z' }),
    h('path', { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .37.12.72.34 1H20a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-.51 1Z' }),
  ]),
  'user-plus': svg([
    h('path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }),
    h('circle', { cx: '9', cy: '7', r: '4' }),
    h('path', { d: 'M19 8v6M22 11h-6' }),
  ]),
  activity: svg([h('path', { d: 'M3 12h4l3 8 4-16 3 8h4' })]),
  file: svg([
    h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z' }),
    h('path', { d: 'M14 2v6h6M8 13h8M8 17h8M8 9h2' }),
  ]),
  logout: svg([
    h('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }),
    h('path', { d: 'M16 17l5-5-5-5M21 12H9' }),
  ]),
}

function iconFor(name) {
  return icons[name] || icons.dashboard
}
</script>

<template>
  <div class="management-shell">
    <aside class="management-sidebar">
      <RouterLink class="sidebar-brand" :to="auth.dashboardRoute || '/visitor/login'">
        <span class="sidebar-logo">
          <component :is="iconFor('location')" />
        </span>
        <span class="brand-copy">
          <strong>Calabanga Tourism</strong>
          <small>Management System</small>
        </span>
      </RouterLink>

      <nav class="sidebar-nav" aria-label="Management navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="sidebar-link"
          :to="item.to"
          active-class="is-active"
        >
          <component :is="iconFor(item.icon)" class="sidebar-link-icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <section class="sidebar-user">
        <strong>{{ auth.user?.full_name || auth.user?.username || 'User' }}</strong>
        <span class="role-badge">{{ roleLabel }}</span>
        <button type="button" class="logout-button" @click="logout">
          <component :is="iconFor('logout')" class="sidebar-link-icon" />
          <span>Logout</span>
        </button>
      </section>
    </aside>

    <main class="management-main">
      <header v-if="title || subtitle" class="page-heading">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </header>
      <slot />
    </main>
  </div>
</template>
