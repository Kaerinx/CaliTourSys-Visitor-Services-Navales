<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import FilterActions from '@/modules/product/components/FilterActions.vue'
import ModuleStats from '@/modules/product/components/ModuleStats.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import StatusPill from '@/modules/product/components/StatusPill.vue'
import { PACKAGE_CATEGORIES, PACKAGE_STATUSES } from '@/modules/product/constants/productOptions'
import {
  archiveTourismPackage,
  createTourismPackage,
  getTourismActivities,
  getTourismAssets,
  getTourismPackage,
  getTourismPackages,
  markTourismPackageReady,
  updateTourismPackage,
} from '@/modules/product/services/productApi'
import { USER_ROLES, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const assets = ref([])
const activities = ref([])
const packages = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingPackageId = ref(null)
const reviewPackage = ref(null)
const readinessRemarks = ref('')
const readinessSaving = ref(false)
const readinessErrors = ref([])

const filters = reactive({
  search: '',
  status: '',
  targetMarket: '',
})

const form = reactive({
  name: '',
  description: '',
  category: 'Nature & Eco',
  targetMarket: '',
  estimatedDuration: '',
  packageStatus: 'Draft',
  remarks: '',
  assetIds: [],
  activityIds: [],
})

const canEditPackages = computed(() =>
  [USER_ROLES.TOURISM_STAFF, USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(
    auth.user?.role,
  ),
)
const canArchivePackages = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)
const canApproveReadiness = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)
const editablePackageStatuses = computed(() =>
  PACKAGE_STATUSES.filter((status) => status !== 'Ready for Promotion'),
)
const selectableAssets = computed(() =>
  assets.value.filter((asset) => asset.developmentStatus !== 'Archived'),
)
const selectableActivities = computed(() =>
  activities.value.filter(
    (activity) => activity.activityStatus !== 'Archived' && activity.assetStatus !== 'Archived',
  ),
)
const selectedItemCount = computed(() => form.assetIds.length + form.activityIds.length)
const activePackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus !== 'Archived').length,
)
const archivedPackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus === 'Archived').length,
)
const readyPackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus === 'Ready for Promotion').length,
)
const packageStats = computed(() => [
  { label: 'Total packages', value: packages.value.length },
  { label: 'Active packages', value: activePackages.value },
  { label: 'Ready packages', value: readyPackages.value },
  { label: 'Archived packages', value: archivedPackages.value },
])

const reviewReadinessIssues = computed(() =>
  reviewPackage.value ? getReadinessIssues(reviewPackage.value) : [],
)

function resetForm() {
  editingPackageId.value = null
  form.name = ''
  form.description = ''
  form.category = 'Nature & Eco'
  form.targetMarket = ''
  form.estimatedDuration = ''
  form.packageStatus = 'Draft'
  form.remarks = ''
  form.assetIds = []
  form.activityIds = []
}

function clearFilters() {
  filters.search = ''
  filters.status = ''
  filters.targetMarket = ''
  loadPackages()
}

function buildPackagePayload() {
  return {
    name: form.name,
    description: form.description,
    category: form.category,
    targetMarket: form.targetMarket,
    estimatedDuration: form.estimatedDuration,
    packageStatus: form.packageStatus,
    remarks: form.remarks,
    items: [
      ...form.assetIds.map((assetId) => ({ itemType: 'Asset', referenceId: assetId })),
      ...form.activityIds.map((activityId) => ({ itemType: 'Activity', referenceId: activityId })),
    ],
  }
}

function canEditPackage(tourismPackage) {
  return (
    canEditPackages.value &&
    tourismPackage.packageStatus !== 'Archived' &&
    tourismPackage.packageStatus !== 'Ready for Promotion'
  )
}

function canArchivePackage(tourismPackage) {
  return canArchivePackages.value && tourismPackage.packageStatus !== 'Archived'
}

async function editPackage(tourismPackage) {
  error.value = ''
  success.value = ''

  try {
    const response = await getTourismPackage(tourismPackage.id)
    const packageDetail = response.data

    editingPackageId.value = packageDetail.id
    form.name = packageDetail.name
    form.description = packageDetail.description
    form.category = packageDetail.category || 'Nature & Eco'
    form.targetMarket = packageDetail.targetMarket
    form.estimatedDuration = packageDetail.estimatedDuration
    form.packageStatus = packageDetail.packageStatus
    form.remarks = packageDetail.remarks || ''
    form.assetIds = packageDetail.items
      .filter((item) => item.itemType === 'Asset' && item.status !== 'Archived')
      .map((item) => item.referenceId)
    form.activityIds = packageDetail.items
      .filter(
        (item) =>
          item.itemType === 'Activity' &&
          item.status !== 'Archived' &&
          item.assetStatus !== 'Archived',
      )
      .map((item) => item.referenceId)
  } catch (err) {
    error.value = err.message
  }
}

