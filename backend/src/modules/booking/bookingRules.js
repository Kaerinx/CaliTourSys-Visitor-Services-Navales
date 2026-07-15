const DAY_MS = 24 * 60 * 60 * 1000

const BOOKING_SOURCES = Object.freeze(['online', 'walk_in'])
const PAYMENT_MODES = Object.freeze(['pay_at_office', 'online'])
const PAYMENT_PLANS = Object.freeze(['deposit_50', 'full_payment', 'not_required'])
// bank_transfer remains accepted so historical bookings can still be read and maintained.
const PAYMENT_METHODS = Object.freeze(['cash', 'qr_instapay', 'credit_debit_card', 'bank_transfer'])
const GENDERS = Object.freeze(['M', 'F'])
const ACTIVE_CAPACITY_STATUSES = Object.freeze(['pending', 'reviewed', 'approved', 'rescheduled'])

function businessRuleError(message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'BOOKING_RULE_VIOLATION'
  error.publicMessage = message
  return error
}

function roundMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) {
    throw businessRuleError('Payment amount must be zero or higher.')
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

function normalizeGender(value) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'M' || normalized === 'MALE') return 'M'
  if (normalized === 'F' || normalized === 'FEMALE') return 'F'
  return null
}

function requireGender(value, fieldLabel = 'Gender') {
  const gender = normalizeGender(value)
  if (!gender) throw businessRuleError(`${fieldLabel} must be M or F.`)
  return gender
}

function deriveDurationDays(estimatedDuration) {
  const value = String(estimatedDuration || '').trim()
  const dayMatch = value.match(/^(\d+)\s+days?/i)
  if (dayMatch) return Math.max(1, Number(dayMatch[1]))
  if (/^(half|full)\s+day$/i.test(value)) return 1
  if (/^\d+\s+hours?$/i.test(value)) return 1
  return null
}

