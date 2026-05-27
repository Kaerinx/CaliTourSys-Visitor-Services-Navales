<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import FilterActions from '@/modules/product/components/FilterActions.vue'
import ModuleStats from '@/modules/product/components/ModuleStats.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import StatusPill from '@/modules/product/components/StatusPill.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { ASSET_CATEGORIES, ASSET_STATUSES } from '@/modules/product/constants/productOptions'
import {
  archiveTourismAsset,
  createTourismAsset,
  getTourismAssets,
  updateTourismAsset,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const auth = useProductAccess()

const assets = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingAssetId = ref(null)

const filters = reactive({
  search: '',
  category: '',
  status: '',
  location: '',
  targetMarket: '',
})

const form = reactive({
  name: '',
  description: '',
  location: '',
  category: 'Natural',
  targetMarket: '',
  developmentStatus: 'Draft',
  remarks: '',
})

const canEditAssets = computed(() =>
  [USER_ROLES.TOURISM_STAFF, USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(
    auth.user?.role,
  ),
)
const canArchiveAssets = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)

const activeAssets = computed(() =>
  assets.value.filter((asset) => asset.developmentStatus !== 'Archived').length,
)
const archivedAssets = computed(() =>
  assets.value.filter((asset) => asset.developmentStatus === 'Archived').length,
)
const assetStats = computed(() => [
  { label: 'Total assets', value: assets.value.length },
  { label: 'Active assets', value: activeAssets.value },
  { label: 'Archived assets', value: archivedAssets.value },
  { label: 'Your role', value: auth.user?.role || 'Guest' },
])

function resetForm() {
  editingAssetId.value = null
  form.name = ''
  form.description = ''
  form.location = ''
  form.category = 'Natural'
  form.targetMarket = ''
  form.developmentStatus = 'Draft'
  form.remarks = ''
}

function clearFilters() {
  filters.search = ''
  filters.category = ''
  filters.status = ''
  filters.location = ''
  filters.targetMarket = ''
  loadAssets()
}

function editAsset(asset) {
  editingAssetId.value = asset.id
  form.name = asset.name
  form.description = asset.description
  form.location = asset.location
  form.category = asset.category
  form.targetMarket = asset.targetMarket
  form.developmentStatus = asset.developmentStatus
  form.remarks = asset.remarks || ''
}

async function loadAssets() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismAssets(filters)
    assets.value = response.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function saveAsset() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingAssetId.value) {
      await updateTourismAsset(editingAssetId.value, form)
      success.value = 'Tourism asset updated successfully.'
    } else {
      await createTourismAsset(form)
      success.value = 'Tourism asset created successfully.'
    }

    resetForm()
    await loadAssets()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function archiveAsset(asset) {
  const confirmed = window.confirm(`Archive "${asset.name}"?`)

  if (!confirmed) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await archiveTourismAsset(asset.id)
    success.value = 'Tourism asset archived successfully.'
    await loadAssets()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadAssets)
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Asset Records</p>
      <h1>Tourism Asset Management</h1>
      <p>
        Maintain the tourism assets that can become the foundation for development plans,
        improvement work, activities, and future packages.
      </p>
    </div>

    <ModuleStats :items="assetStats" />

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter assets, but cannot create, edit, or archive records.
    </RoleNotice>

    <div class="asset-layout">
      <form v-if="canEditAssets" class="asset-form" @submit.prevent="saveAsset">
        <div>
          <p class="eyebrow">{{ editingAssetId ? 'Edit asset' : 'New asset' }}</p>
          <h2>{{ editingAssetId ? 'Update tourism asset' : 'Create tourism asset' }}</h2>
        </div>

        <label>
          Asset Name
          <input v-model="form.name" required placeholder="Example: Calabanga Mangrove Area" />
        </label>

        <label>
          Description
          <textarea
            v-model="form.description"
            required
            placeholder="Describe the tourism value, current condition, or development potential."
          ></textarea>
        </label>

        <div class="form-grid">
          <label>
            Location
            <input v-model="form.location" required placeholder="Barangay or site location" />
          </label>

          <label>
            Category
            <select v-model="form.category" required>
              <option v-for="category in ASSET_CATEGORIES" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>
        </div>

        <div class="form-grid">
          <label>
            Target Market
            <input v-model="form.targetMarket" required placeholder="Families, students, eco-tourists" />
          </label>

          <label>
            Development Status
            <select v-model="form.developmentStatus" required>
              <option v-for="status in ASSET_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
        </div>

        <label>
          Remarks
          <textarea v-model="form.remarks" placeholder="Optional notes for the Tourism Office"></textarea>
        </label>

        <div class="form-actions">
          <button class="primary-button" :disabled="saving" type="submit">
            {{ saving ? 'Saving...' : editingAssetId ? 'Save Changes' : 'Create Asset' }}
          </button>
          <button v-if="editingAssetId" class="secondary-button" type="button" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>

      <section class="asset-panel">
        <div class="filter-panel">
          <label>
            Search
            <input v-model="filters.search" placeholder="Search by name, description, or location" />
          </label>
          <label>
            Category
            <select v-model="filters.category">
              <option value="">All categories</option>
              <option v-for="category in ASSET_CATEGORIES" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>
          <label>
            Status
            <select v-model="filters.status">
              <option value="">All statuses</option>
              <option v-for="status in ASSET_STATUSES" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
          <label>
            Location
            <input v-model="filters.location" placeholder="Filter by location" />
          </label>
          <label>
            Target Market
            <input v-model="filters.targetMarket" placeholder="Filter by target market" />
          </label>
          <FilterActions @apply="loadAssets" @clear="clearFilters" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="success" class="form-success">{{ success }}</p>

        <div v-if="loading" class="empty-state compact">
          <h2>Loading assets...</h2>
        </div>

        <div v-else-if="!assets.length" class="empty-state compact">
          <h2>No tourism assets found</h2>
          <p>Create the first tourism asset or adjust the filters.</p>
        </div>

        <div v-else class="asset-table-wrap">
          <table class="asset-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Location</th>
                <th>Target Market</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in assets" :key="asset.id">
                <td>
                  <strong>{{ asset.name }}</strong>
                  <span>{{ asset.description }}</span>
                  <small v-if="asset.remarks">{{ asset.remarks }}</small>
                </td>
                <td>{{ asset.category }}</td>
                <td>{{ asset.location }}</td>
                <td>{{ asset.targetMarket }}</td>
                <td>
                  <StatusPill :status="asset.developmentStatus" />
                </td>
                <td>
                  <div class="table-actions">
                    <button
                      v-if="canEditAssets && asset.developmentStatus !== 'Archived'"
                      class="secondary-button"
                      type="button"
                      @click="editAsset(asset)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="canArchiveAssets && asset.developmentStatus !== 'Archived'"
                      class="danger-button"
                      type="button"
                      @click="archiveAsset(asset)"
                    >
                      Archive
                    </button>
                    <span v-if="auth.isViewOnly">View only</span>
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
.asset-form,
.asset-panel {
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.asset-panel {
  overflow: hidden;
}

.asset-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.4fr);
  gap: 18px;
  align-items: start;
}

.asset-form,
.asset-panel {
  padding: 22px;
}

.asset-form {
  display: grid;
  gap: 16px;
}

.asset-form label {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.asset-form input,
.asset-form select,
.asset-form textarea,
.filter-panel input,
.filter-panel select {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 11px 12px;
  background: white;
  color: var(--color-ink);
}

.asset-form textarea {
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

.asset-table-wrap {
  overflow-x: auto;
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
}

.asset-table th,
.asset-table td {
  border-bottom: 1px solid var(--color-line);
  padding: 14px 10px;
  text-align: left;
  vertical-align: top;
}

.asset-table th {
  color: var(--color-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.asset-table td strong,
.asset-table td span,
.asset-table td small {
  display: block;
}

.asset-table td strong {
  margin-bottom: 4px;
}

.asset-table td span,
.asset-table td small {
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
  .asset-layout {
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
