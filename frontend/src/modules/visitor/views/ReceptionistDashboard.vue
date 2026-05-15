<template>
  <ManagementLayout :nav="nav" :subtitle="`Desk - ${auth.user?.assigned_establishment_name || 'Assigned Establishment'}`">
    <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start">
      <div>
        <h1>Receptionist Desk - {{ auth.user?.assigned_establishment_name || 'Assigned Establishment' }}</h1>
        <p class="muted">Guest Dashboard and Management</p>
      </div>
      <article class="card" style="min-width:300px">
        <p class="muted">Receptionist Name</p>
        <h3>{{ auth.user?.full_name }}</h3>
        <p><span class="badge">Receptionist Desk</span></p>
        <p class="muted">Assigned Resort/Establishment</p>
        <strong>{{ auth.user?.assigned_establishment_name }}</strong>
      </article>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <StatCards :cards="cards" />
    <section class="panel">
      <h2>Recent Guest Arrivals</h2>
      <p class="muted">Latest guest check-ins at {{ auth.user?.assigned_establishment_name }}</p>
      <VisitorTable :records="records" @status="updateStatus" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import StatCards from '../components/StatCards.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { receptionistNav } from './nav'
import { visitorApi } from '../services/visitorApi'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const nav = receptionistNav
const summary = ref({})
const records = ref([])
const error = ref('')
const cards = computed(() => [
  { label: 'Total Guests Today', value: summary.value.total_guests_today, note: 'All check-ins' },
  { label: 'Local Guests', value: summary.value.local_guests, note: 'From local area' },
  { label: 'Foreign Guests', value: summary.value.foreign_guests, note: 'Domestic + International' },
  { label: 'Group Registrations', value: summary.value.group_registrations, note: 'With companions' },
  { label: 'Checked-in Guests', value: summary.value.checked_in_guests, note: 'Currently active' },
  { label: 'Pending Arrivals', value: summary.value.pending_arrivals, note: 'Expected today' },
  { label: 'Total Records This Month', value: summary.value.total_records_this_month, note: new Date().toLocaleString('en', { month: 'long', year: 'numeric' }) },
])

async function load() {
  summary.value = await visitorApi.receptionistSummary()
  records.value = await visitorApi.visitors({ source_type: 'resort' })
}

async function updateStatus(record, status) {
  await visitorApi.updateVisitorStatus(record.id, status)
  await load()
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = err.message
  }
})
</script>
