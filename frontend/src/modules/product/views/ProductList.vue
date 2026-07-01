<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import CmsConfirmDialog from '@/modules/cms/components/content/CmsConfirmDialog.vue'
import CmsDataTable from '@/modules/cms/components/content/CmsDataTable.vue'
import CmsIcon from '@/modules/cms/components/CmsIcon.vue'
import ProductAssetForm from '@/modules/product/components/ProductAssetForm.vue'
import RoleNotice from '@/modules/product/components/RoleNotice.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { ASSET_CATEGORIES } from '@/modules/product/constants/productOptions'
import {
  archiveTourismAsset,
  createTourismAsset,
  getTourismAssets,
  updateTourismAsset,
} from '@/modules/product/services/productApi'
import { USER_ROLES } from '@/stores/auth'

const props = defineProps({
  embedded: { type: Boolean, default: false },
})

const auth = useProductAccess()

const assets = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const formOpen = ref(false)
const selectedAsset = ref(null)
const formError = ref('')
const saving = ref(false)
const confirmAction = ref(null)
const actionBusy = ref(false)

const filters = reactive({
  search: '',
  category: '',
  location: '',
  targetMarket: '',
})

const columns = [
  { key: 'asset', label: 'Asset' },
  { key: 'category', label: 'Category' },
  { key: 'location', label: 'Location' },
  { key: 'targetMarket', label: 'Target market' },
  { key: 'actions', label: 'Actions' },
]

