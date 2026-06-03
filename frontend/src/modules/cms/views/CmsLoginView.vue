<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CmsIcon from '../components/CmsIcon.vue'
import { useCmsAuthStore } from '../stores/authStore'

const auth = useCmsAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: 'officer',
  password: '',
})

const showPassword = ref(false)
const submitted = ref(false)
const localError = ref('')
const sessionNotice = computed(() =>
  route.query.sessionExpired ? 'Your session expired. Please sign in again to continue.' : '',
)
const submitLabel = computed(() => {
  if (auth.isLoading) return 'Signing in...'
  return sessionNotice.value ? 'Sign in again' : 'Sign in'
})

const emailError = computed(() => {
  if (!submitted.value) return ''
  if (!form.email.trim()) return 'Username or email is required.'
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
    router.replace(resolveRedirect())
  } catch {
    localError.value = auth.error || 'Unable to sign in.'
  }
}

function resolveRedirect() {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/cms') && redirect !== '/cms/login') {
    return redirect
  }

  return '/cms/dashboard'
}
</script>

<template>
  <main class="cms-login">
    <section class="cms-login__brand-panel" aria-label="CMS overview">
      <div class="cms-login__brand">
        <span>CT</span>
        <div>
          <strong>Calabanga Tourism</strong>
          <small>Staff Management System</small>
        </div>
      </div>

      <div class="cms-login__copy">
        <p>Tourism Staff CMS</p>
        <h1>Manage public tourism content with secure staff access.</h1>
        <span>Protected workspace for promotions, products, destinations, inquiries, and audit-ready operations.</span>
      </div>

      <div class="cms-login__assurance">
        <span><CmsIcon name="shield" /> Role-based permissions</span>
        <span><CmsIcon name="audit" /> Activity logging</span>
        <span><CmsIcon name="lock" /> Secure session</span>
      </div>
    </section>

    <section class="cms-login__panel" aria-labelledby="cms-login-title">
      <div class="cms-login__intro">
        <p>Welcome back</p>
        <h2 id="cms-login-title">{{ sessionNotice ? 'Sign in again to continue' : 'Sign in to continue' }}</h2>
      </div>

      <form class="cms-login__form" novalidate @submit.prevent="submitLogin">
        <div v-if="sessionNotice" class="cms-login__notice" role="status">
          <CmsIcon name="lock" />
          <span>{{ sessionNotice }}</span>
        </div>

        <div class="cms-field">
          <label for="cms-email">Username or email</label>
          <input
            id="cms-email"
            v-model="form.email"
            autocomplete="username"
            type="text"
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
            <button type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
              <CmsIcon :name="showPassword ? 'eyeOff' : 'eye'" />
              <span>{{ showPassword ? 'Hide' : 'Show' }}</span>
            </button>
          </div>
          <small v-if="passwordError" id="cms-password-error">{{ passwordError }}</small>
        </div>

        <div v-if="localError" class="cms-login__error" role="alert">
          <CmsIcon name="alert" />
          <span>{{ localError }}</span>
        </div>

        <button class="cms-login__submit" type="submit" :disabled="auth.isLoading">
          <span v-if="auth.isLoading" class="cms-login__spinner" aria-hidden="true"></span>
          {{ submitLabel }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.cms-login {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(360px, 440px);
  align-items: stretch;
  min-height: 100vh;
  padding: 32px;
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.12), transparent 34%),
    linear-gradient(160deg, #f8fafc 0%, #eef6f8 48%, #ecfdf5 100%);
}

.cms-login__brand-panel,
.cms-login__panel {
  border: 1px solid #d7e2ee;
  background: #fff;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.1);
}

.cms-login__brand-panel {
  display: flex;
  min-height: 620px;
  flex-direction: column;
  justify-content: space-between;
  padding: 34px;
  color: #fff;
  border-radius: 10px 0 0 10px;
  background:
    linear-gradient(180deg, rgba(12, 74, 110, 0.94), rgba(15, 118, 110, 0.92)),
    linear-gradient(135deg, #075985, #0f766e);
}

.cms-login__panel {
  display: grid;
  align-content: center;
  padding: 36px;
  border-left: 0;
  border-radius: 0 10px 10px 0;
}

.cms-login__brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cms-login__brand > span {
  display: grid;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  place-items: center;
  color: #0f766e;
  border-radius: 8px;
  background: #fff;
  font-weight: 900;
}

strong,
small,
label {
  display: block;
}

small {
  opacity: 0.78;
}

.cms-login__copy {
  max-width: 560px;
}

.cms-login__copy p,
.cms-login__intro p {
  margin: 0 0 10px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.cms-login__copy h1,
.cms-login__intro h2 {
  margin: 0;
  letter-spacing: 0;
}

.cms-login__copy h1 {
  font-size: 3.25rem;
  line-height: 1.04;
}

.cms-login__copy span {
  display: block;
  max-width: 520px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.65;
}

.cms-login__assurance {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.cms-login__assurance span {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.84rem;
  font-weight: 800;
}

.cms-login__assurance svg {
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
}

.cms-login__intro p {
  color: #0f766e;
}

.cms-login__intro h2 {
  color: #0f172a;
  font-size: 1.9rem;
}

.cms-login__form {
  display: grid;
  gap: 18px;
  margin-top: 28px;
}

.cms-field label {
  margin-bottom: 8px;
  color: #334155;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

input:focus {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

input[aria-invalid='true'] {
  border-color: #dc2626;
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
  border-radius: 8px;
  font-weight: 800;
}

.cms-password button {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  padding: 0 12px;
  color: #334155;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.cms-password button svg {
  width: 17px;
  height: 17px;
}

.cms-password button:focus-visible,
.cms-login__submit:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.18);
  outline-offset: 2px;
}

.cms-login__submit {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  color: #fff;
  border: 0;
  background: linear-gradient(135deg, #0284c7, #0f766e);
}

.cms-login__submit:disabled {
  opacity: 0.68;
  cursor: wait;
}

.cms-login__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 999px;
  animation: cms-login-spin 0.75s linear infinite;
}

.cms-login__error {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
}

.cms-login__notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
}

.cms-login__error svg {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
}

.cms-login__notice svg {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
}

@keyframes cms-login-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 920px) {
  .cms-login {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .cms-login__brand-panel {
    min-height: auto;
    gap: 34px;
    border-radius: 10px 10px 0 0;
  }

  .cms-login__panel {
    border-top: 0;
    border-left: 1px solid #d7e2ee;
    border-radius: 0 0 10px 10px;
  }
}

@media (max-width: 640px) {
  .cms-login {
    padding: 0;
  }

  .cms-login__brand-panel,
  .cms-login__panel {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .cms-login__brand-panel,
  .cms-login__panel {
    padding: 24px 18px;
  }

  .cms-login__copy h1 {
    font-size: 2rem;
  }

  .cms-login__assurance {
    grid-template-columns: 1fr;
  }

  .cms-password {
    grid-template-columns: 1fr;
  }
}
</style>
