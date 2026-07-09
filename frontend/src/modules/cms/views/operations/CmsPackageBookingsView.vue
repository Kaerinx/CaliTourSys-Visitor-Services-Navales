<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { cmsOperationsApi } from '../../services/cmsOperationsApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const {
  error,
  filters,
  isLoading,
  items,
  load,
  pagination,
  setPage,
} = useCmsList(cmsOperationsApi.getPackageBookingRequests, {
  bookingStatus: '',
  paymentStatus: '',
  sort: '-createdAt',
})

const selected = ref(null)
const isDetailLoading = ref(false)
const isActionBusy = ref(false)
const notice = ref('')
const actionError = ref('')
const declineReason = ref('')
const paymentRejectReason = ref('')
const bookingReviewNotes = ref('')
const paymentNotes = ref('')

const hasFilters = computed(() => Boolean(filters.search || filters.bookingStatus || filters.paymentStatus))
const canReview = computed(() => auth.hasPermission('package_bookings.review'))
const canVerifyPayment = computed(() => canReview.value && selected.value?.paymentStatus === 'proof_submitted')
const proofFileUrl = computed(() => normalizeProofUrl(selected.value?.proofOfPayment?.fileUrl))

onMounted(async () => {
  await load()
  if (items.value[0]) await openDetail(items.value[0])
})

async function reload() {
  await load()
  if (selected.value) {
    const refreshed = items.value.find((item) => item.id === selected.value.id)
    if (refreshed) selected.value = { ...selected.value, ...refreshed }
  }
}

async function openDetail(item) {
  isDetailLoading.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.getPackageBookingRequestById(item.id)
    selected.value = data
    declineReason.value = data.bookingDeclineReason || ''
    paymentRejectReason.value = data.paymentRejectionReason || ''
    bookingReviewNotes.value = data.bookingReviewNotes || ''
    paymentNotes.value = data.paymentNotes || ''
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isDetailLoading.value = false
  }
}

