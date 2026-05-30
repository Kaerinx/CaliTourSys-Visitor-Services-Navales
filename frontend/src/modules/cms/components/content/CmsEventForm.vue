<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const imageInput = ref(null)
const imageFileName = ref('')
const imagePreviewUrl = ref('')

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit event' : 'Create event'))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create event'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.categoryId) output.categoryId = 'Category is required.'
  if (!form.slug.trim()) output.slug = 'Slug is required.'
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) output.slug = 'Use lowercase letters, numbers, and hyphens only.'
  if (!form.title.trim()) output.title = 'Title is required.'
  if (!form.startsAt) output.startsAt = 'Start date is required.'
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
    resetImageSelection()
  },
  { immediate: true },
)

onBeforeUnmount(resetImageSelection)

function defaultForm(value = null) {
  return {
    categoryId: value?.categoryId || '',
    slug: value?.slug || '',
    title: value?.title || '',
    shortDescription: value?.shortDescription || '',
    description: value?.description || '',
    venueName: value?.venueName || '',
    organizerName: value?.organizerName || '',
    contactInfo: value?.contactInfo || '',
    addressLine: value?.addressLine || '',
    barangay: value?.barangay || '',
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

function openImagePicker() {
  imageInput.value?.click()
}

function handleImageChange(event) {
  const [file] = Array.from(event.target.files || [])
  resetImageSelection()
  if (!file) return

  imageFileName.value = file.name
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function resetImageSelection() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFileName.value = ''
  imagePreviewUrl.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    categoryId: form.categoryId,
    slug: form.slug.trim(),
    title: form.title.trim(),
    shortDescription: emptyToNull(form.shortDescription),
    description: emptyToNull(form.description),
    venueName: emptyToNull(form.venueName),
    organizerName: emptyToNull(form.organizerName),
    contactInfo: emptyToNull(form.contactInfo),
    addressLine: emptyToNull(form.addressLine),
    barangay: emptyToNull(form.barangay),
    startsAt: toApiDate(form.startsAt),
    endsAt: toApiDate(form.endsAt),
    status: form.status,
    isFeatured: form.isFeatured,
    // TODO: Send the selected event image when the CMS event API supports image upload or image URLs.
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-event-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-event-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-event-form-title">
        <header>
          <div>
            <p>Events</p>
            <h2 id="cms-event-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close event form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="cms-event-modal__body">
            <section class="cms-event-section" aria-labelledby="event-basic-title">
              <h3 id="event-basic-title">Basic Information</h3>

              <div class="cms-event-grid">
                <label>
                  <span>Category</span>
                  <select v-model="form.categoryId" :aria-invalid="Boolean(errors.categoryId)">
                    <option value="">Select category</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                  <small v-if="errors.categoryId">{{ errors.categoryId }}</small>
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

              <div class="cms-event-grid">
                <label>
                  <span>Slug</span>
                  <input v-model="form.slug" :aria-invalid="Boolean(errors.slug)" />
                  <small v-if="errors.slug">{{ errors.slug }}</small>
                </label>
                <label>
                  <span>Title</span>
                  <input v-model="form.title" :aria-invalid="Boolean(errors.title)" />
                  <small v-if="errors.title">{{ errors.title }}</small>
                </label>
              </div>

              <label>
                <span>Short description</span>
                <textarea v-model="form.shortDescription" rows="2"></textarea>
              </label>

              <label>
                <span>Description</span>
                <textarea v-model="form.description" rows="4"></textarea>
              </label>
            </section>

            <section class="cms-event-section" aria-labelledby="event-venue-title">
              <h3 id="event-venue-title">Venue and Contact</h3>

              <div class="cms-event-grid">
                <label>
                  <span>Venue</span>
                  <input v-model="form.venueName" />
                </label>
                <label>
                  <span>Organizer</span>
                  <input v-model="form.organizerName" />
                </label>
              </div>

              <div class="cms-event-grid">
                <label>
                  <span>Contact info</span>
                  <input v-model="form.contactInfo" />
                </label>
                <label>
                  <span>Barangay</span>
                  <input v-model="form.barangay" />
                </label>
              </div>

              <label>
                <span>Address line</span>
                <input v-model="form.addressLine" />
              </label>
            </section>

            <section class="cms-event-section" aria-labelledby="event-schedule-title">
              <h3 id="event-schedule-title">Schedule</h3>

              <div class="cms-event-grid">
                <label>
                  <span>Starts at</span>
                  <input v-model="form.startsAt" type="datetime-local" :aria-invalid="Boolean(errors.startsAt)" />
                  <small v-if="errors.startsAt">{{ errors.startsAt }}</small>
                </label>
                <label>
                  <span>Ends at</span>
                  <input v-model="form.endsAt" type="datetime-local" :aria-invalid="Boolean(errors.endsAt)" />
                  <small v-if="errors.endsAt">{{ errors.endsAt }}</small>
                </label>
              </div>
            </section>

            <section class="cms-event-section" aria-labelledby="event-media-title">
              <h3 id="event-media-title">Media</h3>

              <div class="cms-event-image">
                <span>Event Image</span>
                <div class="cms-event-image__control">
                  <div v-if="imagePreviewUrl" class="cms-event-image__preview">
                    <img :src="imagePreviewUrl" :alt="imageFileName || 'Selected event image preview'" />
                  </div>
                  <div v-else class="cms-event-image__empty" aria-hidden="true">No image selected</div>

                  <div>
                    <input ref="imageInput" class="cms-event-image__input" type="file" accept="image/*" @change="handleImageChange" />
                    <button type="button" aria-describedby="event-image-help" @click="openImagePicker">Add Image</button>
                    <small v-if="imageFileName">{{ imageFileName }}</small>
                    <em id="event-image-help">Upload a clear poster, event photo, or banner image.</em>
                  </div>
                </div>
              </div>
            </section>

            <section class="cms-event-section" aria-labelledby="event-publishing-title">
              <h3 id="event-publishing-title">Publishing</h3>

              <label class="cms-event-check">
                <input v-model="form.isFeatured" type="checkbox" />
                <span>Feature this event</span>
              </label>
            </section>

            <div v-if="serverError" class="cms-event-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-event-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.cms-event-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.cms-event-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
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
  flex: 0 0 auto;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
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
h2,
h3 {
  margin: 0;
}

p {
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.18rem;
}

h3 {
  color: #0f172a;
  font-size: 0.9rem;
}

form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.cms-event-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.cms-event-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.cms-event-section > label,
.cms-event-grid label {
  display: grid;
  min-width: 0;
  gap: 6px;
}

label > span,
.cms-event-image > span {
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

.cms-event-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.cms-event-check {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  color: #334155;
  font-weight: 800;
}

.cms-event-check span {
  min-width: 0;
  color: #334155;
  font-size: 0.84rem;
}

.cms-event-check input {
  width: 16px;
  min-height: 16px;
}

.cms-event-image {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.cms-event-image__control {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-event-image__empty,
.cms-event-image__preview {
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  place-items: center;
  overflow: hidden;
  color: #64748b;
  border-radius: 6px;
  background: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.cms-event-image__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-event-image__control > div:last-child {
  display: grid;
  min-width: 0;
  gap: 6px;
  justify-items: start;
}

.cms-event-image__input {
  display: none;
}

.cms-event-image em {
  color: #64748b;
  font-size: 0.8rem;
  font-style: normal;
  line-height: 1.35;
}

.cms-event-image small {
  max-width: 100%;
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-event-modal__error {
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

.cms-event-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .cms-event-modal {
    padding: 10px;
  }

  .cms-event-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .cms-event-modal__body {
    padding: 14px;
  }
}

@media (max-width: 460px) {
  .cms-event-image__control {
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
