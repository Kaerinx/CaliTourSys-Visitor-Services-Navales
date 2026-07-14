<template>
  <ManagementLayout :nav="isReceptionist ? receptionistNav : tourismNav">
    <header class="records-header records-header-row">
      <div>
        <p class="eyebrow">{{ isReceptionist ? 'Receptionist Desk' : 'Tourism Staff' }}</p>
        <h1>Recorded Visitor Data</h1>
        <p class="muted">
          {{ isReceptionist ? 'Records assigned to your establishment.' : 'Records submitted by assigned receptionists and establishments.' }}
        </p>
        <p v-if="isReceptionist" class="assigned-line">
          Assigned establishment: <strong>{{ auth.user?.assigned_establishment_name || 'Assigned Establishment' }}</strong>
        </p>
      </div>
      <button v-if="canAddRecord" class="add-record-button" type="button" @click="goToVisitorRegistration">
        Add Visitor / Guest
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>

    <section class="panel filter-panel">
      <div class="filter-title">
        <h2>Search and Filter Visitor Records</h2>
        <p>Find records by visitor, date, source, type, or review status.</p>
      </div>
      <form class="record-filters" @submit.prevent="applyFilters">
        <label class="field">
          <span>Search</span>
          <input v-model="draftFilters.search" placeholder="Name, contact number, or establishment" />
        </label>
        <label class="field">
          <span>Date From</span>
          <input v-model="draftFilters.date_from" type="date" />
        </label>
        <label class="field">
          <span>Date To</span>
          <input v-model="draftFilters.date_to" type="date" />
        </label>
        <label class="field">
          <span>Visitor Type</span>
          <select v-model="draftFilters.visitor_type">
            <option value="">All Types</option>
            <option value="local">Local</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </label>
        <label class="field">
          <span>Source Type</span>
          <select v-model="draftFilters.source_type" :disabled="isReceptionist">
            <option value="">All Sources</option>
            <option value="resort">Resort</option>
            <option v-if="SHOW_MUSEUM_MODULE" value="museum">Museum</option>
            <option value="tourism_office">Tourism Office</option>
          </select>
        </label>
        <label class="field">
          <span>Status</span>
          <select v-model="draftFilters.status">
            <option value="">All Statuses</option>
            <option value="recorded">Recorded</option>
            <option value="verified">Verified</option>
            <option value="pending_review">Pending Review</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <div class="filter-actions">
          <button class="secondary-button" type="button" @click="resetFilters">Reset Filters</button>
          <button class="primary-button" type="submit">Apply Filters</button>
        </div>
      </form>
      <div v-if="activeFilterChips.length" class="filter-chips">
        <button v-for="chip in activeFilterChips" :key="chip.key" type="button" @click="removeFilter(chip.key)">
          {{ chip.label }} <span aria-hidden="true">x</span>
        </button>
      </div>
    </section>

    <section class="panel records-panel">
      <div class="section-header compact">
        <div>
          <h2>Recorded Visitor Data</h2>
          <p>{{ isReceptionist ? 'Records assigned to your establishment.' : 'Records submitted by assigned receptionists and establishments.' }}</p>
        </div>
        <span class="record-count">Showing {{ filteredRecords.length }} of {{ records.length }} records</span>
      </div>
      <VisitorTable :records="filteredRecords" />
    </section>

    <div v-if="showRecordModal" class="modal-backdrop" @click.self="closeRecordModal">
      <form class="record-modal" @submit.prevent="saveRecord">
        <div class="modal-header">
          <div>
            <h2>Add Visitor Record</h2>
            <p>Encode visitor details for tourism monitoring and reporting.</p>
          </div>
          <button type="button" class="icon-close" aria-label="Close" @click="closeRecordModal">x</button>
        </div>

        <div class="modal-grid">
          <label class="form-field">
            <span>First Name *</span>
            <input v-model="recordForm.first_name" required />
          </label>
          <label class="form-field">
            <span>Middle Name</span>
            <input v-model="recordForm.middle_name" />
          </label>
          <label class="form-field">
            <span>Last Name *</span>
            <input v-model="recordForm.last_name" required />
          </label>
          <label class="form-field">
            <span>Sex</span>
            <select v-model="recordForm.gender">
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>
          <label class="form-field">
            <span>Nationality</span>
            <input v-model="recordForm.nationality" />
          </label>
          <label class="form-field">
            <span>Visitor Type</span>
            <select v-model="recordForm.visitor_type">
              <option value="local">Local</option>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
            </select>
          </label>
          <label class="form-field">
            <span>Contact Number</span>
            <input v-model="recordForm.contact_number" />
          </label>
          <label class="form-field">
            <span>Email Address</span>
            <input v-model="recordForm.email" type="email" />
          </label>
          <label class="form-field wide">
            <span>Address</span>
            <input v-model="recordForm.address" />
          </label>
          <label class="form-field">
            <span>Source Type</span>
            <select v-model="recordForm.source_type">
              <option value="tourism_office">Tourism Office</option>
              <option value="resort">Resort</option>
            </select>
          </label>
          <label class="form-field">
            <span>Establishment / Destination</span>
            <select v-model="recordForm.establishment_id">
              <option value="">Tourism Office / No establishment</option>
              <option v-for="establishment in establishments" :key="establishment.id" :value="establishment.id">
                {{ establishment.name }}
              </option>
            </select>
          </label>
          <label class="form-field">
            <span>Visit Date *</span>
            <input v-model="recordForm.visit_date" type="date" required />
          </label>
          <label class="form-field">
            <span>Number of Visitors</span>
            <input v-model.number="recordForm.number_of_visitors" min="1" type="number" />
          </label>
          <label class="form-field wide">
            <span>Visit Purpose</span>
            <input v-model="recordForm.purpose_of_visit" />
          </label>
        </div>

        <p v-if="modalError" class="error compact-error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeRecordModal">Cancel</button>
          <button type="submit" class="primary-button" :disabled="savingRecord">
            {{ savingRecord ? 'Saving...' : 'Save Visitor Record' }}
          </button>
        </div>
      </form>
    </div>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SHOW_MUSEUM_MODULE } from '@/config/featureFlags'
