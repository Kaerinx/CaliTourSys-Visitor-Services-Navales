<script setup>
import { computed, reactive, watch } from 'vue'
import { toNullable, validateRequired, validateSlug } from './formUtils'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const title = computed(() => (props.value?.id ? 'Edit business' : 'Create business'))

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  output.slug = validateSlug(form.slug)
  output.name = validateRequired(form.name, 'Name')
  output.businessType = validateRequired(form.businessType, 'Business type')
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value))
})

watch(() => [props.open, props.value], () => {
  Object.assign(form, defaultForm(props.value))
  submitted.value = false
}, { immediate: true })

function defaultForm(value = null) {
  return {
    slug: value?.slug || '',
    name: value?.name || '',
    businessType: value?.businessType || '',
    ownerName: value?.ownerName || '',
    description: value?.description || '',
    addressLine: value?.addressLine || '',
    barangay: value?.barangay || '',
    municipality: value?.municipality || 'Calabanga',
    province: value?.province || 'Camarines Sur',
    status: value?.status || 'active',
    isFeatured: Boolean(value?.isFeatured),
  }
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  emit('submit', {
    slug: form.slug.trim(),
    name: form.name.trim(),
    businessType: form.businessType.trim(),
    ownerName: toNullable(form.ownerName),
    description: toNullable(form.description),
    addressLine: toNullable(form.addressLine),
    barangay: toNullable(form.barangay),
    municipality: form.municipality.trim() || 'Calabanga',
    province: form.province.trim() || 'Camarines Sur',
    status: form.status,
    isFeatured: form.isFeatured,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-business-form-title">
        <header><div><p>Businesses / Producers</p><h2 id="cms-business-form-title">{{ title }}</h2></div><button type="button" aria-label="Close business form" @click="$emit('close')">x</button></header>
        <form novalidate @submit.prevent="submitForm">
          <label><span>Slug</span><input v-model="form.slug" :aria-invalid="Boolean(errors.slug)" /><small v-if="errors.slug">{{ errors.slug }}</small></label>
          <label><span>Name</span><input v-model="form.name" :aria-invalid="Boolean(errors.name)" /><small v-if="errors.name">{{ errors.name }}</small></label>
          <div class="cms-form-modal__grid">
            <label><span>Business type</span><input v-model="form.businessType" :aria-invalid="Boolean(errors.businessType)" /><small v-if="errors.businessType">{{ errors.businessType }}</small></label>
            <label><span>Owner name</span><input v-model="form.ownerName" /></label>
          </div>
          <label><span>Description</span><textarea v-model="form.description" rows="5"></textarea></label>
          <label><span>Address line</span><input v-model="form.addressLine" /></label>
          <div class="cms-form-modal__grid">
            <label><span>Barangay</span><input v-model="form.barangay" /></label>
            <label><span>Municipality</span><input v-model="form.municipality" /></label>
          </div>
          <div class="cms-form-modal__grid">
            <label><span>Province</span><input v-model="form.province" /></label>
            <label><span>Status</span><select v-model="form.status"><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
          </div>
          <label class="cms-form-modal__check"><input v-model="form.isFeatured" type="checkbox" /><span>Feature this business</span></label>
          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>
          <footer><button type="button" :disabled="busy" @click="$emit('close')">Cancel</button><button class="cms-form-modal__primary" type="submit" :disabled="busy">{{ busy ? 'Saving...' : 'Save business' }}</button></footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@import './cms-form-modal.css';
</style>
