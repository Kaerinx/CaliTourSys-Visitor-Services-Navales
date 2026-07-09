<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  assets: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit event' : 'Create event'))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create event'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.categorySelections.length) output.category = 'Select at least one event category.'
  if (form.categorySelections.length > 2) output.category = 'Select up to two event categories only.'
  if (!form.title.trim()) output.title = 'Event name is required.'
  if (!form.startDate) output.startDate = 'Start date is required.'
  const startsAt = toApiDateTime(form.startDate, form.startTime)
  const endsAt = toApiDateTime(form.endDate, form.endTime)
  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    output.endsAt = 'End date must be after the start date.'
  }
  if (form.imageError) output.imageFile = form.imageError
  return output
})

watch(
  () => [props.open, props.value],
  () => {
    revokePreviewUrl()
    Object.assign(form, defaultForm(props.value))
    submitted.value = false
  },
  { immediate: true },
)

watch(
  () => form.isRecurring,
  (isRecurring) => {
    if (isRecurring && form.recurrenceType === 'one_time') form.recurrenceType = 'yearly'
    if (!isRecurring) {
      form.recurrenceType = 'one_time'
      form.usualMonth = ''
      form.nextOccurrenceDate = ''
    }
  },
)

function defaultForm(value = null) {
  const startParts = toDateTimeParts(value?.startsAt)
  const endParts = toDateTimeParts(value?.endsAt)

  return {
    categorySelections: parseEventCategories(value),
    relatedAssetSelections: parseRelatedAssets(value),
    title: value?.title || '',
    description: value?.description || '',
    organizerName: value?.organizerName || '',
    contactInfo: value?.contactInfo || '',
    addressLine: value?.addressLine || '',
    barangay: value?.barangay || '',
    startDate: startParts.date,
    startTime: startParts.time,
    endDate: endParts.date,
    endTime: endParts.time,
    primaryImageUrl: value?.primaryImage?.url || '',
    imageFile: null,
    imageFileName: value?.primaryImage?.url ? 'Current event image' : '',
    imagePreviewUrl: '',
    imageError: '',
    status: value?.status || 'draft',
    isFeatured: Boolean(value?.isFeatured),
    isRecurring: Boolean(value?.isRecurring),
    recurrenceType: value?.recurrenceType || (value?.isRecurring ? 'yearly' : 'one_time'),
    usualMonth: value?.usualMonth || '',
    nextOccurrenceDate: toDateOnly(value?.nextOccurrenceDate),
  }
}

function parseEventCategories(value = null) {
  const ids = Array.isArray(value?.categoryIds) && value.categoryIds.length
    ? value.categoryIds
    : Array.isArray(value?.categories) && value.categories.length
      ? value.categories.map((category) => category.id)
      : [value?.categoryId].filter(Boolean)

  const categoryOptionsReady = props.categories.length > 0
  return [
    ...new Set(ids.filter((id) => !categoryOptionsReady || props.categories.some((category) => category.id === id))),
  ].slice(0, 2)
}

function parseRelatedAssets(value = null) {
  const ids = Array.isArray(value?.relatedAssetIds) && value.relatedAssetIds.length
    ? value.relatedAssetIds
    : Array.isArray(value?.relatedAssets) && value.relatedAssets.length
      ? value.relatedAssets.map((asset) => asset.id)
      : [value?.relatedAssetId].filter(Boolean)

  const assetOptionsReady = props.assets.length > 0
  return [
    ...new Set(ids.filter((id) => !assetOptionsReady || props.assets.some((asset) => asset.id === id))),
  ].slice(0, 2)
}

