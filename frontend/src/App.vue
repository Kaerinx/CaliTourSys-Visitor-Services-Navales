<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import FloatingItinerary from './modules/promotion/components/FloatingItinerary.vue'
import PublicAuthModal from './modules/promotion/components/PublicAuthModal.vue'

const route = useRoute()
const router = useRouter()
const showPublicItinerary = computed(() => !route.path.startsWith('/cms'))
const publicAuthMode = computed(() => {
  const mode = route.query.auth
  return mode === 'register' ? 'register' : mode === 'login' ? 'login' : ''
})

function setPublicAuthMode(mode) {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      auth: mode,
    },
  })
}

function closePublicAuth() {
  const nextQuery = { ...route.query }
  delete nextQuery.auth
  router.replace({
    path: route.path,
    query: nextQuery,
  })
}
</script>

<template>
  <RouterView />
  <FloatingItinerary v-if="showPublicItinerary" />
  <PublicAuthModal
    v-if="showPublicItinerary && publicAuthMode"
    :mode="publicAuthMode"
    @close="closePublicAuth"
    @change-mode="setPublicAuthMode"
  />
</template>

<style scoped></style>
