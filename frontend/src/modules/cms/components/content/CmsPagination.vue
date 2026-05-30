<script setup>
const props = defineProps({
  pagination: {
    type: Object,
    default: () => ({
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    }),
  },
})

defineEmits(['page-change'])
</script>

<template>
  <nav class="cms-pagination" aria-label="CMS pagination">
    <span>
      Page {{ props.pagination.page || 1 }} of {{ props.pagination.totalPages || 1 }}
      <small>{{ props.pagination.totalItems || 0 }} records</small>
    </span>
    <div>
      <button
        type="button"
        :disabled="!props.pagination.hasPreviousPage"
        @click="$emit('page-change', props.pagination.page - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        :disabled="!props.pagination.hasNextPage"
        @click="$emit('page-change', props.pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </nav>
</template>

<style scoped>
.cms-pagination {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

span,
small {
  display: block;
}

span {
  color: #0f172a;
  font-weight: 800;
}

small {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 500;
}

div {
  display: flex;
  gap: 8px;
}

button {
  min-height: 38px;
  padding: 0 12px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font: inherit;
  font-weight: 800;
}

button:disabled {
  cursor: default;
  opacity: 0.45;
}

button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .cms-pagination {
    align-items: stretch;
    flex-direction: column;
  }

  div,
  button {
    width: 100%;
  }

  button {
    justify-content: center;
  }
}
</style>
