<template>
  <main>
    <section
      class="page-hero photo-hero"
      :style="{ '--hero-image': `url(${tourismImages.destinationsCover})` }"
    >
      <span class="hero-kicker">Destinations</span>
      <h1>Discover Calabanga</h1>
      <p>Explore resorts, cultural sites, and natural attractions across Calabanga.</p>
    </section>

    <section class="public-section">
      <div class="destination-filter" aria-label="Destination categories">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <div class="public-grid">
        <article v-for="destination in filteredDestinations" :key="destination.slug" class="public-card">
          <div class="card-image-frame">
            <img
              class="destination-image"
              :src="destination.image"
              :alt="destination.imageAlt"
              loading="lazy"
            />
          </div>
          <div class="public-card-body destination-card">
            <div class="card-topline">
              <span class="pill">{{ destination.type }}</span>
              <span class="pill">{{ destination.tag }}</span>
            </div>
            <h3>{{ destination.name }}</h3>
            <p class="address">{{ destination.address }}</p>
            <p>{{ destination.description }}</p>
            <div class="card-footer">
              <strong>{{ destination.fee }}</strong>
              <RouterLink :to="`/destinations/${destination.slug}`">View Details</RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { destinations } from '../publicData'
import { tourismImages } from '../../../data/tourismImages'

const categories = ['All', 'Resort', 'Cultural Site', 'Nature Destination']
const activeCategory = ref('All')

const filteredDestinations = computed(() => {
  if (activeCategory.value === 'All') return destinations
  return destinations.filter((destination) => destination.type === activeCategory.value)
})
</script>

<style scoped>
.destination-filter {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.destination-filter button {
  border: 1px solid rgba(23, 73, 51, 0.16);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: #fff;
  color: #334155;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.destination-filter button:hover,
.destination-filter button.active {
  background: var(--primary-green);
  color: #fff;
}

.destination-card {
  display: grid;
  gap: 0.75rem;
}

.card-topline,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.address {
  color: var(--primary-green) !important;
  font-weight: 750;
}

.card-footer strong {
  color: var(--primary-green);
}

.card-footer a {
  color: var(--primary-green);
  font-weight: 850;
  text-decoration: none;
}
</style>