const canEditAssets = computed(() =>
  [USER_ROLES.TOURISM_STAFF, USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(
    auth.user?.role,
  ),
)

const canArchiveAssets = computed(() =>
  [USER_ROLES.TOURISM_OFFICER, USER_ROLES.SYSTEM_ADMINISTRATOR].includes(auth.user?.role),
)

onMounted(loadAssets)

function openCreate() {
  selectedAsset.value = null
  formError.value = ''
  formOpen.value = true
}

function openEdit(asset) {
  selectedAsset.value = asset
  formError.value = ''
  formOpen.value = true
}

function clearFilters() {
  filters.search = ''
  filters.category = ''
  filters.location = ''
  filters.targetMarket = ''
  loadAssets()
}

async function loadAssets() {
  loading.value = true
  error.value = ''

  try {
    const response = await getTourismAssets(filters)
    assets.value = (response.data || []).filter((asset) => asset.developmentStatus !== 'Archived')
  } catch (err) {
    error.value = err.message || 'Unable to load tourism assets.'
  } finally {
    loading.value = false
  }
}

async function submitAsset(payload) {
  saving.value = true
  formError.value = ''
  notice.value = ''

  try {
    if (selectedAsset.value?.id) {
      await updateTourismAsset(selectedAsset.value.id, payload)
      notice.value = 'Asset updated.'
    } else {
      await createTourismAsset(payload)
      notice.value = 'Asset created.'
    }

    formOpen.value = false
    await loadAssets()
  } catch (err) {
    formError.value = err.message || 'Unable to save asset.'
  } finally {
    saving.value = false
  }
}

function askArchive(asset) {
  confirmAction.value = asset
}

async function archiveAsset() {
  if (!confirmAction.value) return
  actionBusy.value = true
  error.value = ''
  notice.value = ''

  try {
    await archiveTourismAsset(confirmAction.value.id)
    notice.value = 'Asset archived.'
    confirmAction.value = null
    await loadAssets()
  } catch (err) {
    error.value = err.message || 'Unable to archive asset.'
  } finally {
    actionBusy.value = false
  }
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-assets-title">
    <header v-if="!props.embedded" class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-assets-title">Assets</h1>
        <span>Maintain tourism sites, attractions, and local resources before planning work starts.</span>
      </div>
    </header>

    <RoleNotice v-if="auth.isViewOnly">
      LGU Officials can view and filter assets, but cannot create, edit, or archive records.
    </RoleNotice>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <section class="asset-toolbar" aria-label="Asset filters">
      <label class="asset-toolbar__search">
        <span>Search</span>
        <CmsIcon name="search" />
        <input
          v-model="filters.search"
          type="search"
          placeholder="Search by name, description, or location"
          @keyup.enter="loadAssets"
        />
      </label>

      <label>
        <span>Category</span>
        <select v-model="filters.category" @change="loadAssets">
          <option value="">All categories</option>
          <option v-for="category in ASSET_CATEGORIES" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </label>

      <label>
        <span>Location</span>
        <input v-model="filters.location" placeholder="Filter by location" @keyup.enter="loadAssets" />
      </label>

      <label>
        <span>Target market</span>
        <input v-model="filters.targetMarket" placeholder="Filter by market" @keyup.enter="loadAssets" />
      </label>

      <div class="asset-toolbar__actions">
        <button type="button" @click="loadAssets">Apply</button>
        <button type="button" @click="clearFilters">Clear</button>
        <button v-if="canEditAssets" class="asset-toolbar__create" type="button" @click="openCreate">
          <span aria-hidden="true">+</span>
          Create asset
        </button>
      </div>
    </section>

    <CmsDataTable
      :columns="columns"
      :items="assets"
      :loading="loading"
      :error="error"
      empty-title="No assets found"
      empty-text="Create the first tourism asset or adjust your filters."
      @retry="loadAssets"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="asset in tableItems" :key="asset.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ asset.name }}</strong>
              <span>{{ asset.description }}</span>
              <span v-if="asset.remarks">{{ asset.remarks }}</span>
            </span>
          </td>
          <td>{{ asset.category }}</td>
          <td>{{ asset.location }}</td>
          <td>{{ asset.targetMarket }}</td>
          <td>
            <span class="cms-table-actions product-table-actions">
              <button
                v-if="canEditAssets && asset.developmentStatus !== 'Archived'"
                type="button"
                @click="openEdit(asset)"
              >
                Edit
              </button>
              <button
                v-if="canArchiveAssets && asset.developmentStatus !== 'Archived'"
                class="is-danger"
                type="button"
                @click="askArchive(asset)"
              >
                Archive
              </button>
              <span v-if="auth.isViewOnly">View only</span>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="asset in cardItems" :key="asset.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ asset.name }}</strong>
            <span>{{ asset.description }}</span>
          </span>
          <div class="cms-mobile-meta">
            <span>{{ asset.category }}</span>
            <span>{{ asset.location }}</span>
          </div>
          <span>{{ asset.targetMarket }}</span>
          <div class="cms-mobile-card__actions cms-table-actions product-table-actions">
            <button
              v-if="canEditAssets && asset.developmentStatus !== 'Archived'"
              type="button"
              @click="openEdit(asset)"
            >
              Edit
            </button>
            <button
              v-if="canArchiveAssets && asset.developmentStatus !== 'Archived'"
              class="is-danger"
              type="button"
              @click="askArchive(asset)"
            >
              Archive
            </button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <div class="asset-pagination">
      <div>
        <strong>{{ assets.length }} records</strong>
        <span>Use Archive to remove assets from active package selection.</span>
      </div>
    </div>

    <ProductAssetForm
      :open="formOpen"
      :value="selectedAsset"
      :busy="saving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitAsset"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      title="Archive this asset?"
      message="Archived assets are hidden from active Product Development work but remain available for records."
      confirm-label="Archive"
      tone="danger"
      :busy="actionBusy"
      @cancel="confirmAction = null"
      @confirm="archiveAsset"
    />
  </section>
</template>

<style scoped>
@import '@/modules/cms/views/content/cms-content-page.css';

.asset-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.asset-toolbar label {
  display: grid;
  flex: 1 0 172px;
  gap: 7px;
  min-width: min(100%, 172px);
}

.asset-toolbar__search {
  position: relative;
  flex: 2 0 280px;
  min-width: min(100%, 280px);
}

.asset-toolbar span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.asset-toolbar__search svg {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

.asset-toolbar input,
.asset-toolbar select {
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

.asset-toolbar__search input {
  padding-left: 38px;
}

.asset-toolbar input:focus,
.asset-toolbar select:focus,
.asset-toolbar button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 1px;
}

.asset-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.asset-toolbar button {
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

.asset-toolbar__create {
  color: #fff !important;
  border-color: #0f766e !important;
  background: #0f766e !important;
  white-space: nowrap;
}

.asset-toolbar__create:hover {
  background: #115e59 !important;
}

:deep(.cms-data-table__desktop table) {
  min-width: 1040px;
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
  min-width: 150px;
  justify-content: flex-end;
}

:deep(.product-table-actions button) {
  min-width: 64px;
}

.asset-pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.asset-pagination div {
  display: grid;
  gap: 2px;
}

.asset-pagination strong {
  color: #0f172a;
}

.asset-pagination span {
  color: #64748b;
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .asset-toolbar__actions {
    margin-left: 0;
  }
}

@media (max-width: 760px) {
  .asset-toolbar__actions,
  .asset-toolbar__actions button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .asset-toolbar label,
  .asset-toolbar__search {
    flex-basis: 100%;
    width: 100%;
  }
}
</style>
