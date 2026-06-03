<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsMediaForm from '../../components/content/CmsMediaForm.vue'
import CmsMediaPreview from '../../components/content/CmsMediaPreview.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { cmsOperationsApi } from '../../services/cmsOperationsApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsOperationsApi.getMedia, {
  mimeType: '',
  storageProvider: '',
  sort: '-createdAt',
})

const formOpen = ref(false)
const selected = ref(null)
const formError = ref('')
const isSaving = ref(false)
const isDetailLoading = ref(false)
const notice = ref('')
const confirmAction = ref(null)
const isActionBusy = ref(false)

const hasFilters = computed(() =>
  Boolean(filters.search || filters.status || filters.mimeType || filters.storageProvider),
)

onMounted(load)

function can(permission) {
  return auth.hasPermission(permission)
}

function openCreate() {
  selected.value = null
  formError.value = ''
  formOpen.value = true
}

async function openEdit(item) {
  formError.value = ''
  selected.value = item
  formOpen.value = true
  isDetailLoading.value = true
  try {
    const { data } = await cmsOperationsApi.getMediaById(item.id)
    selected.value = data || item
  } catch (err) {
    formError.value = friendlyContentError(err)
  } finally {
    isDetailLoading.value = false
  }
}

async function submitRecord(payload) {
  isSaving.value = true
  formError.value = ''
  try {
    if (selected.value?.id) await cmsOperationsApi.updateMedia(selected.value.id, payload)
    else await cmsOperationsApi.createMedia(payload)
    formOpen.value = false
    notice.value = selected.value?.id ? 'Media metadata updated.' : 'Media URL added.'
    await load()
  } catch (err) {
    formError.value = friendlyContentError(err)
  } finally {
    isSaving.value = false
  }
}

function askArchive(item) {
  confirmAction.value = { item }
}

async function archiveMedia() {
  if (!confirmAction.value) return
  isActionBusy.value = true
  try {
    await cmsOperationsApi.archiveMedia(confirmAction.value.item.id)
    notice.value = 'Media asset archived.'
    confirmAction.value = null
    await load()
  } catch (err) {
    error.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function copyUrl(item) {
  if (!item.fileUrl) {
    notice.value = 'This media asset has no URL to copy.'
    return
  }

  if (!navigator?.clipboard?.writeText) {
    notice.value = 'Clipboard is unavailable. Select and copy the URL from the media card.'
    return
  }

  try {
    await navigator.clipboard.writeText(item.fileUrl)
    notice.value = 'Media URL copied.'
  } catch {
    notice.value = 'Unable to copy the URL. Select and copy it from the media card.'
  }
}

function formatDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function dimensions(item) {
  if (item.width && item.height) return `${item.width} x ${item.height}`
  return 'No dimensions'
}

function titleFor(item) {
  return item.fileName || fileNameFromUrl(item.fileUrl) || 'Untitled media'
}

function fileNameFromUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')
  } catch {
    return value.split('/').filter(Boolean).pop() || ''
  }
}
</script>

