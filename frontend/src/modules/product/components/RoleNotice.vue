<script setup>
defineProps({
  title: {
    type: String,
    default: 'View-only mode',
  },
})
</script>

<template>
  <p class="role-notice readonly">
    <strong>{{ title }}</strong>
    <span><slot /></span>
  </p>
</template>
