<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import logo from '@/assets/brand/love-calabanga-logo.png'

const route = useRoute()

const primaryLinks = [
  { label: 'Home', to: '/', match: 'exact' },
  { label: 'Destination', to: '/destinations' },
  { label: 'Products', to: '/products' },
  { label: 'Packages', to: '/packages' },
  { label: 'Events', to: '/events' },
  { label: 'Museum', to: '/promotion/museum' },
]

const accreditationLinks = [
  { label: 'Online Accreditation', to: '/accreditation' },
  { label: 'Accredited Establishments', to: '/accredited-establishments' },
]

const isMenuOpen = ref(false)

const loginTo = computed(() => ({
  path: route.path,
  query: { ...route.query, auth: 'login' },
}))

function isActive(link) {
  if (link.match === 'exact') return route.path === link.to
  return route.path === link.to || route.path.startsWith(`${link.to}/`)
}

const isAccreditationActive = computed(() =>
  accreditationLinks.some((link) => route.path.startsWith(link.to)),
)

function closeMenu() {
  isMenuOpen.value = false
}

watch(
  () => route.fullPath,
  () => closeMenu(),
)

watch(isMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="site-nav">
    <div class="site-nav__inner">
      <RouterLink to="/home" class="brand" aria-label="Love Calabanga - Home">
        <img :src="logo" alt="Love Calabanga" class="brand__logo" />
      </RouterLink>

      <nav class="site-nav__links" aria-label="Primary navigation">
        <RouterLink
          v-for="link in primaryLinks"
          :key="link.to"
          :to="link.to"
          class="site-nav__link"
          :class="{ 'site-nav__link--active': isActive(link) }"
        >
          {{ link.label }}
        </RouterLink>

        <div class="site-nav__dropdown">
          <button
            class="site-nav__link site-nav__dropdown-trigger"
            :class="{ 'site-nav__link--active': isAccreditationActive }"
            type="button"
            aria-haspopup="true"
          >
            Accreditation
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div class="site-nav__dropdown-menu">
            <RouterLink v-for="link in accreditationLinks" :key="link.to" :to="link.to">
              {{ link.label }}
            </RouterLink>
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
        <RouterLink class="login-button" :to="loginTo" aria-label="Open visitor login">
          Login
        </RouterLink>
        <button
          class="icon-button icon-button--menu"
          type="button"
          :aria-expanded="isMenuOpen"
          aria-label="Open menu"
          @click="isMenuOpen = true"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <transition name="drawer">
      <div
        v-if="isMenuOpen"
        class="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div class="mobile-drawer__head">
          <RouterLink
            to="/home"
            class="brand"
            aria-label="Love Calabanga - Home"
            @click="closeMenu"
          >
            <img :src="logo" alt="Love Calabanga" class="brand__logo" />
          </RouterLink>
          <button class="icon-button" type="button" aria-label="Close menu" @click="closeMenu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav class="mobile-drawer__links" aria-label="Mobile navigation">
          <RouterLink
            v-for="link in primaryLinks"
            :key="link.to"
            :to="link.to"
            class="mobile-drawer__link"
            :class="{ 'mobile-drawer__link--active': isActive(link) }"
          >
            {{ link.label }}
          </RouterLink>

          <span class="mobile-drawer__group-label">Accreditation</span>
          <RouterLink
            v-for="link in accreditationLinks"
            :key="link.to"
            :to="link.to"
            class="mobile-drawer__link mobile-drawer__link--sub"
          >
            {{ link.label }}
          </RouterLink>

          <RouterLink to="/promotion/inquiry" class="mobile-drawer__link">Inquiries</RouterLink>
        </nav>

        <RouterLink class="mobile-drawer__login" :to="loginTo" @click="closeMenu">Login</RouterLink>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.site-nav {
  position: fixed;
  z-index: 50;
  top: 0;
  right: 0;
  left: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
  font-family: Inter, system-ui, sans-serif;
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
  text-decoration: none;
}

.brand__logo {
  height: 38px;
  width: auto;
  display: block;
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
  text-decoration: none;
  background: none;
  border: 0;
  cursor: pointer;
  font-family: inherit;
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

.site-nav__dropdown {
  position: relative;
  display: flex;
  align-items: stretch;
}

.site-nav__dropdown-trigger {
  gap: 4px;
}

.site-nav__dropdown-trigger svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.site-nav__dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
}

.site-nav__dropdown:hover .site-nav__dropdown-menu,
.site-nav__dropdown:focus-within .site-nav__dropdown-menu {
  opacity: 1;
  visibility: visible;
}

.site-nav__dropdown-menu a {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: #1a1a1a;
  font-size: 14px;
  text-decoration: none;
}

.site-nav__dropdown-menu a:hover {
  background: #d8f3dc;
  color: #1b4332;
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
  width: 44px;
  height: 44px;
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

/* Mobile drawer */
.mobile-drawer {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 16px 24px 32px;
}

.mobile-drawer__head {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.mobile-drawer__links {
  display: flex;
  flex-direction: column;
}

.mobile-drawer__link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 8px;
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
}

.mobile-drawer__link--active {
  background: #d8f3dc;
  color: #1b4332;
}

.mobile-drawer__link--sub {
  padding-left: 24px;
  font-size: 15px;
  color: #5c5c5c;
}

.mobile-drawer__group-label {
  margin: 16px 0 4px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #5c5c5c;
}

.mobile-drawer__login {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 24px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }
}

@media (max-width: 560px) {
  .site-nav__inner {
    width: min(100% - 32px, 1200px);
    gap: 12px;
  }

  /* Declutter to logo + hamburger; login lives in the drawer. */
  .site-nav__actions .login-button,
  .site-nav__actions .icon-button:not(.icon-button--menu) {
    display: none;
  }

  .brand__logo {
    height: 32px;
  }
}
</style>
