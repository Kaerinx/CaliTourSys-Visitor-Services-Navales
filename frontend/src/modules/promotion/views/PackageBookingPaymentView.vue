<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import paymentQrImage from '@/assets/payments/tourism-office-qr-temporary.png'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getTouristBookingById } from '../services/promotionApi'
import { submitPackagePaymentProof } from '../services/promotionService'

defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const bookingRecord = ref(null)
const isLoading = ref(false)
const isUploading = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')
const selectedPaymentMethod = ref(normalizeOnlinePaymentMethod(route.query.paymentMethod))
const proofForm = reactive({
  file: null,
  paymentReferenceNumber: '',
  paymentNotes: '',
})
const cardForm = reactive({
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
})

const requestId = computed(() => String(route.query.requestId || ''))
const booking = computed(() => bookingRecord.value || {
  id: requestId.value,
  bookingReference: String(route.query.bookingReference || ''),
  packageName: String(route.query.packageName || 'Selected tourism package'),
  selectedPax: toPositiveInteger(route.query.selectedPax) || 1,
  startDate: String(route.query.preferredDate || ''),
  totalAmount: toFiniteNumber(route.query.totalAmount),
  initialPaymentAmount: toFiniteNumber(route.query.initialPaymentAmount),
  depositDueAt: String(route.query.depositDueAt || ''),
  balanceDueAt: String(route.query.balanceDueAt || ''),
  paymentPlan: String(route.query.paymentPlan || 'full_payment'),
  paymentMethod: String(route.query.paymentMethod || 'qr_instapay'),
  paymentStatus: String(route.query.paymentStatus || 'unpaid'),
  verifiedPaymentAmount: 0,
  pendingPaymentAmount: 0,
  appliedCreditAmount: 0,
})

const bookingReference = computed(() => {
  return booking.value.bookingReference || (booking.value.id ? `PKG-${booking.value.id}` : 'Missing reference')
})
const hasKnownTotal = computed(() => isFiniteAmount(booking.value.totalAmount))
const totalAmountLabel = computed(() => formatCurrency(booking.value.totalAmount))
const preferredDateLabel = computed(() => formatDisplayDate(booking.value.startDate || booking.value.preferredBookingDate))
const paymentStatusLabel = computed(() => formatStatusLabel(booking.value.paymentStatus))
const verifiedAmount = computed(() => Number(booking.value.verifiedPaymentAmount || 0) + Number(booking.value.appliedCreditAmount || 0))
const pendingAmount = computed(() => Number(booking.value.pendingPaymentAmount || 0))
const creditedOrPendingAmount = computed(() => verifiedAmount.value + pendingAmount.value)
const remainingAmount = computed(() => Math.max(0, Number(booking.value.totalAmount || 0) - creditedOrPendingAmount.value))
const amountDue = computed(() => {
  if (!hasKnownTotal.value || pendingAmount.value > 0 || remainingAmount.value <= 0) return 0
  if (verifiedAmount.value > 0) return remainingAmount.value
  return Math.min(Number(booking.value.initialPaymentAmount || booking.value.totalAmount || 0), remainingAmount.value)
})
const isDepositPayment = computed(() => booking.value.paymentPlan === 'deposit_50' && verifiedAmount.value === 0)
const paymentStageLabel = computed(() => {
  if (pendingAmount.value > 0) return 'Pending verification'
  if (booking.value.paymentPlan === 'deposit_50') return '50% online payment'
  if (booking.value.paymentMode === 'pay_at_office' || booking.value.paymentMethod === 'cash') return 'Pay at office'
  return 'Full payment'
})
const isPayAtOffice = computed(() => booking.value.paymentMode === 'pay_at_office' || booking.value.paymentMethod === 'cash')
const canMakePayment = computed(() => {
  return Boolean(
      booking.value.id &&
      !isPayAtOffice.value &&
      hasKnownTotal.value &&
      amountDue.value > 0 &&
      pendingAmount.value === 0 &&
      !['cancelled', 'declined', 'expired'].includes(booking.value.bookingStatus),
  )
})
const isCardSelected = computed(() => selectedPaymentMethod.value === 'credit_debit_card')
const canUploadProof = computed(() => canMakePayment.value && selectedPaymentMethod.value === 'qr_instapay')
const isProofSubmitted = computed(() => pendingAmount.value > 0 || booking.value.paymentStatus === 'proof_submitted')
const isPaid = computed(() => verifiedAmount.value >= Number(booking.value.totalAmount || 0) && hasKnownTotal.value)
const nextStepText = computed(() => {
  if (!booking.value.id) return 'Return to the package page and start the booking flow again.'
  if (isPayAtOffice.value) return `Pay the full amount in cash at the Tourism Office by ${formatDisplayDate(booking.value.depositDueAt)}. Staff will record payment before approving this booking.`
  if (!hasKnownTotal.value) return 'This request is inquiry-based. The Tourism Office will coordinate pricing with the representative.'
  if (isProofSubmitted.value) return 'Your proof has been submitted. Staff will verify your payment manually.'
  if (isPaid.value) return 'Your booking is fully paid.'
  if (verifiedAmount.value > 0) return 'Your initial payment is verified. Pay the remaining balance by the balance deadline.'
  if (isCardSelected.value) return 'Secure card checkout is not connected yet. Choose QR / InstaPay to complete this payment now.'
  return `Pay ${formatCurrency(amountDue.value)} through QR / InstaPay, then upload proof for staff verification.`
})
const proofSubmitLabel = computed(() => {
  if (isUploading.value) return 'Uploading...'
  return 'Post booking'
})

