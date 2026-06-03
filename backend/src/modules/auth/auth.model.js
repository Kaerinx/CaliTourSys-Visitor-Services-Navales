import { getDatabase } from '../../config/db.js'
import { demoUsers } from './demoUsers.js'

function mapUser(row) {
  if (!row) {
    return null
  }

  return {
    id: row.user_id,
    fullName: row.full_name,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    accountStatus: row.account_status,
  }
}

export function findDemoUserByUsername(username) {
  const normalizedUsername = username.trim().toLowerCase()
  const row = getDatabase()
    .prepare(
      `
        SELECT *
        FROM users
        WHERE LOWER(username) = ?
      `,
    )
    .get(normalizedUsername)

  return (
    mapUser(row) ||
    demoUsers.find((user) => user.username.toLowerCase() === normalizedUsername) ||
    null
  )
}
