function getPagination({ page = 1, limit = 12 } = {}) {
  const safePage = Number(page)
  const safeLimit = Number(limit)

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  }
}

function buildPaginationMeta(page, limit, totalItems) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit)

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  }
}

module.exports = {
  getPagination,
  buildPaginationMeta,
}
