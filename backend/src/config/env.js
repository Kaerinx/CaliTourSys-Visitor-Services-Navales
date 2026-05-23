const dotenv = require('dotenv')
const { z } = require('zod')

dotenv.config()

const isProductionInput = process.env.NODE_ENV === 'production'

const defaults = isProductionInput
  ? {}
  : {
      NODE_ENV: 'development',
      PORT: '5000',
      CORS_ORIGIN: 'http://localhost:5173',
      REQUEST_BODY_LIMIT: '1mb',
    }

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  DATABASE_URL: z
    .string({
      error: 'DATABASE_URL is required and must come from process.env or backend/.env',
    })
    .min(1, 'DATABASE_URL is required and must come from process.env or backend/.env')
    .url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  REQUEST_BODY_LIMIT: z.string().min(1).default('1mb'),
})

const parsed = envSchema.safeParse({
  ...defaults,
  ...process.env,
})

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')

  throw new Error(`Invalid backend environment configuration: ${details}`)
}

const env = {
  ...parsed.data,
  IS_PRODUCTION: parsed.data.NODE_ENV === 'production',
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

module.exports = { env }