async function updateStatus(status) {
  if (!selected.value) return
  if (status === 'declined' && !declineReason.value.trim()) {
    actionError.value = 'Decline reason is required before declining a booking.'
    return
  }

  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.updatePackageBookingStatus(selected.value.id, {
      status,
      reason: status === 'declined' ? declineReason.value : undefined,
      notes: bookingReviewNotes.value || undefined,
    })
    selected.value = data
    notice.value = `Booking marked ${labelFor(status)}.`
    await reload()
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function verifyPayment() {
  if (!selected.value) return
  if (!canVerifyPayment.value) {
    actionError.value = 'Payment can only be verified after proof has been submitted.'
    return
  }

  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.verifyPackageBookingPayment(selected.value.id)
    selected.value = data
    notice.value = 'Payment proof verified.'
    await reload()
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function rejectPayment() {
  if (!selected.value) return
  if (!canVerifyPayment.value) {
    actionError.value = 'Payment proof can only be rejected while status is proof submitted.'
    return
  }
  if (!paymentRejectReason.value.trim()) {
    actionError.value = 'Rejection reason is required before rejecting proof.'
    return
  }

  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.rejectPackageBookingPayment(selected.value.id, {
      reason: paymentRejectReason.value,
      notes: paymentNotes.value || undefined,
    })
    selected.value = data
    notice.value = 'Payment proof rejected.'
    await reload()
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function saveNotes() {
  if (!selected.value) return
  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.updatePackageBookingNotes(selected.value.id, {
      bookingReviewNotes: bookingReviewNotes.value,
      paymentNotes: paymentNotes.value,
    })
    selected.value = data
    notice.value = 'Internal notes saved.'
    await reload()
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

function labelFor(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'Upon inquiry'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value))
}

function formatDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatFileSize(value) {
  const size = Number(value)
  if (!Number.isFinite(size) || size < 0) return 'Unknown size'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeProofUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
  const origin = base.replace(/\/api\/v\d+.*$/i, '').replace(/\/+$/, '')
  return `${origin}${String(value).startsWith('/') ? '' : '/'}${value}`
}
</script>

<template>
  <section class="cms-content-page booking-review-page" aria-labelledby="booking-review-title">
    <header class="cms-content-page__header">
      <div>
        <p>Package Operations</p>
        <h1 id="booking-review-title">Package Booking Requests</h1>
        <span>Review visitor package requests, inspect payment proof, and manually update booking and payment statuses.</span>
      </div>
    </header>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <section class="booking-toolbar" aria-label="Booking request filters">
      <label>
        <span>Search</span>
        <input v-model.trim="filters.search" type="search" placeholder="Name, email, phone, package, or reference" @keyup.enter="reload" />
      </label>
      <label>
        <span>Booking status</span>
        <select v-model="filters.bookingStatus" @change="reload">
          <option value="">All booking statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label>
        <span>Payment status</span>
        <select v-model="filters.paymentStatus" @change="reload">
          <option value="">All payment statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="proof_submitted">Proof submitted</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="not_required">Not required</option>
          <option value="pending_inquiry">Pending inquiry</option>
        </select>
      </label>
      <button type="button" @click="reload">Refresh</button>
    </section>

    <div class="booking-workbench">
      <section class="booking-list-panel" aria-live="polite">
        <div v-if="isLoading" class="booking-state">Loading booking requests...</div>
        <div v-else-if="error" class="booking-state booking-state--error">
          <strong>Unable to load booking requests</strong>
          <p>{{ error }}</p>
          <button type="button" @click="reload">Try again</button>
        </div>
        <div v-else-if="!items.length" class="booking-state">
          <strong>{{ hasFilters ? 'No booking requests match these filters' : 'No booking requests yet' }}</strong>
          <p>{{ hasFilters ? 'Adjust the filters and try again.' : 'Submitted public package booking requests will appear here.' }}</p>
        </div>

        <div v-else class="booking-list">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="booking-row"
            :class="{ 'is-selected': selected?.id === item.id }"
            @click="openDetail(item)"
          >
            <span>
              <strong>{{ item.packageName }}</strong>
              <small>{{ item.visitor.fullName }} / {{ item.selectedPax }} pax</small>
            </span>
            <span>
              <CmsStatusBadge :status="item.bookingStatus" />
              <CmsStatusBadge :status="item.paymentStatus" />
            </span>
            <span>
              <strong>{{ formatCurrency(item.totalAmount) }}</strong>
              <small>{{ formatDate(item.preferredBookingDate) }}</small>
            </span>
          </button>
        </div>

        <CmsPagination :pagination="pagination" @page-change="setPage" />
      </section>

      <aside class="booking-detail-panel">
        <div v-if="!selected" class="booking-state">
          <strong>Select a booking request</strong>
          <p>Details, proof links, and review actions will appear here.</p>
        </div>

        <div v-else>
          <div class="detail-heading">
            <div>
              <p>Reference</p>
              <h2>{{ selected.id }}</h2>
            </div>
            <span v-if="isDetailLoading">Loading...</span>
          </div>

          <div v-if="actionError" class="booking-state booking-state--error">{{ actionError }}</div>

          <section class="detail-section">
            <h3>Request</h3>
            <dl>
              <div><dt>Package</dt><dd>{{ selected.packageName }}</dd></div>
              <div><dt>Visitor</dt><dd>{{ selected.visitor.fullName }}</dd></div>
              <div><dt>Email</dt><dd>{{ selected.visitor.email }}</dd></div>
              <div><dt>Phone</dt><dd>{{ selected.visitor.phoneNumber }}</dd></div>
              <div><dt>Preferred date</dt><dd>{{ formatDate(selected.preferredBookingDate) }}</dd></div>
              <div><dt>Message</dt><dd>{{ selected.message || 'No message provided' }}</dd></div>
            </dl>
          </section>

          <section class="detail-section">
            <h3>Pricing Snapshot</h3>
            <dl>
              <div><dt>Selected pax</dt><dd>{{ selected.selectedPax }}</dd></div>
              <div><dt>Base amount</dt><dd>{{ formatCurrency(selected.basePrice) }}</dd></div>
              <div><dt>Base pax</dt><dd>{{ selected.basePax || 'Not set' }}</dd></div>
              <div><dt>Extra pax</dt><dd>{{ formatCurrency(selected.extraPaxPrice) }}</dd></div>
              <div><dt>Total</dt><dd>{{ formatCurrency(selected.totalAmount) }}</dd></div>
              <div><dt>Pricing note</dt><dd>{{ selected.pricingNote || 'No pricing note' }}</dd></div>
            </dl>
          </section>

          <section class="detail-section">
            <h3>Payment Proof</h3>
            <dl>
              <div><dt>Payment required</dt><dd>{{ selected.paymentRequired ? 'Yes' : 'No' }}</dd></div>
              <div><dt>Payment status</dt><dd><CmsStatusBadge :status="selected.paymentStatus" /></dd></div>
              <div><dt>Reference number</dt><dd>{{ selected.paymentReferenceNumber || 'Not provided' }}</dd></div>
              <div><dt>File name</dt><dd>{{ selected.proofOfPayment?.originalFilename || 'No file uploaded' }}</dd></div>
              <div><dt>File type</dt><dd>{{ selected.proofOfPayment?.mimeType || 'Not recorded' }}</dd></div>
              <div><dt>File size</dt><dd>{{ selected.proofOfPayment ? formatFileSize(selected.proofOfPayment.fileSize) : 'Not recorded' }}</dd></div>
              <div><dt>Uploaded</dt><dd>{{ formatDateTime(selected.proofOfPayment?.uploadedAt) }}</dd></div>
              <div><dt>Submitted</dt><dd>{{ formatDateTime(selected.paymentSubmittedAt) }}</dd></div>
              <div><dt>Verified</dt><dd>{{ formatDateTime(selected.paymentVerifiedAt) }}</dd></div>
              <div><dt>Rejected reason</dt><dd>{{ selected.paymentRejectionReason || 'None' }}</dd></div>
            </dl>
            <a v-if="proofFileUrl" class="proof-link" :href="proofFileUrl" target="_blank" rel="noreferrer">
              Open proof of payment
            </a>
            <p v-else class="muted">No proof of payment uploaded.</p>
          </section>

          <section class="detail-section">
            <h3>Review Actions</h3>
            <p v-if="!canReview" class="review-hint">
              Your account can view package bookings but does not have permission to review or verify payments.
            </p>
            <div class="action-grid">
              <button type="button" :disabled="!canReview || isActionBusy" @click="updateStatus('reviewed')">Mark reviewed</button>
              <button type="button" :disabled="!canReview || isActionBusy" @click="updateStatus('approved')">Approve booking</button>
              <button type="button" class="is-danger" :disabled="!canReview || isActionBusy" @click="updateStatus('declined')">Decline booking</button>
            </div>
            <label>
              <span>Decline reason</span>
              <textarea v-model.trim="declineReason" rows="3"></textarea>
            </label>
            <div class="action-grid">
              <button type="button" :disabled="!canVerifyPayment || isActionBusy" @click="verifyPayment">Verify payment</button>
              <button type="button" class="is-danger" :disabled="!canVerifyPayment || isActionBusy" @click="rejectPayment">Reject payment</button>
            </div>
            <label>
              <span>Payment rejection reason</span>
              <textarea v-model.trim="paymentRejectReason" rows="3"></textarea>
            </label>
            <label>
              <span>Booking notes</span>
              <textarea v-model.trim="bookingReviewNotes" rows="3"></textarea>
            </label>
            <label>
              <span>Payment notes</span>
              <textarea v-model.trim="paymentNotes" rows="3"></textarea>
            </label>
            <button type="button" :disabled="!canReview || isActionBusy" @click="saveNotes">
              {{ isActionBusy ? 'Saving...' : 'Save internal notes' }}
            </button>
          </section>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.booking-review-page {
  display: grid;
  gap: 18px;
}

.booking-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 220px 220px auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.booking-toolbar label,
.detail-section label {
  display: grid;
  gap: 6px;
}

.booking-toolbar span,
.detail-section label span,
dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-toolbar input,
.booking-toolbar select,
.detail-section textarea {
  width: 100%;
  min-height: 40px;
  padding: 9px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font: inherit;
}

button {
  min-height: 40px;
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  font-weight: 800;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

button.is-danger {
  border-color: #fecaca;
  color: #b91c1c;
}

.booking-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
  gap: 18px;
  align-items: start;
}

.booking-list-panel,
.booking-detail-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.booking-list {
  display: grid;
  gap: 10px;
}

.booking-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 14px;
  text-align: left;
}

.booking-row.is-selected {
  border-color: #1b4332;
  box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.12);
}

.booking-row span {
  display: grid;
  gap: 4px;
}

.booking-row small,
.muted {
  color: #64748b;
}

.booking-state {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}

.booking-state--error {
  background: #fef2f2;
  color: #991b1b;
}

.detail-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-heading p,
.detail-heading h2 {
  margin: 0;
}

.detail-heading p {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.detail-heading h2 {
  overflow-wrap: anywhere;
  color: #0f172a;
  font-size: 16px;
}

.detail-section {
  display: grid;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-section:last-child {
  border-bottom: 0;
}

.detail-section h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
}

dd {
  margin: 0;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.proof-link {
  justify-self: start;
  color: #1b4332;
  font-weight: 800;
}

.review-hint {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13px;
  font-weight: 800;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 1100px) {
  .booking-toolbar,
  .booking-workbench,
  .booking-row {
    grid-template-columns: 1fr;
  }
}
</style>
