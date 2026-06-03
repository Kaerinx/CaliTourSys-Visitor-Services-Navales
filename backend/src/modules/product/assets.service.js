import {
  archiveAsset,
  createAsset,
  findAssetById,
  findAssets,
  updateAsset,
} from './assets.model.js'
import { ASSET_CATEGORIES, ASSET_STATUSES } from './product.constants.js'

const requiredFields = ['name', 'description', 'location', 'category', 'targetMarket']

function normalizeAssetInput(input = {}) {
  return {
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    location: String(input.location || '').trim(),
    category: String(input.category || '').trim(),
    targetMarket: String(input.targetMarket || '').trim(),
    developmentStatus: String(input.developmentStatus || 'Draft').trim(),
    remarks: String(input.remarks || '').trim(),
  }
}

function validateAssetInput(assetInput) {
  const missingFields = requiredFields.filter((field) => !assetInput[field])

  if (missingFields.length) {
    const error = new Error(`Missing required asset fields: ${missingFields.join(', ')}`)
    error.status = 400
    throw error
  }

  if (!ASSET_CATEGORIES.includes(assetInput.category)) {
    const error = new Error('Invalid asset category.')
    error.status = 400
    throw error
  }

  if (!ASSET_STATUSES.includes(assetInput.developmentStatus)) {
    const error = new Error('Invalid asset development status.')
    error.status = 400
    throw error
  }
}

function ensureAssetExists(assetId) {
  const asset = findAssetById(assetId)

  if (!asset) {
    const error = new Error('Tourism asset not found.')
    error.status = 404
    throw error
  }

  return asset
}

export function listTourismAssets(filters) {
  return findAssets(filters)
}

export function getTourismAsset(assetId) {
  return ensureAssetExists(assetId)
}

export function createTourismAsset(input, user) {
  const assetInput = normalizeAssetInput(input)
  validateAssetInput(assetInput)

  return createAsset(assetInput, user)
}

export function updateTourismAsset(assetId, input) {
  ensureAssetExists(assetId)
  const assetInput = normalizeAssetInput(input)
  validateAssetInput(assetInput)

  return updateAsset(assetId, assetInput)
}

export function archiveTourismAsset(assetId) {
  ensureAssetExists(assetId)

  return archiveAsset(assetId)
}

export function getAssetOptions() {
  return {
    categories: ASSET_CATEGORIES,
    statuses: ASSET_STATUSES,
  }
}
