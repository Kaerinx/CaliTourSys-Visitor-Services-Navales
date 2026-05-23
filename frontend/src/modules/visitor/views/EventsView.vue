<template>
  <main>
    <section
      class="page-hero photo-hero"
      :style="{ '--hero-image': `url(${tourismImages.eventsCover})` }"
    >
      <span class="hero-kicker">Events and Activities</span>
      <h1>Celebrate Calabanga's culture and community</h1>
      <p>
        Discover upcoming local events, cultural festivals, environmental programs, and tourism
        activities.
      </p>
    </section>

    <section class="public-section">
      <div class="section-title">
        <h2>Upcoming Events</h2>
        <p>Join activities that connect visitors with local traditions, nature, and community life.</p>
      </div>

      <div class="public-grid">
        <article v-for="event in events" :key="event.name" class="public-card public-card-body event-card">
          <div class="event-header">
            <span class="pill">{{ event.category }}</span>
            <span class="event-status">Upcoming</span>
          </div>
          <h3>{{ event.name }}</h3>
          <ul>
            <li><strong>Date:</strong> {{ event.date }}</li>
            <li><strong>Time:</strong> {{ event.time }}</li>
            <li><strong>Location:</strong> {{ event.location }}</li>
            <li><strong>Organizer:</strong> {{ event.organizer }}</li>
          </ul>
          <p>{{ event.description }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { events } from '../publicData'
import { tourismImages } from '../../../data/tourismImages'
</script>

<style scoped>
.event-card {
  display: grid;
  gap: 0.85rem;
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.event-status {
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  background: var(--primary-green);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 800;
}

.event-card ul {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--muted);
}

.event-card strong {
  color: var(--ink);
}
</style>
