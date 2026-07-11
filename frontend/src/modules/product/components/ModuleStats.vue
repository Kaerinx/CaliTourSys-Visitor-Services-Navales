<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="module-stats">
    <article v-for="item in items" :key="item.label">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </div>
</template>

<style scoped>
.module-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.module-stats article {
  display: grid;
  gap: 6px;
  border: 1px solid var(--color-line);
  border-radius: 18px;
  padding: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.module-stats span {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.module-stats strong {
  font-size: 24px;
}

@media (max-width: 1200px) {
  .module-stats {
    grid-template-columns: 1fr;
  }
}
</style>
