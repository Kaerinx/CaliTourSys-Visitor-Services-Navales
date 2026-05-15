<template>
  <ManagementLayout
    title="Resort / Establishment Management"
    subtitle="Manage resorts, establishments, and view visitor statistics"
  >
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Resort & Establishment Management</h2>
          <p>Add, edit, or manage resorts and establishments</p>
        </div>
        <button class="primary-button" type="button" @click="openCreate">+ Add Resort/Establishment</button>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Address</th>
              <th>Contact Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in establishments" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td><span class="type-pill">{{ item.type }}</span></td>
              <td>{{ item.address || '-' }}</td>
              <td>{{ item.contact_number || '-' }}</td>
              <td><span class="status-pill">{{ item.is_active === 0 ? 'Inactive' : 'Active' }}</span></td>
              <td>
                <button class="icon-button" type="button" @click="openEdit(item)">Edit</button>
                <button class="icon-button" type="button" @click="deactivate(item)">Deactivate</button>
              </td>
            </tr>
            <tr v-if="!loading && establishments.length === 0">
              <td colspan="7">No establishments found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal-card" @submit.prevent="saveEstablishment">
        <h2>{{ editingItem ? 'Edit Resort/Establishment' : 'Add Resort/Establishment' }}</h2>
        <div class="form-grid">
          <label>
            Name
            <input v-model="form.name" required />
          </label>
          <label>
            Type
            <select v-model="form.type" required>
              <option value="resort">Resort</option>
              <option value="museum">Museum</option>
              <option value="tourist_spot">Tourist Spot</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Address
            <input v-model="form.address" required />
          </label>
          <label>
            Contact Number
            <input v-model="form.contact_number" required />
          </label>
          <label>
            Email Address
            <input v-model="form.email" type="email" />
          </label>
          <label>
            Status
            <select v-model.number="form.is_active">
              <option :value="1">Active</option>
              <option :value="0">Inactive</option>
            </select>
          </label>
          <label class="full-span">
            Description
            <textarea v-model="form.description" rows="3" />
          </label>
        </div>
        <p v-if="modalError" class="error-text">{{ modalError }}</p>
        <div class="modal-actions">
          <button class="secondary-button" type="button" @click="closeModal">Cancel</button>
          <button class="primary-button" type="submit">{{ editingItem ? 'Save Changes' : 'Add Establishment' }}</button>
        </div>
      </form>
    </div>
  </ManagementLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import visitorApi from '../services/visitorApi'

const establishments = ref([])
const loading = ref(false)
const error = ref('')
const modalError = ref('')
const showModal = ref(false)
const editingItem = ref(null)

const form = reactive({
  name: '',
  type: 'resort',
  address: '',
  contact_number: '',
  email: '',
  description: '',
  is_active: 1,
})

async function loadEstablishments() {
  loading.value = true
  error.value = ''
  try {
    const rows = await visitorApi.getEstablishments()
    establishments.value = Array.isArray(rows) ? rows : rows.rows || []
  } catch (err) {
    error.value = err.message || 'Unable to load establishments.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    name: '',
    type: 'resort',
    address: '',
    contact_number: '',
    email: '',
    description: '',
    is_active: 1,
  })
}

function openCreate() {
  editingItem.value = null
  modalError.value = ''
  resetForm()
  showModal.value = true
}

function openEdit(item) {
  editingItem.value = item
  modalError.value = ''
  Object.assign(form, {
    name: item.name || '',
    type: item.type || 'resort',
    address: item.address || '',
    contact_number: item.contact_number || '',
    email: item.email || '',
    description: item.description || '',
    is_active: item.is_active === 0 ? 0 : 1,
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveEstablishment() {
  modalError.value = ''
  try {
    if (editingItem.value) {
      await visitorApi.updateEstablishment(editingItem.value.id, { ...form })
    } else {
      await visitorApi.createEstablishment({ ...form })
    }
    closeModal()
    await loadEstablishments()
  } catch (err) {
    modalError.value = err.message || 'Unable to save establishment.'
  }
}

async function deactivate(item) {
  if (!confirm(`Deactivate ${item.name}?`)) return
  try {
    await visitorApi.deleteEstablishment(item.id)
    await loadEstablishments()
  } catch (err) {
    error.value = err.message || 'Unable to deactivate establishment.'
  }
}

onMounted(loadEstablishments)
</script>
