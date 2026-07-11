<script setup>
import { computed, reactive, watch } from 'vue'

import { IMPROVEMENT_STATUSES } from '@/modules/product/constants/productOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  plans: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit improvement' : 'Create improvement'))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create improvement'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.planId) output.planId = 'Development plan is required.'
  if (!Number.isInteger(Number(form.progressPercentage))) output.progressPercentage = 'Progress must be a whole number.'
  else if (Number(form.progressPercentage) < 0 || Number(form.progressPercentage) > 100) {
    output.progressPercentage = 'Progress must be between 0 and 100.'
  }
  if (!form.improvementStatus) output.improvementStatus = 'Improvement status is required.'
  if (!form.updateDate) output.updateDate = 'Update date is required.'
  if (!form.remarks.trim()) output.remarks = 'Remarks are required.'
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
    planId: value?.planId || '',
    progressPercentage: value?.progressPercentage ?? 0,
    improvementStatus: value?.improvementStatus || 'Ongoing',
    updateDate: toDateInput(value?.updateDate) || new Date().toISOString().slice(0, 10),
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

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    planId: form.planId,
    progressPercentage: Number(form.progressPercentage),
    improvementStatus: form.improvementStatus,
    updateDate: form.updateDate,
    remarks: form.remarks.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="improvement-modal" role="presentation" @click.self="$emit('close')">
      <section class="improvement-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="improvement-form-title">
        <header>
          <div>
            <p>Improvement monitoring</p>
            <h2 id="improvement-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close improvement form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="improvement-modal__body">
            <section class="improvement-section" aria-labelledby="improvement-basic-title">
              <h3 id="improvement-basic-title">Basic Information</h3>

              <label>
                <span>Development plan</span>
                <select v-model="form.planId" :aria-invalid="Boolean(errors.planId)">
                  <option value="">Select active development plan</option>
                  <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                    {{ plan.title || plan.planTitle }} - {{ plan.assetName }}
                  </option>
                </select>
                <small v-if="errors.planId">{{ errors.planId }}</small>
              </label>
            </section>

            <section class="improvement-section" aria-labelledby="improvement-progress-title">
              <h3 id="improvement-progress-title">Progress Update</h3>

              <div class="improvement-grid">
                <label>
                  <span>Progress percentage</span>
                  <input
                    v-model.number="form.progressPercentage"
                    max="100"
                    min="0"
                    type="number"
                    :aria-invalid="Boolean(errors.progressPercentage)"
                  />
                  <small v-if="errors.progressPercentage">{{ errors.progressPercentage }}</small>
                </label>

                <label>
                  <span>Improvement status</span>
                  <select v-model="form.improvementStatus" :aria-invalid="Boolean(errors.improvementStatus)">
                    <option v-for="status in IMPROVEMENT_STATUSES" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                  <small v-if="errors.improvementStatus">{{ errors.improvementStatus }}</small>
                </label>
              </div>

              <label>
                <span>Update date</span>
                <input v-model="form.updateDate" type="date" :aria-invalid="Boolean(errors.updateDate)" />
                <small v-if="errors.updateDate">{{ errors.updateDate }}</small>
              </label>

              <label>
                <span>Remarks</span>
                <textarea
                  v-model="form.remarks"
                  rows="5"
                  :aria-invalid="Boolean(errors.remarks)"
                  placeholder="Describe progress completed, issues found, or next action needed."
                ></textarea>
                <small v-if="errors.remarks">{{ errors.remarks }}</small>
              </label>
            </section>

            <div v-if="serverError" class="improvement-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="improvement-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.improvement-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.improvement-modal__dialog {
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

.improvement-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.improvement-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.improvement-section > label,
.improvement-grid label {
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

.improvement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.improvement-modal__error {
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

.improvement-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .improvement-modal {
    padding: 10px;
  }

  .improvement-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .improvement-modal__body {
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
