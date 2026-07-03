<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import CmsRelationSelect from './CmsRelationSelect.vue'
import { toNullable, toNumberOrNull, validateRequired } from './formUtils'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  accreditedEstablishments: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const imageInput = ref(null)
const imageFile = ref(null)
const imageFileName = ref('')
const imagePreviewUrl = ref('')

const title = computed(() => (props.value?.id ? 'Edit Product' : 'Create Product'))
const selectedEstablishment = computed(() =>
  props.accreditedEstablishments.find((establishment) => establishment.id === form.sourceAccreditationRecordId),
)
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return props.value?.id ? 'Save Changes' : 'Create Product'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  output.name = validateRequired(form.name, 'Name')
  if (!props.value?.id && form.name.trim() && !form.slug) {
    output.name = 'Name must include at least one letter or number.'
  }
  output.categoryId = validateRequired(form.categoryId, 'Category')
  if (form.priceAmount !== '' && Number(form.priceAmount) < 0) output.priceAmount = 'Price must be non-negative.'
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value))
})

watch(() => [props.open, props.value], () => {
  Object.assign(form, defaultForm(props.value))
  submitted.value = false
  resetImageSelection()
  setExistingImagePreview(props.value)
}, { immediate: true })

watch(
  () => form.name,
  (value) => {
    form.slug = generateSlug(value)
  },
)

onBeforeUnmount(resetImageSelection)

function defaultForm(value = null) {
  return {
    sourceAccreditationRecordId: value?.sourceAccreditationRecordId || '',
    categoryId: value?.categoryId || '',
    slug: value?.slug || '',
    name: value?.name || '',
    shortDescription: value?.shortDescription || '',
    priceAmount: value?.priceAmount ?? '',
    accentColor: value?.accentColor || '#0f766e',
  }
}

function generateSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function openImagePicker() {
  imageInput.value?.click()
}

