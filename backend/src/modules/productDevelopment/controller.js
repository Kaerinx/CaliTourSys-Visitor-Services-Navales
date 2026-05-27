const service = require('./service')
const validators = require('./validators')
const { successResponse } = require('../../utils/apiResponse')
const { setNoStore, setPublicReadCache } = require('../../utils/cacheHeaders')

function parse(schema, value) {
  return schema.parse(value)
}

function listHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const filters = parse(validators.listQuerySchema, req.query)
      setNoStore(res)
      return successResponse(req, res, await serviceFn(filters))
    } catch (error) {
      return next(error)
    }
  }
}

function publicListHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const filters = parse(validators.listQuerySchema, req.query)
      setPublicReadCache(res)
      return successResponse(req, res, await serviceFn(filters))
    } catch (error) {
      return next(error)
    }
  }
}

function idHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const { id } = parse(validators.uuidParamsSchema, req.params)
      setNoStore(res)
      return successResponse(req, res, await serviceFn(id, req))
    } catch (error) {
      return next(error)
    }
  }
}

function packageIdHandler(serviceFn) {
  return async (req, res, next) => {
    try {
      const { packageId } = parse(validators.packageParamsSchema, req.params)
      setNoStore(res)
      return successResponse(req, res, await serviceFn(packageId, req))
    } catch (error) {
      return next(error)
    }
  }
}

function bodyHandler(schema, serviceFn, statusCode = 200) {
  return async (req, res, next) => {
    try {
      const body = parse(schema, req.body || {})
      setNoStore(res)
      return successResponse(req, res, await serviceFn(body, req), statusCode)
    } catch (error) {
      return next(error)
    }
  }
}

function idBodyHandler(schema, serviceFn) {
  return async (req, res, next) => {
    try {
      const { id } = parse(validators.uuidParamsSchema, req.params)
      const body = parse(schema, req.body || {})
      setNoStore(res)
      return successResponse(req, res, await serviceFn(id, body, req))
    } catch (error) {
      return next(error)
    }
  }
}

function packageBodyHandler(schema, serviceFn) {
  return async (req, res, next) => {
    try {
      const { packageId } = parse(validators.packageParamsSchema, req.params)
      const body = parse(schema, req.body || {})
      setNoStore(res)
      return successResponse(req, res, await serviceFn(packageId, body, req))
    } catch (error) {
      return next(error)
    }
  }
}

async function getStatus(req, res, next) {
  try {
    setNoStore(res)
    return successResponse(req, res, service.getProductModuleStatus())
  } catch (error) {
    return next(error)
  }
}

async function getReports(req, res, next) {
  try {
    setNoStore(res)
    return successResponse(req, res, await service.getReportSummary())
  } catch (error) {
    return next(error)
  }
}

async function getPublicPackage(req, res, next) {
  try {
    const { slug } = parse(validators.packageSlugParamsSchema, req.params)
    setPublicReadCache(res)
    return successResponse(req, res, await service.getPublicPackage(slug))
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  archiveActivity: idHandler(service.archiveActivity),
  archiveAsset: idHandler(service.archiveAsset),
  archiveImprovement: idHandler(service.archiveImprovement),
  archivePackage: packageIdHandler(service.archivePackage),
  archivePlan: idHandler(service.archivePlan),
  createActivity: bodyHandler(validators.activityBodySchema, service.createActivity, 201),
  createAsset: bodyHandler(validators.assetBodySchema, service.createAsset, 201),
  createImprovement: bodyHandler(validators.improvementBodySchema, service.createImprovement, 201),
  createPackage: bodyHandler(validators.packageBodySchema, service.createPackage, 201),
  createPlan: bodyHandler(validators.planBodySchema, service.createPlan, 201),
  getActivity: idHandler(service.getActivity),
  getAsset: idHandler(service.getAsset),
  getImprovement: idHandler(service.getImprovement),
  getPackage: packageIdHandler(service.getPackage),
  getPlan: idHandler(service.getPlan),
  getPublicPackage,
  getReports,
  getStatus,
  listActivities: listHandler(service.listActivities),
  listAssets: listHandler(service.listAssets),
  listImprovements: listHandler(service.listImprovements),
  listPackages: listHandler(service.listPackages),
  listPlans: listHandler(service.listPlans),
  listPublicPackages: publicListHandler(service.listPublicPackages),
  markPackageReady: packageBodyHandler(validators.readinessBodySchema, service.markPackageReady),
  updateActivity: idBodyHandler(validators.activityBodySchema, service.updateActivity),
  updateAsset: idBodyHandler(validators.assetBodySchema, service.updateAsset),
  updateImprovement: idBodyHandler(validators.improvementBodySchema, service.updateImprovement),
  updatePackage: packageBodyHandler(validators.packageBodySchema, service.updatePackage),
  updatePlan: idBodyHandler(validators.planBodySchema, service.updatePlan),
}
