<script setup>
import { computed, reactive, watch } from 'vue'

import { ASSET_CATEGORIES, ASSET_STATUSES } from '@/modules/product/constants/productOptions'

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
const title = computed(() => (isEditing.value ? 'Edit asset' : 'Create asset'))
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
  if (!form.developmentStatus) output.developmentStatus = 'Development status is required.'
  if (form.imageUrl.trim() && !isValidUrl(form.imageUrl.trim())) output.imageUrl = 'Enter a valid image URL.'
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
    category: value?.category || 'Natural',
    targetMarket: value?.targetMarket || '',
    developmentStatus: value?.developmentStatus || 'Draft',
    imageUrl: value?.imageUrl || '',
    remarks: value?.remarks || '',
  }
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    category: form.category,
    targetMarket: form.targetMarket.trim(),
    developmentStatus: form.developmentStatus,
    imageUrl: emptyToNull(form.imageUrl),
    remarks: emptyToNull(form.remarks),
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

              <div class="asset-grid">
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
                  <span>Status</span>
                  <select v-model="form.developmentStatus" :aria-invalid="Boolean(errors.developmentStatus)">
                    <option v-for="status in ASSET_STATUSES" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                  <small v-if="errors.developmentStatus">{{ errors.developmentStatus }}</small>
                </label>
              </div>

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
                  <input v-model="form.targetMarket" :aria-invalid="Boolean(errors.targetMarket)" />
                  <small v-if="errors.targetMarket">{{ errors.targetMarket }}</small>
                </label>
              </div>
            </section>

            <section class="asset-section" aria-labelledby="asset-media-title">
              <h3 id="asset-media-title">Media and Notes</h3>

              <label>
                <span>Image URL</span>
                <input v-model="form.imageUrl" placeholder="https://example.com/asset-photo.jpg" :aria-invalid="Boolean(errors.imageUrl)" />
                <small v-if="errors.imageUrl">{{ errors.imageUrl }}</small>
              </label>

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
