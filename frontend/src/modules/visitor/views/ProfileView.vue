<template>
  <ManagementLayout :nav="nav">
    <section class="page-heading">
      <h1>Profile</h1>
      <p>{{ pageSubtitle }}</p>
    </section>

    <div v-if="profileError" class="alert alert-error">{{ profileError }}</div>
    <div v-if="profileSuccess" class="alert alert-success">{{ profileSuccess }}</div>

    <section class="profile-summary panel">
      <div class="summary-main">
        <div class="avatar-mark">{{ initials }}</div>
        <div>
          <p class="eyebrow">Profile Summary</p>
          <h2>{{ user.full_name || user.username || 'Staff Account' }}</h2>
          <p class="muted">{{ roleLabel }}</p>
        </div>
      </div>

      <div class="summary-grid">
        <div>
          <span>Username</span>
          <strong>{{ user.username || '-' }}</strong>
        </div>
        <div>
          <span>Email Address</span>
          <strong>{{ user.email || '-' }}</strong>
        </div>
        <div>
          <span>Account Status</span>
          <strong :class="['status-badge', accountStatusClass]">{{ accountStatusLabel }}</strong>
        </div>
        <div v-if="isReceptionist">
          <span>Assigned Establishment</span>
          <strong>{{ assignedName }}</strong>
        </div>
        <div v-else>
          <span>Access Scope</span>
          <strong>Monitoring and Reports</strong>
        </div>
      </div>
    </section>

    <section class="profile-grid">
      <form class="profile-card panel" @submit.prevent="saveProfile">
        <div class="card-title">
          <h2>Account Information</h2>
          <p>Update editable account contact details.</p>
        </div>

        <div class="form-grid">
          <label>
            Full Name
            <input v-model="profileForm.full_name" type="text" autocomplete="name" />
          </label>
          <label>
            Username
            <input v-model="profileForm.username" type="text" readonly />
          </label>
          <label>
            Email Address
            <input v-model="profileForm.email" type="email" autocomplete="email" />
          </label>
          <label>
            Contact Number
            <input v-model="profileForm.contact_number" type="text" autocomplete="tel" />
          </label>
          <label>
            Role
            <input :value="roleLabel" type="text" readonly />
          </label>
          <label>
            Account Status
            <input :value="accountStatusLabel" type="text" readonly />
          </label>
        </div>

        <button class="primary-button compact-button" type="submit" :disabled="savingProfile">
          {{ savingProfile ? 'Saving...' : 'Save Profile Changes' }}
        </button>
      </form>

      <section class="profile-card panel establishment-card">
        <div class="card-title">
          <h2>{{ isReceptionist ? 'Assigned Establishment' : 'Role and Access Information' }}</h2>
          <p>{{ isReceptionist ? 'Your records are scoped to this assigned location.' : 'Your access is limited to staff monitoring workflows.' }}</p>
        </div>

        <div v-if="isReceptionist && assignedEstablishment" class="readonly-list">
          <div>
            <span>Establishment Name</span>
            <strong>{{ assignedEstablishment.name || assignedName }}</strong>
          </div>
          <div>
            <span>Establishment Type</span>
            <strong>{{ formatText(assignedEstablishment.type) }}</strong>
          </div>
          <div>
            <span>Address or Location</span>
            <strong>{{ assignedEstablishment.address || assignedEstablishment.location || '-' }}</strong>
          </div>
          <div>
            <span>Contact Number</span>
            <strong>{{ assignedEstablishment.contact_number || '-' }}</strong>
          </div>
        </div>
        <div v-else-if="isReceptionist" class="empty-state">Assigned establishment information is currently unavailable.</div>
        <div v-else class="readonly-list">
          <div v-for="item in accessItems" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>
    </section>

    <form class="profile-card panel password-card" @submit.prevent="changePassword">
      <div class="card-title">
        <h2>Change Password</h2>
        <p>Use a secure password for your account.</p>
      </div>

      <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>
      <div v-if="passwordSuccess" class="alert alert-success">{{ passwordSuccess }}</div>

      <div class="form-grid password-grid">
        <label>
          Current Password
          <input v-model="passwordForm.current_password" type="password" autocomplete="current-password" />
        </label>
        <label>
          New Password
          <input v-model="passwordForm.new_password" type="password" autocomplete="new-password" />
        </label>
        <label>
          Confirm New Password
          <input v-model="passwordForm.confirm_password" type="password" autocomplete="new-password" />
        </label>
      </div>

      <button class="primary-button compact-button" type="submit" :disabled="changingPassword">
        {{ changingPassword ? 'Changing...' : 'Change Password' }}
      </button>
    </form>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import { adminNav, receptionistNav, tourismNav } from './nav'
import { useAuthStore } from '../stores/authStore'
import { visitorApi } from '../services/visitorApi'

const auth = useAuthStore()

const nav = computed(() => {
  if (auth.user?.role === 'admin') return adminNav
  if (auth.user?.role === 'receptionist') return receptionistNav
  return tourismNav
})

const user = computed(() => auth.user || {})
const establishments = ref([])
const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const savingProfile = ref(false)
const changingPassword = ref(false)

