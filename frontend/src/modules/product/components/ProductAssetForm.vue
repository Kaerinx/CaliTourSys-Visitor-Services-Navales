<script setup>
import { computed, reactive, ref, watch } from 'vue'

import { ASSET_CATEGORIES, TOURISM_TARGET_MARKETS } from '@/modules/product/constants/productOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  accreditedEstablishments: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const MAX_IMAGES = 5
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const fileInput = ref(null)

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit asset' : 'Create asset'))
const targetMarketOptions = computed(() => withCurrentOption(TOURISM_TARGET_MARKETS, form.targetMarket))
const selectedEstablishment = computed(() =>
  props.accreditedEstablishments.find((establishment) => establishment.id === form.sourceAccreditationRecordId),
)
const selectedCoordinatesLabel = computed(() => {
  const latitude = Number(selectedEstablishment.value?.latitude)
  const longitude = Number(selectedEstablishment.value?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
})
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create asset'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.name.trim()) output.name = 'Asset name is required.'
  if (!form.description.trim()) output.description = 'Description is required.'
  if (!form.location.trim()) output.location = 'Location is required.'
  if (!form.category) output.category = 'Category is required.'
  if (!form.targetMarket.trim()) output.targetMarket = 'Target market is required.'
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  if (form.latitude === '' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    output.latitude = 'Latitude is required and must be from -90 to 90.'
  }
  if (form.longitude === '' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    output.longitude = 'Longitude is required and must be from -180 to 180.'
  }
  if (form.images.length > MAX_IMAGES) output.images = 'Upload up to 5 images only.'
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
    name: value?.name || '',
    description: value?.description || '',
    location: value?.location || '',
    category: value?.category || 'Nature',
    targetMarket: value?.targetMarket || TOURISM_TARGET_MARKETS[0],
    developmentStatus: value?.developmentStatus || 'Draft',
    images: initialImages(value),
    remarks: value?.remarks || '',
    sourceAccreditationRecordId: value?.sourceAccreditationRecordId || '',
    latitude: value?.latitude ?? '',
    longitude: value?.longitude ?? '',
  }
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function withCurrentOption(options, value) {
  if (!value || options.includes(value)) return options
  return [value, ...options]
}

function categoryFromBusinessType(type) {
  const value = String(type || '').toLowerCase()
  if (/(food|restaurant|cafe|eatery|market|producer|kitchen|pantry)/.test(value)) return 'Food'
  if (/(event|festival|organizer)/.test(value)) return 'Events'
  if (/(heritage|cultural|craft|museum|guide|tour)/.test(value)) return 'Cultural'
  if (/(nature|eco|resort|farm|beach|island|river|mountain|garden)/.test(value)) return 'Nature'
  return ''
}

function applySelectedEstablishment() {
  const establishment = selectedEstablishment.value
  if (!establishment) return

  const inferredCategory = categoryFromBusinessType(establishment.businessType)
  if (!form.name.trim()) form.name = establishment.businessName || ''
  if (!form.location.trim()) form.location = establishment.location || ''
  if (inferredCategory) form.category = inferredCategory
  if (!form.remarks.trim() && establishment.recordNumber) {
    form.remarks = `Accreditation reference: ${establishment.recordNumber}`
  }
  if (establishment.latitude != null && establishment.longitude != null) {
    form.latitude = Number(establishment.latitude).toFixed(6)
    form.longitude = Number(establishment.longitude).toFixed(6)
  }
}

function initialImages(value) {
  if (Array.isArray(value?.images) && value.images.length) {
    return value.images.slice(0, MAX_IMAGES).map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      previewUrl: image.imageUrl,
      originalName: image.originalName || 'Asset photo',
      mimeType: image.mimeType || '',
      fileSize: image.fileSize || null,
      file: null,
    }))
  }

  if (value?.imageUrl) {
    return [{
      id: null,
      imageUrl: value.imageUrl,
      previewUrl: value.imageUrl,
      originalName: 'Asset photo',
      mimeType: '',
      fileSize: null,
      file: null,
    }]
  }

  return []
}

