<template>
  <main>
    <section class="public-hero">
      <div>
        <h1>Explore Calabanga Tourism</h1>
        <p>Discover local destinations, resorts, cultural sites, events, and visitor services in Calabanga</p>
        <div class="public-actions">
          <RouterLink class="public-button" to="/destinations">Explore Destinations</RouterLink>
          <RouterLink class="public-button secondary" to="/inquiries">Submit Inquiry</RouterLink>
        </div>
      </div>
    </section>

    <section class="public-section">
      <div class="section-title">
        <h2>Featured Destinations</h2>
        <p>Explore the best tourist spots and attractions in Calabanga</p>
      </div>

      <div class="public-grid">
        <article v-for="destination in destinations" :key="destination.name" class="public-card">
          <div class="image-placeholder">Destination Image</div>
          <div class="public-card-body">
            <h3>{{ destination.name }}</h3>
            <p>{{ destination.address }}</p>
            <p>{{ destination.description }}</p>
            <RouterLink to="/destinations">View Details</RouterLink>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
const destinations = [
  {
    name: 'Calabanga Eco-Park and Resort',
    address: 'Barangay San Antonio, Calabanga',
    description: 'A beautiful eco-park featuring natural springs, swimming pools, and lush gardens.',
  },
  {
    name: 'Calabanga Municipal Museum',
    address: 'Calabanga Town Center',
    description: 'Showcases the rich history and cultural heritage of Calabanga.',
  },
  {
    name: 'Mangrove Eco-Tourism Park',
    address: 'Barangay Sabang, Calabanga',
    description: 'A protected mangrove forest with boardwalks for nature walks and education.',
  },
]
</script>
