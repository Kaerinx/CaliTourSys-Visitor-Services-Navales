<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import FloatingItinerary from './modules/promotion/components/FloatingItinerary.vue'

const route = useRoute()
const showPublicItinerary = computed(() => !route.path.startsWith('/cms'))
</script>

<template>
  <RouterView />
  <FloatingItinerary v-if="showPublicItinerary" />
</template>

<style scoped></style>
