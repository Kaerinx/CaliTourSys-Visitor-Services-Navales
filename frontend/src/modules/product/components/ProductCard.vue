<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <article class="product-card">
    <span>{{ status }}</span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </article>
</template>
