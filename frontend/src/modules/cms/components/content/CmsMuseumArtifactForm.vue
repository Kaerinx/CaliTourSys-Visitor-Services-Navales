<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import CmsRelationSelect from './CmsRelationSelect.vue'
import { toNullable, validateRequired, validateSlug } from './formUtils'

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
const imageInput = ref(null)
const imageFileName = ref('')
const imagePreviewUrl = ref('')

const isEditing = computed(() => Boolean(props.value?.id))
const title = computed(() => (isEditing.value ? 'Edit artifact' : 'Create artifact'))
const submitLabel = computed(() => {
  if (props.busy) return 'Saving...'
  return isEditing.value ? 'Save changes' : 'Create artifact'
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  output.slug = validateSlug(form.slug)
  output.name = validateRequired(form.name, 'Name')
  output.categoryId = validateRequired(form.categoryId, 'Category')
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value))
})

watch(
  () => [props.open, props.value],
  () => {
    Object.assign(form, defaultForm(props.value))
    submitted.value = false
    resetImageSelection()
  },
  { immediate: true },
)

onBeforeUnmount(resetImageSelection)

function defaultForm(value = null) {
  return {
    categoryId: value?.categoryId || '',
    slug: value?.slug || '',
    name: value?.name || '',
    eraLabel: value?.eraLabel || '',
    shortDescription: value?.shortDescription || '',
    description: value?.description || '',
    historicalNotes: value?.historicalNotes || '',
    status: value?.status || 'draft',
    isFeatured: Boolean(value?.isFeatured),
  }
}

function openImagePicker() {
  imageInput.value?.click()
}

function handleImageChange(event) {
  const [file] = Array.from(event.target.files || [])
  resetImageSelection()
  if (!file) return

  imageFileName.value = file.name
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function resetImageSelection() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFileName.value = ''
  imagePreviewUrl.value = ''
  if (imageInput.value) imageInput.value.value = ''
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('submit', {
    categoryId: form.categoryId,
    slug: form.slug.trim(),
    name: form.name.trim(),
    eraLabel: toNullable(form.eraLabel),
    shortDescription: toNullable(form.shortDescription),
    description: toNullable(form.description),
    historicalNotes: toNullable(form.historicalNotes),
    status: form.status,
    isFeatured: form.isFeatured,
    // TODO: Send the selected artifact image when the CMS museum API supports image upload or image URLs.
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-artifact-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-artifact-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-artifact-form-title">
        <header>
          <div>
            <p>Museum</p>
            <h2 id="cms-artifact-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close artifact form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="cms-artifact-modal__body">
            <section class="cms-artifact-section" aria-labelledby="artifact-basic-title">
              <h3 id="artifact-basic-title">Basic Information</h3>

              <div class="cms-artifact-grid">
                <CmsRelationSelect v-model="form.categoryId" label="Category" required :options="categories" :error="errors.categoryId" />
                <label>
                  <span>Status</span>
                  <select v-model="form.status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <div class="cms-artifact-grid">
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
              </div>

              <label>
                <span>Era label</span>
                <input v-model="form.eraLabel" />
              </label>

              <label>
                <span>Short description</span>
                <textarea v-model="form.shortDescription" rows="2"></textarea>
              </label>

              <label>
                <span>Description</span>
                <textarea v-model="form.description" rows="4"></textarea>
              </label>
            </section>

            <section class="cms-artifact-section" aria-labelledby="artifact-context-title">
              <h3 id="artifact-context-title">Historical Context</h3>

              <label>
                <span>Historical notes</span>
                <textarea v-model="form.historicalNotes" rows="4"></textarea>
              </label>
            </section>

            <section class="cms-artifact-section" aria-labelledby="artifact-media-title">
              <h3 id="artifact-media-title">Media</h3>

              <div class="cms-artifact-image">
                <span>Artifact Image</span>
                <div class="cms-artifact-image__control">
                  <div v-if="imagePreviewUrl" class="cms-artifact-image__preview">
                    <img :src="imagePreviewUrl" :alt="imageFileName || 'Selected artifact image preview'" />
                  </div>
                  <div v-else class="cms-artifact-image__empty" aria-hidden="true">No image selected</div>

                  <div>
                    <input ref="imageInput" class="cms-artifact-image__input" type="file" accept="image/*" @change="handleImageChange" />
                    <button type="button" aria-describedby="artifact-image-help" @click="openImagePicker">Add Image</button>
                    <small v-if="imageFileName">{{ imageFileName }}</small>
                    <em id="artifact-image-help">Upload a clear artifact photo or exhibit image.</em>
                  </div>
                </div>
              </div>
            </section>

            <section class="cms-artifact-section" aria-labelledby="artifact-publishing-title">
              <h3 id="artifact-publishing-title">Publishing</h3>

              <label class="cms-artifact-check">
                <input v-model="form.isFeatured" type="checkbox" />
                <span>Feature this artifact</span>
              </label>
            </section>

            <div v-if="serverError" class="cms-artifact-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-artifact-modal__primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
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

.cms-artifact-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.cms-artifact-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
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

.cms-artifact-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.cms-artifact-section {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.cms-artifact-section > label,
.cms-artifact-grid label,
.cms-artifact-grid :deep(label) {
  display: grid;
  min-width: 0;
  gap: 6px;
}

label > span,
.cms-artifact-grid :deep(label > span),
.cms-artifact-image > span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

input,
select,
textarea,
.cms-artifact-grid :deep(select) {
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
.cms-artifact-grid :deep(select:focus) {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

input[aria-invalid='true'],
select[aria-invalid='true'],
.cms-artifact-grid :deep(select[aria-invalid='true']) {
  border-color: #dc2626;
}

small,
.cms-artifact-grid :deep(small) {
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-artifact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.cms-artifact-check {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  color: #334155;
  font-weight: 800;
}

.cms-artifact-check span {
  min-width: 0;
  color: #334155;
  font-size: 0.84rem;
}

.cms-artifact-check input {
  width: 16px;
  min-height: 16px;
}

.cms-artifact-image {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.cms-artifact-image__control {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-artifact-image__empty,
.cms-artifact-image__preview {
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  place-items: center;
  overflow: hidden;
  color: #64748b;
  border-radius: 6px;
  background: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.cms-artifact-image__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-artifact-image__control > div:last-child {
  display: grid;
  min-width: 0;
  gap: 6px;
  justify-items: start;
}

.cms-artifact-image__input {
  display: none;
}

.cms-artifact-image em {
  color: #64748b;
  font-size: 0.8rem;
  font-style: normal;
  line-height: 1.35;
}

.cms-artifact-image small {
  max-width: 100%;
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-artifact-modal__error {
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

.cms-artifact-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .cms-artifact-modal {
    padding: 10px;
  }

  .cms-artifact-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .cms-artifact-modal__body {
    padding: 14px;
  }
}

@media (max-width: 460px) {
  .cms-artifact-image__control {
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
