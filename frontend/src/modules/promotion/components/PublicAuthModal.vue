<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'

const props = defineProps({
  mode: {
    type: String,
    default: 'login',
  },
  intent: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['authenticated', 'close', 'change-mode'])

const auth = useTouristAuthStore()
const submitted = ref(false)
const message = ref('')
const form = reactive({
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
})

const isRegister = computed(() => props.mode === 'register')
const isSaveIntent = computed(() => props.intent === 'save')
const title = computed(() => {
  if (isSaveIntent.value) return 'Sign in to save this place'
  return isRegister.value ? 'Create account' : 'Welcome back'
})
const helperMessage = computed(() => {
  if (isSaveIntent.value) {
    return 'Create an account or log in to save destinations, products, and events to your itinerary.'
  }
  return isRegister.value
    ? 'Sign up to start planning your Calabanga trip.'
    : 'Log in to save locations to your itinerary.'
})

const emailError = computed(() => {
  if (!submitted.value) return ''
  if (!form.email.trim()) return 'Email address is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!form.password) return 'Password is required.'
  if (isRegister.value && form.password.length < 12) return 'Use at least 12 characters.'
  return ''
})

const nameError = computed(() => {
  if (!submitted.value || !isRegister.value) return ''
  if (!form.name.trim()) return 'Full name is required.'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!submitted.value || !isRegister.value) return ''
  if (!form.confirmPassword) return 'Confirm your password.'
  if (form.confirmPassword !== form.password) return 'Passwords do not match.'
  return ''
})

function hasErrors() {
  return Boolean(
    emailError.value || passwordError.value || nameError.value || confirmPasswordError.value,
  )
}

async function submitAuth() {
  submitted.value = true
  message.value = ''
  if (hasErrors()) return

  try {
    const payload = {
      fullName: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
    }
    const tourist = isRegister.value
      ? await auth.register(payload)
      : await auth.login({ email: payload.email, password: payload.password })

    window.dispatchEvent(new CustomEvent('calitoursys:visitor-authenticated', { detail: tourist }))
    emit('authenticated', tourist)
  } catch {
    message.value = auth.error || 'Unable to continue. Please try again.'
  }
}

