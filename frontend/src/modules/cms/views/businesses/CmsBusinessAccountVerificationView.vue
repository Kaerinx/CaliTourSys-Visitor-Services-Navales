<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ExternalLink, Eye, FileImage, X } from '@lucide/vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { businessAccountVerificationApi } from '../../services/businessAccountVerificationApi'

const users = ref([])
const isLoading = ref(false)
const error = ref('')
const notice = ref('')
const search = ref('')
const statusFilter = ref('pending_verification')
const busyUserId = ref('')
const busyDocumentId = ref('')
const selectedUser = ref(null)

const statusOptions = [
  { value: 'pending_verification', label: 'Pending verification' },
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All business owners' },
]

const pendingCount = computed(() => users.value.filter((user) => user.status === 'pending_verification').length)
const activeCount = computed(() => users.value.filter((user) => user.status === 'active').length)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  loadUsers()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

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
    const displayName = user.name || updatedUser.name || updatedUser.email
    const successMessage =
      status === 'active'
        ? `${displayName} can now sign in.`
        : `${displayName} was returned to pending verification.`
    if (statusFilter.value !== 'all') await loadUsers()
    notice.value = successMessage
    closeReview()
  } catch (err) {
    error.value = err.message || 'Unable to update account status.'
  } finally {
    busyUserId.value = ''
  }
}

function openReview(user) {
  selectedUser.value = user
  document.body.style.overflow = 'hidden'
}

function closeReview() {
  selectedUser.value = null
  document.body.style.overflow = ''
}

function handleKeydown(event) {
  if (event.key === 'Escape' && selectedUser.value) closeReview()
}

async function openRegistrationDocument(document) {
  busyDocumentId.value = document.id
  error.value = ''
  try {
    await businessAccountVerificationApi.openRegistrationDocument(document.id)
  } catch (err) {
    error.value = err.message || 'Unable to open registration proof.'
  } finally {
    busyDocumentId.value = ''
  }
}

function legalStructureLabel(value) {
  const labels = {
    'sole-proprietorship': 'Sole Proprietorship',
    partnership: 'Partnership',
    corporation: 'Corporation',
  }
  return labels[value] || value || 'Not provided'
}

function registrationNumberLabel(user) {
  return user.business?.legal_structure === 'sole-proprietorship' ? 'DTI' : 'SEC'
}

