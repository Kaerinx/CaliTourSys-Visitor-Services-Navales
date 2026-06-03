import { findAssetById } from './assets.model.js'
import {
  archiveDevelopmentPlan,
  createDevelopmentPlan,
  findDevelopmentPlanById,
  findDevelopmentPlans,
  updateDevelopmentPlan,
} from './developmentPlans.model.js'
import { DEVELOPMENT_PLAN_STATUSES } from './product.constants.js'

const requiredFields = [
  'assetId',
  'planTitle',
  'objectives',
  'targetMarket',
  'improvementNeeds',
  'proposedActivities',
  'timelineStart',
  'timelineEnd',
  'assignedPersonnel',
]

function normalizeDevelopmentPlanInput(input = {}) {
  return {
    assetId: String(input.assetId || '').trim(),
    planTitle: String(input.planTitle || '').trim(),
    objectives: String(input.objectives || '').trim(),
    targetMarket: String(input.targetMarket || '').trim(),
    improvementNeeds: String(input.improvementNeeds || '').trim(),
    proposedActivities: String(input.proposedActivities || '').trim(),
    timelineStart: String(input.timelineStart || '').trim(),
    timelineEnd: String(input.timelineEnd || '').trim(),
    assignedPersonnel: String(input.assignedPersonnel || '').trim(),
    planStatus: String(input.planStatus || 'Draft').trim(),
    remarks: String(input.remarks || '').trim(),
  }
}

function validateTimeline(planInput) {
  if (planInput.timelineStart > planInput.timelineEnd) {
    const error = new Error('Timeline start date cannot be later than timeline end date.')
    error.status = 400
    throw error
  }
}

function validateDevelopmentPlanInput(planInput) {
  const missingFields = requiredFields.filter((field) => !planInput[field])

  if (missingFields.length) {
    const error = new Error(`Missing required development plan fields: ${missingFields.join(', ')}`)
    error.status = 400
    throw error
  }

  if (!DEVELOPMENT_PLAN_STATUSES.includes(planInput.planStatus)) {
    const error = new Error('Invalid development plan status.')
    error.status = 400
    throw error
  }

  validateTimeline(planInput)
}

function ensurePlanExists(planId) {
  const plan = findDevelopmentPlanById(planId)

  if (!plan) {
    const error = new Error('Development plan not found.')
    error.status = 404
    throw error
  }

  return plan
}

function ensureSelectableAsset(assetId) {
  const asset = findAssetById(assetId)

  if (!asset) {
    const error = new Error('Selected tourism asset not found.')
    error.status = 404
    throw error
  }

  if (asset.developmentStatus === 'Archived') {
    const error = new Error('Archived tourism assets cannot be selected for development plans.')
    error.status = 400
    throw error
  }

  return asset
}

export function listProductDevelopmentPlans(filters) {
  return findDevelopmentPlans(filters)
}

export function getProductDevelopmentPlan(planId) {
  return ensurePlanExists(planId)
}

export function createProductDevelopmentPlan(input, user) {
  const planInput = normalizeDevelopmentPlanInput(input)
  validateDevelopmentPlanInput(planInput)
  ensureSelectableAsset(planInput.assetId)

  return createDevelopmentPlan(planInput, user)
}

export function updateProductDevelopmentPlan(planId, input) {
  ensurePlanExists(planId)
  const planInput = normalizeDevelopmentPlanInput(input)
  validateDevelopmentPlanInput(planInput)
  ensureSelectableAsset(planInput.assetId)

  return updateDevelopmentPlan(planId, planInput)
}

export function archiveProductDevelopmentPlan(planId) {
  ensurePlanExists(planId)

  return archiveDevelopmentPlan(planId)
}

export function getDevelopmentPlanOptions() {
  return {
    statuses: DEVELOPMENT_PLAN_STATUSES,
  }
}
