<template>
  <div class="dashboard-grid">
    <article v-for="card in cards" :key="card.label" class="stat-card">
      <strong>{{ card.label }}</strong>
      <b>{{ card.value ?? 0 }}</b>
      <span class="muted">{{ card.note }}</span>
    </article>
  </div>
</template>

<script setup>
defineProps({
  cards: { type: Array, required: true },
})
</script>