function addImages(event) {
  const files = Array.from(event.target.files || [])
  const availableSlots = MAX_IMAGES - form.images.length
  files.slice(0, availableSlots).forEach((file) => {
    if (!file.type.startsWith('image/')) return
    form.images.push({
      id: null,
      imageUrl: '',
      previewUrl: URL.createObjectURL(file),
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      file,
    })
  })

  event.target.value = ''
}

function removeImage(index) {
  const [removed] = form.images.splice(index, 1)
  if (removed?.file && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
}

function moveImage(index, direction) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= form.images.length) return
  const [image] = form.images.splice(index, 1)
  form.images.splice(nextIndex, 0, image)
}

function openFilePicker() {
  fileInput.value?.click()
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  const internalStatus = form.developmentStatus === 'Archived' ? 'Archived' : 'Draft'

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    category: form.category,
    targetMarket: form.targetMarket.trim(),
    developmentStatus: internalStatus,
    imageUrl: form.images[0]?.imageUrl || null,
    images: form.images,
    remarks: emptyToNull(form.remarks),
    sourceAccreditationRecordId: form.sourceAccreditationRecordId || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="asset-modal" role="presentation" @click.self="$emit('close')">
      <section class="asset-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="asset-form-title">
        <header>
          <div>
            <p>Tourism assets</p>
            <h2 id="asset-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close asset form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="asset-modal__body">
            <section class="asset-section" aria-labelledby="asset-basic-title">
              <h3 id="asset-basic-title">Basic Information</h3>

              <label>
                <span>Accredited establishment</span>
                <select v-model="form.sourceAccreditationRecordId" @change="applySelectedEstablishment">
                  <option value="">No linked establishment</option>
                  <option
                    v-for="establishment in props.accreditedEstablishments"
                    :key="establishment.id"
                    :value="establishment.id"
                  >
                    {{ establishment.businessName }} - {{ establishment.recordNumber }}
                  </option>
                </select>
              </label>

              <div v-if="selectedEstablishment" class="asset-source-card">
                <strong>{{ selectedEstablishment.businessName }}</strong>
                <span>{{ selectedEstablishment.location || 'Location not provided' }}</span>
                <span>
                  {{ selectedEstablishment.businessType || 'Business type not provided' }}
                  <template v-if="selectedEstablishment.ownerName">
                    / {{ selectedEstablishment.ownerName }}
                  </template>
                </span>
                <span>{{ selectedEstablishment.recordNumber }} / Active accreditation</span>
                <span v-if="selectedCoordinatesLabel">Coordinates: {{ selectedCoordinatesLabel }}</span>
                <span v-else>No coordinates recorded in accreditation.</span>
              </div>

              <label>
                <span>Category</span>
                <select v-model="form.category" :aria-invalid="Boolean(errors.category)">
                  <option v-for="category in ASSET_CATEGORIES" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
                <small v-if="errors.category">{{ errors.category }}</small>
              </label>

              <label>
                <span>Asset name</span>
                <input v-model="form.name" :aria-invalid="Boolean(errors.name)" />
                <small v-if="errors.name">{{ errors.name }}</small>
              </label>

              <label>
                <span>Description</span>
                <textarea v-model="form.description" rows="4" :aria-invalid="Boolean(errors.description)"></textarea>
                <small v-if="errors.description">{{ errors.description }}</small>
              </label>
            </section>

            <section class="asset-section" aria-labelledby="asset-location-title">
              <h3 id="asset-location-title">Location and Market</h3>

              <div class="asset-grid">
                <label>
                  <span>Location</span>
                  <input v-model="form.location" :aria-invalid="Boolean(errors.location)" />
                  <small v-if="errors.location">{{ errors.location }}</small>
                </label>

                <label>
                  <span>Target market</span>
                  <select v-model="form.targetMarket" :aria-invalid="Boolean(errors.targetMarket)">
                    <option v-for="market in targetMarketOptions" :key="market" :value="market">
                      {{ market }}
                    </option>
                  </select>
                  <small v-if="errors.targetMarket">{{ errors.targetMarket }}</small>
                </label>
              </div>

              <div class="asset-grid">
                <label>
                  <span>Latitude</span>
                  <input
                    v-model="form.latitude"
                    inputmode="decimal"
                    placeholder="Example: 13.708800"
                    :aria-invalid="Boolean(errors.latitude)"
                  />
                  <small v-if="errors.latitude">{{ errors.latitude }}</small>
                </label>

                <label>
                  <span>Longitude</span>
                  <input
                    v-model="form.longitude"
                    inputmode="decimal"
                    placeholder="Example: 123.217800"
                    :aria-invalid="Boolean(errors.longitude)"
                  />
                  <small v-if="errors.longitude">{{ errors.longitude }}</small>
                </label>
              </div>
            </section>

            <section class="asset-section" aria-labelledby="asset-media-title">
              <h3 id="asset-media-title">Media and Notes</h3>

              <div class="asset-uploader">
                <div class="asset-uploader__heading">
                  <span>Asset photos</span>
                  <button type="button" :disabled="form.images.length >= MAX_IMAGES" @click="openFilePicker">
                    Upload photos
                  </button>
                </div>
                <input
                  ref="fileInput"
                  class="asset-uploader__input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  @change="addImages"
                />
                <p>The first photo will be used as the package cover image. Maximum of 5 photos.</p>
                <small v-if="errors.images">{{ errors.images }}</small>

                <div v-if="form.images.length" class="asset-gallery-editor">
                  <article v-for="(image, index) in form.images" :key="image.previewUrl || image.imageUrl" class="asset-image-tile">
                    <img :src="image.previewUrl || image.imageUrl" :alt="image.originalName || 'Asset photo'" />
                    <div>
                      <strong>{{ index === 0 ? 'Cover photo' : `Photo ${index + 1}` }}</strong>
                      <span>{{ image.originalName || 'Asset photo' }}</span>
                    </div>
                    <span class="asset-image-tile__actions">
                      <button type="button" :disabled="index === 0" @click="moveImage(index, -1)">Up</button>
                      <button type="button" :disabled="index === form.images.length - 1" @click="moveImage(index, 1)">Down</button>
                      <button type="button" class="is-danger" @click="removeImage(index)">Remove</button>
                    </span>
                  </article>
                </div>
              </div>

              <label>
                <span>Remarks</span>
                <textarea v-model="form.remarks" rows="3"></textarea>
              </label>
            </section>

            <div v-if="serverError" class="asset-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="asset-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.asset-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.asset-modal__dialog {
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

.asset-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.asset-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.asset-section > label,
.asset-grid label {
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
select[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: #dc2626;
}

small {
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.35;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.asset-source-card {
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  color: #334155;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  background: #f0fdfa;
  font-size: 0.82rem;
  line-height: 1.35;
}

.asset-source-card strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.asset-uploader {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.asset-uploader__heading {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.asset-uploader__heading > span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.asset-uploader__heading button {
  min-height: 34px;
  color: #0f766e;
  border-color: #99f6e4;
  background: #f0fdfa;
}

.asset-uploader__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.asset-uploader p {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: none;
}

.asset-gallery-editor {
  display: grid;
  gap: 8px;
}

.asset-image-tile {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.asset-image-tile img {
  width: 72px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  background: #e2e8f0;
}

.asset-image-tile div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.asset-image-tile strong,
.asset-image-tile span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-image-tile strong {
  color: #0f172a;
  font-size: 0.86rem;
}

.asset-image-tile div span {
  color: #64748b;
  font-size: 0.78rem;
}

.asset-image-tile__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}

.asset-image-tile__actions button {
  min-height: 32px;
  padding-inline: 10px;
  font-size: 0.78rem;
}

.asset-image-tile__actions .is-danger {
  color: #991b1b;
  border-color: #fecaca;
  background: #fff7f7;
}

.asset-modal__error {
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

.asset-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .asset-modal {
    padding: 10px;
  }

  .asset-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .asset-modal__body {
    padding: 14px;
  }

  .asset-image-tile {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .asset-image-tile__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 460px) {
  footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  footer button {
    width: 100%;
  }
}
</style>
