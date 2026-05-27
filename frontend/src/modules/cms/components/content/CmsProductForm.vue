<script setup>
import { computed, reactive, watch } from 'vue'
import CmsImagePreviewField from './CmsImagePreviewField.vue'
import CmsRelationSelect from './CmsRelationSelect.vue'
import { toNullable, toNumberOrNull, validateRequired, validateSlug } from './formUtils'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  businesses: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const title = computed(() => (props.value?.id ? 'Edit product' : 'Create product'))

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  output.slug = validateSlug(form.slug)
  output.name = validateRequired(form.name, 'Name')
  output.businessId = validateRequired(form.businessId, 'Business')
  output.categoryId = validateRequired(form.categoryId, 'Category')
  if (form.priceAmount !== '' && Number(form.priceAmount) < 0) output.priceAmount = 'Price must be non-negative.'
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value))
})

watch(() => [props.open, props.value], () => {
  Object.assign(form, defaultForm(props.value))
  submitted.value = false
}, { immediate: true })

function defaultForm(value = null) {
  return {
    businessId: value?.businessId || '',
    categoryId: value?.categoryId || '',
    slug: value?.slug || '',
    name: value?.name || '',
    shortDescription: value?.shortDescription || '',
    description: value?.description || '',
    priceAmount: value?.priceAmount ?? '',
    priceCurrency: value?.priceCurrency || 'PHP',
    unitLabel: value?.unitLabel || '',
    availabilityText: value?.availabilityText || '',
    accentColor: value?.accentColor || '#0f766e',
    status: value?.status || 'draft',
    isFeatured: Boolean(value?.isFeatured),
  }
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  emit('submit', {
    businessId: form.businessId,
    categoryId: form.categoryId,
    slug: form.slug.trim(),
    name: form.name.trim(),
    shortDescription: toNullable(form.shortDescription),
    description: toNullable(form.description),
    priceAmount: toNumberOrNull(form.priceAmount),
    priceCurrency: form.priceCurrency.trim() || 'PHP',
    unitLabel: toNullable(form.unitLabel),
    availabilityText: toNullable(form.availabilityText),
    accentColor: toNullable(form.accentColor),
    status: form.status,
    isFeatured: form.isFeatured,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-product-form-title">
        <header><div><p>Products / OTOP</p><h2 id="cms-product-form-title">{{ title }}</h2></div><button type="button" aria-label="Close product form" @click="$emit('close')">x</button></header>
        <form novalidate @submit.prevent="submitForm">
          <div class="cms-form-modal__grid cms-form-modal__grid--top">
            <CmsRelationSelect v-model="form.businessId" label="Business" required :options="businesses" :error="errors.businessId" />
            <CmsRelationSelect v-model="form.categoryId" label="Category" required :options="categories" :error="errors.categoryId" />
          </div>
          <label><span>Slug</span><input v-model="form.slug" :aria-invalid="Boolean(errors.slug)" /><small v-if="errors.slug">{{ errors.slug }}</small></label>
          <label><span>Name</span><input v-model="form.name" :aria-invalid="Boolean(errors.name)" /><small v-if="errors.name">{{ errors.name }}</small></label>
          <label><span>Short description</span><textarea v-model="form.shortDescription" rows="3"></textarea></label>
          <label><span>Description</span><textarea v-model="form.description" rows="5"></textarea></label>
          <div class="cms-form-modal__grid">
            <label><span>Price amount</span><input v-model="form.priceAmount" type="number" min="0" step="0.01" :aria-invalid="Boolean(errors.priceAmount)" /><small v-if="errors.priceAmount">{{ errors.priceAmount }}</small></label>
            <label><span>Currency</span><input v-model="form.priceCurrency" maxlength="3" /></label>
          </div>
          <div class="cms-form-modal__grid">
            <label><span>Unit label</span><input v-model="form.unitLabel" /></label>
            <label><span>Availability</span><input v-model="form.availabilityText" /></label>
          </div>
          <div class="cms-form-modal__grid">
            <label><span>Accent color</span><input v-model="form.accentColor" /></label>
            <label><span>Status</span><select v-model="form.status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          </div>
          <label class="cms-form-modal__check"><input v-model="form.isFeatured" type="checkbox" /><span>Feature this product</span></label>
          <CmsImagePreviewField :color="form.accentColor" />
          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>
          <footer><button type="button" :disabled="busy" @click="$emit('close')">Cancel</button><button class="cms-form-modal__primary" type="submit" :disabled="busy">{{ busy ? 'Saving...' : 'Save product' }}</button></footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@import './cms-form-modal.css';
</style>
