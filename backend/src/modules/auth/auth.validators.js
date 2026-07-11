const { z } = require('zod')

const identifierSchema = z.string().trim().min(1, 'Username or email is required.').max(255)
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
    identifier: identifierSchema.optional(),
    email: identifierSchema.optional(),
    password: passwordSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.identifier && !value.email) {
      context.addIssue({
        code: 'custom',
        message: 'Username or email is required.',
        path: ['identifier'],
      })
    }
  })
  .transform((value) => ({
    identifier: value.identifier || value.email,
    password: value.password,
  }))

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

