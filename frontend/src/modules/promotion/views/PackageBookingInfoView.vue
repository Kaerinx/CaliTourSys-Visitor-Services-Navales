<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPackageById, submitPackageBookingRequest } from '../services/promotionService'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const router = useRouter()

const tourismPackage = ref(null)
const isLoadingPackage = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const submitMessage = ref('')
const submittedBooking = ref(null)
const participants = ref([])
const totalPax = ref(1)
const representative = reactive({
  fullName: '',
  phoneNumber: '',
  email: '',
  gender: '',
})
const message = ref('')
const paymentMode = ref('online')
const paymentPlan = ref('deposit_50')
const paymentMethod = ref('qr_instapay')

const initialPax = computed(() => toPositiveInteger(route.query.selectedPax) || 1)
const packageId = computed(() => String(route.query.packageId || tourismPackage.value?.apiId || ''))
const packageName = computed(() => String(tourismPackage.value?.name || route.query.packageName || 'Selected tourism package'))
const preferredDate = computed(() => String(route.query.preferredDate || ''))
const selectedPax = computed(() => toPositiveInteger(totalPax.value) || 1)
const maximumPax = computed(() => toPositiveInteger(tourismPackage.value?.maxPax))
const minimumPax = computed(() => toPositiveInteger(tourismPackage.value?.minPax) || 1)
const durationDays = computed(() => toPositiveInteger(tourismPackage.value?.durationDays) || 1)
const endDate = computed(() => addDays(preferredDate.value, durationDays.value - 1))
const canAddParticipant = computed(() => participants.value.length < Math.max(0, selectedPax.value - 1))
const paymentRequired = computed(() => Boolean(tourismPackage.value?.paymentRequired ?? String(route.query.paymentRequired || '') === 'true'))
const daysUntilDeparture = computed(() => calendarDayDifference(todayDate(), preferredDate.value))
const requiresFullPayment = computed(() => daysUntilDeparture.value !== null && daysUntilDeparture.value <= 3)
const isPayAtOffice = computed(() => paymentMode.value === 'pay_at_office')
const effectivePaymentPlan = computed(() => requiresFullPayment.value ? 'full_payment' : paymentPlan.value)
const effectivePaymentMethod = computed(() => isPayAtOffice.value ? 'cash' : paymentMethod.value)
const walkInPaymentDeadline = computed(() => addDays(preferredDate.value, -1))
const estimatedTotal = computed(() => {
  if (!tourismPackage.value) return toFiniteNumber(route.query.estimatedTotal)
  const basePrice = toFiniteNumber(tourismPackage.value.basePrice)
  if (!isFiniteAmount(basePrice)) return null
  const minPax = toPositiveInteger(tourismPackage.value.minPax) || 1
  const basePax = toPositiveInteger(tourismPackage.value.basePax) || minPax
  if (selectedPax.value <= basePax) return basePrice
  const extraPaxPrice = toFiniteNumber(tourismPackage.value.extraPaxPrice)
  if (!isFiniteAmount(extraPaxPrice)) return null
  return basePrice + (selectedPax.value - basePax) * extraPaxPrice
})
const estimatedTotalLabel = computed(() => {
  if (estimatedTotal.value === null) return 'Price upon inquiry'
  return formatCurrency(estimatedTotal.value)
})
const hasPayableAmount = computed(() => estimatedTotal.value !== null)
const preferredDateLabel = computed(() => formatDisplayDate(preferredDate.value))
const submitButtonLabel = computed(() => {
  if (isSubmitting.value) return 'Submitting...'
  if (hasPayableAmount.value && isPayAtOffice.value) return 'Book now - pay at office'
  if (hasPayableAmount.value) return 'Go to Payment'
  return 'Submit booking request'
})

onMounted(async () => {
  totalPax.value = initialPax.value
  await loadPackage()
})
const estimatedInitialDue = computed(() => {
  if (estimatedTotal.value === null) return null
  if (isPayAtOffice.value) return estimatedTotal.value
  return effectivePaymentPlan.value === 'deposit_50'
    ? Math.round(estimatedTotal.value * 50) / 100
    : estimatedTotal.value
})

async function loadPackage() {
  isLoadingPackage.value = true
  try {
    tourismPackage.value = await getPackageById(props.slug)
  } catch {
    tourismPackage.value = null
  } finally {
    isLoadingPackage.value = false
  }
}

