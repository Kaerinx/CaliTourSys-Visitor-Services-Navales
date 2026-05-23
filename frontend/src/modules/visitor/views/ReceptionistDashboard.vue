<template>
  <ManagementLayout :nav="nav" :subtitle="`Desk - ${assignedEstablishment}`">
    <header class="receptionist-hero">
      <div>
        <p class="eyebrow">Receptionist Desk</p>
        <h1>Visitor Recording Dashboard</h1>
        <p class="muted">Monitor recorded visitor data for {{ assignedEstablishment }}.</p>
      </div>
      <article class="assigned-card">
        <span>Assigned Establishment</span>
        <strong>{{ assignedEstablishment }}</strong>
        <small>{{ auth.user?.full_name || 'Receptionist' }}</small>
      </article>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section class="receptionist-stats">
      <article v-for="card in cards" :key="card.label" class="receptionist-card">
        <span class="accent"></span>
        <p>{{ card.label }}</p>
        <strong>{{ card.value ?? 0 }}</strong>
        <small>{{ card.note }}</small>
      </article>
    </section>

    <section class="panel receptionist-panel">
      <div class="section-header compact">
        <div>
          <h2>Recent Visitor Records</h2>
          <p>Latest visitor records for {{ assignedEstablishment }}.</p>
        </div>
        <span class="record-count">Showing {{ records.length }} records</span>
      </div>
      <VisitorTable :records="records" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { receptionistNav } from './nav'
import { visitorApi } from '../services/visitorApi'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const nav = receptionistNav
const summary = ref({})
const records = ref([])
const error = ref('')

const assignedEstablishment = computed(() => auth.user?.assigned_establishment_name || 'Assigned Establishment')

const cards = computed(() => [
  { label: 'Visitors Recorded Today', value: summary.value.total_guests_today, note: 'Recorded today' },
  { label: 'Local Visitors', value: summary.value.local_guests, note: 'From local area' },
  { label: 'Domestic Tourists', value: summary.value.domestic_tourists ?? summary.value.foreign_guests, note: 'From other Philippine regions' },
  { label: 'International Tourists', value: summary.value.international_tourists ?? 0, note: 'From other countries' },
  { label: 'Assigned Establishment', value: assignedEstablishment.value, note: 'Receptionist record scope' },
  { label: 'Pending Records', value: summary.value.pending_records ?? summary.value.pending_arrivals, note: 'For review' },
  {
    label: 'Total Records This Month',
    value: summary.value.total_records_this_month,
    note: new Date().toLocaleString('en', { month: 'long', year: 'numeric' }),
  },
])

async function load() {
  summary.value = await visitorApi.receptionistSummary()
  records.value = await visitorApi.visitors({ source_type: 'resort' })
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<style scoped>
.receptionist-hero {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: stretch;
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: #166534;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.assigned-card {
  min-width: 280px;
  border: 1px solid #bbf7d0;
  border-left: 5px solid #166534;
  border-radius: 12px;
  background: #fff;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.assigned-card span,
.assigned-card small {
  display: block;
  color: #64748b;
}

.assigned-card strong {
  display: block;
  margin: 0.35rem 0;
  color: #020617;
  font-size: 1.15rem;
}

.receptionist-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1rem;
}

.receptionist-card {
  position: relative;
  min-height: 132px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
}

.receptionist-card .accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #166534;
}

.receptionist-card p {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
}

.receptionist-card strong {
  display: block;
  margin: 1.35rem 0 0.2rem;
  font-size: 1.85rem;
  color: #020617;
}

.receptionist-card small {
  color: #475569;
}

.receptionist-panel {
  border-radius: 12px;
}

.section-header.compact {
  margin-bottom: 1rem;
}

.record-count {
  align-self: center;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  padding: 0.35rem 0.75rem;
  font-weight: 800;
  font-size: 0.85rem;
}

@media (max-width: 1100px) {
  .receptionist-hero,
  .section-header.compact {
    flex-direction: column;
  }

  .receptionist-stats {
    grid-template-columns: 1fr;
  }
}
</style>
