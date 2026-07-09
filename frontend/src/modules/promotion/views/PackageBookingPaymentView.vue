<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { submitPackagePaymentProof } from '../services/promotionService'

defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const isInstructionsVisible = ref(false)
const isUploading = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')
const uploadedProof = ref(null)
const currentPaymentStatus = ref(String(route.query.paymentStatus || 'unpaid'))
const proofForm = reactive({
  file: null,
  paymentReferenceNumber: '',
  paymentNotes: '',
})

const booking = computed(() => ({
  requestId: String(route.query.requestId || ''),
  packageName: String(route.query.packageName || 'Selected tourism package'),
  selectedPax: toPositiveInteger(route.query.selectedPax) || 1,
  preferredDate: String(route.query.preferredDate || ''),
  totalAmount: toFiniteNumber(route.query.totalAmount),
}))

const bookingReference = computed(() => {
  return booking.value.requestId ? `PKG-${booking.value.requestId}` : 'Missing reference'
})
const hasKnownTotal = computed(() => isFiniteAmount(booking.value.totalAmount))
const totalAmountLabel = computed(() => formatCurrency(booking.value.totalAmount))
const preferredDateLabel = computed(() => formatDisplayDate(booking.value.preferredDate))
const paymentStatusLabel = computed(() => formatStatusLabel(currentPaymentStatus.value))
const canUploadProof = computed(() => {
  return Boolean(
    booking.value.requestId &&
      hasKnownTotal.value &&
      ['unpaid', 'rejected', 'proof_submitted'].includes(currentPaymentStatus.value),
  )
})
const isProofSubmitted = computed(() => currentPaymentStatus.value === 'proof_submitted')
const isVerified = computed(() => currentPaymentStatus.value === 'verified')
const nextStepText = computed(() => {
  if (!booking.value.requestId) return 'Return to the package page and start the booking flow again.'
  if (!hasKnownTotal.value) return 'This request is inquiry-based. The Tourism Office will coordinate pricing with the representative.'
  if (isVerified.value) return 'Your payment proof has already been verified by staff.'
  if (isProofSubmitted.value) return 'Your proof has been submitted. Staff will verify your payment manually.'
  return 'Send payment through GCash, then upload proof of payment for staff verification.'
})
const proofSubmitLabel = computed(() => {
  if (isUploading.value) return 'Uploading...'
  if (isProofSubmitted.value) return 'Replace proof of payment'
  return 'Upload proof of payment'
})

function showPaymentInstructions() {
  isInstructionsVisible.value = true
  uploadMessage.value = ''
  uploadError.value = ''
}

function handleProofFileChange(event) {
  const [file] = Array.from(event.target.files || [])
  proofForm.file = file || null
  uploadMessage.value = ''
  uploadError.value = ''
}

async function uploadProof() {
  if (!booking.value.requestId) {
    uploadError.value = 'Booking reference is missing.'
    return
  }

  if (!proofForm.file) {
    uploadError.value = 'Choose a proof of payment file first.'
    return
  }

  isUploading.value = true
  uploadMessage.value = ''
  uploadError.value = ''

  try {
    const updated = await submitPackagePaymentProof(booking.value.requestId, {
      file: proofForm.file,
      paymentReferenceNumber: proofForm.paymentReferenceNumber,
      paymentNotes: proofForm.paymentNotes,
    })
    uploadedProof.value = updated.proofOfPayment || null
    currentPaymentStatus.value = updated.paymentStatus || 'proof_submitted'
    proofForm.file = null
    proofForm.paymentReferenceNumber = ''
    proofForm.paymentNotes = ''
    uploadMessage.value = 'Proof of payment uploaded. Staff will verify your payment manually.'
  } catch (error) {
    uploadError.value = error.message || 'Unable to upload proof of payment.'
  } finally {
    isUploading.value = false
  }
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toPositiveInteger(value) {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return null
  const integer = Math.trunc(parsed)
  return integer >= 1 ? integer : null
}

function isFiniteAmount(value) {
  const parsed = toFiniteNumber(value)
  return parsed !== null && parsed >= 0
}

function formatCurrency(value) {
  if (!isFiniteAmount(value)) return 'Price upon inquiry'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value))
}

