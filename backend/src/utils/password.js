const bcrypt = require('bcrypt')

const SALT_ROUNDS = 12

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false
  return bcrypt.compare(password, passwordHash)
}

module.exports = {
  hashPassword,
  isStrongPassword,
  verifyPassword,
}

