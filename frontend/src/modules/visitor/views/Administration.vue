<template>
  <ManagementLayout title="Administration" subtitle="Manage system users, profile settings, and notifications">
    <div class="admin-tabs" aria-label="Administration sections">
      <button
        v-for="section in adminSections"
        :key="section.key"
        class="admin-tab"
        :class="{ active: activeAdminSection === section.key }"
        type="button"
        @click="activeAdminSection = section.key"
      >
        {{ section.label }}
      </button>
    </div>

    <p v-if="success" class="success-text">{{ success }}</p>
    <p v-if="error" class="error-text">{{ error }}</p>

    <section v-if="activeAdminSection === 'users'" id="system-users" class="panel admin-panel">
      <div class="section-header">
        <div>
          <h2>System Users</h2>
          <p>Manage system users and role-based access</p>
        </div>
        <button class="primary-button" type="button" @click="openCreate">+ Add User</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Assigned Resort/Establishment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.full_name }}</td>
              <td>{{ user.username }}</td>
              <td>{{ roleLabel(user.role) }}</td>
              <td>{{ user.assigned_establishment_name || user.assigned_resort_name || '-' }}</td>
              <td>
                <span class="status-pill" :class="userStatusClass(user)">
                  {{ isActive(user) ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="icon-button" type="button" @click="openEdit(user)">Edit</button>
                <button
                  class="icon-button"
                  type="button"
                  :class="{ 'danger-soft': isActive(user) }"
                  @click="toggleUserStatus(user)"
                >
                  {{ isActive(user) ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="7">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeAdminSection === 'settings'" id="system-settings" class="panel admin-panel">
      <div class="section-header">
        <div>
          <h2>System/Profile Settings</h2>
          <p>Maintain office information and administrator profile details</p>
        </div>
      </div>

      <div class="settings-grid">
        <article class="settings-card">
          <h3>System Information</h3>
          <div class="form-grid compact-form">
            <label>
              System Name
              <input v-model="settings.systemName" />
            </label>
            <label>
              Contact Email
              <input v-model="settings.contactEmail" type="email" />
            </label>
            <label>
              Contact Phone
              <input v-model="settings.contactPhone" />
            </label>
            <label>
              Office Hours
              <input v-model="settings.officeHours" />
            </label>
          </div>
          <button class="primary-button compact-button" type="button" @click="saveSettings">
            Save Settings
          </button>
        </article>

        <article class="settings-card">
          <h3>Profile Settings</h3>
          <div class="form-grid compact-form">
            <label>
              Full Name
              <input v-model="profile.fullName" />
            </label>
            <label>
              Email Address
              <input v-model="profile.email" type="email" />
            </label>
            <label>
              Role
              <input :value="roleLabel(auth.user?.role)" disabled />
            </label>
          </div>
          <button class="primary-button compact-button" type="button" @click="saveProfile">
            Save Profile
          </button>
        </article>

        <article class="settings-card">
          <h3>Change Password</h3>
          <div class="form-grid compact-form">
            <label>
              Current Password
              <input v-model="passwordForm.current" type="password" />
            </label>
            <label>
              New Password
              <input v-model="passwordForm.next" type="password" />
            </label>
            <label>
              Confirm New Password
              <input v-model="passwordForm.confirm" type="password" />
            </label>
          </div>
          <button class="primary-button compact-button" type="button" @click="savePassword">
            Change Password
          </button>
        </article>
      </div>
    </section>

    <section v-if="activeAdminSection === 'notifications'" id="notification-settings" class="panel admin-panel">
      <div class="section-header">
        <div>
          <h2>Notification Settings</h2>
          <p>Manage email alerts and report notifications</p>
        </div>
      </div>

      <div class="notification-list">
        <label class="toggle-row">
          <span>
            <strong>Email Notifications</strong>
            <small>Receive system notifications via email</small>
          </span>
          <input v-model="notifications.email" type="checkbox" />
        </label>
        <label class="toggle-row">
          <span>
            <strong>Inquiry Alerts</strong>
            <small>Get notified about newly submitted public inquiries</small>
          </span>
          <input v-model="notifications.inquiries" type="checkbox" />
        </label>
        <label class="toggle-row">
          <span>
            <strong>Report Summaries</strong>
            <small>Receive scheduled report summaries</small>
          </span>
          <input v-model="notifications.reports" type="checkbox" />
        </label>
      </div>
      <button class="primary-button compact-button" type="button" @click="saveNotifications">
        Save Preferences
      </button>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal-card" @submit.prevent="saveUser">
        <h2>{{ editingUser ? 'Edit User' : 'Add User' }}</h2>
        <div class="form-grid">
          <label>
            Full Name
            <input v-model="form.full_name" required />
          </label>
          <label>
            Username
            <input v-model="form.username" required />
          </label>
          <label v-if="!editingUser">
            Password
            <input v-model="form.password" required type="password" />
          </label>
          <label>
            Role
            <select v-model="form.role" required>
              <option value="admin">System Administrator</option>
              <option value="tourism_staff">Tourism Staff</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </label>
          <label v-if="form.role === 'receptionist'">
            Assigned Resort/Establishment
            <select v-model="form.assigned_establishment_id" required>
              <option value="">Select establishment</option>
              <option v-for="item in establishments" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </label>
          <label>
            Status
            <select v-model="form.status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <p v-if="modalError" class="error-text">{{ modalError }}</p>
        <div class="modal-actions">
          <button class="secondary-button" type="button" @click="closeModal">Cancel</button>
          <button class="primary-button" type="submit">
            {{ editingUser ? 'Save Changes' : 'Add User' }}
          </button>
        </div>
      </form>
    </div>
  </ManagementLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import visitorApi from '../services/visitorApi'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const users = ref([])
const establishments = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const modalError = ref('')
const showModal = ref(false)
const editingUser = ref(null)
const activeAdminSection = ref('users')

const adminSections = [
  { key: 'users', label: 'System Users' },
  { key: 'settings', label: 'System/Profile Settings' },
  { key: 'notifications', label: 'Notification Settings' },
]

const form = reactive({
  full_name: '',
  username: '',
  password: '',
  role: 'tourism_staff',
  assigned_establishment_id: '',
  status: 'active',
})

const settings = reactive({
  systemName: 'Calabanga Tourism Management System',
  contactEmail: 'tourism@calabanga.gov.ph',
  contactPhone: '(054) 123-4567',
  officeHours: 'Monday to Friday, 8:00 AM - 5:00 PM',
})

const profile = reactive({
  fullName: auth.user?.full_name || 'Admin User',
  email: auth.user?.email || 'admin@calabanga.gov.ph',
})

const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})

const notifications = reactive({
  email: true,
  inquiries: true,
  reports: false,
})

function roleLabel(role) {
  if (role === 'admin') return 'System Administrator'
  if (role === 'tourism_staff') return 'Tourism Staff'
  if (role === 'receptionist') return 'Receptionist'
  return role || '-'
}

function isActive(user) {
  return user.status !== 'inactive' && Number(user.is_active ?? 1) !== 0
}

function userStatusClass(user) {
  return isActive(user) ? 'active-status' : 'inactive-status'
}

function showSuccess(message) {
  success.value = message
  window.setTimeout(() => {
    if (success.value === message) success.value = ''
  }, 2500)
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [userRows, establishmentRows] = await Promise.all([
      visitorApi.getUsers(),
      visitorApi.getEstablishments(),
    ])
    users.value = Array.isArray(userRows) ? userRows : userRows.rows || []
    establishments.value = Array.isArray(establishmentRows) ? establishmentRows : establishmentRows.rows || []
  } catch (err) {
    error.value = err.message || 'Unable to load administration data.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    full_name: '',
    username: '',
    password: '',
    role: 'tourism_staff',
    assigned_establishment_id: '',
    status: 'active',
  })
}

