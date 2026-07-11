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
const representative = reactive({
  fullName: '',
  phoneNumber: '',
  email: '',
})
const message = ref('')

const initialPax = computed(() => toPositiveInteger(route.query.selectedPax) || 1)
const packageId = computed(() => String(route.query.packageId || tourismPackage.value?.apiId || ''))
const packageName = computed(() => String(tourismPackage.value?.name || route.query.packageName || 'Selected tourism package'))
const preferredDate = computed(() => String(route.query.preferredDate || ''))
const selectedPax = computed(() => participants.value.length || initialPax.value)
const maximumPax = computed(() => toPositiveInteger(tourismPackage.value?.maxPax))
const canAddParticipant = computed(() => !maximumPax.value || selectedPax.value < maximumPax.value)
const canRemoveParticipant = computed(() => selectedPax.value > initialPax.value)
const paymentRequired = computed(() => Boolean(tourismPackage.value?.paymentRequired ?? String(route.query.paymentRequired || '') === 'true'))
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
const preferredDateLabel = computed(() => formatDisplayDate(preferredDate.value))
const submitButtonLabel = computed(() => {
  if (isSubmitting.value) return 'Submitting...'
  if (paymentRequired.value && estimatedTotal.value !== null) return 'Go to Payment'
  return 'Submit booking request'
})

