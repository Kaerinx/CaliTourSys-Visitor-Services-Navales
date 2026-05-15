<script setup>
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <RouterView />

  <main v-if="route.matched.length === 0" class="fallback-home">
    <header class="fallback-nav">
      <div class="fallback-brand">
        <span class="fallback-logo">⌖</span>
        <span>
          <strong>Calabanga Tourism</strong>
          <small>Camarines Sur</small>
        </span>
      </div>
      <a href="/login">Login</a>
    </header>

    <section class="fallback-hero">
      <h1>Explore Calabanga Tourism</h1>
      <p>Discover local destinations, resorts, cultural sites, events, and visitor services in Calabanga</p>
      <div>
        <a class="fallback-button" href="/destinations">Explore Destinations</a>
        <a class="fallback-button secondary" href="/inquiries">Submit Inquiry</a>
      </div>
    </section>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.fallback-home {
  min-height: 100vh;
  color: #020617;
  background: #fff;
}

.fallback-nav {
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10vw;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.fallback-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.fallback-brand strong,
.fallback-brand small {
  display: block;
}

.fallback-brand small {
  color: #475569;
}

.fallback-logo {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #2563eb;
  color: white;
}

.fallback-nav a {
  color: #075cff;
  font-weight: 700;
  text-decoration: none;
}

.fallback-hero {
  min-height: 500px;
  display: grid;
  place-content: center;
  gap: 1.5rem;
  padding: 3rem;
  text-align: center;
  color: white;
  background: linear-gradient(120deg, #2563eb 0%, #0ea5e9 45%, #00a84f 100%);
  box-shadow: inset 0 -80px 55px rgba(255, 255, 255, 0.65);
}

.fallback-hero h1 {
  margin: 0;
  font-size: clamp(3rem, 5vw, 5rem);
  letter-spacing: 0;
}

.fallback-hero p {
  max-width: 860px;
  margin: 0 auto;
  font-size: 1.35rem;
}

.fallback-button {
  display: inline-flex;
  margin: 0.4rem;
  border: 1px solid white;
  border-radius: 8px;
  padding: 0.9rem 1.3rem;
  background: white;
  color: #075cff;
  font-weight: 800;
  text-decoration: none;
}

.fallback-button.secondary {
  background: transparent;
  color: white;
}
</style>
