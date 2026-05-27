<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const imageInput = ref(null)
const imageFile = ref(null)
const imageFileName = ref('')
const imagePreviewUrl = ref('')
const slugManuallyEdited = ref(false)

const title = computed(() => (props.value?.id ? 'Edit Promotion' : 'Create Promotion'))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return props.value?.id ? 'Save Changes' : 'Create Promotion'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.slug.trim()) output.slug = 'Slug is required.'
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) output.slug = 'Use lowercase letters, numbers, and hyphens only.'
  if (!form.title.trim()) output.title = 'Title is required.'
  if (!form.promotionType) output.promotionType = 'Promotion type is required.'
  if (form.startsAt && form.endsAt && new Date(form.endsAt).getTime() < new Date(form.startsAt).getTime()) {
    output.endsAt = 'End date must be after the start date.'
  }
  return output
})

watch(
  () => [props.open, props.value],
  () => {
    Object.assign(form, defaultForm(props.value))
    submitted.value = false
    slugManuallyEdited.value = Boolean(props.value?.slug)
    resetImageSelection()
  },
  { immediate: true },
)

watch(
  () => form.title,
  (value) => {
    if (slugManuallyEdited.value) return
    form.slug = generateSlug(value)
  },
)

onBeforeUnmount(resetImageSelection)

function defaultForm(value = null) {
  return {
    slug: value?.slug || '',
    title: value?.title || '',
    summary: value?.summary || '',
    description: value?.description || '',
    promotionType: value?.promotionType || 'announcement',
    accentColor: value?.accentColor || '#0f766e',
    startsAt: toInputDate(value?.startsAt),
    endsAt: toInputDate(value?.endsAt),
    status: value?.status || 'draft',
    isFeatured: Boolean(value?.isFeatured),
  }
}

function toInputDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

function toApiDate(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function generateSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function handleSlugInput() {
  slugManuallyEdited.value = true
}

function openImagePicker() {
  imageInput.value?.click()
}

function handleImageChange(event) {
  const [file] = Array.from(event.target.files || [])
  resetImageSelection()
  if (!file) return

  imageFile.value = file
  imageFileName.value = file.name
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function resetImageSelection() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFile.value = null
  imageFileName.value = ''
  imagePreviewUrl.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    slug: form.slug.trim(),
    title: form.title.trim(),
    summary: emptyToNull(form.summary),
    description: emptyToNull(form.description),
    promotionType: form.promotionType,
    // TODO: Send the selected promotion image when the promotions API supports image upload or image URLs.
    accentColor: emptyToNull(form.accentColor),
    startsAt: toApiDate(form.startsAt),
    endsAt: toApiDate(form.endsAt),
    status: form.status,
    isFeatured: form.isFeatured,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-promotion-form-title">
        <header>
          <div>
            <p>PROMOTIONS</p>
            <h2 id="cms-promotion-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close promotion form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="cms-form-modal__body">
            <label>
              <span>Title</span>
              <input v-model="form.title" :aria-invalid="Boolean(errors.title)" />
              <small v-if="errors.title">{{ errors.title }}</small>
            </label>

            <label>
              <span>Slug</span>
              <input v-model="form.slug" :aria-invalid="Boolean(errors.slug)" @input="handleSlugInput" />
              <span class="cms-form-modal__help">Used for the public promotion page URL.</span>
              <small v-if="errors.slug">{{ errors.slug }}</small>
            </label>

            <label>
              <span>Summary</span>
              <textarea v-model="form.summary" rows="2"></textarea>
            </label>

            <label>
              <span>Description</span>
              <textarea v-model="form.description" rows="4"></textarea>
            </label>

            <div class="cms-form-modal__grid">
              <label>
                <span>Promotion type</span>
                <select v-model="form.promotionType" :aria-invalid="Boolean(errors.promotionType)">
                  <option value="announcement">Announcement</option>
                  <option value="campaign">Campaign</option>
                  <option value="featured">Featured</option>
                  <option value="seasonal">Seasonal</option>
                </select>
                <small v-if="errors.promotionType">{{ errors.promotionType }}</small>
              </label>

              <label>
                <span>Status</span>
                <select v-model="form.status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>

            <div class="cms-form-modal__grid">
              <label>
                <span>Starts at</span>
                <input v-model="form.startsAt" type="datetime-local" />
              </label>
              <label>
                <span>Ends at</span>
                <input v-model="form.endsAt" type="datetime-local" :aria-invalid="Boolean(errors.endsAt)" />
                <small v-if="errors.endsAt">{{ errors.endsAt }}</small>
              </label>
            </div>

            <div class="cms-promotion-media">
              <div class="cms-promotion-image">
                <span>Promotion Image</span>
                <div class="cms-promotion-image__control">
                  <div v-if="imagePreviewUrl" class="cms-promotion-image__preview">
                    <img :src="imagePreviewUrl" :alt="imageFileName || 'Selected promotion image preview'" />
                  </div>
                  <div v-else class="cms-promotion-image__empty" aria-hidden="true">No image selected</div>
                  <div>
                    <input ref="imageInput" class="cms-promotion-image__input" type="file" accept="image/*" @change="handleImageChange" />
                    <button type="button" aria-describedby="promotion-image-help" @click="openImagePicker">Add Image</button>
                    <small v-if="imageFileName">{{ imageFileName }}</small>
                    <em id="promotion-image-help">Upload a banner or promotional image.</em>
                  </div>
                </div>
              </div>

              <label class="cms-form-modal__check">
                <input v-model="form.isFeatured" type="checkbox" />
                <span>Feature this promotion</span>
              </label>
            </div>

            <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-form-modal__primary" type="submit" :disabled="busy">
              {{ submitLabel }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.cms-form-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.46);
  overflow: hidden;
}

.cms-form-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(720px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}

header,
footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
}

