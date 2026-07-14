<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'
import { getTouristBookings } from '../services/promotionApi'
import { submitPackagePaymentProof } from '../services/promotionService'
import { computed, onMounted, reactive, ref } from 'vue'

const auth = useTouristAuthStore()

const bookings = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const uploadState = reactive({})

const stats = computed(() => {
  const total = bookings.value.length
  const pending = bookings.value.filter((booking) => booking.bookingStatus === 'pending').length
  const approved = bookings.value.filter((booking) =>
    ['approved', 'confirmed', 'reviewed'].includes(booking.bookingStatus),
  ).length
  const needsPayment = bookings.value.filter(canUploadPaymentProof).length

  return { total, pending, approved, needsPayment }
})

onMounted(() => {
  loadBookings()
})

async function loadBookings() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getTouristBookings()
    bookings.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load your booking requests.'
  } finally {
    isLoading.value = false
  }
}

function stateFor(bookingId) {
  if (!uploadState[bookingId]) {
    uploadState[bookingId] = {
      file: null,
      paymentReferenceNumber: '',
      paymentNotes: '',
      isUploading: false,
      message: '',
      error: '',
    }
  }

  return uploadState[bookingId]
}

function handleProofFileChange(booking, event) {
  const [file] = Array.from(event.target.files || [])
  const state = stateFor(booking.id)
  state.file = file || null
  state.message = ''
  state.error = ''
}

async function uploadProof(booking) {
  const state = stateFor(booking.id)
  if (!state.file) {
    state.error = 'Choose a proof of payment file first.'
    return
  }

  state.isUploading = true
  state.message = ''
  state.error = ''

  try {
    await submitPackagePaymentProof(booking.id, {
      file: state.file,
      paymentReferenceNumber: state.paymentReferenceNumber,
      paymentNotes: state.paymentNotes,
    })
    state.file = null
    state.paymentReferenceNumber = ''
    state.paymentNotes = ''
    state.message = 'Proof of payment uploaded. Staff will verify it manually.'
    await loadBookings()
  } catch (error) {
    state.error = error.message || 'Unable to upload proof of payment.'
  } finally {
    state.isUploading = false
  }
}

function isFiniteAmount(value) {
  if (value === null || value === undefined || value === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
}

function canUploadPaymentProof(booking) {
  if (!booking?.paymentRequired || !isFiniteAmount(booking.totalAmount)) return false
  if (pendingAmountFor(booking) > 0 || amountDueFor(booking) <= 0) return false
  return !['cancelled', 'declined', 'expired'].includes(booking.bookingStatus)
}

function verifiedAmountFor(booking) {
  return Number(booking?.verifiedPaymentAmount || 0) + Number(booking?.appliedCreditAmount || 0)
}

function pendingAmountFor(booking) {
  return Number(booking?.pendingPaymentAmount || 0)
}

function amountDueFor(booking) {
  if (!isFiniteAmount(booking?.totalAmount)) return 0

  const verifiedAmount = verifiedAmountFor(booking)
  const remainingAmount = Math.max(0, Number(booking.totalAmount) - verifiedAmount)
  if (pendingAmountFor(booking) > 0 || remainingAmount <= 0) return 0

  if (verifiedAmount > 0) return remainingAmount
  return Math.min(Number(booking.initialPaymentAmount || booking.totalAmount || 0), remainingAmount)
}

function proofStatusLabel(booking) {
  if (!booking.proofOfPayment) return 'No proof submitted'
  return `Submitted ${formatDisplayDate(booking.proofOfPayment.uploadedAt)}`
}

function nextStepText(booking) {
  if (!isFiniteAmount(booking.totalAmount)) {
    return 'The Tourism Office will coordinate pricing and next steps using your submitted contact details.'
  }

  if (!booking.paymentRequired) {
    return 'This request will be handled through inquiry and review.'
  }

  if (canUploadPaymentProof(booking)) {
    return 'Send payment using the instructions below, then upload proof for manual staff verification.'
  }

  if (booking.proofOfPayment && booking.paymentStatus !== 'verified') {
    return 'Your proof has been submitted. Staff will verify it manually and update the payment status.'
  }

  if (booking.paymentStatus === 'verified') {
    return 'Your payment proof has been verified. Watch this dashboard for booking status updates.'
  }

  return 'The Tourism Office will continue reviewing your request and contact you when there is an update.'
}

function formatCurrency(value) {
  if (!isFiniteAmount(value)) return 'Price upon inquiry'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value))
}

