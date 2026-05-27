<script setup>
import CmsIcon from '../CmsIcon.vue'

defineProps({
  search: { type: String, default: '' },
  status: { type: String, default: '' },
  statusOptions: {
    type: Array,
    default: () => [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  featured: { type: String, default: '' },
  categoryId: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  businessId: { type: String, default: '' },
  businesses: { type: Array, default: () => [] },
  businessType: { type: String, default: '' },
  businessTypes: { type: Array, default: () => [] },
  barangay: { type: String, default: '' },
  locationType: { type: String, default: '' },
  createLabel: { type: String, default: 'Create' },
  canCreate: { type: Boolean, default: false },
  showFeatured: { type: Boolean, default: false },
  showCategory: { type: Boolean, default: false },
  showBusiness: { type: Boolean, default: false },
  showBusinessType: { type: Boolean, default: false },
  showBarangay: { type: Boolean, default: false },
  showLocationType: { type: Boolean, default: false },
})

defineEmits([
  'update:search',
  'update:status',
  'update:featured',
  'update:categoryId',
  'update:businessId',
  'update:businessType',
  'update:barangay',
  'update:locationType',
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
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
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

    <label v-if="showBusiness">
      <span>Business</span>
      <select :value="businessId" @change="$emit('update:businessId', $event.target.value)">
        <option value="">All businesses</option>
        <option v-for="business in businesses" :key="business.id" :value="business.id">
          {{ business.name }}
        </option>
      </select>
    </label>

    <label v-if="showBusinessType">
      <span>Business type</span>
      <select :value="businessType" @change="$emit('update:businessType', $event.target.value)">
        <option value="">All types</option>
        <option v-for="type in businessTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </label>

    <label v-if="showBarangay">
      <span>Barangay</span>
      <input
        :value="barangay"
        placeholder="Filter by barangay"
        @input="$emit('update:barangay', $event.target.value)"
      />
    </label>

    <label v-if="showLocationType">
      <span>Location type</span>
      <select :value="locationType" @change="$emit('update:locationType', $event.target.value)">
        <option value="">All types</option>
        <option value="destination">Destination</option>
        <option value="business">Business</option>
        <option value="event">Event</option>
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
  grid-template-columns: minmax(240px, 1fr) repeat(auto-fit, minmax(150px, auto));
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
