<script setup>
import { computed, reactive, watch } from 'vue'

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

const title = computed(() => (props.value?.id ? 'Edit event' : 'Create event'))

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
  },
  { immediate: true },
)

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
    accentColor: value?.accentColor || '#0f766e',
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
    accentColor: emptyToNull(form.accentColor),
    status: form.status,
    isFeatured: form.isFeatured,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-event-form-title">
        <header>
          <div>
            <p>Events</p>
            <h2 id="cms-event-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close event form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="cms-form-modal__grid cms-form-modal__grid--top">
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
            <span>Short description</span>
            <textarea v-model="form.shortDescription" rows="3"></textarea>
          </label>

          <label>
            <span>Description</span>
            <textarea v-model="form.description" rows="5"></textarea>
          </label>

          <div class="cms-form-modal__grid">
            <label>
              <span>Venue</span>
              <input v-model="form.venueName" />
            </label>
            <label>
              <span>Organizer</span>
              <input v-model="form.organizerName" />
            </label>
          </div>

          <div class="cms-form-modal__grid">
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

          <div class="cms-form-modal__grid">
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

          <div class="cms-form-modal__grid">
            <label>
              <span>Accent color</span>
              <input v-model="form.accentColor" />
            </label>
            <label class="cms-form-modal__check">
              <input v-model="form.isFeatured" type="checkbox" />
              <span>Feature this event</span>
            </label>
          </div>

          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-form-modal__primary" type="submit" :disabled="busy">
              {{ busy ? 'Saving...' : 'Save event' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@import './cms-form-modal.css';
</style>