function formatDisplayDate(value) {
  if (!value) return 'To be confirmed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatStatusLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
</script>

<template>
  <div class="payment-page">
    <PromotionNavbar />

    <main class="payment-shell">
      <section class="checkout-progress" aria-label="Booking progress">
        <div class="checkout-step checkout-step--done">
          <span>1</span>
          <strong>Choose booking</strong>
        </div>
        <div class="checkout-line"></div>
        <div class="checkout-step checkout-step--done">
          <span>2</span>
          <strong>Enter info</strong>
        </div>
        <div class="checkout-line"></div>
        <div class="checkout-step checkout-step--active">
          <span>3</span>
          <strong>Pay</strong>
        </div>
      </section>

      <section class="payment-layout">
        <article class="payment-card">
          <p class="section-kicker">Manual payment</p>
          <h1>GCash manual payment</h1>
          <p>
            Send payment manually through GCash, then upload your proof of payment.
            Staff will verify your proof before confirming the booking.
          </p>

          <div class="reference-panel">
            <span>Booking reference</span>
            <strong>{{ bookingReference }}</strong>
          </div>

          <div v-if="!hasKnownTotal" class="notice-panel">
            <span>Price upon inquiry</span>
            <p>{{ nextStepText }}</p>
          </div>

          <template v-else>
            <div class="payment-method">
              <div>
                <span>Payment method</span>
                <h2>GCash manual payment</h2>
                <p>Pay the exact amount due and include the booking reference in your payment note if possible.</p>
              </div>
              <strong>{{ totalAmountLabel }}</strong>
            </div>

            <button
              v-if="canUploadProof && !isInstructionsVisible && !isProofSubmitted"
              class="primary-button"
              type="button"
              @click="showPaymentInstructions"
            >
              Pay now
            </button>

            <section v-if="isInstructionsVisible || isProofSubmitted || isVerified" class="manual-payment-panel">
              <div class="qr-placeholder" aria-label="GCash QR placeholder">
                <span>GCash QR</span>
                <strong>Manual</strong>
              </div>

              <div class="instruction-copy">
                <span>Payment instructions</span>
                <h2>Scan or send payment using GCash</h2>
                <ul>
                  <li>Amount due: <strong>{{ totalAmountLabel }}</strong></li>
                  <li>Booking reference: <strong>{{ bookingReference }}</strong></li>
                  <li>Upload proof after sending payment.</li>
                  <li>Staff verification is manual and may take time.</li>
                </ul>
              </div>
            </section>

            <form
              v-if="canUploadProof && (isInstructionsVisible || isProofSubmitted)"
              class="proof-form"
              @submit.prevent="uploadProof"
            >
              <div>
                <span>Upload proof after sending payment</span>
                <h2>Proof of payment</h2>
              </div>

              <label>
                <span>Payment reference number</span>
                <input v-model.trim="proofForm.paymentReferenceNumber" type="text" placeholder="Optional" />
              </label>

              <label>
                <span>Proof file</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  @change="handleProofFileChange"
                />
              </label>

              <label>
                <span>Payment notes</span>
                <textarea v-model.trim="proofForm.paymentNotes" rows="3" placeholder="Optional"></textarea>
              </label>

              <p v-if="uploadMessage" class="message message--success">{{ uploadMessage }}</p>
              <p v-if="uploadError" class="message message--error">{{ uploadError }}</p>

              <button class="primary-button" type="submit" :disabled="isUploading">
                {{ proofSubmitLabel }}
              </button>
            </form>

            <div v-if="isProofSubmitted || uploadedProof" class="notice-panel notice-panel--success">
              <span>Proof submitted</span>
              <p>{{ nextStepText }}</p>
              <small v-if="uploadedProof">
                Uploaded file: {{ uploadedProof.originalFilename || 'Proof of payment' }}
              </small>
            </div>

            <div v-else-if="isVerified" class="notice-panel notice-panel--success">
              <span>Payment verified</span>
              <p>{{ nextStepText }}</p>
            </div>

            <p v-else-if="uploadMessage" class="message message--success">{{ uploadMessage }}</p>
          </template>

          <RouterLink class="status-link" to="/package-booking-status">
            Check this request later
          </RouterLink>
        </article>

        <aside class="payment-summary" aria-label="Payment summary">
          <span>Booking summary</span>
          <h2>{{ booking.packageName }}</h2>
          <dl>
            <div>
              <dt>Booking reference</dt>
              <dd>{{ bookingReference }}</dd>
            </div>
            <div>
              <dt>Preferred date</dt>
              <dd>{{ preferredDateLabel }}</dd>
            </div>
            <div>
              <dt>Selected pax</dt>
              <dd>{{ booking.selectedPax }} pax</dd>
            </div>
            <div>
              <dt>Amount due</dt>
              <dd>{{ totalAmountLabel }}</dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>{{ paymentStatusLabel }}</dd>
            </div>
          </dl>

          <div class="summary-next-step">
            <span>Next steps</span>
            <p>{{ nextStepText }}</p>
          </div>
        </aside>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.payment-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #14261f;
  font-family: Inter, system-ui, sans-serif;
}

