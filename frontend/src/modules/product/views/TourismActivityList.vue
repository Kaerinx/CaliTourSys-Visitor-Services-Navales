<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import CmsConfirmDialog from '@/modules/cms/components/content/CmsConfirmDialog.vue'
import CmsDataTable from '@/modules/cms/components/content/CmsDataTable.vue'
import CmsIcon from '@/modules/cms/components/CmsIcon.vue'
import ProductActivityForm from '@/modules/product/components/ProductActivityForm.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { ACTIVITY_STATUSES } from '@/modules/product/constants/productOptions'
import {
  archiveTourismActivity,
  createTourismActivity,
  getDevelopmentPlans,
  getTourismActivities,
  getTourismAssets,
  updateTourismActivity,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const auth = useProductAccess()

const assets = ref([])
const plans = ref([])
const activities = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const formOpen = ref(false)
const selectedActivity = ref(null)
const formError = ref('')
const saving = ref(false)
const confirmAction = ref(null)
const actionBusy = ref(false)

const filters = reactive({
  search: '',
  assetId: '',
  planId: '',
  status: '',
  targetMarket: '',
})

const columns = [
  { key: 'activity', label: 'Activity' },
  { key: 'asset', label: 'Linked asset' },
  { key: 'plan', label: 'Plan' },
  { key: 'duration', label: 'Duration' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const canEditActivities = computed(() =>
  [USER_ROLES.TOURISM_STAFF, USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(
    auth.user?.role,
  ),
)

const canArchiveActivities = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)

const selectableAssets = computed(() =>
  assets.value.filter((asset) => asset.developmentStatus !== 'Archived'),
)

const activePlans = computed(() =>
  plans.value.filter((plan) => plan.planStatus !== 'Archived' && plan.assetStatus !== 'Archived'),
)

const activeActivities = computed(() =>
  activities.value.filter((activity) => activity.activityStatus !== 'Archived').length,
)
const readyActivities = computed(() =>
  activities.value.filter((activity) => activity.activityStatus === 'Ready for Promotion').length,
)
const archivedActivities = computed(() =>
  activities.value.filter((activity) => activity.activityStatus === 'Archived').length,
)

onMounted(loadPageData)

function canEditActivity(activity) {
  return (
    canEditActivities.value &&
    activity.activityStatus !== 'Archived' &&
    activity.assetStatus !== 'Archived' &&
    activity.planStatus !== 'Archived'
  )
}

function canArchiveActivity(activity) {
  return canArchiveActivities.value && activity.activityStatus !== 'Archived'
}

function openCreate() {
  selectedActivity.value = null
  formError.value = ''
  formOpen.value = true
}

function openEdit(activity) {
  selectedActivity.value = activity
  formError.value = ''
  formOpen.value = true
}

function clearFilters() {
  filters.search = ''
  filters.assetId = ''
  filters.planId = ''
  filters.status = ''
  filters.targetMarket = ''
  loadActivities()
}

async function loadAssets() {
  const response = await getTourismAssets()
  assets.value = response.data || []
}

async function loadPlans() {
  const response = await getDevelopmentPlans()
  plans.value = response.data || []
}

async function loadActivities() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismActivities({
      search: filters.search,
      assetId: filters.assetId,
      planId: filters.planId,
      status: filters.status,
      targetMarket: filters.targetMarket,
    })
    activities.value = response.data || []
  } catch (err) {
    error.value = err.message || 'Unable to load tourism activities.'
  } finally {
    loading.value = false
  }
}

async function loadPageData() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([loadAssets(), loadPlans(), loadActivities()])
  } catch (err) {
    error.value = err.message || 'Unable to load tourism activity data.'
  } finally {
    loading.value = false
  }
}

async function submitActivity(payload) {
  saving.value = true
  formError.value = ''
  notice.value = ''

  try {
    if (selectedActivity.value?.id) {
      await updateTourismActivity(selectedActivity.value.id, payload)
      notice.value = 'Tourism activity updated.'
    } else {
      await createTourismActivity(payload)
      notice.value = 'Tourism activity created.'
    }

    formOpen.value = false
    await loadPageData()
  } catch (err) {
    formError.value = err.message || 'Unable to save tourism activity.'
  } finally {
    saving.value = false
  }
}

