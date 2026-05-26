<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const title = computed(() => (props.value?.id ? 'Edit promotion' : 'Create promotion'))

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
  },
  { immediate: true },
)

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

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    slug: form.slug.trim(),
    title: form.title.trim(),
    summary: emptyToNull(form.summary),
    description: emptyToNull(form.description),
    promotionType: form.promotionType,
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
            <p>Promotions</p>
            <h2 id="cms-promotion-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close promotion form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
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

          <label>
            <span>Summary</span>
            <textarea v-model="form.summary" rows="3"></textarea>
          </label>

          <label>
            <span>Description</span>
            <textarea v-model="form.description" rows="5"></textarea>
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

          <div class="cms-form-modal__grid">
            <label>
              <span>Accent color</span>
              <input v-model="form.accentColor" />
            </label>
            <label class="cms-form-modal__check">
              <input v-model="form.isFeatured" type="checkbox" />
              <span>Feature this promotion</span>
            </label>
          </div>

          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-form-modal__primary" type="submit" :disabled="busy">
              {{ busy ? 'Saving...' : 'Save promotion' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.cms-form-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.46);
}

.cms-form-modal__dialog {
  width: min(760px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
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
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
}

footer {
  border-top: 1px solid #e2e8f0;
  border-bottom: 0;
}

p,
h2 {
  margin: 0;
}

p {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  color: #0f172a;
  font-size: 1.35rem;
}

form {
  display: grid;
  gap: 16px;
}

form > label,
.cms-form-modal__grid label {
  display: grid;
  gap: 7px;
}

form > label,
.cms-form-modal__grid,
.cms-form-modal__error {
  margin-inline: 20px;
}

form > label:first-child {
  margin-top: 20px;
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
  min-height: 42px;
  padding: 9px 12px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

textarea {
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
}

.cms-form-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.cms-form-modal__check {
  align-content: center;
  grid-template-columns: auto 1fr;
  margin-top: 22px;
}

.cms-form-modal__check input {
  width: 18px;
  min-height: 18px;
}

.cms-form-modal__error {
  padding: 12px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
}

button {
  min-height: 40px;
  padding: 0 14px;
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
    padding: 12px;
  }

  .cms-form-modal__grid {
    grid-template-columns: 1fr;
  }
}
</style>
