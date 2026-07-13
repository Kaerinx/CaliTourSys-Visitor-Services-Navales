const { z } = require('zod')

const uuidParamsSchema = z.object({
  id: z.uuid('id must be a valid UUID.'),
})

const pageLimit = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}

const mediaStatusSchema = z.enum(['active', 'archived'])
const inquiryStatusSchema = z.enum(['new', 'read', 'responded', 'archived'])
const packageBookingStatusSchema = z.enum(['pending', 'reviewed', 'approved', 'declined', 'cancelled', 'expired', 'rescheduled'])
const packagePaymentStatusSchema = z.enum(['unpaid', 'proof_submitted', 'verified', 'rejected', 'not_required', 'pending_inquiry', 'partially_paid', 'paid'])
const inquiryResponseStatusSchema = z.enum(['draft', 'sent'])
const subscriptionStatusSchema = z.enum(['subscribed', 'unsubscribed', 'bounced'])
const userStatusSchema = z.enum(['active', 'inactive', 'locked', 'pending'])
const mediaStorageProviderSchema = z.enum(['local', 'cloudinary', 's3', 'supabase', 'external'])

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
  'package_booking_request',
])

const sortSchema = z
  .enum(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'status', 'email', '-email', 'name', '-name'])
  .default('-createdAt')

const mediaListQuerySchema = z.object({
  ...pageLimit,
  search: z.string().trim().max(120).optional(),
  status: mediaStatusSchema.optional(),
  mimeType: z.string().trim().max(120).optional(),
  storageProvider: mediaStorageProviderSchema.optional(),
  sort: sortSchema,
})

const inquiryListQuerySchema = z.object({
  ...pageLimit,
  search: z.string().trim().max(120).optional(),
  status: inquiryStatusSchema.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  sort: sortSchema,
})

const packageBookingRequestListQuerySchema = z.object({
  ...pageLimit,
  search: z.string().trim().max(120).optional(),
  bookingStatus: packageBookingStatusSchema.optional(),
  paymentStatus: packagePaymentStatusSchema.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  sort: z.enum(['createdAt', '-createdAt', 'preferredDate', '-preferredDate', 'packageName', '-packageName']).default('-createdAt'),
})

const newsletterListQuerySchema = z.object({
  ...pageLimit,
  search: z.string().trim().max(120).optional(),
  status: subscriptionStatusSchema.optional(),
  sort: sortSchema,
})

const userListQuerySchema = z.object({
  ...pageLimit,
  search: z.string().trim().max(120).optional(),
  status: userStatusSchema.optional(),
  role: z.string().trim().max(100).optional(),
  sort: sortSchema,
})

const auditLogListQuerySchema = z.object({
  ...pageLimit,
  action: auditActionSchema.optional(),
  entityType: cmsEntityTypeSchema.optional(),
  actorUserId: z.uuid().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  sort: z.enum(['createdAt', '-createdAt']).default('-createdAt'),
})

const mediaBaseSchema = z
  .object({
    fileUrl: z.string().trim().url(),
    fileName: z.string().trim().max(255).optional().nullable(),
    mimeType: z.string().trim().max(120).optional().nullable(),
    altText: z.string().trim().max(255).optional().nullable(),
    caption: z.string().trim().max(5000).optional().nullable(),
    credit: z.string().trim().max(255).optional().nullable(),
    width: z.number().int().nonnegative().optional().nullable(),
    height: z.number().int().nonnegative().optional().nullable(),
    status: mediaStatusSchema.default('active'),
    storageProvider: mediaStorageProviderSchema.default('external'),
    storageKey: z.string().trim().max(5000).optional().nullable(),
    fileSizeBytes: z.number().int().nonnegative().optional().nullable(),
    checksumSha256: z.string().trim().regex(/^[a-fA-F0-9]{64}$/).optional().nullable(),
  })
  .strict()

const inquiryStatusBodySchema = z
  .object({
    status: inquiryStatusSchema,
  })
  .strict()

