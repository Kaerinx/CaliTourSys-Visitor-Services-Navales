<template>
  <ManagementLayout>
    <div class="reports-heading">
      <div><h1>Tourist Reports and Analytics</h1><p class="muted">Daily establishment summaries with entry-based visit context analysis.</p></div>
    </div>

    <form class="panel report-filter-card" @submit.prevent="load">
      <div class="filter-card-header"><span class="section-accent" aria-hidden="true"></span><div><h2>Filter Report Data</h2><p>Control the establishment, period, metric, chart, and visit context.</p></div></div>
      <div class="report-filter-grid">
        <label class="field"><span>Establishment</span><select v-model="filters.establishment_id"><option value="">All Establishments</option><option v-for="item in establishments" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label class="field"><span>Date From</span><input v-model="filters.date_from" type="date" /></label>
        <label class="field"><span>Date To</span><input v-model="filters.date_to" type="date" /></label>
        <label class="field"><span>View By</span><select v-model="filters.view_by"><option value="day">Day</option><option value="month">Month</option><option value="year">Year</option></select></label>
        <label class="field"><span>Tourist Type</span><select v-model="filters.tourist_type"><option value="all">All Tourists</option><option value="local">Local</option><option value="domestic">Domestic</option><option value="international">International</option></select></label>
        <label class="field"><span>Chart Type</span><select v-model="chartType"><option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie</option></select></label>
        <label class="field"><span>Visit Context</span><select v-model="filters.visit_context"><option value="">All Contexts</option><option v-for="context in contextOptions" :key="context" :value="context">{{ context }}</option></select></label>
      </div>
      <div class="filter-actions"><button class="reset-button" type="button" @click="resetFilters">Reset Filters</button><button class="apply-button" type="submit" :disabled="loading">{{ loading ? 'Loading...' : 'Apply Filters' }}</button></div>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <div class="report-summary-grid"><article v-for="card in summaryCards" :key="card.label" class="report-summary-card"><span>{{ card.label }}</span><strong>{{ card.value }}</strong><small>Selected filters</small></article></div>

    <div class="charts-grid">
      <AnalyticsPanel title="Tourist Trend" subtitle="Daily summary totals grouped by the selected period" :rows="trendRows" :chart-type="chartType" />
      <AnalyticsPanel title="Tourist Type Breakdown" subtitle="Local, domestic, and international daily totals" :rows="analytics.touristTypes" :chart-type="chartType" />
      <AnalyticsPanel title="Age Group Breakdown" subtitle="Adults, Senior Citizens, and Children from daily summaries" :rows="analytics.ageGroups" :chart-type="chartType" />
      <AnalyticsPanel title="Visit Context Breakdown" subtitle="Arrival entry totals; each context is counted once per entry" :rows="contextRows" :chart-type="chartType" />
    </div>
  </ManagementLayout>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import { visitorApi } from '../services/visitorApi'

