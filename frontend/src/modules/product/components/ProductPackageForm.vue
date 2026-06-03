<script setup>
import { computed, reactive, watch } from 'vue'

import { PACKAGE_CATEGORIES } from '@/modules/product/constants/productOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  assets: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] },
  statuses: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit package' : 'Create package'))
const selectedItemCount = computed(() => form.assetIds.length + form.activityIds.length)
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create package'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.name.trim()) output.name = 'Package name is required.'
  if (!form.description.trim()) output.description = 'Description is required.'
  if (!form.category) output.category = 'Package category is required.'
  if (!form.targetMarket.trim()) output.targetMarket = 'Target market is required.'
  if (!form.estimatedDuration.trim()) output.estimatedDuration = 'Estimated duration is required.'
  if (!form.packageStatus) output.packageStatus = 'Package status is required.'
  if (form.packageStatus === 'Ready for Promotion') {
    output.packageStatus = 'Use the readiness review action to mark packages Ready for Promotion.'
  }
  if (!selectedItemCount.value) output.items = 'Select at least one asset or activity.'
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
  const items = value?.items || []

  return {
    name: value?.name || '',
    description: value?.description || '',
    category: value?.category || 'Nature & Eco',
    targetMarket: value?.targetMarket || '',
    estimatedDuration: value?.estimatedDuration || '',
    packageStatus:
      value?.packageStatus && value.packageStatus !== 'Ready for Promotion' ? value.packageStatus : 'Draft',
    remarks: value?.remarks || '',
    assetIds: items
      .filter((item) => item.itemType === 'Asset' && item.status !== 'Archived')
      .map((item) => item.referenceId),
    activityIds: items
      .filter(
        (item) =>
          item.itemType === 'Activity' &&
          item.status !== 'Archived' &&
          item.assetStatus !== 'Archived',
      )
      .map((item) => item.referenceId),
  }
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    targetMarket: form.targetMarket.trim(),
    estimatedDuration: form.estimatedDuration.trim(),
    packageStatus: form.packageStatus,
    remarks: emptyToNull(form.remarks),
    items: [
      ...form.assetIds.map((assetId) => ({ itemType: 'Asset', referenceId: assetId })),
      ...form.activityIds.map((activityId) => ({ itemType: 'Activity', referenceId: activityId })),
    ],
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="package-modal" role="presentation" @click.self="$emit('close')">
      <section class="package-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="package-form-title">
        <header>
          <div>
            <p>Tourism packages</p>
            <h2 id="package-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close package form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="package-modal__body">
            <section class="package-section" aria-labelledby="package-basic-title">
              <h3 id="package-basic-title">Basic Information</h3>

              <div class="package-grid">
                <label>
                  <span>Category</span>
                  <select v-model="form.category" :aria-invalid="Boolean(errors.category)">
                    <option v-for="category in PACKAGE_CATEGORIES" :key="category" :value="category">
                      {{ category }}
                    </option>
                  </select>
                  <small v-if="errors.category">{{ errors.category }}</small>
                </label>

                <label>
                  <span>Package status</span>
                  <select v-model="form.packageStatus" :aria-invalid="Boolean(errors.packageStatus)">
                    <option v-for="status in statuses" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                  <small v-if="errors.packageStatus">{{ errors.packageStatus }}</small>
                </label>
              </div>

              <label>
                <span>Package name</span>
                <input v-model="form.name" :aria-invalid="Boolean(errors.name)" placeholder="Calabanga Eco Day Package" />
                <small v-if="errors.name">{{ errors.name }}</small>
              </label>

              <label>
                <span>Description</span>
                <textarea
                  v-model="form.description"
                  rows="4"
                  :aria-invalid="Boolean(errors.description)"
                  placeholder="Describe the package experience, purpose, and visitor value."
                ></textarea>
                <small v-if="errors.description">{{ errors.description }}</small>
              </label>
            </section>

            <section class="package-section" aria-labelledby="package-market-title">
              <h3 id="package-market-title">Market and Duration</h3>

              <div class="package-grid">
                <label>
                  <span>Target market</span>
                  <input
                    v-model="form.targetMarket"
                    :aria-invalid="Boolean(errors.targetMarket)"
                    placeholder="Families, students, eco-tourists"
                  />
                  <small v-if="errors.targetMarket">{{ errors.targetMarket }}</small>
                </label>

                <label>
                  <span>Estimated duration</span>
                  <input
                    v-model="form.estimatedDuration"
                    :aria-invalid="Boolean(errors.estimatedDuration)"
                    placeholder="Half day"
                  />
                  <small v-if="errors.estimatedDuration">{{ errors.estimatedDuration }}</small>
                </label>
              </div>
            </section>

            <section class="package-section" aria-labelledby="package-items-title">
              <div class="package-section__heading">
                <h3 id="package-items-title">Package Items</h3>
                <span>{{ selectedItemCount }} selected</span>
              </div>

              <small v-if="errors.items">{{ errors.items }}</small>

              <div class="package-picker">
                <section>
                  <h4>Tourism assets</h4>
                  <p>Select non-archived assets to include.</p>
                  <label v-for="asset in assets" :key="asset.id" class="package-check">
                    <input v-model="form.assetIds" type="checkbox" :value="asset.id" />
                    <span>
                      <strong>{{ asset.name }}</strong>
                      <small>{{ asset.location }} - {{ asset.developmentStatus }}</small>
                    </span>
                  </label>
                  <p v-if="!assets.length">No selectable assets.</p>
                </section>

                <section>
                  <h4>Tourism activities</h4>
                  <p>Select non-archived activities to include.</p>
                  <label v-for="activity in activities" :key="activity.id" class="package-check">
                    <input v-model="form.activityIds" type="checkbox" :value="activity.id" />
                    <span>
                      <strong>{{ activity.name }}</strong>
                      <small>{{ activity.assetName }} - {{ activity.activityStatus }}</small>
                    </span>
                  </label>
                  <p v-if="!activities.length">No selectable activities.</p>
                </section>
              </div>
            </section>

            <section class="package-section" aria-labelledby="package-notes-title">
              <h3 id="package-notes-title">Notes</h3>

              <label>
                <span>Remarks</span>
                <textarea v-model="form.remarks" rows="3" placeholder="Optional package notes"></textarea>
              </label>
            </section>

            <div v-if="serverError" class="package-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="package-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.package-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.package-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(860px, 100%);
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
h3,
h4 {
  margin: 0;
}

p {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

header p {
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

h3,
h4 {
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

.package-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.package-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.package-section__heading {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.package-section__heading > span {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 900;
}

.package-section > label,
.package-grid label {
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

.package-grid,
.package-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.package-picker section {
  display: grid;
  align-content: start;
  gap: 10px;
  min-height: 180px;
  max-height: 280px;
  overflow: auto;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.package-check {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.package-check input {
  width: auto;
  min-height: auto;
  margin-top: 3px;
}

.package-check span,
.package-check strong,
.package-check small {
  display: block;
}

.package-check strong {
  color: #0f172a;
}

.package-check small {
  color: #64748b;
}

.package-modal__error {
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

.package-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .package-modal {
    padding: 10px;
  }

  .package-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .package-modal__body {
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
