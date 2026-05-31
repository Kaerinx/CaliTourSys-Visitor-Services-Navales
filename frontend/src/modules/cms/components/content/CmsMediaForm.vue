<script setup>
import { computed, reactive, watch } from 'vue'
import CmsMediaPreview from './CmsMediaPreview.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit media metadata' : 'Add media URL'))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Add media URL'
})
const clearNotice = computed(() => {
  if (!isEditing.value) return ''
  const cleared = ['fileName', 'mimeType', 'altText', 'caption', 'credit', 'storageKey', 'checksumSha256'].some(
    (key) => Boolean(props.value?.[key]) && !String(form[key] || '').trim(),
  )
  const numberCleared = ['width', 'height', 'fileSizeBytes'].some(
    (key) => props.value?.[key] !== null && props.value?.[key] !== undefined && !String(form[key] || '').trim(),
  )
  return cleared || numberCleared
    ? 'This API cannot clear existing optional values yet. Blank edited fields are left unchanged.'
    : ''
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output

  if (!form.fileUrl.trim()) output.fileUrl = 'File URL is required.'
  else if (!isValidUrl(form.fileUrl)) output.fileUrl = 'Enter a valid absolute URL.'

  if (form.width && !isPositiveInteger(form.width)) output.width = 'Width must be a positive whole number.'
  if (form.height && !isPositiveInteger(form.height)) output.height = 'Height must be a positive whole number.'
  if (form.fileSizeBytes && !isNonNegativeInteger(form.fileSizeBytes)) {
    output.fileSizeBytes = 'File size must be zero or a positive whole number.'
  }
  if (form.checksumSha256 && !/^[a-fA-F0-9]{64}$/.test(form.checksumSha256.trim())) {
    output.checksumSha256 = 'Checksum must be 64 hexadecimal characters.'
  }

  return output
})

watch(
  () => [props.open, props.value],
  () => {
    Object.assign(form, defaultForm(props.value))
    submitted.value = false
  },
  { immediate: true },
)

function defaultForm(value = null) {
  return {
    fileUrl: value?.fileUrl || '',
    fileName: value?.fileName || '',
    mimeType: value?.mimeType || '',
    altText: value?.altText || '',
    caption: value?.caption || '',
    credit: value?.credit || '',
    width: value?.width === null || value?.width === undefined ? '' : String(value.width),
    height: value?.height === null || value?.height === undefined ? '' : String(value.height),
    status: value?.status || 'active',
    storageProvider: value?.storageProvider || 'external',
    storageKey: value?.storageKey || '',
    fileSizeBytes: value?.fileSizeBytes === null || value?.fileSizeBytes === undefined ? '' : String(value.fileSizeBytes),
    checksumSha256: value?.checksumSha256 || '',
  }
}

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function isPositiveInteger(value) {
  return /^[1-9]\d*$/.test(String(value).trim())
}

function isNonNegativeInteger(value) {
  return /^(0|[1-9]\d*)$/.test(String(value).trim())
}

function trimValue(value) {
  const trimmed = String(value || '').trim()
  return trimmed || null
}

function addTextField(payload, key) {
  const value = trimValue(form[key])
  if (value !== null) payload[key] = value
  else if (!isEditing.value) payload[key] = null
}

