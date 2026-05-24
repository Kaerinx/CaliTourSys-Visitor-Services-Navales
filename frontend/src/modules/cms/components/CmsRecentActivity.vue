<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="cms-activity" aria-labelledby="recent-activity-title">
    <div class="cms-activity__header">
      <h2 id="recent-activity-title">Recent Activity</h2>
    </div>

    <ul v-if="items.length" class="cms-activity__list">
      <li v-for="item in items" :key="item.id">
        <span class="cms-activity__dot" aria-hidden="true"></span>
        <span>
          <strong>{{ item.entityLabel || item.entityType || 'CMS activity' }}</strong>
          <small>{{ item.action }} · {{ formatDate(item.createdAt) }}</small>
        </span>
      </li>
    </ul>

    <div v-else class="cms-activity__empty">
      <strong>No recent activities</strong>
      <p>Audit events will appear here after CMS actions are performed.</p>
    </div>
  </section>
</template>

<script>
function formatDate(value) {
  if (!value) return 'No timestamp'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<style scoped>
.cms-activity {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}

.cms-activity__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
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
  gap: 10px;
  align-items: start;
}

.cms-activity__dot {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 999px;
  background: #0ea5e9;
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
  padding: 24px 0 4px;
}
</style>
