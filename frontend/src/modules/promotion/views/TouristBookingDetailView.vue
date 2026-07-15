<script setup>
import PromotionFooter from '../components/PromotionFooter.vue'
import PromotionNavbar from '../components/PromotionNavbar.vue'
import { createTouristBookingDateChangeRequest, getTouristBookingById } from '../services/promotionApi'
import { submitPackagePaymentProof } from '../services/promotionService'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  requestId: {
    type: String,
    required: true,
  },
})

const booking = ref(null)
const isLoading = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const uploadMessage = ref('')
const uploadError = ref('')
const isRequestingDateChange = ref(false)
const dateChangeMessage = ref('')
const dateChangeError = ref('')
const proofForm = reactive({
  file: null,
  paymentReferenceNumber: '',
  paymentNotes: '',
})
const dateChangeForm = reactive({ startDate: '', durationDays: 1, reason: '' })

const hasKnownTotal = computed(() => isFiniteAmount(booking.value?.totalAmount))
const verifiedAmount = computed(() => Number(booking.value?.verifiedPaymentAmount || 0) + Number(booking.value?.appliedCreditAmount || 0))
const pendingAmount = computed(() => Number(booking.value?.pendingPaymentAmount || 0))
const amountPaid = computed(() => verifiedAmount.value + pendingAmount.value)
const remainingAmount = computed(() => Math.max(0, Number(booking.value?.totalAmount || 0) - verifiedAmount.value - pendingAmount.value))
const amountDue = computed(() => {
  if (!hasKnownTotal.value || pendingAmount.value > 0 || remainingAmount.value <= 0) return 0
  return verifiedAmount.value > 0
    ? remainingAmount.value
    : Math.min(Number(booking.value?.initialPaymentAmount || booking.value?.totalAmount || 0), remainingAmount.value)
})
const canUploadProof = computed(() => {
  return Boolean(
    booking.value?.id &&
      booking.value.paymentRequired &&
      booking.value.paymentMode !== 'pay_at_office' &&
      booking.value.paymentMethod !== 'cash' &&
      hasKnownTotal.value &&
      amountDue.value > 0 &&
      pendingAmount.value === 0 &&
      !['cancelled', 'declined', 'expired'].includes(booking.value.bookingStatus),
  )
})
const proofStatusLabel = computed(() => {
  if (!booking.value?.proofOfPayment) return 'No proof submitted'
  return `Submitted ${formatDisplayDate(booking.value.proofOfPayment.uploadedAt)}`
})
const canRequestDateChange = computed(() => !['declined', 'cancelled', 'expired'].includes(booking.value?.bookingStatus))
const nextSteps = computed(() => {
  if (!booking.value) return ''
  if (booking.value.paymentMode === 'pay_at_office' || booking.value.paymentMethod === 'cash') {
    return `Pay the full amount in cash at the Tourism Office by ${formatDisplayDate(booking.value.depositDueAt)}. Staff will record payment before approving this booking.`
  }
  if (!hasKnownTotal.value) {
    return 'The Tourism Office will coordinate pricing and next steps using your submitted contact details.'
  }
  if (!booking.value.paymentRequired) return 'This request will be handled through inquiry and review.'
  if (canUploadProof.value) return 'Send payment using the instructions below, then upload proof for manual staff verification.'
  if (booking.value.paymentStatus === 'proof_submitted') return 'Your proof has been submitted. Staff will verify it manually.'
  if (booking.value.paymentStatus === 'verified') return 'Your payment proof has been verified. Watch your booking status for updates.'
  return 'The Tourism Office will continue reviewing your request.'
})

onMounted(loadBooking)

watch(
  () => props.requestId,
  () => loadBooking(),
)

async function loadBooking() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getTouristBookingById(props.requestId)
    booking.value = response.data
    dateChangeForm.startDate = String(booking.value.startDate || booking.value.preferredBookingDate || '').slice(0, 10)
    dateChangeForm.durationDays = Number(booking.value.durationDays || 1)
  } catch (error) {
    booking.value = null
    errorMessage.value = error.message || 'Unable to load this booking request.'
  } finally {
    isLoading.value = false
  }
}

async function requestDateChange() {
  if (!booking.value?.id) return
  isRequestingDateChange.value = true
  dateChangeMessage.value = ''
  dateChangeError.value = ''
  try {
    await createTouristBookingDateChangeRequest(booking.value.id, {
      startDate: dateChangeForm.startDate,
      durationDays: Number(dateChangeForm.durationDays),
      reason: dateChangeForm.reason,
    })
    dateChangeMessage.value = 'Date-change request submitted for staff approval and availability checking.'
    dateChangeForm.reason = ''
    await loadBooking()
  } catch (error) {
    dateChangeError.value = error.message || 'Unable to submit the date-change request.'
  } finally {
    isRequestingDateChange.value = false
  }
}

function handleProofFileChange(event) {
  const [file] = Array.from(event.target.files || [])
  proofForm.file = file || null
  uploadMessage.value = ''
  uploadError.value = ''
}