onMounted(loadBooking)

async function loadBooking() {
  if (!requestId.value) return
  isLoading.value = true
  uploadError.value = ''
  try {
    const response = await getTouristBookingById(requestId.value)
    bookingRecord.value = response.data
    selectedPaymentMethod.value = normalizeOnlinePaymentMethod(response.data.paymentMethod)
    if (!cardForm.cardholderName) {
      cardForm.cardholderName = response.data.representative?.fullName || response.data.visitor?.fullName || ''
    }
  } catch (error) {
    uploadError.value = error.message || 'Unable to refresh payment details.'
  } finally {
    isLoading.value = false
  }
}

function handleProofFileChange(event) {
  const [file] = Array.from(event.target.files || [])
  proofForm.file = file || null
  uploadMessage.value = ''
  uploadError.value = ''
}

async function uploadProof() {
  if (!booking.value.id) {
    uploadError.value = 'Booking reference is missing.'
    return
  }

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
      paymentMethod: selectedPaymentMethod.value,
      paymentReferenceNumber: proofForm.paymentReferenceNumber,
      paymentNotes: proofForm.paymentNotes,
    })
    proofForm.file = null
    proofForm.paymentReferenceNumber = ''
    proofForm.paymentNotes = ''
    uploadMessage.value = 'Proof of payment uploaded. Staff will verify your payment manually.'
    await loadBooking()
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

function normalizeOnlinePaymentMethod(value) {
  return String(value || '') === 'credit_debit_card' ? 'credit_debit_card' : 'qr_instapay'
}

function formatCardNumberInput(event) {
  const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 19)
  cardForm.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim()
  event.target.value = cardForm.cardNumber
}

function formatExpiryInput(event) {
  const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 4)
  cardForm.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  event.target.value = cardForm.expiry
}

