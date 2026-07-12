<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useTouristAuthStore } from '../stores/touristAuthStore'
import { SHOW_MUSEUM_MODULE } from '@/config/featureFlags'

import logo from '@/assets/brand/love-calabanga-logo.png'

const route = useRoute()
const router = useRouter()
const touristAuth = useTouristAuthStore()

const primaryLinks = [
  { label: 'Home', to: '/', match: 'exact' },
  { label: 'Destination', to: '/destinations' },
  { label: 'Products', to: '/products' },
  { label: 'Packages', to: '/packages' },
  { label: 'Events', to: '/events' },
  SHOW_MUSEUM_MODULE ? { label: 'Museum', to: '/promotion/museum' } : null,
].filter(Boolean)

const accreditationLinks = [
  { label: 'Online Accreditation', to: '/accreditation' },
  { label: 'Accredited Establishments', to: '/accredited-establishments' },
]

const isMenuOpen = ref(false)
const isAccountOpen = ref(false)
const accountMenuRef = ref(null)
const accountTriggerRef = ref(null)

const touristInitials = computed(() => {
  const name = touristAuth.tourist?.fullName?.trim() || touristAuth.tourist?.email || 'Tourist'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})

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

function openTouristAuth(mode = 'login') {
  closeMenu()
  isAccountOpen.value = false
  router.replace({
    path: route.path,
    query: { ...route.query, auth: mode },
  })
}

function toggleAccountMenu() {
  isAccountOpen.value = !isAccountOpen.value
}

async function logout() {
  isAccountOpen.value = false
  closeMenu()
  await touristAuth.logout()
  if (route.path.startsWith('/tourist/')) await router.push('/')
}

function handleDocumentClick(event) {
  if (accountMenuRef.value && !accountMenuRef.value.contains(event.target)) {
    isAccountOpen.value = false
  }
}

function handleDocumentKeydown(event) {
  if (event.key !== 'Escape' || !isAccountOpen.value) return
  isAccountOpen.value = false
  accountTriggerRef.value?.focus()
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
    isAccountOpen.value = false
  },
)

watch(isMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
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
        <button
          v-if="!touristAuth.isAuthenticated"
          class="login-button"
          type="button"
          @click="openTouristAuth('login')"
        >
          Login
        </button>
        <div v-else ref="accountMenuRef" class="account-menu">
          <button
            ref="accountTriggerRef"
            class="account-menu__trigger"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="isAccountOpen"
            @click="toggleAccountMenu"
          >
            <span class="account-avatar" aria-hidden="true">{{ touristInitials }}</span>
            <span class="account-menu__name">{{ touristAuth.tourist?.fullName }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <transition name="account-popover">
            <div v-if="isAccountOpen" class="account-menu__popover" role="menu">
              <div class="account-menu__identity">
                <span class="account-avatar account-avatar--large" aria-hidden="true">{{ touristInitials }}</span>
                <span>
                  <strong>{{ touristAuth.tourist?.fullName }}</strong>
                  <small>{{ touristAuth.tourist?.email }}</small>
                </span>
              </div>
              <RouterLink to="/tourist/profile" role="menuitem">My Profile</RouterLink>
              <RouterLink to="/tourist/bookings" role="menuitem">Booking History</RouterLink>
              <RouterLink to="/tourist/settings" role="menuitem">Settings</RouterLink>
              <button type="button" role="menuitem" @click="logout">Logout</button>
            </div>
          </transition>
        </div>
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

        <div v-if="touristAuth.isAuthenticated" class="mobile-account">
          <div class="mobile-account__identity">
            <span class="account-avatar" aria-hidden="true">{{ touristInitials }}</span>
            <span>
              <strong>{{ touristAuth.tourist?.fullName }}</strong>
              <small>{{ touristAuth.tourist?.email }}</small>
            </span>
          </div>
          <RouterLink to="/tourist/profile">My Profile</RouterLink>
          <RouterLink to="/tourist/bookings">Booking History</RouterLink>
          <RouterLink to="/tourist/settings">Settings</RouterLink>
          <button type="button" @click="logout">Logout</button>
        </div>
        <button v-else class="mobile-drawer__login" type="button" @click="openTouristAuth('login')">
          Login
        </button>
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
  min-width: 0;
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
  flex: 0 0 auto;
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

.account-menu {
  position: relative;
}

.account-menu__trigger {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border: 1px solid #e8e4dc;
  border-radius: 999px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
}

.account-menu__trigger:hover,
.account-menu__trigger[aria-expanded='true'] {
  background: #f2f0eb;
  border-color: #1b4332;
}

.account-menu__trigger > svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.account-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #1b4332;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

.account-avatar--large {
  width: 44px;
  height: 44px;
  font-size: 14px;
}

.account-menu__name {
  max-width: 120px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-menu__popover {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 286px;
  padding: 8px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
}

.account-menu__identity,
.mobile-account__identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-menu__identity {
  margin-bottom: 6px;
  padding: 10px 10px 14px;
  border-bottom: 1px solid #e8e4dc;
}

.account-menu__identity > span:last-child,
.mobile-account__identity > span:last-child {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.account-menu__identity strong,
.account-menu__identity small,
.mobile-account__identity strong,
.mobile-account__identity small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-menu__identity strong,
.mobile-account__identity strong {
  font-size: 14px;
}

.account-menu__identity small,
.mobile-account__identity small {
  color: #5c5c5c;
  font-size: 12px;
}

.account-menu__popover > a,
.account-menu__popover > button {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #1a1a1a;
  font: inherit;
  font-size: 14px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.account-menu__popover > a:hover,
.account-menu__popover > button:hover,
.account-menu__popover > a:focus-visible,
.account-menu__popover > button:focus-visible {
  background: #d8f3dc;
  color: #1b4332;
}

.account-menu__popover > button {
  margin-top: 4px;
  border-top: 1px solid #e8e4dc;
  border-radius: 0 0 8px 8px;
  color: #c0392b;
}

.account-popover-enter-active,
.account-popover-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.account-popover-enter-from,
.account-popover-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Mobile drawer */
.mobile-drawer {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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
  background: #ffffff;
  cursor: pointer;
}

.mobile-account {
  display: grid;
  gap: 4px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e8e4dc;
}

.mobile-account__identity {
  margin-bottom: 8px;
  padding: 0 12px 12px;
}

.mobile-account > a,
.mobile-account > button {
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #1a1a1a;
  font: inherit;
  font-size: 16px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.mobile-account > a:hover,
.mobile-account > button:hover {
  background: #d8f3dc;
  color: #1b4332;
}

.mobile-account > button {
  color: #c0392b;
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

  .site-nav__actions {
    margin-left: auto;
  }

  .site-nav__actions .icon-button--menu {
    display: grid;
  }

  /* Declutter to logo + hamburger; login lives in the drawer. */
  .site-nav__actions .login-button,
  .site-nav__actions .account-menu,
  .site-nav__actions .icon-button:not(.icon-button--menu) {
    display: none;
  }

  .brand__logo {
    height: 32px;
  }
}
</style>
