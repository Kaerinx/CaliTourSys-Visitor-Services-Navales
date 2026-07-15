<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getTourismPackages } from '@/modules/product/services/productApi'
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
const isDetailModalOpen = ref(false)
const isProofModalOpen = ref(false)
const isActionBusy = ref(false)
const notice = ref('')
const actionError = ref('')
const declineReason = ref('')
const paymentRejectReason = ref('')
const showWalkInForm = ref(false)
const packages = ref([])
const walkInParticipants = ref([])
const walkInForm = reactive({
  packageId: '', selectedPax: 1, fullName: '', phoneNumber: '', email: '', gender: 'M',
  startDate: '', durationDays: 1, paymentPlan: 'full_payment', paymentMethod: 'cash', message: '',
})
const scheduleForm = reactive({ startDate: '', durationDays: 1, reason: '' })
const scheduleRequestId = ref('')
const paymentForm = reactive({ amount: '', paymentMethod: 'cash', transactionReference: '', notes: '' })
const creditForm = reactive({ toBookingRequestId: '', amount: '', reason: '' })

const hasFilters = computed(() => Boolean(filters.search || filters.bookingStatus || filters.paymentStatus))
const canReview = computed(() => auth.hasPermission('package_bookings.review'))
const canCreateWalkIn = computed(() => auth.hasPermission('package_bookings.create_walkin'))
const canEditSchedule = computed(() => auth.hasPermission('package_bookings.edit_schedule'))
const canTransferCredit = computed(() => auth.hasPermission('package_bookings.transfer_credit'))
const canVerifyPayment = computed(() => canReview.value && selected.value?.paymentStatus === 'proof_submitted')
const proofFileUrl = computed(() => normalizeProofUrl(selected.value?.proofOfPayment?.fileUrl))
const proofMimeType = computed(() => String(selected.value?.proofOfPayment?.mimeType || '').toLowerCase())
const isProofImage = computed(() => proofMimeType.value.startsWith('image/'))
const verifiedPaymentTotal = computed(() => (selected.value?.payments || []).filter((item) => item.paymentStatus === 'verified').reduce((sum, item) => sum + Number(item.amount || 0), 0))
const pendingPaymentTotal = computed(() => (selected.value?.payments || []).filter((item) => item.paymentStatus === 'pending_verification').reduce((sum, item) => sum + Number(item.amount || 0), 0))
const appliedCreditTotal = computed(() => Number(selected.value?.appliedCreditAmount || 0))
const settledPaymentTotal = computed(() => verifiedPaymentTotal.value + appliedCreditTotal.value)
const paidPaymentTotal = computed(() => settledPaymentTotal.value + pendingPaymentTotal.value)
const remainingPaymentTotal = computed(() => Math.max(0, Number(selected.value?.totalAmount || 0) - settledPaymentTotal.value - pendingPaymentTotal.value))
const amountDueNow = computed(() => {
  if (!selected.value || pendingPaymentTotal.value > 0 || remainingPaymentTotal.value <= 0) return 0
  if (settledPaymentTotal.value > 0) return remainingPaymentTotal.value
  return Math.min(Number(selected.value.initialPaymentAmount || selected.value.totalAmount || 0), remainingPaymentTotal.value)
})
const canApproveBooking = computed(() => {
  if (!canReview.value || !selected.value) return false
  if (selected.value.paymentMode !== 'pay_at_office' || !selected.value.paymentRequired) return true
  return settledPaymentTotal.value >= Number(selected.value.totalAmount || 0)
})
const canShowScheduleEditor = computed(() => (
  selected.value?.bookingStatus === 'approved'
  && selected.value?.paymentStatus === 'paid'
))

onMounted(async () => {
  await Promise.all([load(), loadPackages()])
})

async function reload() {
  await load()
  if (selected.value) {
    const refreshed = items.value.find((item) => item.id === selected.value.id)
    if (refreshed) selected.value = { ...selected.value, ...refreshed }
  }
}

