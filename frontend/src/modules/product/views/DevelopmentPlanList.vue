<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import FilterActions from '@/modules/product/components/FilterActions.vue'
import ModuleStats from '@/modules/product/components/ModuleStats.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import StatusPill from '@/modules/product/components/StatusPill.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { DEVELOPMENT_PLAN_STATUSES } from '@/modules/product/constants/productOptions'
import {
  archiveDevelopmentPlan,
  createDevelopmentPlan,
  getDevelopmentPlans,
  getTourismAssets,
  updateDevelopmentPlan,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const auth = useProductAccess()

const assets = ref([])
const plans = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingPlanId = ref(null)

const filters = reactive({
  search: '',
  assetId: '',
  status: '',
  targetMarket: '',
})

const form = reactive({
  assetId: '',
  planTitle: '',
  objectives: '',
  targetMarket: '',
  improvementNeeds: '',
  proposedActivities: '',
  timelineStart: '',
  timelineEnd: '',
  assignedPersonnel: '',
  planStatus: 'Draft',
  remarks: '',
})

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
const activePlans = computed(() => plans.value.filter((plan) => plan.planStatus !== 'Archived').length)
const archivedPlans = computed(() => plans.value.filter((plan) => plan.planStatus === 'Archived').length)
const selectedAsset = computed(() => selectableAssets.value.find((asset) => asset.id === form.assetId))
const planStats = computed(() => [
  { label: 'Total plans', value: plans.value.length },
  { label: 'Active plans', value: activePlans.value },
  { label: 'Archived plans', value: archivedPlans.value },
  { label: 'Selectable assets', value: selectableAssets.value.length },
])

function resetForm() {
  editingPlanId.value = null
  form.assetId = ''
  form.planTitle = ''
  form.objectives = ''
  form.targetMarket = ''
  form.improvementNeeds = ''
  form.proposedActivities = ''
  form.timelineStart = ''
  form.timelineEnd = ''
  form.assignedPersonnel = ''
  form.planStatus = 'Draft'
  form.remarks = ''
}

function clearFilters() {
  filters.search = ''
  filters.assetId = ''
  filters.status = ''
  filters.targetMarket = ''
  loadPlans()
}

function syncTargetMarketFromAsset() {
  if (selectedAsset.value && !form.targetMarket) {
    form.targetMarket = selectedAsset.value.targetMarket
  }
}

function canEditPlan(plan) {
  return canEditPlans.value && plan.planStatus !== 'Archived' && plan.assetStatus !== 'Archived'
}

function canArchivePlan(plan) {
  return canArchivePlans.value && plan.planStatus !== 'Archived'
}

function editPlan(plan) {
  editingPlanId.value = plan.id
  form.assetId = plan.assetId
  form.planTitle = plan.planTitle
  form.objectives = plan.objectives
  form.targetMarket = plan.targetMarket
  form.improvementNeeds = plan.improvementNeeds
  form.proposedActivities = plan.proposedActivities
  form.timelineStart = plan.timelineStart
  form.timelineEnd = plan.timelineEnd
  form.assignedPersonnel = plan.assignedPersonnel
  form.planStatus = plan.planStatus
  form.remarks = plan.remarks || ''
}

async function loadAssets() {
  const response = await getTourismAssets()
  assets.value = response.data
}

async function loadPlans() {
  loading.value = true
  error.value = ''

  try {
    const response = await getDevelopmentPlans(filters)
    plans.value = response.data
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
    await Promise.all([loadAssets(), loadPlans()])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function savePlan() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingPlanId.value) {
      await updateDevelopmentPlan(editingPlanId.value, form)
      success.value = 'Development plan updated successfully.'
    } else {
      await createDevelopmentPlan(form)
      success.value = 'Development plan created successfully.'
    }

    resetForm()
    await loadPageData()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function archivePlan(plan) {
  const confirmed = window.confirm(`Archive "${plan.planTitle}"?`)

  if (!confirmed) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await archiveDevelopmentPlan(plan.id)
    success.value = 'Development plan archived successfully.'
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
      <p class="eyebrow">Planning Records</p>
      <h1>Product Development Planning</h1>
      <p>
        Create planning records for active tourism assets and keep each product idea ready for
        monitoring, activity design, and future package creation.
      </p>
    </div>

    <ModuleStats :items="planStats" />

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter development plans, but cannot create, edit, or archive
      records.
    </RoleNotice>

    <div class="plan-layout">
      <form v-if="canEditPlans" class="plan-form" @submit.prevent="savePlan">
        <div>
          <p class="eyebrow">{{ editingPlanId ? 'Edit plan' : 'New plan' }}</p>
          <h2>{{ editingPlanId ? 'Update development plan' : 'Create development plan' }}</h2>
        </div>

        <p v-if="!selectableAssets.length" class="form-error">
          Add or restore a non-archived tourism asset before creating a development plan.
        </p>

        <label>
          Tourism Asset
          <select v-model="form.assetId" required @change="syncTargetMarketFromAsset">
            <option value="">Select non-archived asset</option>
            <option v-for="asset in selectableAssets" :key="asset.id" :value="asset.id">
              {{ asset.name }} - {{ asset.developmentStatus }}
            </option>
          </select>
        </label>

        <label>
          Plan Title
          <input v-model="form.planTitle" required placeholder="Example: Mangrove Eco-Tour Plan" />
        </label>

        <label>
          Objectives
          <textarea
            v-model="form.objectives"
            required
            placeholder="State what the Tourism Office wants to develop or improve."
          ></textarea>
        </label>

        <label>
          Target Market
          <input v-model="form.targetMarket" required placeholder="Families, students, eco-tourists" />
        </label>

        <label>
          Improvement Needs
          <textarea
            v-model="form.improvementNeeds"
            required
            placeholder="Facilities, training, signage, coordination, or other needs."
          ></textarea>
        </label>

        <label>
          Proposed Activities
          <textarea
            v-model="form.proposedActivities"
            required
            placeholder="Activities that can become part of the future tourism product."
          ></textarea>
        </label>

        <div class="form-grid">
          <label>
            Timeline Start
            <input v-model="form.timelineStart" required type="date" />
          </label>

          <label>
            Timeline End
            <input v-model="form.timelineEnd" required type="date" />
          </label>
        </div>

        <div class="form-grid">
          <label>
            Assigned Personnel
            <input v-model="form.assignedPersonnel" required placeholder="Tourism staff or office unit" />
          </label>

          <label>
            Plan Status
            <select v-model="form.planStatus" required>
              <option v-for="status in DEVELOPMENT_PLAN_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
        </div>

        <label>
          Remarks
          <textarea v-model="form.remarks" placeholder="Optional planning notes"></textarea>
        </label>

        <div class="form-actions">
          <button class="primary-button" :disabled="saving || !selectableAssets.length" type="submit">
            {{ saving ? 'Saving...' : editingPlanId ? 'Save Changes' : 'Create Plan' }}
          </button>
          <button v-if="editingPlanId" class="secondary-button" type="button" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>

      <section class="plan-panel">
        <div class="filter-panel">
          <label>
            Search
            <input v-model="filters.search" placeholder="Search title, objective, need, or asset" />
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
              <option v-for="status in DEVELOPMENT_PLAN_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
          <label>
            Target Market
            <input v-model="filters.targetMarket" placeholder="Filter by target market" />
          </label>
          <FilterActions @apply="loadPlans" @clear="clearFilters" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="success" class="form-success">{{ success }}</p>

        <div v-if="loading" class="empty-state compact">
          <h2>Loading development plans...</h2>
        </div>

        <div v-else-if="!plans.length" class="empty-state compact">
          <h2>No development plans found</h2>
          <p>Create the first plan from an active tourism asset or adjust the filters.</p>
        </div>

        <div v-else class="plan-table-wrap">
          <table class="plan-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Linked Asset</th>
                <th>Target Market</th>
                <th>Timeline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in plans" :key="plan.id">
                <td>
                  <strong>{{ plan.planTitle }}</strong>
                  <span>{{ plan.objectives }}</span>
                  <small v-if="plan.remarks">{{ plan.remarks }}</small>
                </td>
                <td>
                  <strong>{{ plan.assetName }}</strong>
                  <span>{{ plan.assetStatus }}</span>
                </td>
                <td>{{ plan.targetMarket }}</td>
                <td>
                  <span>{{ plan.timelineStart }}</span>
                  <span>{{ plan.timelineEnd }}</span>
                </td>
                <td>
                  <StatusPill :status="plan.planStatus" />
                </td>
                <td>
                  <div class="table-actions">
                    <button v-if="canEditPlan(plan)" class="secondary-button" type="button" @click="editPlan(plan)">
                      Edit
                    </button>
                    <button
                      v-if="canArchivePlan(plan)"
                      class="danger-button"
                      type="button"
                      @click="archivePlan(plan)"
                    >
                      Archive
                    </button>
                    <span v-if="auth.isViewOnly">View only</span>
                    <span v-else-if="plan.assetStatus === 'Archived'">Asset archived</span>
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
.plan-form,
.plan-panel {
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.plan-panel {
  overflow: hidden;
}

.plan-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.85fr) minmax(0, 1.45fr);
  gap: 18px;
  align-items: start;
}

.plan-form,
.plan-panel {
  padding: 22px;
}

.plan-form {
  display: grid;
  gap: 16px;
}

.plan-form label {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.plan-form input,
.plan-form select,
.plan-form textarea,
.filter-panel input,
.filter-panel select {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 11px 12px;
  background: white;
  color: var(--color-ink);
}

.plan-form textarea {
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

.plan-table-wrap {
  overflow-x: auto;
}

.plan-table {
  width: 100%;
  border-collapse: collapse;
}

.plan-table th,
.plan-table td {
  border-bottom: 1px solid var(--color-line);
  padding: 14px 10px;
  text-align: left;
  vertical-align: top;
}

.plan-table th {
  color: var(--color-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.plan-table td strong,
.plan-table td span,
.plan-table td small {
  display: block;
}

.plan-table td strong {
  margin-bottom: 4px;
}

.plan-table td span,
.plan-table td small {
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
  .plan-layout {
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