const inquiryResponseBodySchema = z
  .object({
    responseMessage: z.string().trim().min(1).max(20000),
    status: inquiryResponseStatusSchema.default('draft'),
  })
  .strict()

const packageBookingStatusBodySchema = z
  .object({
    status: packageBookingStatusSchema,
    reason: z.string().trim().max(2000).optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict()

const packageBookingNotesBodySchema = z
  .object({
    bookingReviewNotes: z.string().trim().max(5000).optional().nullable(),
    paymentNotes: z.string().trim().max(5000).optional().nullable(),
  })
  .strict()

const packageBookingPaymentRejectBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(2000),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict()

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.')
const bookingGenderSchema = z.enum(['M', 'F', 'Male', 'Female', 'male', 'female'])

const walkInBookingBodySchema = z
  .object({
    packageId: z.uuid('Select a tourism package.'),
    selectedPax: z.coerce.number().int().min(1).max(80),
    representativeContact: z.object({
      fullName: z.string().trim().min(1).max(255),
      phoneNumber: z.string().trim().min(1).max(80),
      email: z.email().max(255).optional().nullable(),
      gender: bookingGenderSchema,
    }).strict(),
    participants: z.array(z.object({
      fullName: z.string().trim().min(1).max(255),
      gender: bookingGenderSchema,
    }).strict()).max(80).optional(),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema.optional(),
    durationDays: z.coerce.number().int().min(1).optional(),
    paymentPlan: z.enum(['deposit_50', 'full_payment']).default('full_payment'),
    paymentMethod: z.enum(['cash', 'qr_instapay', 'bank_transfer']).default('cash'),
    message: z.string().trim().max(5000).optional(),
  })
  .strict()

const bookingScheduleBodySchema = z
  .object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema.optional(),
    durationDays: z.coerce.number().int().min(1),
    reason: z.string().trim().min(1).max(2000),
    dateChangeRequestId: z.uuid().optional(),
  })
  .strict()

const bookingDepositExtensionBodySchema = z
  .object({
    depositDueAt: z.string().datetime({ offset: true }),
    reason: z.string().trim().min(1).max(2000),
  })
  .strict()

const bookingCreditTransferBodySchema = z
  .object({
    toBookingRequestId: z.uuid(),
    amount: z.coerce.number().positive(),
    reason: z.string().trim().min(1).max(2000),
  })
  .strict()

const bookingPaymentBodySchema = z
  .object({
    amount: z.coerce.number().positive(),
    paymentMethod: z.enum(['cash', 'qr_instapay', 'bank_transfer']),
    transactionReference: z.string().trim().max(120).optional(),
    proofFileUrl: z.string().trim().max(5000).optional(),
    proofOriginalFilename: z.string().trim().max(255).optional(),
    proofMimeType: z.string().trim().max(120).optional(),
    proofFileSize: z.coerce.number().int().nonnegative().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict()

const newsletterStatusBodySchema = z
  .object({
    status: subscriptionStatusSchema,
  })
  .strict()

const userStatusBodySchema = z
  .object({
    status: userStatusSchema,
  })
  .strict()

const userRolesBodySchema = z
  .object({
    roleIds: z.array(z.uuid()).max(20),
  })
  .strict()

module.exports = {
  auditLogListQuerySchema,
  inquiryListQuerySchema,
  inquiryResponseBodySchema,
  inquiryStatusBodySchema,
  mediaBodySchema: mediaBaseSchema,
  mediaListQuerySchema,
  mediaPatchSchema: mediaBaseSchema.partial(),
  newsletterListQuerySchema,
  newsletterStatusBodySchema,
  packageBookingNotesBodySchema,
  bookingCreditTransferBodySchema,
  bookingPaymentBodySchema,
  bookingDepositExtensionBodySchema,
  bookingScheduleBodySchema,
  packageBookingPaymentRejectBodySchema,
  packageBookingRequestListQuerySchema,
  packageBookingStatusBodySchema,
  userListQuerySchema,
  userRolesBodySchema,
  userStatusBodySchema,
  uuidParamsSchema,
  walkInBookingBodySchema,
}
