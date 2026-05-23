<template>
  <ManagementLayout>
    <header class="page-heading page-heading-row">
      <div>
        <span class="eyebrow">Tourism Staff</span>
        <h1>Museum Records Monitoring</h1>
        <p>Add, view, filter, and monitor museum visitor records.</p>
      </div>
      <button v-if="canAddMuseumRecord" class="add-record-button" type="button" @click="openMuseumModal">
        + Add Museum Visitor Record
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>

    <section class="panel filter-card">
      <div class="section-header">
        <div>
          <h2>Search and Filter Museum Records</h2>
          <p>Review museum records by visitor, date, classification, or record status.</p>
        </div>
      </div>

      <form class="filter-grid" @submit.prevent="applyFilters">
        <div class="field search-field">
          <label>Search</label>
          <input v-model="draftFilters.search" type="search" placeholder="Search by visitor name or nationality" />
        </div>
        <div class="field">
          <label>Date From</label>
          <input v-model="draftFilters.date_from" type="date" />
        </div>
        <div class="field">
          <label>Date To</label>
          <input v-model="draftFilters.date_to" type="date" />
        </div>
        <div class="field">
          <label>Visitor Type</label>
          <select v-model="draftFilters.visitor_type">
            <option value="">All Types</option>
            <option value="local">Local</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="draftFilters.status">
            <option value="">All Statuses</option>
            <option value="recorded">Recorded</option>
            <option value="verified">Verified</option>
            <option value="pending_review">Pending Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="reset-button" type="button" @click="resetFilters">Reset Filters</button>
          <button class="apply-button" type="submit">Apply Filters</button>
        </div>
      </form>
    </section>

    <section class="panel records-card">
      <div class="section-header">
        <div>
          <h2>Museum Visitor Records</h2>
          <p>Monitoring records saved under museum source type.</p>
        </div>
        <span class="record-count">Showing {{ filteredRecords.length }} of {{ records.length }} records</span>
      </div>

      <VisitorTable :records="filteredRecords" />
    </section>

    <div v-if="showMuseumModal" class="modal-backdrop" @click.self="closeMuseumModal">
      <form class="record-modal" @submit.prevent="saveMuseumRecord">
        <div class="modal-header">
          <div>
            <h2>Add Museum Visitor Record</h2>
            <p>Encode museum guest details for tourism monitoring and reporting.</p>
          </div>
          <button type="button" class="icon-close" aria-label="Close" @click="closeMuseumModal">x</button>
        </div>

        <div class="modal-grid">
          <label class="form-field">
            <span>First Name *</span>
            <input v-model="museumForm.first_name" required />
          </label>
          <label class="form-field">
            <span>Middle Name</span>
            <input v-model="museumForm.middle_name" />
          </label>
          <label class="form-field">
            <span>Last Name *</span>
            <input v-model="museumForm.last_name" required />
          </label>
          <label class="form-field">
            <span>Sex</span>
            <select v-model="museumForm.gender">
              <option>Female</option>
              <option>Male</option>
              <option>Prefer not to say</option>
            </select>
          </label>
          <label class="form-field">
            <span>Nationality</span>
            <input v-model="museumForm.nationality" />
          </label>
          <label class="form-field">
            <span>Visitor Type</span>
            <select v-model="museumForm.visitor_type">
              <option value="local">Local</option>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
            </select>
          </label>
          <label class="form-field">
            <span>Contact Number</span>
            <input v-model="museumForm.contact_number" />
          </label>
          <label class="form-field">
            <span>Museum Name</span>
            <input :value="museumName" readonly />
          </label>
          <label class="form-field">
            <span>Visit Date *</span>
            <input v-model="museumForm.visit_date" type="date" required />
          </label>
          <label class="form-field">
            <span>Number of Visitors</span>
            <input v-model.number="museumForm.number_of_visitors" min="1" type="number" />
          </label>
          <label class="form-field wide">
            <span>Address</span>
            <input v-model="museumForm.address" />
          </label>
          <label class="form-field wide">
            <span>Visit Purpose</span>
            <input v-model="museumForm.purpose_of_visit" />
          </label>
        </div>

        <p v-if="modalError" class="error compact-error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="reset-button" @click="closeMuseumModal">Cancel</button>
          <button type="submit" class="apply-button" :disabled="savingRecord">
            {{ savingRecord ? 'Saving...' : 'Save Museum Visitor Record' }}
          </button>
        </div>
      </form>
    </div>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { visitorApi } from '../services/visitorApi'
import { useAuthStore } from '../stores/authStore'

function defaultFilters() {
  return { search: '', date_from: '', date_to: '', visitor_type: '', status: '' }
}

function defaultMuseumForm() {
  return {
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'Female',
    nationality: 'Filipino',
    visitor_type: 'local',
    contact_number: '',
    address: '',
    visit_date: new Date().toISOString().slice(0, 10),
    purpose_of_visit: '',
    number_of_visitors: 1,
  }
}

