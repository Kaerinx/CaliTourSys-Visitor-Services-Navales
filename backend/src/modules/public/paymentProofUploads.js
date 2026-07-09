const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { env } = require('../../config/env')

const uploadRoot = path.resolve(__dirname, '../../../uploads/package-payment-proofs')
const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024

function ensureUploadRoot() {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

function safeBaseName(value) {
  return path
    .basename(value || 'payment-proof')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48) || 'payment-proof'
}

function extensionFor(file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)) return ext
  if (file.mimetype === 'application/pdf') return '.pdf'
  if (file.mimetype === 'image/png') return '.png'
  if (file.mimetype === 'image/webp') return '.webp'
  return '.jpg'
}

function publicProofUrl(file) {
  const pathname = `/uploads/package-payment-proofs/${file.filename}`
  return `http://localhost:${env.PORT}${pathname}`
}

ensureUploadRoot()

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    ensureUploadRoot()
    callback(null, uploadRoot)
  },
  filename(_req, file, callback) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    callback(null, `${safeBaseName(file.originalname)}-${unique}${extensionFor(file)}`)
  },
})

const paymentProofUpload = multer({
  storage,
  limits: {
    fileSize: MAX_PROOF_FILE_SIZE,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, WebP, and PDF files can be uploaded as payment proof.')
      error.statusCode = 400
      error.code = 'VALIDATION_ERROR'
      return callback(error)
    }

    return callback(null, true)
  },
})

function uploadedPaymentProof(req) {
  if (!req.file) return null

  return {
    fileUrl: publicProofUrl(req.file),
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
  }
}

module.exports = {
  MAX_PROOF_FILE_SIZE,
  paymentProofUpload,
  uploadedPaymentProof,
}
