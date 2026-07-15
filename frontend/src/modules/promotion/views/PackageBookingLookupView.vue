<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import {
  lookupPackageBookingRequest,
  submitPackagePaymentProof,
} from '../services/promotionService'
import { computed, ref } from 'vue'

const lookupForm = ref({
  bookingReference: '',
  email: '',
  phoneNumber: '',
})
const proofForm = ref({
  paymentReferenceNumber: '',
  paymentNotes: '',
})
const result = ref(null)
const proofFile = ref(null)
const isLookingUp = ref(false)
const isUploadingProof = ref(false)
const errorMessage = ref('')
const proofMessage = ref('')
const proofError = ref('')

const canSubmitLookup = computed(() => {
  return Boolean(
    lookupForm.value.bookingReference.trim() &&
      (lookupForm.value.email.trim() || lookupForm.value.phoneNumber.trim()),
  )
})
const hasKnownTotal = computed(() => isFiniteAmount(result.value?.totalAmount))
const canUploadPaymentProof = computed(() => {
  return Boolean(
    result.value?.id &&
      result.value.paymentRequired &&
      result.value.paymentMode !== 'pay_at_office' &&
      result.value.paymentMethod !== 'cash' &&
      hasKnownTotal.value &&
      ['unpaid', 'rejected'].includes(result.value.paymentStatus),
  )
})
const proofStatusLabel = computed(() => {
  if (!result.value?.proofOfPayment) return 'No proof submitted'
  return `Submitted ${formatDisplayDate(result.value.proofOfPayment.uploadedAt)}`
})
const nextSteps = computed(() => {
  if (!result.value) return ''
  if (result.value.paymentMode === 'pay_at_office' || result.value.paymentMethod === 'cash') {
    return `Pay the full amount at the Tourism Office by ${formatDisplayDate(result.value.depositDueAt)}. Staff will record the cash payment and approve the booking after payment.`
  }
  if (canUploadPaymentProof.value && !result.value.proofOfPayment) {
    return 'Send payment using the instructions below, then upload proof for manual staff verification.'
  }
  if (result.value.proofOfPayment && result.value.paymentStatus !== 'verified') {
    return 'Your proof has been submitted. Staff will verify it manually and update the payment status.'
  }
  if (!hasKnownTotal.value) {
    return 'The Tourism Office will coordinate pricing and next steps using your submitted contact details.'
  }
  return 'The Tourism Office will continue reviewing your request and contact you when there is an update.'
})

async function performLookup({ keepMessages = false } = {}) {
  if (!canSubmitLookup.value) {
    errorMessage.value = 'Enter a booking reference and either email address or phone number.'
    return
  }

  isLookingUp.value = true
  errorMessage.value = ''
  if (!keepMessages) {
    proofMessage.value = ''
    proofError.value = ''
  }

  try {
    result.value = await lookupPackageBookingRequest(lookupForm.value)
  } catch (error) {
    result.value = null
    errorMessage.value = error.message || 'No booking request matched those details.'
  } finally {
    isLookingUp.value = false
  }
}

function handleProofFileChange(event) {
  const [file] = Array.from(event.target.files || [])
  proofFile.value = file || null
  proofMessage.value = ''
  proofError.value = ''
}

