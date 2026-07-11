import { demoUsers } from '../../modules/auth/demoUsers.js'

export const name = '001_demo_users'

export function run(db) {
  const upsertUser = db.prepare(`
    INSERT INTO users (
      user_id,
      full_name,
      username,
      password_hash,
      role,
      account_status
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      full_name = excluded.full_name,
      username = excluded.username,
      password_hash = excluded.password_hash,
      role = excluded.role,
      account_status = excluded.account_status,
      updated_at = CURRENT_TIMESTAMP
  `)

  for (const user of demoUsers) {
    upsertUser.run(
      user.id,
      user.fullName,
      user.username,
      user.passwordHash,
      user.role,
      user.accountStatus,
    )
  }

  return { users: demoUsers.length }
}

export default { name, run }
