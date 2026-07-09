const { query } = require('../../config/db')

function mapTourist(row) {
  if (!row) return null

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number || '',
    status: row.status,
    passwordHash: row.password_hash,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function findByEmail(email) {
  const result = await query(
    `
      SELECT *
      FROM tourist_accounts
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email],
  )

  return mapTourist(result.rows[0])
}

async function findById(id) {
  const result = await query(
    `
      SELECT *
      FROM tourist_accounts
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )

  return mapTourist(result.rows[0])
}

async function createTouristAccount(data) {
  const result = await query(
    `
      INSERT INTO tourist_accounts (
        full_name,
        email,
        phone_number,
        password_hash,
        status
      )
      VALUES ($1, lower($2), $3, $4, 'active')
      RETURNING *
    `,
    [data.fullName, data.email, data.phoneNumber || null, data.passwordHash],
  )

  return mapTourist(result.rows[0])
}

async function markSuccessfulLogin(id) {
  await query(
    `
      UPDATE tourist_accounts
      SET last_login_at = now()
      WHERE id = $1
    `,
    [id],
  )
}

module.exports = {
  createTouristAccount,
  findByEmail,
  findById,
  markSuccessfulLogin,
}