function formatCvcInput(event) {
  cardForm.cvc = String(event.target.value || '').replace(/\D/g, '').slice(0, 4)
  event.target.value = cardForm.cvc
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
          <p class="section-kicker">Payment method</p>
          <h1>Complete your payment</h1>
          <p v-if="isPayAtOffice">
            This booking is set for cash payment at the Tourism Office. Online payment and proof upload are not required.
          </p>
          <p v-else>
            Choose QR / InstaPay or credit/debit card. QR payments require proof for staff verification;
            card payments must use a secure payment provider.
          </p>

          <div class="reference-panel">
            <span>Booking reference</span>
            <strong>{{ bookingReference }}</strong>
          </div>

          <div v-if="!hasKnownTotal" class="notice-panel">
            <span>Price upon inquiry</span>
            <p>{{ nextStepText }}</p>
          </div>

          <p v-if="isLoading" class="notice-panel">Refreshing payment totals...</p>
          <p v-if="uploadError && !canUploadProof" class="message message--error">{{ uploadError }}</p>

          <template v-if="hasKnownTotal">
            <div class="payment-method">
              <div>
                <span>{{ isDepositPayment ? '50% down payment' : verifiedAmount > 0 ? 'Remaining balance' : 'Full payment' }}</span>
                <h2>Amount due now: {{ formatCurrency(amountDue) }}</h2>
                <p>Total package price: {{ totalAmountLabel }}</p>
              </div>
              <strong>{{ paymentStageLabel }}</strong>
            </div>

            <div v-if="isPayAtOffice" class="notice-panel">
              <span>Walk-in payment selected</span>
              <p>{{ nextStepText }}</p>
            </div>

            <div v-if="canMakePayment" class="method-selector" aria-label="Payment method">
              <label :class="{ 'is-selected': selectedPaymentMethod === 'qr_instapay' }">
                <input v-model="selectedPaymentMethod" type="radio" value="qr_instapay" />
                <span><strong>QR / InstaPay</strong><small>Wallet or bank app</small></span>
              </label>
              <label :class="{ 'is-selected': selectedPaymentMethod === 'credit_debit_card' }">
                <input v-model="selectedPaymentMethod" type="radio" value="credit_debit_card" />
                <span><strong>Credit / Debit Card</strong><small>Secure card checkout</small></span>
              </label>
            </div>

            <section v-if="canUploadProof" class="manual-payment-panel">
              <img class="qr-image" :src="paymentQrImage" alt="Temporary QR InstaPay payment code" />

              <div class="instruction-copy">
                <span>Payment instructions</span>
                <h2>Scan using a supported wallet or bank app</h2>
                <ul>
                  <li>Exact amount: <strong>{{ formatCurrency(amountDue) }}</strong></li>
                  <li>Booking reference: <strong>{{ bookingReference }}</strong></li>
                  <li>Upload proof after sending payment.</li>
                  <li>Staff verification is manual and may take time.</li>
                </ul>
              </div>
            </section>

            <section v-if="canMakePayment && isCardSelected" class="card-checkout-panel">
              <div class="card-checkout-panel__heading">
                <div>
                  <span>Secure card checkout</span>
                  <h2>Credit / Debit Card</h2>
                </div>
                <div class="card-brands" aria-label="Supported card networks will be determined by the payment provider">
                  <span>VISA</span>
                  <span>Mastercard</span>
                </div>
              </div>
              <form class="card-fields" autocomplete="off" @submit.prevent>
                <label class="card-field card-field--full">
                  <span>Card holder name *</span>
                  <input
                    v-model.trim="cardForm.cardholderName"
                    type="text"
                    autocomplete="off"
                    placeholder="Name on card"
                  />
                </label>
                <label class="card-field card-field--full">
                  <span>Credit/debit card number *</span>
                  <input
                    :value="cardForm.cardNumber"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="23"
                    placeholder="Card Number"
                    @input="formatCardNumberInput"
                  />
                </label>
                <label class="card-field">
                  <span>Expiry date *</span>
                  <input
                    :value="cardForm.expiry"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="5"
                    placeholder="MM/YY"
                    @input="formatExpiryInput"
                  />
                </label>
                <label class="card-field">
                  <span>CVC/CVV *</span>
                  <input
                    :value="cardForm.cvc"
                    type="password"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="4"
                    placeholder="CVC/CVV"
                    @input="formatCvcInput"
                  />
                </label>
              </form>
              <div class="card-gateway-notice">
                <strong>Prototype only — do not enter real card details.</strong>
                <p>
                  These temporary fields are not submitted or stored. A PCI-compliant provider must replace them
                  with hosted, tokenized fields before card payments are activated.
                </p>
              </div>
              <button class="primary-button" type="button" disabled>Secure card gateway not connected</button>
              <small>Choose QR / InstaPay above if you want to complete the payment now.</small>
            </section>

            <form
              v-if="canUploadProof"
              class="proof-form"
              @submit.prevent="uploadProof"
            >
              <div>
                <span>Upload proof after sending payment</span>
                <h2>Proof of payment</h2>
              </div>

              <label>
                <span>Payment reference number</span>
                <input v-model.trim="proofForm.paymentReferenceNumber" type="text" required />
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

            <div v-if="isProofSubmitted" class="notice-panel notice-panel--success">
              <span>Proof submitted</span>
              <p>{{ nextStepText }}</p>
              <small>Pending verification: {{ formatCurrency(pendingAmount) }}</small>
            </div>

            <div v-else-if="isPaid" class="notice-panel notice-panel--success">
              <span>Fully paid</span>
              <p>{{ nextStepText }}</p>
            </div>

            <p v-else-if="uploadMessage" class="message message--success">{{ uploadMessage }}</p>

            <div class="deadline-panel">
              <div><span>{{ booking.paymentPlan === 'deposit_50' ? 'Deposit deadline' : 'Payment deadline' }}</span><strong>{{ formatDisplayDate(booking.depositDueAt) }}</strong></div>
              <div v-if="booking.paymentPlan === 'deposit_50'"><span>Balance deadline</span><strong>{{ booking.balanceDueAt ? formatDisplayDate(booking.balanceDueAt) : 'Not applicable' }}</strong></div>
            </div>
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
              <dt>Total price</dt>
              <dd>{{ totalAmountLabel }}</dd>
            </div>
            <div><dt>Verified / credited</dt><dd>{{ formatCurrency(verifiedAmount) }}</dd></div>
            <div><dt>Pending verification</dt><dd>{{ formatCurrency(pendingAmount) }}</dd></div>
            <div><dt>Remaining balance</dt><dd>{{ formatCurrency(remainingAmount) }}</dd></div>
            <div><dt>Due now</dt><dd>{{ formatCurrency(amountDue) }}</dd></div>
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
.deadline-panel span,
.summary-next-step span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.method-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.method-selector label {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  cursor: pointer;
}

.method-selector label.is-selected {
  border-color: #1b4332;
  box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.12);
}

