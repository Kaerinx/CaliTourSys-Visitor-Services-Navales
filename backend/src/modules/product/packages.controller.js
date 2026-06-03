import {
  archiveTourismPackage,
  createTourismPackage,
  getPackageOptions,
  getTourismPackage,
  listReadyForPromotionPackages,
  listTourismPackages,
  markTourismPackageReady,
  updateTourismPackage,
} from './packages.service.js'

export function listPackages(req, res) {
  const packages = listTourismPackages(req.query)

  res.json({
    data: packages,
    meta: {
      total: packages.length,
      options: getPackageOptions(),
    },
  })
}

export function getPackage(req, res) {
  res.json({
    data: getTourismPackage(req.params.packageId),
  })
}

export function listReadyPackages(req, res) {
  const packages = listReadyForPromotionPackages()

  res.json({
    data: packages,
    meta: {
      total: packages.length,
    },
  })
}

export function createPackage(req, res) {
  const tourismPackage = createTourismPackage(req.body, req.user)

  res.status(201).json({
    data: tourismPackage,
    message: 'Tourism package created successfully.',
  })
}

export function updatePackage(req, res) {
  const tourismPackage = updateTourismPackage(req.params.packageId, req.body)

  res.json({
    data: tourismPackage,
    message: 'Tourism package updated successfully.',
  })
}

export function archivePackage(req, res) {
  const tourismPackage = archiveTourismPackage(req.params.packageId)

  res.json({
    data: tourismPackage,
    message: 'Tourism package archived successfully.',
  })
}

export function markPackageReady(req, res) {
  const tourismPackage = markTourismPackageReady(req.params.packageId, req.body, req.user)

  res.json({
    data: tourismPackage,
    message: 'Tourism package marked Ready for Promotion.',
  })
}
