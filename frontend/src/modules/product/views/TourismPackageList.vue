<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import CmsConfirmDialog from '@/modules/cms/components/content/CmsConfirmDialog.vue'
import CmsDataTable from '@/modules/cms/components/content/CmsDataTable.vue'
import CmsIcon from '@/modules/cms/components/CmsIcon.vue'
import ProductPackageForm from '@/modules/product/components/ProductPackageForm.vue'
import ProductPackageReadinessDialog from '@/modules/product/components/ProductPackageReadinessDialog.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
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
import { USER_ROLES } from '@/stores/auth'

const auth = useProductAccess()

const assets = ref([])
const activities = ref([])
const packages = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const formOpen = ref(false)
const selectedPackage = ref(null)
const formError = ref('')
const saving = ref(false)
const confirmAction = ref(null)
const actionBusy = ref(false)
const reviewOpen = ref(false)
const reviewPackage = ref(null)
const reviewLoading = ref(false)
const reviewError = ref('')
const readinessSaving = ref(false)
const readinessErrors = ref([])

const filters = reactive({
  search: '',
  category: '',
  status: '',
  targetMarket: '',
})

const columns = [
  { key: 'package', label: 'Package' },
  { key: 'category', label: 'Category' },
  { key: 'targetMarket', label: 'Target market' },
  { key: 'items', label: 'Items' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

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

const hasSelectableItems = computed(() => selectableAssets.value.length || selectableActivities.value.length)

const activePackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus !== 'Archived').length,
)
const readyPackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus === 'Ready for Promotion').length,
)
const archivedPackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus === 'Archived').length,
)

const reviewReadinessIssues = computed(() =>
  reviewPackage.value ? getReadinessIssues(reviewPackage.value) : [],
)

onMounted(loadPageData)

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

function canReviewPackage(tourismPackage) {
  return tourismPackage.packageStatus !== 'Archived'
}

function openCreate() {
  selectedPackage.value = null
  formError.value = ''
  formOpen.value = true
}

async function openEdit(tourismPackage) {
  formError.value = ''
  error.value = ''
  notice.value = ''

  try {
    const response = await getTourismPackage(tourismPackage.id)
    selectedPackage.value = response.data
    formOpen.value = true
  } catch (err) {
    error.value = err.message || 'Unable to load package details.'
  }
}

function clearFilters() {
  filters.search = ''
  filters.category = ''
  filters.status = ''
  filters.targetMarket = ''
  loadPackages()
}

async function loadAssets() {
  const response = await getTourismAssets()
  assets.value = response.data || []
}

async function loadActivities() {
  const response = await getTourismActivities()
  activities.value = response.data || []
}

async function loadPackages() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismPackages({
      search: filters.search,
      category: filters.category,
      status: filters.status,
      targetMarket: filters.targetMarket,
    })
    packages.value = response.data || []
  } catch (err) {
    error.value = err.message || 'Unable to load tourism packages.'
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
    error.value = err.message || 'Unable to load tourism package data.'
  } finally {
    loading.value = false
  }
}

async function submitPackage(payload) {
  saving.value = true
  formError.value = ''
  notice.value = ''

  try {
    if (selectedPackage.value?.id) {
      await updateTourismPackage(selectedPackage.value.id, payload)
      notice.value = 'Tourism package updated.'
    } else {
      await createTourismPackage(payload)
      notice.value = 'Tourism package created.'
    }

    formOpen.value = false
    await loadPageData()
  } catch (err) {
    formError.value = err.message || 'Unable to save tourism package.'
  } finally {
    saving.value = false
  }
}

function askArchive(tourismPackage) {
  confirmAction.value = tourismPackage
}

async function archivePackage() {
  if (!confirmAction.value) return
  actionBusy.value = true
  error.value = ''
  notice.value = ''

  try {
    await archiveTourismPackage(confirmAction.value.id)
    notice.value = 'Tourism package archived.'
    confirmAction.value = null
    await loadPageData()
  } catch (err) {
    error.value = err.message || 'Unable to archive tourism package.'
  } finally {
    actionBusy.value = false
  }
}

async function openReadinessReview(tourismPackage) {
  reviewOpen.value = true
  reviewPackage.value = null
  reviewError.value = ''
  readinessErrors.value = []
  reviewLoading.value = true

  try {
    const response = await getTourismPackage(tourismPackage.id)
    reviewPackage.value = response.data
  } catch (err) {
    reviewError.value = err.message || 'Unable to load readiness review.'
  } finally {
    reviewLoading.value = false
  }
}