function askArchive(activity) {
  confirmAction.value = activity
}

async function archiveActivity() {
  if (!confirmAction.value) return
  actionBusy.value = true
  error.value = ''
  notice.value = ''

  try {
    await archiveTourismActivity(confirmAction.value.id)
    notice.value = 'Tourism activity archived.'
    confirmAction.value = null
    await loadPageData()
  } catch (err) {
    error.value = err.message || 'Unable to archive tourism activity.'
  } finally {
    actionBusy.value = false
  }
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-activities-title">
    <header class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-activities-title">Activities</h1>
        <span>Design visitor-ready tourism activities linked to assets and optional development plans.</span>
      </div>
    </header>

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter tourism activities, but cannot create, edit, or archive records.
    </RoleNotice>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <section class="activity-toolbar" aria-label="Activity filters">
      <label class="activity-toolbar__search">
        <span>Search</span>
        <CmsIcon name="search" />
        <input
          v-model="filters.search"
          type="search"
          placeholder="Search activity, description, asset, or plan"
          @keyup.enter="loadActivities"
        />
      </label>

      <label class="activity-toolbar__field--wide">
        <span>Asset</span>
        <select v-model="filters.assetId" @change="loadActivities">
          <option value="">All assets</option>
          <option v-for="asset in assets" :key="asset.id" :value="asset.id">
            {{ asset.name }}
          </option>
        </select>
      </label>

      <label class="activity-toolbar__field--wide">
        <span>Plan</span>
        <select v-model="filters.planId" @change="loadActivities">
          <option value="">All plans</option>
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">
            {{ plan.title || plan.planTitle }}
          </option>
        </select>
      </label>

      <label>
        <span>Status</span>
        <select v-model="filters.status" @change="loadActivities">
          <option value="">All statuses</option>
          <option v-for="status in ACTIVITY_STATUSES" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </label>

      <label>
        <span>Target market</span>
        <input v-model="filters.targetMarket" placeholder="Filter by market" @keyup.enter="loadActivities" />
      </label>

      <div class="activity-toolbar__actions">
        <button type="button" @click="loadActivities">Apply</button>
        <button type="button" @click="clearFilters">Clear</button>
        <button
          v-if="canEditActivities"
          class="activity-toolbar__create"
          type="button"
          :disabled="!selectableAssets.length"
          @click="openCreate"
        >
          <span aria-hidden="true">+</span>
          Create activity
        </button>
      </div>
    </section>

    <div v-if="canEditActivities && !selectableAssets.length" class="activity-warning" role="status">
      Add or restore a non-archived tourism asset before creating tourism activities.
    </div>

    <CmsDataTable
      :columns="columns"
      :items="activities"
      :loading="loading"
      :error="error"
      empty-title="No tourism activities found"
      empty-text="Create the first activity from an active tourism asset or adjust your filters."
      @retry="loadPageData"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="activity in tableItems" :key="activity.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ activity.name }}</strong>
              <span>{{ activity.description }}</span>
              <span>{{ activity.targetMarket }}</span>
            </span>
          </td>
          <td>
            <span class="cms-table-title">
              <strong>{{ activity.assetName }}</strong>
              <span>{{ activity.assetStatus }}</span>
            </span>
          </td>
          <td>{{ activity.planTitle || 'No linked plan' }}</td>
          <td>
            <span class="activity-duration">{{ activity.duration }}</span>
          </td>
          <td>
            <span class="activity-status" :data-status="activity.activityStatus">
              {{ activity.activityStatus }}
            </span>
          </td>
          <td>
            <span class="cms-table-actions">
              <button v-if="canEditActivity(activity)" type="button" @click="openEdit(activity)">Edit</button>
              <button
                v-if="canArchiveActivity(activity)"
                class="is-danger"
                type="button"
                @click="askArchive(activity)"
              >
                Archive
              </button>
              <span v-if="auth.isViewOnly">View only</span>
              <span v-else-if="activity.assetStatus === 'Archived'">Asset archived</span>
              <span v-else-if="activity.planStatus === 'Archived'">Plan archived</span>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="activity in cardItems" :key="activity.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ activity.name }}</strong>
            <span>{{ activity.description }}</span>
          </span>
          <div class="cms-mobile-meta">
            <span class="activity-status" :data-status="activity.activityStatus">
              {{ activity.activityStatus }}
            </span>
            <span>{{ activity.duration }}</span>
          </div>
          <span>{{ activity.assetName }}</span>
          <span>{{ activity.planTitle || 'No linked plan' }}</span>
          <span>{{ activity.targetMarket }}</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button v-if="canEditActivity(activity)" type="button" @click="openEdit(activity)">Edit</button>
            <button
              v-if="canArchiveActivity(activity)"
              class="is-danger"
              type="button"
              @click="askArchive(activity)"
            >
              Archive
            </button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <div class="activity-pagination">
      <div>
        <strong>{{ activities.length }} records</strong>
        <span>{{ activeActivities }} active, {{ readyActivities }} ready, {{ archivedActivities }} archived</span>
      </div>
    </div>

    <ProductActivityForm
      :open="formOpen"
      :value="selectedActivity"
      :assets="selectableAssets"
      :plans="activePlans"
      :busy="saving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitActivity"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      title="Archive this tourism activity?"
      message="Archived tourism activities are removed from active package selection but remain available for records."
      confirm-label="Archive"
      tone="danger"
      :busy="actionBusy"
      @cancel="confirmAction = null"
      @confirm="archiveActivity"
    />
  </section>
</template>

<style scoped>
@import '@/modules/cms/views/content/cms-content-page.css';

.activity-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.activity-toolbar label {
  display: grid;
  flex: 1 0 172px;
  gap: 7px;
  min-width: min(100%, 172px);
}

.activity-toolbar__field--wide {
  flex-basis: 230px !important;
  min-width: min(100%, 230px) !important;
}

.activity-toolbar__search {
  position: relative;
  flex: 2 0 280px !important;
  min-width: min(100%, 280px) !important;
}

.activity-toolbar span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.activity-toolbar__search svg {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

.activity-toolbar input,
.activity-toolbar select {
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

.activity-toolbar__search input {
  padding-left: 38px;
}

.activity-toolbar input:focus,
.activity-toolbar select:focus,
.activity-toolbar button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 1px;
}

.activity-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.activity-toolbar button {
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

.activity-toolbar__create {
  color: #fff !important;
  border-color: #0f766e !important;
  background: #0f766e !important;
  white-space: nowrap;
}

.activity-toolbar__create:hover {
  background: #115e59 !important;
}

.activity-toolbar__create:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.activity-warning {
  padding: 12px 14px;
  color: #92400e;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #ffedd5;
  font-weight: 800;
}

.activity-duration {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.activity-status {
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

.activity-status[data-status='Draft'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.activity-status[data-status='In Development'] {
  color: #0f766e;
  border-color: #99f6e4;
  background: #ccfbf1;
}

.activity-status[data-status='For Review'] {
  color: #92400e;
  border-color: #fed7aa;
  background: #ffedd5;
}

.activity-status[data-status='Ready for Promotion'] {
  color: #166534;
  border-color: #bbf7d0;
  background: #dcfce7;
}

.activity-status[data-status='Archived'] {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.activity-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.activity-pagination div {
  display: grid;
  gap: 2px;
}

.activity-pagination strong {
  color: #0f172a;
}

.activity-pagination span {
  color: #64748b;
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .activity-toolbar__actions {
    margin-left: 0;
  }
}

@media (max-width: 760px) {
  .activity-toolbar__actions,
  .activity-toolbar__actions button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .activity-toolbar label,
  .activity-toolbar__search {
    flex-basis: 100% !important;
    width: 100%;
  }
}
</style>
