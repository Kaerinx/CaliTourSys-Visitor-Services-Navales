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
      JWT_ACCESS_SECRET: 'dev_only_change_me_to_a_long_random_secret_for_local_auth',
      ACCESS_TOKEN_TTL: '15m',
      REFRESH_TOKEN_TTL_DAYS: '7',
      CMS_COOKIE_NAME: 'calitoursys_refresh',
      COOKIE_SECURE: 'false',
      COOKIE_SAME_SITE: 'lax',
      LOGIN_RATE_LIMIT_WINDOW_MINUTES: '15',
      LOGIN_RATE_LIMIT_MAX: '5',
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
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(90).default(7),
  CMS_COOKIE_NAME: z.string().min(1).default('calitoursys_refresh'),
  COOKIE_SECURE: z
    .preprocess((value) => value === true || value === 'true', z.boolean())
    .default(false),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().max(1440).default(15),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(100).default(5),
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

if (
  parsed.data.NODE_ENV === 'production' &&
  parsed.data.JWT_ACCESS_SECRET === 'dev_only_change_me_to_a_long_random_secret_for_local_auth'
) {
  throw new Error('Invalid backend environment configuration: JWT_ACCESS_SECRET must be set in production')
}

const env = {
  ...parsed.data,
  IS_PRODUCTION: parsed.data.NODE_ENV === 'production',
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

module.exports = { env }
