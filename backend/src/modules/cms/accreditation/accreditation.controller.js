const accreditationModel = require('../../accreditation/accreditation.model')
const accreditationService = require('../../accreditation/accreditation.service')
const jwt = require('jsonwebtoken')
const { getJwtSecret } = require('../../../config/authConfig')
const { paginatedResponse, successResponse } = require('../../../utils/apiResponse')
const { setNoStore } = require('../../../utils/cacheHeaders')

function normalizeListResult(result) {
  if (Array.isArray(result)) return { data: result, pagination: null }
  return { data: result.items || [], pagination: result.pagination || null }
}

async function getDashboard(req, res, next) {
  try {
    const [applicationsResult, recordsResult] = await Promise.all([
      accreditationModel.listApplications({}),
      accreditationModel.listAccreditationRecords({}),
    ])
    const applications = Array.isArray(applicationsResult) ? applicationsResult : applicationsResult.items || []
    const records = Array.isArray(recordsResult) ? recordsResult : recordsResult.items || []

    setNoStore(res)
    return successResponse(req, res, {
      totals: {
        applications: applications.length,
        submitted: applications.filter((item) => item.status === 'submitted').length,
        underReview: applications.filter((item) => item.status === 'under_review').length,
        forRevision: applications.filter((item) => item.status === 'for_revision').length,
        approved: applications.filter((item) => item.status === 'approved').length,
        rejected: applications.filter((item) => item.status === 'rejected').length,
        activeRecords: records.filter((item) => item.status === 'active').length,
      },
      recentApplications: applications.slice(0, 5),
      recentRecords: records.slice(0, 5),
    })
  } catch (error) {
    return next(error)
  }
}

async function getSession(req, res, next) {
  try {
    const displayName = req.user.displayName || req.user.email || 'Tourism Staff'
    const [firstName, ...rest] = displayName.split(' ').filter(Boolean)
    const lastName = rest.join(' ')
    const user = {
      id: req.user.id,
      firstName: firstName || 'Tourism',
      first_name: firstName || 'Tourism',
      lastName: lastName || 'Staff',
      last_name: lastName || 'Staff',
      email: req.user.email,
      phone: req.user.profile?.phone || '',
      role: 'tourism_staff',
      status: 'active',
    }
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    )

    setNoStore(res)
    return successResponse(req, res, { token, user })
  } catch (error) {
    return next(error)
  }
}

async function listApplications(req, res, next) {
  try {
    const result = normalizeListResult(await accreditationModel.listApplications({
      q: req.query.search || req.query.q,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      pageSize: req.query.limit || req.query.pageSize,
    }))

    setNoStore(res)
    return paginatedResponse(req, res, result.data, result.pagination)
  } catch (error) {
    return next(error)
  }
}

async function getApplication(req, res, next) {
  try {
    const application = await accreditationModel.getApplicationById(req.params.id)
    if (!application) {
      const error = new Error('Application not found.')
      error.statusCode = 404
      error.publicMessage = 'Application not found.'
      throw error
    }

    const documents = await accreditationModel.listDocuments(application.id)
    setNoStore(res)
    return successResponse(req, res, { application, documents })
  } catch (error) {
    return next(error)
  }
}

async function reviewApplication(req, res, next) {
  try {
    const application = await accreditationService.reviewApplication(req.user.id, req.params.id, req.body || {})
    if (!application) {
      const error = new Error('Application not found.')
      error.statusCode = 404
      error.publicMessage = 'Application not found.'
      throw error
    }

    setNoStore(res)
    return successResponse(req, res, { application })
  } catch (error) {
    return next(error)
  }
}

async function listRecords(req, res, next) {
  try {
    const result = normalizeListResult(await accreditationModel.listAccreditationRecords({
      q: req.query.search || req.query.q,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      pageSize: req.query.limit || req.query.pageSize,
    }))

    setNoStore(res)
    return paginatedResponse(req, res, result.data, result.pagination)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getApplication,
  getDashboard,
  getSession,
  listApplications,
  listRecords,
  reviewApplication,
}