function getReadinessIssues(packageDetail) {
  const issues = []

  if (packageDetail.packageStatus === 'Archived') {
    issues.push('Archived packages cannot be marked Ready for Promotion.')
  }

  if (!packageDetail.name) {
    issues.push('Package name is required.')
  }

  if (!packageDetail.description) {
    issues.push('Description is required.')
  }

  if (!packageDetail.targetMarket) {
    issues.push('Target market is required.')
  }

  if (!packageDetail.estimatedDuration) {
    issues.push('Estimated duration is required.')
  }

  if (!packageDetail.items?.length) {
    issues.push('At least one linked asset or activity is required.')
  }

  ;(packageDetail.items || []).forEach((item) => {
    if (item.status === 'Archived') {
      issues.push(`${item.itemType} "${item.name || item.referenceId}" is archived.`)
    }

    if (item.assetStatus === 'Archived') {
      issues.push(`${item.itemType} "${item.name || item.referenceId}" belongs to an archived asset.`)
    }
  })

  return issues
}

async function reviewReadiness(tourismPackage) {
  error.value = ''
  success.value = ''
  readinessErrors.value = []
  readinessRemarks.value = ''

  try {
    const response = await getTourismPackage(tourismPackage.id)
    reviewPackage.value = response.data
  } catch (err) {
    error.value = err.message
  }
}

async function markReadyForPromotion() {
  if (!reviewPackage.value) {
    return
  }

  readinessSaving.value = true
  readinessErrors.value = []
  error.value = ''
  success.value = ''

  try {
    const response = await markTourismPackageReady(reviewPackage.value.id, readinessRemarks.value)
    reviewPackage.value = response.data
    readinessRemarks.value = ''
    success.value = 'Tourism package marked Ready for Promotion.'
    await loadPageData()
  } catch (err) {
    readinessErrors.value = err.details || []
    error.value = err.message
  } finally {
    readinessSaving.value = false
  }
}

async function loadAssets() {
  const response = await getTourismAssets()
  assets.value = response.data
}

async function loadActivities() {
  const response = await getTourismActivities()
  activities.value = response.data
}