import ManagementLayout from '../components/ManagementLayout.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { receptionistNav, tourismNav } from './nav'
import { visitorApi } from '../services/visitorApi'
import { useAuthStore } from '../stores/authStore'
import { formatSourceType, formatStatus, formatVisitorType } from '../utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const records = ref([])
const establishments = ref([])
const error = ref('')
const success = ref('')
const modalError = ref('')
const savingRecord = ref(false)
const showRecordModal = ref(false)
const isReceptionist = computed(() => auth.user?.role === 'receptionist' || route.meta.sourceType === 'resort')
const canAddRecord = computed(() => false)

const appliedFilters = reactive(defaultFilters())
const draftFilters = reactive(defaultFilters())
const recordForm = reactive(defaultRecordForm())

const filteredRecords = computed(() => {
  const keyword = appliedFilters.search.trim().toLowerCase()
  return records.value.filter((record) => {
    const text = [record.full_name, record.contact_number, record.establishment_name, record.group_id, record.id].join(' ').toLowerCase()
    const status = recordStatusKey(record.status)
    return (
      (!keyword || text.includes(keyword)) &&
      (!appliedFilters.visitor_type || record.visitor_type === appliedFilters.visitor_type) &&
      (!appliedFilters.source_type || record.source_type === appliedFilters.source_type) &&
      (!appliedFilters.status || status === appliedFilters.status) &&
      (!appliedFilters.date_from || String(record.visit_date || '').slice(0, 10) >= appliedFilters.date_from) &&
      (!appliedFilters.date_to || String(record.visit_date || '').slice(0, 10) <= appliedFilters.date_to)
    )
  })
})

const activeFilterChips = computed(() =>
  [
    appliedFilters.search && { key: 'search', label: `Search: ${appliedFilters.search}` },
    appliedFilters.date_from && { key: 'date_from', label: `From: ${appliedFilters.date_from}` },
    appliedFilters.date_to && { key: 'date_to', label: `To: ${appliedFilters.date_to}` },
    appliedFilters.visitor_type && { key: 'visitor_type', label: `Type: ${formatVisitorType(appliedFilters.visitor_type)}` },
    appliedFilters.source_type && { key: 'source_type', label: `Source: ${formatSourceType(appliedFilters.source_type)}` },
    appliedFilters.status && { key: 'status', label: `Status: ${recordStatusLabel(appliedFilters.status)}` },
  ].filter(Boolean),
)

function defaultFilters() {
  return {
    search: '',
    date_from: '',
    date_to: '',
    visitor_type: '',
    source_type: '',
    status: '',
  }
}

function defaultRecordForm() {
  return {
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'M',
    nationality: 'Filipino',
    visitor_type: 'local',
    contact_number: '',
    email: '',
    address: '',
    source_type: 'tourism_office',
    establishment_id: '',
    visit_date: new Date().toISOString().slice(0, 10),
    purpose_of_visit: '',
    number_of_visitors: 1,
  }
}

async function load() {
  const sourceType = route.meta.sourceType || ''
  const params = sourceType ? { source_type: sourceType } : {}
  records.value = await visitorApi.visitors(params)
  draftFilters.source_type = sourceType
  appliedFilters.source_type = sourceType
}

async function loadEstablishments() {
  if (!canAddRecord.value) return
  establishments.value = await visitorApi.getEstablishments()
}

function applyFilters() {
  Object.assign(appliedFilters, draftFilters)
}

function resetFilters() {
  const sourceType = route.meta.sourceType || ''
  Object.assign(draftFilters, defaultFilters(), { source_type: sourceType })
  Object.assign(appliedFilters, defaultFilters(), { source_type: sourceType })
}

