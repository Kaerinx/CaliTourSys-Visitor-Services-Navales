<script setup>
import CmsIcon from '../CmsIcon.vue'

defineProps({
  search: { type: String, default: '' },
  status: { type: String, default: '' },
  featured: { type: String, default: '' },
  categoryId: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  createLabel: { type: String, default: 'Create' },
  canCreate: { type: Boolean, default: false },
  showFeatured: { type: Boolean, default: false },
  showCategory: { type: Boolean, default: false },
})

defineEmits([
  'update:search',
  'update:status',
  'update:featured',
  'update:categoryId',
  'create',
])
</script>

<template>
  <section class="cms-content-toolbar" aria-label="Content filters">
    <label class="cms-content-toolbar__search">
      <span>Search</span>
      <CmsIcon name="search" />
      <input
        :value="search"
        type="search"
        placeholder="Search by title, name, or slug"
        @input="$emit('update:search', $event.target.value)"
      />
    </label>

    <label>
      <span>Status</span>
      <select :value="status" @change="$emit('update:status', $event.target.value)">
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
    </label>

    <label v-if="showFeatured">
      <span>Featured</span>
      <select :value="featured" @change="$emit('update:featured', $event.target.value)">
        <option value="">All</option>
        <option value="true">Featured only</option>
        <option value="false">Not featured</option>
      </select>
    </label>

    <label v-if="showCategory">
      <span>Category</span>
      <select :value="categoryId" @change="$emit('update:categoryId', $event.target.value)">
        <option value="">All categories</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
    </label>

    <button v-if="canCreate" class="cms-content-toolbar__create" type="button" @click="$emit('create')">
      <span aria-hidden="true">+</span>
      {{ createLabel }}
    </button>
  </section>
</template>

<style scoped>
.cms-content-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) repeat(3, minmax(150px, auto)) auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

label {
  display: grid;
  gap: 7px;
  min-width: 0;
}

label > span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.cms-content-toolbar__search {
  position: relative;
}

.cms-content-toolbar__search svg {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

input,
select {
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

input {
  padding-left: 38px;
}

input:focus,
select:focus,
button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 1px;
}

.cms-content-toolbar__create {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  color: #fff;
  border: 0;
  border-radius: 8px;
  background: #0f766e;
  font: inherit;
  font-weight: 800;
}

.cms-content-toolbar__create:hover {
  background: #115e59;
}

.cms-content-toolbar__create span {
  font-size: 1.15rem;
  line-height: 1;
}

@media (max-width: 980px) {
  .cms-content-toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .cms-content-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
