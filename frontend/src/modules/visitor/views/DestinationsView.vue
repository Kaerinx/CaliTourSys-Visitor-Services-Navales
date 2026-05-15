<template>
  <main class="public-section">
    <div class="section-title">
      <h1>Discover Calabanga</h1>
      <p>Explore our beautiful tourist destinations, resorts, cultural sites, and natural attractions</p>
    </div>

    <div class="public-grid">
      <article v-for="destination in destinations" :key="destination.name" class="public-card">
        <div class="image-placeholder">Destination Image</div>
        <div class="public-card-body">
          <h3>{{ destination.name }}</h3>
          <p>{{ destination.type }} · {{ destination.address }}</p>
          <p>{{ destination.description }}</p>
          <strong>{{ destination.fee }}</strong>
        </div>
      </article>
    </div>
  </main>
</template>

<script setup>
const destinations = [
  {
    name: 'Calabanga Eco-Park and Resort',
    type: 'Resort',
    address: 'Barangay San Antonio, Calabanga',
    fee: 'PHP 50 per person',
    description: 'A beautiful eco-park featuring natural springs, swimming pools, and lush gardens.',
  },
  {
    name: 'Calabanga Municipal Museum',
    type: 'Cultural Site',
    address: 'Calabanga Town Center',
    fee: 'Free admission',
    description: 'Showcases the rich history and cultural heritage of Calabanga.',
  },
  {
    name: 'Mangrove Eco-Tourism Park',
    type: 'Nature',
    address: 'Barangay Sabang, Calabanga',
    fee: 'PHP 30 per person',
    description: 'A protected mangrove forest with boardwalks for nature walks and education.',
  },
]
</script>