function handleImageChange(event) {
  const [file] = Array.from(event.target.files || [])
  resetImageSelection()
  if (!file) return

  imageFile.value = file
  imageFileName.value = file.name
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function resetImageSelection() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFile.value = null
  imageFileName.value = ''
  imagePreviewUrl.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

function setExistingImagePreview(value) {
  const imageUrl = value?.primaryImage?.url || value?.imageUrl || ''
  if (!imageUrl) return
  imagePreviewUrl.value = imageUrl
  imageFileName.value = value?.primaryImage?.altText || 'Saved product image'
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  const payload = {
    sourceAccreditationRecordId: form.sourceAccreditationRecordId || undefined,
    categoryId: form.categoryId,
    name: form.name.trim(),
    shortDescription: toNullable(form.shortDescription),
    priceAmount: toNumberOrNull(form.priceAmount),
    priceCurrency: 'PHP',
    unitLabel: null,
    availabilityText: null,
    accentColor: toNullable(form.accentColor),
    imageFile: imageFile.value || undefined,
  }

  if (!props.value?.id) payload.slug = form.slug.trim()
  emit('submit', payload)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-product-form-title">
        <header>
          <div>
            <p>PRODUCTS</p>
            <h2 id="cms-product-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close product form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="cms-form-modal__body">
            <section class="cms-form-section" aria-labelledby="product-basic-title">
              <h3 id="product-basic-title">Basic Information</h3>

              <label>
                <span>Product Name</span>
                <input v-model="form.name" :aria-invalid="Boolean(errors.name)" />
                <small v-if="errors.name">{{ errors.name }}</small>
              </label>

              <label>
                <span>Short description</span>
                <textarea v-model="form.shortDescription" rows="2"></textarea>
              </label>
            </section>

            <section class="cms-form-section" aria-labelledby="product-details-title">
              <h3 id="product-details-title">Product Details</h3>

              <div class="cms-form-modal__grid">
                <CmsRelationSelect v-model="form.sourceAccreditationRecordId" label="Linked Accredited Business" :options="accreditedEstablishments" placeholder="No linked accredited business" empty-text="No active accredited businesses found" :error="errors.sourceAccreditationRecordId" />
                <CmsRelationSelect v-model="form.categoryId" label="Category" required :options="categories" :error="errors.categoryId" />
              </div>

              <div v-if="selectedEstablishment" class="cms-product-business-card">
                <strong>{{ selectedEstablishment.businessName }}</strong>
                <span>{{ selectedEstablishment.location || 'Location not provided' }}</span>
                <span>
                  {{ selectedEstablishment.businessType || 'Business type not provided' }}
                  <template v-if="selectedEstablishment.ownerName">
                    / {{ selectedEstablishment.ownerName }}
                  </template>
                </span>
                <span>
                  {{ selectedEstablishment.recordNumber || 'Active accreditation' }}
                  <template v-if="selectedEstablishment.expiresAt">
                    / Expires {{ selectedEstablishment.expiresAt }}
                  </template>
                </span>
              </div>

            </section>

            <section class="cms-form-section" aria-labelledby="product-pricing-title">
              <h3 id="product-pricing-title">Pricing and Inventory</h3>

              <div class="cms-form-modal__grid">
                <label>
                  <span>Price</span>
                  <input v-model="form.priceAmount" type="number" min="0" step="0.01" :aria-invalid="Boolean(errors.priceAmount)" />
                  <small v-if="errors.priceAmount">{{ errors.priceAmount }}</small>
                </label>
              </div>
            </section>

            <section class="cms-form-section" aria-labelledby="product-image-title">
              <h3 id="product-image-title">Product Image</h3>

              <div class="cms-product-image__control">
                <div v-if="imagePreviewUrl" class="cms-product-image__preview">
                  <img :src="imagePreviewUrl" :alt="imageFileName || 'Selected product image preview'" />
                </div>
                <div v-else class="cms-product-image__empty" aria-hidden="true">No image selected</div>
                <div>
                  <input ref="imageInput" class="cms-product-image__input" type="file" accept="image/*" @change="handleImageChange" />
                  <button type="button" aria-describedby="product-image-help" @click="openImagePicker">Add Image</button>
                  <small v-if="imageFileName">{{ imageFileName }}</small>
                  <em id="product-image-help">Upload a clear image of the product.</em>
                </div>
              </div>
            </section>

            <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-form-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.cms-form-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.cms-form-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(740px, 100%);
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

.cms-form-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.cms-form-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.cms-form-section + .cms-form-section {
  padding-top: 2px;
}

.cms-form-section > label,
.cms-form-modal__grid label,
.cms-form-modal__status-grid label,
.cms-form-modal__grid :deep(label) {
  display: grid;
  min-width: 0;
  gap: 6px;
}

label > span,
.cms-form-modal__grid :deep(label > span) {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

input,
select,
textarea,
.cms-form-modal__grid :deep(select) {
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
button:focus-visible,
.cms-form-modal__grid :deep(select:focus) {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

input[aria-invalid='true'],
select[aria-invalid='true'],
.cms-form-modal__grid :deep(select[aria-invalid='true']) {
  border-color: #dc2626;
}

small,
.cms-form-modal__grid :deep(small) {
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-form-modal__help {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-form-modal__grid,
.cms-form-modal__status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.cms-form-modal__status-grid {
  align-items: start;
}

.cms-product-business-card {
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  color: #334155;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  background: #f0fdfa;
  font-size: 0.82rem;
  line-height: 1.35;
}

.cms-product-business-card strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.cms-form-modal__check {
  display: grid;
  align-self: start;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 10px 0;
  color: #334155;
  font-weight: 800;
}

.cms-form-modal__check span {
  min-width: 0;
  color: #334155;
  font-size: 0.84rem;
}

.cms-form-modal__check input {
  width: 16px;
  min-height: 16px;
}

.cms-product-image__control {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-product-image__empty,
.cms-product-image__preview {
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  place-items: center;
  overflow: hidden;
  color: #64748b;
  border-radius: 6px;
  background: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.cms-product-image__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-product-image__control > div:last-child {
  display: grid;
  min-width: 0;
  gap: 6px;
  justify-items: start;
}

.cms-product-image__input {
  display: none;
}

.cms-product-image__control em {
  color: #64748b;
  font-size: 0.8rem;
  font-style: normal;
  line-height: 1.35;
}

.cms-product-image__control small {
  max-width: 100%;
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-form-modal__error {
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
    padding: 10px;
  }

  .cms-form-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .cms-form-modal__body {
    padding: 14px;
  }
}

@media (max-width: 460px) {
  .cms-product-image__control {
    grid-template-columns: 1fr;
  }

  footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  footer button {
    width: 100%;
  }
}
</style>