async function loadPackages() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismPackages(filters)
    packages.value = response.data
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
    await Promise.all([loadAssets(), loadActivities(), loadPackages()])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function savePackage() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    const payload = buildPackagePayload()

    if (editingPackageId.value) {
      await updateTourismPackage(editingPackageId.value, payload)
      success.value = 'Tourism package updated successfully.'
    } else {
      await createTourismPackage(payload)
      success.value = 'Tourism package created successfully.'
    }

    resetForm()
    await loadPageData()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function archivePackage(tourismPackage) {
  const confirmed = window.confirm(`Archive "${tourismPackage.name}"?`)

  if (!confirmed) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await archiveTourismPackage(tourismPackage.id)
    success.value = 'Tourism package archived successfully.'
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
      <p class="eyebrow">Package Records</p>
      <h1>Tourism Package Creation</h1>
      <p>
        Combine active tourism assets and tourism activities into package records for future review,
        promotion readiness, and group module consolidation.
      </p>
    </div>

    <ModuleStats :items="packageStats" />

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter tourism packages, but cannot create, edit, or archive
      records.
    </RoleNotice>

    <div class="package-layout">
      <form v-if="canEditPackages" class="package-form" @submit.prevent="savePackage">
        <div>
          <p class="eyebrow">{{ editingPackageId ? 'Edit package' : 'New package' }}</p>
          <h2>{{ editingPackageId ? 'Update tourism package' : 'Create tourism package' }}</h2>
        </div>

        <p v-if="!selectableAssets.length && !selectableActivities.length" class="form-error">
          Add or restore a non-archived tourism asset or activity before creating packages.
        </p>

        <label>
          Package Name
          <input v-model="form.name" required placeholder="Example: Calabanga Eco Day Package" />
        </label>

        <label>
          Description
          <textarea
            v-model="form.description"
            required
            placeholder="Describe the package experience, purpose, and visitor value."
          ></textarea>
        </label>

        <label>
          Package Category
          <select v-model="form.category" required>
            <option v-for="category in PACKAGE_CATEGORIES" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </label>

        <div class="form-grid">
          <label>
            Target Market
            <input v-model="form.targetMarket" required placeholder="Families, students, eco-tourists" />
          </label>

          <label>
            Estimated Duration
            <input v-model="form.estimatedDuration" required placeholder="Example: Half day" />
          </label>
        </div>

        <label>
          Package Status
          <select v-model="form.packageStatus" required>
            <option v-for="status in editablePackageStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>

        <div class="package-item-picker">
          <section>
            <h3>Tourism Assets</h3>
            <p>Select non-archived assets to include in this package.</p>
            <label v-for="asset in selectableAssets" :key="asset.id" class="check-option">
              <input v-model="form.assetIds" type="checkbox" :value="asset.id" />
              <span>
                <strong>{{ asset.name }}</strong>
                <small>{{ asset.location }} - {{ asset.developmentStatus }}</small>
              </span>
            </label>
          </section>

          <section>
            <h3>Tourism Activities</h3>
            <p>Select non-archived activities to include in this package.</p>
            <label v-for="activity in selectableActivities" :key="activity.id" class="check-option">
              <input v-model="form.activityIds" type="checkbox" :value="activity.id" />
              <span>
                <strong>{{ activity.name }}</strong>
                <small>{{ activity.assetName }} - {{ activity.activityStatus }}</small>
              </span>
            </label>
          </section>
        </div>

        <p class="selected-count">{{ selectedItemCount }} selected package item(s)</p>

        <label>
          Remarks
          <textarea v-model="form.remarks" placeholder="Optional package notes"></textarea>
        </label>

        <div class="form-actions">
          <button
            class="primary-button"
            :disabled="saving || selectedItemCount === 0"
            type="submit"
          >
            {{ saving ? 'Saving...' : editingPackageId ? 'Save Changes' : 'Create Package' }}
          </button>
          <button v-if="editingPackageId" class="secondary-button" type="button" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>

      <section class="package-panel">
        <div class="filter-panel">
          <label>
            Search
            <input v-model="filters.search" placeholder="Search package, description, or market" />
          </label>
          <label>
            Status
            <select v-model="filters.status">
              <option value="">All statuses</option>
              <option v-for="status in PACKAGE_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
          <label>
            Target Market
            <input v-model="filters.targetMarket" placeholder="Filter by target market" />
          </label>
          <FilterActions @apply="loadPackages" @clear="clearFilters" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="success" class="form-success">{{ success }}</p>

        <div v-if="loading" class="empty-state compact">
          <h2>Loading tourism packages...</h2>
        </div>

        <div v-else-if="!packages.length" class="empty-state compact">
          <h2>No tourism packages found</h2>
          <p>Create the first package from active assets and activities or adjust the filters.</p>
        </div>

        <div v-else class="package-table-wrap">
          <table class="package-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Target Market</th>
                <th>Duration</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tourismPackage in packages" :key="tourismPackage.id">
                <td>
                  <strong>{{ tourismPackage.name }}</strong>
                  <small>{{ tourismPackage.category }}</small>
                  <span>{{ tourismPackage.description }}</span>
                  <small v-if="tourismPackage.remarks">{{ tourismPackage.remarks }}</small>
                </td>
                <td>{{ tourismPackage.targetMarket }}</td>
                <td>{{ tourismPackage.estimatedDuration }}</td>
                <td>
                  <strong>{{ tourismPackage.itemCount }} item(s)</strong>
                  <span>{{ tourismPackage.assetCount }} asset(s)</span>
                  <span>{{ tourismPackage.activityCount }} activity item(s)</span>
                </td>
                <td>
                  <StatusPill :status="tourismPackage.packageStatus" />
                </td>
                <td>
                  <div class="table-actions">
                    <button
                      class="secondary-button"
                      type="button"
                      @click="reviewReadiness(tourismPackage)"
                    >
                      Review
                    </button>
                    <button
                      v-if="canEditPackage(tourismPackage)"
                      class="secondary-button"
                      type="button"
                      @click="editPackage(tourismPackage)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="canArchivePackage(tourismPackage)"
                      class="danger-button"
                      type="button"
                      @click="archivePackage(tourismPackage)"
                    >
                      Archive
                    </button>
                    <span v-if="auth.isViewOnly">View only</span>
                    <span v-else-if="tourismPackage.packageStatus === 'Ready for Promotion'">
                      Ready
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section v-if="reviewPackage" class="readiness-panel">
          <div class="readiness-heading">
            <div>
              <p class="eyebrow">Readiness Review</p>
              <h2>{{ reviewPackage.name }}</h2>
            </div>
            <StatusPill :status="reviewPackage.packageStatus" />
          </div>

          <div class="readiness-grid">
            <article>
              <span>Linked items</span>
              <strong>{{ reviewPackage.items.length }}</strong>
            </article>
            <article>
              <span>Asset items</span>
              <strong>{{ reviewPackage.assetCount }}</strong>
            </article>
            <article>
              <span>Activity items</span>
              <strong>{{ reviewPackage.activityCount }}</strong>
            </article>
          </div>

          <div v-if="reviewReadinessIssues.length" class="readiness-issues">
            <strong>Readiness issues</strong>
            <ul>
              <li v-for="issue in reviewReadinessIssues" :key="issue">{{ issue }}</li>
            </ul>
          </div>
          <p v-else class="form-success">This package has the required information for readiness approval.</p>

          <div class="linked-items">
            <h3>Linked package items</h3>
            <p v-for="item in reviewPackage.items" :key="item.id">
              <strong>{{ item.itemType }}:</strong> {{ item.name }}
              <span>{{ item.status }}</span>
            </p>
          </div>

          <div class="status-history">
            <h3>Status history</h3>
            <p v-if="!reviewPackage.statusHistory.length">No status changes recorded yet.</p>
            <article v-for="history in reviewPackage.statusHistory" :key="history.id">
              <strong>{{ history.previousStatus }} to {{ history.newStatus }}</strong>
              <span>
                {{ history.changedByName || 'Unknown user' }} · {{ history.changedByRole }} ·
                {{ history.changedAt }}
              </span>
              <small v-if="history.remarks">{{ history.remarks }}</small>
            </article>
          </div>

          <div v-if="canApproveReadiness && reviewPackage.packageStatus !== 'Ready for Promotion'">
            <label>
              Approval Remarks
              <textarea
                v-model="readinessRemarks"
                placeholder="Optional reason or note for readiness approval"
              ></textarea>
            </label>
            <button
              class="primary-button"
              :disabled="readinessSaving || reviewReadinessIssues.length > 0"
              type="button"
              @click="markReadyForPromotion"
            >
              {{ readinessSaving ? 'Marking ready...' : 'Mark Ready for Promotion' }}
            </button>
          </div>

          <div v-if="readinessErrors.length" class="readiness-issues">
            <strong>Backend validation</strong>
            <ul>
              <li v-for="issue in readinessErrors" :key="issue">{{ issue }}</li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  </section>
</template>

<style scoped>
.package-form,
.package-panel {
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.package-panel {
  overflow: hidden;
}

.package-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.4fr);
  gap: 18px;
  align-items: start;
}