onMounted(async () => {
  initializeParticipants(initialPax.value)
  await loadPackage()
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

function initializeParticipants(count) {
  participants.value = Array.from({ length: Math.max(1, count) }, (_, index) => createParticipant(index + 1))
}

function createParticipant(order) {
  return {
    localId: `${Date.now()}-${order}-${Math.random().toString(16).slice(2)}`,
    fullName: '',
    age: '',
    gender: '',
    notes: '',
  }
}

function addParticipant() {
  if (!canAddParticipant.value) return
  participants.value.push(createParticipant(participants.value.length + 1))
}

function removeParticipant(index) {
  if (!canRemoveParticipant.value) return
  participants.value.splice(index, 1)
}

function validateForm() {
  if (!packageId.value) return 'Package details are missing. Go back to the package page and click Book Now again.'
  if (!preferredDate.value) return 'Preferred booking date is missing. Go back and choose a date first.'
  if (!representative.fullName.trim()) return 'Representative full name is required.'
  if (!representative.phoneNumber.trim()) return 'Representative contact number is required.'
  if (!representative.email.trim()) return 'Representative email address is required.'

  for (const [index, participant] of participants.value.entries()) {
    const label = `Participant ${index + 1}`
    if (!participant.fullName.trim()) return `${label} full name is required.`
    if (participant.age === '' || Number.isNaN(Number(participant.age))) return `${label} age is required.`
    const age = Number(participant.age)
    if (!Number.isInteger(age) || age < 0 || age > 130) return `${label} age must be from 0 to 130.`
    if (!participant.gender.trim()) return `${label} gender is required.`
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
      },
      participants: participants.value,
      preferredBookingDate: preferredDate.value,
      message: message.value,
    })

    submittedBooking.value = request
    if (request.paymentRequired && isFiniteAmount(request.totalAmount)) {
      router.push({
        name: 'promotion-package-booking-payment',
        params: { slug: props.slug },
        query: {
          requestId: request.id,
          packageName: request.packageName || packageName.value,
          selectedPax: String(request.selectedPax || selectedPax.value),
          preferredDate: request.preferredBookingDate || preferredDate.value,
          totalAmount: request.totalAmount == null ? '' : String(request.totalAmount),
          paymentStatus: request.paymentStatus || 'unpaid',
        },
      })
      return
    }

    submitMessage.value = 'Booking request submitted. The Tourism Office will review your request and contact the representative.'
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
            <h1>Participant details</h1>
            <p>
              Add the people included in this booking. The participant count is used as the final pax count for pricing.
            </p>
          </div>

          <section class="form-section" aria-labelledby="participants-title">
            <div class="section-head">
              <div>
                <h2 id="participants-title">Participant details</h2>
                <p>{{ selectedPax }} pax for this request</p>
              </div>
              <button class="secondary-button" type="button" :disabled="!canAddParticipant" @click="addParticipant">
                + Add participant
              </button>
            </div>

            <div class="participant-list">
              <article
                v-for="(participant, index) in participants"
                :key="participant.localId"
                class="participant-card"
              >
                <div class="participant-card__head">
                  <h3>Participant {{ index + 1 }}</h3>
                  <button
                    v-if="index >= initialPax"
                    type="button"
                    :disabled="!canRemoveParticipant"
                    @click="removeParticipant(index)"
                  >
                    Remove
                  </button>
                </div>

                <div class="field-grid">
                  <label>
                    <span>Full name</span>
                    <input v-model.trim="participant.fullName" type="text" autocomplete="name" required />
                  </label>
                  <label>
                    <span>Age</span>
                    <input v-model.number="participant.age" type="number" min="0" max="130" required />
                  </label>
                  <label>
                    <span>Gender</span>
                    <select v-model="participant.gender" required>
                      <option value="" disabled>Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label class="field-grid__wide">
                    <span>Notes or remarks</span>
                    <input v-model.trim="participant.notes" type="text" placeholder="Optional" />
                  </label>
                </div>
              </article>
            </div>
          </section>

          <section class="form-section" aria-labelledby="representative-title">
            <div class="section-head">
              <div>
                <h2 id="representative-title">Representative contact</h2>
                <p>One contact person will receive review and payment instructions.</p>
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
              <label class="field-grid__wide">
                <span>Email address</span>
                <input v-model.trim="representative.email" type="email" autocomplete="email" required />
              </label>
              <label class="field-grid__wide">
                <span>Message or special request</span>
                <textarea v-model.trim="message" rows="4"></textarea>
              </label>
            </div>
          </section>

          <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>
          <p v-if="submitMessage" class="message message--success">{{ submitMessage }}</p>

          <div v-if="submittedBooking" class="submitted-panel">
            <span>Booking reference</span>
            <strong>PKG-{{ submittedBooking.id }}</strong>
            <RouterLink to="/package-booking-status">Check this request later</RouterLink>
          </div>

          <button class="primary-button submit-button" type="submit" :disabled="isSubmitting || Boolean(submittedBooking)">
            {{ submitButtonLabel }}
          </button>
        </form>

        <aside class="booking-summary" aria-label="Selected booking summary">
          <span class="summary-label">Booking summary</span>
          <h2>{{ packageName }}</h2>

          <dl>
            <div>
              <dt>Preferred date</dt>
              <dd>{{ preferredDateLabel }}</dd>
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
              <dd>{{ paymentRequired ? 'Required later' : 'Inquiry basis' }}</dd>
            </div>
          </dl>

          <p v-if="isLoadingPackage" class="summary-note">Refreshing package pricing...</p>
          <p v-else-if="!packageId" class="summary-note">
            Some package details were not carried over. Return to the package page and choose Book Now again.
          </p>
          <p v-else class="summary-note">
            The backend will recalculate this amount when you submit, using the final participant count.
          </p>
        </aside>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
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

.section-head,
.participant-card__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.section-head h2,
.participant-card h3 {
  margin: 0;
  color: #14261f;
}

.secondary-button,
.participant-card__head button {
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

.secondary-button:disabled,
.participant-card__head button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.participant-list {
  display: grid;
  gap: 14px;
}

.participant-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e3e9e4;
  border-radius: 8px;
  background: #f8f9f6;
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
  position: sticky;
  top: 96px;
  padding: 24px;
}

.booking-summary h2 {
  font-size: 22px;
  line-height: 1.25;
}

.booking-summary dl {
  display: grid;
  gap: 12px;
  margin: 22px 0;
}

.booking-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf0ec;
}

.booking-summary dd {
  margin: 0;
  color: #14261f;
  font-weight: 800;
  text-align: right;
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
  .booking-info-layout,
  .field-grid {
    grid-template-columns: 1fr;
  }

  .checkout-line {
    display: none;
  }

  .booking-summary {
    position: static;
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

  .section-head,
  .participant-card__head {
    display: grid;
  }

  .booking-summary dl div {
    display: grid;
    gap: 6px;
  }

  .booking-summary dd {
    text-align: left;
  }
}
</style>
