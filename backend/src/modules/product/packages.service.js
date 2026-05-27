import { findActivityById } from './activities.model.js'
import { findAssetById } from './assets.model.js'
import {
  archivePackage,
  createPackage,
  findPackageById,
  findPackages,
  updatePackageStatus,
  updatePackage,
} from './packages.model.js'
import { PACKAGE_CATEGORIES, PACKAGE_ITEM_TYPES, PACKAGE_STATUSES } from './product.constants.js'
import { createStatusHistoryEntry } from './statusHistory.model.js'

const requiredFields = [
  'name',
  'description',
  'category',
  'targetMarket',
  'estimatedDuration',
  'packageStatus',
]

function normalizePackageItems(items = []) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => ({
      itemType: String(item.itemType || '').trim(),
      referenceId: String(item.referenceId || '').trim(),
    }))
    .filter((item) => item.itemType && item.referenceId)
}

function normalizePackageInput(input = {}) {
  return {
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    category: String(input.category || 'Nature & Eco').trim(),
    targetMarket: String(input.targetMarket || '').trim(),
    estimatedDuration: String(input.estimatedDuration || '').trim(),
    packageStatus: String(input.packageStatus || 'Draft').trim(),
    remarks: String(input.remarks || '').trim(),
    items: normalizePackageItems(input.items),
  }
}

function validatePackageInput(packageInput) {
  const missingFields = requiredFields.filter((field) => !packageInput[field])

  if (missingFields.length) {
    const error = new Error(`Missing required package fields: ${missingFields.join(', ')}`)
    error.status = 400
    throw error
  }

  if (!PACKAGE_STATUSES.includes(packageInput.packageStatus)) {
    const error = new Error('Invalid tourism package status.')
    error.status = 400
    throw error
  }

  if (!PACKAGE_CATEGORIES.includes(packageInput.category)) {
    const error = new Error('Invalid tourism package category.')
    error.status = 400
    throw error
  }

  if (!packageInput.items.length) {
    const error = new Error('Select at least one tourism asset or tourism activity for the package.')
    error.status = 400
    throw error
  }

  const uniqueItemKeys = new Set()

  for (const item of packageInput.items) {
    if (!PACKAGE_ITEM_TYPES.includes(item.itemType)) {
      const error = new Error('Invalid package item type.')
      error.status = 400
      throw error
    }

    const itemKey = `${item.itemType}:${item.referenceId}`

    if (uniqueItemKeys.has(itemKey)) {
      const error = new Error('Duplicate package items are not allowed.')
      error.status = 400
      throw error
    }

    uniqueItemKeys.add(itemKey)
  }
}

function ensureReadinessStatusNotSetThroughForm(packageInput) {
  if (packageInput.packageStatus === 'Ready for Promotion') {
    const error = new Error('Use the readiness review action to mark packages as Ready for Promotion.')
    error.status = 400
    throw error
  }
}

function ensurePackageExists(packageId) {
  const tourismPackage = findPackageById(packageId)

  if (!tourismPackage) {
    const error = new Error('Tourism package not found.')
    error.status = 404
    throw error
  }

  return tourismPackage
}

function ensureSelectablePackageItems(items) {
  for (const item of items) {
    if (item.itemType === 'Asset') {
      const asset = findAssetById(item.referenceId)

      if (!asset) {
        const error = new Error('Selected package asset not found.')
        error.status = 404
        throw error
      }

      if (asset.developmentStatus === 'Archived') {
        const error = new Error('Archived tourism assets cannot be selected for tourism packages.')
        error.status = 400
        throw error
      }
    }

    if (item.itemType === 'Activity') {
      const activity = findActivityById(item.referenceId)

      if (!activity) {
        const error = new Error('Selected package activity not found.')
        error.status = 404
        throw error
      }

      if (activity.activityStatus === 'Archived') {
        const error = new Error('Archived tourism activities cannot be selected for tourism packages.')
        error.status = 400
        throw error
      }

      if (activity.assetStatus === 'Archived') {
        const error = new Error('Activities linked to archived assets cannot be selected.')
        error.status = 400
        throw error
      }
    }
  }
}

function validateReadiness(tourismPackage) {
  const issues = []

  if (tourismPackage.packageStatus === 'Archived') {
    issues.push('Archived packages cannot be marked Ready for Promotion.')
  }

  if (!tourismPackage.name) {
    issues.push('Package name is required.')
  }

  if (!tourismPackage.description) {
    issues.push('Description is required.')
  }

  if (!tourismPackage.targetMarket) {
    issues.push('Target market is required.')
  }

  if (!tourismPackage.estimatedDuration) {
    issues.push('Estimated duration is required.')
  }

  if (!tourismPackage.items?.length) {
    issues.push('At least one linked asset or activity is required.')
  }

  for (const item of tourismPackage.items || []) {
    if (item.itemType === 'Asset' && item.status === 'Archived') {
      issues.push(`Linked asset "${item.name || item.referenceId}" is archived.`)
    }

    if (item.itemType === 'Activity' && item.status === 'Archived') {
      issues.push(`Linked activity "${item.name || item.referenceId}" is archived.`)
    }

    if (item.assetStatus === 'Archived') {
      issues.push(`Linked item "${item.name || item.referenceId}" belongs to an archived asset.`)
    }
  }

  return issues
}

export function listTourismPackages(filters) {
  return findPackages(filters)
}

export function getTourismPackage(packageId) {
  return ensurePackageExists(packageId)
}

export function createTourismPackage(input, user) {
  const packageInput = normalizePackageInput(input)
  validatePackageInput(packageInput)
  ensureReadinessStatusNotSetThroughForm(packageInput)
  ensureSelectablePackageItems(packageInput.items)

  return createPackage(packageInput, user)
}

export function updateTourismPackage(packageId, input) {
  ensurePackageExists(packageId)
  const packageInput = normalizePackageInput(input)
  validatePackageInput(packageInput)
  ensureReadinessStatusNotSetThroughForm(packageInput)
  ensureSelectablePackageItems(packageInput.items)

  return updatePackage(packageId, packageInput)
}

export function archiveTourismPackage(packageId) {
  ensurePackageExists(packageId)

  return archivePackage(packageId)
}

export function markTourismPackageReady(packageId, input = {}, user) {
  const tourismPackage = ensurePackageExists(packageId)

  if (tourismPackage.packageStatus === 'Ready for Promotion') {
    const error = new Error('Tourism package is already marked Ready for Promotion.')
    error.status = 400
    throw error
  }

  const readinessIssues = validateReadiness(tourismPackage)

  if (readinessIssues.length) {
    const error = new Error('Tourism package is not ready for promotion.')
    error.status = 400
    error.details = readinessIssues
    throw error
  }

  updatePackageStatus(packageId, 'Ready for Promotion')

  createStatusHistoryEntry({
    recordType: 'Package',
    recordId: packageId,
    previousStatus: tourismPackage.packageStatus,
    newStatus: 'Ready for Promotion',
    user,
    remarks: String(input.remarks || '').trim(),
  })

  return getTourismPackage(packageId)
}

export function listReadyForPromotionPackages() {
  return findPackages({ status: 'Ready for Promotion' }).map((tourismPackage) =>
    getTourismPackage(tourismPackage.id),
  )
}

export function getPackageOptions() {
  return {
    statuses: PACKAGE_STATUSES,
    categories: PACKAGE_CATEGORIES,
    itemTypes: PACKAGE_ITEM_TYPES,
  }
}
