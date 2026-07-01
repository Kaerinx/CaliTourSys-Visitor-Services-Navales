const repository = require('./repository')
const { productModuleStatus, PUBLIC_PACKAGE_STATUSES } = require('./constants')

function createError(statusCode, code, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.publicMessage = message
  if (details) error.details = details
  return error
}

function notFound(label) {
  return createError(404, 'NOT_FOUND', `${label} not found.`)
}

function invalid(message, details) {
  return createError(400, 'VALIDATION_ERROR', message, details)
}

async function requireAsset(id) {
  const asset = await repository.getAssetById(id)
  if (!asset) throw notFound('Tourism asset')
  return asset
}

async function requirePlan(id) {
  const plan = await repository.getPlanById(id)
  if (!plan) throw notFound('Development plan')
  return plan
}

async function requireImprovement(id) {
  const improvement = await repository.getImprovementById(id)
  if (!improvement) throw notFound('Improvement record')
  return improvement
}

async function requireActivity(id) {
  const activity = await repository.getActivityById(id)
  if (!activity) throw notFound('Tourism activity')
  return activity
}

async function requirePackage(id) {
  const tourismPackage = await repository.getPackageById(id)
  if (!tourismPackage) throw notFound('Tourism package')
  return tourismPackage
}

async function ensureAssetSelectable(assetId) {
  const asset = await requireAsset(assetId)
  if (asset.developmentStatus === 'Archived') {
    throw invalid('Archived tourism assets cannot be selected.')
  }
  return asset
}

async function ensurePlanSelectable(planId) {
  const plan = await requirePlan(planId)
  if (plan.planStatus === 'Archived') throw invalid('Archived development plans cannot be selected.')
  if (plan.assetStatus === 'Archived') throw invalid('Plans linked to archived assets cannot be selected.')
  return plan
}

async function ensureActivitySelectable(activityId) {
  const activity = await requireActivity(activityId)
  if (activity.activityStatus === 'Archived') {
    throw invalid('Archived tourism activities cannot be selected.')
  }
  if (activity.assetStatus === 'Archived') {
    throw invalid('Activities linked to archived assets cannot be selected.')
  }
  return activity
}

async function validatePackageItems(items) {
  const unique = new Set()

  for (const item of items) {
    const key = `${item.itemType}:${item.referenceId}`
    if (unique.has(key)) throw invalid('Duplicate package items are not allowed.')
    unique.add(key)

    if (item.itemType === 'Plan') await ensurePlanSelectable(item.referenceId)
    if (item.itemType === 'Asset') await ensureAssetSelectable(item.referenceId)
    if (item.itemType === 'Activity') await ensureActivitySelectable(item.referenceId)
  }
}