function toDateTimeParts(value) {
  if (!value) return { date: '', time: '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '', time: '' }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
  return {
    date: local.slice(0, 10),
    time: local.slice(11, 16),
  }
}

function toApiDateTime(dateValue, timeValue) {
  if (!dateValue) return null
  return new Date(`${dateValue}T${timeValue || '00:00'}`).toISOString()
}

function toDateOnly(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function revokePreviewUrl() {
  if (form.imagePreviewUrl) URL.revokeObjectURL(form.imagePreviewUrl)
}

function onImageChange(event) {
  const [file] = event.target.files || []
  form.imageError = ''
  revokePreviewUrl()
  form.imageFile = null
  form.imageFileName = form.primaryImageUrl ? 'Current event image' : ''
  form.imagePreviewUrl = ''

  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    form.imageError = 'Use a JPG, PNG, or WebP image.'
    event.target.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    form.imageError = 'Image must be 10MB or smaller.'
    event.target.value = ''
    return
  }

  form.imageFile = file
  form.imageFileName = file.name
  form.imagePreviewUrl = URL.createObjectURL(file)
}

function isCategoryDisabled(categoryId) {
  return form.categorySelections.length >= 2 && !form.categorySelections.includes(categoryId)
}

function isAssetOptionDisabled(assetId, selectedIndex) {
  return form.relatedAssetSelections.some((selectedId, index) => selectedId === assetId && index !== selectedIndex)
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  const generatedSlug = slugify(form.title) || 'event'
  const categoryIds = form.categorySelections.slice(0, 2)
  const relatedAssetIds = [...new Set(form.relatedAssetSelections.filter(Boolean))].slice(0, 2)

  emit('submit', {
    categoryId: categoryIds[0],
    categoryIds,
    relatedAssetId: relatedAssetIds[0] || null,
    relatedAssetIds,
    slug: props.value?.slug && props.value?.title === form.title.trim() ? props.value.slug : generatedSlug,
    title: form.title.trim(),
    description: emptyToNull(form.description),
    organizerName: emptyToNull(form.organizerName),
    contactInfo: emptyToNull(form.contactInfo),
    addressLine: emptyToNull(form.addressLine),
    barangay: emptyToNull(form.barangay),
    startsAt: toApiDateTime(form.startDate, form.startTime),
    endsAt: toApiDateTime(form.endDate, form.endTime),
    ...(form.imageFile ? { imageFile: form.imageFile } : {}),
    ...(form.primaryImageUrl && !form.imageFile ? { primaryImageUrl: form.primaryImageUrl } : {}),
    status: props.value?.status || 'draft',
    isFeatured: form.isFeatured,
    isRecurring: Boolean(form.isRecurring),
    recurrenceType: form.isRecurring ? form.recurrenceType : 'one_time',
    usualMonth: form.isRecurring && form.usualMonth ? Number(form.usualMonth) : null,
    nextOccurrenceDate: form.isRecurring ? emptyToNull(form.nextOccurrenceDate) : null,
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

              <fieldset class="cms-event-category-group" :aria-invalid="Boolean(errors.category)">
                <legend>Category</legend>
                <div class="cms-event-category-group__options">
                  <label
                    v-for="category in categories"
                    :key="category.id"
                    class="cms-event-category-option"
                    :class="{ 'is-selected': form.categorySelections.includes(category.id) }"
                  >
                    <input
                      v-model="form.categorySelections"
                      type="checkbox"
                      :value="category.id"
                      :disabled="isCategoryDisabled(category.id)"
                    />
                    <span>{{ category.name }}</span>
                  </label>
                </div>
                <small v-if="errors.category">{{ errors.category }}</small>
              </fieldset>

              <div class="cms-event-grid">
                <label>
                  <span>Event Name</span>
                  <input v-model="form.title" :aria-invalid="Boolean(errors.title)" />
                  <small v-if="errors.title">{{ errors.title }}</small>
                </label>
              </div>

              <div class="cms-event-grid">
                <label>
                  <span>Organizer</span>
                  <input v-model="form.organizerName" />
                </label>
                <label>
                  <span>Contact info</span>
                  <input v-model="form.contactInfo" />
                </label>
              </div>

              <label>
                <span>Description</span>
                <textarea v-model="form.description" rows="4"></textarea>
              </label>
            </section>

            <section class="cms-event-section" aria-labelledby="event-venue-title">
              <h3 id="event-venue-title">Related Asset / Venue</h3>

              <div class="cms-event-grid">
                <label>
                  <span>Related Asset 1</span>
                  <select v-model="form.relatedAssetSelections[0]">
                    <option value="">No linked asset</option>
                    <option
                      v-for="asset in assets"
                      :key="asset.id"
                      :value="asset.id"
                      :disabled="isAssetOptionDisabled(asset.id, 0)"
                    >
                      {{ asset.name }}{{ asset.location ? ` - ${asset.location}` : '' }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>Related Asset 2</span>
                  <select v-model="form.relatedAssetSelections[1]">
                    <option value="">No second linked asset</option>
                    <option
                      v-for="asset in assets"
                      :key="asset.id"
                      :value="asset.id"
                      :disabled="isAssetOptionDisabled(asset.id, 1)"
                    >
                      {{ asset.name }}{{ asset.location ? ` - ${asset.location}` : '' }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="cms-event-grid">
                <label>
                  <span>Barangay</span>
                  <input v-model="form.barangay" />
                </label>
                <label>
                  <span>Address line</span>
                  <input v-model="form.addressLine" />
                </label>
              </div>
            </section>

            <section class="cms-event-section" aria-labelledby="event-schedule-title">
              <h3 id="event-schedule-title">Schedule</h3>

              <div class="cms-event-grid">
                <label>
                  <span>Start Date</span>
                  <input v-model="form.startDate" type="date" :aria-invalid="Boolean(errors.startDate)" />
                  <small v-if="errors.startDate">{{ errors.startDate }}</small>
                </label>
                <label>
                  <span>Start Time</span>
                  <input v-model="form.startTime" type="time" />
                </label>
                <label>
                  <span>End Date</span>
                  <input v-model="form.endDate" type="date" :aria-invalid="Boolean(errors.endsAt)" />
                  <small v-if="errors.endsAt">{{ errors.endsAt }}</small>
                </label>
                <label>
                  <span>End Time</span>
                  <input v-model="form.endTime" type="time" />
                </label>
              </div>
            </section>

            <section class="cms-event-section" aria-labelledby="event-recurrence-title">
              <h3 id="event-recurrence-title">Recurrence Planning</h3>

              <label class="cms-event-check">
                <input v-model="form.isRecurring" type="checkbox" />
                <span>Is recurring event</span>
              </label>

              <div class="cms-event-grid">
                <label>
                  <span>Recurrence Type</span>
                  <select v-model="form.recurrenceType" :disabled="!form.isRecurring">
                    <option value="one_time">One-time</option>
                    <option value="yearly">Yearly</option>
                    <option value="twice_a_year">Twice a Year</option>
                  </select>
                </label>
                <label>
                  <span>Usual Month</span>
                  <select v-model="form.usualMonth" :disabled="!form.isRecurring">
                    <option value="">Select month</option>
                    <option v-for="(month, index) in monthOptions" :key="month" :value="index + 1">
                      {{ month }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>Next Occurrence Date</span>
                  <input v-model="form.nextOccurrenceDate" type="date" :disabled="!form.isRecurring" />
                </label>
              </div>
              <em class="cms-event-help">
                Use the schedule above for the confirmed occurrence. Recurrence helps staff prepare
                the next annual or occasional version.
              </em>
            </section>

            <section class="cms-event-section" aria-labelledby="event-media-title">
              <h3 id="event-media-title">Media</h3>

              <div class="cms-event-image">
                <span>Event Image</span>
                <div class="cms-event-image__control">
                  <div v-if="form.imagePreviewUrl || form.primaryImageUrl" class="cms-event-image__preview">
                    <img :src="form.imagePreviewUrl || form.primaryImageUrl" alt="Event image preview" />
                  </div>
                  <div v-else class="cms-event-image__empty" aria-hidden="true">No image selected</div>

                  <div>
                    <label class="cms-event-image__picker">
                      <span>Choose Image</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" @change="onImageChange" />
                    </label>
                    <small v-if="form.imageFileName">{{ form.imageFileName }}</small>
                    <small v-if="errors.imageFile">{{ errors.imageFile }}</small>
                    <em id="event-image-help">Use a clear JPG, PNG, or WebP poster/photo.</em>
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

.cms-event-category-group {
  min-width: 0;
  padding: 0;
  border: 0;
}

.cms-event-category-group legend {
  margin-bottom: 7px;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.cms-event-category-group__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cms-event-category-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 12px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font-weight: 900;
  cursor: pointer;
}

.cms-event-category-option input {
  width: 18px;
  min-height: 18px;
  accent-color: #0f766e;
}

.cms-event-category-option span {
  min-width: 0;
  color: #0f172a;
  font-size: 0.9rem;
}

.cms-event-category-option.is-selected span {
  color: #0f172a;
}

.cms-event-category-option.is-selected {
  color: #0f766e;
  border-color: #5eead4;
  background: #ecfdf5;
}

.cms-event-category-option:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.48;
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

.cms-event-image__picker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cms-event-image__picker > span {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 13px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font-weight: 900;
  cursor: pointer;
}

.cms-event-image__picker input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.cms-event-image em {
  color: #64748b;
  font-size: 0.8rem;
  font-style: normal;
  line-height: 1.35;
}

.cms-event-help {
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
