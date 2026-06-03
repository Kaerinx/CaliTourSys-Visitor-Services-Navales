const { query } = require('../../config/db')

function normalizeUser(row, roles = [], permissions = []) {
  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    lastLoginAt: row.last_login_at,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until,
    passwordChangedAt: row.password_changed_at,
    passwordHash: row.password_hash,
    profile: {
      employeeNumber: row.employee_number,
      positionTitle: row.position_title,
      department: row.department,
      contactNumber: row.contact_number,
      profilePhotoUrl: row.profile_photo_url,
    },
    roles,
    permissions,
  }
}

async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT
        u.*,
        sp.employee_number,
        sp.position_title,
        sp.department,
        sp.contact_number,
        sp.profile_photo_url
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE lower(u.email) = lower($1)
      LIMIT 1
    `,
    [email],
  )

  return normalizeUser(result.rows[0])
}

async function getUserById(userId) {
  const result = await query(
    `
      SELECT
        u.*,
        sp.employee_number,
        sp.position_title,
        sp.department,
        sp.contact_number,
        sp.profile_photo_url
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId],
  )

  return normalizeUser(result.rows[0])
}

async function getRolesForUser(userId) {
  const result = await query(
    `
      SELECT r.role_key
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.role_key
    `,
    [userId],
  )

  return result.rows.map((row) => row.role_key)
}

async function getPermissionsForUser(userId) {
  const result = await query(
    `
      SELECT DISTINCT p.permission_key
      FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = $1
      ORDER BY p.permission_key
    `,
    [userId],
  )

  return result.rows.map((row) => row.permission_key)
}

async function getUserAuthContext(userId) {
  const [user, roles, permissions] = await Promise.all([
    getUserById(userId),
    getRolesForUser(userId),
    getPermissionsForUser(userId),
  ])

  if (!user) return null
  return normalizeUser(
    {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      status: user.status,
      last_login_at: user.lastLoginAt,
      failed_login_count: user.failedLoginCount,
      locked_until: user.lockedUntil,
      password_changed_at: user.passwordChangedAt,
      password_hash: user.passwordHash,
      employee_number: user.profile.employeeNumber,
      position_title: user.profile.positionTitle,
      department: user.profile.department,
      contact_number: user.profile.contactNumber,
      profile_photo_url: user.profile.profilePhotoUrl,
    },
    roles,
    permissions,
  )
}

async function incrementFailedLogin(userId, lockedUntil = null) {
  await query(
    `
      UPDATE users
      SET
        failed_login_count = failed_login_count + 1,
        locked_until = COALESCE($2, locked_until)
      WHERE id = $1
    `,
    [userId, lockedUntil],
  )
}

async function resetSuccessfulLogin(userId) {
  await query(
    `
      UPDATE users
      SET
        failed_login_count = 0,
        locked_until = NULL,
        last_login_at = now()
      WHERE id = $1
    `,
    [userId],
  )
}

async function createAuthSession({ userId, refreshTokenHash, ipAddress, userAgent, expiresAt }) {
  const result = await query(
    `
      INSERT INTO auth_sessions (
        user_id,
        refresh_token_hash,
        ip_address,
        user_agent,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, status, expires_at, revoked_at
    `,
    [userId, refreshTokenHash, ipAddress, userAgent, expiresAt],
  )

  return result.rows[0]
}

async function findSessionByRefreshTokenHash(refreshTokenHash) {
  const result = await query(
    `
      SELECT id, user_id, status, expires_at, revoked_at
      FROM auth_sessions
      WHERE refresh_token_hash = $1
      LIMIT 1
    `,
    [refreshTokenHash],
  )

  return result.rows[0] || null
}

async function rotateAuthSession({ sessionId, refreshTokenHash, expiresAt, ipAddress, userAgent }) {
  const result = await query(
    `
      UPDATE auth_sessions
      SET
        refresh_token_hash = $2,
        expires_at = $3,
        status = 'active',
        revoked_at = NULL,
        ip_address = $4,
        user_agent = $5
      WHERE id = $1
      RETURNING id, user_id, status, expires_at, revoked_at
    `,
    [sessionId, refreshTokenHash, expiresAt, ipAddress, userAgent],
  )

  return result.rows[0] || null
}

async function revokeSessionByRefreshTokenHash(refreshTokenHash) {
  const result = await query(
    `
      UPDATE auth_sessions
      SET status = 'revoked', revoked_at = now()
      WHERE refresh_token_hash = $1
        AND status = 'active'
      RETURNING id, user_id
    `,
    [refreshTokenHash],
  )

  return result.rows[0] || null
}

async function revokeOtherSessions(userId, keepSessionId) {
  await query(
    `
      UPDATE auth_sessions
      SET status = 'revoked', revoked_at = now()
      WHERE user_id = $1
        AND id <> $2
        AND status = 'active'
    `,
    [userId, keepSessionId],
  )
}

async function updatePassword(userId, passwordHash) {
  await query(
    `
      UPDATE users
      SET
        password_hash = $2,
        password_changed_at = now(),
        failed_login_count = 0,
        locked_until = NULL
      WHERE id = $1
    `,
    [userId, passwordHash],
  )
}

async function createUser({ email, passwordHash, displayName, status = 'active' }) {
  const result = await query(
    `
      INSERT INTO users (email, password_hash, display_name, status, password_changed_at)
      VALUES ($1, $2, $3, $4, now())
      RETURNING id, email, display_name, status
    `,
    [email, passwordHash, displayName, status],
  )

  return result.rows[0]
}

async function assignRoleByKey(userId, roleKey) {
  const result = await query(
    `
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, r.id
      FROM roles r
      WHERE r.role_key = $2
      ON CONFLICT (user_id, role_id) DO NOTHING
      RETURNING role_id
    `,
    [userId, roleKey],
  )

  return result.rowCount > 0
}

async function roleExists(roleKey) {
  const result = await query('SELECT 1 FROM roles WHERE role_key = $1 LIMIT 1', [roleKey])
  return result.rowCount > 0
}

module.exports = {
  assignRoleByKey,
  createAuthSession,
  createUser,
  findSessionByRefreshTokenHash,
  findUserByEmail,
  getUserAuthContext,
  incrementFailedLogin,
  resetSuccessfulLogin,
  revokeOtherSessions,
  revokeSessionByRefreshTokenHash,
  roleExists,
  rotateAuthSession,
  updatePassword,
}