async function submitReadinessReview(remarks) {
  if (!reviewPackage.value) return
  readinessSaving.value = true
  readinessErrors.value = []
  reviewError.value = ''
  notice.value = ''

  try {
    await markTourismPackageReady(reviewPackage.value.id, remarks)
    reviewOpen.value = false
    reviewPackage.value = null
    notice.value = 'Tourism package marked Ready for Promotion.'
    await loadPageData()
  } catch (err) {
    readinessErrors.value = err.details || []
    reviewError.value = err.message || 'Unable to mark package Ready for Promotion.'
  } finally {
    readinessSaving.value = false
  }
}

function getReadinessIssues(packageDetail) {
  const issues = []

  if (packageDetail.packageStatus === 'Archived') {
    issues.push('Archived packages cannot be marked Ready for Promotion.')
  }

  if (!packageDetail.name) issues.push('Package name is required.')
  if (!packageDetail.description) issues.push('Description is required.')
  if (!packageDetail.targetMarket) issues.push('Target market is required.')
  if (!packageDetail.estimatedDuration) issues.push('Estimated duration is required.')
  if (!packageDetail.items?.length) issues.push('At least one linked asset or activity is required.')

  ;(packageDetail.items || []).forEach((item) => {
    if (item.itemType === 'Asset' && item.status === 'Archived') {
      issues.push(`Linked asset "${item.name || item.referenceId}" is archived.`)
    }

    if (item.itemType === 'Activity' && item.status === 'Archived') {
      issues.push(`Linked activity "${item.name || item.referenceId}" is archived.`)
    }

    if (item.assetStatus === 'Archived') {
      issues.push(`Linked item "${item.name || item.referenceId}" belongs to an archived asset.`)
    }
  })

  return issues
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-packages-title">
    <header class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-packages-title">Packages</h1>
        <span>Combine assets and activities into tourism packages, then run readiness review for promotion.</span>
      </div>
    </header>

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter tourism packages, but cannot create, edit, or archive records.
    </RoleNotice>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <section class="package-toolbar" aria-label="Package filters">
      <label class="package-toolbar__search">
        <span>Search</span>
        <CmsIcon name="search" />
        <input
          v-model="filters.search"
          type="search"
          placeholder="Search package, description, market, or category"
          @keyup.enter="loadPackages"
        />
      </label>

      <label class="package-toolbar__field--wide">
        <span>Category</span>
        <select v-model="filters.category" @change="loadPackages">
          <option value="">All categories</option>
          <option v-for="category in PACKAGE_CATEGORIES" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </label>

      <label>
        <span>Status</span>
        <select v-model="filters.status" @change="loadPackages">
          <option value="">All statuses</option>
          <option v-for="status in PACKAGE_STATUSES" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </label>

      <label>
        <span>Target market</span>
        <input v-model="filters.targetMarket" placeholder="Filter by market" @keyup.enter="loadPackages" />
      </label>

      <div class="package-toolbar__actions">
        <button type="button" @click="loadPackages">Apply</button>
        <button type="button" @click="clearFilters">Clear</button>
        <button
          v-if="canEditPackages"
          class="package-toolbar__create"
          type="button"
          :disabled="!hasSelectableItems"
          @click="openCreate"
        >
          <span aria-hidden="true">+</span>
          Create package
        </button>
      </div>
    </section>

    <div v-if="canEditPackages && !hasSelectableItems" class="package-warning" role="status">
      Add or restore a non-archived tourism asset or activity before creating packages.
    </div>

    <CmsDataTable
      :columns="columns"
      :items="packages"
      :loading="loading"
      :error="error"
      empty-title="No tourism packages found"
      empty-text="Create the first package from active assets and activities or adjust your filters."
      @retry="loadPageData"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="tourismPackage in tableItems" :key="tourismPackage.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ tourismPackage.name }}</strong>
              <span>{{ tourismPackage.description }}</span>
              <span v-if="tourismPackage.remarks">{{ tourismPackage.remarks }}</span>
            </span>
          </td>
          <td>{{ tourismPackage.category }}</td>
          <td>
            <span class="package-market">
              <span>{{ tourismPackage.targetMarket }}</span>
              <strong>{{ tourismPackage.estimatedDuration }}</strong>
            </span>
          </td>
          <td>
            <span class="package-items">
              <strong>{{ tourismPackage.itemCount }} item(s)</strong>
              <span>{{ tourismPackage.assetCount }} asset(s)</span>
              <span>{{ tourismPackage.activityCount }} activity item(s)</span>
            </span>
          </td>
          <td>
            <span class="package-status" :data-status="tourismPackage.packageStatus">
              {{ tourismPackage.packageStatus }}
            </span>
          </td>
          <td>
            <span class="cms-table-actions">
              <button v-if="canReviewPackage(tourismPackage)" type="button" @click="openReadinessReview(tourismPackage)">
                Review
              </button>
              <button v-if="canEditPackage(tourismPackage)" type="button" @click="openEdit(tourismPackage)">
                Edit
              </button>
              <button
                v-if="canArchivePackage(tourismPackage)"
                class="is-danger"
                type="button"
                @click="askArchive(tourismPackage)"
              >
                Archive
              </button>
              <span v-if="auth.isViewOnly">View only</span>
              <span v-else-if="tourismPackage.packageStatus === 'Ready for Promotion'">Ready</span>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="tourismPackage in cardItems" :key="tourismPackage.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ tourismPackage.name }}</strong>
            <span>{{ tourismPackage.description }}</span>
          </span>
          <div class="cms-mobile-meta">
            <span class="package-status" :data-status="tourismPackage.packageStatus">
              {{ tourismPackage.packageStatus }}
            </span>
            <span>{{ tourismPackage.category }}</span>
          </div>
          <span>{{ tourismPackage.targetMarket }}</span>
          <span>{{ tourismPackage.estimatedDuration }}</span>
          <span>{{ tourismPackage.itemCount }} item(s)</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button v-if="canReviewPackage(tourismPackage)" type="button" @click="openReadinessReview(tourismPackage)">
              Review
            </button>
            <button v-if="canEditPackage(tourismPackage)" type="button" @click="openEdit(tourismPackage)">
              Edit
            </button>
            <button
              v-if="canArchivePackage(tourismPackage)"
              class="is-danger"
              type="button"
              @click="askArchive(tourismPackage)"
            >
              Archive
            </button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <div class="package-pagination">
      <div>
        <strong>{{ packages.length }} records</strong>
        <span>{{ activePackages }} active, {{ readyPackages }} ready, {{ archivedPackages }} archived</span>
      </div>
    </div>

    <ProductPackageForm
      :open="formOpen"
      :value="selectedPackage"
      :assets="selectableAssets"
      :activities="selectableActivities"
      :statuses="editablePackageStatuses"
      :busy="saving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitPackage"
    />

    <ProductPackageReadinessDialog
      :open="reviewOpen"
      :package-detail="reviewPackage"
      :issues="reviewReadinessIssues"
      :backend-errors="readinessErrors"
      :loading="reviewLoading"
      :server-error="reviewError"
      :busy="readinessSaving"
      :can-approve="canApproveReadiness"
      @close="reviewOpen = false"
      @confirm="submitReadinessReview"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      title="Archive this tourism package?"
      message="Archived tourism packages are removed from active package review and public handoff workflows."
      confirm-label="Archive"
      tone="danger"
      :busy="actionBusy"
      @cancel="confirmAction = null"
      @confirm="archivePackage"
    />
  </section>
</template>

<style scoped>
@import '@/modules/cms/views/content/cms-content-page.css';

.package-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.package-toolbar label {
  display: grid;
  flex: 1 0 172px;
  gap: 7px;
  min-width: min(100%, 172px);
}

.package-toolbar__field--wide {
  flex-basis: 230px !important;
  min-width: min(100%, 230px) !important;
}

.package-toolbar__search {
  position: relative;
  flex: 2 0 280px !important;
  min-width: min(100%, 280px) !important;
}

.package-toolbar span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.package-toolbar__search svg {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

.package-toolbar input,
.package-toolbar select {
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

.package-toolbar__search input {
  padding-left: 38px;
}

.package-toolbar input:focus,
.package-toolbar select:focus,
.package-toolbar button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 1px;
}

.package-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.package-toolbar button {
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

.package-toolbar__create {
  color: #fff !important;
  border-color: #0f766e !important;
  background: #0f766e !important;
  white-space: nowrap;
}

.package-toolbar__create:hover {
  background: #115e59 !important;
}

.package-toolbar__create:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.package-warning {
  padding: 12px 14px;
  color: #92400e;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #ffedd5;
  font-weight: 800;
}

.package-market,
.package-items {
  display: grid;
  gap: 3px;
}

.package-market strong,
.package-items span {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
}

.package-status {
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

.package-status[data-status='Draft'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.package-status[data-status='In Development'],
.package-status[data-status='Approved'],
.package-status[data-status='Published'] {
  color: #0f766e;
  border-color: #99f6e4;
  background: #ccfbf1;
}

.package-status[data-status='For Review'] {
  color: #92400e;
  border-color: #fed7aa;
  background: #ffedd5;
}

.package-status[data-status='Ready for Promotion'] {
  color: #166534;
  border-color: #bbf7d0;
  background: #dcfce7;
}

.package-status[data-status='Archived'] {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.package-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.package-pagination div {
  display: grid;
  gap: 2px;
}

.package-pagination strong {
  color: #0f172a;
}

.package-pagination span {
  color: #64748b;
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .package-toolbar__actions {
    margin-left: 0;
  }
}

@media (max-width: 760px) {
  .package-toolbar__actions,
  .package-toolbar__actions button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .package-toolbar label,
  .package-toolbar__search {
    flex-basis: 100% !important;
    width: 100%;
  }
}
</style>
