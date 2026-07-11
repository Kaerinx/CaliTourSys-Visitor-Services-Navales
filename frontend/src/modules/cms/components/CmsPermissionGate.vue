<script setup>
import { computed } from 'vue'
import { useCmsAuthStore } from '../stores/authStore'

const props = defineProps({
  permission: {
    type: String,
    default: '',
  },
  any: {
    type: Array,
    default: () => [],
  },
})

const auth = useCmsAuthStore()

const canShow = computed(() => {
  if (props.permission) return auth.hasPermission(props.permission)
  if (props.any.length > 0) return auth.hasAnyPermission(props.any)
  return true
})
</script>

<template>
  <slot v-if="canShow" />
</template>
