<script setup>
import { computed, reactive, watch } from 'vue'

import { TOURISM_TARGET_MARKETS } from '@/modules/product/constants/productOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  assets: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit plan' : 'Create plan'))
const selectedAsset = computed(() => props.assets.find((asset) => asset.id === form.assetId))
const targetMarketOptions = computed(() => withCurrentOption(TOURISM_TARGET_MARKETS, form.targetMarket))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create plan'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.assetId) output.assetId = 'Tourism asset is required.'
  if (!form.title.trim()) output.title = 'Plan title is required.'
  if (!form.objectives.trim()) output.objectives = 'Objectives are required.'
  if (!form.targetMarket.trim()) output.targetMarket = 'Target market is required.'
  if (!form.proposedActivities.trim()) output.proposedActivities = 'Proposed activities are required.'
  if (!form.assignedPersonnel.trim()) output.assignedPersonnel = 'Assigned personnel is required.'
  if (
    form.timelineStart &&
    form.timelineEnd &&
    new Date(form.timelineEnd).getTime() < new Date(form.timelineStart).getTime()
  ) {
    output.timelineEnd = 'Timeline end must be after the start date.'
  }
  if (
    form.timelineStart &&
    form.timelineEnd &&
    form.timelineStart === form.timelineEnd &&
    form.timelineStartTime &&
    form.timelineEndTime &&
    form.timelineEndTime < form.timelineStartTime
  ) {
    output.timelineEndTime = 'Time end must be after time start.'
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
    title: value?.title || value?.planTitle || '',
    objectives: value?.objectives || '',
    targetMarket: value?.targetMarket || TOURISM_TARGET_MARKETS[0],
    proposedActivities: value?.proposedActivities || '',
    timelineStart: toDateInput(value?.timelineStart),
    timelineEnd: toDateInput(value?.timelineEnd),
    timelineStartTime: toTimeInput(value?.timelineStartTime),
    timelineEndTime: toTimeInput(value?.timelineEndTime),
    assignedPersonnel: value?.assignedPersonnel || '',
    planStatus: value?.planStatus || 'Draft',
    remarks: value?.remarks || '',
  }
}

function toDateInput(value) {
  if (!value) return ''
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toTimeInput(value) {
  if (!value) return ''
  const text = String(value)
  const match = text.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function withCurrentOption(options, value) {
  if (!value || options.includes(value)) return options
  return [value, ...options]
}

function syncTargetMarketFromAsset() {
  if (selectedAsset.value && !form.targetMarket.trim()) {
    form.targetMarket = selectedAsset.value.targetMarket || ''
  }
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  const internalStatus = form.planStatus === 'Archived' ? 'Archived' : 'Draft'

  emit('submit', {
    assetId: form.assetId,
    planTitle: form.title.trim(),
    objectives: form.objectives.trim(),
    targetMarket: form.targetMarket.trim(),
    proposedActivities: form.proposedActivities.trim(),
    timelineStart: emptyToNull(form.timelineStart),
    timelineEnd: emptyToNull(form.timelineEnd),
    timelineStartTime: emptyToNull(form.timelineStartTime),
    timelineEndTime: emptyToNull(form.timelineEndTime),
    assignedPersonnel: form.assignedPersonnel.trim(),
    planStatus: internalStatus,
    remarks: emptyToNull(form.remarks),
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="plan-modal" role="presentation" @click.self="$emit('close')">
      <section class="plan-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="plan-form-title">
        <header>
          <div>
            <p>Development plans</p>
            <h2 id="plan-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close plan form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="plan-modal__body">
            <section class="plan-section" aria-labelledby="plan-basic-title">
              <h3 id="plan-basic-title">Basic Information</h3>

              <label>
                <span>Tourism asset</span>
                <select v-model="form.assetId" :aria-invalid="Boolean(errors.assetId)" @change="syncTargetMarketFromAsset">
                  <option value="">Select non-archived asset</option>
                  <option v-for="asset in assets" :key="asset.id" :value="asset.id">
                    {{ asset.name }}
                  </option>
                </select>
                <small v-if="errors.assetId">{{ errors.assetId }}</small>
              </label>

              <label>
                <span>Plan title</span>
                <input v-model="form.title" :aria-invalid="Boolean(errors.title)" />
                <small v-if="errors.title">{{ errors.title }}</small>
              </label>

              <label>
                <span>Objectives</span>
                <textarea v-model="form.objectives" rows="4" :aria-invalid="Boolean(errors.objectives)"></textarea>
                <small v-if="errors.objectives">{{ errors.objectives }}</small>
              </label>
            </section>

            <section class="plan-section" aria-labelledby="plan-scope-title">
              <h3 id="plan-scope-title">Scope and Market</h3>

              <label>
                <span>Target market</span>
                <select v-model="form.targetMarket" :aria-invalid="Boolean(errors.targetMarket)">
                  <option v-for="market in targetMarketOptions" :key="market" :value="market">
                    {{ market }}
                  </option>
                </select>
                <small v-if="errors.targetMarket">{{ errors.targetMarket }}</small>
              </label>

              <label>
                <span>Proposed activities</span>
                <textarea v-model="form.proposedActivities" rows="3" :aria-invalid="Boolean(errors.proposedActivities)"></textarea>
                <small v-if="errors.proposedActivities">{{ errors.proposedActivities }}</small>
              </label>
            </section>

            <section class="plan-section" aria-labelledby="plan-timeline-title">
              <h3 id="plan-timeline-title">Timeline and Assignment</h3>

              <div class="plan-grid">
                <label>
                  <span>Timeline start</span>
                  <input v-model="form.timelineStart" type="date" />
                </label>

                <label>
                  <span>Timeline end</span>
                  <input v-model="form.timelineEnd" type="date" :aria-invalid="Boolean(errors.timelineEnd)" />
                  <small v-if="errors.timelineEnd">{{ errors.timelineEnd }}</small>
                </label>
              </div>

              <div class="plan-grid">
                <label>
                  <span>Time start</span>
                  <input v-model="form.timelineStartTime" type="time" />
                </label>

                <label>
                  <span>Time end</span>
                  <input v-model="form.timelineEndTime" type="time" :aria-invalid="Boolean(errors.timelineEndTime)" />
                  <small v-if="errors.timelineEndTime">{{ errors.timelineEndTime }}</small>
                </label>
              </div>

              <label>
                <span>Assigned personnel</span>
                <input v-model="form.assignedPersonnel" :aria-invalid="Boolean(errors.assignedPersonnel)" />
                <small v-if="errors.assignedPersonnel">{{ errors.assignedPersonnel }}</small>
              </label>
            </section>

            <section class="plan-section" aria-labelledby="plan-notes-title">
              <h3 id="plan-notes-title">Notes</h3>

              <label>
                <span>Remarks</span>
                <textarea v-model="form.remarks" rows="3"></textarea>
              </label>
            </section>

            <div v-if="serverError" class="plan-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="plan-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.plan-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.plan-modal__dialog {
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

.plan-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.plan-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.plan-section > label,
.plan-grid label {
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

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.plan-modal__error {
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

.plan-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .plan-modal {
    padding: 10px;
  }

  .plan-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .plan-modal__body {
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
