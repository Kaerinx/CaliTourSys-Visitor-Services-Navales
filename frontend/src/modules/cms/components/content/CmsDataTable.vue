<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CmsIcon from '../CmsIcon.vue'

const route = useRoute()
const props = defineProps({
  columns: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  emptyTitle: { type: String, default: 'No records found' },
  emptyText: { type: String, default: 'Try changing filters or create a new record.' },
})

defineEmits(['retry'])

const isSessionError = computed(() => /session expired|sign in again/i.test(props.error))
const retryLabel = computed(() => (isSessionError.value ? 'Sign in again' : 'Try again'))
const signInRoute = computed(() => ({
  name: 'cms-login',
  query: { redirect: route.fullPath, sessionExpired: '1' },
}))
</script>

<template>
  <section class="cms-data-table">
    <div v-if="loading" class="cms-data-table__state" aria-live="polite" aria-busy="true">
      <div v-for="index in 6" :key="index" class="cms-data-table__skeleton"></div>
    </div>

    <div v-else-if="error" class="cms-data-table__state cms-data-table__state--error" role="alert">
      <CmsIcon name="alert" />
      <strong>Unable to load records</strong>
      <p>{{ error }}</p>
      <RouterLink v-if="isSessionError" :to="signInRoute">{{ retryLabel }}</RouterLink>
      <button v-else type="button" @click="$emit('retry')">{{ retryLabel }}</button>
    </div>

    <div v-else-if="!items.length" class="cms-data-table__state">
      <CmsIcon name="empty" />
      <strong>{{ emptyTitle }}</strong>
      <p>{{ emptyText }}</p>
    </div>

    <template v-else>
      <div class="cms-data-table__desktop">
        <table>
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key" :class="column.class">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <slot name="rows" :items="items" />
          </tbody>
        </table>
      </div>

      <div class="cms-data-table__mobile">
        <slot name="cards" :items="items" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.cms-data-table {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.cms-data-table__desktop {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
:deep(td) {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

th {
  color: #475569;
  background: #f8fafc;
  font-size: 0.78rem;
  font-weight: 900;
}

:deep(td) {
  color: #334155;
  font-size: 0.9rem;
}

:deep(tr:last-child td) {
  border-bottom: 0;
}

:deep(.cms-table-title) {
  display: grid;
  gap: 3px;
}

:deep(.cms-table-title strong) {
  color: #0f172a;
}

:deep(.cms-table-title span) {
  color: #64748b;
  font-size: 0.8rem;
}

:deep(.cms-table-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

:deep(.cms-table-actions button) {
  min-height: 34px;
  padding: 0 10px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
}

:deep(.cms-table-actions button:hover),
:deep(.cms-table-actions button:focus-visible) {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

:deep(.cms-table-actions .is-danger) {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.cms-data-table__state {
  display: grid;
  gap: 10px;
  place-items: center;
  min-height: 260px;
  padding: 32px;
  color: #64748b;
  text-align: center;
}

.cms-data-table__state svg {
  width: 36px;
  height: 36px;
  color: #94a3b8;
}

.cms-data-table__state strong {
  color: #0f172a;
}

.cms-data-table__state p {
  max-width: 520px;
  margin: 0;
  line-height: 1.5;
}

.cms-data-table__state button,
.cms-data-table__state a {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font-weight: 800;
  text-decoration: none;
}

.cms-data-table__state--error {
  color: #991b1b;
}

.cms-data-table__state--error svg {
  color: #dc2626;
}

.cms-data-table__skeleton {
  width: 100%;
  height: 54px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 40%, #eef2f7 65%);
  background-size: 220% 100%;
  animation: cms-table-skeleton 1.1s ease-in-out infinite;
}

.cms-data-table__mobile {
  display: none;
}

@keyframes cms-table-skeleton {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 720px) {
  .cms-data-table__desktop {
    display: none;
  }

  .cms-data-table__mobile {
    display: grid;
    gap: 12px;
    padding: 12px;
  }

  :deep(.cms-mobile-card) {
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
  }

  :deep(.cms-mobile-card__actions) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