function readinessIssues(tourismPackage) {
  const issues = []

  if (tourismPackage.packageStatus === 'Archived') {
    issues.push('Archived packages cannot be marked Ready for Promotion.')
  }
  if (!tourismPackage.name) issues.push('Package name is required.')
  if (!tourismPackage.description) issues.push('Description is required.')
  if (!tourismPackage.category) issues.push('Package category is required.')
  if (!tourismPackage.targetMarket) issues.push('Target market is required.')
  if (!tourismPackage.estimatedDuration) issues.push('Estimated duration is required.')
  if (!tourismPackage.items?.some((item) => item.itemType === 'Plan')) {
    issues.push('At least one linked plan is required.')
  }

  for (const item of tourismPackage.items || []) {
    if (item.itemType === 'Plan' && item.status === 'Archived') {
      issues.push(`Linked plan "${item.name || item.referenceId}" is archived.`)
    }
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

async function createPlan(data, req) {
  await ensureAssetSelectable(data.assetId)
  return repository.createPlan(data, req.user?.id)
}

async function updatePlan(id, data) {
  await requirePlan(id)
  await ensureAssetSelectable(data.assetId)
  const updated = await repository.updatePlan(id, data)
  if (!updated) throw notFound('Development plan')
  return updated
}

async function createImprovement(data, req) {
  await ensurePlanSelectable(data.planId)
  return repository.createImprovement(data, req.user?.id)
}

async function updateImprovement(id, data) {
  await requireImprovement(id)
  await ensurePlanSelectable(data.planId)
  const updated = await repository.updateImprovement(id, data)
  if (!updated) throw notFound('Improvement record')
  return updated
}

async function createActivity(data, req) {
  await ensureAssetSelectable(data.assetId)
  if (data.planId) await ensurePlanSelectable(data.planId)
  return repository.createActivity(data, req.user?.id)
}

async function updateActivity(id, data) {
  await requireActivity(id)
  await ensureAssetSelectable(data.assetId)
  if (data.planId) await ensurePlanSelectable(data.planId)
  const updated = await repository.updateActivity(id, data)
  if (!updated) throw notFound('Tourism activity')
  return updated
}

async function createPackage(data, req) {
  await validatePackageItems(data.items)
  return repository.createPackage(data, req.user?.id)
}

async function updatePackage(id, data) {
  await requirePackage(id)
  await validatePackageItems(data.items)
  const updated = await repository.updatePackage(id, data)
  if (!updated) throw notFound('Tourism package')
  return updated
}

async function markPackageReady(id, body, req) {
  const tourismPackage = await requirePackage(id)
  if (tourismPackage.packageStatus === 'Ready for Promotion') {
    throw invalid('Tourism package is already marked Ready for Promotion.')
  }

  const issues = readinessIssues(tourismPackage)
  if (issues.length) {
    throw invalid('Tourism package is not ready for promotion.', issues)
  }

  await repository.updatePackageStatus(id, 'Ready for Promotion')
  await repository.createStatusHistoryEntry({
    recordType: 'Package',
    recordId: id,
    previousStatus: tourismPackage.packageStatus,
    newStatus: 'Ready for Promotion',
    user: req.user,
    remarks: body.remarks || '',
  })

  return requirePackage(id)
}

async function getPublicPackage(slug) {
  const summary = await repository.getPublicPackageBySlug(slug)
  if (!summary) throw notFound('Tourism package')
  return requirePackage(summary.id)
}

module.exports = {
  archiveActivity: async (id) => {
    await requireActivity(id)
    return repository.archiveActivity(id)
  },
  archiveAsset: async (id) => {
    await requireAsset(id)
    return repository.archiveAsset(id)
  },
  archiveImprovement: async (id) => {
    await requireImprovement(id)
    return repository.archiveImprovement(id)
  },
  archivePackage: async (id) => {
    await requirePackage(id)
    return repository.archivePackage(id)
  },
  archivePlan: async (id) => {
    await requirePlan(id)
    return repository.archivePlan(id)
  },
  createActivity,
  createAsset: (data, req) => repository.createAsset(data, req.user?.id),
  createImprovement,
  createPackage,
  createPlan,
  getActivity: requireActivity,
  getAsset: requireAsset,
  getImprovement: requireImprovement,
  getPackage: requirePackage,
  getPlan: requirePlan,
  getProductModuleStatus: () => productModuleStatus,
  getPublicPackage,
  getReportSummary: repository.getReportSummary,
  listActivities: repository.listActivities,
  listAssets: repository.listAssets,
  listImprovements: repository.listImprovements,
  listPackages: repository.listPackages,
  listPlans: repository.listPlans,
  listPublicPackages: repository.listPublicPackages,
  markPackageReady,
  publicPackageStatuses: PUBLIC_PACKAGE_STATUSES,
  updateActivity,
  updateAsset: async (id, data) => {
    await requireAsset(id)
    const updated = await repository.updateAsset(id, data)
    if (!updated) throw notFound('Tourism asset')
    return updated
  },
  updateImprovement,
  updatePackage,
  updatePlan,
}
