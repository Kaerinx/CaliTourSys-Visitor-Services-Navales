<script setup>
import { computed, ref, watch } from 'vue'
import CmsIcon from '../CmsIcon.vue'

const props = defineProps({
  item: { type: Object, default: null },
  url: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  fileName: { type: String, default: '' },
  altText: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  allowExpand: { type: Boolean, default: true },
})

const imageFailed = ref(false)
const previewOpen = ref(false)

const fileUrl = computed(() => props.item?.fileUrl || props.url || '')
const resolvedMimeType = computed(() => props.item?.mimeType || props.mimeType || '')
const resolvedFileName = computed(() => props.item?.fileName || props.fileName || fileNameFromUrl(fileUrl.value))
const resolvedAltText = computed(() => props.item?.altText || props.altText || resolvedFileName.value || 'Media preview')
const isImage = computed(() => {
  if (imageFailed.value || !fileUrl.value) return false
  if (resolvedMimeType.value.toLowerCase().startsWith('image/')) return true
  return /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(fileUrl.value)
})

watch(fileUrl, () => {
  imageFailed.value = false
  previewOpen.value = false
})

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
  <div class="cms-media-preview" :class="{ 'is-compact': compact }">
    <button
      v-if="isImage"
      class="cms-media-preview__image"
      type="button"
      :disabled="!allowExpand"
      :aria-label="allowExpand ? 'Open larger media preview' : undefined"
      @click="previewOpen = allowExpand"
    >
      <img :src="fileUrl" :alt="resolvedAltText" loading="lazy" @error="imageFailed = true" />
    </button>

    <div v-else class="cms-media-preview__fallback">
      <CmsIcon name="image" />
      <strong>{{ resolvedFileName || 'Media asset' }}</strong>
      <span>{{ resolvedMimeType || 'No MIME type' }}</span>
    </div>

    <Teleport to="body">
      <div v-if="previewOpen" class="cms-media-preview-modal" role="presentation" @click.self="previewOpen = false">
        <section class="cms-media-preview-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-media-preview-title">
          <header>
            <div>
              <p>Media Preview</p>
              <h2 id="cms-media-preview-title">{{ resolvedFileName || 'Media asset' }}</h2>
            </div>
            <button type="button" aria-label="Close media preview" @click="previewOpen = false">x</button>
          </header>
          <div class="cms-media-preview-modal__body">
            <img :src="fileUrl" :alt="resolvedAltText" />
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cms-media-preview {
  min-width: 0;
}

.cms-media-preview__image,
.cms-media-preview__fallback {
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  place-items: center;
  overflow: hidden;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-media-preview__image {
  padding: 0;
  cursor: zoom-in;
}

.cms-media-preview__image:disabled {
  cursor: default;
}

.cms-media-preview__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-media-preview__fallback {
  gap: 6px;
  padding: 14px;
  color: #64748b;
  text-align: center;
}

.cms-media-preview__fallback svg {
  width: 34px;
  height: 34px;
  color: #94a3b8;
}

.cms-media-preview__fallback strong {
  max-width: 100%;
  overflow: hidden;
  color: #0f172a;
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-media-preview__fallback span {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-media-preview.is-compact .cms-media-preview__image,
.cms-media-preview.is-compact .cms-media-preview__fallback {
  aspect-ratio: 1 / 1;
}

.cms-media-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 85;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.58);
}

.cms-media-preview-modal__dialog {
  width: min(920px, 100%);
  max-height: calc(100vh - 40px);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.cms-media-preview-modal header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.cms-media-preview-modal p,
.cms-media-preview-modal h2 {
  margin: 0;
}

.cms-media-preview-modal p {
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.cms-media-preview-modal h2 {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.12rem;
}

.cms-media-preview-modal button {
  display: grid;
  width: 34px;
  min-height: 34px;
  padding: 0;
  place-items: center;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 900;
}

.cms-media-preview-modal button:focus-visible,
.cms-media-preview__image:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.18);
  outline-offset: 2px;
}

.cms-media-preview-modal__body {
  display: grid;
  max-height: calc(100vh - 116px);
  place-items: center;
  overflow: auto;
  padding: 16px;
  background: #0f172a;
}

.cms-media-preview-modal__body img {
  max-width: 100%;
  max-height: calc(100vh - 148px);
  object-fit: contain;
}
</style>