const colors = ['#166534', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2']
const contextOptions = ['Walk-in', 'Event-related', 'Package Tour', 'Group Tour', 'Regular Visit', 'Other']
const filters = reactive(defaultFilters())
const chartType = ref('bar')
const loading = ref(false)
const error = ref('')
const establishments = ref([])
const analytics = reactive({ trend: [], touristTypes: [], ageGroups: [], contexts: [] })

const trendRows = computed(() => analytics.trend.map((row) => ({ label: row.period, total: row.total })))
const contextRows = computed(() => analytics.contexts.map((row) => ({ label: row.context, total: row.total })))
const summaryCards = computed(() => {
  const types = Object.fromEntries(analytics.touristTypes.map((row) => [row.label, Number(row.total)]))
  return [
    { label: 'Total Tourists', value: (types.Local || 0) + (types.Domestic || 0) + (types.International || 0) },
    { label: 'Local Tourists', value: types.Local || 0 },
    { label: 'Domestic Tourists', value: types.Domestic || 0 },
    { label: 'International Tourists', value: types.International || 0 },
  ]
})

const AnalyticsPanel = defineComponent({
  props: { title: String, subtitle: String, rows: { type: Array, default: () => [] }, chartType: String },
  setup(props) {
    const normalized = computed(() => props.rows.map((row) => ({ label: row.label, total: Number(row.total) || 0 })))
    const maximum = computed(() => Math.max(...normalized.value.map((row) => row.total), 1))
    const pointCoordinates = computed(() => normalized.value.map((row, index) => {
      const x = normalized.value.length <= 1 ? 50 : 5 + (index * 90) / (normalized.value.length - 1)
      const y = 92 - (row.total / maximum.value) * 82
      return { x, y }
    }))
    const points = computed(() => pointCoordinates.value.map((point) => `${point.x},${point.y}`).join(' '))
    const pie = computed(() => {
      const total = normalized.value.reduce((sum, row) => sum + row.total, 0)
      if (!total) return '#e2e8f0'
      let cursor = 0
      return `conic-gradient(${normalized.value.map((row, index) => {
        const start = cursor
        cursor += (row.total / total) * 100
        return `${colors[index % colors.length]} ${start}% ${cursor}%`
      }).join(', ')})`
    })
    function renderChart() {
      if (!normalized.value.length || normalized.value.every((row) => row.total === 0)) {
        return h('p', { class: 'empty-chart' }, 'No data found for the selected filters.')
      }
      if (props.chartType === 'pie') {
        return h('div', { class: 'pie-layout' }, [
          h('div', { class: 'pie-chart', style: { background: pie.value } }),
          h('div', { class: 'chart-legend' }, normalized.value.map((row, index) =>
            h('div', [h('i', { style: { background: colors[index % colors.length] } }), h('span', row.label), h('strong', String(row.total))])
          )),
        ])
      }
      if (props.chartType === 'line') {
        return h('div', { class: 'line-layout' }, [
          h('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', class: 'line-chart' }, [
            h('polyline', { points: points.value, fill: 'none', stroke: colors[0], 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }),
            ...pointCoordinates.value.map((point) => h('circle', { cx: point.x, cy: point.y, r: 2.2, fill: colors[0], stroke: '#ffffff', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })),
          ]),
          h('div', { class: 'line-labels' }, normalized.value.map((row) => h('span', `${row.label}: ${row.total}`))),
        ])
      }
      return h('div', { class: 'bar-chart' }, normalized.value.map((row, index) =>
        h('div', { class: 'bar-row' }, [
          h('span', row.label),
          h('div', { class: 'bar-track' }, h('i', { style: { width: `${(row.total / maximum.value) * 100}%`, background: colors[index % colors.length] } })),
          h('strong', String(row.total)),
        ])
      ))
    }
    return () => h('section', { class: 'panel analytics-panel' }, [
      h('div', { class: 'chart-heading' }, [h('h2', props.title), h('p', props.subtitle)]),
      renderChart(),
    ])
  },
})

function defaultFilters() { return { establishment_id: '', date_from: '', date_to: '', view_by: 'day', tourist_type: 'all', visit_context: '' } }

async function load() {
  error.value = ''
  if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) { error.value = 'Date From cannot be after Date To.'; return }
  loading.value = true
  try {
    const result = await visitorApi.touristLogAnalytics(filters)
    analytics.trend = result.trend || []
    analytics.touristTypes = result.touristTypes || []
    analytics.ageGroups = result.ageGroups || []
    analytics.contexts = result.contexts || []
    establishments.value = result.establishments || establishments.value
  } catch (err) { error.value = err.message || 'Unable to load tourist analytics.' }
  finally { loading.value = false }
}

function resetFilters() { Object.assign(filters, defaultFilters()); chartType.value = 'bar'; void load() }
onMounted(load)
</script>

