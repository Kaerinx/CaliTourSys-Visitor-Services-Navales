const { z } = require('zod')

const auditActionSchema = z.enum([
  'create',
  'update',
  'publish',
  'archive',
  'delete',
  'restore',
  'login',
  'logout',
  'failed_login',
  'password_change',
  'permission_change',
])

const cmsEntityTypeSchema = z.enum([
  'product',
  'promotion',
  'event',
  'destination',
  'business',
  'map_location',
  'museum_artifact',
  'media_asset',
  'inquiry',
  'newsletter_subscriber',
  'user',
  'role',
  'permission',
])

const auditLogListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: auditActionSchema.optional(),
  entityType: cmsEntityTypeSchema.optional(),
})

module.exports = {
  auditLogListQuerySchema,
}

