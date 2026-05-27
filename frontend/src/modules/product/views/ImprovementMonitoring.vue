<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import FilterActions from '@/modules/product/components/FilterActions.vue'
import ModuleStats from '@/modules/product/components/ModuleStats.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import StatusPill from '@/modules/product/components/StatusPill.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { IMPROVEMENT_STATUSES } from '@/modules/product/constants/productOptions'
import {
  archiveImprovementRecord,
  createImprovementRecord,
  getDevelopmentPlans,
  getImprovementRecords,
  updateImprovementRecord,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const auth = useProductAccess()

const plans = ref([])
const improvements = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingImprovementId = ref(null)

const filters = reactive({
  search: '',
  planId: '',
  status: '',
  dateFrom: '',
  dateTo: '',
})

const form = reactive({
  planId: '',
  progressPercentage: 0,
  improvementStatus: 'Ongoing',
  updateDate: new Date().toISOString().slice(0, 10),
  remarks: '',
})

const canEditImprovements = computed(() =>
  [USER_ROLES.TOURISM_STAFF, USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(
    auth.user?.role,
  ),
)
const canArchiveImprovements = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)
const selectablePlans = computed(() =>
  plans.value.filter((plan) => plan.planStatus !== 'Archived' && plan.assetStatus !== 'Archived'),
)
const activeImprovements = computed(() =>
  improvements.value.filter((improvement) => improvement.improvementStatus !== 'Archived').length,
)
const delayedImprovements = computed(() =>
  improvements.value.filter((improvement) => improvement.improvementStatus === 'Delayed').length,
)
const completedImprovements = computed(() =>
  improvements.value.filter((improvement) => improvement.improvementStatus === 'Completed').length,
)
const improvementStats = computed(() => [
  { label: 'Total records', value: improvements.value.length },
  { label: 'Active records', value: activeImprovements.value },
  { label: 'Delayed', value: delayedImprovements.value },
  { label: 'Completed', value: completedImprovements.value },
])

function resetForm() {
  editingImprovementId.value = null
  form.planId = ''
  form.progressPercentage = 0
  form.improvementStatus = 'Ongoing'
  form.updateDate = new Date().toISOString().slice(0, 10)
  form.remarks = ''
}

function clearFilters() {
  filters.search = ''
  filters.planId = ''
  filters.status = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  loadImprovements()
}

function canEditImprovement(improvement) {
  return (
    canEditImprovements.value &&
    improvement.improvementStatus !== 'Archived' &&
    improvement.planStatus !== 'Archived' &&
    improvement.assetStatus !== 'Archived'
  )
}

function canArchiveImprovement(improvement) {
  return canArchiveImprovements.value && improvement.improvementStatus !== 'Archived'
}

function editImprovement(improvement) {
  editingImprovementId.value = improvement.id
  form.planId = improvement.planId
  form.progressPercentage = improvement.progressPercentage
  form.improvementStatus = improvement.improvementStatus
  form.updateDate = improvement.updateDate
  form.remarks = improvement.remarks
}

async function loadPlans() {
  const response = await getDevelopmentPlans()
  plans.value = response.data
}

async function loadImprovements() {
  loading.value = true
  error.value = ''

  try {
    const response = await getImprovementRecords(filters)
    improvements.value = response.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadPageData() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([loadPlans(), loadImprovements()])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function saveImprovement() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingImprovementId.value) {
      await updateImprovementRecord(editingImprovementId.value, form)
      success.value = 'Improvement record updated successfully.'
    } else {
      await createImprovementRecord(form)
      success.value = 'Improvement record created successfully.'
    }

    resetForm()
    await loadPageData()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function archiveImprovement(improvement) {
  const confirmed = window.confirm(`Archive improvement record for "${improvement.planTitle}"?`)

  if (!confirmed) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await archiveImprovementRecord(improvement.id)
    success.value = 'Improvement record archived successfully.'
    await loadPageData()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadPageData)
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Progress Records</p>
      <h1>Improvement Monitoring</h1>
      <p>
        Track progress updates for product development plans so the Tourism Office can see delays,
        completed work, and readiness signals before packaging.
      </p>
    </div>

    <ModuleStats :items="improvementStats" />

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter improvement records, but cannot create, edit, or archive
      records.
    </RoleNotice>

    <div class="monitor-layout">
      <form v-if="canEditImprovements" class="monitor-form" @submit.prevent="saveImprovement">
        <div>
          <p class="eyebrow">{{ editingImprovementId ? 'Edit progress' : 'New progress' }}</p>
          <h2>{{ editingImprovementId ? 'Update improvement record' : 'Create improvement record' }}</h2>
        </div>

        <p v-if="!selectablePlans.length" class="form-error">
          Create a non-archived development plan before recording improvement progress.
        </p>

        <label>
          Development Plan
          <select v-model="form.planId" required>
            <option value="">Select active development plan</option>
            <option v-for="plan in selectablePlans" :key="plan.id" :value="plan.id">
              {{ plan.planTitle }} - {{ plan.assetName }}
            </option>
          </select>
        </label>

        <div class="form-grid">
          <label>
            Progress Percentage
            <input v-model.number="form.progressPercentage" max="100" min="0" required type="number" />
          </label>

          <label>
            Improvement Status
            <select v-model="form.improvementStatus" required>
              <option v-for="status in IMPROVEMENT_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
        </div>

        <label>
          Update Date
          <input v-model="form.updateDate" required type="date" />
        </label>

        <label>
          Remarks
          <textarea
            v-model="form.remarks"
            required
            placeholder="Describe progress completed, issues found, or next action needed."
          ></textarea>
        </label>

        <div class="form-actions">
          <button class="primary-button" :disabled="saving || !selectablePlans.length" type="submit">
            {{ saving ? 'Saving...' : editingImprovementId ? 'Save Changes' : 'Create Record' }}
          </button>
          <button v-if="editingImprovementId" class="secondary-button" type="button" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>

      <section class="monitor-panel">
        <div class="filter-panel">
          <label>
            Search
            <input v-model="filters.search" placeholder="Search remarks, plan, or asset" />
          </label>
          <label>
            Plan
            <select v-model="filters.planId">
              <option value="">All plans</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                {{ plan.planTitle }}
              </option>
            </select>
          </label>
          <label>
            Status
            <select v-model="filters.status">
              <option value="">All statuses</option>
              <option v-for="status in IMPROVEMENT_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
          <label>
            Date From
            <input v-model="filters.dateFrom" type="date" />
          </label>
          <label>
            Date To
            <input v-model="filters.dateTo" type="date" />
          </label>
          <FilterActions @apply="loadImprovements" @clear="clearFilters" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="success" class="form-success">{{ success }}</p>

        <div v-if="loading" class="empty-state compact">
          <h2>Loading improvement records...</h2>
        </div>

        <div v-else-if="!improvements.length" class="empty-state compact">
          <h2>No improvement records found</h2>
          <p>Create the first progress update from an active development plan or adjust the filters.</p>
        </div>

        <div v-else class="monitor-table-wrap">
          <table class="monitor-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Update</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="improvement in improvements" :key="improvement.id">
                <td>
                  <strong>{{ improvement.planTitle }}</strong>
                  <span>{{ improvement.assetName }}</span>
                </td>
                <td>
                  <strong>{{ improvement.progressPercentage }}%</strong>
                  <div class="progress-track">
                    <span :style="{ width: `${improvement.progressPercentage}%` }"></span>
                  </div>
                </td>
                <td>
                  <StatusPill :status="improvement.improvementStatus" />
                </td>
                <td>{{ improvement.updateDate }}</td>
                <td>{{ improvement.remarks }}</td>
                <td>
                  <div class="table-actions">
                    <button
                      v-if="canEditImprovement(improvement)"
                      class="secondary-button"
                      type="button"
                      @click="editImprovement(improvement)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="canArchiveImprovement(improvement)"
                      class="danger-button"
                      type="button"
                      @click="archiveImprovement(improvement)"
                    >
                      Archive
                    </button>
                    <span v-if="auth.isViewOnly">View only</span>
                    <span v-else-if="improvement.planStatus === 'Archived'">Plan archived</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.monitor-form,
.monitor-panel {
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.monitor-panel {
  overflow: hidden;
}

.monitor-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.48fr);
  gap: 18px;
  align-items: start;
}

.monitor-form,
.monitor-panel {
  padding: 22px;
}

.monitor-form {
  display: grid;
  gap: 16px;
}

.monitor-form label {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.monitor-form input,
.monitor-form select,
.monitor-form textarea,
.filter-panel input,
.filter-panel select {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 11px 12px;
  background: white;
  color: var(--color-ink);
}

.monitor-form textarea {
  min-height: 120px;
  resize: vertical;
}

.form-grid,
.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  align-items: end;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-panel label {
  display: grid;
  gap: 7px;
  min-width: 0;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.filter-panel label:first-child {
  grid-column: span 2;
}

.monitor-table-wrap {
  overflow-x: auto;
}

.monitor-table {
  width: 100%;
  border-collapse: collapse;
}

.monitor-table th,
.monitor-table td {
  border-bottom: 1px solid var(--color-line);
  padding: 14px 10px;
  text-align: left;
  vertical-align: top;
}

.monitor-table th {
  color: var(--color-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.monitor-table td strong,
.monitor-table td span {
  display: block;
}

.monitor-table td span {
  color: var(--color-muted);
  line-height: 1.5;
}

.progress-track {
  width: 120px;
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8efea;
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.table-actions span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.compact {
  max-width: none;
  box-shadow: none;
}

@media (max-width: 1200px) {
  .monitor-layout {
    grid-template-columns: 1fr;
  }

  .form-grid,
  .form-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .filter-panel label:first-child {
    grid-column: span 1;
  }
}
</style>
