<template>
  <ManagementLayout>
    <header class="staff-dashboard-header">
      <div>
        <span class="eyebrow">Tourism Staff</span>
        <h1>Visitor Services</h1>
        <p>Overview of visitor records, inquiries, source activity, and reports.</p>
      </div>
      <span class="period-badge">Today</span>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section class="staff-card-grid">
      <article v-for="card in cards" :key="card.label" class="staff-stat-card">
        <span class="card-accent" aria-hidden="true"></span>
        <strong>{{ card.label }}</strong>
        <b>{{ card.value ?? 0 }}</b>
        <small>{{ card.note }}</small>
      </article>
    </section>

    <section class="dashboard-section-grid">
      <article class="panel classification-panel">
        <div class="section-header">
          <div>
            <h2>Visitor Classification</h2>
            <p>Distribution of recorded visitors by classification.</p>
          </div>
        </div>

        <div class="classification-list">
          <div v-for="item in classificationItems" :key="item.key" class="classification-row">
            <div class="classification-meta">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="classification-bar">
              <span :class="item.key" :style="{ width: classificationWidth(item.key) }"></span>
            </div>
          </div>
        </div>
      </article>

      <article class="panel trend-panel">
        <div class="section-header">
          <div>
            <h2>Visitor Trend</h2>
            <p>Recorded visitor count by date.</p>
          </div>
        </div>

        <table class="trend-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Visitors</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in trend" :key="row.date">
              <td>{{ row.date }}</td>
              <td><span class="total-pill">{{ row.total }}</span></td>
            </tr>
            <tr v-if="!trend.length">
              <td colspan="2">No trend data available.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <section class="panel records-panel">
      <div class="section-header">
        <div>
          <h2>Recent Visitor Records</h2>
          <p>Latest recorded visitor data for monitoring.</p>
        </div>
        <span class="record-count">Showing {{ recentRecords.length }} of {{ records.length }} records</span>
      </div>
      <VisitorTable :records="recentRecords" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { visitorApi } from '../services/visitorApi'

const summary = ref({})
const records = ref([])
const trend = ref([])
const classification = ref({ local: 0, domestic: 0, international: 0 })
const error = ref('')

const cards = computed(() => [
  {
    label: 'Total Visitors Recorded Today',
    value: summary.value.total_visitors_today,
    note: 'Recorded today',
  },
  { label: 'Local Visitors', value: summary.value.local_visitors, note: 'From local area' },
  {
    label: 'Domestic Tourists',
    value: summary.value.domestic_tourists,
    note: 'From other Philippine regions',
  },
  {
    label: 'International Tourists',
    value: summary.value.international_tourists,
    note: 'From other countries',
  },
  { label: 'Museum Records', value: summary.value.museum_visitors, note: 'Museum visits recorded today' },
  { label: 'Pending Inquiries', value: summary.value.pending_inquiries, note: 'For review via email' },
  { label: 'Reports Available', value: 3, note: 'Summary, trend, classification' },
  { label: 'Active Destinations', value: summary.value.total_destinations, note: 'Active destination listings' },
])

const recentRecords = computed(() => records.value.slice(0, 5))

const classificationItems = computed(() => [
  { key: 'local', label: 'Local', value: Number(classification.value.local || 0) },
  { key: 'domestic', label: 'Domestic', value: Number(classification.value.domestic || 0) },
  { key: 'international', label: 'International', value: Number(classification.value.international || 0) },
])

const maxClassification = computed(() => Math.max(1, ...classificationItems.value.map((item) => item.value)))

function classificationWidth(key) {
  const item = classificationItems.value.find((entry) => entry.key === key)
  return `${Math.max(6, ((item?.value || 0) / maxClassification.value) * 100)}%`
}

onMounted(async () => {
  try {
    const [dashboardSummary, visitorRows, classificationRows, trendRows] = await Promise.all([
      visitorApi.dashboardSummary(),
      visitorApi.visitors(),
      visitorApi.classification(),
      visitorApi.visitorTrend(),
    ])
    summary.value = dashboardSummary
    records.value = visitorRows
    classification.value = classificationRows
    trend.value = trendRows
  } catch (err) {
    error.value = err.message
  }
})
</script>

<style scoped>
.staff-dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 0.45rem;
  color: #166534;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.staff-dashboard-header h1 {
  margin: 0 0 0.35rem;
  color: #020617;
}

.staff-dashboard-header p,
.section-header p {
  margin: 0;
  color: #475569;
  font-weight: 400;
}

.period-badge,
.record-count {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 0 0.8rem;
  background: #dcfce7;
  color: #166534;
  font-size: 0.85rem;
  font-weight: 800;
}

.staff-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 1rem;
}

.staff-stat-card {
  position: relative;
  display: grid;
  gap: 0.55rem;
  min-height: 148px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 1.3rem 1.35rem;
  overflow: hidden;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.staff-stat-card:hover {
  border-color: #bbf7d0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.card-accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: #166534;
}

.staff-stat-card strong {
  color: #020617;
  font-size: 0.98rem;
}

.staff-stat-card b {
  color: #020617;
  font-size: 2rem;
  line-height: 1;
}

.staff-stat-card small {
  color: #475569;
  font-weight: 400;
}

.dashboard-section-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.section-header h2 {
  margin: 0 0 0.25rem;
}

.classification-list {
  display: grid;
  gap: 1rem;
}

.classification-row {
  display: grid;
  gap: 0.45rem;
}

.classification-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #334155;
}

.classification-bar {
  height: 10px;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: hidden;
}

.classification-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.classification-bar .local {
  background: #166534;
}

.classification-bar .domestic {
  background: #0f3625;
}

.classification-bar .international {
  background: #0f766e;
}

.trend-table {
  min-width: 100%;
}

.trend-table th {
  background: #f1f5f9;
  color: #334155;
}

.trend-table tbody tr:hover {
  background: rgba(23, 73, 51, 0.04);
}

.total-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border-radius: 999px;
  padding: 0 0.7rem;
  background: #dcfce7;
  color: #166534;
  font-weight: 800;
}

.records-panel {
  margin-top: 1.25rem;
}

@media (max-width: 1180px) {
  .staff-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 780px) {
  .staff-dashboard-header,
  .dashboard-section-grid,
  .section-header {
    display: grid;
  }

  .staff-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