function removeFilter(key) {
  if (key === 'source_type' && isReceptionist.value) return
  draftFilters[key] = ''
  appliedFilters[key] = ''
}

function recordStatusKey(status) {
  if (status === 'archived' || status === 'cancelled') return 'archived'
  if (status === 'verified') return 'verified'
  if (status === 'pending_review') return 'pending_review'
  return 'recorded'
}

function recordStatusLabel(status) {
  if (status === 'pending_review') return 'Pending Review'
  if (status === 'recorded') return 'Recorded'
  return formatStatus(status)
}

function openRecordModal() {
  modalError.value = ''
  success.value = ''
  showRecordModal.value = true
}

function goToVisitorRegistration() {
  router.push('/cms/visitor/registration')
}

function closeRecordModal() {
  if (savingRecord.value) return
  showRecordModal.value = false
  modalError.value = ''
}

function resetRecordForm() {
  Object.assign(recordForm, defaultRecordForm())
}

function visitorFullName() {
  return [recordForm.first_name, recordForm.middle_name, recordForm.last_name].map((part) => String(part || '').trim()).filter(Boolean).join(' ')
}

async function saveRecord() {
  modalError.value = ''
  success.value = ''
  const fullName = visitorFullName()
  if (!recordForm.first_name.trim() || !recordForm.last_name.trim() || !recordForm.visit_date) {
    modalError.value = 'First name, last name, and visit date are required.'
    return
  }

  savingRecord.value = true
  try {
    const count = Number(recordForm.number_of_visitors) || 1
    await visitorApi.createVisitor({
      full_name: fullName,
      contact_number: recordForm.contact_number,
      email: recordForm.email,
      gender: recordForm.gender,
      age_group: 'adult',
      visitor_type: recordForm.visitor_type,
      nationality: recordForm.nationality,
      address: recordForm.address,
      source_type: recordForm.source_type,
      establishment_id: recordForm.establishment_id || null,
      visit_date: recordForm.visit_date,
      purpose_of_visit: recordForm.purpose_of_visit,
      number_of_visitors: count,
      number_of_guests: count,
      status: 'recorded',
    })
    success.value = 'Visitor record saved successfully.'
    showRecordModal.value = false
    resetRecordForm()
    await load()
  } catch (err) {
    modalError.value = err.message || 'Unable to save visitor record.'
  } finally {
    savingRecord.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([load(), loadEstablishments()])
  } catch (err) {
    error.value = err.message
  }
})
</script>

<style scoped>
.records-header {
  margin-bottom: 1.25rem;
}

.records-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #166534;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.assigned-line {
  margin: 0.75rem 0 0;
  color: #475569;
}

.add-record-button {
  border: 0;
  border-radius: 10px;
  background: #020617;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  padding: 0.8rem 1rem;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.add-record-button:hover {
  background: #0f3625;
  transform: translateY(-1px);
}

.success {
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: #dcfce7;
  color: #166534;
  padding: 0.85rem 1rem;
  font-weight: 800;
}

.filter-panel,
.records-panel {
  border-radius: 12px;
}

.filter-title {
  margin-bottom: 1rem;
}

.filter-title h2 {
  margin: 0;
  font-size: 1.2rem;
}

.filter-title p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.record-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(190px, 1fr));
  gap: 1rem;
  align-items: end;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span {
  font-weight: 800;
}

.field input,
.field select {
  min-height: 46px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  padding: 0 0.9rem;
  font: inherit;
  font-weight: 400;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.filter-actions button {
  width: auto;
  min-width: 140px;
  min-height: 46px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.filter-chips button {
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  padding: 0.35rem 0.7rem;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.section-header.compact {
  margin-bottom: 1rem;
}

.record-count {
  align-self: center;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  padding: 0.35rem 0.75rem;
  font-weight: 800;
  font-size: 0.85rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  overflow: auto;
  background: rgba(15, 23, 42, 0.45);
  padding: 1.5rem;
}

.record-modal {
  width: min(940px, 100%);
  max-height: calc(100vh - 3rem);
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.modal-header h2 {
  margin: 0 0 0.25rem;
}

.modal-header p {
  margin: 0;
  color: #64748b;
  font-weight: 400;
}

.icon-close {
  width: 38px;
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.form-field {
  display: grid;
  gap: 0.45rem;
}

.form-field.wide {
  grid-column: span 3;
}

.form-field span {
  font-weight: 800;
}

.form-field input,
.form-field select {
  min-height: 46px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  padding: 0 0.9rem;
  font: inherit;
  font-weight: 400;
}

.compact-error {
  margin-top: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.modal-actions button {
  width: auto;
  min-width: 150px;
  min-height: 46px;
}

@media (max-width: 980px) {
  .record-filters {
    grid-template-columns: 1fr;
  }

  .filter-actions,
  .section-header.compact,
  .records-header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .modal-grid {
    grid-template-columns: 1fr;
  }

  .form-field.wide {
    grid-column: auto;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
