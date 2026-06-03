<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const roleLabel = computed(() => auth.user?.role || 'Guest')

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="app-navbar">
    <RouterLink class="brand" to="/dashboard">
      <span>CalTourSys</span>
      <strong>Product Development</strong>
    </RouterLink>

    <nav v-if="auth.isAuthenticated">
      <RouterLink to="/dashboard">Dashboard</RouterLink>
      <RouterLink to="/product">Product Module</RouterLink>
      <RouterLink to="/product/assets">Assets</RouterLink>
      <RouterLink to="/product/development-plans">Plans</RouterLink>
      <RouterLink to="/product/improvements">Improvements</RouterLink>
      <RouterLink to="/product/activities">Activities</RouterLink>
      <RouterLink to="/product/packages">Packages</RouterLink>
    </nav>

    <div v-if="auth.isAuthenticated" class="user-chip">
      <span>{{ roleLabel }}</span>
      <button type="button" @click="logout">Logout</button>
    </div>
  </header>
</template>