const profileForm = reactive({
  full_name: '',
  username: '',
  email: '',
  contact_number: '',
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const roleMap = {
  admin: 'System Administrator',
  receptionist: 'Receptionist Desk',
  tourism_staff: 'Tourism Staff',
  lgu_official: 'LGU Official',
}

const roleLabel = computed(() => roleMap[user.value.role] || formatText(user.value.role) || '-')
const isReceptionist = computed(() => user.value.role === 'receptionist')
const pageSubtitle = computed(() =>
  isReceptionist.value
    ? 'Manage your receptionist account and assigned establishment details.'
    : 'Manage your tourism staff account and access details.',
)
const accountActive = computed(() => user.value.status !== 'inactive' && Number(user.value.is_active ?? 1) !== 0)
const accountStatusLabel = computed(() => (accountActive.value ? 'Active' : 'Inactive'))
const accountStatusClass = computed(() => (accountActive.value ? 'active' : 'inactive'))
const accessItems = computed(() => [
  { label: 'Role', value: roleLabel.value },
  { label: 'Account Status', value: accountStatusLabel.value },
  { label: 'Visitor Records', value: 'View and verify monitoring records' },
  { label: 'Museum Records', value: 'View and monitor museum records' },
  { label: 'Inquiries', value: 'Review inquiry status for email follow-up' },
  { label: 'Reports', value: 'View summaries, trends, and classification reports' },
])

const assignedId = computed(() => user.value.assigned_establishment_id || user.value.assigned_resort_id)
const assignedEstablishment = computed(() => {
  const found = establishments.value.find((item) => Number(item.id) === Number(assignedId.value))
  return found || user.value.assigned_establishment || null
})
const assignedName = computed(() => assignedEstablishment.value?.name || user.value.assigned_establishment_name || '-')
const initials = computed(() => {
  const source = user.value.full_name || user.value.username || 'Receptionist'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

function formatText(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function syncForm() {
  profileForm.full_name = user.value.full_name || ''
  profileForm.username = user.value.username || ''
  profileForm.email = user.value.email || user.value.email_address || ''
  profileForm.contact_number = user.value.contact_number || ''
}

async function loadEstablishment() {
  try {
    establishments.value = await visitorApi.getEstablishments()
  } catch {
    establishments.value = []
  }
}

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  savingProfile.value = true
  try {
    const response = await visitorApi.updateProfile({
      full_name: profileForm.full_name,
      email: profileForm.email,
      contact_number: profileForm.contact_number,
    })
    const nextUser = response?.user || response?.data?.user || response
    if (nextUser?.id) {
      auth.setSession(auth.token, { ...user.value, ...nextUser })
    }
    profileSuccess.value = 'Profile changes saved successfully.'
  } catch (error) {
    profileError.value = error.message || 'Unable to save profile changes.'
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
    passwordError.value = 'All password fields are required.'
    return
  }

  if (passwordForm.new_password.length < 6) {
    passwordError.value = 'New password must be at least 6 characters long.'
    return
  }

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    passwordError.value = 'New password and confirmation do not match.'
    return
  }

  changingPassword.value = true
  try {
    await visitorApi.changePassword({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    })
    passwordSuccess.value = 'Password changed successfully.'
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch (error) {
    passwordError.value = error.message || 'Unable to change password.'
  } finally {
    changingPassword.value = false
  }
}

watch(user, syncForm, { immediate: true })

onMounted(() => {
  syncForm()
  loadEstablishment()
})
</script>

<style scoped>
.page-heading {
  margin-bottom: 1.5rem;
}

.page-heading h1 {
  margin: 0;
  color: #020617;
  font-size: clamp(2rem, 3vw, 2.55rem);
}

.page-heading p,
.card-title p {
  margin: 0.35rem 0 0;
  color: #475569;
  font-weight: 400;
}

.profile-summary,
.profile-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

.profile-summary {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) 1.2fr;
  gap: 1.5rem;
  align-items: center;
  border-left: 5px solid #166534;
  margin-bottom: 1.5rem;
}

.summary-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-mark {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 18px;
  background: #dcfce7;
  color: #166534;
  font-size: 1.4rem;
  font-weight: 800;
}

.eyebrow {
  margin: 0 0 0.2rem;
  color: #166534;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.summary-main h2,
.card-title h2 {
  margin: 0;
  color: #020617;
  font-size: 1.35rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.summary-grid div,
.readonly-list div {
  display: grid;
  gap: 0.25rem;
}

.summary-grid span,
.readonly-list span {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
}

.summary-grid strong,
.readonly-list strong {
  color: #0f172a;
  font-weight: 600;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.profile-card {
  display: grid;
  gap: 1.25rem;
}

.establishment-card {
  align-content: start;
  border-top: 4px solid #bbf7d0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.password-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 0.4rem;
  color: #020617;
  font-weight: 700;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  font-weight: 400;
  padding: 0.85rem 1rem;
}

input::placeholder,
textarea::placeholder {
  color: #6b7280;
  font-weight: 400;
}

input[readonly],
input:disabled,
select:disabled,
textarea:disabled,
textarea[readonly] {
  color: #374151;
  font-weight: 400;
  background: #f1f5f9;
}

.readonly-list {
  display: grid;
  gap: 1rem;
}

.status-badge {
  width: fit-content;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.85rem;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #e5e7eb;
  color: #475569;
}

.compact-button {
  width: fit-content;
  min-width: 180px;
}

.alert {
  margin-bottom: 1rem;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  font-weight: 700;
}

.alert-success {
  border: 1px solid #bbf7d0;
  background: #dcfce7;
  color: #166534;
}

.alert-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.empty-state {
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  padding: 1rem;
}

@media (max-width: 1100px) {
  .profile-summary,
  .profile-grid,
  .password-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .summary-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .summary-main {
    align-items: flex-start;
  }
}
</style>