function switchMode(nextMode) {
  submitted.value = false
  message.value = ''
  emit('change-mode', nextMode)
}

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.mode,
  () => {
    submitted.value = false
    message.value = ''
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="public-auth" role="presentation" @click.self="$emit('close')">
    <section
      class="public-auth__dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="isRegister ? 'public-register-title' : 'public-login-title'"
    >
      <button
        class="public-auth__close"
        type="button"
        aria-label="Close auth dialog"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <header class="public-auth__header">
        <h2 :id="isRegister ? 'public-register-title' : 'public-login-title'">{{ title }}</h2>
        <p>{{ helperMessage }}</p>
      </header>

      <form class="public-auth__form" novalidate @submit.prevent="submitAuth">
        <label v-if="isRegister" class="public-auth__field" for="public-auth-name">
          <span>Full name</span>
          <input
            id="public-auth-name"
            v-model="form.name"
            autocomplete="name"
            placeholder="Juan Dela Cruz"
            :aria-invalid="Boolean(nameError)"
            :aria-describedby="nameError ? 'public-auth-name-error' : undefined"
          />
          <small v-if="nameError" id="public-auth-name-error">{{ nameError }}</small>
        </label>

        <label class="public-auth__field" for="public-auth-email">
          <span>Email address</span>
          <input
            id="public-auth-email"
            v-model="form.email"
            autocomplete="email"
            placeholder="you@example.com"
            type="email"
            :aria-invalid="Boolean(emailError)"
            :aria-describedby="emailError ? 'public-auth-email-error' : undefined"
          />
          <small v-if="emailError" id="public-auth-email-error">{{ emailError }}</small>
        </label>

        <label v-if="isRegister" class="public-auth__field" for="public-auth-phone">
          <span>Phone number</span>
          <input
            id="public-auth-phone"
            v-model="form.phoneNumber"
            autocomplete="tel"
            placeholder="09XX XXX XXXX"
            type="tel"
          />
        </label>

        <label class="public-auth__field" for="public-auth-password">
          <span>
            Password
            <button v-if="!isRegister" type="button">Forgot password?</button>
          </span>
          <input
            id="public-auth-password"
            v-model="form.password"
            autocomplete="current-password"
            placeholder="********"
            type="password"
            :aria-invalid="Boolean(passwordError)"
            :aria-describedby="passwordError ? 'public-auth-password-error' : undefined"
          />
          <small v-if="passwordError" id="public-auth-password-error">{{ passwordError }}</small>
        </label>

        <label v-if="isRegister" class="public-auth__field" for="public-auth-confirm-password">
          <span>Confirm password</span>
          <input
            id="public-auth-confirm-password"
            v-model="form.confirmPassword"
            autocomplete="new-password"
            placeholder="********"
            type="password"
            :aria-invalid="Boolean(confirmPasswordError)"
            :aria-describedby="confirmPasswordError ? 'public-auth-confirm-error' : undefined"
          />
          <small v-if="confirmPasswordError" id="public-auth-confirm-error">{{
            confirmPasswordError
          }}</small>
        </label>

        <p v-if="message" class="public-auth__message" role="status">{{ message }}</p>

        <button class="public-auth__submit" type="submit" :disabled="auth.isLoading">
          {{ auth.isLoading ? 'Please wait...' : isRegister ? 'Create Account' : isSaveIntent ? 'Login' : 'Log in' }}
        </button>
      </form>

      <footer class="public-auth__footer">
        <span v-if="!isRegister">
          <template v-if="isSaveIntent">
            <button type="button" @click="switchMode('register')">Create Account</button>
            <button type="button" @click="$emit('close')">Continue Browsing</button>
          </template>
          <template v-else>
            Don't have an account?
            <button type="button" @click="switchMode('register')">Register</button>
          </template>
        </span>
        <span v-else>
          <template v-if="isSaveIntent">
            <button type="button" @click="switchMode('login')">Login</button>
            <button type="button" @click="$emit('close')">Continue Browsing</button>
          </template>
          <template v-else>
            Already have an account?
            <button type="button" @click="switchMode('login')">Back to login</button>
          </template>
        </span>
      </footer>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap');

.public-auth {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(26, 26, 26, 0.48);
  font-family: Inter, system-ui, sans-serif;
}

.public-auth *,
.public-auth *::before,
.public-auth *::after {
  box-sizing: border-box;
}

.public-auth__dialog {
  position: relative;
  width: min(512px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
  color: #1a1a1a;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
}

.public-auth__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #5c5c5c;
  cursor: pointer;
}

.public-auth__close:hover {
  background: #f2f0eb;
  color: #1a1a1a;
}

.public-auth__close svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.public-auth__header {
  padding: 0 32px;
  text-align: center;
}

.public-auth__header h2 {
  margin: 0;
  color: #1a1a1a;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.public-auth__header p {
  margin: 8px 0 0;
  color: #5c5c5c;
  font-size: 15px;
}

.public-auth__form {
  display: grid;
  gap: 16px;
  margin-top: 40px;
}

.public-auth__field {
  display: grid;
  gap: 8px;
}

.public-auth__field > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
}

.public-auth__field button,
.public-auth__footer button {
  border: 0;
  background: transparent;
  color: #1b4332;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.public-auth__field input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font: inherit;
  outline: 0;
}

.public-auth__field input::placeholder {
  color: #8a8782;
}

.public-auth__field input:focus {
  border-color: #1b4332;
  box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.16);
}

.public-auth__field input[aria-invalid='true'] {
  border-color: #c0392b;
}

.public-auth__field small {
  color: #c0392b;
  font-size: 12px;
}

.public-auth__message {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #d8f3dc;
  border-radius: 8px;
  background: #f2fbf4;
  color: #1b4332;
  font-size: 13px;
  line-height: 1.45;
}

.public-auth__submit {
  height: 48px;
  margin-top: 8px;
  border: 0;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.public-auth__submit:hover {
  background: #14532d;
}

.public-auth__submit:active {
  transform: scale(0.98);
}

.public-auth__close:focus-visible,
.public-auth__field button:focus-visible,
.public-auth__footer button:focus-visible,
.public-auth__submit:focus-visible {
  outline: 3px solid rgba(27, 67, 50, 0.22);
  outline-offset: 2px;
}

.public-auth__footer {
  margin-top: 24px;
  color: #5c5c5c;
  text-align: center;
  font-size: 13px;
}

@media (max-width: 560px) {
  .public-auth {
    padding: 18px;
  }

  .public-auth__dialog {
    padding: 28px 20px;
  }

  .public-auth__header {
    padding: 0 24px;
  }
}
</style>
