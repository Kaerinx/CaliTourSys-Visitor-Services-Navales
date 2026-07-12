<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { businessAccountVerificationApi } from '../../services/businessAccountVerificationApi'

const users = ref([])
const isLoading = ref(false)
const error = ref('')
const notice = ref('')
const search = ref('')
const statusFilter = ref('pending_verification')
const busyUserId = ref('')

const statusOptions = [
  { value: 'pending_verification', label: 'Pending verification' },
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All business owners' },
]

const pendingCount = computed(() => users.value.filter((user) => user.status === 'pending_verification').length)
const activeCount = computed(() => users.value.filter((user) => user.status === 'active').length)

onMounted(loadUsers)

async function loadUsers() {
  isLoading.value = true
  error.value = ''
  notice.value = ''

  try {
    const result = await businessAccountVerificationApi.listBusinessOwners({
      status: statusFilter.value,
      q: search.value.trim(),
      pageSize: 100,
    })
    users.value = (result.users || []).map(normalizeUser)
  } catch (err) {
    error.value = err.message || 'Unable to load business-owner registrations.'
  } finally {
    isLoading.value = false
  }
}

async function setStatus(user, status) {
  busyUserId.value = user.id
  error.value = ''
  notice.value = ''

  try {
    const result = await businessAccountVerificationApi.updateStatus(user.id, status)
    const updatedUser = normalizeUser(result.user)
    users.value = users.value.map((item) => (item.id === user.id ? { ...item, ...updatedUser } : item))
    notice.value =
      status === 'active'
        ? `${updatedUser.name || updatedUser.email} can now sign in.`
        : `${updatedUser.name || updatedUser.email} was returned to pending verification.`
    if (statusFilter.value !== 'all') await loadUsers()
  } catch (err) {
    error.value = err.message || 'Unable to update account status.'
  } finally {
    busyUserId.value = ''
  }
}

function normalizeUser(user = {}) {
  const firstName = user.firstName || user.first_name || ''
  const lastName = user.lastName || user.last_name || ''
  return {
    ...user,
    firstName,
    lastName,
    middleName: user.middleName || user.middle_name || '',
    name: user.name || `${firstName} ${lastName}`.trim() || user.email,
    createdAt: user.created_at || user.createdAt,
    lastLoginAt: user.last_login_at || user.lastLoginAt,
  }
}
</script>

<template>
  <section class="cms-verification-page" aria-labelledby="account-verification-title">
    <header class="cms-verification-page__header">
      <div>
        <p>Business Accreditation</p>
        <h1 id="account-verification-title">Account Registration Verification</h1>
        <span>Approve business-owner registrations before sign-in access is activated.</span>
      </div>
    </header>

    <div class="cms-verification-page__summary" aria-label="Business owner account summary">
      <article>
        <span>Pending</span>
        <strong>{{ pendingCount }}</strong>
      </article>
      <article>
        <span>Active</span>
        <strong>{{ activeCount }}</strong>
      </article>
      <article>
        <span>Showing</span>
        <strong>{{ users.length }}</strong>
      </article>
    </div>

    <div v-if="notice" class="cms-verification-page__notice" role="status">{{ notice }}</div>
    <div v-if="error" class="cms-verification-page__error" role="alert">{{ error }}</div>

    <div class="cms-verification-page__toolbar">
      <input v-model="search" type="search" placeholder="Search name, email, or phone" @keydown.enter="loadUsers" />
      <select v-model="statusFilter" @change="loadUsers">
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button type="button" :disabled="isLoading" @click="loadUsers">
        {{ isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div class="cms-verification-page__table-wrap">
      <table>
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Registered</th>
            <th class="cms-verification-page__actions">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <strong>{{ user.name }}</strong>
              <span>{{ user.email }}</span>
            </td>
            <td>
              <span>{{ user.phone || 'No mobile number' }}</span>
              <small>{{ user.telephone || 'No telephone number' }}</small>
            </td>
            <td><CmsStatusBadge :status="user.status" /></td>
            <td>{{ user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available' }}</td>
            <td class="cms-verification-page__actions">
              <button
                v-if="user.status !== 'active'"
                type="button"
                :disabled="busyUserId === user.id"
                @click="setStatus(user, 'active')"
              >
                Verify Account
              </button>
              <button
                v-else
                type="button"
                class="is-secondary"
                :disabled="busyUserId === user.id"
                @click="setStatus(user, 'pending_verification')"
              >
                Return to Pending
              </button>
            </td>
          </tr>
          <tr v-if="!isLoading && users.length === 0">
            <td colspan="5" class="cms-verification-page__empty">
              No business-owner registrations found.
            </td>
          </tr>
          <tr v-if="isLoading">
            <td colspan="5" class="cms-verification-page__empty">Loading business-owner registrations...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.cms-verification-page {
  display: grid;
  gap: 18px;
}

.cms-verification-page__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
}

.cms-verification-page__header p {
  margin: 0 0 6px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.cms-verification-page__header h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.75rem, 3vw, 2.45rem);
  letter-spacing: 0;
}

.cms-verification-page__header span {
  display: block;
  margin-top: 8px;
  color: #64748b;
}

.cms-verification-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.cms-verification-page__summary article,
.cms-verification-page__table-wrap {
  border: 1px solid #d7e2ee;
  border-radius: 8px;
  background: #fff;
}

.cms-verification-page__summary article {
  padding: 16px;
}

.cms-verification-page__summary span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.cms-verification-page__summary strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.75rem;
}

.cms-verification-page__notice,
.cms-verification-page__error {
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 700;
}

.cms-verification-page__notice {
  color: #14532d;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}

.cms-verification-page__error {
  color: #7f1d1d;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.cms-verification-page__toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 240px) auto;
  gap: 10px;
}

.cms-verification-page__toolbar input,
.cms-verification-page__toolbar select,
.cms-verification-page__toolbar button {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font: inherit;
}

.cms-verification-page__toolbar input,
.cms-verification-page__toolbar select {
  padding: 0 12px;
}

.cms-verification-page__toolbar button,
.cms-verification-page__actions button {
  padding: 0 14px;
  border-color: #0f766e;
  background: #0f766e;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.cms-verification-page__toolbar button:disabled,
.cms-verification-page__actions button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.cms-verification-page__table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  text-align: left;
  vertical-align: top;
}

th {
  color: #475569;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
}

td strong,
td span,
td small {
  display: block;
}

td strong {
  color: #0f172a;
}

td span,
td small {
  margin-top: 3px;
  color: #64748b;
}

.cms-verification-page__actions {
  text-align: right;
  white-space: nowrap;
}

.cms-verification-page__actions button {
  min-height: 36px;
  border-radius: 7px;
}

.cms-verification-page__actions button.is-secondary {
  color: #0f766e;
  background: #fff;
}

.cms-verification-page__empty {
  padding: 26px 16px;
  color: #64748b;
  text-align: center;
}

@media (max-width: 780px) {
  .cms-verification-page__summary,
  .cms-verification-page__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