async function uploadProof() {
  if (!booking.value?.id) return
  if (!proofForm.file) {
    uploadError.value = 'Choose a proof of payment file first.'
    return
  }
  if (!proofForm.paymentReferenceNumber.trim()) {
    uploadError.value = 'Payment reference number is required for electronic payments.'
    return
  }

  isUploading.value = true
  uploadMessage.value = ''
  uploadError.value = ''

  try {
    await submitPackagePaymentProof(booking.value.id, {
      file: proofForm.file,
      amount: amountDue.value,
      paymentMethod: booking.value.paymentMethod || 'qr_instapay',
      paymentReferenceNumber: proofForm.paymentReferenceNumber,
      paymentNotes: proofForm.paymentNotes,
    })
    proofForm.file = null
    proofForm.paymentReferenceNumber = ''
    proofForm.paymentNotes = ''
    uploadMessage.value = 'Proof of payment uploaded. Staff will verify it manually.'
    await loadBooking()
  } catch (error) {
    uploadError.value = error.message || 'Unable to upload proof of payment.'
  } finally {
    isUploading.value = false
  }
}

function isFiniteAmount(value) {
  if (value === null || value === undefined || value === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
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
  <div class="booking-detail-page">
    <PromotionNavbar />

    <main class="page-shell">
      <RouterLink class="back-link" to="/tourist/bookings">Back to booking history</RouterLink>

      <section v-if="isLoading" class="state-panel">
        <h1>Loading booking request...</h1>
        <p>Please wait while CaliTourSys checks your booking details.</p>
      </section>

      <section v-else-if="errorMessage" class="state-panel state-panel--error">
        <h1>Booking request unavailable</h1>
        <p>{{ errorMessage }}</p>
        <RouterLink to="/tourist/bookings">Return to booking history</RouterLink>
      </section>

      <template v-else-if="booking">
        <section class="receipt-hero">
          <div>
            <p class="eyebrow">Booking reference</p>
            <h1>{{ booking.bookingReference }}</h1>
            <p>{{ booking.packageName }}</p>
          </div>
          <div class="status-stack">
            <span class="status-badge" :data-tone="statusTone(booking.bookingStatus)">
              {{ formatStatusLabel(booking.bookingStatus) }}
            </span>
            <span class="status-badge" :data-tone="statusTone(booking.paymentStatus)">
              {{ formatStatusLabel(booking.paymentStatus) }}
            </span>
          </div>
        </section>

        <section class="detail-grid">
          <article class="detail-panel">
            <h2>Booking details</h2>
            <dl>
              <div><dt>Package</dt><dd>{{ booking.packageName }}</dd></div>
              <div><dt>Selected pax</dt><dd>{{ booking.selectedPax }} pax</dd></div>
              <div><dt>Booking source</dt><dd>{{ formatStatusLabel(booking.bookingSource) }}</dd></div>
              <div><dt>Start date</dt><dd>{{ formatDisplayDate(booking.startDate || booking.preferredBookingDate) }}</dd></div>
              <div><dt>End date</dt><dd>{{ formatDisplayDate(booking.endDate) }}</dd></div>
              <div><dt>Duration</dt><dd>{{ booking.durationDays || 1 }} day(s)</dd></div>
              <div><dt>Estimated total</dt><dd>{{ formatCurrency(booking.totalAmount) }}</dd></div>
              <div><dt>Payment mode</dt><dd>{{ booking.paymentMode === 'pay_at_office' ? 'Walk-in payment' : 'Pay online' }}</dd></div>
              <div><dt>Payment method</dt><dd>{{ formatStatusLabel(booking.paymentMethod) }}</dd></div>
              <div><dt>Amount paid</dt><dd>{{ formatCurrency(amountPaid) }}</dd></div>
              <div><dt>Remaining balance</dt><dd>{{ formatCurrency(remainingAmount) }}</dd></div>
              <div><dt>Balance deadline</dt><dd>{{ booking.balanceDueAt ? formatDisplayDate(booking.balanceDueAt) : 'Not applicable' }}</dd></div>
              <div><dt>Booking status</dt><dd>{{ formatStatusLabel(booking.bookingStatus) }}</dd></div>
              <div><dt>Payment status</dt><dd>{{ formatStatusLabel(booking.paymentStatus) }}</dd></div>
              <div><dt>Payment required</dt><dd>{{ booking.paymentRequired ? 'Yes' : 'No' }}</dd></div>
              <div><dt>Proof upload status</dt><dd>{{ proofStatusLabel }}</dd></div>
              <div v-if="booking.pricingNote"><dt>Pricing note</dt><dd>{{ booking.pricingNote }}</dd></div>
            </dl>
          </article>

          <aside class="next-panel">
            <h2>Next steps</h2>
            <p>{{ nextSteps }}</p>
            <RouterLink
              v-if="canUploadProof"
              class="payment-link"
              :to="{ name: 'promotion-package-booking-payment', params: { slug: booking.packageId || 'booking' }, query: { requestId: booking.id } }"
            >
              Continue to payment
            </RouterLink>
            <div v-if="booking.proofOfPayment" class="proof-summary">
              <span>Proof of payment</span>
              <strong>{{ booking.proofOfPayment.originalFilename || 'Uploaded file' }}</strong>
              <small>{{ formatDisplayDate(booking.proofOfPayment.uploadedAt) }}</small>
            </div>
          </aside>
        </section>

        <section v-if="canUploadProof" class="payment-panel">
          <div>
            <p class="eyebrow">Manual payment</p>
            <h2>Upload proof of payment</h2>
            <p>{{ booking.paymentInstruction }}</p>
            <strong>Amount due now: {{ formatCurrency(amountDue) }}</strong>
          </div>

          <label>
            <span>Payment reference number</span>
            <input v-model.trim="proofForm.paymentReferenceNumber" type="text" required />
          </label>

          <label>
            <span>Proof of payment</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              @change="handleProofFileChange"
            />
          </label>

          <label>
            <span>Payment notes</span>
            <textarea v-model.trim="proofForm.paymentNotes" rows="3"></textarea>
          </label>

          <p v-if="uploadMessage" class="message message--success">{{ uploadMessage }}</p>
          <p v-if="uploadError" class="message message--error">{{ uploadError }}</p>

          <button type="button" :disabled="isUploading" @click="uploadProof">
            {{ isUploading ? 'Uploading...' : 'Upload proof of payment' }}
          </button>
        </section>

        <section v-if="canRequestDateChange" class="date-change-panel">
          <div>
            <p class="eyebrow">Reschedule</p>
            <h2>Request a date change</h2>
            <p>Your current booking stays unchanged until authorized staff approve this request and confirm availability.</p>
          </div>
          <div class="date-change-grid">
            <label><span>New start date</span><input v-model="dateChangeForm.startDate" type="date" required /></label>
            <label><span>Duration (days)</span><input v-model="dateChangeForm.durationDays" type="number" min="1" required /></label>
          </div>
          <label><span>Reason</span><textarea v-model.trim="dateChangeForm.reason" rows="3" required></textarea></label>
          <p v-if="dateChangeMessage" class="message message--success">{{ dateChangeMessage }}</p>
          <p v-if="dateChangeError" class="message message--error">{{ dateChangeError }}</p>
          <button type="button" :disabled="isRequestingDateChange || !dateChangeForm.startDate || !dateChangeForm.reason" @click="requestDateChange">
            {{ isRequestingDateChange ? 'Submitting...' : 'Submit date-change request' }}
          </button>
        </section>
      </template>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.booking-detail-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #14261f;
  font-family: Inter, system-ui, sans-serif;
}

.page-shell {
  width: min(100% - 48px, 1120px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.back-link {
  display: inline-flex;
  margin-bottom: 18px;
  color: #1b4332;
  font-weight: 900;
}

.receipt-hero,
.detail-panel,
.next-panel,
.payment-panel,
.date-change-panel,
.state-panel {
  border: 1px solid #e4e1d8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(20, 38, 31, 0.07);
}

.receipt-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 34px;
}

.eyebrow,
dt,
label span,
.proof-summary span {
  margin: 0;
  color: #66746e;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 8px 0 0;
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

h1 {
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.08;
  overflow-wrap: anywhere;
}

.receipt-hero p:last-child,
.next-panel p,
.payment-panel p,
.state-panel p {
  margin: 12px 0 0;
  color: #5c5c5c;
  line-height: 1.65;
}

.status-stack {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
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

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  margin-top: 18px;
}

.detail-panel,
.next-panel,
.payment-panel,
.date-change-panel,
.state-panel {
  padding: 24px;
}

dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 22px 0 0;
}

dd {
  margin: 5px 0 0;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.proof-summary {
  display: grid;
  gap: 6px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 8px;
  background: #eff7f2;
}

.proof-summary small {
  color: #66746e;
}

.payment-panel {
  display: grid;
  gap: 14px;
  margin-top: 18px;
  border-color: #d8c59a;
  background: #fffaf0;
}

.date-change-panel {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.date-change-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.payment-panel strong {
  display: block;
  margin-top: 10px;
}

label {
  display: grid;
  gap: 8px;
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

button,
.payment-link,
.state-panel a {
  width: max-content;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1px solid #1b4332;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
}

button:disabled {
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

.message--error,
.state-panel--error {
  background: #fdecea;
  color: #9f2d20;
}

@media (max-width: 860px) {
  .receipt-hero,
  .detail-grid,
  .date-change-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .status-stack {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100% - 32px, 1120px);
    padding-top: 96px;
  }

  .receipt-hero,
  .detail-panel,
  .next-panel,
  .payment-panel,
  .date-change-panel,
  .state-panel {
    padding: 22px;
  }

  dl {
    grid-template-columns: 1fr;
  }

  button,
  .payment-link,
  .state-panel a {
    width: 100%;
  }
}
</style>
