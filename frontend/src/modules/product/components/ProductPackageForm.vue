<script setup>
import { computed, reactive, watch } from 'vue'

import {
  PACKAGE_BASE_CATEGORIES,
  PACKAGE_DURATIONS,
  PACKAGE_TARGET_MARKETS,
} from '@/modules/product/constants/productOptions'

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
const title = computed(() => (isEditing.value ? 'Edit package' : 'Create package'))
const selectedItemCount = computed(() => form.planIds.length)
const targetMarketOptions = computed(() => withCurrentOption(PACKAGE_TARGET_MARKETS, form.targetMarket))
const durationOptions = computed(() => withCurrentOption(PACKAGE_DURATIONS, form.estimatedDuration))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create package'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.name.trim()) output.name = 'Package name is required.'
  if (!form.description.trim()) output.description = 'Description is required.'
  if (!form.categorySelections.length) output.category = 'Select at least one package category.'
  if (form.categorySelections.length > 2) output.category = 'Select up to two package categories only.'
  if (!form.targetMarket.trim()) output.targetMarket = 'Target market is required.'
  if (!form.estimatedDuration.trim()) output.estimatedDuration = 'Estimated duration is required.'
  if (!String(form.durationDays ?? '').trim() || !isPositiveInteger(form.durationDays)) output.durationDays = 'Duration must be at least 1 day.'
  if (!String(form.departureCapacity ?? '').trim() || !isPositiveInteger(form.departureCapacity)) output.departureCapacity = 'Departure capacity must be at least 1.'
  if (!isNonNegativeMoney(form.basePrice)) output.basePrice = 'Base price must be zero or higher.'
  if (!isPositiveInteger(form.basePax)) output.basePax = 'Base pax must be at least 1.'
  if (!isNonNegativeMoney(form.extraPaxPrice)) output.extraPaxPrice = 'Extra person price must be zero or higher.'
  if (!isPositiveInteger(form.minPax)) output.minPax = 'Minimum pax must be at least 1.'
  if (!isPositiveInteger(form.maxPax)) output.maxPax = 'Maximum pax must be at least 1.'
  const minPax = toNullableInteger(form.minPax)
  const maxPax = toNullableInteger(form.maxPax)
  const basePax = toNullableInteger(form.basePax)
  const departureCapacity = toNullableInteger(form.departureCapacity)
  if (minPax && maxPax && maxPax < minPax) output.maxPax = 'Maximum pax must be greater than or equal to minimum pax.'
  if (basePax && minPax && basePax < minPax) output.basePax = 'Base pax must be greater than or equal to minimum pax.'
  if (basePax && maxPax && basePax > maxPax) output.basePax = 'Base pax must be less than or equal to maximum pax.'
  if (departureCapacity && maxPax && departureCapacity < maxPax) output.departureCapacity = 'Departure capacity cannot be lower than maximum pax.'
  if (!selectedItemCount.value) output.items = 'Select at least one development plan.'
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
  const isArchived = value?.packageStatus === 'Archived'

  return {
    name: value?.name || '',
    description: value?.description || '',
    categorySelections: parsePackageCategory(value?.category || 'Nature'),
    targetMarket: value?.targetMarket || PACKAGE_TARGET_MARKETS[0],
    estimatedDuration: value?.estimatedDuration || PACKAGE_DURATIONS[1],
    durationDays: value?.durationDays ?? 1,
    departureCapacity: value?.departureCapacity ?? value?.maxPax ?? '',
    basePrice: value?.basePrice ?? '',
    basePax: value?.basePax ?? '',
    extraPaxPrice: value?.extraPaxPrice ?? '',
    minPax: value?.minPax ?? '',
    maxPax: value?.maxPax ?? '',
    paymentRequired: Boolean(value?.paymentRequired),
    packageStatus: isArchived ? 'Archived' : 'Draft',
    remarks: value?.remarks || '',
    planIds: items
      .filter((item) => item.itemType === 'Plan' && item.status !== 'Archived' && item.assetStatus !== 'Archived')
      .map((item) => item.referenceId),
    legacyAssetIds: items
      .filter((item) => item.itemType === 'Asset' && item.status !== 'Archived')
      .map((item) => item.referenceId),
  }
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function toNullableNumber(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function toNullableInteger(value) {
  const parsed = toNullableNumber(value)
  return parsed == null ? null : Math.trunc(parsed)
}

function isNonNegativeMoney(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return true
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0
}

function isPositiveInteger(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return true
  const parsed = Number(trimmed)
  return Number.isInteger(parsed) && parsed >= 1
}

function withCurrentOption(options, value) {
  if (!value || options.includes(value)) return options
  return [value, ...options]
}

function parsePackageCategory(category) {
  const selections = String(category || '')
    .split(/\s+and\s+/i)
    .map((item) => item.trim())
    .filter((item) => PACKAGE_BASE_CATEGORIES.includes(item))

  return selections.length ? selections.slice(0, 2) : ['Nature']
}

function formatPackageCategory(selections) {
  return selections.slice(0, 2).join(' and ')
}

function isCategoryDisabled(category) {
  return form.categorySelections.length >= 2 && !form.categorySelections.includes(category)
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    category: formatPackageCategory(form.categorySelections),
    targetMarket: form.targetMarket.trim(),
    estimatedDuration: form.estimatedDuration.trim(),
    durationDays: toNullableInteger(form.durationDays),
    departureCapacity: toNullableInteger(form.departureCapacity),
    basePrice: toNullableNumber(form.basePrice),
    basePax: toNullableInteger(form.basePax),
    extraPaxPrice: toNullableNumber(form.extraPaxPrice),
    minPax: toNullableInteger(form.minPax),
    maxPax: toNullableInteger(form.maxPax),
    paymentRequired: form.paymentRequired,
    packageStatus: form.packageStatus,
    remarks: emptyToNull(form.remarks),
    items: [
      ...form.planIds.map((planId) => ({ itemType: 'Plan', referenceId: planId })),
      ...form.legacyAssetIds.map((assetId) => ({ itemType: 'Asset', referenceId: assetId })),
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
                <fieldset class="package-category-group" :aria-invalid="Boolean(errors.category)">
                  <legend>Category</legend>
                  <div class="package-category-group__options">
                    <label
                      v-for="category in PACKAGE_BASE_CATEGORIES"
                      :key="category"
                      class="package-category-option"
                      :class="{ 'is-selected': form.categorySelections.includes(category) }"
                    >
                      <input
                        v-model="form.categorySelections"
                        type="checkbox"
                        :value="category"
                        :disabled="isCategoryDisabled(category)"
                      />
                      <span>{{ category }}</span>
                    </label>
                  </div>
                  <small v-if="errors.category">{{ errors.category }}</small>
                </fieldset>
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
                  <select
                    v-model="form.targetMarket"
                    :aria-invalid="Boolean(errors.targetMarket)"
                  >
                    <option v-for="market in targetMarketOptions" :key="market" :value="market">
                      {{ market }}
                    </option>
                  </select>
                  <small v-if="errors.targetMarket">{{ errors.targetMarket }}</small>
                </label>

                <label>
                  <span>Estimated duration</span>
                  <select
                    v-model="form.estimatedDuration"
                    :aria-invalid="Boolean(errors.estimatedDuration)"
                  >
                    <option v-for="duration in durationOptions" :key="duration" :value="duration">
                      {{ duration }}
                    </option>
                  </select>
                  <small v-if="errors.estimatedDuration">{{ errors.estimatedDuration }}</small>
                </label>

                <label>
                  <span>Duration in days</span>
                  <input
                    v-model="form.durationDays"
                    type="number"
                    min="1"
                    step="1"
                    :aria-invalid="Boolean(errors.durationDays)"
                    placeholder="1"
                  />
                  <small v-if="errors.durationDays">{{ errors.durationDays }}</small>
                </label>

                <label>
                  <span>Departure capacity</span>
                  <input
                    v-model="form.departureCapacity"
                    type="number"
                    min="1"
                    step="1"
                    :aria-invalid="Boolean(errors.departureCapacity)"
                    placeholder="20"
                  />
                  <small v-if="errors.departureCapacity">{{ errors.departureCapacity }}</small>
                </label>
              </div>
            </section>

            <section class="package-section" aria-labelledby="package-pricing-title">
              <h3 id="package-pricing-title">Pricing</h3>

              <div class="package-grid">
                <label>
                  <span>Base price</span>
                  <input
                    v-model="form.basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    :aria-invalid="Boolean(errors.basePrice)"
                    placeholder="5000.00"
                  />
                  <small v-if="errors.basePrice">{{ errors.basePrice }}</small>
                </label>

                <label>
                  <span>Base pax</span>
                  <input
                    v-model="form.basePax"
                    type="number"
                    min="1"
                    step="1"
                    :aria-invalid="Boolean(errors.basePax)"
                    placeholder="5"
                  />
                  <small v-if="errors.basePax">{{ errors.basePax }}</small>
                </label>

                <label>
                  <span>Extra person price</span>
                  <input
                    v-model="form.extraPaxPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    :aria-invalid="Boolean(errors.extraPaxPrice)"
                    placeholder="800.00"
                  />
                  <small v-if="errors.extraPaxPrice">{{ errors.extraPaxPrice }}</small>
                </label>

                <label>
                  <span>Minimum pax</span>
                  <input
                    v-model="form.minPax"
                    type="number"
                    min="1"
                    step="1"
                    :aria-invalid="Boolean(errors.minPax)"
                    placeholder="1"
                  />
                  <small v-if="errors.minPax">{{ errors.minPax }}</small>
                </label>

                <label>
                  <span>Maximum pax</span>
                  <input
                    v-model="form.maxPax"
                    type="number"
                    min="1"
                    step="1"
                    :aria-invalid="Boolean(errors.maxPax)"
                    placeholder="10"
                  />
                  <small v-if="errors.maxPax">{{ errors.maxPax }}</small>
                </label>

                <label class="package-switch">
                  <input v-model="form.paymentRequired" type="checkbox" />
                  <span>Payment required when booking is added later</span>
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
                  <h4>Development plans</h4>
                  <p>Select non-archived plans to include.</p>
                  <label v-for="plan in plans" :key="plan.id" class="package-check">
                    <input v-model="form.planIds" type="checkbox" :value="plan.id" />
                    <span>
                      <strong>{{ plan.title }}</strong>
                      <small>{{ plan.assetName }}{{ plan.assetLocation ? ` - ${plan.assetLocation}` : '' }}</small>
                    </span>
                  </label>
                  <p v-if="!plans.length">No selectable plans.</p>
                  <p v-if="form.legacyAssetIds.length">
                    Existing asset links are kept for this package. Add plans before removing legacy links.
                  </p>
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

label > span,
.package-category-group legend {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.package-category-group {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.package-category-group legend {
  padding: 0;
}

.package-category-group__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.package-category-option {
  display: flex !important;
  gap: 9px !important;
  align-items: center;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

.package-category-option.is-selected {
  border-color: #14b8a6;
  background: #f0fdfa;
}

.package-category-option input {
  width: 16px;
  min-width: 16px;
  min-height: 16px;
  margin: 0;
  accent-color: #0f766e;
}

.package-category-option span {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 700;
}

.package-category-option:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.56;
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
textarea[aria-invalid='true'],
.package-category-group[aria-invalid='true'] .package-category-option {
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

.package-switch {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  align-self: end;
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.package-switch input {
  width: 16px;
  min-width: 16px;
  min-height: 16px;
  margin: 0;
  accent-color: #0f766e;
}

.package-switch span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.3;
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

  .package-category-group__options {
    grid-template-columns: 1fr;
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
