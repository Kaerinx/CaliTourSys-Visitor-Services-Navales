const { randomBytes } = require('node:crypto')

function createPublicSessionToken() {
  return `itn_${randomBytes(32).toString('base64url')}`
}

module.exports = { createPublicSessionToken }
