<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  mode: {
    type: String,
    default: 'login',
  },
})

const route = useRoute()
const router = useRouter()
const auth = useTouristAuthStore()
const submitted = ref(false)
const form = reactive({
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
})

const isRegister = computed(() => props.mode === 'register')
const title = computed(() => (isRegister.value ? 'Create your tourist account' : 'Sign in as tourist'))
const actionLabel = computed(() => (isRegister.value ? 'Create account' : 'Sign in'))

async function submit() {
  submitted.value = true
  if (!form.email || !form.password || (isRegister.value && !form.fullName)) return

  const payload = {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phoneNumber: form.phoneNumber.trim(),
    password: form.password,
  }

  if (isRegister.value) await auth.register(payload)
  else await auth.login({ email: payload.email, password: payload.password })

  router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/tourist/dashboard')
}

watch(
  () => props.mode,
  () => {
    submitted.value = false
    auth.error = ''
  },
)
</script>

<template>
  <div class="tourist-auth-page">
    <PromotionNavbar />

    <main class="page-shell">
      <section class="auth-panel">
        <div class="auth-copy">
          <p class="eyebrow">CaliTourSys tourist portal</p>
          <h1>{{ title }}</h1>
          <p>
            Use your account to manage package requests and keep your Calabanga travel plans in one place.
          </p>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <label v-if="isRegister">
            <span>Full name</span>
            <input v-model.trim="form.fullName" autocomplete="name" required />
            <small v-if="submitted && !form.fullName">Full name is required.</small>
          </label>

          <label>
            <span>Email address</span>
            <input v-model.trim="form.email" type="email" autocomplete="email" required />
            <small v-if="submitted && !form.email">Email address is required.</small>
          </label>

          <label v-if="isRegister">
            <span>Phone number</span>
            <input v-model.trim="form.phoneNumber" type="tel" autocomplete="tel" />
          </label>

          <label>
            <span>Password</span>
            <input
              v-model="form.password"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              type="password"
              required
            />
            <small v-if="isRegister">Use at least 12 characters with uppercase, lowercase, number, and symbol.</small>
          </label>

          <p v-if="auth.error" class="form-message">{{ auth.error }}</p>

          <button type="submit" :disabled="auth.isLoading">
            {{ auth.isLoading ? 'Please wait...' : actionLabel }}
          </button>

          <p class="switch-link">
            <template v-if="isRegister">
              Already have an account?
              <RouterLink to="/tourist/login">Sign in</RouterLink>
            </template>
            <template v-else>
              New to CaliTourSys?
              <RouterLink to="/tourist/register">Create account</RouterLink>
            </template>
          </p>
        </form>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.tourist-auth-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #14261f;
  font-family: Inter, system-ui, sans-serif;
}

.page-shell {
  width: min(100% - 48px, 1120px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.auth-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(20, 38, 31, 0.08);
}

.auth-copy {
  min-height: 560px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px;
  background:
    linear-gradient(135deg, rgba(27, 67, 50, 0.94), rgba(37, 119, 106, 0.9)),
    url('https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg');
  background-position: center;
  background-size: cover;
  color: #ffffff;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1 {
  max-width: 640px;
  margin: 12px 0 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: clamp(38px, 5vw, 58px);
  line-height: 1.08;
}

.auth-copy p:last-child {
  max-width: 560px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 17px;
  line-height: 1.65;
}

.auth-form {
  display: grid;
  align-content: center;
  gap: 16px;
  padding: 38px;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: #56645f;
  font-size: 13px;
  font-weight: 800;
}

input {
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  color: #14261f;
  font: inherit;
}

input:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

small {
  color: #66746e;
  font-size: 12px;
  line-height: 1.4;
}

.form-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fdecea;
  color: #9f2d20;
  font-size: 13px;
  font-weight: 800;
}

button {
  min-height: 46px;
  border: 0;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.switch-link {
  margin: 0;
  color: #66746e;
  text-align: center;
}

.switch-link a {
  color: #1b4332;
  font-weight: 800;
}

@media (max-width: 900px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }

  .auth-copy {
    min-height: auto;
    padding: 36px;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100% - 32px, 1120px);
    padding-top: 96px;
  }

  .auth-copy,
  .auth-form {
    padding: 24px;
  }
}
</style>
