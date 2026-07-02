<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Accepts strings or objects: 'Sports' | { name: 'Sports', color: '#B5451B' }.
  // Data-driven: renders whatever categories are attached, wrapping naturally.
  categories: {
    type: Array,
    default: () => [],
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md'
  },
})

const normalised = computed(() =>
  (props.categories || [])
    .map((category) =>
      typeof category === 'string'
        ? { name: category, color: '' }
        : { name: category?.name ?? '', color: category?.color ?? '' },
    )
    .filter((category) => category.name),
)
</script>

<template>
  <ul v-if="normalised.length" class="category-tags" :class="`category-tags--${size}`">
    <li
      v-for="category in normalised"
      :key="category.name"
      class="category-tags__pill"
      :style="category.color ? { '--tag-color': category.color } : {}"
      :class="{ 'category-tags__pill--accent': !category.color }"
    >
      {{ category.name }}
    </li>
  </ul>
</template>

<style scoped>
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-tags__pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 12px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background: color-mix(in srgb, var(--tag-color) 14%, white);
  color: var(--tag-color);
  border: 1px solid color-mix(in srgb, var(--tag-color) 26%, white);
}

/* Default palette from the design lock: accent-light bg + accent text. */
.category-tags__pill--accent {
  background: #ffe8de;
  color: #7a2d0e;
  border-color: transparent;
}

.category-tags--sm .category-tags__pill {
  padding: 4px 10px;
  font-size: 11px;
}
</style>
