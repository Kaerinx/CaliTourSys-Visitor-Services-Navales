require('dotenv').config({ quiet: true })

const { randomUUID } = require('crypto')
const { query, closeDatabasePool } = require('../src/config/db')
const publicService = require('../src/modules/public/public.service')
const publicValidators = require('../src/modules/public/public.validators')
const cmsService = require('../src/modules/cms/operations/operations.service')
const cmsValidators = require('../src/modules/cms/operations/operations.validators')

const createdBookingIds = []
const requestId = `phase5-booking-smoke-${randomUUID()}`
let touristAccountId = null

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function addDays(days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function dateOnly(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value || '').slice(0, 10)
}

function staffRequest(userId) {
  return {
    id: requestId,
    ip: '127.0.0.1',
    user: { id: userId },
    get() { return 'phase5-booking-smoke' },
  }
}

async function createOnlineBooking({ tourismPackage, tourist, startDate, paymentPlan = 'deposit_50' }) {
  const body = publicValidators.createPackageBookingRequestBodySchema.parse({
    packageId: tourismPackage.id,
    selectedPax: Number(tourismPackage.min_pax || 1),
    representativeContact: {
      fullName: tourist.fullName,
      email: tourist.email,
      phoneNumber: tourist.phoneNumber,
      gender: 'F',
    },
    startDate,
    durationDays: Number(tourismPackage.duration_days),
    paymentPlan,
    paymentMethod: 'bank_transfer',
    message: 'Temporary Phase 5 integration test booking.',
  })
  const booking = await publicService.createPackageBookingRequest(body, {
    bookingSource: 'online',
    touristAccountId,
  })
  createdBookingIds.push(booking.id)
  return booking
}

async function cleanup() {
  if (createdBookingIds.length) {
    await query('DELETE FROM package_booking_credit_transfers WHERE from_booking_request_id = ANY($1::uuid[]) OR to_booking_request_id = ANY($1::uuid[])', [createdBookingIds])
    await query('DELETE FROM package_booking_payments WHERE package_booking_request_id = ANY($1::uuid[])', [createdBookingIds])
    await query('DELETE FROM package_booking_date_change_requests WHERE package_booking_request_id = ANY($1::uuid[])', [createdBookingIds])
    await query('DELETE FROM package_booking_events WHERE package_booking_request_id = ANY($1::uuid[])', [createdBookingIds])
    await query('DELETE FROM package_booking_request_participants WHERE package_booking_request_id = ANY($1::uuid[])', [createdBookingIds])
    await query('DELETE FROM package_booking_requests WHERE id = ANY($1::uuid[])', [createdBookingIds])
  }
  await query('DELETE FROM content_audit_logs WHERE request_id = $1', [requestId])
  if (touristAccountId) await query('DELETE FROM tourist_accounts WHERE id = $1', [touristAccountId])
}

