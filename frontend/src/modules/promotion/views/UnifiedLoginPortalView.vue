<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import PromotionFooter from '../components/PromotionFooter.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'
import { useCmsAuthStore } from '@/modules/cms/stores/authStore'
import logo from '@/assets/brand/love-calabanga-logo.png'

const route = useRoute()
const router = useRouter()
const touristAuth = useTouristAuthStore()
const cmsAuth = useCmsAuthStore()

const loginOptions = [
  {
    value: 'tourist',
    label: 'Tourist',
    note: 'Access your package requests, payment proof, and trip status.',
  },
  {
    value: 'business',
    label: 'Business Owner / Accreditation Applicant',
    note: 'Accreditation applicant accounts will be added in a later phase.',
  },
  {
    value: 'staff',
    label: 'Staff / Administrator',
    note: 'Secure CMS access for tourism staff and administrators.',
  },
]

const selectedLoginAs = ref(normalizeLoginAs(route.query.as))
const showPassword = ref(false)
const submitted = ref(false)
const localError = ref('')
const form = reactive({
  fullName: '',
  identifier: '',
  phoneNumber: '',
  password: '',
})

const selectedOption = computed(
  () => loginOptions.find((option) => option.value === selectedLoginAs.value) || loginOptions[0],
)
const isTourist = computed(() => selectedLoginAs.value === 'tourist')
const isBusiness = computed(() => selectedLoginAs.value === 'business')
const isStaff = computed(() => selectedLoginAs.value === 'staff')
const isTouristRegister = computed(() => isTourist.value && normalizeMode(route.query.mode) === 'register')
const isLoading = computed(() => (isStaff.value ? cmsAuth.isLoading : touristAuth.isLoading))
const identifierLabel = computed(() => (isStaff.value ? 'Username or email' : 'Email address'))
const identifierAutocomplete = computed(() => (isStaff.value ? 'username' : 'email'))
const identifierType = computed(() => (isStaff.value ? 'text' : 'email'))
const passwordAutocomplete = computed(() => (isTouristRegister.value ? 'new-password' : 'current-password'))
const formTitle = computed(() => {
  if (isTouristRegister.value) return 'Create tourist account'
  return 'Sign in to continue'
})
const portalEyebrow = computed(() => {
  if (isStaff.value) return 'Staff management system'
  if (isBusiness.value) return 'Accreditation portal'
  return 'Tourist account portal'
})
const submitLabel = computed(() => {
  if (isLoading.value) return isTouristRegister.value ? 'Creating account...' : 'Signing in...'
  if (isBusiness.value) return 'Coming soon'
  return isTouristRegister.value ? 'Create account' : 'Sign in'
})
const registerTo = computed(() => ({
  path: '/login',
  query: {
    as: 'tourist',
    mode: 'register',
    ...(typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {}),
  },
}))
const touristSignInTo = computed(() => ({
  path: '/login',
  query: {
    as: 'tourist',
    ...(typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {}),
  },
}))

const fullNameError = computed(() => {
  if (!submitted.value || !isTouristRegister.value) return ''
  if (!form.fullName.trim()) return 'Full name is required.'
  return ''
})

const identifierError = computed(() => {
  if (!submitted.value || isBusiness.value) return ''
  if (!form.identifier.trim()) return `${identifierLabel.value} is required.`
  if (isTourist.value && !/^\S+@\S+\.\S+$/.test(form.identifier.trim())) {
    return 'Enter a valid email address.'
  }
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value || isBusiness.value) return ''
  if (!form.password) return 'Password is required.'
  return ''
})

const displayError = computed(() => localError.value || (isStaff.value ? cmsAuth.error : touristAuth.error))

watch(
  () => route.query.as,
  (value) => {
    selectedLoginAs.value = normalizeLoginAs(value)
  },
)

watch(selectedLoginAs, () => {
  submitted.value = false
  localError.value = ''
  touristAuth.error = ''
  cmsAuth.error = ''
})

async function submitLogin() {
  submitted.value = true
  localError.value = ''
  touristAuth.error = ''
  cmsAuth.error = ''

  if (isBusiness.value) {
    localError.value = 'Business owner portal coming soon.'
    return
  }

  if (fullNameError.value || identifierError.value || passwordError.value) return

  try {
    if (isStaff.value) {
      const user = await cmsAuth.login(form.identifier.trim(), form.password)
      router.replace(resolveStaffRedirect(user))
      return
    }

    const touristPayload = {
      fullName: form.fullName.trim(),
      email: form.identifier.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
    }

    if (isTouristRegister.value) await touristAuth.register(touristPayload)
    else await touristAuth.login({ email: touristPayload.email, password: touristPayload.password })

    router.replace(resolveTouristRedirect())
  } catch {
    localError.value = isStaff.value
      ? cmsAuth.error || 'Unable to sign in as staff.'
      : touristAuth.error || 'Unable to continue as tourist.'
  }
}

