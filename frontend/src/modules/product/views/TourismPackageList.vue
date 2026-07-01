<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import CmsConfirmDialog from '@/modules/cms/components/content/CmsConfirmDialog.vue'
import CmsDataTable from '@/modules/cms/components/content/CmsDataTable.vue'
import CmsIcon from '@/modules/cms/components/CmsIcon.vue'
import ProductPackageForm from '@/modules/product/components/ProductPackageForm.vue'
import ProductPackageReadinessDialog from '@/modules/product/components/ProductPackageReadinessDialog.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { PACKAGE_CATEGORIES } from '@/modules/product/constants/productOptions'
import {
  archiveTourismPackage,
  createTourismPackage,
  getDevelopmentPlans,
  getTourismPackage,
  getTourismPackages,
  markTourismPackageReady,
  updateTourismPackage,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const props = defineProps({
  embedded: { type: Boolean, default: false },
})

const auth = useProductAccess()

const plans = ref([])
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
  targetMarket: '',
})

const columns = [
  { key: 'package', label: 'Package' },
  { key: 'category', label: 'Category' },
  { key: 'targetMarket', label: 'Target market' },
  { key: 'items', label: 'Items' },
  { key: 'readiness', label: 'Readiness' },
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

const selectablePlans = computed(() =>
  plans.value.filter((plan) => plan.planStatus !== 'Archived' && plan.assetStatus !== 'Archived'),
)

const hasSelectableItems = computed(() => selectablePlans.value.length)

const readyPackages = computed(() =>
  packages.value.filter((tourismPackage) => tourismPackage.packageStatus === 'Ready for Promotion').length,
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
  filters.targetMarket = ''
  loadPackages()
}

async function loadPlans() {
  const response = await getDevelopmentPlans()
  plans.value = response.data || []
}

async function loadPackages() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismPackages({
      search: filters.search,
      category: filters.category,
      targetMarket: filters.targetMarket,
    })
    packages.value = (response.data || []).filter((tourismPackage) => tourismPackage.packageStatus !== 'Archived')
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
    await Promise.all([loadPlans(), loadPackages()])
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
  if (!packageDetail.items?.some((item) => item.itemType === 'Plan')) {
    issues.push('At least one linked plan is required.')
  }

  ;(packageDetail.items || []).forEach((item) => {
    if (item.itemType === 'Plan' && item.status === 'Archived') {
      issues.push(`Linked plan "${item.name || item.referenceId}" is archived.`)
    }

    if (item.itemType === 'Asset' && item.status === 'Archived') {
      issues.push(`Linked asset "${item.name || item.referenceId}" is archived.`)
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
    <header v-if="!props.embedded" class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-packages-title">Packages</h1>
        <span>Combine development plans into packages, then run readiness review for promotion.</span>
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
      Create or restore a non-archived development plan before creating packages.
    </div>

    <CmsDataTable
      :columns="columns"
      :items="packages"
      :loading="loading"
      :error="error"
      empty-title="No tourism packages found"
      empty-text="Create the first package from active plans or adjust your filters."
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
              <span>{{ tourismPackage.planCount || 0 }} plan(s)</span>
            </span>
          </td>
          <td>
            <span class="package-readiness" :data-ready="tourismPackage.packageStatus === 'Ready for Promotion'">
              {{ tourismPackage.packageStatus === 'Ready for Promotion' ? 'Ready for Promotion' : 'Draft' }}
            </span>
          </td>
          <td>
            <span class="cms-table-actions product-table-actions">
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
            <span class="package-readiness" :data-ready="tourismPackage.packageStatus === 'Ready for Promotion'">
              {{ tourismPackage.packageStatus === 'Ready for Promotion' ? 'Ready for Promotion' : 'Draft' }}
            </span>
            <span>{{ tourismPackage.category }}</span>
          </div>
          <span>{{ tourismPackage.targetMarket }}</span>
          <span>{{ tourismPackage.estimatedDuration }}</span>
          <span>{{ tourismPackage.itemCount }} item(s)</span>
          <div class="cms-mobile-card__actions cms-table-actions product-table-actions">
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
        <span>{{ readyPackages }} ready for public handoff</span>
      </div>
    </div>

    <ProductPackageForm
      :open="formOpen"
      :value="selectedPackage"
      :plans="selectablePlans"
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

.package-readiness {
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

.package-readiness[data-ready='false'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.package-readiness[data-ready='true'] {
  color: #166534;
  border-color: #bbf7d0;
  background: #dcfce7;
}

:deep(.cms-data-table__desktop table) {
  min-width: 1160px;
}

:deep(.cms-data-table__desktop th),
:deep(.cms-data-table__desktop td) {
  padding-block: 16px;
}

:deep(.cms-table-title) {
  max-width: 460px;
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
  min-width: 220px;
  justify-content: flex-end;
}

:deep(.product-table-actions button) {
  min-width: 64px;
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
