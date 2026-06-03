<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  label: { type: String, default: 'category' },
  showColor: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())

const title = computed(() => (props.value?.id ? `Edit ${props.label}` : `Create ${props.label}`))

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.slug.trim()) output.slug = 'Slug is required.'
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) output.slug = 'Use lowercase letters, numbers, and hyphens only.'
  if (!form.name.trim()) output.name = 'Name is required.'
  if (form.displayOrder === '' || Number.isNaN(Number(form.displayOrder))) output.displayOrder = 'Display order must be numeric.'
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
    name: value?.name || '',
    description: value?.description || '',
    displayOrder: value?.displayOrder ?? 0,
    status: value?.status || 'published',
    color: value?.color || '#0f766e',
  }
}

function emptyToNull(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  const payload = {
    slug: form.slug.trim(),
    name: form.name.trim(),
    description: emptyToNull(form.description),
    displayOrder: Number(form.displayOrder),
    status: form.status,
  }

  if (props.showColor) payload.color = emptyToNull(form.color)
  emit('submit', payload)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-category-form-title">
        <header>
          <div>
            <p>Categories</p>
            <h2 id="cms-category-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close category form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <label>
            <span>Slug</span>
            <input v-model="form.slug" :aria-invalid="Boolean(errors.slug)" />
            <small v-if="errors.slug">{{ errors.slug }}</small>
          </label>

          <label>
            <span>Name</span>
            <input v-model="form.name" :aria-invalid="Boolean(errors.name)" />
            <small v-if="errors.name">{{ errors.name }}</small>
          </label>

          <label>
            <span>Description</span>
            <textarea v-model="form.description" rows="4"></textarea>
          </label>

          <div class="cms-form-modal__grid">
            <label>
              <span>Display order</span>
              <input v-model="form.displayOrder" type="number" :aria-invalid="Boolean(errors.displayOrder)" />
              <small v-if="errors.displayOrder">{{ errors.displayOrder }}</small>
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

          <label v-if="showColor">
            <span>Color</span>
            <input v-model="form.color" />
          </label>

          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-form-modal__primary" type="submit" :disabled="busy">
              {{ busy ? 'Saving...' : 'Save category' }}
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