function addNumberField(payload, key) {
  const value = String(form[key] || '').trim()
  if (value) payload[key] = Number(value)
  else if (!isEditing.value) payload[key] = null
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  const payload = {
    fileUrl: form.fileUrl.trim(),
    status: form.status || 'active',
    storageProvider: form.storageProvider || 'external',
  }

  ;['fileName', 'mimeType', 'altText', 'caption', 'credit', 'storageKey', 'checksumSha256'].forEach((key) => addTextField(payload, key))
  ;['width', 'height', 'fileSizeBytes'].forEach((key) => addNumberField(payload, key))

  emit('submit', payload)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal cms-media-form" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-media-form-title">
        <header>
          <div>
            <p>Media Assets</p>
            <h2 id="cms-media-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close media form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <label class="cms-media-form__url">
            <span>File URL</span>
            <input v-model="form.fileUrl" :aria-invalid="Boolean(errors.fileUrl)" placeholder="https://example.com/image.jpg" />
            <small v-if="errors.fileUrl">{{ errors.fileUrl }}</small>
          </label>

          <div class="cms-media-form__preview">
            <CmsMediaPreview
              :url="form.fileUrl"
              :mime-type="form.mimeType"
              :file-name="form.fileName"
              :alt-text="form.altText"
              :allow-expand="false"
            />
          </div>

          <div class="cms-form-modal__grid">
            <label>
              <span>File name</span>
              <input v-model="form.fileName" placeholder="calabanga-photo.jpg" />
            </label>
            <label>
              <span>MIME type</span>
              <input v-model="form.mimeType" placeholder="image/jpeg" />
            </label>
          </div>

          <label>
            <span>Alt text</span>
            <input v-model="form.altText" placeholder="Describe the image for screen readers" />
            <em>Recommended for accessibility and public content quality.</em>
          </label>

          <label>
            <span>Caption</span>
            <textarea v-model="form.caption" rows="3"></textarea>
          </label>

          <div class="cms-form-modal__grid">
            <label>
              <span>Credit</span>
              <input v-model="form.credit" placeholder="Photographer, office, or source" />
            </label>
            <label>
              <span>Status</span>
              <select v-model="form.status">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <div class="cms-form-modal__grid">
            <label>
              <span>Width</span>
              <input v-model="form.width" inputmode="numeric" :aria-invalid="Boolean(errors.width)" />
              <small v-if="errors.width">{{ errors.width }}</small>
            </label>
            <label>
              <span>Height</span>
              <input v-model="form.height" inputmode="numeric" :aria-invalid="Boolean(errors.height)" />
              <small v-if="errors.height">{{ errors.height }}</small>
            </label>
          </div>

          <div class="cms-form-modal__grid">
            <label>
              <span>Storage provider</span>
              <select v-model="form.storageProvider">
                <option value="external">External URL</option>
                <option value="local">Local</option>
                <option value="cloudinary">Cloudinary</option>
                <option value="s3">S3</option>
                <option value="supabase">Supabase</option>
              </select>
            </label>
            <label>
              <span>Storage key</span>
              <input v-model="form.storageKey" />
            </label>
          </div>

          <div class="cms-form-modal__grid">
            <label>
              <span>File size bytes</span>
              <input v-model="form.fileSizeBytes" inputmode="numeric" :aria-invalid="Boolean(errors.fileSizeBytes)" />
              <small v-if="errors.fileSizeBytes">{{ errors.fileSizeBytes }}</small>
            </label>
            <label>
              <span>Checksum SHA-256</span>
              <input v-model="form.checksumSha256" :aria-invalid="Boolean(errors.checksumSha256)" />
              <small v-if="errors.checksumSha256">{{ errors.checksumSha256 }}</small>
            </label>
          </div>

          <div v-if="clearNotice" class="cms-media-form__note" role="status">{{ clearNotice }}</div>
          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-form-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@import './cms-form-modal.css';

.cms-media-form :deep(.cms-form-modal__dialog) {
  overflow: hidden;
}

.cms-media-form form {
  max-height: calc(100vh - 128px);
  overflow-y: auto;
}

.cms-media-form header button {
  display: grid;
  width: 34px;
  min-height: 34px;
  padding: 0;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
}

.cms-media-form__preview,
.cms-media-form__note {
  margin-inline: 20px;
}

.cms-media-form__preview {
  max-width: 360px;
}

.cms-media-form em {
  color: #64748b;
  font-size: 0.78rem;
  font-style: normal;
  line-height: 1.35;
}

.cms-media-form__note {
  padding: 10px 12px;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  font-size: 0.86rem;
  font-weight: 700;
}
</style>

