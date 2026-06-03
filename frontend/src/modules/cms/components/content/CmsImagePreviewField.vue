<script setup>
defineProps({
  label: { type: String, default: 'Visual preview' },
  color: { type: String, default: '#0f766e' },
})
</script>

<template>
  <div class="cms-image-preview-field">
    <span>{{ label }}</span>
    <div :style="{ '--preview-color': color || '#0f766e' }"></div>
  </div>
</template>

<style scoped>
.cms-image-preview-field {
  display: grid;
  gap: 8px;
  margin-inline: 20px;
}

span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

div {
  min-height: 96px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background:
    radial-gradient(circle at 24% 24%, rgba(255, 255, 255, 0.32), transparent 34%),
    linear-gradient(135deg, var(--preview-color), color-mix(in srgb, var(--preview-color) 62%, white));
}
</style>
