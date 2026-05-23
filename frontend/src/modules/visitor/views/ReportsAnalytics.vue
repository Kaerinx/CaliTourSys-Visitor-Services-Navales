<template>
  <ManagementLayout>
    <div class="reports-heading">
      <div>
        <h1>Reports and Analytics</h1>
        <p class="muted">Visitor summary, trend, classification, and CSV export.</p>
      </div>
      <button class="export-button" type="button" @click="exportCsv">Export CSV</button>
    </div>

    <form class="panel report-filter-card" @submit.prevent="load">
      <div class="filter-card-header">
        <span class="section-accent" aria-hidden="true"></span>
        <div>
          <h2>Filter Report Data</h2>
          <p>Refine report totals using date, source, and visitor classification.</p>
        </div>
      </div>

      <div class="report-filter-grid">
        <div class="field">
          <label>Date From</label>
          <input v-model="filters.date_from" type="date" />
        </div>
        <div class="field">
          <label>Date To</label>
          <input v-model="filters.date_to" type="date" />
        </div>
        <div class="field">
          <label>Source Type</label>
          <select v-model="filters.source_type">
            <option value="">All Sources</option>
            <option value="resort">Resort</option>
            <option value="museum">Museum</option>
            <option value="tourism_office">Tourism Office</option>
          </select>
        </div>
        <div class="field">
          <label>Visitor Type</label>
          <select v-model="filters.visitor_type">
            <option value="">All Types</option>
            <option value="local">Local</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="reset-button" type="button" @click="resetFilters">Reset Filters</button>
        <button class="apply-button" type="submit">Apply Filters</button>
      </div>
    </form>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="report-summary-grid">
      <article v-for="card in cards" :key="card.label" class="report-summary-card">
        <div class="summary-icon" aria-hidden="true"></div>
        <span class="summary-label">{{ card.label }}</span>
        <strong>{{ card.value ?? 0 }}</strong>
        <small>{{ card.note }}</small>
      </article>
    </div>

    <section class="panel trend-card">
      <div class="trend-header">
        <div>
          <h2>Visitor Trend</h2>
          <p>Recorded visitor count by date</p>
        </div>
        <button class="trend-export" type="button" @click="exportCsv">Export CSV</button>
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
            <td colspan="2">No trend data found for the selected filters.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import { visitorApi } from '../services/visitorApi'

const filters = reactive({ date_from: '', date_to: '', source_type: '', visitor_type: '' })
const classification = ref({ local: 0, domestic: 0, international: 0 })
const trend = ref([])
const error = ref('')
const cards = computed(() => [
  { label: 'Local Visitors', value: classification.value.local, note: 'Selected date range' },
  { label: 'Domestic Tourists', value: classification.value.domestic, note: 'Filtered report result' },
  { label: 'International Tourists', value: classification.value.international, note: 'Based on current filters' },
])

async function load() {
  error.value = ''
  try {
    classification.value = await visitorApi.classification(filters)
    trend.value = await visitorApi.visitorTrend(filters)
  } catch (err) {
    error.value = err.message
  }
}

function resetFilters() {
  Object.assign(filters, { date_from: '', date_to: '', source_type: '', visitor_type: '' })
  load()
}

async function exportCsv() {
  error.value = ''
  try {
    const csv = await visitorApi.exportVisitorSummary(filters)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'visitor-summary.csv'
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = err.message
  }
}

onMounted(load)
</script>

<style scoped>
.reports-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.reports-heading h1 {
  margin: 0 0 0.5rem;
}

.export-button,
.trend-export,
.apply-button,
.reset-button {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 1rem;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.export-button,
.apply-button {
  border: 0;
  background: #020617;
  color: #fff;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.apply-button:hover,
.export-button:hover {
  background: #0f3625;
}

.reset-button,
.trend-export {
  border: 1px solid #bbf7d0;
  background: #fff;
  color: #166534;
}

.reset-button:hover,
.trend-export:hover {
  background: #dcfce7;
}

.report-filter-card {
  display: grid;
  gap: 1.25rem;
  border-top: 3px solid #166534;
}

.filter-card-header {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.section-accent {
  width: 10px;
  height: 38px;
  border-radius: 999px;
  background: #166534;
  box-shadow: 0 0 0 6px #dcfce7;
  margin-top: 0.3rem;
}

.filter-card-header h2,
.trend-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.filter-card-header p,
.trend-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.report-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 1rem;
}

.report-filter-grid :deep(input),
.report-filter-grid :deep(select) {
  min-height: 44px;
  font-weight: 400;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-top: 1.75rem;
}

.report-summary-card {
  position: relative;
  display: grid;
  gap: 0.55rem;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #166534;
  border-radius: 10px;
  background: #fff;
  padding: 1.4rem 1.5rem;
  overflow: hidden;
}

.summary-icon {
  width: 34px;
  height: 34px;
  display: block;
  border-radius: 9px;
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  box-shadow: 0 0 0 6px #dcfce7;
}

.summary-label {
  color: #020617;
  font-weight: 800;
}

.report-summary-card strong {
  font-size: 2rem;
  line-height: 1;
}

.report-summary-card small {
  color: #64748b;
}

.trend-card {
  border-top: 3px solid #bbf7d0;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.trend-table {
  min-width: 680px;
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

@media (max-width: 1100px) {
  .report-filter-grid,
  .report-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .reports-heading,
  .trend-header {
    display: grid;
  }

  .report-filter-grid,
  .report-summary-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