async function uploadProof() {
  if (!result.value?.id) return
  if (!proofFile.value) {
    proofError.value = 'Choose a proof of payment file first.'
    return
  }

  isUploadingProof.value = true
  proofMessage.value = ''
  proofError.value = ''

  try {
    await submitPackagePaymentProof(result.value.id, {
      file: proofFile.value,
      ...proofForm.value,
    })
    proofFile.value = null
    proofForm.value = {
      paymentReferenceNumber: '',
      paymentNotes: '',
    }
    proofMessage.value = 'Proof of payment uploaded. Staff will verify it manually.'
    await performLookup({ keepMessages: true })
  } catch (error) {
    proofError.value = error.message || 'Unable to upload proof of payment.'
  } finally {
    isUploadingProof.value = false
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
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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
  <div class="booking-lookup-page">
    <PromotionNavbar />

    <main class="page-shell">
      <section class="lookup-hero">
        <div>
          <p class="eyebrow">Package booking status</p>
          <h1>Check your booking request</h1>
          <p>
            Enter your booking reference plus the email address or phone number used in the request.
          </p>
        </div>
      </section>

      <section class="lookup-layout">
        <form class="lookup-card" @submit.prevent="performLookup()">
          <div>
            <p class="eyebrow">Find request</p>
            <h2>Booking details</h2>
          </div>

          <label>
            <span>Booking reference</span>
            <input
              v-model.trim="lookupForm.bookingReference"
              placeholder="PKG-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
            />
          </label>

          <label>
            <span>Email address</span>
            <input v-model.trim="lookupForm.email" type="email" autocomplete="email" />
          </label>

          <label>
            <span>Phone number</span>
            <input v-model.trim="lookupForm.phoneNumber" type="tel" autocomplete="tel" />
          </label>

          <p class="privacy-note">A matching email or phone number is required before details are shown.</p>

          <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

          <button class="primary-button" type="submit" :disabled="isLookingUp || !canSubmitLookup">
            {{ isLookingUp ? 'Checking...' : 'Check status' }}
          </button>
        </form>

        <section v-if="result" class="result-card">
          <div class="result-card__head">
            <div>
              <p class="eyebrow">Booking reference</p>
              <h2>{{ result.bookingReference }}</h2>
            </div>
            <span>{{ formatStatusLabel(result.bookingStatus) }}</span>
          </div>

          <dl class="status-grid">
            <div>
              <dt>Package</dt>
              <dd>{{ result.packageName }}</dd>
            </div>
            <div>
              <dt>Selected pax</dt>
              <dd>{{ result.selectedPax }} pax</dd>
            </div>
            <div>
              <dt>Preferred date</dt>
              <dd>{{ formatDisplayDate(result.preferredBookingDate) }}</dd>
            </div>
            <div>
              <dt>Estimated total</dt>
              <dd>{{ formatCurrency(result.totalAmount) }}</dd>
            </div>
            <div>
              <dt>Booking status</dt>
              <dd>{{ formatStatusLabel(result.bookingStatus) }}</dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>{{ formatStatusLabel(result.paymentStatus) }}</dd>
            </div>
            <div>
              <dt>Payment mode</dt>
              <dd>{{ result.paymentMode === 'pay_at_office' ? 'Walk-in payment' : 'Pay online' }}</dd>
            </div>
            <div>
              <dt>Proof upload status</dt>
              <dd>{{ proofStatusLabel }}</dd>
            </div>
            <div v-if="result.pricingNote">
              <dt>Pricing note</dt>
              <dd>{{ result.pricingNote }}</dd>
            </div>
          </dl>

          <div class="next-steps">
            <span>Next steps</span>
            <p>{{ nextSteps }}</p>
          </div>

          <div v-if="canUploadPaymentProof" class="payment-panel">
            <div>
              <span>Payment instructions</span>
              <p>{{ result.paymentInstruction }}</p>
              <strong>Amount due: {{ formatCurrency(result.totalAmount) }}</strong>
            </div>

            <label>
              <span>Payment reference number</span>
              <input v-model.trim="proofForm.paymentReferenceNumber" type="text" />
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

            <p v-if="proofMessage" class="message message--success">{{ proofMessage }}</p>
            <p v-if="proofError" class="message message--error">{{ proofError }}</p>

            <button class="secondary-button" type="button" :disabled="isUploadingProof" @click="uploadProof">
              {{ isUploadingProof ? 'Uploading...' : 'Upload proof of payment' }}
            </button>
          </div>

          <p v-else-if="proofMessage" class="message message--success">{{ proofMessage }}</p>
        </section>

        <section v-else class="result-placeholder">
          <p class="eyebrow">Status result</p>
          <h2>Your request details will appear here.</h2>
          <p>For privacy, booking details are only shown when the reference and contact detail match.</p>
        </section>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.booking-lookup-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

.page-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.lookup-hero,
.lookup-card,
.result-card,
.result-placeholder {
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 38px rgba(20, 38, 31, 0.06);
}

.lookup-hero {
  padding: 34px;
}

.lookup-hero > div {
  max-width: 760px;
}

.eyebrow {
  margin: 0;
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 8px 0 0;
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.15;
}

h1 {
  font-size: clamp(36px, 5vw, 58px);
}

h2 {
  font-size: 24px;
}

.lookup-hero p:last-child,
.result-placeholder p {
  margin: 14px 0 0;
  color: #5c5c5c;
  line-height: 1.65;
}

.lookup-layout {
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
  align-items: start;
  gap: 22px;
  margin-top: 22px;
}

.lookup-card,
.result-card,
.result-placeholder {
  display: grid;
  gap: 16px;
  padding: 24px;
}

label {
  display: grid;
  gap: 8px;
}

label span,
dt,
.next-steps span,
.payment-panel span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

input,
textarea {
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #1b4332;
  outline: 3px solid rgba(27, 67, 50, 0.14);
}

.privacy-note {
  margin: 0;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.55;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #1b4332;
  color: #ffffff;
}

.secondary-button {
  border: 1px solid #1b4332;
  background: #ffffff;
  color: #1b4332;
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
}

.message--error {
  background: #fdecea;
  color: #9f2d20;
}

.message--success {
  background: #e6f3ee;
  color: #1b4332;
}

.result-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e4dc;
}

.result-card__head span {
  flex: 0 0 auto;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.status-grid div,
.next-steps,
.payment-panel {
  padding: 14px;
  border-radius: 8px;
  background: #f6f7f4;
}

dd {
  margin: 5px 0 0;
  color: #14261f;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.next-steps {
  border-left: 4px solid #1b4332;
}

.next-steps p,
.payment-panel p {
  margin: 6px 0 0;
  color: #5c5c5c;
  line-height: 1.6;
}

.payment-panel {
  display: grid;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #dce6df;
}

.payment-panel strong {
  display: block;
  margin-top: 10px;
  color: #14261f;
}

@media (max-width: 900px) {
  .lookup-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100% - 32px, 1200px);
    padding-top: 96px;
  }

  .lookup-hero,
  .lookup-card,
  .result-card,
  .result-placeholder {
    padding: 20px;
  }

  .result-card__head {
    flex-direction: column;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