function parseDateOnly(value, fieldLabel = 'Date') {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw businessRuleError(`${fieldLabel} must use YYYY-MM-DD format.`)
  }
  const date = new Date(`${text}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw businessRuleError(`${fieldLabel} must be a valid calendar date.`)
  }
  return date
}

function addDateOnlyDays(value, days) {
  const date = parseDateOnly(value)
  date.setUTCDate(date.getUTCDate() + Number(days))
  return date.toISOString().slice(0, 10)
}

function calendarDayDifference(fromDate, toDate) {
  return Math.round((parseDateOnly(toDate).getTime() - parseDateOnly(fromDate).getTime()) / DAY_MS)
}

function manilaDateString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw businessRuleError('Booking creation time is invalid.')
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function buildSchedule({ startDate, durationDays, endDate }) {
  parseDateOnly(startDate, 'Start date')
  const duration = Number(durationDays)
  if (!Number.isInteger(duration) || duration < 1) {
    throw businessRuleError('Duration must be at least 1 day.')
  }

  const calculatedEndDate = addDateOnlyDays(startDate, duration - 1)
  if (endDate && endDate !== calculatedEndDate) {
    throw businessRuleError('End date must match the start date and duration.')
  }

  return {
    startDate,
    endDate: calculatedEndDate,
    durationDays: duration,
  }
}

function requireCurrentOrFutureStartDate(startDate, now = new Date()) {
  parseDateOnly(startDate, 'Start date')
  if (calendarDayDifference(manilaDateString(now), startDate) < 0) {
    throw businessRuleError('Start date cannot be in the past.')
  }
  return startDate
}

function validatePaymentMethod(bookingSource, paymentMethod) {
  if (!BOOKING_SOURCES.includes(bookingSource)) {
    throw businessRuleError('Booking source must be Online or Walk-in.')
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw businessRuleError('Select Cash, QR/InstaPay, or Credit/Debit Card.')
  }
  return paymentMethod
}

function calculatePaymentTerms({
  totalAmount,
  paymentRequired = true,
  paymentPlan = 'full_payment',
  bookingSource = 'online',
  paymentMethod = bookingSource === 'walk_in' ? 'cash' : 'qr_instapay',
  paymentMode = paymentMethod === 'cash' ? 'pay_at_office' : 'online',
  startDate,
  endDate,
  createdAt = new Date(),
}) {
  const total = roundMoney(totalAmount || 0)

  if (!paymentRequired) {
    return {
      paymentPlan: 'not_required',
      paymentMode,
      paymentMethod: null,
      initialPaymentAmount: 0,
      depositDueAt: null,
      balanceDueAt: null,
      depositStatus: 'not_required',
    }
  }

  if (!PAYMENT_PLANS.includes(paymentPlan) || paymentPlan === 'not_required') {
    throw businessRuleError('Select a 50% deposit or Full payment.')
  }
  if (!PAYMENT_MODES.includes(paymentMode)) {
    throw businessRuleError('Select Walk-in payment or Pay online.')
  }
  validatePaymentMethod(bookingSource, paymentMethod)
  if (paymentMode === 'pay_at_office' && paymentMethod !== 'cash') {
    throw businessRuleError('Walk-in payment must be paid in cash at the Tourism Office.')
  }
  if (paymentMode === 'online' && paymentMethod === 'cash') {
    throw businessRuleError('Pay online requires QR/InstaPay or Credit/Debit Card.')
  }
  if (paymentMode === 'pay_at_office' && paymentPlan !== 'full_payment') {
    throw businessRuleError('Walk-in payment requires full payment no later than one day before departure.')
  }
  parseDateOnly(startDate, 'Start date')
  const balanceReferenceDate = endDate || startDate
  parseDateOnly(balanceReferenceDate, 'End date')

  const created = createdAt instanceof Date ? createdAt : new Date(createdAt)
  if (Number.isNaN(created.getTime())) throw businessRuleError('Booking creation time is invalid.')
  const daysUntilDeparture = calendarDayDifference(manilaDateString(created), startDate)

  if (paymentMode === 'pay_at_office' && daysUntilDeparture < 1) {
    throw businessRuleError('Walk-in payment is available only when booking at least one day before departure.')
  }

  if (daysUntilDeparture <= 3 && paymentPlan !== 'full_payment') {
    throw businessRuleError('Bookings within three days of departure require full payment.')
  }

  const onlineDeadline = paymentMode === 'online'
    ? new Date(created.getTime() + 3 * DAY_MS).toISOString()
    : null
  const officePaymentDeadline = paymentMode === 'pay_at_office'
    ? new Date(`${addDateOnlyDays(startDate, -1)}T23:59:59+08:00`).toISOString()
    : null
  const balanceDueAt = paymentPlan === 'deposit_50'
    ? new Date(`${addDateOnlyDays(balanceReferenceDate, -1)}T23:59:59+08:00`).toISOString()
    : officePaymentDeadline || onlineDeadline

  return {
    paymentPlan,
    paymentMode,
    paymentMethod,
    initialPaymentAmount: paymentPlan === 'deposit_50' ? roundMoney(total * 0.5) : total,
    depositDueAt: officePaymentDeadline || onlineDeadline,
    balanceDueAt,
    depositStatus: total > 0 ? 'pending' : 'paid',
  }
}

function validateDepositExtension({ createdAt, requestedDueAt }) {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const requested = requestedDueAt instanceof Date ? requestedDueAt : new Date(requestedDueAt)
  if (Number.isNaN(created.getTime()) || Number.isNaN(requested.getTime())) {
    throw businessRuleError('Deposit deadline must be a valid date and time.')
  }
  const maximum = new Date(created.getTime() + 5 * DAY_MS)
  if (requested.getTime() > maximum.getTime()) {
    throw businessRuleError('Deposit deadline cannot exceed five calendar days from booking creation.')
  }
  if (requested.getTime() <= created.getTime()) {
    throw businessRuleError('Deposit deadline must be after booking creation.')
  }
  return requested.toISOString()
}

function validateElectronicPaymentEvidence({ paymentMethod, transactionReference, proofFileUrl }) {
  if (paymentMethod === 'cash') return true
  if (!String(transactionReference || '').trim()) {
    throw businessRuleError('Electronic payments require a transaction reference.')
  }
  if (paymentMethod === 'credit_debit_card') return true
  if (!String(proofFileUrl || '').trim()) {
    throw businessRuleError('Electronic payments require proof of payment.')
  }
  return true
}

module.exports = {
  ACTIVE_CAPACITY_STATUSES,
  BOOKING_SOURCES,
  PAYMENT_MODES,
  GENDERS,
  PAYMENT_METHODS,
  PAYMENT_PLANS,
  addDateOnlyDays,
  buildSchedule,
  calculatePaymentTerms,
  deriveDurationDays,
  normalizeGender,
  requireGender,
  requireCurrentOrFutureStartDate,
  roundMoney,
  validateDepositExtension,
  validateElectronicPaymentEvidence,
  validatePaymentMethod,
}