function formatStatusLabel(value) {
  return String(value || 'pending')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusTone(value) {
  if (['approved', 'verified', 'confirmed'].includes(value)) return 'good'
  if (['declined', 'cancelled', 'rejected'].includes(value)) return 'bad'
  if (['proof_submitted', 'reviewed'].includes(value)) return 'info'
  return 'wait'
}

function formatDisplayDate(value) {
  if (!value) return 'To be confirmed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
</script>

<template>
  <div class="tourist-dashboard-page">
    <PromotionNavbar />

    <main class="page-shell">
      <section class="dashboard-hero">
        <div>
          <p class="eyebrow">Booking history</p>
          <h1>Your trips, {{ auth.tourist?.fullName }}</h1>
          <p>Track package booking requests, payment proof, and Tourism Office review updates in one place.</p>
        </div>
      </section>

      <section class="stats-grid" aria-label="Booking request summary">
        <article>
          <span>Total requests</span>
          <strong>{{ stats.total }}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{{ stats.pending }}</strong>
        </article>
        <article>
          <span>Approved / reviewed</span>
          <strong>{{ stats.approved }}</strong>
        </article>
        <article>
          <span>Needs payment action</span>
          <strong>{{ stats.needsPayment }}</strong>
        </article>
      </section>

      <section class="bookings-section" aria-labelledby="bookings-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">Package requests</p>
            <h2 id="bookings-title">Your booking requests</h2>
          </div>
          <RouterLink to="/packages">Browse packages</RouterLink>
        </div>

        <div v-if="isLoading" class="state-panel">
          <h3>Loading your booking requests...</h3>
          <p>Please wait while CaliTourSys checks your tourist account records.</p>
        </div>

        <div v-else-if="errorMessage" class="state-panel state-panel--error">
          <h3>Unable to load bookings</h3>
          <p>{{ errorMessage }}</p>
          <button type="button" @click="loadBookings">Try again</button>
        </div>

        <div v-else-if="!bookings.length" class="state-panel">
          <h3>No package booking requests yet.</h3>
          <p>Browse available packages and submit a request while signed in to track it here.</p>
          <RouterLink to="/packages">Browse packages</RouterLink>
        </div>

        <div v-else class="booking-list">
          <article v-for="booking in bookings" :key="booking.id" class="booking-card">
            <div class="booking-card__top">
              <div>
                <span>Booking reference</span>
                <h3>
                  <RouterLink :to="`/tourist/bookings/${booking.id}`">
                    {{ booking.bookingReference }}
                  </RouterLink>
                </h3>
              </div>
              <div class="badge-row">
                <span class="status-badge" :data-tone="statusTone(booking.bookingStatus)">
                  {{ formatStatusLabel(booking.bookingStatus) }}
                </span>
                <span class="status-badge" :data-tone="statusTone(booking.paymentStatus)">
                  {{ formatStatusLabel(booking.paymentStatus) }}
                </span>
              </div>
            </div>

            <dl class="booking-grid">
              <div>
                <dt>Package</dt>
                <dd>{{ booking.packageName }}</dd>
              </div>
              <div>
                <dt>Selected pax</dt>
                <dd>{{ booking.selectedPax }} pax</dd>
              </div>
              <div>
                <dt>Preferred date</dt>
                <dd>{{ formatDisplayDate(booking.preferredBookingDate) }}</dd>
              </div>
              <div>
                <dt>Estimated total</dt>
                <dd>{{ formatCurrency(booking.totalAmount) }}</dd>
              </div>
              <div>
                <dt>Booking status</dt>
                <dd>{{ formatStatusLabel(booking.bookingStatus) }}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>{{ formatStatusLabel(booking.paymentStatus) }}</dd>
              </div>
              <div>
                <dt>Proof upload status</dt>
                <dd>{{ proofStatusLabel(booking) }}</dd>
              </div>
              <div v-if="booking.pricingNote">
                <dt>Pricing note</dt>
                <dd>{{ booking.pricingNote }}</dd>
              </div>
            </dl>

            <div class="next-steps">
              <span>Next steps</span>
              <p>{{ nextStepText(booking) }}</p>
            </div>

            <div v-if="canUploadPaymentProof(booking)" class="payment-panel">
              <div>
                <span>Payment instructions</span>
                <p>{{ booking.paymentInstruction }}</p>
                <strong>Amount due: {{ formatCurrency(amountDueFor(booking)) }}</strong>
              </div>

              <label>
                <span>Payment reference number</span>
                <input v-model.trim="stateFor(booking.id).paymentReferenceNumber" type="text" />
              </label>

              <label>
                <span>Proof of payment</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  @change="handleProofFileChange(booking, $event)"
                />
              </label>

              <label>
                <span>Payment notes</span>
                <textarea v-model.trim="stateFor(booking.id).paymentNotes" rows="3"></textarea>
              </label>

              <p v-if="stateFor(booking.id).message" class="message message--success">
                {{ stateFor(booking.id).message }}
              </p>
              <p v-if="stateFor(booking.id).error" class="message message--error">
                {{ stateFor(booking.id).error }}
              </p>

              <button
                class="secondary-button"
                type="button"
                :disabled="stateFor(booking.id).isUploading"
                @click="uploadProof(booking)"
              >
                {{ stateFor(booking.id).isUploading ? 'Uploading...' : 'Upload proof of payment' }}
              </button>
            </div>

            <RouterLink class="detail-link" :to="`/tourist/bookings/${booking.id}`">
              View booking details
            </RouterLink>
          </article>
        </div>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.tourist-dashboard-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #14261f;
  font-family: Inter, system-ui, sans-serif;
}

.page-shell {
  width: min(100% - 48px, 1180px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.dashboard-hero,
.booking-card,
.state-panel {
  border: 1px solid #e4e1d8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(20, 38, 31, 0.07);
}

.dashboard-hero {
  padding: 34px;
}

.eyebrow,
dt,
.booking-card__top span,
.payment-panel span,
.next-steps span,
.stats-grid span {
  margin: 0;
  color: #66746e;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 8px 0 0;
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.08;
}

.dashboard-hero > div > p:last-child {
  max-width: 660px;
  margin: 18px 0 0;
  color: #5c5c5c;
  font-size: 17px;
  line-height: 1.65;
}

.profile-card {
  padding: 22px;
  border-radius: 8px;
  background: #f6f7f4;
}

.profile-card h2 {
  font-size: 22px;
}

dl {
  display: grid;
  gap: 14px;
  margin: 20px 0;
}

dd {
  margin: 5px 0 0;
  font-weight: 800;
  overflow-wrap: anywhere;
}

button,
.section-head a,
.state-panel a {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font: inherit;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
}

.profile-card button,
.secondary-button,
.state-panel button,
.section-head a,
.state-panel a {
  border: 1px solid #1b4332;
  background: #ffffff;
  color: #1b4332;
}

.profile-card button {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.stats-grid article {
  min-height: 120px;
  padding: 20px;
  border: 1px solid #e4e1d8;
  border-radius: 8px;
  background: #ffffff;
}

.stats-grid strong {
  display: block;
  margin-top: 12px;
  color: #1b4332;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 34px;
}

.bookings-section {
  margin-top: 34px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head h2 {
  font-size: clamp(28px, 4vw, 42px);
}

.section-head a,
.state-panel a,
.state-panel button {
  padding: 0 16px;
}

.state-panel {
  padding: 34px;
}

.state-panel p {
  max-width: 620px;
  margin: 10px 0 0;
  color: #66746e;
  line-height: 1.6;
}

.state-panel a,
.state-panel button {
  margin-top: 18px;
}

.state-panel--error {
  border-color: #f2b8b5;
  background: #fff7f6;
}

.booking-list {
  display: grid;
  gap: 18px;
}

.booking-card {
  padding: 24px;
}

.booking-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.booking-card__top h3 {
  font-size: 22px;
  overflow-wrap: anywhere;
}

.booking-card__top h3 a,
.detail-link {
  color: #1b4332;
}

.detail-link {
  display: inline-flex;
  width: max-content;
  margin-top: 16px;
  font-weight: 900;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5efe5;
  color: #7a4b08;
  font-size: 12px;
  font-weight: 900;
}

.status-badge[data-tone='good'] {
  background: #e6f4ea;
  color: #166534;
}

.status-badge[data-tone='bad'] {
  background: #fdecea;
  color: #9f2d20;
}

.status-badge[data-tone='info'] {
  background: #e8f1ff;
  color: #1d4ed8;
}

.booking-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 24px 0 0;
}

.next-steps,
.payment-panel {
  margin-top: 18px;
  border-radius: 8px;
}

.next-steps {
  padding: 16px;
  background: #eff7f2;
}

.next-steps p,
.payment-panel p {
  margin: 8px 0 0;
  color: #3f4f49;
  line-height: 1.6;
}

.payment-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #d8c59a;
  background: #fffaf0;
}

.payment-panel strong {
  display: block;
  margin-top: 10px;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: #3f4f49;
  font-size: 13px;
  font-weight: 900;
}

input,
textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
  padding: 10px 12px;
}

textarea {
  min-height: 96px;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

.secondary-button {
  width: max-content;
  padding: 0 18px;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 900;
}

.message--success {
  background: #e6f4ea;
  color: #166534;
}

.message--error {
  background: #fdecea;
  color: #9f2d20;
}

@media (max-width: 960px) {
  .dashboard-hero {
    grid-template-columns: 1fr;
  }

  .stats-grid,
  .booking-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100% - 32px, 1120px);
    padding-top: 96px;
  }

  .dashboard-hero,
  .booking-card,
  .state-panel {
    padding: 22px;
  }

  .stats-grid,
  .booking-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .booking-card__top {
    align-items: stretch;
    flex-direction: column;
  }

  .badge-row {
    justify-content: flex-start;
  }

  .secondary-button {
    width: 100%;
  }
}
</style>
