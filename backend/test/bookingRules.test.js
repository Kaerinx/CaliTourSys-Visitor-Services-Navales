const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildSchedule,
  calculatePaymentTerms,
  deriveDurationDays,
  normalizeGender,
  requireCurrentOrFutureStartDate,
  validateDepositExtension,
  validateElectronicPaymentEvidence,
  validatePaymentMethod,
} = require('../src/modules/booking/bookingRules')

test('normalizes only M/F booking genders', () => {
  assert.equal(normalizeGender('Male'), 'M')
  assert.equal(normalizeGender('f'), 'F')
  assert.equal(normalizeGender('Other'), null)
})

test('derives numeric package days from supported legacy labels', () => {
  assert.equal(deriveDurationDays('Half day'), 1)
  assert.equal(deriveDurationDays('2 hours'), 1)
  assert.equal(deriveDurationDays('Full day'), 1)
  assert.equal(deriveDurationDays('3 days and 2 nights'), 3)
  assert.equal(deriveDurationDays('foods'), null)
})

test('calculates an inclusive end date from start date and duration', () => {
  assert.deepEqual(
    buildSchedule({ startDate: '2026-08-10', durationDays: 3 }),
    { startDate: '2026-08-10', endDate: '2026-08-12', durationDays: 3 },
  )
  assert.throws(
    () => buildSchedule({ startDate: '2026-08-10', durationDays: 3, endDate: '2026-08-13' }),
    /End date must match/,
  )
})

test('rejects a departure date in the past', () => {
  assert.equal(
    requireCurrentOrFutureStartDate('2026-08-01', new Date('2026-07-31T16:00:00.000Z')),
    '2026-08-01',
  )
  assert.throws(
    () => requireCurrentOrFutureStartDate('2026-07-31', new Date('2026-07-31T16:00:00.000Z')),
    /cannot be in the past/,
  )
})

test('limits cash to walk-in bookings', () => {
  assert.equal(validatePaymentMethod('walk_in', 'cash'), 'cash')
  assert.throws(() => validatePaymentMethod('online', 'cash'), /walk-in/)
})

test('calculates 50 percent deposit and balance deadline', () => {
  const terms = calculatePaymentTerms({
    totalAmount: 1001,
    paymentPlan: 'deposit_50',
    bookingSource: 'online',
    paymentMethod: 'qr_instapay',
    startDate: '2026-08-20',
    createdAt: new Date('2026-08-01T02:00:00.000Z'),
  })

  assert.equal(terms.initialPaymentAmount, 500.5)
  assert.equal(terms.depositDueAt, '2026-08-04T02:00:00.000Z')
  assert.equal(terms.balanceDueAt, '2026-08-16T16:00:00.000Z')
})

test('requires full payment within three calendar days of departure', () => {
  assert.throws(
    () => calculatePaymentTerms({
      totalAmount: 1000,
      paymentPlan: 'deposit_50',
      bookingSource: 'online',
      paymentMethod: 'bank_transfer',
      startDate: '2026-08-04',
      createdAt: new Date('2026-08-01T02:00:00.000Z'),
    }),
    /require full payment/,
  )
})

test('caps a deposit extension at five days from booking creation', () => {
  const createdAt = '2026-08-01T02:00:00.000Z'
  assert.equal(
    validateDepositExtension({ createdAt, requestedDueAt: '2026-08-06T02:00:00.000Z' }),
    '2026-08-06T02:00:00.000Z',
  )
  assert.throws(
    () => validateDepositExtension({ createdAt, requestedDueAt: '2026-08-06T02:00:00.001Z' }),
    /five calendar days/,
  )
})

test('requires reference and proof for electronic payments only', () => {
  assert.equal(validateElectronicPaymentEvidence({ paymentMethod: 'cash' }), true)
  assert.throws(
    () => validateElectronicPaymentEvidence({ paymentMethod: 'qr_instapay', proofFileUrl: '/proof.png' }),
    /transaction reference/,
  )
  assert.equal(validateElectronicPaymentEvidence({
    paymentMethod: 'bank_transfer',
    transactionReference: 'ABC-123',
    proofFileUrl: '/proof.png',
  }), true)
})
