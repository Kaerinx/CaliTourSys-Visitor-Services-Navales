<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  path: { type: String, default: '' },
  tone: { type: String, default: 'sky' },
})
</script>

<template>
  <RouterLink class="cms-quick-card" :to="path || '/cms/dashboard'">
    <span class="cms-quick-card__icon" :data-tone="tone">{{ title.slice(0, 1) }}</span>
    <span>
      <strong>{{ title }}</strong>
      <small>{{ description }}</small>
    </span>
    <span aria-hidden="true" class="cms-quick-card__arrow">→</span>
  </RouterLink>
</template>

<style scoped>
.cms-quick-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  color: inherit;
  text-decoration: none;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.cms-quick-card:hover,
.cms-quick-card:focus-visible {
  border-color: #7dd3fc;
  box-shadow: 0 12px 28px rgba(14, 165, 233, 0.12);
  outline: none;
}

.cms-quick-card__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 800;
}

.cms-quick-card__icon[data-tone='green'] {
  background: #dcfce7;
  color: #15803d;
}

.cms-quick-card__icon[data-tone='amber'] {
  background: #fef3c7;
  color: #b45309;
}

.cms-quick-card__icon[data-tone='indigo'] {
  background: #e0e7ff;
  color: #4338ca;
}

strong,
small {
  display: block;
}

strong {
  color: #0f172a;
  font-size: 0.96rem;
}

small {
  margin-top: 3px;
  color: #64748b;
  line-height: 1.4;
}

.cms-quick-card__arrow {
  color: #0284c7;
  font-weight: 800;
}
</style>
