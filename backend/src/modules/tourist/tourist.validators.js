const { z } = require('zod')

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.')

const dateChangeRequestBodySchema = z
  .object({
    startDate: dateOnly,
    durationDays: z.coerce.number().int().min(1),
    endDate: dateOnly.optional(),
    reason: z.string().trim().min(1).max(2000),
  })
  .strict()

module.exports = { dateChangeRequestBodySchema }
