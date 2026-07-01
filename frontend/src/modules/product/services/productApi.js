import { request } from '@/services/http'

function productRequest(path, options) {
  return request(path, { ...options, auth: true }).then((response) => {
    if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
      return response
    }

    return { data: response }
  })
}

export function getProductModuleStatus() {
  return productRequest('/product/status')
}

export function getProductReportSummary() {
  return productRequest('/reports')
}

export function getTourismAssets(filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const query = params.toString()

  return productRequest(`/assets${query ? `?${query}` : ''}`)
}

export function createTourismAsset(asset) {
  return productRequest('/assets', {
    method: 'POST',
    body: asset,
  })
}

export function updateTourismAsset(assetId, asset) {
  return productRequest(`/assets/${assetId}`, {
    method: 'PUT',
    body: asset,
  })
}

export function archiveTourismAsset(assetId) {
  return productRequest(`/assets/${assetId}/archive`, {
    method: 'PATCH',
  })
}

export function getDevelopmentPlans(filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const query = params.toString()

  return productRequest(`/development-plans${query ? `?${query}` : ''}`)
}

export function createDevelopmentPlan(plan) {
  return productRequest('/development-plans', {
    method: 'POST',
    body: plan,
  })
}

export function updateDevelopmentPlan(planId, plan) {
  return productRequest(`/development-plans/${planId}`, {
    method: 'PUT',
    body: plan,
  })
}

export function archiveDevelopmentPlan(planId) {
  return productRequest(`/development-plans/${planId}/archive`, {
    method: 'PATCH',
  })
}

export function getImprovementRecords(filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const query = params.toString()

  return productRequest(`/improvements${query ? `?${query}` : ''}`)
}

export function createImprovementRecord(improvement) {
  return productRequest('/improvements', {
    method: 'POST',
    body: improvement,
  })
}

export function updateImprovementRecord(improvementId, improvement) {
  return productRequest(`/improvements/${improvementId}`, {
    method: 'PUT',
    body: improvement,
  })
}

export function archiveImprovementRecord(improvementId) {
  return productRequest(`/improvements/${improvementId}/archive`, {
    method: 'PATCH',
  })
}

export function getTourismActivities(filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const query = params.toString()

  return productRequest(`/activities${query ? `?${query}` : ''}`)
}

export function createTourismActivity(activity) {
  return productRequest('/activities', {
    method: 'POST',
    body: activity,
  })
}

export function updateTourismActivity(activityId, activity) {
  return productRequest(`/activities/${activityId}`, {
    method: 'PUT',
    body: activity,
  })
}

export function archiveTourismActivity(activityId) {
  return productRequest(`/activities/${activityId}/archive`, {
    method: 'PATCH',
  })
}

export function getTourismPackages(filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const query = params.toString()

  return productRequest(`/packages${query ? `?${query}` : ''}`)
}

export function getTourismPackage(packageId) {
  return productRequest(`/packages/${packageId}`)
}

export function getReadyForPromotionPackages() {
  return productRequest('/packages/ready-for-promotion')
}

export function createTourismPackage(tourismPackage) {
  return productRequest('/packages', {
    method: 'POST',
    body: tourismPackage,
  })
}

export function updateTourismPackage(packageId, tourismPackage) {
  return productRequest(`/packages/${packageId}`, {
    method: 'PUT',
    body: tourismPackage,
  })
}

export function archiveTourismPackage(packageId) {
  return productRequest(`/packages/${packageId}/archive`, {
    method: 'PATCH',
  })
}

export function markTourismPackageReady(packageId, remarks) {
  return productRequest(`/packages/${packageId}/ready-for-promotion`, {
    method: 'PATCH',
    body: { remarks },
  })
}
