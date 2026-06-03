<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const sessionExpired = computed(() => route.query.session === 'expired')

const form = reactive({
  username: 'officer',
  password: 'password123',
})

const demoAccounts = [
  { label: 'Tourism Staff', username: 'staff' },
  { label: 'Tourism Officer', username: 'officer' },
  { label: 'LGU Official', username: 'lgu' },
  { label: 'System Admin', username: 'admin' },
]

function useDemoAccount(username) {
  form.username = username
  form.password = 'password123'
}

async function submitLogin() {
  await auth.login(form)
  router.push('/dashboard')
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <p class="eyebrow">CaliTourSys Module</p>
      <h1>Tourism Product Development Program</h1>
      <p class="lede">
        Sign in to manage tourism assets, development plans, improvements, and activities.
      </p>

      <form class="login-form" @submit.prevent="submitLogin">
        <label>
          Username
          <input v-model="form.username" autocomplete="username" required />
        </label>

        <label>
          Password
          <input v-model="form.password" autocomplete="current-password" required type="password" />
        </label>

        <p v-if="sessionExpired" class="form-error">
          Your session expired. Please sign in again to continue.
        </p>
        <p v-if="auth.error" class="form-error">{{ auth.error }}</p>

        <button class="primary-button" :disabled="auth.loading" type="submit">
          {{ auth.loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <div class="demo-panel">
        <span>Demo users</span>
        <button
          v-for="account in demoAccounts"
          :key="account.username"
          type="button"
          @click="useDemoAccount(account.username)"
        >
          {{ account.label }}
        </button>
      </div>
    </div>
  </section>
</template>
