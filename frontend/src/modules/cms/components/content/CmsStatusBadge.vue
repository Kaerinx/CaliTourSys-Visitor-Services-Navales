<script setup>
defineProps({
  status: {
    type: String,
    default: 'draft',
  },
})
</script>

<template>
  <span class="cms-status-badge" :data-status="status">
    {{ status || 'draft' }}
  </span>
</template>

<style scoped>
.cms-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: capitalize;
}

.cms-status-badge[data-status='published'],
.cms-status-badge[data-status='active'] {
  color: #0f766e;
  border-color: #99f6e4;
  background: #ccfbf1;
}

.cms-status-badge[data-status='draft'],
.cms-status-badge[data-status='inactive'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.cms-status-badge[data-status='archived'] {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}
</style>
