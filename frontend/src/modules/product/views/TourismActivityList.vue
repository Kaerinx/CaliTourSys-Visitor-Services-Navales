<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import FilterActions from '@/modules/product/components/FilterActions.vue'
import ModuleStats from '@/modules/product/components/ModuleStats.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import StatusPill from '@/modules/product/components/StatusPill.vue'
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
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingActivityId = ref(null)

const filters = reactive({
  search: '',
  assetId: '',
  planId: '',
  status: '',
  targetMarket: '',
})

const form = reactive({
  assetId: '',
  planId: '',
  name: '',
  description: '',
  duration: '',
  targetMarket: '',
  activityStatus: 'Draft',
  remarks: '',
})

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
const selectablePlans = computed(() =>
  plans.value.filter(
    (plan) =>
      plan.planStatus !== 'Archived' &&
      plan.assetStatus !== 'Archived' &&
      (!form.assetId || plan.assetId === form.assetId),
  ),
)
const selectedAsset = computed(() => selectableAssets.value.find((asset) => asset.id === form.assetId))
const activeActivities = computed(() =>
  activities.value.filter((activity) => activity.activityStatus !== 'Archived').length,
)
const readyActivities = computed(() =>
  activities.value.filter((activity) => activity.activityStatus === 'Ready for Promotion').length,
)
const archivedActivities = computed(() =>
  activities.value.filter((activity) => activity.activityStatus === 'Archived').length,
)
const activityStats = computed(() => [
  { label: 'Total activities', value: activities.value.length },
  { label: 'Active activities', value: activeActivities.value },
  { label: 'Ready', value: readyActivities.value },
  { label: 'Archived', value: archivedActivities.value },
])

function resetForm() {
  editingActivityId.value = null
  form.assetId = ''
  form.planId = ''
  form.name = ''
  form.description = ''
  form.duration = ''
  form.targetMarket = ''
  form.activityStatus = 'Draft'
  form.remarks = ''
}

function clearFilters() {
  filters.search = ''
  filters.assetId = ''
  filters.planId = ''
  filters.status = ''
  filters.targetMarket = ''
  loadActivities()
}

function syncFromAsset() {
  if (selectedAsset.value && !form.targetMarket) {
    form.targetMarket = selectedAsset.value.targetMarket
  }

  if (form.planId && !selectablePlans.value.some((plan) => plan.id === form.planId)) {
    form.planId = ''
  }
}

function canEditActivity(activity) {
  return canEditActivities.value && activity.activityStatus !== 'Archived' && activity.assetStatus !== 'Archived'
}

function canArchiveActivity(activity) {
  return canArchiveActivities.value && activity.activityStatus !== 'Archived'
}

function editActivity(activity) {
  editingActivityId.value = activity.id
  form.assetId = activity.assetId
  form.planId = activity.planId || ''
  form.name = activity.name
  form.description = activity.description
  form.duration = activity.duration
  form.targetMarket = activity.targetMarket
  form.activityStatus = activity.activityStatus
  form.remarks = activity.remarks || ''
}

async function loadAssets() {
  const response = await getTourismAssets()
  assets.value = response.data
}

async function loadPlans() {
  const response = await getDevelopmentPlans()
  plans.value = response.data
}

