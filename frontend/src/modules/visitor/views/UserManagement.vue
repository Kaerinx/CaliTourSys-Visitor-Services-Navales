<template>
  <ManagementLayout title="User Management" subtitle="Manage system users and role-based access">
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>System Users</h2>
          <p>View and manage all system users</p>
        </div>
        <button class="primary-button" type="button" @click="openCreate">+ Add User</button>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>
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
              <th class="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.full_name }}</td>
              <td>{{ user.username }}</td>
              <td>{{ roleLabel(user.role) }}</td>
              <td>{{ user.assigned_establishment_name || user.assigned_resort_name || '-' }}</td>
              <td><span class="status-pill">{{ formatStatus(user.status || 'active') }}</span></td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="icon-button btn-edit" type="button" @click="openEdit(user)">Edit</button>
                  <button class="icon-button btn-danger" type="button" @click="deactivate(user)">Deactivate</button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="7">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
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
              <option v-for="item in establishments" :key="item.id" :value="item.id">{{ item.name }}</option>
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
          <button class="primary-button" type="submit">{{ editingUser ? 'Save Changes' : 'Add User' }}</button>
        </div>
      </form>
    </div>
  </ManagementLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import visitorApi from '../services/visitorApi'
import { formatStatus } from '../utils/format'

const users = ref([])
const establishments = ref([])
const loading = ref(false)
const error = ref('')
const modalError = ref('')
const showModal = ref(false)
const editingUser = ref(null)

const form = reactive({
  full_name: '',
  username: '',
  password: '',
  role: 'tourism_staff',
  assigned_establishment_id: '',
  status: 'active',
})

function roleLabel(role) {
  if (role === 'admin') return 'System Administrator'
  if (role === 'tourism_staff') return 'Tourism Staff'
  if (role === 'receptionist') return 'Receptionist'
  return role || '-'
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
    error.value = err.message || 'Unable to load users.'
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
    status: user.status || 'active',
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveUser() {
  modalError.value = ''
  try {
    const payload = {
      full_name: form.full_name,
      username: form.username,
      role: form.role,
      assigned_establishment_id: form.role === 'receptionist' ? form.assigned_establishment_id : null,
      status: form.status,
    }
    if (!editingUser.value || form.password) payload.password = form.password

    if (editingUser.value) {
      await visitorApi.updateUser(editingUser.value.id, payload)
    } else {
      await visitorApi.createUser(payload)
    }
    closeModal()
    await loadData()
  } catch (err) {
    modalError.value = err.message || 'Unable to save user.'
  }
}

async function deactivate(user) {
  if (!confirm(`Deactivate ${user.full_name || user.username}?`)) return
  try {
    await visitorApi.deactivateUser(user.id)
    await loadData()
  } catch (err) {
    error.value = err.message || 'Unable to deactivate user.'
  }
}

onMounted(loadData)
</script>