function normalizeLoginAs(value) {
  const raw = Array.isArray(value) ? value[0] : value
  if (['tourist', 'business', 'staff'].includes(raw)) return raw
  return 'tourist'
}

function normalizeMode(value) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'register' ? 'register' : 'login'
}

function resolveTouristRedirect() {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  if (isAllowedTouristRedirect(redirect)) return redirect
  return '/tourist/dashboard'
}

function isAllowedTouristRedirect(redirect) {
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//')) return false

  const path = redirect.split(/[?#]/, 1)[0]
  if (path.startsWith('/tourist/') && !['/tourist/login', '/tourist/register'].includes(path)) return true

  return /^\/packages\/[^/]+\/(booking-info|payment)$/.test(path)
}

function resolveStaffRedirect(user) {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  const visitorDashboard = visitorDashboardForUser(user || cmsAuth.currentUser)
  const isReceptionist = visitorDashboard === '/cms/visitor/receptionist'

  if (typeof redirect === 'string' && redirect === '/cms/visitor') {
    return visitorDashboard || '/cms/dashboard'
  }

  if (typeof redirect === 'string' && redirect.startsWith('/cms') && redirect !== '/cms/login') {
    return redirect
  }

  if (typeof redirect === 'string' && (redirect.startsWith('/product') || redirect === '/dashboard')) {
    return redirect
  }

  if (isReceptionist) return visitorDashboard

  return '/cms/dashboard'
}

function visitorDashboardForUser(user = {}) {
  const roles = [user.role, ...(Array.isArray(user.roles) ? user.roles : [])]
    .filter(Boolean)
    .map((role) => String(role).trim().toLowerCase().replace(/[\s-]+/g, '_'))

  if (roles.some((role) => ['admin', 'system_admin', 'system_administrator'].includes(role))) return '/cms/visitor/admin'
  if (roles.some((role) => ['receptionist', 'receptionist_desk', 'front_desk', 'frontdesk', 'visitor_receptionist'].includes(role))) {
    return '/cms/visitor/receptionist'
  }
  if (roles.some((role) => ['tourism_staff', 'tourism_officer', 'content_editor'].includes(role))) {
    return '/cms/visitor/staff'
  }

  return ''
}
</script>

<template>
  <div class="login-portal">
    <PromotionNavbar />

    <main class="login-portal__shell">
      <section class="portal-card" aria-labelledby="portal-login-title">
        <div class="portal-card__story">
          <RouterLink to="/" class="portal-brand" aria-label="Love Calabanga home">
            <img :src="logo" alt="Love Calabanga" />
            <span>CaliTourSys</span>
          </RouterLink>

          <div class="portal-card__copy">
            <p>{{ portalEyebrow }}</p>
            <h1 id="portal-login-title">Please sign in to your account to proceed.</h1>
            <span>
              Choose the account type that matches your role. CaliTourSys will use the correct secure login flow for that account.
            </span>
          </div>

          <div class="portal-card__features" aria-label="Portal features">
            <span>Tourist trips</span>
            <span>Accreditation access</span>
            <span>Staff CMS</span>
          </div>
        </div>

        <form class="portal-form" novalidate @submit.prevent="submitLogin">
          <div class="portal-form__intro">
            <p>Welcome back</p>
            <h2>{{ formTitle }}</h2>
          </div>

          <label class="field">
            <span>Login as</span>
            <select v-model="selectedLoginAs">
              <option v-for="option in loginOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <p class="portal-note" :class="{ 'portal-note--soon': isBusiness }">
            {{ selectedOption.note }}
          </p>

          <fieldset :disabled="isBusiness || isLoading" class="portal-fieldset">
            <label v-if="isTouristRegister" class="field">
              <span>Full name</span>
              <input
                v-model.trim="form.fullName"
                autocomplete="name"
                type="text"
                :aria-invalid="Boolean(fullNameError)"
                :aria-describedby="fullNameError ? 'portal-full-name-error' : undefined"
              />
              <small v-if="fullNameError" id="portal-full-name-error">{{ fullNameError }}</small>
            </label>

            <label class="field">
              <span>{{ identifierLabel }}</span>
              <input
                v-model.trim="form.identifier"
                :autocomplete="identifierAutocomplete"
                :type="identifierType"
                :aria-invalid="Boolean(identifierError)"
                :aria-describedby="identifierError ? 'portal-identifier-error' : undefined"
              />
              <small v-if="identifierError" id="portal-identifier-error">{{ identifierError }}</small>
            </label>

            <label v-if="isTouristRegister" class="field">
              <span>Phone number</span>
              <input v-model.trim="form.phoneNumber" autocomplete="tel" type="tel" />
            </label>

            <label class="field">
              <span>Password</span>
              <div class="password-field">
                <input
                  v-model="form.password"
                  :autocomplete="passwordAutocomplete"
                  :type="showPassword ? 'text' : 'password'"
                  :aria-invalid="Boolean(passwordError)"
                  :aria-describedby="passwordError ? 'portal-password-error' : undefined"
                />
                <button type="button" @click="showPassword = !showPassword">
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
              <small v-if="passwordError" id="portal-password-error">{{ passwordError }}</small>
              <small v-else-if="isTouristRegister" class="field-help">
                Use at least 12 characters with uppercase, lowercase, number, and symbol.
              </small>
            </label>
          </fieldset>

          <div class="portal-form__row">
            <RouterLink v-if="isTourist && !isTouristRegister" :to="registerTo">Create tourist account</RouterLink>
            <RouterLink v-else-if="isTouristRegister" :to="touristSignInTo">Already have an account? Sign in</RouterLink>
            <span v-else>Account access is managed by your office.</span>
            <span>Forgot password?</span>
          </div>

          <p v-if="displayError" class="portal-error" role="alert">{{ displayError }}</p>

          <button class="portal-submit" type="submit" :disabled="isLoading || isBusiness">
            {{ submitLabel }}
          </button>
        </form>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.login-portal {
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(216, 155, 53, 0.12), transparent 30%),
    linear-gradient(160deg, #f7f4ee 0%, #eff7f2 54%, #f8fbfa 100%);
  color: #14261f;
  font-family: Inter, system-ui, sans-serif;
}

.login-portal__shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
  padding: 112px 0 72px;
}

.portal-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
  overflow: hidden;
  min-height: 650px;
  border: 1px solid #dfe8e1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(21, 37, 31, 0.12);
}

