<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="submitLogin">
      <span class="brand-logo">⌖</span>
      <h1>Calabanga Tourism Office</h1>
      <p>Visitor Services and Monitoring System</p>
      <p>For authorized personnel only</p>

      <label>
        Username
        <input v-model="credentials.username" required placeholder="Enter your username" />
      </label>

      <label>
        Password
        <input v-model="credentials.password" required type="password" placeholder="Enter your password" />
      </label>

      <p v-if="error" class="login-error">{{ error }}</p>
      <button type="submit" :disabled="loading">{{ loading ? 'Logging in...' : 'Login' }}</button>
    </form>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const credentials = reactive({
  username: '',
  password: '',
})

async function submitLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(credentials)
    router.push(route.query.redirect || auth.dashboardRoute)
  } catch (err) {
    error.value = err.message || 'Unable to login.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fbff, #f3fff8);
}

.login-card {
  width: min(700px, 100%);
  display: grid;
  gap: 1rem;
  padding: 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

.login-card .brand-logo {
  margin: 0 auto 1rem;
}

.login-card h1 {
  margin: 0.5rem 0;
  font-size: 2rem;
}

.login-card p {
  margin: 0;
  color: #334155;
}

.login-card label {
  display: grid;
  gap: 0.45rem;
  text-align: left;
  font-weight: 800;
}

.login-card input {
  width: 100%;
  border: 1px solid #dbe1ea;
  border-radius: 8px;
  padding: 0.9rem;
  background: #f1f1f4;
  font: inherit;
}

.login-card button {
  margin-top: 0.5rem;
  border: 0;
  border-radius: 8px;
  padding: 1rem;
  background: #020617;
  color: #fff;
  font-weight: 800;
  font: inherit;
}

.login-error {
  color: #b91c1c !important;
  font-weight: 800;
}
</style>
