<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCmsAuthStore } from '../stores/authStore'

const auth = useCmsAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)
const submitted = ref(false)
const localError = ref('')

const emailError = computed(() => {
  if (!submitted.value) return ''
  if (!form.email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!form.password) return 'Password is required.'
  return ''
})

async function submitLogin() {
  submitted.value = true
  localError.value = ''
  if (emailError.value || passwordError.value) return

  try {
    await auth.login(form.email.trim(), form.password)
    router.replace(route.query.redirect || '/cms/dashboard')
  } catch {
    localError.value = auth.error || 'Unable to sign in.'
  }
}
</script>

<template>
  <main class="cms-login">
    <section class="cms-login__panel" aria-labelledby="cms-login-title">
      <div class="cms-login__brand">
        <span>C</span>
        <div>
          <strong>Calabanga Tourism</strong>
          <small>Management System</small>
        </div>
      </div>

      <div class="cms-login__intro">
        <p>Tourism Staff CMS</p>
        <h1 id="cms-login-title">Sign in to continue</h1>
      </div>

      <form class="cms-login__form" @submit.prevent="submitLogin">
        <div class="cms-field">
          <label for="cms-email">Email address</label>
          <input
            id="cms-email"
            v-model="form.email"
            autocomplete="username"
            type="email"
            :aria-invalid="Boolean(emailError)"
            :aria-describedby="emailError ? 'cms-email-error' : undefined"
          />
          <small v-if="emailError" id="cms-email-error">{{ emailError }}</small>
        </div>

        <div class="cms-field">
          <label for="cms-password">Password</label>
          <div class="cms-password">
            <input
              id="cms-password"
              v-model="form.password"
              autocomplete="current-password"
              :type="showPassword ? 'text' : 'password'"
              :aria-invalid="Boolean(passwordError)"
              :aria-describedby="passwordError ? 'cms-password-error' : undefined"
            />
            <button type="button" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <small v-if="passwordError" id="cms-password-error">{{ passwordError }}</small>
        </div>

        <div v-if="localError" class="cms-login__error" role="alert">{{ localError }}</div>

        <button class="cms-login__submit" type="submit" :disabled="auth.isLoading">
          {{ auth.isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.cms-login {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.18), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
}

.cms-login__panel {
  width: min(440px, 100%);
  padding: 28px;
  border: 1px solid #dbeafe;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
}

.cms-login__brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cms-login__brand > span {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  font-weight: 900;
}

strong,
small,
label {
  display: block;
}

strong {
  color: #0f172a;
}

small,
p {
  color: #64748b;
}

.cms-login__intro {
  margin-top: 30px;
}

.cms-login__intro p {
  margin: 0 0 8px;
  color: #0284c7;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.8rem;
}

.cms-login__form {
  display: grid;
  gap: 18px;
  margin-top: 26px;
}

.cms-field label {
  margin-bottom: 8px;
  color: #334155;
  font-weight: 750;
}

input {
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}

input:focus {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

input[aria-invalid='true'] {
  border-color: #ef4444;
}

.cms-field small {
  margin-top: 6px;
  color: #b91c1c;
}

.cms-password {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.cms-password button,
.cms-login__submit {
  border-radius: 10px;
  font-weight: 800;
}

.cms-password button {
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.cms-login__submit {
  min-height: 48px;
  color: #fff;
  border: 0;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.cms-login__submit:disabled {
  opacity: 0.65;
  cursor: wait;
}

.cms-login__error {
  padding: 12px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
}
</style>