function documentLabel(user, document) {
  const labels = {
    business_permit: 'Business Permit',
    registration_certificate: `${registrationNumberLabel(user)} Certificate`,
    representative_valid_id: 'Representative Valid ID',
  }
  return labels[document.document_type] || document.original_name || 'Registration proof'
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
    business: user.business || null,
    registrationDocuments: user.registration_documents || user.registrationDocuments || [],
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
      <input v-model="search" type="search" placeholder="Search applicant, business, or permit number" @keydown.enter="loadUsers" />
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
            <th>Business</th>
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
              <small>{{ user.phone || 'No mobile number' }}</small>
            </td>
            <td class="cms-verification-page__business">
              <strong>{{ user.business?.business_name || 'Business profile unavailable' }}</strong>
              <span>{{ legalStructureLabel(user.business?.legal_structure) }}</span>
              <small>{{ user.business?.business_type || 'Tourism category not provided' }}</small>
            </td>
            <td><CmsStatusBadge :status="user.status" /></td>
            <td>{{ user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available' }}</td>
            <td class="cms-verification-page__actions">
              <button
                type="button"
                class="is-secondary"
                @click="openReview(user)"
              >
                <Eye :size="16" aria-hidden="true" />
                Review
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

    <Teleport to="body">
      <div v-if="selectedUser" class="review-dialog__overlay" @click.self="closeReview">
        <section
          class="review-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-review-title"
        >
          <header class="review-dialog__header">
            <div>
              <p>Account Registration Review</p>
              <h2 id="registration-review-title">
                {{ selectedUser.business?.business_name || selectedUser.name }}
              </h2>
              <CmsStatusBadge :status="selectedUser.status" />
            </div>
            <button type="button" title="Close review" aria-label="Close review" @click="closeReview">
              <X :size="20" aria-hidden="true" />
            </button>
          </header>

          <div class="review-dialog__body">
            <div class="review-dialog__detail-grid">
              <section class="review-dialog__section" aria-labelledby="applicant-details-title">
                <h3 id="applicant-details-title">Applicant</h3>
                <dl>
                  <div><dt>Name</dt><dd>{{ selectedUser.name }}</dd></div>
                  <div><dt>Email</dt><dd>{{ selectedUser.email }}</dd></div>
                  <div><dt>Mobile</dt><dd>{{ selectedUser.phone || 'Not provided' }}</dd></div>
                  <div><dt>Telephone</dt><dd>{{ selectedUser.telephone || 'Not provided' }}</dd></div>
                </dl>
              </section>

              <section class="review-dialog__section" aria-labelledby="business-details-title">
                <h3 id="business-details-title">Business Registration</h3>
                <dl>
                  <div><dt>Business name</dt><dd>{{ selectedUser.business?.business_name || 'Not provided' }}</dd></div>
                  <div><dt>Business type</dt><dd>{{ legalStructureLabel(selectedUser.business?.legal_structure) }}</dd></div>
                  <div><dt>Tourism category</dt><dd>{{ selectedUser.business?.business_type || 'Not provided' }}</dd></div>
                  <div><dt>Business Permit</dt><dd>{{ selectedUser.business?.business_permit_number || 'Not provided' }}</dd></div>
                  <div>
                    <dt>{{ registrationNumberLabel(selectedUser) }} registration</dt>
                    <dd>{{ selectedUser.business?.dti_sec_registration_number || 'Not provided' }}</dd>
                  </div>
                  <div v-if="selectedUser.business?.authorized_representative_position">
                    <dt>Representative position</dt>
                    <dd>{{ selectedUser.business.authorized_representative_position }}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <section class="review-dialog__section review-dialog__proofs" aria-labelledby="registration-proofs-title">
              <div class="review-dialog__section-heading">
                <div>
                  <h3 id="registration-proofs-title">Registration Proofs</h3>
                  <p>Open each uploaded image before making a decision.</p>
                </div>
                <span>{{ selectedUser.registrationDocuments.length }} file(s)</span>
              </div>
              <div v-if="selectedUser.registrationDocuments.length" class="review-dialog__proof-list">
                <button
                  v-for="document in selectedUser.registrationDocuments"
                  :key="document.id"
                  type="button"
                  :disabled="busyDocumentId === document.id"
                  @click="openRegistrationDocument(document)"
                >
                  <FileImage :size="18" aria-hidden="true" />
                  <span>
                    <strong>{{ documentLabel(selectedUser, document) }}</strong>
                    <small>{{ document.original_name }}</small>
                  </span>
                  <ExternalLink :size="15" aria-hidden="true" />
                </button>
              </div>
              <p v-else class="review-dialog__empty">No registration proofs were uploaded for this account.</p>
            </section>
          </div>

          <footer class="review-dialog__footer">
            <button type="button" class="is-secondary" @click="closeReview">Close</button>
            <button
              v-if="selectedUser.status !== 'active'"
              type="button"
              :disabled="busyUserId === selectedUser.id"
              @click="setStatus(selectedUser, 'active')"
            >
              {{ busyUserId === selectedUser.id ? 'Verifying...' : 'Verify Account' }}
            </button>
            <button
              v-else
              type="button"
              class="is-danger"
              :disabled="busyUserId === selectedUser.id"
              @click="setStatus(selectedUser, 'pending_verification')"
            >
              {{ busyUserId === selectedUser.id ? 'Updating...' : 'Return to Pending' }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
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
  min-width: 760px;
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
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 7px;
}

.cms-verification-page__actions button.is-secondary {
  color: #0f766e;
  background: #fff;
}

.cms-verification-page__business {
  min-width: 240px;
}

.review-dialog__overlay {
  position: fixed;
  z-index: 2000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.58);
}

.review-dialog {
  width: min(900px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.26);
}

.review-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.review-dialog__header p {
  margin: 0;
  color: #0f766e;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.review-dialog__header h2 {
  margin: 5px 0 10px;
  color: #0f172a;
  font-size: 1.5rem;
}

.review-dialog__header > button {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
}

.review-dialog__header > button:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.review-dialog__body {
  overflow-y: auto;
  padding: 0 28px;
}

.review-dialog__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
}

.review-dialog__section {
  min-width: 0;
  padding: 24px 0;
}

.review-dialog__section h3 {
  margin: 0 0 16px;
  color: #0f172a;
  font-size: 1rem;
}

.review-dialog__section dl {
  display: grid;
  gap: 11px;
  margin: 0;
}

.review-dialog__section dl > div {
  display: grid;
  grid-template-columns: minmax(110px, 0.7fr) minmax(0, 1.3fr);
  gap: 14px;
}

.review-dialog__section dt {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.review-dialog__section dd {
  margin: 0;
  color: #1e293b;
  font-size: 0.88rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.review-dialog__proofs {
  border-top: 1px solid #e2e8f0;
}

.review-dialog__section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.review-dialog__section-heading h3 {
  margin-bottom: 4px;
}

.review-dialog__section-heading p,
.review-dialog__empty {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
}

.review-dialog__section-heading > span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.review-dialog__proof-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.review-dialog__proof-list button {
  min-width: 0;
  min-height: 62px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #b8d6d1;
  border-radius: 6px;
  background: #f0fdfa;
  color: #0f766e;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.review-dialog__proof-list button:hover {
  border-color: #0f766e;
  background: #ccfbf1;
}

.review-dialog__proof-list button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.review-dialog__proof-list strong,
.review-dialog__proof-list small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-dialog__proof-list strong {
  color: #115e59;
  font-size: 0.82rem;
}

.review-dialog__proof-list small {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.72rem;
}

.review-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 28px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.review-dialog__footer button {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid #0f766e;
  border-radius: 6px;
  background: #0f766e;
  color: #ffffff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.review-dialog__footer button.is-secondary {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #475569;
}

.review-dialog__footer button.is-danger {
  border-color: #b91c1c;
  background: #b91c1c;
}

.review-dialog__footer button:disabled {
  cursor: wait;
  opacity: 0.65;
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

  .review-dialog__detail-grid,
  .review-dialog__proof-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .review-dialog__header,
  .review-dialog__body,
  .review-dialog__footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .review-dialog__section dl > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }

  .review-dialog__footer {
    flex-wrap: wrap;
  }
}
</style>