async function loadActivities() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismActivities(filters)
    activities.value = response.data
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
    await Promise.all([loadAssets(), loadPlans(), loadActivities()])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function saveActivity() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingActivityId.value) {
      await updateTourismActivity(editingActivityId.value, form)
      success.value = 'Tourism activity updated successfully.'
    } else {
      await createTourismActivity(form)
      success.value = 'Tourism activity created successfully.'
    }

    resetForm()
    await loadPageData()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function archiveActivity(activity) {
  const confirmed = window.confirm(`Archive "${activity.name}"?`)

  if (!confirmed) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await archiveTourismActivity(activity.id)
    success.value = 'Tourism activity archived successfully.'
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
      <p class="eyebrow">Activity Records</p>
      <h1>Tourism Activity Management</h1>
      <p>
        Maintain tourism activities connected to active assets and optional development plans for
        future package creation.
      </p>
    </div>

    <ModuleStats :items="activityStats" />

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter tourism activities, but cannot create, edit, or archive
      records.
    </RoleNotice>

    <div class="activity-layout">
      <form v-if="canEditActivities" class="activity-form" @submit.prevent="saveActivity">
        <div>
          <p class="eyebrow">{{ editingActivityId ? 'Edit activity' : 'New activity' }}</p>
          <h2>{{ editingActivityId ? 'Update tourism activity' : 'Create tourism activity' }}</h2>
        </div>

        <p v-if="!selectableAssets.length" class="form-error">
          Add or restore a non-archived tourism asset before creating tourism activities.
        </p>

        <label>
          Tourism Asset
          <select v-model="form.assetId" required @change="syncFromAsset">
            <option value="">Select non-archived asset</option>
            <option v-for="asset in selectableAssets" :key="asset.id" :value="asset.id">
              {{ asset.name }} - {{ asset.developmentStatus }}
            </option>
          </select>
        </label>

        <label>
          Development Plan
          <select v-model="form.planId">
            <option value="">No linked plan</option>
            <option v-for="plan in selectablePlans" :key="plan.id" :value="plan.id">
              {{ plan.planTitle }}
            </option>
          </select>
        </label>

        <label>
          Activity Name
          <input v-model="form.name" required placeholder="Example: Guided mangrove walk" />
        </label>

        <label>
          Description
          <textarea
            v-model="form.description"
            required
            placeholder="Describe the tourism activity experience and purpose."
          ></textarea>
        </label>

        <div class="form-grid">
          <label>
            Duration
            <input v-model="form.duration" required placeholder="Example: 2 hours" />
          </label>

          <label>
            Target Market
            <input v-model="form.targetMarket" required placeholder="Families, students, eco-tourists" />
          </label>
        </div>

        <label>
          Activity Status
          <select v-model="form.activityStatus" required>
            <option v-for="status in ACTIVITY_STATUSES" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>

        <label>
          Remarks
          <textarea v-model="form.remarks" placeholder="Optional activity notes"></textarea>
        </label>

        <div class="form-actions">
          <button class="primary-button" :disabled="saving || !selectableAssets.length" type="submit">
            {{ saving ? 'Saving...' : editingActivityId ? 'Save Changes' : 'Create Activity' }}
          </button>
          <button v-if="editingActivityId" class="secondary-button" type="button" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>

      <section class="activity-panel">
        <div class="filter-panel">
          <label>
            Search
            <input v-model="filters.search" placeholder="Search activity, description, or asset" />
          </label>
          <label>
            Asset
            <select v-model="filters.assetId">
              <option value="">All assets</option>
              <option v-for="asset in assets" :key="asset.id" :value="asset.id">
                {{ asset.name }}
              </option>
            </select>
          </label>
          <label>
            Status
            <select v-model="filters.status">
              <option value="">All statuses</option>
              <option v-for="status in ACTIVITY_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
          <label>
            Target Market
            <input v-model="filters.targetMarket" placeholder="Filter by target market" />
          </label>
          <FilterActions @apply="loadActivities" @clear="clearFilters" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="success" class="form-success">{{ success }}</p>

        <div v-if="loading" class="empty-state compact">
          <h2>Loading tourism activities...</h2>
        </div>

        <div v-else-if="!activities.length" class="empty-state compact">
          <h2>No tourism activities found</h2>
          <p>Create the first activity from an active tourism asset or adjust the filters.</p>
        </div>

        <div v-else class="activity-table-wrap">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Asset</th>
                <th>Plan</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in activities" :key="activity.id">
                <td>
                  <strong>{{ activity.name }}</strong>
                  <span>{{ activity.description }}</span>
                  <small>{{ activity.targetMarket }}</small>
                </td>
                <td>
                  <strong>{{ activity.assetName }}</strong>
                  <span>{{ activity.assetStatus }}</span>
                </td>
                <td>{{ activity.planTitle || 'No linked plan' }}</td>
                <td>{{ activity.duration }}</td>
                <td>
                  <StatusPill :status="activity.activityStatus" />
                </td>
                <td>
                  <div class="table-actions">
                    <button
                      v-if="canEditActivity(activity)"
                      class="secondary-button"
                      type="button"
                      @click="editActivity(activity)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="canArchiveActivity(activity)"
                      class="danger-button"
                      type="button"
                      @click="archiveActivity(activity)"
                    >
                      Archive
                    </button>
                    <span v-if="auth.isViewOnly">View only</span>
                    <span v-else-if="activity.assetStatus === 'Archived'">Asset archived</span>
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
.activity-form,
.activity-panel {
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.activity-panel {
  overflow: hidden;
}

.activity-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.48fr);
  gap: 18px;
  align-items: start;
}

.activity-form,
.activity-panel {
  padding: 22px;
}

.activity-form {
  display: grid;
  gap: 16px;
}

.activity-form label {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.activity-form input,
.activity-form select,
.activity-form textarea,
.filter-panel input,
.filter-panel select {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 11px 12px;
  background: white;
  color: var(--color-ink);
}

.activity-form textarea {
  min-height: 96px;
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

.activity-table-wrap {
  overflow-x: auto;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table th,
.activity-table td {
  border-bottom: 1px solid var(--color-line);
  padding: 14px 10px;
  text-align: left;
  vertical-align: top;
}

.activity-table th {
  color: var(--color-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.activity-table td strong,
.activity-table td span,
.activity-table td small {
  display: block;
}

.activity-table td strong {
  margin-bottom: 4px;
}

.activity-table td span,
.activity-table td small {
  color: var(--color-muted);
  line-height: 1.5;
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
  .activity-layout {
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
