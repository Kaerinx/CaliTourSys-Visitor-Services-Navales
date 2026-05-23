<template>
  <ManagementLayout :nav="nav">
    <div class="dashboard-hero">
      <div>
        <span class="eyebrow">Administration Dashboard</span>
        <h1>Welcome to Calabanga Tourism, Admin User</h1>
        <p>Overview of visitor records, inquiries, and tourism activity.</p>
      </div>
      <div class="period-card">
        <span>Reporting Period</span>
        <strong>{{ reportingPeriod }}</strong>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="dashboard-card-grid">
      <article v-for="card in cards" :key="card.label" class="dashboard-stat-card">
        <div class="stat-icon" :data-tone="card.tone" aria-hidden="true">{{ card.icon }}</div>
        <span>{{ card.label }}</span>
        <strong>{{ card.value ?? 0 }}</strong>
        <small>{{ card.note }}</small>
      </article>
    </div>

    <form class="panel dashboard-filter-card" @submit.prevent="loadRecords">
      <div class="filter-title">
        <span class="filter-accent" aria-hidden="true"></span>
        <div>
          <h2>Filter Dashboard Records</h2>
          <p>Search and refine records shown in the dashboard sections.</p>
        </div>
      </div>

      <div class="dashboard-filter-grid">
        <div class="field search-field">
          <label>Search</label>
          <input v-model="filters.search" placeholder="Name, establishment, or keyword" />
        </div>
        <div class="field">
          <label>Date From</label>
          <input v-model="filters.date_from" type="date" />
        </div>
        <div class="field">
          <label>Date To</label>
          <input v-model="filters.date_to" type="date" />
        </div>
        <div class="field">
          <label>Source</label>
          <select v-model="filters.source_type">
            <option value="">All</option>
            <option value="resort">Resort</option>
            <option value="museum">Museum</option>
            <option value="tourism_office">Tourism Office</option>
          </select>
        </div>
        <div class="field">
          <label>Visitor Type</label>
          <select v-model="filters.visitor_type">
            <option value="">All</option>
            <option value="local">Local</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="filters.status">
            <option value="">All</option>
            <option value="recorded">Recorded</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div v-if="activeFilterChips.length" class="filter-chips" aria-label="Active filters">
        <button v-for="chip in activeFilterChips" :key="chip.key" type="button" @click="clearFilter(chip.key)">
          {{ chip.label }} ×
        </button>
      </div>

      <div class="filter-actions">
        <button class="reset-button" type="button" @click="resetFilters">Reset Filters</button>
        <button class="apply-button" type="submit">Apply Filters</button>
      </div>
    </form>

    <div class="dashboard-visual-grid">
      <section class="panel visual-card">
        <div class="visual-header">
          <div>
            <h2>Visitor Trend</h2>
            <p>Recorded visitor count by date</p>
          </div>
          <div class="range-control" aria-label="Trend range">
            <button
              v-for="range in ranges"
              :key="range"
              type="button"
              :class="{ active: activeRange === range }"
              @click="activeRange = range"
            >
              {{ range }}
            </button>
          </div>
        </div>
        <div v-if="trend.length" class="trend-bars">
          <div v-for="row in trend" :key="row.date" class="trend-item">
            <div class="trend-track">
              <span :style="{ height: trendHeight(row.total) }"></span>
            </div>
            <strong>{{ row.total }}</strong>
            <small>{{ shortDate(row.date) }}</small>
          </div>
        </div>
        <div v-else class="empty-state">No visitor trend data yet.</div>
      </section>

      <section class="panel visual-card">
        <div class="visual-header">
          <div>
            <h2>Visitor Classification</h2>
            <p>Distribution of recorded visitors by classification.</p>
          </div>
        </div>
        <div class="classification-list">
          <div v-for="item in classificationRows" :key="item.key" class="classification-item">
            <div>
              <strong>{{ item.label }}</strong>
              <span>{{ item.value }} records</span>
            </div>
            <div class="classification-meter">
              <span :style="{ width: item.percent + '%', background: item.color }"></span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="panel recent-records-card">
      <div class="visual-header">
        <div>
          <h2>Recent Visitor Records</h2>
          <p>Latest visitor records from the current dashboard filters.</p>
        </div>
        <span class="record-count">{{ recordCountText }}</span>
      </div>

      <div class="table-wrap">
        <table class="recent-records-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Visitor Type</th>
              <th>Source</th>
              <th>Establishment</th>
              <th>Visit Date</th>
              <th>Record Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in pagedRecords" :key="record.id">
              <td>{{ record.full_name }}</td>
              <td>{{ formatVisitorType(record.visitor_type) }}</td>
              <td>{{ formatSourceType(record.source_type) }}</td>
              <td>{{ record.establishment_name || '-' }}</td>
              <td>{{ formatDate(record.visit_date) }}</td>
              <td>
                <span class="record-badge" :class="recordStatusClass(record.status)">
                  {{ recordStatusLabel(record.status) }}
                </span>
              </td>
            </tr>
            <tr v-if="!pagedRecords.length">
              <td colspan="6">No visitor records found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-row">
        <span>{{ recordCountText }}</span>
        <div>
          <button type="button" :disabled="page === 1" @click="page -= 1">Previous</button>
          <button type="button" :disabled="page >= totalPages" @click="page += 1">Next</button>
        </div>
      </div>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import { visitorApi } from '../services/visitorApi'
