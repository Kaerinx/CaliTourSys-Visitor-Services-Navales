<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import PublicFooter from '../components/PublicFooter.vue'

const route = useRoute()

const navItems = [
  { label: 'Home', to: '/', match: (path) => path === '/' },
  { label: 'About', to: '/about', match: (path) => path.startsWith('/about') },
  {
    label: 'Destinations',
    to: '/destinations',
    match: (path) => path.startsWith('/destinations'),
  },
  { label: 'Events', to: '/events', match: (path) => path.startsWith('/events') },
  { label: 'Inquiries', to: '/inquiries', match: (path) => path.startsWith('/inquiries') },
]
</script>

<template>
  <div class="public-shell">
    <header class="public-header">
      <RouterLink class="public-brand" to="/" aria-label="Calabanga Tourism home">
        <span class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s7-5.1 7-11.2A7 7 0 0 0 5 9.8C5 15.9 12 21 12 21Z"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle cx="12" cy="9.8" r="2.4" stroke="currentColor" stroke-width="2" />
          </svg>
        </span>
        <span>
          <strong>Calabanga Tourism</strong>
          <small>Camarines Sur</small>
        </span>
      </RouterLink>

      <nav class="public-nav" aria-label="Public website navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="{ 'is-active': item.match(route.path) }"
        >
          {{ item.label }}
        </RouterLink>
        <span class="nav-divider" aria-hidden="true"></span>
        <RouterLink to="/login" class="login-link">Login</RouterLink>
      </nav>
    </header>

    <RouterView />
    <PublicFooter />
  </div>
</template>

<style>
:root {
  --primary-green: #174933;
  --primary-green-dark: #0f3625;
  --soft-green: rgba(23, 73, 51, 0.08);
  --green-ring: rgba(23, 73, 51, 0.18);
  --ink: #0f172a;
  --muted: #475569;
  --line: #e2e8f0;
  --surface: #ffffff;
  --page-bg: #f7faf8;
}

.public-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(23, 73, 51, 0.07), transparent 32rem),
    var(--page-bg);
  color: var(--ink);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.public-header {
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 0 clamp(1rem, 8vw, 10rem);
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);
}

.public-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  color: inherit;
  text-decoration: none;
}

.brand-logo {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  flex: 0 0 50px;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--primary-green), #1f6b49);
  color: #fff;
  box-shadow: 0 10px 22px rgba(23, 73, 51, 0.24);
}

.brand-logo svg {
  width: 28px;
  height: 28px;
}

.public-brand strong {
  display: block;
  font-size: clamp(1.05rem, 1.6vw, 1.35rem);
  line-height: 1.15;
}

.public-brand small {
  display: block;
  margin-top: 0.15rem;
  color: var(--muted);
}

.public-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 750;
}

.public-nav a {
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  color: #334155;
  text-decoration: none;
  transition:
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.public-nav a:hover,
.public-nav a:focus-visible {
  background: var(--soft-green);
  color: var(--primary-green);
  outline: none;
}

.public-nav a.is-active {
  background: var(--primary-green);
  color: #fff;
  box-shadow: 0 10px 20px rgba(23, 73, 51, 0.2);
}

.nav-divider {
  width: 1px;
  height: 28px;
  margin: 0 0.5rem;
  background: #cbd5e1;
}

.public-section {
  width: min(1520px, calc(100% - clamp(2rem, 8vw, 10rem)));
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 5.5rem) 0;
}

.public-hero,
.page-hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.18), transparent 18rem),
    radial-gradient(circle at 85% 35%, rgba(255, 255, 255, 0.12), transparent 16rem),
    linear-gradient(135deg, var(--primary-green), #216746 58%, var(--primary-green-dark));
}