function createParticipant(order) {
  return {
    localId: `${Date.now()}-${order}-${Math.random().toString(16).slice(2)}`,
    fullName: '',
    gender: '',
  }
}

function addParticipant() {
  if (!canAddParticipant.value) return
  participants.value.push(createParticipant(participants.value.length + 1))
}

function removeParticipant(index) {
  participants.value.splice(index, 1)
}

function normalizeTotalPax() {
  const maximum = maximumPax.value || 80
  totalPax.value = Math.min(maximum, Math.max(minimumPax.value, toPositiveInteger(totalPax.value) || 1))
  if (participants.value.length > totalPax.value - 1) {
    participants.value.splice(Math.max(0, totalPax.value - 1))
  }
}

function validateForm() {
  if (!packageId.value) return 'Package details are missing. Go back to the package page and click Book Now again.'
  if (!preferredDate.value) return 'Preferred booking date is missing. Go back and choose a date first.'
  if (!representative.fullName.trim()) return 'Representative full name is required.'
  if (!representative.phoneNumber.trim()) return 'Representative contact number is required.'
  if (!representative.email.trim()) return 'Representative email address is required.'
  if (!representative.gender) return 'Representative gender is required.'
  if (selectedPax.value < minimumPax.value) return `This package requires at least ${minimumPax.value} participants.`
  if (maximumPax.value && selectedPax.value > maximumPax.value) return `This package allows up to ${maximumPax.value} participants.`
  if (isPayAtOffice.value && daysUntilDeparture.value !== null && daysUntilDeparture.value < 1) {
    return 'Walk-in payment is available only when booking at least one day before departure.'
  }

  for (const [index, participant] of participants.value.entries()) {
    const hasName = Boolean(participant.fullName.trim())
    const hasGender = Boolean(participant.gender)
    if (hasName !== hasGender) return `Other participant ${index + 1} needs both a name and M/F selection.`
  }

  return ''
}

async function submitBookingInfo() {
  errorMessage.value = ''
  submitMessage.value = ''
  const validationError = validateForm()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    const request = await submitPackageBookingRequest(packagePayload(), {
      selectedPax: selectedPax.value,
      representativeContact: {
        fullName: representative.fullName,
        phoneNumber: representative.phoneNumber,
        email: representative.email,
        gender: representative.gender,
      },
      participants: participants.value.some((participant) => participant.fullName.trim())
        ? participants.value.filter((participant) => participant.fullName.trim())
        : undefined,
      preferredBookingDate: preferredDate.value,
      startDate: preferredDate.value,
      endDate: endDate.value,
      durationDays: durationDays.value,
      paymentMode: paymentMode.value,
      paymentPlan: isPayAtOffice.value ? 'full_payment' : effectivePaymentPlan.value,
      paymentMethod: effectivePaymentMethod.value,
      message: message.value,
    })

    submittedBooking.value = request
    if (
      isFiniteAmount(request.totalAmount) &&
      request.paymentMode !== 'pay_at_office' &&
      request.paymentMethod !== 'cash'
    ) {
      router.push({
        name: 'promotion-package-booking-payment',
        params: { slug: props.slug },
        query: {
          requestId: request.id,
          bookingReference: request.bookingReference || '',
          packageName: request.packageName || packageName.value,
          selectedPax: String(request.selectedPax || selectedPax.value),
          preferredDate: request.preferredBookingDate || preferredDate.value,
          totalAmount: request.totalAmount == null ? '' : String(request.totalAmount),
          paymentStatus: request.paymentStatus || 'unpaid',
          paymentPlan: request.paymentPlan || effectivePaymentPlan.value,
          paymentMethod: request.paymentMethod || effectivePaymentMethod.value,
          initialPaymentAmount: request.initialPaymentAmount == null ? '' : String(request.initialPaymentAmount),
          depositDueAt: request.depositDueAt || '',
          balanceDueAt: request.balanceDueAt || '',
        },
      })
      return
    }

    submitMessage.value = isPayAtOffice.value
      ? `Booking created as unpaid. Pay the full amount at the Tourism Office by ${formatDisplayDate(walkInPaymentDeadline.value)} so staff can approve it.`
      : 'Booking request submitted. The Tourism Office will review your request and contact the representative.'
  } catch (error) {
    errorMessage.value = error.message || 'Unable to submit booking request.'
  } finally {
    isSubmitting.value = false
  }
}