<style scoped>
.reports-heading h1 { margin: 0 0 .5rem; }
.report-filter-card { display: grid; gap: 1.25rem; border-top: 3px solid #166534; }
.filter-card-header { display: flex; gap: .85rem; align-items: flex-start; }
.filter-card-header h2,.chart-heading h2 { margin: 0; font-size: 1.2rem; }
.filter-card-header p,.chart-heading p { margin: .25rem 0 0; color: #64748b; }
.section-accent { width: 10px; height: 38px; border-radius: 999px; background: #166534; box-shadow: 0 0 0 6px #dcfce7; margin-top: .3rem; }
.report-filter-grid { display: grid; grid-template-columns: repeat(4,minmax(180px,1fr)); gap: 1rem; }
.field { display: grid; gap: .4rem; }.field span { font-weight: 800; }.field input,.field select { min-height: 44px; border: 0; border-radius: 8px; background: #f1f5f9; padding: 0 .8rem; font: inherit; }
.filter-actions { display: flex; justify-content: flex-end; gap: .75rem; }.filter-actions button { min-height: 44px; border-radius: 8px; padding: 0 1rem; font: inherit; font-weight: 800; cursor: pointer; }.apply-button { border: 0; background: #020617; color: #fff; }.reset-button { border: 1px solid #bbf7d0; background: #fff; color: #166534; }
.report-summary-grid { display: grid; grid-template-columns: repeat(4,minmax(180px,1fr)); gap: 1rem; margin: 1.5rem 0; }.report-summary-card { display: grid; gap: .45rem; border: 1px solid #e5e7eb; border-left: 4px solid #166534; border-radius: 10px; background: #fff; padding: 1.2rem; }.report-summary-card span { font-weight: 800; }.report-summary-card strong { font-size: 2rem; }.report-summary-card small { color: #64748b; }
.charts-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1.25rem; }.analytics-panel { min-width: 0; }.chart-heading { margin-bottom: 1.2rem; }.empty-chart { color: #64748b; }
.bar-chart { display: grid; gap: .8rem; }.bar-row { display: grid; grid-template-columns: minmax(90px,140px) 1fr 55px; align-items: center; gap: .7rem; }.bar-row>span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.bar-track { height: 18px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }.bar-track i { display: block; height: 100%; min-width: 2px; border-radius: inherit; }.bar-row strong { text-align: right; }
.pie-layout { display: grid; grid-template-columns: minmax(160px,220px) 1fr; gap: 1.5rem; align-items: center; }.pie-chart { width: min(220px,100%); aspect-ratio: 1; border-radius: 50%; margin: auto; }.chart-legend { display: grid; gap: .65rem; }.chart-legend div { display: grid; grid-template-columns: 12px 1fr auto; align-items: center; gap: .5rem; }.chart-legend i { width: 12px; height: 12px; border-radius: 3px; }
.line-layout { display: grid; gap: .8rem; }.line-chart { width: 100%; height: 230px; border-left: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; background: repeating-linear-gradient(to bottom,#fff 0,#fff 44px,#f1f5f9 45px); }.line-labels { display: flex; flex-wrap: wrap; gap: .5rem; }.line-labels span { border-radius: 999px; background: #f1f5f9; padding: .3rem .55rem; font-size: .8rem; }
@media(max-width:1100px){.report-filter-grid,.report-summary-grid,.charts-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:720px){.report-filter-grid,.report-summary-grid,.charts-grid,.pie-layout{grid-template-columns:1fr}.filter-actions{justify-content:flex-start}.bar-row{grid-template-columns:90px 1fr 40px}}
</style>

<style>
.analytics-panel .chart-heading { margin-bottom: 1.2rem; }
.analytics-panel .chart-heading h2 { margin: 0; font-size: 1.2rem; }
.analytics-panel .chart-heading p { margin: .25rem 0 0; color: #64748b; }
.analytics-panel .empty-chart { min-height: 180px; display: grid; place-items: center; color: #64748b; text-align: center; }
.analytics-panel .bar-chart { display: grid; gap: .8rem; }
.analytics-panel .bar-row { display: grid; grid-template-columns: minmax(90px,140px) 1fr 55px; align-items: center; gap: .7rem; }
.analytics-panel .bar-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.analytics-panel .bar-track { height: 18px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.analytics-panel .bar-track i { display: block; height: 100%; min-width: 2px; border-radius: inherit; }
.analytics-panel .bar-row strong { text-align: right; }
.analytics-panel .pie-layout { display: grid; grid-template-columns: minmax(160px,220px) 1fr; gap: 1.5rem; align-items: center; }
.analytics-panel .pie-chart { width: min(220px,100%); aspect-ratio: 1; border-radius: 50%; margin: auto; box-shadow: inset 0 0 0 1px rgba(15,23,42,.08); }
.analytics-panel .chart-legend { display: grid; gap: .65rem; }
.analytics-panel .chart-legend div { display: grid; grid-template-columns: 12px 1fr auto; align-items: center; gap: .5rem; }
.analytics-panel .chart-legend i { width: 12px; height: 12px; border-radius: 3px; }
.analytics-panel .line-layout { display: grid; gap: .8rem; }
.analytics-panel .line-chart { display: block; width: 100%; height: 230px; border-left: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; background: repeating-linear-gradient(to bottom,#fff 0,#fff 44px,#f1f5f9 45px); }
.analytics-panel .line-labels { display: flex; flex-wrap: wrap; gap: .5rem; }
.analytics-panel .line-labels span { border-radius: 999px; background: #f1f5f9; padding: .3rem .55rem; font-size: .8rem; }
@media(max-width:720px) {
  .analytics-panel .pie-layout { grid-template-columns: 1fr; }
  .analytics-panel .bar-row { grid-template-columns: 90px 1fr 40px; }
}
</style>
