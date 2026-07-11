const repository = require('./cms.repository')
const { buildPaginationMeta, getPagination } = require('../../utils/pagination')
const { getAllowedNavigationItems } = require('../../utils/cmsNavigation')

async function getHealth() {
  return {
    status: 'ok',
    service: 'CaliTourSys CMS API',
    version: 'v1',
    authenticated: true,
  }
}

async function getDashboard() {
  const [summary, recentAuditLogs] = await Promise.all([
    repository.getDashboardSummary(),
    repository.listRecentAuditLogs(5),
  ])

  return {
    ...summary,
    recentAuditLogs,
  }
}

function getNavigation(user) {
  return {
    items: getAllowedNavigationItems(user.permissions || []),
  }
}

async function listAuditLogs(filters) {
  const pagination = getPagination(filters)
  const result = await repository.listAuditLogs({
    pagination,
    action: filters.action,
    entityType: filters.entityType,
  })

  return {
    data: result.items,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, result.totalItems),
  }
}

module.exports = {
  getDashboard,
  getHealth,
  getNavigation,
  listAuditLogs,
}