<template>
  <section class="cms-content-page cms-media-page" aria-labelledby="cms-media-title">
    <header class="cms-content-page__header">
      <div>
        <p>Media Library</p>
        <h1 id="cms-media-title">Media Assets</h1>
        <span>Manage reusable image and file metadata for products, events, destinations, museum artifacts, promotions, and business profiles.</span>
      </div>
    </header>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <CmsContentToolbar
      v-model:search="filters.search"
      v-model:status="filters.status"
      v-model:mime-type="filters.mimeType"
      v-model:storage-provider="filters.storageProvider"
      :status-options="[
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ]"
      create-label="Add media URL"
      :can-create="can('media.upload')"
      can-refresh
      show-mime-type
      show-storage-provider
      @create="openCreate"
      @refresh="load"
    />

    <section class="cms-media-page__panel" aria-live="polite">
      <div v-if="isLoading" class="cms-media-page__grid" aria-busy="true">
        <article v-for="index in 8" :key="index" class="cms-media-card cms-media-card--skeleton">
          <div></div>
          <span></span>
          <span></span>
        </article>
      </div>

      <div v-else-if="error" class="cms-media-page__state cms-media-page__state--error" role="alert">
        <strong>Unable to load media assets</strong>
        <p>{{ error }}</p>
        <button type="button" @click="load">Try again</button>
      </div>

      <div v-else-if="!items.length" class="cms-media-page__state">
        <strong>{{ hasFilters ? 'No media matches these filters' : 'No media assets found' }}</strong>
        <p>{{ hasFilters ? 'Adjust the search, status, MIME type, or storage provider filters.' : 'Add an external media URL to start building the reusable CMS media library.' }}</p>
        <button v-if="can('media.upload')" type="button" @click="openCreate">Add media URL</button>
      </div>

      <div v-else class="cms-media-page__grid">
        <article v-for="item in items" :key="item.id" class="cms-media-card">
          <CmsMediaPreview :item="item" />

          <div class="cms-media-card__body">
            <div class="cms-media-card__title">
              <strong>{{ titleFor(item) }}</strong>
              <CmsStatusBadge :status="item.status" />
            </div>

            <a :href="item.fileUrl" target="_blank" rel="noreferrer">{{ item.fileUrl }}</a>

            <dl>
              <div>
                <dt>MIME</dt>
                <dd>{{ item.mimeType || 'Not set' }}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{{ item.storageProvider || 'external' }}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd>{{ dimensions(item) }}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{{ formatDate(item.createdAt) }}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{{ formatDate(item.updatedAt) }}</dd>
              </div>
            </dl>

            <div class="cms-media-card__copy">
              <span>Alt</span>
              <p>{{ item.altText || 'No alt text provided' }}</p>
            </div>

            <div v-if="item.caption || item.credit" class="cms-media-card__copy">
              <span>{{ item.caption ? 'Caption' : 'Credit' }}</span>
              <p>{{ item.caption || item.credit }}</p>
              <small v-if="item.caption && item.credit">Credit: {{ item.credit }}</small>
            </div>
          </div>

          <footer>
            <button type="button" @click="copyUrl(item)">Copy URL</button>
            <button v-if="can('media.upload')" type="button" :disabled="isDetailLoading && selected?.id === item.id" @click="openEdit(item)">
              {{ isDetailLoading && selected?.id === item.id ? 'Opening...' : 'Edit' }}
            </button>
            <button v-if="can('media.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askArchive(item)">
              Archive
            </button>
          </footer>
        </article>
      </div>
    </section>

    <CmsPagination :pagination="pagination" @page-change="setPage" />

    <CmsMediaForm
      :open="formOpen"
      :value="selected"
      :busy="isSaving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitRecord"
    />

    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      title="Archive this media asset?"
      message="Archived media remains in the library but should be hidden from active selection workflows."
      confirm-label="Archive"
      tone="danger"
      :busy="isActionBusy"
      @cancel="confirmAction = null"
      @confirm="archiveMedia"
    />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';

.cms-media-page__panel {
  min-width: 0;
}

.cms-media-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
  gap: 14px;
}

.cms-media-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.cms-media-card > :deep(.cms-media-preview) {
  border-bottom: 1px solid #e2e8f0;
}

.cms-media-card > :deep(.cms-media-preview__image),
.cms-media-card > :deep(.cms-media-preview__fallback) {
  border: 0;
  border-radius: 0;
}

.cms-media-card__body {
  display: grid;
  flex: 1 1 auto;
  gap: 12px;
  min-width: 0;
  padding: 14px;
}

.cms-media-card__title {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
}

.cms-media-card__title strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #0f172a;
  line-height: 1.3;
}

.cms-media-card a {
  min-width: 0;
  overflow: hidden;
  color: #075985;
  font-size: 0.82rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

dl div {
  min-width: 0;
  padding: 8px;
  border-radius: 8px;
  background: #f8fafc;
}

dt,
dd {
  margin: 0;
}

dt,
.cms-media-card__copy span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

dd {
  min-width: 0;
  overflow: hidden;
  margin-top: 2px;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-media-card__copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.cms-media-card__copy p,
.cms-media-card__copy small {
  margin: 0;
  overflow-wrap: anywhere;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.45;
}

.cms-media-card__copy small {
  color: #64748b;
}

footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

footer button,
.cms-media-page__state button {
  min-height: 36px;
  padding: 0 11px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
}

footer button.is-danger {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

footer button:disabled {
  cursor: wait;
  opacity: 0.65;
}

footer button:focus-visible,
.cms-media-page__state button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.18);
  outline-offset: 2px;
}

.cms-media-page__state {
  display: grid;
  gap: 10px;
  min-height: 260px;
  place-items: center;
  padding: 32px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.cms-media-page__state strong {
  color: #0f172a;
}

.cms-media-page__state p {
  max-width: 540px;
  margin: 0;
  line-height: 1.5;
}

.cms-media-page__state--error {
  color: #991b1b;
}

.cms-media-card--skeleton {
  gap: 12px;
  padding: 12px;
}

.cms-media-card--skeleton div,
.cms-media-card--skeleton span {
  display: block;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 40%, #eef2f7 65%);
  background-size: 220% 100%;
  animation: cms-media-skeleton 1.1s ease-in-out infinite;
}

.cms-media-card--skeleton div {
  aspect-ratio: 4 / 3;
}

.cms-media-card--skeleton span {
  height: 18px;
}

@keyframes cms-media-skeleton {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 520px) {
  dl {
    grid-template-columns: 1fr;
  }

  footer button {
    flex: 1 1 100%;
  }
}
</style>