const auth = useAuthStore()
const records = ref([])
const establishments = ref([])
const error = ref('')
const success = ref('')
const modalError = ref('')
const savingRecord = ref(false)
const showMuseumModal = ref(false)
const draftFilters = reactive(defaultFilters())
const appliedFilters = reactive(defaultFilters())
const museumForm = reactive(defaultMuseumForm())
const canAddMuseumRecord = computed(() => auth.user?.role === 'tourism_staff')
const museumEstablishment = computed(() =>
  establishments.value.find((item) => {
    const text = `${item.type || ''} ${item.name || ''}`.toLowerCase()
    return text.includes('museum')
  }),
)
const museumName = computed(() => museumEstablishment.value?.name || 'Calabanga Municipal Museum')

const filteredRecords = computed(() => {
  const keyword = appliedFilters.search.trim().toLowerCase()
  return records.value.filter((record) => {
    const haystack = [
      record.full_name,
      record.nationality,
      record.establishment_name,
      record.source_type,
      record.visitor_type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const visitDate = String(record.visit_date || '').slice(0, 10)

    if (keyword && !haystack.includes(keyword)) return false
    if (appliedFilters.date_from && visitDate < appliedFilters.date_from) return false
    if (appliedFilters.date_to && visitDate > appliedFilters.date_to) return false
    if (appliedFilters.visitor_type && record.visitor_type !== appliedFilters.visitor_type) return false
    if (appliedFilters.status && recordStatus(record.status) !== appliedFilters.status) return false
    return true
  })
})

async function load() {
  records.value = await visitorApi.visitors({ source_type: 'museum' })
}

async function loadEstablishments() {
  if (!canAddMuseumRecord.value) return
  establishments.value = await visitorApi.getEstablishments()
}

function applyFilters() {
  Object.assign(appliedFilters, draftFilters)
}

function resetFilters() {
  Object.assign(draftFilters, defaultFilters())
  Object.assign(appliedFilters, defaultFilters())
}

function recordStatus(status) {
  const value = String(status || 'recorded').toLowerCase()
  if (['archived', 'cancelled'].includes(value)) return 'archived'
  if (['verified'].includes(value)) return 'verified'
  if (['pending', 'pending_review'].includes(value)) return 'pending_review'
  return 'recorded'
}

function openMuseumModal() {
  modalError.value = ''
  success.value = ''
  showMuseumModal.value = true
}

function closeMuseumModal() {
  if (savingRecord.value) return
  showMuseumModal.value = false
  modalError.value = ''
}

function resetMuseumForm() {
  Object.assign(museumForm, defaultMuseumForm())
}

function museumVisitorFullName() {
  return [museumForm.first_name, museumForm.middle_name, museumForm.last_name]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
}

async function saveMuseumRecord() {
  modalError.value = ''
  success.value = ''
  const fullName = museumVisitorFullName()
  if (!museumForm.first_name.trim() || !museumForm.last_name.trim() || !museumForm.visit_date) {
    modalError.value = 'First name, last name, and visit date are required.'
    return
  }

  savingRecord.value = true
  try {
    const count = Number(museumForm.number_of_visitors) || 1
    await visitorApi.createVisitor({
      full_name: fullName,
      contact_number: museumForm.contact_number,
      gender: museumForm.gender,
      age_group: 'adult',
      visitor_type: museumForm.visitor_type,
      nationality: museumForm.nationality,
      address: museumForm.address,
      source_type: 'museum',
      establishment_id: museumEstablishment.value?.id || null,
      visit_date: museumForm.visit_date,
      purpose_of_visit: museumForm.purpose_of_visit,
      number_of_visitors: count,
      number_of_guests: count,
      status: 'recorded',
    })
    success.value = 'Museum visitor record saved successfully.'
    showMuseumModal.value = false
    resetMuseumForm()
    await load()
  } catch (err) {
    modalError.value = err.message || 'Unable to save museum visitor record.'
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
.page-heading {
  margin-bottom: 1.5rem;
}

.page-heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
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

.page-heading h1 {
  margin: 0 0 0.35rem;
}

.page-heading p,
.section-header p {
  margin: 0;
  color: #475569;
  font-weight: 400;
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

.filter-card {
  border-top: 3px solid #166534;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.section-header h2 {
  margin: 0 0 0.25rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.3fr repeat(4, minmax(150px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-grid :deep(input),
.filter-grid :deep(select) {
  min-height: 44px;
  font-weight: 400;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.apply-button,
.reset-button {
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

.reset-button {
  border: 1px solid #bbf7d0;
  background: #fff;
  color: #166534;
}

.reset-button:hover {
  background: #dcfce7;
}

.records-card {
  margin-top: 1.25rem;
}

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
  white-space: nowrap;
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
  width: min(900px, 100%);
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

.form-field input[readonly] {
  color: #475569;
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
  min-width: 170px;
}

@media (max-width: 1180px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .section-header,
  .filter-grid,
  .page-heading-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: flex-start;
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
