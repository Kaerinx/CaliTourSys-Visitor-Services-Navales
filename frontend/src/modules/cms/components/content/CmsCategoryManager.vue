<script setup>
import { onMounted, ref } from 'vue'
import CmsCategoryForm from './CmsCategoryForm.vue'
import CmsContentToolbar from './CmsContentToolbar.vue'
import CmsDataTable from './CmsDataTable.vue'
import CmsPagination from './CmsPagination.vue'
import CmsStatusBadge from './CmsStatusBadge.vue'
import { useCmsAuthStore } from '../../stores/authStore'
import { cmsContentApi } from '../../services/cmsContentApi'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'

const props = defineProps({
  kind: { type: String, required: true },
  eyebrow: { type: String, default: 'Categories' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  writePermission: { type: String, required: true },
  showColor: { type: Boolean, default: false },
})

const auth = useCmsAuthStore()
const api = {
  event: {
    list: cmsContentApi.getEventCategories,
    create: cmsContentApi.createEventCategory,
    update: cmsContentApi.updateEventCategory,
  },
  product: {
    list: cmsContentApi.getProductCategories,
    create: cmsContentApi.createProductCategory,
    update: cmsContentApi.updateProductCategory,
  },
  destination: {
    list: cmsContentApi.getDestinationCategories,
    create: cmsContentApi.createDestinationCategory,
    update: cmsContentApi.updateDestinationCategory,
  },
  museum: {
    list: cmsContentApi.getMuseumCategories,
    create: cmsContentApi.createMuseumCategory,
    update: cmsContentApi.updateMuseumCategory,
  },
}[props.kind]

const {
  error,
  filters,
  isLoading,
  items,
  load,
  pagination,
  setPage,
} = useCmsList(api.list, {
  sort: 'displayOrder',
})

const columns = [
  { key: 'name', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'order', label: 'Display order' },
  ...(props.showColor ? [{ key: 'color', label: 'Color' }] : []),
  { key: 'updated', label: 'Updated' },
  { key: 'actions', label: 'Actions' },
]

const formOpen = ref(false)
const selected = ref(null)
const formError = ref('')
const isSaving = ref(false)
const notice = ref('')

onMounted(load)

function canWrite() {
  return auth.hasPermission(props.writePermission)
}

function openCreate() {
  selected.value = null
  formError.value = ''
  formOpen.value = true
}

function openEdit(item) {
  selected.value = item
  formError.value = ''
  formOpen.value = true
}

async function submitCategory(payload) {
  isSaving.value = true
  formError.value = ''
  try {
    if (selected.value?.id) await api.update(selected.value.id, payload)
    else await api.create(payload)
    formOpen.value = false
    notice.value = selected.value?.id ? 'Category updated.' : 'Category created.'
    await load()
  } catch (err) {
    formError.value = friendlyContentError(err)
  } finally {
    isSaving.value = false
  }
}

function formatDate(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}
</script>

<template>
  <section class="cms-content-page" :aria-labelledby="`cms-${kind}-categories-title`">
    <header class="cms-content-page__header">
      <div>
        <p>{{ eyebrow }}</p>
        <h1 :id="`cms-${kind}-categories-title`">{{ title }}</h1>
        <span>{{ description }}</span>
      </div>
    </header>

    <nav class="cms-content-page__tabs" aria-label="CMS category sections">
      <RouterLink to="/cms/categories/events">Event categories</RouterLink>
      <RouterLink to="/cms/categories/products">Product categories</RouterLink>
      <RouterLink to="/cms/categories/destinations">Destination categories</RouterLink>
      <RouterLink to="/cms/categories/museum">Museum categories</RouterLink>
    </nav>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <CmsContentToolbar
      v-model:search="filters.search"
      v-model:status="filters.status"
      :create-label="`Create ${title.toLowerCase().replace(' categories', ' category')}`"
      :can-create="canWrite()"
      @create="openCreate"
    />

    <CmsDataTable
      :columns="columns"
      :items="items"
      :loading="isLoading"
      :error="error"
      empty-title="No categories found"
      empty-text="Create a category or adjust your filters."
      @retry="load"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="item in tableItems" :key="item.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ item.name }}</strong>
              <span>{{ item.slug }}</span>
            </span>
          </td>
          <td><CmsStatusBadge :status="item.status" /></td>
          <td>{{ item.displayOrder }}</td>
          <td v-if="showColor">
            <span class="cms-color-chip"><i :style="{ backgroundColor: item.color || '#cbd5e1' }"></i>{{ item.color || 'No color' }}</span>
          </td>
          <td>{{ formatDate(item.updatedAt) }}</td>
          <td>
            <span class="cms-table-actions">
              <button v-if="canWrite()" type="button" @click="openEdit(item)">Edit</button>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="item in cardItems" :key="item.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ item.name }}</strong>
            <span>{{ item.slug }}</span>
          </span>
          <div class="cms-mobile-meta">
            <CmsStatusBadge :status="item.status" />
            <span>Order {{ item.displayOrder }}</span>
          </div>
          <span v-if="showColor" class="cms-color-chip"><i :style="{ backgroundColor: item.color || '#cbd5e1' }"></i>{{ item.color || 'No color' }}</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button v-if="canWrite()" type="button" @click="openEdit(item)">Edit</button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <CmsPagination :pagination="pagination" @page-change="setPage" />

    <CmsCategoryForm
      :open="formOpen"
      :value="selected"
      :label="title.toLowerCase().replace(' categories', ' category')"
      :show-color="showColor"
      :busy="isSaving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitCategory"
    />
  </section>
</template>

<style scoped>
@import '../../views/content/cms-content-page.css';
</style>
