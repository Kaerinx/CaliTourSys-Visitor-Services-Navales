import { findAssetById } from './assets.model.js'
import { findDevelopmentPlanById } from './developmentPlans.model.js'
import {
  archiveActivity,
  createActivity,
  findActivities,
  findActivityById,
  updateActivity,
} from './activities.model.js'
import { ACTIVITY_STATUSES } from './product.constants.js'

const requiredFields = ['assetId', 'name', 'description', 'duration', 'targetMarket', 'activityStatus']

function normalizeActivityInput(input = {}) {
  return {
    assetId: String(input.assetId || '').trim(),
    planId: String(input.planId || '').trim(),
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    duration: String(input.duration || '').trim(),
    targetMarket: String(input.targetMarket || '').trim(),
    activityStatus: String(input.activityStatus || 'Draft').trim(),
    remarks: String(input.remarks || '').trim(),
  }
}

function validateActivityInput(activityInput) {
  const missingFields = requiredFields.filter((field) => !activityInput[field])

  if (missingFields.length) {
    const error = new Error(`Missing required activity fields: ${missingFields.join(', ')}`)
    error.status = 400
    throw error
  }

  if (!ACTIVITY_STATUSES.includes(activityInput.activityStatus)) {
    const error = new Error('Invalid tourism activity status.')
    error.status = 400
    throw error
  }
}

function ensureActivityExists(activityId) {
  const activity = findActivityById(activityId)

  if (!activity) {
    const error = new Error('Tourism activity not found.')
    error.status = 404
    throw error
  }

  return activity
}

function ensureSelectableAsset(assetId) {
  const asset = findAssetById(assetId)

  if (!asset) {
    const error = new Error('Selected tourism asset not found.')
    error.status = 404
    throw error
  }

  if (asset.developmentStatus === 'Archived') {
    const error = new Error('Archived tourism assets cannot be selected for tourism activities.')
    error.status = 400
    throw error
  }

  return asset
}

function ensureSelectablePlan(planId, assetId) {
  if (!planId) {
    return null
  }

  const plan = findDevelopmentPlanById(planId)

  if (!plan) {
    const error = new Error('Selected development plan not found.')
    error.status = 404
    throw error
  }

  if (plan.planStatus === 'Archived') {
    const error = new Error('Archived development plans cannot be selected for tourism activities.')
    error.status = 400
    throw error
  }

  if (plan.assetStatus === 'Archived') {
    const error = new Error('Development plans linked to archived assets cannot be selected.')
    error.status = 400
    throw error
  }

  if (plan.assetId !== assetId) {
    const error = new Error('Selected development plan must belong to the selected tourism asset.')
    error.status = 400
    throw error
  }

  return plan
}

export function listTourismActivities(filters) {
  return findActivities(filters)
}

export function getTourismActivity(activityId) {
  return ensureActivityExists(activityId)
}

export function createTourismActivity(input, user) {
  const activityInput = normalizeActivityInput(input)
  validateActivityInput(activityInput)
  ensureSelectableAsset(activityInput.assetId)
  ensureSelectablePlan(activityInput.planId, activityInput.assetId)

  return createActivity(activityInput, user)
}

export function updateTourismActivity(activityId, input) {
  ensureActivityExists(activityId)
  const activityInput = normalizeActivityInput(input)
  validateActivityInput(activityInput)
  ensureSelectableAsset(activityInput.assetId)
  ensureSelectablePlan(activityInput.planId, activityInput.assetId)

  return updateActivity(activityId, activityInput)
}

export function archiveTourismActivity(activityId) {
  ensureActivityExists(activityId)

  return archiveActivity(activityId)
}

export function getActivityOptions() {
  return {
    statuses: ACTIVITY_STATUSES,
  }
}
