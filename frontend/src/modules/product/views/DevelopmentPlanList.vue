<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import CmsConfirmDialog from '@/modules/cms/components/content/CmsConfirmDialog.vue'
import CmsDataTable from '@/modules/cms/components/content/CmsDataTable.vue'
import CmsIcon from '@/modules/cms/components/CmsIcon.vue'
import ProductPlanForm from '@/modules/product/components/ProductPlanForm.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import {
  archiveDevelopmentPlan,
  createDevelopmentPlan,
  getDevelopmentPlans,
  getTourismAssets,
  updateDevelopmentPlan,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const props = defineProps({
  embedded: { type: Boolean, default: false },
})

const auth = useProductAccess()

const assets = ref([])
const plans = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const formOpen = ref(false)
const selectedPlan = ref(null)
const formError = ref('')
const saving = ref(false)
const confirmAction = ref(null)
const actionBusy = ref(false)

const filters = reactive({
  search: '',
  assetId: '',
  targetMarket: '',
})

const columns = [
  { key: 'plan', label: 'Plan' },
  { key: 'asset', label: 'Linked asset' },
  { key: 'targetMarket', label: 'Target market' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'actions', label: 'Actions' },
]

const canEditPlans = computed(() =>
  [USER_ROLES.TOURISM_STAFF, USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(
    auth.user?.role,
  ),
)

const canArchivePlans = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)

const selectableAssets = computed(() =>
  assets.value.filter((asset) => asset.developmentStatus !== 'Archived'),
)

const displayedPlans = computed(() => {
  if (!filters.assetId) return plans.value
  return plans.value.filter((plan) => plan.assetId === filters.assetId)
})

onMounted(loadPageData)

function planTitle(plan) {
  return plan?.title || plan?.planTitle || 'Untitled plan'
}

function canEditPlan(plan) {
  return canEditPlans.value && plan.planStatus !== 'Archived' && plan.assetStatus !== 'Archived'
}

function canArchivePlan(plan) {
  return canArchivePlans.value && plan.planStatus !== 'Archived'
}

function openCreate() {
  selectedPlan.value = null
  formError.value = ''
  formOpen.value = true
}

function openEdit(plan) {
  selectedPlan.value = plan
  formError.value = ''
  formOpen.value = true
}

function clearFilters() {
  filters.search = ''
  filters.assetId = ''
  filters.targetMarket = ''
  loadPlans()
}

async function loadAssets() {
  const response = await getTourismAssets()
  assets.value = response.data || []
}

async function loadPlans() {
  loading.value = true
  error.value = ''

  try {
    const response = await getDevelopmentPlans({
      search: filters.search,
      targetMarket: filters.targetMarket,
    })
    plans.value = (response.data || []).filter((plan) => plan.planStatus !== 'Archived')
  } catch (err) {
    error.value = err.message || 'Unable to load development plans.'
  } finally {
    loading.value = false
  }
}

async function loadPageData() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([loadAssets(), loadPlans()])
  } catch (err) {
    error.value = err.message || 'Unable to load development plan data.'
  } finally {
    loading.value = false
  }
}

async function submitPlan(payload) {
  saving.value = true
  formError.value = ''
  notice.value = ''

  try {
    if (selectedPlan.value?.id) {
      await updateDevelopmentPlan(selectedPlan.value.id, payload)
      notice.value = 'Development plan updated.'
    } else {
      await createDevelopmentPlan(payload)
      notice.value = 'Development plan created.'
    }

    formOpen.value = false
    await loadPageData()
  } catch (err) {
    formError.value = err.message || 'Unable to save development plan.'
  } finally {
    saving.value = false
  }
}

function askArchive(plan) {
  confirmAction.value = plan
}