import { adminNav } from './nav'
import { formatDate, formatSourceType, formatVisitorType } from '../utils/format'

const summary = ref({})
const records = ref([])
const error = ref('')
const nav = adminNav
const classification = ref({ local: 0, domestic: 0, international: 0 })
const trend = ref([])
const page = ref(1)
const pageSize = 10
const activeRange = ref('7 Days')
const ranges = ['Today', '7 Days', '30 Days', 'Custom']

const filters = reactive({
  search: '',
  date_from: '',
  date_to: '',
  source_type: '',
  visitor_type: '',
  status: '',
})

const reportingPeriod = computed(() => {
  if (filters.date_from || filters.date_to) {
    return `${filters.date_from || 'Start'} to ${filters.date_to || 'Today'}`
  }
  return formatDate(new Date())
})

const cards = computed(() => [
  {
    label: 'Total Visitors Recorded Today',
    value: summary.value.total_visitors_today,
    note: 'Recorded today',
    icon: 'V',
    tone: 'green',
  },
  { label: 'Local Visitors', value: summary.value.local_visitors, note: 'From local area', icon: 'L', tone: 'green' },
  {
    label: 'Domestic Tourists',
    value: summary.value.domestic_tourists,
    note: 'From other Philippine regions',
    icon: 'D',
    tone: 'navy',
  },
  {
    label: 'International Tourists',
    value: summary.value.international_tourists,
    note: 'From other countries',
    icon: 'I',
    tone: 'gray',
  },
  {
    label: 'Museum Records',
    value: summary.value.museum_visitors,
    note: 'Museum visits recorded today',
    icon: 'M',
    tone: 'green',
  },
  {
    label: 'Pending Inquiries',
    value: summary.value.pending_inquiries,
    note: 'For review via email',
    icon: '?',
    tone: 'amber',
  },
  {
    label: 'Total Destinations',
    value: summary.value.total_destinations,
    note: 'Active destination listings',
    icon: 'T',
    tone: 'green',
  },
  {
    label: 'Upcoming Events',
    value: summary.value.upcoming_events,
    note: 'Scheduled tourism activities',
    icon: 'E',
    tone: 'navy',
  },
])

const activeFilterChips = computed(() =>
  [
    filters.search && { key: 'search', label: `Search: ${filters.search}` },
    filters.date_from && { key: 'date_from', label: `From: ${filters.date_from}` },
    filters.date_to && { key: 'date_to', label: `To: ${filters.date_to}` },
    filters.source_type && { key: 'source_type', label: `Source: ${formatSourceType(filters.source_type)}` },
    filters.visitor_type && { key: 'visitor_type', label: `Type: ${formatVisitorType(filters.visitor_type)}` },
    filters.status && { key: 'status', label: `Status: ${recordStatusLabel(filters.status)}` },
  ].filter(Boolean)
)

