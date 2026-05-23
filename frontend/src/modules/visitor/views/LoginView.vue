<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="submitLogin">
      <span class="login-logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21s7-5.1 7-11.2A7 7 0 0 0 5 9.8C5 15.9 12 21 12 21Z"
            stroke="currentColor"
            stroke-width="2"
          />
          <circle cx="12" cy="9.8" r="2.4" stroke="currentColor" stroke-width="2" />
        </svg>
      </span>
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
  background:
    radial-gradient(circle at 20% 18%, rgba(23, 73, 51, 0.1), transparent 18rem),
    radial-gradient(circle at 85% 72%, rgba(23, 73, 51, 0.08), transparent 20rem),
    #f7faf8;
}

.login-card {
  width: min(700px, 100%);
  display: grid;
  gap: 1rem;
  padding: clamp(2rem, 5vw, 3rem);
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
  text-align: center;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.login-logo {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  margin: 0 auto 1rem;
  border-radius: 15px;
  background: linear-gradient(145deg, #174933, #1f6b49);
  color: #fff;
  box-shadow: 0 10px 22px rgba(23, 73, 51, 0.24);
}

.login-logo svg {
  width: 30px;
  height: 30px;
}

.login-card h1 {
  margin: 0.5rem 0;
  font-size: clamp(2rem, 4vw, 2.5rem);
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
  border-radius: 12px;
  padding: 0.9rem;
  background: #f1f5f2;
  font: inherit;
}

.login-card input:focus {
  border-color: #174933;
  box-shadow: 0 0 0 4px rgba(23, 73, 51, 0.18);
  background: #fff;
  outline: none;
}

.login-card button {
  margin-top: 0.5rem;
  border: 0;
  border-radius: 999px;
  padding: 1rem;
  background: #174933;
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease;
}

.login-card button:hover {
  background: #0f3625;
  transform: translateY(-1px);
}

.login-card button:disabled {
  cursor: wait;
  opacity: 0.75;
}

.login-error {
  color: #b91c1c !important;
  font-weight: 800;
}
</style>
