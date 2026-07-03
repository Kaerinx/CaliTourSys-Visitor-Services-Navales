const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { env } = require('../../config/env')

const uploadRoot = path.resolve(__dirname, '../../../uploads/product-assets')
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function ensureUploadRoot() {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

function safeBaseName(value) {
  return path
    .basename(value || 'asset-image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48) || 'asset-image'
}

function extensionFor(file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext
  if (file.mimetype === 'image/png') return '.png'
  if (file.mimetype === 'image/webp') return '.webp'
  return '.jpg'
}

function publicUploadUrl(file) {
  const pathname = `/uploads/product-assets/${file.filename}`
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

const assetImageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, and WebP images can be uploaded.')
      error.statusCode = 400
      error.code = 'VALIDATION_ERROR'
      return callback(error)
    }

    return callback(null, true)
  },
})

function uploadedAssetImages(req) {
  const files = req.file ? [req.file] : (req.files || [])

  return files.map((file) => ({
    imageUrl: publicUploadUrl(file),
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
  }))
}

module.exports = {
  assetImageUpload,
  uploadedAssetImages,
}