async function openDetail(item) {
  selected.value = item
  isDetailModalOpen.value = true
  isProofModalOpen.value = false
  isDetailLoading.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.getPackageBookingRequestById(item.id)
    selected.value = data
    declineReason.value = data.bookingDeclineReason || ''
    paymentRejectReason.value = data.paymentRejectionReason || ''
    scheduleForm.startDate = String(data.startDate || data.preferredBookingDate || '').slice(0, 10)
    scheduleForm.durationDays = Number(data.durationDays || 1)
    scheduleForm.reason = ''
    scheduleRequestId.value = ''
    paymentForm.amount = amountDueNow.value || ''
    paymentForm.paymentMethod = data.paymentMode === 'pay_at_office' || data.bookingSource === 'walk_in'
      ? (data.paymentMethod || 'cash')
      : (data.paymentMethod || 'qr_instapay')
    paymentForm.transactionReference = ''
    paymentForm.notes = ''
    Object.assign(creditForm, { toBookingRequestId: '', amount: '', reason: '' })
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isDetailLoading.value = false
  }
}

function closeDetailModal() {
  if (isActionBusy.value) return
  isDetailModalOpen.value = false
  isProofModalOpen.value = false
}

function openProofModal() {
  if (proofFileUrl.value) isProofModalOpen.value = true
}

function closeProofModal() {
  isProofModalOpen.value = false
}

