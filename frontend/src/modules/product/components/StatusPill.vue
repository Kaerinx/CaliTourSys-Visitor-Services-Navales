<script setup>
defineProps({
  status: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <span class="status-pill" :class="{ archived: status === 'Archived' }">
    {{ status }}
  </span>
</template>

<style scoped>
.status-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 7px 10px;
  background: #e5f3ee;
  color: var(--color-primary-dark);
  font-size: 12px;
  font-weight: 900;
}

.status-pill.archived {
  background: #f1f3f2;
  color: var(--color-muted);
}
</style>
