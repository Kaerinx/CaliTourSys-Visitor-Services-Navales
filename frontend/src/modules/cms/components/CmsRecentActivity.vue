<script setup>
import CmsIcon from './CmsIcon.vue'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

function formatDate(value) {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <section class="cms-activity" aria-labelledby="recent-activity-title">
    <div class="cms-activity__header">
      <div>
        <h2 id="recent-activity-title">Recent Activity</h2>
        <p>Latest audit events from staff actions.</p>
      </div>
      <span v-if="items.length">{{ items.length }}</span>
    </div>

    <ul v-if="items.length" class="cms-activity__list">
      <li v-for="item in items" :key="item.id || `${item.entityType}-${item.createdAt}`">
        <span class="cms-activity__dot" aria-hidden="true"><CmsIcon name="audit" /></span>
        <span>
          <strong>{{ item.entityLabel || item.entityType || 'CMS activity' }}</strong>
          <small>{{ item.action || 'Updated' }} / {{ formatDate(item.createdAt) }}</small>
        </span>
      </li>
    </ul>

    <div v-else class="cms-activity__empty">
      <CmsIcon name="empty" />
      <strong>No recent activity</strong>
      <p>Audit events will appear here after CMS actions are performed.</p>
    </div>
  </section>
</template>

<style scoped>
.cms-activity {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.cms-activity__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

h2,
p {
  margin: 0;
}

h2 {
  color: #0f172a;
  font-size: 1.05rem;
}

.cms-activity__header p {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.86rem;
}

.cms-activity__header > span {
  display: grid;
  min-width: 32px;
  height: 28px;
  place-items: center;
  color: #0369a1;
  border-radius: 999px;
  background: #e0f2fe;
  font-size: 0.82rem;
  font-weight: 900;
}

.cms-activity__list {
  display: grid;
  gap: 14px;
  padding: 0;
  margin: 18px 0 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  align-items: start;
}

.cms-activity__dot {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: #0f766e;
  border-radius: 999px;
  background: #ccfbf1;
}

.cms-activity__dot svg {
  width: 15px;
  height: 15px;
}

strong,
small,
p {
  display: block;
}

strong {
  color: #0f172a;
}

small,
p {
  margin: 3px 0 0;
  color: #64748b;
  line-height: 1.45;
}

.cms-activity__empty {
  display: grid;
  gap: 8px;
  place-items: center;
  min-height: 176px;
  padding: 22px 10px;
  text-align: center;
}

.cms-activity__empty svg {
  width: 34px;
  height: 34px;
  color: #94a3b8;
}
</style>
