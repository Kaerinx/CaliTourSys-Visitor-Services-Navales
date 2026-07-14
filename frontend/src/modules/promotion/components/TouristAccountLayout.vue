<script setup>
import PromotionFooter from './PromotionFooter.vue'
import PromotionNavbar from './PromotionNavbar.vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'

defineProps({
  eyebrow: { type: String, default: 'Tourist account' },
  title: { type: String, required: true },
  description: { type: String, required: true },
})

const auth = useTouristAuthStore()
</script>

<template>
  <div class="tourist-account-page">
    <PromotionNavbar />
    <main class="tourist-account-shell">
      <header class="tourist-account-hero">
        <p>{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <span>{{ description }}</span>
      </header>

      <div class="tourist-account-layout">
        <aside class="tourist-account-nav" aria-label="Tourist account navigation">
          <div class="tourist-account-nav__identity">
            <strong>{{ auth.tourist?.fullName }}</strong>
            <span>{{ auth.tourist?.email }}</span>
          </div>
          <nav>
            <RouterLink to="/tourist/profile">My Profile</RouterLink>
            <RouterLink to="/tourist/bookings">Booking History</RouterLink>
            <RouterLink to="/tourist/settings">Settings</RouterLink>
          </nav>
        </aside>

        <section class="tourist-account-content">
          <slot />
        </section>
      </div>
    </main>
    <PromotionFooter />
  </div>
</template>

<style scoped>
.tourist-account-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

.tourist-account-shell {
  width: min(100% - 48px, 1120px);
  margin: 0 auto;
  padding: 112px 0 80px;
}

.tourist-account-hero {
  max-width: 720px;
  margin-bottom: 32px;
}

.tourist-account-hero p {
  margin: 0;
  color: #1b4332;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tourist-account-hero h1 {
  margin: 8px 0 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: clamp(34px, 5vw, 48px);
  line-height: 1.15;
}

.tourist-account-hero span {
  display: block;
  margin-top: 12px;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.6;
}

.tourist-account-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.tourist-account-nav,
.tourist-account-content {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
}

.tourist-account-nav {
  position: sticky;
  top: 88px;
  padding: 16px;
}

.tourist-account-nav__identity {
  min-width: 0;
  display: grid;
  gap: 4px;
  padding: 8px 8px 16px;
  border-bottom: 1px solid #e8e4dc;
}

.tourist-account-nav__identity strong,
.tourist-account-nav__identity span {
  overflow-wrap: anywhere;
}

.tourist-account-nav__identity span {
  color: #5c5c5c;
  font-size: 12px;
}

.tourist-account-nav nav {
  display: grid;
  gap: 4px;
  margin-top: 12px;
}

.tourist-account-nav a {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 8px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.tourist-account-nav a:hover,
.tourist-account-nav a.router-link-active {
  background: #d8f3dc;
  color: #1b4332;
}

.tourist-account-content {
  min-width: 0;
  padding: 32px;
}

@media (max-width: 760px) {
  .tourist-account-shell {
    width: min(100% - 32px, 1120px);
    padding-top: 96px;
  }

  .tourist-account-layout {
    grid-template-columns: 1fr;
  }

  .tourist-account-nav {
    position: static;
  }

  .tourist-account-nav nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tourist-account-nav a {
    justify-content: center;
    padding: 8px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .tourist-account-nav nav {
    grid-template-columns: 1fr;
  }

  .tourist-account-nav a {
    justify-content: flex-start;
    text-align: left;
  }

  .tourist-account-content {
    padding: 22px;
  }
}
</style>
