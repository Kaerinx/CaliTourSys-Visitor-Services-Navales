<script setup>
import { onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsPromotionForm from '../../components/content/CmsPromotionForm.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { useCmsAuthStore } from '../../stores/authStore'
import { cmsContentApi } from '../../services/cmsContentApi'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'

const auth = useCmsAuthStore()
const {
  error,
  filters,
  isLoading,
  items,
  load,
  pagination,
  setPage,
} = useCmsList(cmsContentApi.getPromotions, {
  featured: '',
  sort: '-createdAt',
})

const columns = [
  { key: 'title', label: 'Promotion' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'featured', label: 'Featured' },
  { key: 'dates', label: 'Schedule' },
  { key: 'actions', label: 'Actions' },
]

const formOpen = ref(false)
const selected = ref(null)
const formError = ref('')
const isSaving = ref(false)
const notice = ref('')
const confirmAction = ref(null)
const isActionBusy = ref(false)

onMounted(load)

function can(permission) {
  return auth.hasPermission(permission)
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

async function submitPromotion(payload) {
  isSaving.value = true
  formError.value = ''
  try {
    if (selected.value?.id) await cmsContentApi.updatePromotion(selected.value.id, payload)
    else await cmsContentApi.createPromotion(payload)
    formOpen.value = false
    notice.value = selected.value?.id ? 'Promotion updated.' : 'Promotion created.'
    await load()
  } catch (err) {
    formError.value = friendlyContentError(err)
  } finally {
    isSaving.value = false
  }
}

function askAction(type, item) {
  confirmAction.value = { type, item }
}

async function runConfirmedAction() {
  if (!confirmAction.value) return
  isActionBusy.value = true
  try {
    if (confirmAction.value.type === 'publish') {
      await cmsContentApi.publishPromotion(confirmAction.value.item.id)
      notice.value = 'Promotion published.'
    } else {
      await cmsContentApi.archivePromotion(confirmAction.value.item.id)
      notice.value = 'Promotion archived.'
    }
    confirmAction.value = null
    await load()
  } catch (err) {
    error.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

function formatDateRange(item) {
  const start = formatDate(item.startsAt)
  const end = formatDate(item.endsAt)
  if (start && end) return `${start} to ${end}`
  return start || end || 'No schedule'
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-promotions-title">
    <header class="cms-content-page__header">
      <div>
        <p>Content Management</p>
        <h1 id="cms-promotions-title">Promotions</h1>
        <span>Create and maintain public tourism campaigns, announcements, and featured offers.</span>
      </div>
    </header>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <CmsContentToolbar
      v-model:search="filters.search"
      v-model:status="filters.status"
      v-model:featured="filters.featured"
      create-label="Create promotion"
      :can-create="can('promotions.create')"
      show-featured
      @create="openCreate"
    />

    <CmsDataTable
      :columns="columns"
      :items="items"
      :loading="isLoading"
      :error="error"
      empty-title="No promotions found"
      empty-text="Create the first promotion draft or adjust your filters."
      @retry="load"
    >
      <template #rows="{ items: tableItems }">
        <tr v-for="item in tableItems" :key="item.id">
          <td>
            <span class="cms-table-title">
              <strong>{{ item.title }}</strong>
              <span>{{ item.slug }}</span>
            </span>
          </td>
          <td>{{ item.promotionType }}</td>
          <td><CmsStatusBadge :status="item.status" /></td>
          <td><span class="cms-feature-dot" :class="{ 'is-featured': item.isFeatured }">{{ item.isFeatured ? 'Featured' : 'Standard' }}</span></td>
          <td>{{ formatDateRange(item) }}</td>
          <td>
            <span class="cms-table-actions">
              <button v-if="can('promotions.update')" type="button" @click="openEdit(item)">Edit</button>
              <button v-if="can('promotions.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button>
              <button v-if="can('promotions.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button>
            </span>
          </td>
        </tr>
      </template>

      <template #cards="{ items: cardItems }">
        <article v-for="item in cardItems" :key="item.id" class="cms-mobile-card">
          <span class="cms-table-title">
            <strong>{{ item.title }}</strong>
            <span>{{ item.slug }}</span>
          </span>
          <div class="cms-mobile-meta">
            <CmsStatusBadge :status="item.status" />
            <span class="cms-feature-dot" :class="{ 'is-featured': item.isFeatured }">{{ item.isFeatured ? 'Featured' : 'Standard' }}</span>
          </div>
          <span>{{ formatDateRange(item) }}</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button v-if="can('promotions.update')" type="button" @click="openEdit(item)">Edit</button>
            <button v-if="can('promotions.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button>
            <button v-if="can('promotions.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <CmsPagination :pagination="pagination" @page-change="setPage" />

    <CmsPromotionForm
      :open="formOpen"
      :value="selected"
      :busy="isSaving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitPromotion"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      :title="confirmAction?.type === 'publish' ? 'Publish this promotion?' : 'Archive this promotion?'"
      :message="confirmAction?.type === 'publish' ? 'Published promotions can appear on the public website.' : 'Archived promotions are hidden from active public content.'"
      :confirm-label="confirmAction?.type === 'publish' ? 'Publish' : 'Archive'"
      :tone="confirmAction?.type === 'archive' ? 'danger' : 'primary'"
      :busy="isActionBusy"
      @cancel="confirmAction = null"
      @confirm="runConfirmedAction"
    />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';
</style>
