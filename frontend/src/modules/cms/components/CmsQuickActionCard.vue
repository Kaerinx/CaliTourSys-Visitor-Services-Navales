<script setup>
import CmsIcon from './CmsIcon.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  path: { type: String, default: '' },
  tone: { type: String, default: 'sky' },
  icon: { type: String, default: 'dashboard' },
})
</script>

<template>
  <RouterLink class="cms-quick-card" :data-tone="tone" :to="path || '/cms/dashboard'">
    <span class="cms-quick-card__icon"><CmsIcon :name="icon" /></span>
    <span class="cms-quick-card__copy">
      <strong>{{ title }}</strong>
      <small>{{ description }}</small>
    </span>
    <span aria-hidden="true" class="cms-quick-card__arrow"><CmsIcon name="arrowRight" /></span>
  </RouterLink>
</template>

<style scoped>
.cms-quick-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  min-height: 96px;
  padding: 16px;
  color: inherit;
  text-decoration: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.cms-quick-card:hover,
.cms-quick-card:focus-visible {
  border-color: #7dd3fc;
  box-shadow: 0 12px 28px rgba(14, 165, 233, 0.12);
  outline: none;
  transform: translateY(-1px);
}

.cms-quick-card__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
  background: #e0f2fe;
  color: #0369a1;
}

.cms-quick-card__icon svg,
.cms-quick-card__arrow svg {
  width: 19px;
  height: 19px;
}

.cms-quick-card[data-tone='green'] .cms-quick-card__icon {
  background: #dcfce7;
  color: #15803d;
}

.cms-quick-card[data-tone='amber'] .cms-quick-card__icon {
  background: #fef3c7;
  color: #b45309;
}

.cms-quick-card[data-tone='indigo'] .cms-quick-card__icon {
  background: #e0e7ff;
  color: #4338ca;
}

.cms-quick-card__copy {
  min-width: 0;
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
  margin-top: 4px;
  color: #64748b;
  line-height: 1.42;
}

.cms-quick-card__arrow {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: #0284c7;
  border-radius: 999px;
  background: #f0f9ff;
}

@media (max-width: 520px) {
  .cms-quick-card {
    grid-template-columns: auto 1fr;
  }

  .cms-quick-card__arrow {
    display: none;
  }
}
</style>
