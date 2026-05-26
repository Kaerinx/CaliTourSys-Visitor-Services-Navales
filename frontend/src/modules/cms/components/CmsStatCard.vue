<script setup>
import CmsIcon from './CmsIcon.vue'

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  detail: { type: String, default: '' },
  tone: { type: String, default: 'sky' },
  icon: { type: String, default: 'dashboard' },
})
</script>

<template>
  <article class="cms-stat-card" :data-tone="tone">
    <div class="cms-stat-card__icon"><CmsIcon :name="icon" /></div>
    <div class="cms-stat-card__body">
      <p>{{ label }}</p>
      <strong>{{ value ?? 0 }}</strong>
      <span v-if="detail">{{ detail }}</span>
    </div>
  </article>
</template>

<style scoped>
.cms-stat-card {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 116px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.cms-stat-card__icon {
  display: grid;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  place-items: center;
  color: #075985;
  border-radius: 8px;
  background: #e0f2fe;
}

.cms-stat-card__icon svg {
  width: 21px;
  height: 21px;
}

.cms-stat-card[data-tone='green'] .cms-stat-card__icon {
  background: #dcfce7;
  color: #15803d;
}

.cms-stat-card[data-tone='amber'] .cms-stat-card__icon {
  background: #fef3c7;
  color: #b45309;
}

.cms-stat-card[data-tone='indigo'] .cms-stat-card__icon {
  background: #e0e7ff;
  color: #4338ca;
}

.cms-stat-card__body {
  min-width: 0;
}

p,
span {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
}

strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 1.85rem;
  line-height: 1;
}

span {
  display: block;
  margin-top: 7px;
  font-size: 0.8rem;
}
</style>
