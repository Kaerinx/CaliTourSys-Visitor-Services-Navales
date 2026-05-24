<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  detail: { type: String, default: '' },
  tone: { type: String, default: 'sky' },
})
</script>

<template>
  <article class="cms-stat-card">
    <div class="cms-stat-card__icon" :data-tone="tone">{{ label.slice(0, 1) }}</div>
    <div>
      <p>{{ label }}</p>
      <strong>{{ value }}</strong>
      <span v-if="detail">{{ detail }}</span>
    </div>
  </article>
</template>

<style scoped>
.cms-stat-card {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 112px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.cms-stat-card__icon {
  display: grid;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 12px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 800;
}

.cms-stat-card__icon[data-tone='green'] {
  background: #dcfce7;
  color: #15803d;
}

.cms-stat-card__icon[data-tone='amber'] {
  background: #fef3c7;
  color: #b45309;
}

.cms-stat-card__icon[data-tone='indigo'] {
  background: #e0e7ff;
  color: #4338ca;
}

p,
span {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
}

strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 1.75rem;
  line-height: 1;
}

span {
  display: block;
  margin-top: 6px;
  font-size: 0.8rem;
}
</style>