async function archivePlan() {
  if (!confirmAction.value) return
  actionBusy.value = true
  error.value = ''
  notice.value = ''

  try {
    await archiveDevelopmentPlan(confirmAction.value.id)
    notice.value = 'Development plan archived.'
    confirmAction.value = null
    await loadPageData()
  } catch (err) {
    error.value = err.message || 'Unable to archive development plan.'
  } finally {
    actionBusy.value = false
  }
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

function formatTime(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{2}):(\d{2})/)
  if (!match) return String(value)
  const date = new Date()
  date.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDateTime(dateValue, timeValue) {
  const dateText = formatDate(dateValue)
  const timeText = formatTime(timeValue)
  return timeText ? `${dateText} ${timeText}` : dateText
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-plans-title">
    <header v-if="!props.embedded" class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-plans-title">Development Plans</h1>
        <span>Turn selected tourism assets into objectives, timelines, needs, and assigned work.</span>
      </div>
    </header>

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter development plans, but cannot create, edit, or archive records.
    </RoleNotice>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <section class="plan-toolbar" aria-label="Development plan filters">
      <label class="plan-toolbar__search">
        <span>Search</span>
        <CmsIcon name="search" />
        <input
          v-model="filters.search"
          type="search"
          placeholder="Search title, objective, need, or asset"
          @keyup.enter="loadPlans"
        />
      </label>

      <label class="plan-toolbar__field--wide">
        <span>Asset</span>
        <select v-model="filters.assetId">
          <option value="">All assets</option>
          <option v-for="asset in selectableAssets" :key="asset.id" :value="asset.id">
            {{ asset.name }}
          </option>
        </select>
      </label>

      <label>
        <span>Target market</span>
        <input v-model="filters.targetMarket" placeholder="Filter by market" @keyup.enter="loadPlans" />
      </label>

      <div class="plan-toolbar__actions">
        <button type="button" @click="loadPlans">Apply</button>
        <button type="button" @click="clearFilters">Clear</button>
        <button
          v-if="canEditPlans"
          class="plan-toolbar__create"
          type="button"
          :disabled="!selectableAssets.length"
          @click="openCreate"
        >
          <span aria-hidden="true">+</span>
          Create plan
        </button>
      </div>
    </section>

    <div v-if="canEditPlans && !selectableAssets.length" class="plan-warning" role="status">
      Add or restore a non-archived tourism asset before creating a development plan.
    </div>

    <CmsDataTable
      :columns="columns"
      :items="displayedPlans"
      :loading="loading"
      :error="error"
      empty-title="No development plans found"
      empty-text="Create the first plan from an active tourism asset or adjust your filters."
      @retry="loadPageData"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="plan in tableItems" :key="plan.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ planTitle(plan) }}</strong>
              <span>{{ plan.objectives }}</span>
              <span v-if="plan.remarks">{{ plan.remarks }}</span>
            </span>
          </td>
          <td>
            <span class="cms-table-title">
              <strong>{{ plan.assetName }}</strong>
            </span>
          </td>
          <td>{{ plan.targetMarket }}</td>
          <td>
            <span class="plan-timeline">
              <span>{{ formatDateTime(plan.timelineStart, plan.timelineStartTime) }}</span>
              <span>{{ formatDateTime(plan.timelineEnd, plan.timelineEndTime) }}</span>
            </span>
          </td>
          <td>
            <span class="cms-table-actions product-table-actions">
              <button v-if="canEditPlan(plan)" type="button" @click="openEdit(plan)">Edit</button>
              <button v-if="canArchivePlan(plan)" class="is-danger" type="button" @click="askArchive(plan)">
                Archive
              </button>
              <span v-if="auth.isViewOnly">View only</span>
              <span v-else-if="plan.assetStatus === 'Archived'">Asset archived</span>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="plan in cardItems" :key="plan.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ planTitle(plan) }}</strong>
            <span>{{ plan.objectives }}</span>
          </span>
          <div class="cms-mobile-meta">
            <span>{{ plan.assetName }}</span>
          </div>
          <span>{{ plan.targetMarket }}</span>
          <span>
            {{ formatDateTime(plan.timelineStart, plan.timelineStartTime) }} to
            {{ formatDateTime(plan.timelineEnd, plan.timelineEndTime) }}
          </span>
          <div class="cms-mobile-card__actions cms-table-actions product-table-actions">
            <button v-if="canEditPlan(plan)" type="button" @click="openEdit(plan)">Edit</button>
            <button v-if="canArchivePlan(plan)" class="is-danger" type="button" @click="askArchive(plan)">
              Archive
            </button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <div class="plan-pagination">
      <div>
        <strong>{{ displayedPlans.length }} records</strong>
        <span>Use Archive to remove plans from active product development work.</span>
      </div>
    </div>

    <ProductPlanForm
      :open="formOpen"
      :value="selectedPlan"
      :assets="selectableAssets"
      :busy="saving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitPlan"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      title="Archive this development plan?"
      message="Archived development plans are removed from active Product Development planning and downstream selection."
      confirm-label="Archive"
      tone="danger"
      :busy="actionBusy"
      @cancel="confirmAction = null"
      @confirm="archivePlan"
    />
  </section>
</template>

<style scoped>
@import '@/modules/cms/views/content/cms-content-page.css';

.plan-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.plan-toolbar label {
  display: grid;
  flex: 1 0 172px;
  gap: 7px;
  min-width: min(100%, 172px);
}

.plan-toolbar__field--wide {
  flex-basis: 230px !important;
  min-width: min(100%, 230px) !important;
}

.plan-toolbar__search {
  position: relative;
  flex: 2 0 280px !important;
  min-width: min(100%, 280px) !important;
}

.plan-toolbar span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.plan-toolbar__search svg {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

.plan-toolbar input,
.plan-toolbar select {
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

.plan-toolbar__search input {
  padding-left: 38px;
}

.plan-toolbar input:focus,
.plan-toolbar select:focus,
.plan-toolbar button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 1px;
}

.plan-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.plan-toolbar button {
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

.plan-toolbar__create {
  color: #fff !important;
  border-color: #0f766e !important;
  background: #0f766e !important;
  white-space: nowrap;
}

.plan-toolbar__create:hover {
  background: #115e59 !important;
}

.plan-toolbar__create:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.plan-warning {
  padding: 12px 14px;
  color: #92400e;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #ffedd5;
  font-weight: 800;
}

.plan-timeline {
  display: grid;
  gap: 3px;
  color: #334155;
}

:deep(.cms-data-table__desktop table) {
  min-width: 1100px;
}

:deep(.cms-data-table__desktop th),
:deep(.cms-data-table__desktop td) {
  padding-block: 16px;
}

:deep(.cms-table-title) {
  max-width: 480px;
}

:deep(.cms-table-title strong) {
  font-size: 0.95rem;
  line-height: 1.35;
}

:deep(.cms-table-title span) {
  line-height: 1.45;
}

:deep(.product-table-actions) {
  flex-wrap: nowrap;
  min-width: 150px;
  justify-content: flex-end;
}

:deep(.product-table-actions button) {
  min-width: 64px;
}

.plan-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.plan-pagination div {
  display: grid;
  gap: 2px;
}

.plan-pagination strong {
  color: #0f172a;
}

.plan-pagination span {
  color: #64748b;
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .plan-toolbar__actions {
    margin-left: 0;
  }
}

@media (max-width: 760px) {
  .plan-toolbar__actions,
  .plan-toolbar__actions button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .plan-toolbar label,
  .plan-toolbar__search {
    flex-basis: 100% !important;
    width: 100%;
  }
}
</style>
