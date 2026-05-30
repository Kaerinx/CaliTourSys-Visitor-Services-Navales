<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import FloatingItinerary from './modules/promotion/components/FloatingItinerary.vue'
import PublicAuthModal from './modules/promotion/components/PublicAuthModal.vue'

const route = useRoute()
const router = useRouter()
const isCmsRoute = computed(() => route.path.startsWith('/cms'))
const isMuseumRoute = computed(() => route.path.startsWith('/promotion/museum'))
const showPublicItinerary = computed(() => !isCmsRoute.value && !isMuseumRoute.value)
const showPublicAuth = computed(() => !isCmsRoute.value)
const publicAuthMode = computed(() => {
  const mode = route.query.auth
  return mode === 'register' ? 'register' : mode === 'login' ? 'login' : ''
})
const publicAuthIntent = computed(() => {
  const intent = route.query.authIntent
  return intent === 'save' ? 'save' : ''
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
  delete nextQuery.authIntent
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
    v-if="showPublicAuth && publicAuthMode"
    :mode="publicAuthMode"
    :intent="publicAuthIntent"
    @close="closePublicAuth"
    @change-mode="setPublicAuthMode"
    @authenticated="closePublicAuth"
  />
</template>

<style scoped></style>