.portal-card__story {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  color: #ffffff;
  background:
    linear-gradient(180deg, rgba(21, 71, 60, 0.94), rgba(25, 119, 98, 0.9)),
    url('https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg');
  background-position: center;
  background-size: cover;
}

.portal-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
}

.portal-brand img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
  padding: 8px;
}

.portal-card__copy {
  max-width: 660px;
}

.portal-card__copy p,
.portal-form__intro p {
  margin: 0;
  color: #d8f3dc;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portal-card__copy h1 {
  margin: 14px 0 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: clamp(40px, 5vw, 68px);
  line-height: 1.08;
}

.portal-card__copy span {
  display: block;
  max-width: 560px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 17px;
  line-height: 1.65;
}

.portal-card__features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.portal-card__features span {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
  font-weight: 800;
}

.portal-form {
  display: grid;
  align-content: center;
  gap: 18px;
  padding: 42px;
}

.portal-form__intro h2 {
  margin: 12px 0 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.1;
}

.field,
.portal-fieldset {
  display: grid;
  gap: 8px;
}

.portal-fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.field span {
  color: #3f4f49;
  font-size: 13px;
  font-weight: 900;
}

input,
select {
  min-height: 48px;
  width: 100%;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
}

input {
  padding: 10px 12px;
}

select {
  padding: 10px 40px 10px 12px;
}

input:focus,
select:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

input[aria-invalid='true'] {
  border-color: #b42318;
}

.password-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
}

.password-field:focus-within {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

.password-field input {
  border: 0;
  border-radius: 0;
}

.password-field input:focus {
  outline: 0;
}

.password-field button {
  min-width: 76px;
  border: 0;
  border-left: 1px solid #dfe8e1;
  background: #f7faf8;
  color: #1b4332;
  cursor: pointer;
  font-weight: 900;
}

.portal-note,
.portal-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.portal-note {
  background: #eff7f2;
  color: #3f4f49;
}

.portal-note--soon {
  background: #fff4df;
  color: #754b11;
}

small {
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.field-help {
  color: #66746e;
}

.portal-form__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #5c6a64;
  font-size: 13px;
  font-weight: 800;
}

.portal-form__row a {
  color: #1b4332;
}

.portal-error {
  background: #fdecea;
  color: #9f2d20;
  font-weight: 800;
}

.portal-submit {
  min-height: 50px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #2f8f83, #1b4332);
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;
  box-shadow: 0 14px 24px rgba(27, 67, 50, 0.16);
}

.portal-submit:disabled {
  cursor: not-allowed;
  opacity: 0.62;
  box-shadow: none;
}

@media (max-width: 900px) {
  .login-portal__shell {
    width: min(100% - 28px, 640px);
    padding-top: 92px;
  }

  .portal-card {
    grid-template-columns: 1fr;
  }

  .portal-card__story {
    min-height: 360px;
    padding: 28px;
  }

  .portal-card__copy h1 {
    font-size: 38px;
  }

  .portal-card__features {
    grid-template-columns: 1fr;
  }

  .portal-form {
    padding: 28px;
  }
}

@media (max-width: 560px) {
  .login-portal__shell {
    width: 100%;
    padding: 80px 0 48px;
  }

  .portal-card {
    min-height: 0;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .portal-card__story,
  .portal-form {
    padding: 22px;
  }

  .portal-card__copy h1 {
    font-size: 32px;
  }

  .portal-form__row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