function packagePayload() {
  return {
    slug: props.slug,
    id: props.slug,
    apiId: packageId.value,
    name: packageName.value,
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

function addDays(value, days) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function todayDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function calendarDayDifference(from, to) {
  if (!from || !to) return null
  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T00:00:00Z`)
  return Math.round((toDate - fromDate) / 86400000)
}
</script>

<template>
  <div class="booking-info-page">
    <PromotionNavbar />

    <main class="booking-info-shell">
      <RouterLink class="back-link" :to="`/packages/${props.slug}`">Back to package</RouterLink>

      <section class="checkout-progress" aria-label="Booking progress">
        <div class="checkout-step checkout-step--done">
          <span>1</span>
          <strong>Choose booking</strong>
        </div>
        <div class="checkout-line"></div>
        <div class="checkout-step checkout-step--active">
          <span>2</span>
          <strong>Enter info</strong>
        </div>
        <div class="checkout-line"></div>
        <div class="checkout-step">
          <span>3</span>
          <strong>Pay</strong>
        </div>
      </section>

      <section class="booking-info-layout">
        <form class="booking-form-card" @submit.prevent="submitBookingInfo">
          <div class="form-heading">
            <p class="section-kicker">Enter info</p>
            <h1>Booking representative</h1>
            <p>
              Only one representative needs to provide complete contact details and will be responsible for payment.
            </p>
          </div>

          <section class="form-section" aria-labelledby="representative-title">
            <div class="section-head">
              <div>
                <h2 id="representative-title">Representative contact</h2>
                <p>This person is included in the total participant count.</p>
              </div>
            </div>

            <div class="field-grid">
              <label>
                <span>Representative name</span>
                <input v-model.trim="representative.fullName" type="text" autocomplete="name" required />
              </label>
              <label>
                <span>Contact number</span>
                <input v-model.trim="representative.phoneNumber" type="tel" autocomplete="tel" required />
              </label>
              <label>
                <span>Email address</span>
                <input v-model.trim="representative.email" type="email" autocomplete="email" required />
              </label>
              <label>
                <span>Gender</span>
                <select v-model="representative.gender" required>
                  <option value="" disabled>Select M or F</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </label>
              <label class="field-grid__wide">
                <span>Message or special request</span>
                <textarea v-model.trim="message" rows="4"></textarea>
              </label>
            </div>
          </section>

          <section class="form-section" aria-labelledby="participants-title">
            <div class="section-head">
              <div>
                <h2 id="participants-title">Group participants</h2>
                <p>Set the total pax. Other names are optional and use only one compact row each.</p>
              </div>
              <button class="secondary-button" type="button" :disabled="!canAddParticipant" @click="addParticipant">
                + Add name
              </button>
            </div>

            <label class="total-pax-field">
              <span>Total participants (including representative)</span>
              <input
                v-model="totalPax"
                type="number"
                :min="minimumPax"
                :max="maximumPax || 80"
                step="1"
                required
                @blur="normalizeTotalPax"
              />
            </label>

            <div v-if="participants.length" class="compact-participant-list">
              <div class="compact-participant-row compact-participant-row--head" aria-hidden="true">
                <span>Other participant name</span>
                <span>Gender</span>
                <span></span>
              </div>
              <div v-for="(participant, index) in participants" :key="participant.localId" class="compact-participant-row">
                <input v-model.trim="participant.fullName" type="text" :placeholder="`Participant ${index + 2} (optional)`" />
                <select v-model="participant.gender" :aria-label="`Participant ${index + 2} gender`">
                  <option value="">M/F</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
                <button type="button" aria-label="Remove participant row" @click="removeParticipant(index)">Remove</button>
              </div>
            </div>
            <p v-else class="participant-help">No other participant names added. You can still book using only the total pax count.</p>
          </section>

          <aside class="booking-summary" aria-label="Selected booking summary">
            <span class="summary-label">Booking summary</span>
            <h2>{{ packageName }}</h2>

            <dl>
              <div>
                <dt>Start date</dt>
                <dd>{{ preferredDateLabel }}</dd>
              </div>
              <div>
                <dt>End date</dt>
                <dd>{{ formatDisplayDate(endDate) }}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{{ durationDays }} {{ durationDays === 1 ? 'day' : 'days' }}</dd>
              </div>
              <div>
                <dt>Booking source</dt>
                <dd>Online / Website</dd>
              </div>
              <div>
                <dt>Selected pax</dt>
                <dd>{{ selectedPax }} pax</dd>
              </div>
              <div>
                <dt>Estimated total</dt>
                <dd>{{ estimatedTotalLabel }}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd v-if="hasPayableAmount && estimatedInitialDue !== null && isPayAtOffice">Full amount at office</dd>
                <dd v-else-if="hasPayableAmount && estimatedInitialDue !== null">{{ formatCurrency(estimatedInitialDue) }} initially</dd>
                <dd v-else>{{ paymentRequired ? 'Required later' : 'Inquiry basis' }}</dd>
              </div>
            </dl>

            <p v-if="isLoadingPackage" class="summary-note">Refreshing package pricing...</p>
            <p v-else-if="!packageId" class="summary-note">
              Some package details were not carried over. Return to the package page and choose Book Now again.
            </p>
          </aside>

          <section v-if="hasPayableAmount" class="form-section" aria-labelledby="payment-mode-title">
            <div class="section-head">
              <div>
                <h2 id="payment-mode-title">Mode of payment</h2>
                <p>Choose whether to pay at the Tourism Office or continue with an online payment.</p>
              </div>
            </div>

            <div class="payment-choice-grid">
              <label class="choice-card" :class="{ 'is-selected': isPayAtOffice }">
                <input v-model="paymentMode" type="radio" value="pay_at_office" />
                <span>
                  <strong>Walk-in payment</strong>
                  <small>Book now and pay the full amount in cash at the Tourism Office</small>
                </span>
              </label>
              <label class="choice-card" :class="{ 'is-selected': paymentMode === 'online' }">
                <input v-model="paymentMode" type="radio" value="online" />
                <span>
                  <strong>Pay online</strong>
                  <small>Choose QR / InstaPay or Credit/Debit Card</small>
                </span>
              </label>
            </div>

            <div v-if="isPayAtOffice" class="walk-in-payment-note">
              <strong>Your booking will be created immediately as unpaid.</strong>
              <span>
                Pay the full amount at the Tourism Office no later than
                {{ formatDisplayDate(walkInPaymentDeadline) }}. Staff will record the cash payment before approving the booking.
              </span>
            </div>
          </section>

          <section v-if="hasPayableAmount && !isPayAtOffice" class="form-section" aria-labelledby="payment-choice-title">
            <div class="section-head">
              <div>
                <h2 id="payment-choice-title">Payment method</h2>
                <p>Select how much to pay first, then choose QR / InstaPay or credit/debit card.</p>
              </div>
            </div>

            <div class="payment-choice-grid">
              <label class="choice-card" :class="{ 'is-selected': effectivePaymentPlan === 'deposit_50' }">
                <input v-model="paymentPlan" type="radio" value="deposit_50" :disabled="requiresFullPayment" />
                <span><strong>50% down payment</strong><small>{{ formatCurrency(estimatedTotal / 2) }} initially</small></span>
              </label>
              <label class="choice-card" :class="{ 'is-selected': effectivePaymentPlan === 'full_payment' }">
                <input v-model="paymentPlan" type="radio" value="full_payment" />
                <span><strong>Full payment</strong><small>{{ estimatedTotalLabel }}</small></span>
              </label>
            </div>
            <p v-if="requiresFullPayment" class="participant-help">Because departure is within 3 calendar days, full payment is required.</p>

            <div class="payment-choice-grid">
              <label class="choice-card" :class="{ 'is-selected': paymentMethod === 'qr_instapay' }">
                <input v-model="paymentMethod" type="radio" value="qr_instapay" />
                <span><strong>QR / InstaPay</strong><small>Use a supported wallet or bank app</small></span>
              </label>
              <label class="choice-card" :class="{ 'is-selected': paymentMethod === 'credit_debit_card' }">
                <input v-model="paymentMethod" type="radio" value="credit_debit_card" />
                <span><strong>Credit / Debit Card</strong><small>Continue through secure card checkout</small></span>
              </label>
            </div>
            <p class="participant-help">The initial online payment is due within 3 calendar days after booking. Authorized staff may extend it, but never beyond 5 calendar days from booking creation.</p>
          </section>

          <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>
          <p v-if="submitMessage" class="message message--success">{{ submitMessage }}</p>

          <div v-if="submittedBooking" class="submitted-panel">
            <span>Booking reference</span>
            <strong>{{ submittedBooking.bookingReference || `PKG-${submittedBooking.id}` }}</strong>
            <RouterLink to="/package-booking-status">Check this request later</RouterLink>
          </div>

          <button class="primary-button submit-button" type="submit" :disabled="isSubmitting || Boolean(submittedBooking)">
            {{ submitButtonLabel }}
          </button>
        </form>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

.booking-info-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #14261f;
  font-family: Inter, system-ui, sans-serif;
}

.booking-info-shell {
  width: min(100% - 48px, 1160px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.back-link {
  display: inline-flex;
  margin-bottom: 22px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
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

.booking-info-layout {
  display: block;
}

.booking-form-card,
.booking-summary {
  border: 1px solid #dfe5dd;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.booking-form-card {
  display: grid;
  gap: 22px;
  padding: 28px;
}

.section-kicker,
.summary-label,
.booking-summary dt,
.booking-form-card label span,
.submitted-panel span {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.form-heading h1,
.booking-summary h2 {
  margin: 8px 0 12px;
  color: #14261f;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: 0;
}

.form-heading h1 {
  max-width: 680px;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.08;
}

.form-heading p,
.section-head p {
  margin: 0;
  color: #5c5c5c;
  line-height: 1.65;
}

.form-section {
  display: grid;
  gap: 16px;
  padding-top: 22px;
  border-top: 1px solid #edf0ec;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.section-head h2 {
  margin: 0;
  color: #14261f;
}

.secondary-button {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.compact-participant-list {
  display: grid;
  gap: 8px;
}

.compact-participant-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px auto;
  gap: 10px;
  align-items: center;
}

.compact-participant-row--head {
  color: #6b746f;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.compact-participant-row button {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #d8b4ad;
  border-radius: 8px;
  background: #fff;
  color: #9f2d20;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.total-pax-field {
  max-width: 340px;
}

.participant-help {
  margin: 0;
  padding: 14px;
  border-radius: 8px;
  background: #f6f7f4;
  color: #5c5c5c;
  line-height: 1.55;
}

.payment-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.choice-card {
  display: flex;
  grid-template-columns: none;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.choice-card.is-selected {
  border-color: #1b4332;
  box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.12);
}

.choice-card input {
  width: 18px;
  min-height: 18px;
  accent-color: #1b4332;
}

.choice-card > span {
  display: grid;
  gap: 4px;
  color: #14261f;
  font-size: inherit;
  letter-spacing: normal;
  text-transform: none;
}

.choice-card small {
  color: #68736d;
}

.field-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 120px minmax(150px, 0.8fr);
  gap: 14px;
}

.field-grid__wide {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 8px;
}

input,
select,
textarea {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #ffffff;
  color: #14261f;
  font: inherit;
}

textarea {
  min-height: 112px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
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

.submit-button {
  width: 100%;
}

.message {
  margin: 0;
  padding: 13px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
}

.message--error {
  background: #fdecea;
  color: #9f2d20;
}

.message--success {
  background: #e6f3ee;
  color: #1b4332;
}

.submitted-panel {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #f6f7f4;
}

.submitted-panel strong {
  color: #14261f;
  font-size: 20px;
  overflow-wrap: anywhere;
}

.submitted-panel a {
  color: #1b4332;
  font-weight: 800;
  text-decoration: none;
}

.booking-summary {
  padding: 24px;
}

.walk-in-payment-note {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid #cbd8d0;
  border-radius: 8px;
  background: #e6f3ee;
  color: #1b4332;
  line-height: 1.55;
}

.booking-summary h2 {
  font-size: 22px;
  line-height: 1.25;
}

.booking-summary dl {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  margin: 22px 0;
  border: 1px solid #edf0ec;
  border-radius: 8px;
  background: #edf0ec;
  overflow: hidden;
}

.booking-summary dl div {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  background: #ffffff;
}

.booking-summary dd {
  margin: 0;
  color: #14261f;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.summary-note {
  margin: 0;
  padding: 14px;
  border-radius: 8px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.55;
}

@media (max-width: 920px) {
  .checkout-progress,
  .field-grid,
  .compact-participant-row,
  .payment-choice-grid {
    grid-template-columns: 1fr;
  }

  .checkout-line {
    display: none;
  }

  .booking-summary dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 560px) {
  .booking-info-shell {
    width: min(100% - 28px, 1160px);
    padding-top: 96px;
  }

  .booking-form-card,
  .booking-summary,
  .checkout-progress {
    padding: 18px;
  }

  .section-head {
    display: grid;
  }

  .booking-summary dl {
    grid-template-columns: 1fr;
  }
}
</style>
