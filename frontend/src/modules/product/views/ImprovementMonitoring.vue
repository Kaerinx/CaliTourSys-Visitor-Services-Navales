<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import CmsConfirmDialog from '@/modules/cms/components/content/CmsConfirmDialog.vue'
import CmsDataTable from '@/modules/cms/components/content/CmsDataTable.vue'
import CmsIcon from '@/modules/cms/components/CmsIcon.vue'
import ProductImprovementForm from '@/modules/product/components/ProductImprovementForm.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
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
const error = ref('')
const notice = ref('')
const formOpen = ref(false)
const selectedImprovement = ref(null)
const formError = ref('')
const saving = ref(false)
const confirmAction = ref(null)
const actionBusy = ref(false)

const filters = reactive({
  search: '',
  planId: '',
  status: '',
  dateFrom: '',
  dateTo: '',
})

const columns = [
  { key: 'plan', label: 'Plan' },
  { key: 'progress', label: 'Progress' },
  { key: 'status', label: 'Status' },
  { key: 'updateDate', label: 'Update' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'actions', label: 'Actions' },
]

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

const displayedImprovements = computed(() =>
  improvements.value.filter((improvement) => {
    if (filters.planId && improvement.planId !== filters.planId) return false
    if (filters.dateFrom && compareDate(improvement.updateDate, filters.dateFrom) < 0) return false
    if (filters.dateTo && compareDate(improvement.updateDate, filters.dateTo) > 0) return false
    return true
  }),
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

onMounted(loadPageData)

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

function openCreate() {
  selectedImprovement.value = null
  formError.value = ''
  formOpen.value = true
}

function openEdit(improvement) {
  selectedImprovement.value = improvement
  formError.value = ''
  formOpen.value = true
}

function clearFilters() {
  filters.search = ''
  filters.planId = ''
  filters.status = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  loadImprovements()
}

async function loadPlans() {
  const response = await getDevelopmentPlans()
  plans.value = response.data || []
}

async function loadImprovements() {
  loading.value = true
  error.value = ''

  try {
    const response = await getImprovementRecords({
      search: filters.search,
      status: filters.status,
    })
    improvements.value = response.data || []
  } catch (err) {
    error.value = err.message || 'Unable to load improvement records.'
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
    error.value = err.message || 'Unable to load improvement data.'
  } finally {
    loading.value = false
  }
}

async function submitImprovement(payload) {
  saving.value = true
  formError.value = ''
  notice.value = ''

  try {
    if (selectedImprovement.value?.id) {
      await updateImprovementRecord(selectedImprovement.value.id, payload)
      notice.value = 'Improvement record updated.'
    } else {
      await createImprovementRecord(payload)
      notice.value = 'Improvement record created.'
    }

    formOpen.value = false
    await loadPageData()
  } catch (err) {
    formError.value = err.message || 'Unable to save improvement record.'
  } finally {
    saving.value = false
  }
}

function askArchive(improvement) {
  confirmAction.value = improvement
}

async function archiveImprovement() {
  if (!confirmAction.value) return
  actionBusy.value = true
  error.value = ''
  notice.value = ''

  try {
    await archiveImprovementRecord(confirmAction.value.id)
    notice.value = 'Improvement record archived.'
    confirmAction.value = null
    await loadPageData()
  } catch (err) {
    error.value = err.message || 'Unable to archive improvement record.'
  } finally {
    actionBusy.value = false
  }
}

function compareDate(value, compareTo) {
  const date = new Date(value).setHours(0, 0, 0, 0)
  const other = new Date(compareTo).setHours(0, 0, 0, 0)
  if (Number.isNaN(date) || Number.isNaN(other)) return 0
  return date - other
}

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-improvements-title">
    <header class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-improvements-title">Improvements</h1>
        <span>Track progress, delays, completed work, and readiness signals across development plans.</span>
      </div>
    </header>

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter improvement records, but cannot create, edit, or archive records.
    </RoleNotice>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <section class="improvement-toolbar" aria-label="Improvement filters">
      <label class="improvement-toolbar__search">
        <span>Search</span>
        <CmsIcon name="search" />
        <input
          v-model="filters.search"
          type="search"
          placeholder="Search remarks, plan, or asset"
          @keyup.enter="loadImprovements"
        />
      </label>

      <label class="improvement-toolbar__field--wide">
        <span>Plan</span>
        <select v-model="filters.planId">
          <option value="">All plans</option>
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">
            {{ plan.title || plan.planTitle }}
          </option>
        </select>
      </label>

      <label>
        <span>Status</span>
        <select v-model="filters.status" @change="loadImprovements">
          <option value="">All statuses</option>
          <option v-for="status in IMPROVEMENT_STATUSES" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </label>

      <label>
        <span>Date from</span>
        <input v-model="filters.dateFrom" type="date" />
      </label>

      <label>
        <span>Date to</span>
        <input v-model="filters.dateTo" type="date" />
      </label>

      <div class="improvement-toolbar__actions">
        <button type="button" @click="loadImprovements">Apply</button>
        <button type="button" @click="clearFilters">Clear</button>
        <button
          v-if="canEditImprovements"
          class="improvement-toolbar__create"
          type="button"
          :disabled="!selectablePlans.length"
          @click="openCreate"
        >
          <span aria-hidden="true">+</span>
          Create improvement
        </button>
      </div>
    </section>

    <div v-if="canEditImprovements && !selectablePlans.length" class="improvement-warning" role="status">
      Create a non-archived development plan before recording improvement progress.
    </div>

    <CmsDataTable
      :columns="columns"
      :items="displayedImprovements"
      :loading="loading"
      :error="error"
      empty-title="No improvement records found"
      empty-text="Create the first progress update from an active development plan or adjust your filters."
      @retry="loadPageData"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="improvement in tableItems" :key="improvement.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ improvement.planTitle }}</strong>
              <span>{{ improvement.assetName }}</span>
            </span>
          </td>
          <td>
            <span class="improvement-progress">
              <strong>{{ improvement.progressPercentage }}%</strong>
              <span>
                <i :style="{ width: `${improvement.progressPercentage}%` }"></i>
              </span>
            </span>
          </td>
          <td>
            <span class="improvement-status" :data-status="improvement.improvementStatus">
              {{ improvement.improvementStatus }}
            </span>
          </td>
          <td>{{ formatDate(improvement.updateDate) }}</td>
          <td>{{ improvement.remarks }}</td>
          <td>
            <span class="cms-table-actions">
              <button v-if="canEditImprovement(improvement)" type="button" @click="openEdit(improvement)">
                Edit
              </button>
              <button
                v-if="canArchiveImprovement(improvement)"
                class="is-danger"
                type="button"
                @click="askArchive(improvement)"
              >
                Archive
              </button>
              <span v-if="auth.isViewOnly">View only</span>
              <span v-else-if="improvement.planStatus === 'Archived'">Plan archived</span>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="improvement in cardItems" :key="improvement.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ improvement.planTitle }}</strong>
            <span>{{ improvement.assetName }}</span>
          </span>
          <div class="cms-mobile-meta">
            <span class="improvement-status" :data-status="improvement.improvementStatus">
              {{ improvement.improvementStatus }}
            </span>
            <span>{{ formatDate(improvement.updateDate) }}</span>
          </div>
          <span class="improvement-progress">
            <strong>{{ improvement.progressPercentage }}%</strong>
            <span>
              <i :style="{ width: `${improvement.progressPercentage}%` }"></i>
            </span>
          </span>
          <span>{{ improvement.remarks }}</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button v-if="canEditImprovement(improvement)" type="button" @click="openEdit(improvement)">
              Edit
            </button>
            <button
              v-if="canArchiveImprovement(improvement)"
              class="is-danger"
              type="button"
              @click="askArchive(improvement)"
            >
              Archive
            </button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <div class="improvement-pagination">
      <div>
        <strong>{{ displayedImprovements.length }} records</strong>
        <span>{{ activeImprovements }} active, {{ delayedImprovements }} delayed, {{ completedImprovements }} completed</span>
      </div>
    </div>

    <ProductImprovementForm
      :open="formOpen"
      :value="selectedImprovement"
      :plans="selectablePlans"
      :busy="saving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitImprovement"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      title="Archive this improvement record?"
      message="Archived improvement records are removed from active progress monitoring but remain available for records."
      confirm-label="Archive"
      tone="danger"
      :busy="actionBusy"
      @cancel="confirmAction = null"
      @confirm="archiveImprovement"
    />
  </section>
</template>

<style scoped>
@import '@/modules/cms/views/content/cms-content-page.css';

.improvement-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.improvement-toolbar label {
  display: grid;
  flex: 1 0 172px;
  gap: 7px;
  min-width: min(100%, 172px);
}

.improvement-toolbar__field--wide {
  flex-basis: 230px !important;
  min-width: min(100%, 230px) !important;
}

.improvement-toolbar__search {
  position: relative;
  flex: 2 0 280px !important;
  min-width: min(100%, 280px) !important;
}

.improvement-toolbar span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.improvement-toolbar__search svg {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

.improvement-toolbar input,
.improvement-toolbar select {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0 12px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

.improvement-toolbar__search input {
  padding-left: 38px;
}

.improvement-toolbar input:focus,
.improvement-toolbar select:focus,
.improvement-toolbar button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 1px;
}

.improvement-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.improvement-toolbar button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 800;
}

.improvement-toolbar__create {
  color: #fff !important;
  border-color: #0f766e !important;
  background: #0f766e !important;
  white-space: nowrap;
}

.improvement-toolbar__create:hover {
  background: #115e59 !important;
}

.improvement-toolbar__create:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.improvement-warning {
  padding: 12px 14px;
  color: #92400e;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #ffedd5;
  font-weight: 800;
}

.improvement-progress {
  display: grid;
  gap: 7px;
  min-width: 130px;
}

.improvement-progress strong {
  color: #0f172a;
}

.improvement-progress > span {
  display: block;
  width: 130px;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.improvement-progress i {
  display: block;
  height: 100%;
  max-width: 100%;
  border-radius: inherit;
  background: #0f766e;
}

.improvement-status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 0.78rem;
  font-weight: 800;
}

.improvement-status[data-status='Not Started'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.improvement-status[data-status='Ongoing'],
.improvement-status[data-status='Completed'] {
  color: #0f766e;
  border-color: #99f6e4;
  background: #ccfbf1;
}

.improvement-status[data-status='Delayed'],
.improvement-status[data-status='On Hold'] {
  color: #92400e;
  border-color: #fed7aa;
  background: #ffedd5;
}

.improvement-status[data-status='Archived'] {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.improvement-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.improvement-pagination div {
  display: grid;
  gap: 2px;
}

.improvement-pagination strong {
  color: #0f172a;
}

.improvement-pagination span {
  color: #64748b;
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .improvement-toolbar__actions {
    margin-left: 0;
  }
}

@media (max-width: 760px) {
  .improvement-toolbar__actions,
  .improvement-toolbar__actions button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .improvement-toolbar label,
  .improvement-toolbar__search {
    flex-basis: 100% !important;
    width: 100%;
  }
}
</style>
