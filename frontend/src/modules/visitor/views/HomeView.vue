<template>
  <main>
    <section
      class="public-hero photo-hero home-photo-hero"
      :style="{ '--hero-image': `url(${tourismImages.homeHero})` }"
    >
      <div class="home-hero-copy">
        <span class="hero-kicker">Discover the Heart of Bicol</span>
        <h1>Explore Calabanga Tourism</h1>
        <p>
          Plan a meaningful visit through Calabanga's eco-parks, cultural landmarks, community
          events, resorts, and visitor assistance services.
        </p>
        <div class="public-actions">
          <RouterLink class="public-button" to="/destinations">Explore Destinations</RouterLink>
          <RouterLink class="public-button-secondary" to="/inquiries">Contact Tourism Office</RouterLink>
        </div>
      </div>
    </section>

    <section class="public-section">
      <div class="section-title">
        <h2>Featured Destinations</h2>
        <p>Nature, heritage, and family-friendly stops curated for visitors to Calabanga.</p>
      </div>

      <div class="public-grid">
        <article v-for="destination in destinations" :key="destination.slug" class="public-card">
          <div class="card-image-frame">
            <img
              class="destination-image"
              :src="destination.image"
              :alt="destination.imageAlt"
              loading="lazy"
            />
          </div>
          <div class="public-card-body destination-card-body">
            <span class="pill">{{ destination.tag }}</span>
            <h3>{{ destination.name }}</h3>
            <p>{{ destination.description }}</p>
            <div class="card-footer">
              <strong>{{ destination.fee }}</strong>
              <RouterLink :to="`/destinations/${destination.slug}`">View Details</RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="public-section soft-section">
      <div class="section-title">
        <h2>Upcoming Events</h2>
        <p>Celebrate local culture, environmental stewardship, and community tourism programs.</p>
      </div>

      <div class="public-grid">
        <article v-for="event in events" :key="event.name" class="public-card public-card-body">
          <span class="pill">{{ event.category }}</span>
          <h3>{{ event.name }}</h3>
          <p class="event-date">{{ event.date }} | {{ event.time }}</p>
          <p>{{ event.description }}</p>
        </article>
      </div>
    </section>

    <section class="public-section">
      <div class="cta-band">
        <h2>Need Visitor Assistance?</h2>
        <p>
          The Calabanga Tourism Office can help with destination information, resort inquiries,
          museum visits, and local travel guidance.
        </p>
        <RouterLink class="public-button-secondary" to="/inquiries">Submit an Inquiry</RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { destinations, events } from '../publicData'
import { tourismImages } from '../../../data/tourismImages'
</script>

<style scoped>
.home-hero-copy {
  max-width: 980px;
}

.destination-card-body {
  display: grid;
  gap: 0.7rem;
}

.destination-card-body h3 {
  margin-top: 0.2rem;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
}

.card-footer strong {
  color: var(--primary-green);
}

.card-footer a {
  color: var(--primary-green);
  font-weight: 850;
  text-decoration: none;
}

.soft-section {
  width: 100%;
  padding-inline: clamp(1rem, 8vw, 10rem);
  background: var(--soft-green);
}

.event-date {
  color: var(--primary-green) !important;
  font-weight: 800;
}

.cta-band {
  display: grid;
  justify-items: center;
  gap: 1rem;
  border-radius: 24px;
  padding: clamp(2rem, 5vw, 4rem);
  text-align: center;
  color: #fff;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.18), transparent 16rem),
    linear-gradient(135deg, var(--primary-green), #24734f);
  box-shadow: 0 20px 45px rgba(23, 73, 51, 0.18);
}

.cta-band h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
}

.cta-band p {
  max-width: 720px;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}
</style>