footer {
  position: sticky;
  bottom: 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 0;
  background: #fff;
  box-shadow: 0 -8px 18px rgba(15, 23, 42, 0.04);
}

header button {
  display: grid;
  width: 34px;
  min-height: 34px;
  padding: 0;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
}

p,
h2 {
  margin: 0;
}

p {
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
}

h2 {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.18rem;
}

form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.cms-form-modal__body {
  display: grid;
  gap: 13px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.cms-form-modal__body > label,
.cms-form-modal__grid label {
  display: grid;
  min-width: 0;
  gap: 6px;
}

label > span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 7px 10px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

textarea {
  line-height: 1.45;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus,
button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

input[aria-invalid='true'],
select[aria-invalid='true'] {
  border-color: #dc2626;
}

small {
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-form-modal__help {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-form-modal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.cms-form-modal__check {
  display: grid;
  align-self: start;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 10px 0;
  color: #334155;
  font-weight: 800;
}

.cms-form-modal__check span {
  min-width: 0;
  color: #334155;
  font-size: 0.84rem;
}

.cms-form-modal__check input {
  width: 16px;
  min-height: 16px;
}

.cms-promotion-media {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.45fr);
  gap: 14px;
  align-items: start;
  min-width: 0;
}

.cms-promotion-image {
  display: grid;
  min-width: 0;
  gap: 7px;
}

.cms-promotion-image > span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.cms-promotion-image__control {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-promotion-image__empty,
.cms-promotion-image__preview {
  display: grid;
  width: 100%;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  color: #64748b;
  border-radius: 6px;
  background: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.cms-promotion-image__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-promotion-image__control > div:last-child {
  display: grid;
  min-width: 0;
  gap: 6px;
  justify-items: start;
}

.cms-promotion-image__input {
  display: none;
}

.cms-promotion-image em {
  color: #64748b;
  font-size: 0.8rem;
  font-style: normal;
  line-height: 1.35;
}

.cms-promotion-image small {
  max-width: 100%;
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-form-modal__error {
  padding: 10px 12px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
}

button {
  min-height: 36px;
  padding: 0 13px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 800;
}

.cms-form-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .cms-form-modal {
    padding: 10px;
  }

  .cms-form-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .cms-form-modal__body {
    padding: 14px;
  }

  .cms-promotion-media {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 460px) {
  .cms-promotion-image__control {
    grid-template-columns: 1fr;
  }

  footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  footer button {
    width: 100%;
  }
}
</style>
