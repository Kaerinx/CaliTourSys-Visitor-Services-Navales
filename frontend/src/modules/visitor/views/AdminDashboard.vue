<template>
  <ManagementLayout :nav="nav">
    <h1>Welcome to Calabanga Tourism, Admin User</h1>
    <p class="muted">Here's today's overview of visitor services and tourism activity</p>
    <p v-if="error" class="error">{{ error }}</p>
    <StatCards :cards="cards" />
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Visitor Trend</h2>
          <p class="muted">Visitor counts by date</p>
        </div>
      </div>
      <div v-if="trend.length" class="mini-chart">
        <div
          v-for="row in trend"
          :key="row.date"
          class="mini-chart-bar"
          :style="{ height: `${Math.max(8, Number(row.total || 0) * 24)}px` }"
          :title="`${row.date}: ${row.total}`"
        >
          <span>{{ String(row.date).slice(5, 10) }}</span>
        </div>
      </div>
      <div v-else class="empty-state">No visitor trend data yet.</div>
    </section>
    <section class="panel">
      <h2>Visitor Classification</h2>
      <p class="muted">Local, domestic, and international totals</p>
      <div class="classification-grid">
        <div v-for="item in ['local', 'domestic', 'international']" :key="item" class="classification-row">
          <strong>{{ formatVisitorType(item) }}</strong>
          <div class="classification-bar">
            <div :style="{ width: `${Math.min(100, Number(classification[item] || 0) * 20)}%` }"></div>
          </div>
          <b>{{ classification[item] || 0 }}</b>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Recent Arrivals</h2>
      <VisitorTable :records="records" :show-actions="false" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import StatCards from '../components/StatCards.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { visitorApi } from '../services/visitorApi'
import { adminNav } from './nav'
import { formatVisitorType } from '../utils/format'

const summary = ref({})
const records = ref([])
const error = ref('')
const nav = adminNav
const classification = ref({ local: 0, domestic: 0, international: 0 })
const trend = ref([])

const cards = computed(() => [
  { label: 'Total Visitors Today', value: summary.value.total_visitors_today, note: 'Active check-ins' },
  { label: 'Local Visitors', value: summary.value.local_visitors, note: 'From local area' },
  { label: 'Domestic Tourists', value: summary.value.domestic_tourists, note: 'From other regions' },
  { label: 'International Tourists', value: summary.value.international_tourists, note: 'From other countries' },
  { label: 'Pending Inquiries', value: summary.value.pending_inquiries, note: 'Awaiting response' },
  { label: 'Museum Visitors', value: summary.value.museum_visitors, note: 'Today' },
  { label: 'Total Destinations', value: summary.value.total_destinations, note: 'Active listings' },
  { label: 'Upcoming Events', value: summary.value.upcoming_events, note: 'Scheduled' },
])

onMounted(async () => {
  try {
    summary.value = await visitorApi.dashboardSummary()
    records.value = await visitorApi.visitors()
    classification.value = await visitorApi.classification()
    trend.value = await visitorApi.visitorTrend()
  } catch (err) {
    error.value = err.message
  }
})
</script>
