<template>
  <article class="card stat-card">
    <div>
      <p class="muted">{{ title }}</p>
      <strong>{{ value }}</strong>
      <small v-if="trend" :class="trendClass">{{ trend }}</small>
    </div>
    <div class="stat-icon" :class="color">{{ icon }}</div>
  </article>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: "*" },
  color: { type: String, default: "blue" },
  trend: { type: String, default: "" },
  trendClass: { type: String, default: "muted" },
});
</script>
