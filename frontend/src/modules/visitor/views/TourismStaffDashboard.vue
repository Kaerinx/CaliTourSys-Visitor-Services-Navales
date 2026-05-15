<template>
  <ManagementLayout :nav="nav">
    <h1>Welcome to Calabanga Tourism, Tourism Staff</h1>
    <p class="muted">Here's today's overview of visitor services and tourism activity</p>
    <p v-if="error" class="error">{{ error }}</p>
    <StatCards :cards="cards" />
    <section class="panel">
      <h2>Visitor Classification</h2>
      <div class="classification-grid">
        <div v-for="item in ['local', 'domestic', 'international']" :key="item" class="classification-row">
          <strong>{{ item.replace('_', ' ') }}</strong>
          <div class="classification-bar">
            <div :style="{ width: `${Math.min(100, Number(classification[item] || 0) * 20)}%` }"></div>
          </div>
          <b>{{ classification[item] || 0 }}</b>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Visitor Records</h2>
      <VisitorTable :records="records" :show-actions="false" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import StatCards from '../components/StatCards.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { tourismNav } from './nav'
import { visitorApi } from '../services/visitorApi'

const nav = tourismNav
const summary = ref({})
const records = ref([])
const classification = ref({ local: 0, domestic: 0, international: 0 })
const error = ref('')
const cards = computed(() => [
  { label: 'Total Visitors Today', value: summary.value.total_visitors_today, note: 'Active check-ins' },
  { label: 'Local Visitors', value: summary.value.local_visitors, note: 'From local area' },
  { label: 'Domestic Tourists', value: summary.value.domestic_tourists, note: 'From other regions' },
  { label: 'International Tourists', value: summary.value.international_tourists, note: 'From other countries' },
  { label: 'Pending Inquiries', value: summary.value.pending_inquiries, note: 'Awaiting response' },
  { label: 'Museum Visitors', value: summary.value.museum_visitors, note: 'Today' },
])

onMounted(async () => {
  try {
    summary.value = await visitorApi.dashboardSummary()
    records.value = await visitorApi.visitors()
    classification.value = await visitorApi.classification()
  } catch (err) {
    error.value = err.message
  }
})
</script>