.payment-shell {
  width: min(100% - 48px, 1120px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.checkout-progress {
  display: grid;
  grid-template-columns: auto minmax(60px, 1fr) auto minmax(60px, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 34px;
  padding: 18px;
  border: 1px solid #dfe5dd;
  border-radius: 8px;
  background: #ffffff;
}

.checkout-step {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #68736d;
  font-weight: 800;
}

.checkout-step span {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #eef1ed;
  color: #68736d;
  font-size: 13px;
}

.checkout-step--done span,
.checkout-step--active span {
  background: #1b4332;
  color: #ffffff;
}

.checkout-step--active {
  color: #1b4332;
}

.checkout-line {
  height: 2px;
  background: #dfe5dd;
}

.payment-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
}

.payment-card,
.payment-summary {
  padding: 28px;
  border: 1px solid #dfe5dd;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.payment-card {
  display: grid;
  gap: 20px;
}

.section-kicker,
.reference-panel span,
.payment-summary > span,
.payment-summary dt,
.payment-method span,
.manual-payment-panel span,
.proof-form span,
.notice-panel span,
.summary-next-step span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.payment-card h1,
.payment-card h2,
.payment-summary h2 {
  margin: 0;
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: 0;
}

.payment-card h1 {
  max-width: 720px;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.08;
}

.payment-card p,
.payment-method p,
.notice-panel p,
.summary-next-step p {
  margin: 0;
  color: #5c5c5c;
  line-height: 1.7;
}

.reference-panel,
.notice-panel,
.payment-method,
.manual-payment-panel,
.proof-form,
.summary-next-step {
  border-radius: 8px;
}

.reference-panel {
  display: grid;
  gap: 8px;
  padding: 18px;
  background: #f6f7f4;
}

.reference-panel strong {
  color: #14261f;
  font-size: 22px;
  overflow-wrap: anywhere;
}

.payment-method {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid #dfe5dd;
  background: #ffffff;
}

.payment-method div {
  display: grid;
  gap: 6px;
}

.payment-method strong {
  flex: 0 0 auto;
  color: #1b4332;
  font-size: 24px;
  font-weight: 900;
}

.manual-payment-panel {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border: 1px solid #dfe5dd;
  background: #f8f9f6;
}

.qr-placeholder {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(27, 67, 50, 0.08) 50%, transparent 50%),
    linear-gradient(rgba(27, 67, 50, 0.08) 50%, transparent 50%);
  background-size: 18px 18px;
  color: #1b4332;
  text-align: center;
}

.qr-placeholder strong {
  font-size: 22px;
}

.instruction-copy {
  display: grid;
  gap: 8px;
}

.instruction-copy ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
  color: #3f4d45;
  line-height: 1.55;
}

.proof-form {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dfe5dd;
  background: #ffffff;
}

.proof-form > div {
  display: grid;
  gap: 5px;
}

.proof-form label {
  display: grid;
  gap: 8px;
}

.proof-form input,
.proof-form textarea {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
}

.proof-form textarea {
  min-height: 96px;
  resize: vertical;
}

.proof-form input:focus,
.proof-form textarea:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

.primary-button {
  min-height: 50px;
  border: 0;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.message,
.notice-panel {
  margin: 0;
  padding: 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.55;
}

.message--error {
  background: #fdecea;
  color: #9f2d20;
  font-weight: 800;
}

.message--success,
.notice-panel--success {
  background: #e6f3ee;
  color: #1b4332;
}

.notice-panel {
  display: grid;
  gap: 6px;
  background: #fff8e6;
}

.notice-panel small {
  color: #1b4332;
  font-weight: 800;
}

.status-link {
  display: inline-flex;
  width: fit-content;
  color: #1b4332;
  font-weight: 800;
  text-decoration: none;
}

.payment-summary {
  align-self: start;
  position: sticky;
  top: 96px;
}

.payment-summary dl {
  display: grid;
  gap: 12px;
  margin: 22px 0;
}

.payment-summary dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf0ec;
}

.payment-summary dd {
  margin: 0;
  color: #14261f;
  font-weight: 800;
  text-align: right;
  overflow-wrap: anywhere;
}

.summary-next-step {
  display: grid;
  gap: 6px;
  padding: 14px;
  background: #f6f7f4;
}

@media (max-width: 880px) {
  .checkout-progress,
  .payment-layout {
    grid-template-columns: 1fr;
  }

  .checkout-line {
    display: none;
  }

  .payment-summary {
    position: static;
  }
}

@media (max-width: 640px) {
  .payment-shell {
    width: min(100% - 28px, 1120px);
    padding-top: 96px;
  }

  .payment-card,
  .payment-summary,
  .checkout-progress {
    padding: 18px;
  }

  .payment-method,
  .manual-payment-panel,
  .payment-summary dl > div {
    display: grid;
  }

  .payment-method strong,
  .payment-summary dd {
    text-align: left;
  }

  .manual-payment-panel {
    grid-template-columns: 1fr;
  }
}
</style>
