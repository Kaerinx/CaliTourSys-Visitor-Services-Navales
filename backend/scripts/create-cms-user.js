const { closeDatabasePool } = require('../src/config/db')
const repository = require('../src/modules/auth/auth.repository')
const { hashPassword, isStrongPassword } = require('../src/utils/password')

async function main() {
  const email = process.env.CMS_BOOTSTRAP_EMAIL
  const password = process.env.CMS_BOOTSTRAP_PASSWORD
  const displayName = process.env.CMS_BOOTSTRAP_DISPLAY_NAME
  const roleKey = process.env.CMS_BOOTSTRAP_ROLE_KEY

  if (!email || !password || !displayName || !roleKey) {
    throw new Error(
      'Missing required environment variables: CMS_BOOTSTRAP_EMAIL, CMS_BOOTSTRAP_PASSWORD, CMS_BOOTSTRAP_DISPLAY_NAME, CMS_BOOTSTRAP_ROLE_KEY',
    )
  }

  if (!isStrongPassword(password)) {
    throw new Error(
      'CMS_BOOTSTRAP_PASSWORD is too weak. Use at least 12 characters with uppercase, lowercase, number, and symbol.',
    )
  }

  const existingUser = await repository.findUserByEmail(email)
  if (existingUser) {
    throw new Error('A CMS user with that email already exists. This script will not overwrite users.')
  }

  const roleExists = await repository.roleExists(roleKey)
  if (!roleExists) {
    throw new Error(`Role does not exist: ${roleKey}. Run the CMS roles/permissions seed first.`)
  }

  const passwordHash = await hashPassword(password)
  const user = await repository.createUser({
    email: email.trim().toLowerCase(),
    passwordHash,
    displayName: displayName.trim(),
    status: 'active',
  })

  await repository.assignRoleByKey(user.id, roleKey)

  console.log('CMS user created successfully.')
  console.log(`Email: ${user.email}`)
  console.log(`Display name: ${user.display_name}`)
  console.log(`Role: ${roleKey}`)
  console.log('Password was not printed.')
}

main()
  .catch((error) => {
    console.error(`Failed to create CMS user: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDatabasePool()
  })

