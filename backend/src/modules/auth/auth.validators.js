const { z } = require('zod')

const passwordSchema = z.string().min(1).max(256)
const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters.')
  .max(256)
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[0-9]/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol.')

const loginBodySchema = z
  .object({
    email: z.email().max(255),
    password: passwordSchema,
  })
  .strict()

const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(32).max(512).optional(),
  })
  .strict()

const changePasswordBodySchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: strongPasswordSchema,
  })
  .strict()

module.exports = {
  changePasswordBodySchema,
  loginBodySchema,
  refreshBodySchema,
  strongPasswordSchema,
}

