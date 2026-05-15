<template>
  <main class="public-section">
    <div class="section-title">
      <h1>Events & Activities</h1>
      <p>Join us in celebrating Calabanga's culture, community, and traditions through various events and activities</p>
    </div>

    <h2>Upcoming Events</h2>
    <div class="public-grid">
      <article v-for="event in events" :key="event.name" class="public-card public-card-body">
        <small>Upcoming</small>
        <h3>{{ event.name }}</h3>
        <p>{{ event.category }}</p>
        <p>{{ event.date }} · {{ event.time }}</p>
        <p>{{ event.location }}</p>
        <p>{{ event.description }}</p>
      </article>
    </div>
  </main>
</template>

<script setup>
const events = [
  {
    name: 'Calabanga Town Fiesta',
    category: 'Cultural Festival',
    date: 'June 24, 2026',
    time: '08:00 - 22:00',
    location: 'Calabanga Town Plaza',
    description: 'Annual town celebration featuring cultural shows, trade fair, and community activities.',
  },
  {
    name: 'Mangrove Planting Activity',
    category: 'Environmental',
    date: 'June 08, 2026',
    time: '07:00 - 11:00',
    location: 'Mangrove Eco-Tourism Park, Sabang',
    description: 'Community-based environmental activity promoting coastal conservation.',
  },
  {
    name: 'Farm Tourism Caravan',
    category: 'Agri-Tourism',
    date: 'May 20, 2026',
    time: '09:00 - 15:00',
    location: 'Various Farm Destinations',
    description: 'Guided tour of local farms showcasing agricultural products and opportunities.',
  },
]
</script>