async function run() {
  const [packageResult, staffResult] = await Promise.all([
    query(`SELECT * FROM tourism_packages
           WHERE package_status = 'Ready for Promotion'
             AND payment_required = true AND base_price IS NOT NULL AND duration_days IS NOT NULL
           ORDER BY min_pax ASC NULLS LAST, created_at DESC LIMIT 1`),
    query(`SELECT u.id FROM users u
           WHERE u.status = 'active' AND EXISTS (
             SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id AND r.role_key IN ('system_admin', 'tourism_officer')
           ) ORDER BY u.created_at LIMIT 1`),
  ])
  const tourismPackage = packageResult.rows[0]
  const staffUser = staffResult.rows[0]
  assert(tourismPackage, 'No payment-enabled Ready for Promotion package is available for the smoke test.')
  assert(staffUser, 'No active admin or tourism officer is available for the smoke test.')

  const unique = randomUUID().slice(0, 8)
  const tourist = {
    fullName: 'Phase Five Test Representative',
    email: `phase5-${unique}@example.invalid`,
    phoneNumber: `+63999${Date.now().toString().slice(-7)}`,
  }
  const touristInsert = await query(
    `INSERT INTO tourist_accounts (full_name, email, phone_number, password_hash, status)
     VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
    [tourist.fullName, tourist.email, tourist.phoneNumber, 'phase5-temporary-password-hash'],
  )
  touristAccountId = touristInsert.rows[0].id
  const req = staffRequest(staffUser.id)

  const firstStartDate = addDays(60)
  const first = await createOnlineBooking({ tourismPackage, tourist, startDate: firstStartDate })
  assert(/^\d{6}-TOUR-\d{6}$/.test(first.bookingReference), 'Monthly booking-reference format is invalid.')
  assert(first.bookingSource === 'online', 'Online booking source was not preserved.')
  assert(first.startDate === firstStartDate, 'The booking start date shifted across a timezone boundary.')
  assert(
    first.endDate === addDays(60 + Number(first.durationDays || 1) - 1),
    'The booking end date shifted across a timezone boundary.',
  )
  assert(Number(first.initialPaymentAmount) === Number(first.totalAmount) / 2, 'The 50% deposit was not calculated correctly.')

  const extendedDueAt = new Date(new Date(first.createdAt).getTime() + (4 * 86400000)).toISOString()
  const extension = cmsValidators.bookingDepositExtensionBodySchema.parse({
    depositDueAt: extendedDueAt,
    reason: 'Phase 5 verifies the authorized four-day extension.',
  })
  const extended = await cmsService.extendPackageBookingDepositDeadline(first.id, extension, req)
  assert(new Date(extended.depositDueAt).toISOString() === extendedDueAt, 'Deposit deadline extension was not saved.')

  const depositReference = `PHASE5-DEP-${unique}`
  await publicService.uploadPackageBookingPaymentProof(
    first.id,
    { fileUrl: '/phase5/deposit-proof.png', originalFilename: 'deposit-proof.png', mimeType: 'image/png', fileSize: 128 },
    { amount: first.initialPaymentAmount, paymentMethod: 'bank_transfer', paymentReferenceNumber: depositReference },
    { touristAccountId },
  )
  await cmsService.verifyPackageBookingPayment(first.id, req)
  let touristView = await publicService.getTouristPackageBookingRequest({ requestId: first.id, touristAccountId })
  assert(Number(touristView.verifiedPaymentAmount) === Number(first.initialPaymentAmount), 'Verified deposit total is incorrect.')
  assert(Number(touristView.remainingAmount) > 0, 'Remaining balance was not exposed after the deposit.')

  await publicService.uploadPackageBookingPaymentProof(
    first.id,
    { fileUrl: '/phase5/balance-proof.png', originalFilename: 'balance-proof.png', mimeType: 'image/png', fileSize: 128 },
    { amount: touristView.remainingAmount, paymentMethod: 'bank_transfer', paymentReferenceNumber: `PHASE5-BAL-${unique}` },
    { touristAccountId },
  )
  await cmsService.verifyPackageBookingPayment(first.id, req)
  touristView = await publicService.getTouristPackageBookingRequest({ requestId: first.id, touristAccountId })
  assert(Number(touristView.remainingAmount) === 0, 'Full-payment balance did not reach zero.')
  assert(touristView.paymentStatus === 'paid', 'Fully paid booking did not receive paid status.')

  const requestedStartDate = addDays(62)
  const changeRequest = await publicService.createTouristPackageBookingDateChangeRequest({
    requestId: first.id,
    touristAccountId,
    startDate: requestedStartDate,
    durationDays: Number(tourismPackage.duration_days),
    reason: 'Phase 5 date-change integration test.',
  })
  assert(changeRequest.startDate === requestedStartDate, 'The requested start date shifted across a timezone boundary.')
  const schedule = cmsValidators.bookingScheduleBodySchema.parse({
    startDate: dateOnly(changeRequest.startDate),
    durationDays: changeRequest.durationDays,
    reason: 'Approved temporary Phase 5 date change.',
    dateChangeRequestId: changeRequest.id,
  })
  const rescheduled = await cmsService.updatePackageBookingSchedule(first.id, schedule, req)
  assert(rescheduled.bookingStatus === 'rescheduled', 'Approved date change did not reschedule the booking.')
  assert(rescheduled.startDate === requestedStartDate, 'The approved start date shifted across a timezone boundary.')

  await cmsService.updatePackageBookingStatus(first.id, {
    status: 'cancelled',
    reason: 'Temporary cancellation for credit-transfer integration testing.',
  }, req)
  const replacement = await createOnlineBooking({ tourismPackage, tourist, startDate: addDays(70), paymentPlan: 'full_payment' })
  const transfer = cmsValidators.bookingCreditTransferBodySchema.parse({
    toBookingRequestId: replacement.id,
    amount: Number(first.totalAmount),
    reason: 'Transfer verified payment to replacement Phase 5 booking.',
  })
  const transferred = await cmsService.transferPackageBookingCredit(first.id, transfer, req)
  assert(transferred.status === 'applied', 'Cancelled-booking credit was not applied.')
  const creditedReplacement = await cmsService.getPackageBookingRequest(replacement.id)
  assert(
    Number(creditedReplacement.appliedCreditAmount) === Number(transferred.amount) - Number(transferred.refundableExcess || 0),
    'Applied booking credit was not exposed in staff payment totals.',
  )

  const walkInBody = cmsValidators.walkInBookingBodySchema.parse({
    packageId: tourismPackage.id,
    selectedPax: Number(tourismPackage.min_pax || 1),
    representativeContact: { fullName: tourist.fullName, phoneNumber: tourist.phoneNumber, email: null, gender: 'F' },
    startDate: addDays(75),
    durationDays: Number(tourismPackage.duration_days),
    paymentPlan: 'full_payment',
    paymentMethod: 'cash',
  })
  const walkIn = await cmsService.createWalkInPackageBooking(walkInBody, req)
  createdBookingIds.push(walkIn.id)
  const cashPayment = cmsValidators.bookingPaymentBodySchema.parse({
    amount: Number(walkIn.totalAmount),
    paymentMethod: 'cash',
    notes: 'Temporary Phase 5 walk-in cash test.',
  })
  const cashResult = await cmsService.recordPackageBookingPayment(walkIn.id, cashPayment, req)
  assert(cashResult.payment.paymentStatus === 'verified', 'Walk-in cash payment was not verified immediately.')
  assert(!cashResult.payment.transactionReference, 'Walk-in cash unexpectedly required an electronic reference.')

  return {
    referenceFormat: first.bookingReference,
    depositAndBalance: 'passed',
    deadlineExtension: 'passed',
    dateChangeApproval: 'passed',
    cancelledCreditTransfer: 'passed',
    walkInCash: 'passed',
  }
}

run()
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error) => {
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await cleanup()
    } catch (error) {
      console.error(`Smoke-test cleanup failed: ${error.message}`)
      process.exitCode = 1
    }
    await closeDatabasePool()
  })
