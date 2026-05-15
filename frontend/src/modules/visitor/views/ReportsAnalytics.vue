<template>
  <ManagementLayout :nav="tourismNav">
    <h1>Reports and Analytics</h1>
    <p class="muted">Visitor summary, trend, classification, and CSV export.</p>
    <form class="panel form-grid" @submit.prevent="load">
      <div class="field"><label>Date From</label><input v-model="filters.date_from" type="date" /></div>
      <div class="field"><label>Date To</label><input v-model="filters.date_to" type="date" /></div>
      <div class="field"><label>Source Type</label><select v-model="filters.source_type"><option value="">All</option><option>resort</option><option>museum</option><option>tourism_office</option></select></div>
      <button class="btn" type="submit">Apply Filters</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <StatCards :cards="cards" />
    <section class="panel">
      <h2>Visitor Trend</h2>
      <table>
        <thead><tr><th>Date</th><th>Total</th></tr></thead>
        <tbody><tr v-for="row in trend" :key="row.date"><td>{{ row.date }}</td><td>{{ row.total }}</td></tr></tbody>
      </table>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import StatCards from '../components/StatCards.vue'
import { tourismNav } from './nav'
import { visitorApi } from '../services/visitorApi'

const filters = reactive({ date_from: '', date_to: '', source_type: '' })
const classification = ref({ local: 0, domestic: 0, international: 0 })
const trend = ref([])
const error = ref('')
const cards = computed(() => [
  { label: 'Local Visitors', value: classification.value.local, note: 'Selected range' },
  { label: 'Domestic Tourists', value: classification.value.domestic, note: 'Selected range' },
  { label: 'International Tourists', value: classification.value.international, note: 'Selected range' },
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

onMounted(load)
</script>