.method-selector input {
  accent-color: #1b4332;
}

.method-selector label span {
  display: grid;
  gap: 3px;
}

.method-selector small {
  color: #68736d;
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

.qr-image {
  width: 100%;
  border: 1px solid #dfe5dd;
  border-radius: 8px;
  background: #fff;
}

.placeholder-warning {
  padding: 9px;
  border-radius: 6px;
  background: #fff3cd;
  color: #7a4b08 !important;
  font-size: 12px;
  font-weight: 700;
}

.card-checkout-panel {
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid #dfe5dd;
  border-radius: 8px;
  background: #ffffff;
}

.card-checkout-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.card-checkout-panel__heading > div:first-child {
  display: grid;
  gap: 5px;
}

.card-brands {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.card-brands span {
  padding: 7px 10px;
  border: 1px solid #d5ddd6;
  border-radius: 5px;
  background: #f8f9f6;
  color: #1b4332;
  font-size: 12px;
  font-weight: 900;
}

.card-gateway-notice {
  display: grid;
  gap: 7px;
  padding: 16px;
  border-radius: 7px;
  background: #eef6f1;
}

.card-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 14px;
  padding-top: 4px;
}

.card-field {
  position: relative;
  display: block;
}

.card-field--full {
  grid-column: 1 / -1;
}

.card-field span {
  position: absolute;
  z-index: 1;
  top: -9px;
  left: 13px;
  padding: 0 5px;
  background: #ffffff;
  color: #317d4c;
  font-size: 12px;
  line-height: 18px;
}

.card-field input {
  width: 100%;
  min-height: 54px;
  padding: 13px 16px;
  border: 1px solid #cfd8d1;
  border-radius: 7px;
  background: #ffffff;
  color: #26342d;
  font: inherit;
  font-size: 17px;
  outline: none;
}

.card-field input::placeholder {
  color: #7a7f7c;
}

.card-field input:focus {
  border-color: #317d4c;
  box-shadow: 0 0 0 2px rgba(49, 125, 76, 0.12);
}

.card-gateway-notice strong {
  color: #1b4332;
}

.card-gateway-notice p,
.card-checkout-panel small {
  margin: 0;
  color: #5c5c5c;
  line-height: 1.6;
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

.deadline-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.deadline-panel div {
  display: grid;
  gap: 5px;
  padding: 14px;
  border-radius: 8px;
  background: #f6f7f4;
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
  .method-selector,
  .deadline-panel,
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

  .card-checkout-panel__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-brands {
    justify-content: flex-start;
  }

  .card-fields {
    grid-template-columns: 1fr;
  }

  .card-field--full {
    grid-column: auto;
  }
}
</style>
