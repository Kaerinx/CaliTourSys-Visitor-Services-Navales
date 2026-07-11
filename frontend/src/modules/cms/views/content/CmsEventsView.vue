<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsEventForm from '../../components/content/CmsEventForm.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { useCmsAuthStore } from '../../stores/authStore'
import { cmsContentApi } from '../../services/cmsContentApi'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { getTourismAssets } from '@/modules/product/services/productApi'

const auth = useCmsAuthStore()
const categories = ref([])
const assets = ref([])
const categoryLoadError = ref('')
const assetLoadError = ref('')
const {
  error,
  filters,
  isLoading,
  items,
  load,
  pagination,
  setPage,
} = useCmsList(cmsContentApi.getEvents, {
  categoryId: '',
  sort: '-startsAt',
})

const columns = [
  { key: 'title', label: 'Event' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'recurrence', label: 'Recurrence' },
  { key: 'featured', label: 'Featured' },
  { key: 'dates', label: 'Date' },
  { key: 'actions', label: 'Actions' },
]

const formOpen = ref(false)
const selected = ref(null)
const formError = ref('')
const isSaving = ref(false)
const notice = ref('')
const confirmAction = ref(null)
const isActionBusy = ref(false)

const displayedItems = computed(() => {
  if (!filters.categoryId) return items.value
  return items.value.filter((item) => item.categoryId === filters.categoryId)
})

onMounted(async () => {
  await Promise.all([load(), loadCategories(), loadAssets()])
})

function can(permission) {
  return auth.hasPermission(permission)
}

async function loadCategories() {
  categoryLoadError.value = ''
  try {
    const { data } = await cmsContentApi.getEventCategories({ limit: 100, status: 'published' })
    categories.value = data || []
  } catch (err) {
    categoryLoadError.value = friendlyContentError(err)
  }
}

async function loadAssets() {
  assetLoadError.value = ''
  try {
    const response = await getTourismAssets({ limit: 100 })
    assets.value = (response.data || []).filter((asset) => asset.developmentStatus !== 'Archived')
  } catch (err) {
    assetLoadError.value = friendlyContentError(err)
  }
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

function openDuplicate(item) {
  selected.value = {
    ...item,
    id: null,
    slug: '',
    title: nextOccurrenceTitle(item),
    startsAt: shiftOccurrenceDate(item.startsAt, item.recurrenceType),
    endsAt: shiftOccurrenceDate(item.endsAt, item.recurrenceType),
    status: 'draft',
    isFeatured: false,
    publishedAt: null,
    archivedAt: null,
  }
  formError.value = ''
  formOpen.value = true
}

async function submitEvent(payload) {
  isSaving.value = true
  formError.value = ''
  try {
    if (selected.value?.id) await cmsContentApi.updateEvent(selected.value.id, payload)
    else await cmsContentApi.createEvent(payload)
    formOpen.value = false
    notice.value = selected.value?.id ? 'Event updated.' : 'Event created.'
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
      await cmsContentApi.publishEvent(confirmAction.value.item.id)
      notice.value = 'Event published.'
    } else {
      await cmsContentApi.archiveEvent(confirmAction.value.item.id)
      notice.value = 'Event archived.'
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
  const start = formatDateTime(item.startsAt)
  const end = formatDateTime(item.endsAt)
  if (start && end) return `${start} to ${end}`
  return start || end || 'No schedule'
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatEventCategories(item) {
  const categories = Array.isArray(item.categories) && item.categories.length ? item.categories : [item.category].filter(Boolean)
  return categories.map((category) => category?.name).filter(Boolean).join(' / ') || 'Uncategorized'
}

function formatRecurrence(item) {
  if (!item.isRecurring) return 'One-time'

  const type =
    {
      yearly: 'Yearly',
      twice_a_year: 'Twice a year',
      one_time: 'One-time',
    }[item.recurrenceType] || 'Recurring'
  const month = item.usualMonth
    ? new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2026, Number(item.usualMonth) - 1, 1))
    : ''
  const next = item.nextOccurrenceDate ? `Next: ${formatDateOnly(item.nextOccurrenceDate)}` : ''
  return [type, month, next].filter(Boolean).join(' / ')
}

function formatDateOnly(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function shiftOccurrenceDate(value, recurrenceType) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  date.setMonth(date.getMonth() + (recurrenceType === 'twice_a_year' ? 6 : 12))
  return date.toISOString()
}

function nextOccurrenceTitle(item) {
  const nextStartsAt = shiftOccurrenceDate(item.startsAt, item.recurrenceType)
  const year = nextStartsAt ? new Date(nextStartsAt).getFullYear() : ''
  const baseTitle = String(item.title || '').replace(/\s+\d{4}\s*$/, '').trim()
  return year ? `${baseTitle} ${year}` : `${baseTitle} Copy`
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-events-title">
    <header class="cms-content-page__header">
      <div>
        <p>Events Calendar</p>
        <h1 id="cms-events-title">Events</h1>
        <span>Manage festivals, tourism programs, venue details, and public event visibility.</span>
      </div>
    </header>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>
    <div v-if="categoryLoadError" class="cms-content-page__notice" role="status">{{ categoryLoadError }}</div>
    <div v-if="assetLoadError" class="cms-content-page__notice" role="status">{{ assetLoadError }}</div>

    <CmsContentToolbar
      v-model:search="filters.search"
      v-model:status="filters.status"
      v-model:featured="filters.featured"
      v-model:category-id="filters.categoryId"
      create-label="Create event"
      :can-create="can('events.create')"
      :categories="categories"
      show-featured
      show-category
      @create="openCreate"
    />

    <CmsDataTable
      :columns="columns"
      :items="displayedItems"
      :loading="isLoading"
      :error="error"
      empty-title="No events found"
      empty-text="Create the first event draft or adjust your filters."
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
          <td>{{ formatEventCategories(item) }}</td>
          <td><CmsStatusBadge :status="item.status" /></td>
          <td>{{ formatRecurrence(item) }}</td>
          <td><span class="cms-feature-dot" :class="{ 'is-featured': item.isFeatured }">{{ item.isFeatured ? 'Featured' : 'Standard' }}</span></td>
          <td>{{ formatDateRange(item) }}</td>
          <td>
            <span class="cms-table-actions">
              <button v-if="can('events.update')" type="button" @click="openEdit(item)">Edit</button>
              <button v-if="can('events.create')" type="button" @click="openDuplicate(item)">Duplicate</button>
              <button v-if="can('events.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button>
              <button v-if="can('events.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button>
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
            <span>{{ formatEventCategories(item) }}</span>
            <span>{{ formatRecurrence(item) }}</span>
          </div>
          <span>{{ formatDateRange(item) }}</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button v-if="can('events.update')" type="button" @click="openEdit(item)">Edit</button>
            <button v-if="can('events.create')" type="button" @click="openDuplicate(item)">Duplicate</button>
            <button v-if="can('events.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button>
            <button v-if="can('events.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button>
          </div>
        </article>
      </template>
    </CmsDataTable>

    <CmsPagination :pagination="pagination" @page-change="setPage" />

    <CmsEventForm
      :open="formOpen"
      :value="selected"
      :categories="categories"
      :assets="assets"
      :busy="isSaving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitEvent"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      :title="confirmAction?.type === 'publish' ? 'Publish this event?' : 'Archive this event?'"
      :message="confirmAction?.type === 'publish' ? 'Published events can appear on the public calendar.' : 'Archived events are hidden from active public content.'"
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