.photo-hero {
  background-image:
    linear-gradient(135deg, rgba(15, 54, 37, 0.76), rgba(23, 73, 51, 0.62)),
    var(--hero-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.public-hero::after,
.page-hero::after {
  content: '';
  position: absolute;
  inset: auto -12% -10rem -12%;
  height: 15rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.public-hero {
  min-height: clamp(520px, 70vh, 680px);
  display: grid;
  place-items: center;
  padding: 5rem 1.5rem;
  text-align: center;
}

.public-hero > *,
.page-hero > * {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  color: #ecfdf5;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.public-hero h1,
.page-hero h1 {
  margin: 0 0 1.2rem;
  font-size: clamp(2.75rem, 7vw, 5.75rem);
  line-height: 0.98;
  letter-spacing: 0;
}

.public-hero p,
.page-hero p {
  max-width: 820px;
  margin: 0 auto 2rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1.05rem, 2vw, 1.4rem);
  line-height: 1.55;
}

.page-hero {
  padding: clamp(4rem, 8vw, 6.5rem) clamp(1.5rem, 8vw, 10rem);
  text-align: center;
}

.public-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.public-button,
.public-button-secondary {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-radius: 999px;
  padding: 0.85rem 1.3rem;
  font-weight: 850;
  text-decoration: none;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.public-button {
  border: 1px solid var(--primary-green);
  background: var(--primary-green);
  color: #fff;
  box-shadow: 0 10px 22px rgba(23, 73, 51, 0.2);
}

.public-button:hover,
.public-button:focus-visible {
  background: var(--primary-green-dark);
  transform: translateY(-1px);
  outline: none;
}

.public-button-secondary {
  border: 1px solid rgba(23, 73, 51, 0.24);
  background: #fff;
  color: var(--primary-green);
}

.public-button-secondary:hover,
.public-button-secondary:focus-visible {
  background: var(--soft-green);
  outline: none;
}

.public-hero .public-button {
  border-color: #fff;
  background: #fff;
  color: var(--primary-green);
}

.public-hero .public-button-secondary {
  border-color: rgba(255, 255, 255, 0.6);
  background: transparent;
  color: #fff;
}

.section-title {
  margin-bottom: clamp(2rem, 4vw, 3rem);
  text-align: center;
}

.section-title h1,
.section-title h2 {
  margin: 0 0 0.85rem;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.08;
}

.section-title p {
  max-width: 780px;
  margin: 0 auto;
  color: var(--muted);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.6;
}

.public-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.35rem;
}

.public-card {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  background: var(--surface);
  overflow: hidden;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.06);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.public-card:hover {
  transform: translateY(-4px);
  border-color: rgba(23, 73, 51, 0.22);
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.1);
}

.image-placeholder {
  min-height: 230px;
  display: grid;
  place-items: center;
  color: rgba(23, 73, 51, 0.72);
  background:
    linear-gradient(135deg, rgba(23, 73, 51, 0.12), rgba(255, 255, 255, 0.38)),
    radial-gradient(circle at center, rgba(23, 73, 51, 0.2), transparent 9rem);
  font-weight: 800;
}

.card-image-frame {
  height: 250px;
  overflow: hidden;
  background: var(--soft-green);
}

.destination-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 220ms ease;
}

.public-card:hover .destination-image {
  transform: scale(1.035);
}

.public-card-body {
  padding: 1.5rem;
}

.public-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
  line-height: 1.2;
}

.public-card p {
  color: var(--muted);
  line-height: 1.6;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  background: var(--soft-green);
  color: var(--primary-green);
  font-weight: 800;
  font-size: 0.86rem;
}

.public-form-card {
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 2.3rem);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.07);
}

.public-form-grid {
  display: grid;
  gap: 1rem;
}

.public-form-grid label {
  font-weight: 800;
}

.public-form-grid input,
.public-form-grid textarea,
.public-form-grid select {
  width: 100%;
  margin-top: 0.45rem;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0.95rem 1rem;
  background: #f1f5f2;
  color: var(--ink);
  font: inherit;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.public-form-grid input:focus,
.public-form-grid textarea:focus,
.public-form-grid select:focus {
  border-color: var(--primary-green);
  box-shadow: 0 0 0 4px var(--green-ring);
  background: #fff;
  outline: none;
}

@media (max-width: 980px) {
  .public-header {
    min-height: auto;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem clamp(1rem, 5vw, 2rem);
  }

  .public-nav {
    width: 100%;
    flex-wrap: wrap;
  }

  .public-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .public-nav {
    gap: 0.25rem;
  }

  .public-nav a {
    padding: 0.48rem 0.7rem;
    font-size: 0.95rem;
  }

  .nav-divider {
    display: none;
  }

  .public-section {
    width: min(100% - 1.25rem, 1520px);
  }
}
</style>
