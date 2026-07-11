<script setup>
import { computed, reactive, watch } from 'vue'

import { ACTIVITY_STATUSES } from '@/modules/product/constants/productOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  assets: { type: Array, default: () => [] },
  plans: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit activity' : 'Create activity'))
const selectedAsset = computed(() => props.assets.find((asset) => asset.id === form.assetId))
const selectablePlans = computed(() =>
  props.plans.filter(
    (plan) =>
      plan.planStatus !== 'Archived' &&
      plan.assetStatus !== 'Archived' &&
      (!form.assetId || plan.assetId === form.assetId),
  ),
)
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create activity'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.assetId) output.assetId = 'Tourism asset is required.'
  if (!form.name.trim()) output.name = 'Activity name is required.'
  if (!form.description.trim()) output.description = 'Description is required.'
  if (!form.duration.trim()) output.duration = 'Duration is required.'
  if (!form.targetMarket.trim()) output.targetMarket = 'Target market is required.'
  if (!form.activityStatus) output.activityStatus = 'Activity status is required.'
  if (form.planId && !selectablePlans.value.some((plan) => plan.id === form.planId)) {
    output.planId = 'Selected plan must belong to the selected asset.'
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
    assetId: value?.assetId || '',
    planId: value?.planId || '',
    name: value?.name || '',
    description: value?.description || '',
    duration: value?.duration || '',
    targetMarket: value?.targetMarket || '',
    activityStatus: value?.activityStatus || 'Draft',
    remarks: value?.remarks || '',
  }
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function syncFromAsset() {
  if (selectedAsset.value && !form.targetMarket.trim()) {
    form.targetMarket = selectedAsset.value.targetMarket || ''
  }

  if (form.planId && !selectablePlans.value.some((plan) => plan.id === form.planId)) {
    form.planId = ''
  }
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    assetId: form.assetId,
    planId: emptyToNull(form.planId),
    name: form.name.trim(),
    description: form.description.trim(),
    duration: form.duration.trim(),
    targetMarket: form.targetMarket.trim(),
    activityStatus: form.activityStatus,
    remarks: emptyToNull(form.remarks),
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="activity-modal" role="presentation" @click.self="$emit('close')">
      <section class="activity-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="activity-form-title">
        <header>
          <div>
            <p>Tourism activities</p>
            <h2 id="activity-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close activity form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="activity-modal__body">
            <section class="activity-section" aria-labelledby="activity-basic-title">
              <h3 id="activity-basic-title">Basic Information</h3>

              <div class="activity-grid">
                <label>
                  <span>Tourism asset</span>
                  <select v-model="form.assetId" :aria-invalid="Boolean(errors.assetId)" @change="syncFromAsset">
                    <option value="">Select non-archived asset</option>
                    <option v-for="asset in assets" :key="asset.id" :value="asset.id">
                      {{ asset.name }} - {{ asset.developmentStatus }}
                    </option>
                  </select>
                  <small v-if="errors.assetId">{{ errors.assetId }}</small>
                </label>

                <label>
                  <span>Activity status</span>
                  <select v-model="form.activityStatus" :aria-invalid="Boolean(errors.activityStatus)">
                    <option v-for="status in ACTIVITY_STATUSES" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                  <small v-if="errors.activityStatus">{{ errors.activityStatus }}</small>
                </label>
              </div>

              <label>
                <span>Development plan</span>
                <select v-model="form.planId" :aria-invalid="Boolean(errors.planId)">
                  <option value="">No linked plan</option>
                  <option v-for="plan in selectablePlans" :key="plan.id" :value="plan.id">
                    {{ plan.title || plan.planTitle }}
                  </option>
                </select>
                <small v-if="errors.planId">{{ errors.planId }}</small>
              </label>

              <label>
                <span>Activity name</span>
                <input v-model="form.name" :aria-invalid="Boolean(errors.name)" placeholder="Guided mangrove walk" />
                <small v-if="errors.name">{{ errors.name }}</small>
              </label>

              <label>
                <span>Description</span>
                <textarea
                  v-model="form.description"
                  rows="4"
                  :aria-invalid="Boolean(errors.description)"
                  placeholder="Describe the visitor experience and purpose."
                ></textarea>
                <small v-if="errors.description">{{ errors.description }}</small>
              </label>
            </section>

            <section class="activity-section" aria-labelledby="activity-market-title">
              <h3 id="activity-market-title">Schedule and Market</h3>

              <div class="activity-grid">
                <label>
                  <span>Duration</span>
                  <input v-model="form.duration" :aria-invalid="Boolean(errors.duration)" placeholder="2 hours" />
                  <small v-if="errors.duration">{{ errors.duration }}</small>
                </label>

                <label>
                  <span>Target market</span>
                  <input
                    v-model="form.targetMarket"
                    :aria-invalid="Boolean(errors.targetMarket)"
                    placeholder="Families, students, eco-tourists"
                  />
                  <small v-if="errors.targetMarket">{{ errors.targetMarket }}</small>
                </label>
              </div>
            </section>

            <section class="activity-section" aria-labelledby="activity-notes-title">
              <h3 id="activity-notes-title">Notes</h3>

              <label>
                <span>Remarks</span>
                <textarea v-model="form.remarks" rows="3" placeholder="Optional activity notes"></textarea>
              </label>
            </section>

            <div v-if="serverError" class="activity-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="activity-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.activity-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.activity-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(780px, 100%);
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

.activity-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.activity-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.activity-section > label,
.activity-grid label {
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

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.activity-modal__error {
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

.activity-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .activity-modal {
    padding: 10px;
  }

  .activity-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .activity-modal__body {
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