function openCreate() {
  editingUser.value = null
  modalError.value = ''
  resetForm()
  showModal.value = true
}

function openEdit(user) {
  editingUser.value = user
  modalError.value = ''
  Object.assign(form, {
    full_name: user.full_name || '',
    username: user.username || '',
    password: '',
    role: user.role || 'tourism_staff',
    assigned_establishment_id: user.assigned_establishment_id || '',
    status: isActive(user) ? 'active' : 'inactive',
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveUser() {
  modalError.value = ''
  try {
    const isUserActive = form.status === 'active'
    const payload = {
      full_name: form.full_name,
      username: form.username,
      role: form.role,
      assigned_establishment_id: form.role === 'receptionist' ? form.assigned_establishment_id : null,
      status: form.status,
      is_active: isUserActive ? 1 : 0,
    }
    if (!editingUser.value || form.password) payload.password = form.password

    if (editingUser.value) {
      await visitorApi.updateUser(editingUser.value.id, payload)
    } else {
      await visitorApi.createUser(payload)
    }
    closeModal()
    await loadData()
    showSuccess(editingUser.value ? 'User updated.' : 'User created.')
  } catch (err) {
    modalError.value = err.message || 'Unable to save user.'
  }
}

async function toggleUserStatus(user) {
  const nextActive = !isActive(user)
  const action = nextActive ? 'activate' : 'deactivate'
  if (!confirm(`Are you sure you want to ${action} ${user.full_name || user.username}?`)) return

  try {
    await visitorApi.updateUser(user.id, {
      status: nextActive ? 'active' : 'inactive',
      is_active: nextActive ? 1 : 0,
    })
    await loadData()
    showSuccess(nextActive ? 'User activated.' : 'User deactivated.')
  } catch (err) {
    error.value = err.message || `Unable to ${action} user.`
  }
}

function saveSettings() {
  showSuccess('System settings saved for this session.')
}

function saveProfile() {
  showSuccess('Profile settings saved for this session.')
}

function savePassword() {
  if (passwordForm.next && passwordForm.next !== passwordForm.confirm) {
    error.value = 'New password and confirmation do not match.'
    return
  }
  Object.assign(passwordForm, { current: '', next: '', confirm: '' })
  showSuccess('Password settings saved for this session.')
}

function saveNotifications() {
  showSuccess('Notification preferences saved for this session.')
}

onMounted(loadData)
</script>

<style scoped>
.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.admin-tab {
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  padding: 0.75rem 0.95rem;
  color: #334155;
  font-weight: 800;
  border-radius: 10px 10px 0 0;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.admin-tab:hover,
.admin-tab:focus-visible {
  background: rgba(23, 73, 51, 0.08);
  border-color: #174933;
  color: #174933;
  outline: none;
}

.admin-tab.active {
  background: #020617;
  border-color: #174933;
  color: #fff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
}

.admin-panel {
  scroll-margin-top: 1rem;
}

.active-status {
  background: rgba(23, 73, 51, 0.12);
  color: #174933;
}

.inactive-status {
  background: #fee2e2;
  color: #991b1b;
}

.danger-soft {
  color: #991b1b;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.settings-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  background: #fff;
}

.settings-card h3 {
  margin: 0 0 1rem;
}

.settings-card:last-child {
  grid-column: 1 / -1;
}

.compact-form {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-button {
  width: auto !important;
  max-width: none !important;
  margin-top: 1rem;
}

.notification-list {
  display: grid;
  gap: 0;
  border-top: 1px solid #e5e7eb;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
}

.toggle-row span {
  display: grid;
  gap: 0.25rem;
}

.toggle-row small {
  color: #64748b;
}

.toggle-row input {
  width: 42px;
  height: 22px;
  accent-color: #174933;
}

@media (max-width: 900px) {
  .settings-grid,
  .compact-form {
    grid-template-columns: 1fr;
  }
}
</style>