const filteredRecords = computed(() => {
  const keyword = filters.search.trim().toLowerCase()
  return records.value.filter((record) => {
    const text = [record.full_name, record.establishment_name, record.source_type, record.visitor_type]
      .join(' ')
      .toLowerCase()
    const statusMatches = !filters.status || recordStatusKey(record.status) === filters.status
    return (!keyword || text.includes(keyword)) && statusMatches
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / pageSize)))
const pagedRecords = computed(() => filteredRecords.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const recordCountText = computed(() => {
  if (!filteredRecords.value.length) return 'Showing 0 of 0 records'
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, filteredRecords.value.length)
  return `Showing ${start}-${end} of ${filteredRecords.value.length} records`
})

const classificationRows = computed(() => {
  const total =
    Number(classification.value.local || 0) +
    Number(classification.value.domestic || 0) +
    Number(classification.value.international || 0)
  return [
    { key: 'local', label: 'Local', value: Number(classification.value.local || 0), color: '#166534' },
    { key: 'domestic', label: 'Domestic', value: Number(classification.value.domestic || 0), color: '#020617' },
    { key: 'international', label: 'International', value: Number(classification.value.international || 0), color: '#0f766e' },
  ].map((item) => ({ ...item, percent: total ? Math.round((item.value / total) * 100) : 0 }))
})

async function loadRecords() {
  error.value = ''
  page.value = 1
  try {
    const requestFilters = {
      date_from: filters.date_from,
      date_to: filters.date_to,
      source_type: filters.source_type,
      visitor_type: filters.visitor_type,
      status: filters.status && filters.status !== 'recorded' ? filters.status : '',
    }
    records.value = await visitorApi.visitors(requestFilters)
    classification.value = await visitorApi.classification(requestFilters)
    trend.value = await visitorApi.visitorTrend(requestFilters)
  } catch (err) {
    error.value = err.message
  }
}

async function loadDashboard() {
  try {
    summary.value = await visitorApi.dashboardSummary()
    await loadRecords()
  } catch (err) {
    error.value = err.message
  }
}

function resetFilters() {
  Object.assign(filters, { search: '', date_from: '', date_to: '', source_type: '', visitor_type: '', status: '' })
  loadRecords()
}

function clearFilter(key) {
  filters[key] = ''
  loadRecords()
}

function recordStatusKey(status) {
  if (status === 'archived' || status === 'cancelled') return 'archived'
  if (status === 'verified') return 'verified'
  if (status === 'pending') return 'pending'
  return 'recorded'
}

function recordStatusLabel(status) {
  const key = recordStatusKey(status)
  if (key === 'verified') return 'Verified'
  if (key === 'pending') return 'Pending Review'
  if (key === 'archived') return 'Archived'
  return 'Recorded'
}

function recordStatusClass(status) {
  return `status-${recordStatusKey(status)}`
}

function trendHeight(total) {
  const max = Math.max(...trend.value.map((row) => Number(row.total || 0)), 1)
  return `${Math.max(12, (Number(total || 0) / max) * 150)}px`
}

function shortDate(value) {
  return String(value || '').slice(5, 10) || '-'
}

onMounted(loadDashboard)
</script>

<style scoped>
.dashboard-hero {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
  border: 1px solid #e5e7eb;
  border-top: 4px solid #166534;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 55%, #f0fdf4 100%);
  padding: 1.4rem 1.6rem;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 0.45rem;
  color: #166534;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dashboard-hero h1 {
  margin: 0 0 0.45rem;
  font-size: clamp(1.8rem, 3vw, 2.35rem);
}

.dashboard-hero p {
  margin: 0;
  color: #475569;
}

.period-card {
  min-width: 210px;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: #fff;
  padding: 0.9rem 1rem;
}

.period-card span {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
}

.period-card strong {
  display: block;
  margin-top: 0.25rem;
  color: #166534;
}

.dashboard-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.dashboard-stat-card {
  min-height: 150px;
  display: grid;
  gap: 0.45rem;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #166534;
  border-radius: 12px;
  background: #fff;
  padding: 1.15rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.dashboard-stat-card:hover {
  border-color: #bbf7d0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.stat-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  font-weight: 900;
}

.stat-icon[data-tone='green'] {
  background: #dcfce7;
  color: #166534;
}

.stat-icon[data-tone='navy'] {
  background: #e2e8f0;
  color: #020617;
}

.stat-icon[data-tone='gray'] {
  background: #f1f5f9;
  color: #475569;
}

.stat-icon[data-tone='amber'] {
  background: #fef3c7;
  color: #92400e;
}

.dashboard-stat-card span {
  color: #020617;
  font-weight: 800;
}

.dashboard-stat-card strong {
  font-size: 2rem;
  line-height: 1;
}

.dashboard-stat-card small {
  color: #64748b;
}

.dashboard-filter-card {
  display: grid;
  gap: 1.1rem;
}

.filter-title {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.filter-accent {
  width: 10px;
  height: 38px;
  border-radius: 999px;
  background: #166534;
  box-shadow: 0 0 0 6px #dcfce7;
  margin-top: 0.25rem;
}

.filter-title h2,
.visual-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.filter-title p,
.visual-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.dashboard-filter-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(5, minmax(150px, 1fr));
  gap: 1rem;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.apply-button,
.reset-button,
.range-control button,
.pagination-row button {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 1rem;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.apply-button {
  border: 0;
  background: #020617;
  color: #fff;
}

.apply-button:hover {
  background: #0f3625;
}

.reset-button,
.pagination-row button {
  border: 1px solid #bbf7d0;
  background: #fff;
  color: #166534;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chips button {
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: #dcfce7;
  color: #166534;
  font-weight: 800;
  cursor: pointer;
}

.dashboard-visual-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
  gap: 1.25rem;
}

.visual-card,
.recent-records-card {
  border-top: 3px solid #bbf7d0;
}

.visual-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.range-control {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.range-control button {
  min-height: 34px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #334155;
  padding: 0 0.7rem;
}

.range-control button.active {
  border-color: #166534;
  background: #dcfce7;
  color: #166534;
}

.trend-bars {
  min-height: 220px;
  display: flex;
  align-items: end;
  gap: 1rem;
  border-left: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  padding: 1rem 1rem 0.75rem;
}

.trend-item {
  flex: 1;
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  min-width: 42px;
}

.trend-track {
  height: 160px;
  display: flex;
  align-items: end;
}

.trend-track span {
  width: 22px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(180deg, #16a34a, #166534);
}

.trend-item strong {
  color: #166534;
}

.trend-item small {
  color: #64748b;
  font-size: 0.78rem;
}

.classification-list {
  display: grid;
  gap: 1rem;
}

.classification-item {
  display: grid;
  gap: 0.45rem;
}

.classification-item > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.classification-item span {
  color: #64748b;
}

.classification-meter {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.classification-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.record-count {
  align-self: start;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: #dcfce7;
  color: #166534;
  font-weight: 800;
}

.recent-records-table th {
  background: #f1f5f9;
  color: #334155;
}

.recent-records-table tbody tr:hover {
  background: rgba(23, 73, 51, 0.04);
}

.record-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border-radius: 999px;
  padding: 0 0.75rem;
  font-weight: 800;
}

.status-recorded {
  background: #dcfce7;
  color: #166534;
}

.status-verified {
  background: #020617;
  color: #fff;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-archived {
  background: #e5e7eb;
  color: #475569;
}

.pagination-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  color: #475569;
}

.pagination-row div {
  display: flex;
  gap: 0.5rem;
}

.pagination-row button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 1200px) {
  .dashboard-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-visual-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-hero,
  .visual-header,
  .pagination-row {
    display: grid;
  }

  .dashboard-card-grid,
  .dashboard-filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