async function deleteSelectedBooking() {
  if (!selected.value) return
  const label = selected.value.bookingReference || selected.value.packageName || 'this booking'
  const confirmed = window.confirm(
    `Temporarily delete ${label}? This removes the booking from CMS and the tourist booking history.`,
  )
  if (!confirmed) return

  isActionBusy.value = true
  actionError.value = ''
  try {
    await cmsOperationsApi.deletePackageBookingRequest(selected.value.id)
    notice.value = 'Package booking deleted from CMS and tourist booking history.'
    selected.value = null
    isDetailModalOpen.value = false
    await reload()
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function loadPackages() {
  try {
    const response = await getTourismPackages()
    packages.value = (response.data || []).filter((item) => item.packageStatus !== 'Archived')
  } catch {
    packages.value = []
  }
}

function addWalkInParticipant() {
  if (walkInParticipants.value.length >= Math.max(0, Number(walkInForm.selectedPax) - 1)) return
  walkInParticipants.value.push({ fullName: '', gender: 'M' })
}

function resetWalkInForm() {
  Object.assign(walkInForm, {
    packageId: '', selectedPax: 1, fullName: '', phoneNumber: '', email: '', gender: 'M',
    startDate: '', durationDays: 1, paymentPlan: 'full_payment', paymentMethod: 'cash', message: '',
  })
  walkInParticipants.value = []
}

function useDateChangeRequest(request) {
  scheduleForm.startDate = String(request.startDate || '').slice(0, 10)
  scheduleForm.durationDays = Number(request.durationDays || 1)
  scheduleForm.reason = `Approved tourist request: ${request.reason}`
  scheduleRequestId.value = request.id
}

async function createWalkInBooking() {
  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.createWalkInPackageBooking({
      packageId: walkInForm.packageId,
      selectedPax: Number(walkInForm.selectedPax),
      representativeContact: {
        fullName: walkInForm.fullName,
        phoneNumber: walkInForm.phoneNumber,
        email: walkInForm.email || null,
        gender: walkInForm.gender,
      },
      participants: walkInParticipants.value.filter((item) => item.fullName.trim()),
      startDate: walkInForm.startDate,
      durationDays: Number(walkInForm.durationDays),
      paymentPlan: walkInForm.paymentPlan,
      paymentMethod: walkInForm.paymentMethod,
      message: walkInForm.message || undefined,
    })
    notice.value = `Walk-in booking ${data.bookingReference || data.id} created.`
    showWalkInForm.value = false
    resetWalkInForm()
    await reload()
    await openDetail(data)
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function saveSchedule() {
  if (!selected.value) return
  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.updatePackageBookingSchedule(selected.value.id, {
      startDate: scheduleForm.startDate,
      durationDays: Number(scheduleForm.durationDays),
      reason: scheduleForm.reason,
      dateChangeRequestId: scheduleRequestId.value || undefined,
    })
    selected.value = data
    notice.value = 'Booking dates updated after availability validation.'
    await reload()
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function recordPayment() {
  if (!selected.value) return
  isActionBusy.value = true
  actionError.value = ''
  try {
    const payload = {
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      notes: paymentForm.notes || undefined,
    }
    if (paymentForm.paymentMethod !== 'cash') {
      payload.transactionReference = paymentForm.transactionReference
    }
    const { data } = await cmsOperationsApi.recordPackageBookingPayment(selected.value.id, payload)
    selected.value = data.booking
    notice.value = paymentForm.paymentMethod === 'cash' ? 'Cash payment recorded and verified.' : 'Electronic payment recorded for verification.'
    await reload()
    await openDetail(selected.value)
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function transferCredit() {
  if (!selected.value) return
  isActionBusy.value = true
  actionError.value = ''
  try {
    await cmsOperationsApi.transferPackageBookingCredit(selected.value.id, {
      toBookingRequestId: creditForm.toBookingRequestId,
      amount: Number(creditForm.amount),
      reason: creditForm.reason,
    })
    notice.value = 'Cancelled-booking credit transferred to the new booking.'
    Object.assign(creditForm, { toBookingRequestId: '', amount: '', reason: '' })
    await openDetail(selected.value)
  } catch (err) {
    actionError.value = friendlyContentError(err)
  } finally {
    isActionBusy.value = false
  }
}

async function updateStatus(status) {
  if (!selected.value) return
  if (['declined', 'cancelled'].includes(status) && !declineReason.value.trim()) {
    actionError.value = `${status === 'cancelled' ? 'Cancellation' : 'Decline'} reason is required.`
    return
  }

  isActionBusy.value = true
  actionError.value = ''
  try {
    const { data } = await cmsOperationsApi.updatePackageBookingStatus(selected.value.id, {
      status,
      reason: ['declined', 'cancelled'].includes(status) ? declineReason.value : undefined,
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
      <button type="button" :disabled="!canCreateWalkIn" @click="showWalkInForm = !showWalkInForm">
        {{ showWalkInForm ? 'Close walk-in form' : '+ New walk-in booking' }}
      </button>
    </header>

    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>

    <form v-if="showWalkInForm" class="walk-in-form" @submit.prevent="createWalkInBooking">
      <div class="walk-in-form__heading">
        <div><p>Booking source: Walk-in</p><h2>Create package booking</h2></div>
        <span>Cash requires no bank/QR reference or electronic proof.</span>
      </div>
      <div class="walk-in-grid">
        <label><span>Package</span><select v-model="walkInForm.packageId" required><option value="" disabled>Select package</option><option v-for="item in packages" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label><span>Start date</span><input v-model="walkInForm.startDate" type="date" required /></label>
        <label><span>Duration (days)</span><input v-model="walkInForm.durationDays" type="number" min="1" required /></label>
        <label><span>Total pax</span><input v-model="walkInForm.selectedPax" type="number" min="1" max="80" required /></label>
        <label><span>Representative name</span><input v-model.trim="walkInForm.fullName" required /></label>
        <label><span>Phone</span><input v-model.trim="walkInForm.phoneNumber" required /></label>
        <label><span>Email (optional)</span><input v-model.trim="walkInForm.email" type="email" /></label>
        <label><span>Gender</span><select v-model="walkInForm.gender"><option value="M">M</option><option value="F">F</option></select></label>
        <label><span>Payment plan</span><select v-model="walkInForm.paymentPlan"><option value="deposit_50">50% down payment</option><option value="full_payment">Full payment</option></select></label>
        <label><span>Payment method</span><select v-model="walkInForm.paymentMethod"><option value="cash">Cash</option><option value="qr_instapay">QR / InstaPay</option><option value="credit_debit_card">Credit / Debit Card</option></select></label>
      </div>
      <div class="walk-in-participants">
        <div class="walk-in-form__heading"><strong>Other participant names (optional)</strong><button type="button" :disabled="walkInParticipants.length >= Math.max(0, Number(walkInForm.selectedPax) - 1)" @click="addWalkInParticipant">+ Add name</button></div>
        <div v-for="(participant, index) in walkInParticipants" :key="index" class="walk-in-participant-row">
          <input v-model.trim="participant.fullName" :placeholder="`Participant ${index + 2}`" />
          <select v-model="participant.gender"><option value="M">M</option><option value="F">F</option></select>
          <button type="button" @click="walkInParticipants.splice(index, 1)">Remove</button>
        </div>
      </div>
      <label><span>Message or request</span><textarea v-model.trim="walkInForm.message" rows="2"></textarea></label>
      <div v-if="actionError" class="booking-state booking-state--error">{{ actionError }}</div>
      <button type="submit" :disabled="isActionBusy">{{ isActionBusy ? 'Creating...' : 'Create walk-in booking' }}</button>
    </form>

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
              <small>{{ item.visitor.fullName }} / {{ item.selectedPax }} pax / {{ labelFor(item.bookingSource) }}</small>
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

    <div
      v-if="isDetailModalOpen"
      class="booking-detail-modal"
      role="presentation"
      @click.self="closeDetailModal"
    >
      <section
        class="booking-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
      >
        <header class="booking-detail-dialog__header">
          <div>
            <p>Booking review</p>
            <h2 id="booking-detail-title">{{ selected?.bookingReference || selected?.id || 'Package booking' }}</h2>
          </div>
          <button type="button" :disabled="isActionBusy" aria-label="Close booking review" @click="closeDetailModal">X</button>
        </header>

        <div class="booking-detail-dialog__body">
          <div v-if="isDetailLoading" class="booking-state">
            <strong>Loading booking details...</strong>
            <p>Please wait while the full booking record is loaded.</p>
          </div>

          <div v-else-if="selected">
          <div v-if="actionError" class="booking-state booking-state--error">{{ actionError }}</div>

          <section class="detail-section">
            <h3>Request</h3>
            <dl>
              <div><dt>Package</dt><dd>{{ selected.packageName }}</dd></div>
              <div><dt>Representative</dt><dd>{{ selected.representative?.fullName || selected.visitor.fullName }}</dd></div>
              <div><dt>Email</dt><dd>{{ selected.representative?.email || selected.visitor.email || 'Not provided' }}</dd></div>
              <div><dt>Phone</dt><dd>{{ selected.representative?.phoneNumber || selected.visitor.phoneNumber }}</dd></div>
              <div><dt>Start date</dt><dd>{{ formatDate(selected.startDate) }}</dd></div>
              <div><dt>End date</dt><dd>{{ formatDate(selected.endDate) }}</dd></div>
              <div><dt>Duration</dt><dd>{{ selected.durationDays }} day(s)</dd></div>
              <div><dt>Selected pax</dt><dd>{{ selected.selectedPax }}</dd></div>
              <div v-if="selected.message"><dt>Message</dt><dd>{{ selected.message }}</dd></div>
            </dl>
            <div v-if="selected.participants?.length" class="participant-summary">
              <strong>Other participant names</strong>
              <span v-for="participant in selected.participants" :key="participant.id">{{ participant.fullName }} ({{ participant.gender }})</span>
            </div>
            <div v-if="selected.dateChangeRequests?.length" class="participant-summary">
              <strong>Date-change requests</strong>
              <div v-for="request in selected.dateChangeRequests" :key="request.id" class="date-request-row">
                <span>{{ formatDate(request.startDate) }} / {{ request.durationDays }} day(s) - {{ labelFor(request.status) }}</span>
                <small>{{ request.reason }}</small>
                <button v-if="request.status === 'pending' && canShowScheduleEditor" type="button" :disabled="!canEditSchedule" @click="useDateChangeRequest(request)">Review in schedule form</button>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h3>Payment Proof</h3>
            <dl>
              <div><dt>Payment status</dt><dd><CmsStatusBadge :status="selected.paymentStatus" /></dd></div>
              <div><dt>Reference number</dt><dd>{{ selected.paymentReferenceNumber || 'Not provided' }}</dd></div>
              <div><dt>Submitted</dt><dd>{{ formatDateTime(selected.paymentSubmittedAt) }}</dd></div>
              <div v-if="selected.paymentVerifiedAt"><dt>Verified</dt><dd>{{ formatDateTime(selected.paymentVerifiedAt) }}</dd></div>
              <div v-if="selected.paymentRejectionReason"><dt>Rejected reason</dt><dd>{{ selected.paymentRejectionReason }}</dd></div>
            </dl>
            <button v-if="proofFileUrl" type="button" class="proof-link proof-link--button" @click="openProofModal">View proof of payment</button>
            <p v-else class="muted">No proof of payment uploaded.</p>
          </section>

          <section class="detail-section">
            <h3>Payment Terms and Totals</h3>
            <dl>
              <div><dt>Total amount</dt><dd>{{ formatCurrency(selected.totalAmount) }}</dd></div>
              <div><dt>Paid amount</dt><dd>{{ formatCurrency(paidPaymentTotal) }}</dd></div>
              <div><dt>Remaining balance</dt><dd>{{ formatCurrency(remainingPaymentTotal) }}</dd></div>
              <div><dt>Method</dt><dd>{{ labelFor(selected.paymentMethod) }}</dd></div>
              <div><dt>Balance deadline</dt><dd>{{ formatDateTime(selected.balanceDueAt) }}</dd></div>
            </dl>
          </section>

          <section v-if="selected.bookingSource === 'walk_in' && selected.paymentMethod === 'cash'" class="detail-section">
            <h3>Record Payment</h3>
            <p class="muted">Use this only to record cash received for a walk-in booking. Online payments are validated from the submitted proof.</p>
            <label><span>Cash amount received</span><input v-model="paymentForm.amount" type="number" min="0.01" step="0.01" /></label>
            <button type="button" :disabled="!canReview || isActionBusy || !paymentForm.amount || remainingPaymentTotal <= 0" @click="recordPayment">Record payment</button>
          </section>

          <section class="detail-section">
            <h3>Review Actions</h3>
            <p v-if="!canReview" class="review-hint">
              Your account can view package bookings but does not have permission to review or verify payments.
            </p>
            <div class="action-grid">
              <button type="button" :disabled="!canApproveBooking || isActionBusy" @click="updateStatus('approved')">Approve booking</button>
              <button type="button" class="is-danger" :disabled="!canReview || isActionBusy" @click="updateStatus('declined')">Decline booking</button>
              <button type="button" class="is-danger" :disabled="!canReview || isActionBusy" @click="updateStatus('cancelled')">Cancel booking</button>
              <button type="button" class="is-danger action-grid__wide" :disabled="!canReview || isActionBusy" @click="deleteSelectedBooking">Temporary delete booking</button>
            </div>
            <p v-if="selected.paymentMode === 'pay_at_office' && !canApproveBooking" class="review-hint">
              Record the full cash payment before approving this walk-in-payment booking.
            </p>
            <label>
              <span>Decline or cancellation reason</span>
              <textarea v-model.trim="declineReason" rows="3"></textarea>
            </label>

            <div v-if="selected.bookingStatus === 'cancelled'" class="review-subsection">
              <h4>Transfer Cancelled-booking Credit</h4>
              <p class="muted">Credit is valid for six months, once only, for the same representative and package.</p>
              <label><span>New booking request ID</span><input v-model.trim="creditForm.toBookingRequestId" /></label>
              <label><span>Transfer amount</span><input v-model="creditForm.amount" type="number" min="0.01" step="0.01" /></label>
              <label><span>Reason</span><textarea v-model.trim="creditForm.reason" rows="2"></textarea></label>
              <button type="button" :disabled="!canTransferCredit || isActionBusy || !creditForm.toBookingRequestId || !creditForm.amount || !creditForm.reason" @click="transferCredit">Transfer credit</button>
            </div>
          </section>

          <section v-if="canShowScheduleEditor" class="detail-section">
            <h3>Edit Dates and Duration</h3>
            <p class="muted">Authorized staff can reschedule this paid and approved booking after availability is checked. The reason is saved in the audit trail.</p>
            <div class="schedule-grid">
              <label><span>Start date</span><input v-model="scheduleForm.startDate" type="date" /></label>
              <label><span>Duration (days)</span><input v-model="scheduleForm.durationDays" type="number" min="1" /></label>
            </div>
            <label><span>Reason for change</span><textarea v-model.trim="scheduleForm.reason" rows="2"></textarea></label>
            <button type="button" :disabled="!canEditSchedule || isActionBusy || !scheduleForm.reason" @click="saveSchedule">Save schedule change</button>
          </section>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="isProofModalOpen && proofFileUrl"
      class="proof-modal"
      role="presentation"
      @click.self="closeProofModal"
    >
      <section class="proof-dialog" role="dialog" aria-modal="true" aria-labelledby="proof-dialog-title">
        <header class="proof-dialog__header">
          <h2 id="proof-dialog-title">Payment proof</h2>
          <button type="button" aria-label="Close payment proof" @click="closeProofModal">X</button>
        </header>
        <div class="proof-dialog__body">
          <img v-if="isProofImage" :src="proofFileUrl" alt="Submitted payment proof" />
          <iframe v-else :src="proofFileUrl" title="Submitted payment proof"></iframe>
          <a v-if="!isProofImage" :href="proofFileUrl" target="_blank" rel="noreferrer">Open proof in a new tab</a>
        </div>
      </section>
    </div>
    </div>
  </section>
</template>

<style scoped>
.booking-review-page {
  display: grid;
  gap: 18px;
}

.walk-in-form {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid #bbd2c4;
  border-radius: 8px;
  background: #f5faf7;
}

.walk-in-form__heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.walk-in-form__heading p,
.walk-in-form__heading h2 {
  margin: 0;
}

.walk-in-grid,
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.walk-in-form label,
.walk-in-participants {
  display: grid;
  gap: 6px;
}

.walk-in-form label span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.walk-in-participant-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 90px auto;
  gap: 8px;
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
.detail-section textarea,
.detail-section input,
.detail-section select,
.walk-in-form input,
.walk-in-form select,
.walk-in-form textarea {
  width: 100%;
  min-height: 40px;
  padding: 9px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font: inherit;
}

.participant-summary {
  display: grid;
  gap: 5px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.date-request-row {
  display: grid;
  gap: 5px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.date-request-row button {
  width: max-content;
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
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.booking-list-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.booking-detail-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
}

.booking-detail-dialog {
  width: min(1080px, 100%);
  max-height: min(90vh, 920px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
}

.booking-detail-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.booking-detail-dialog__header p,
.booking-detail-dialog__header h2 {
  margin: 0;
}

.booking-detail-dialog__header p {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-detail-dialog__header h2 {
  margin-top: 3px;
  color: #0f172a;
  font-size: 20px;
}

.booking-detail-dialog__header > button {
  width: 42px;
  min-height: 42px;
  padding: 0;
  border-radius: 8px;
  font-size: 18px;
}

.booking-detail-dialog__body {
  overflow: auto;
  padding: 18px 22px 22px;
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

.detail-section {
  display: grid;
  gap: 9px;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-section:last-child {
  border-bottom: 0;
}

.detail-section h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
}

dl {
  display: grid;
  gap: 7px;
  margin: 0;
}

.booking-detail-dialog dl {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 28px;
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

.proof-link--button {
  padding: 10px 14px;
  border: 1px solid #1b4332;
  border-radius: 7px;
  background: #1b4332;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.proof-link--button:hover {
  background: #143728;
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

.action-grid__wide {
  grid-column: 1 / -1;
}

.review-subsection {
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.review-subsection h4 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
}

.proof-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.62);
}

.proof-dialog {
  width: min(860px, 100%);
  max-height: min(90vh, 860px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.3);
}

.proof-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
}

.proof-dialog__header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 17px;
}

.proof-dialog__header button {
  width: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: 8px;
}

.proof-dialog__body {
  display: grid;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  padding: 18px;
}

.proof-dialog__body img,
.proof-dialog__body iframe {
  display: block;
  width: 100%;
  height: min(68vh, 620px);
  max-height: min(68vh, 620px);
  border: 0;
  object-fit: contain;
  background: #f8fafc;
}

.proof-dialog__body a {
  color: #1b4332;
  font-weight: 800;
}

@media (max-width: 1100px) {
  .booking-toolbar,
  .booking-row {
    grid-template-columns: 1fr;
  }

  .booking-detail-modal {
    padding: 12px;
  }

  .booking-detail-dialog {
    max-height: calc(100vh - 24px);
  }

  .booking-detail-dialog__header,
  .booking-detail-dialog__body {
    padding: 16px;
  }

  .proof-modal {
    padding: 12px;
  }

  .proof-dialog__body {
    padding: 12px;
  }

  .booking-detail-dialog dl {
    grid-template-columns: 1fr;
  }
}
</style>
