<template>
  <ManagementLayout :nav="nav">
    <h1>{{ route.meta.title }}</h1>
    <p class="muted">{{ route.meta.subtitle }}</p>
    <section class="panel">
      <div class="empty-state">This section is available in the navigation and ready for module-specific content.</div>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ManagementLayout from '../components/ManagementLayout.vue'
import { adminNav, receptionistNav, tourismNav } from './nav'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const auth = useAuthStore()
const nav = computed(() => {
  if (auth.user?.role === 'admin') return adminNav
  if (auth.user?.role === 'receptionist') return receptionistNav
  return tourismNav
})
</script>