.package-form,
.package-panel {
  padding: 22px;
}

.package-form {
  display: grid;
  gap: 16px;
}

.readiness-panel {
  display: grid;
  gap: 16px;
  margin-top: 20px;
  border-top: 1px solid var(--color-line);
  padding-top: 20px;
}

.readiness-heading,
.readiness-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.readiness-grid article {
  flex: 1;
  min-width: 140px;
  border: 1px solid var(--color-line);
  border-radius: 14px;
  padding: 14px;
  background: #f8fbf9;
}

.readiness-grid span,
.linked-items span,
.status-history span,
.status-history small {
  display: block;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 700;
}

.readiness-grid strong {
  font-size: 24px;
}

.readiness-issues {
  border-left: 5px solid #b42318;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff5f5;
  color: #7a271a;
}

.readiness-issues ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.linked-items,
.status-history {
  display: grid;
  gap: 10px;
}

.linked-items p,
.status-history article {
  margin: 0;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 12px;
}

.package-form label {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.package-form input,
.package-form select,
.package-form textarea,
.filter-panel input,
.filter-panel select {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 11px 12px;
  background: white;
  color: var(--color-ink);
}

.package-form textarea {
  min-height: 96px;
  resize: vertical;
}

.form-grid,
.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.package-item-picker {
  display: grid;
  gap: 12px;
}

.package-item-picker section {
  display: grid;
  gap: 10px;
  border: 1px solid var(--color-line);
  border-radius: 14px;
  padding: 14px;
  background: #f8fbf9;
}

.package-item-picker h3 {
  margin-bottom: 0;
  font-size: 16px;
}

.package-item-picker p,
.selected-count {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
}

.check-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  border-radius: 12px;
  padding: 10px;
  background: white;
}

.check-option input {
  width: auto;
  margin-top: 3px;
}

.check-option span,
.check-option small {
  display: block;
}

.check-option small {
  color: var(--color-muted);
  line-height: 1.5;
}

.selected-count {
  font-weight: 800;
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

.package-table-wrap {
  overflow-x: auto;
}

.package-table {
  width: 100%;
  border-collapse: collapse;
}

.package-table th,
.package-table td {
  border-bottom: 1px solid var(--color-line);
  padding: 14px 10px;
  text-align: left;
  vertical-align: top;
}

.package-table th {
  color: var(--color-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.package-table td strong,
.package-table td span,
.package-table td small {
  display: block;
}

.package-table td strong {
  margin-bottom: 4px;
}

.package-table td span,
.package-table td small {
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
  .package-layout {
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
