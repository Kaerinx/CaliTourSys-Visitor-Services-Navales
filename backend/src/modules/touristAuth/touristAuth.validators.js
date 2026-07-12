const { z } = require('zod')
const { strongPasswordSchema } = require('../auth/auth.validators')

const phoneSchema = z.string().trim().max(80).optional()

const registerBodySchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required.').max(255),
    email: z.email().max(255),
    phoneNumber: phoneSchema,
    password: strongPasswordSchema,
  })
  .strict()

const loginBodySchema = z
  .object({
    email: z.email().max(255),
    password: z.string().min(1).max(256),
  })
  .strict()

const updateProfileBodySchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required.').max(255),
    phoneNumber: phoneSchema,
  })
  .strict()

const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: strongPasswordSchema,
  })
  .strict()

module.exports = {
  changePasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  updateProfileBodySchema,
}
