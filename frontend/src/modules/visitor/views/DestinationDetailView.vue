<template>
  <main v-if="destination">
    <section
      class="page-hero detail-hero photo-hero"
      :style="{ '--hero-image': `url(${destination.image || tourismImages.destinationsCover})` }"
    >
      <RouterLink class="back-link" to="/destinations">Back to Destinations</RouterLink>
      <span class="hero-kicker">{{ destination.type }}</span>
      <h1>{{ destination.name }}</h1>
      <p>{{ destination.longDescription }}</p>
    </section>

    <section class="public-section detail-layout">
      <div class="detail-main">
        <div class="public-card gallery-card">
          <img
            class="detail-image"
            :src="destination.image || tourismImages.destinationsCover"
            :alt="destination.imageAlt || `${destination.name} tourism photo`"
          />
        </div>

        <article class="public-card public-card-body">
          <h2>About This Destination</h2>
          <p>{{ destination.longDescription }}</p>
        </article>

        <article class="public-card public-card-body">
          <h2>Facilities and Amenities</h2>
          <ul class="amenity-list">
            <li v-for="amenity in destination.amenities" :key="amenity">{{ amenity }}</li>
          </ul>
        </article>

        <article class="reminder-card">
          <h2>Important Reminder</h2>
          <p>{{ destination.reminder }}</p>
        </article>
      </div>

      <aside class="public-card public-card-body info-panel">
        <h2>Essential Information</h2>
        <dl>
          <div>
            <dt>Address</dt>
            <dd>{{ destination.address }}</dd>
          </div>
          <div>
            <dt>Operating Hours</dt>
            <dd>{{ destination.hours }}</dd>
          </div>
          <div>
            <dt>Entry Fee</dt>
            <dd>{{ destination.fee }}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{{ destination.contact }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ destination.email }}</dd>
          </div>
        </dl>
        <RouterLink class="public-button" to="/inquiries">Ask About This Place</RouterLink>
      </aside>
    </section>
  </main>

  <main v-else class="public-section">
    <article class="public-card public-card-body empty-detail">
      <h1>Destination not found</h1>
      <p>The destination you are looking for is unavailable.</p>
      <RouterLink class="public-button" to="/destinations">Return to Destinations</RouterLink>
    </article>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { destinations } from '../publicData'
import { tourismImages } from '../../../data/tourismImages'

const route = useRoute()
const destination = computed(() =>
  destinations.find((item) => item.slug === route.params.slug),
)
</script>

<style scoped>
.detail-hero {
  text-align: left;
}

.detail-hero p {
  margin-left: 0;
}

.back-link {
  display: inline-flex;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 800;
  text-decoration: none;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 1.5rem;
  align-items: start;
}

.detail-main {
  display: grid;
  gap: 1.25rem;
}

.detail-image {
  width: 100%;
  height: clamp(280px, 42vw, 460px);
  display: block;
  object-fit: cover;
}

.amenity-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
  padding-left: 1.1rem;
}

.amenity-list li::marker {
  color: var(--primary-green);
}

.reminder-card {
  border: 1px solid rgba(23, 73, 51, 0.16);
  border-radius: 18px;
  padding: 1.5rem;
  background: var(--soft-green);
}

.reminder-card h2 {
  color: var(--primary-green);
}

.info-panel {
  position: sticky;
  top: 100px;
}

.info-panel dl {
  display: grid;
  gap: 1rem;
}

.info-panel dt {
  color: var(--primary-green);
  font-weight: 900;
}

.info-panel dd {
  margin: 0.25rem 0 0;
  color: var(--muted);
}

.empty-detail {
  text-align: center;
}

@media (max-width: 1000px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .info-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .amenity-list {
    grid-template-columns: 1fr;
  }
}
</style>
