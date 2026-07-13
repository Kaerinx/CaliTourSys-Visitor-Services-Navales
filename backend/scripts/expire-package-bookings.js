const { pool, closeDatabasePool } = require('../src/config/db')

async function expireOverduePackageBookings() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `
        WITH overdue AS (
          SELECT id
          FROM package_booking_requests
          WHERE booking_source = 'online'
            AND deposit_due_at IS NOT NULL
            AND deposit_due_at < now()
            AND deposit_status IN ('pending', 'rejected')
            AND payment_status IN ('unpaid', 'rejected')
            AND booking_status IN ('pending', 'reviewed')
          FOR UPDATE SKIP LOCKED
        ), expired AS (
          UPDATE package_booking_requests booking
          SET booking_status = 'expired',
              deposit_status = 'expired',
              expired_at = now()
          FROM overdue
          WHERE booking.id = overdue.id
          RETURNING booking.id
        )
        INSERT INTO package_booking_events (
          package_booking_request_id, event_type, after_values, reason
        )
        SELECT id, 'booking_expired', '{"bookingStatus":"expired","depositStatus":"expired"}'::jsonb,
               'Online deposit deadline elapsed without a verified payment.'
        FROM expired
        RETURNING package_booking_request_id
      `,
    )
    await client.query('COMMIT')
    return result.rowCount
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

expireOverduePackageBookings()
  .then((count) => {
    console.log(`Expired package bookings: ${count}`)
  })
  .catch((error) => {
    console.error('Unable to expire overdue package bookings:', error.message)
    process.exitCode = 1
  })
  .finally(closeDatabasePool)
