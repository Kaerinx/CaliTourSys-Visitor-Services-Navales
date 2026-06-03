import { findDevelopmentPlanById } from './developmentPlans.model.js'
import {
  archiveImprovement,
  createImprovement,
  findImprovementById,
  findImprovements,
  updateImprovement,
} from './improvements.model.js'
import { IMPROVEMENT_STATUSES } from './product.constants.js'

const requiredFields = ['planId', 'progressPercentage', 'improvementStatus', 'updateDate', 'remarks']

function normalizeImprovementInput(input = {}) {
  const rawProgress = Number(input.progressPercentage)

  return {
    planId: String(input.planId || '').trim(),
    progressPercentage: Number.isFinite(rawProgress) ? rawProgress : null,
    improvementStatus: String(input.improvementStatus || 'Ongoing').trim(),
    updateDate: String(input.updateDate || '').trim(),
    remarks: String(input.remarks || '').trim(),
  }
}

function validateImprovementInput(improvementInput) {
  const missingFields = requiredFields.filter((field) => {
    if (field === 'progressPercentage') {
      return improvementInput.progressPercentage === null
    }

    return !improvementInput[field]
  })

  if (missingFields.length) {
    const error = new Error(`Missing required improvement fields: ${missingFields.join(', ')}`)
    error.status = 400
    throw error
  }

  if (
    !Number.isInteger(improvementInput.progressPercentage) ||
    improvementInput.progressPercentage < 0 ||
    improvementInput.progressPercentage > 100
  ) {
    const error = new Error('Progress percentage must be a whole number from 0 to 100.')
    error.status = 400
    throw error
  }

  if (!IMPROVEMENT_STATUSES.includes(improvementInput.improvementStatus)) {
    const error = new Error('Invalid improvement status.')
    error.status = 400
    throw error
  }
}

function ensureImprovementExists(improvementId) {
  const improvement = findImprovementById(improvementId)

  if (!improvement) {
    const error = new Error('Improvement record not found.')
    error.status = 404
    throw error
  }

  return improvement
}

function ensureSelectablePlan(planId) {
  const plan = findDevelopmentPlanById(planId)

  if (!plan) {
    const error = new Error('Selected development plan not found.')
    error.status = 404
    throw error
  }

  if (plan.planStatus === 'Archived') {
    const error = new Error('Archived development plans cannot be selected for improvement monitoring.')
    error.status = 400
    throw error
  }

  if (plan.assetStatus === 'Archived') {
    const error = new Error('Development plans linked to archived assets cannot be selected.')
    error.status = 400
    throw error
  }

  return plan
}

export function listImprovementRecords(filters) {
  return findImprovements(filters)
}

export function getImprovementRecord(improvementId) {
  return ensureImprovementExists(improvementId)
}

export function createImprovementRecord(input, user) {
  const improvementInput = normalizeImprovementInput(input)
  validateImprovementInput(improvementInput)
  ensureSelectablePlan(improvementInput.planId)

  return createImprovement(improvementInput, user)
}

export function updateImprovementRecord(improvementId, input) {
  ensureImprovementExists(improvementId)
  const improvementInput = normalizeImprovementInput(input)
  validateImprovementInput(improvementInput)
  ensureSelectablePlan(improvementInput.planId)

  return updateImprovement(improvementId, improvementInput)
}

export function archiveImprovementRecord(improvementId) {
  ensureImprovementExists(improvementId)

  return archiveImprovement(improvementId)
}

export function getImprovementOptions() {
  return {
    statuses: IMPROVEMENT_STATUSES,
  }
}
