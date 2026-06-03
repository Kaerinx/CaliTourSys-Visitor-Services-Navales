import {
  archiveTourismAsset,
  createTourismAsset,
  getAssetOptions,
  getTourismAsset,
  listTourismAssets,
  updateTourismAsset,
} from './assets.service.js'

export function listAssets(req, res) {
  const assets = listTourismAssets(req.query)

  res.json({
    data: assets,
    meta: {
      total: assets.length,
      options: getAssetOptions(),
    },
  })
}

export function getAsset(req, res) {
  res.json({
    data: getTourismAsset(req.params.assetId),
  })
}

export function createAsset(req, res) {
  const asset = createTourismAsset(req.body, req.user)

  res.status(201).json({
    data: asset,
    message: 'Tourism asset created successfully.',
  })
}

export function updateAsset(req, res) {
  const asset = updateTourismAsset(req.params.assetId, req.body)

  res.json({
    data: asset,
    message: 'Tourism asset updated successfully.',
  })
}

export function archiveAsset(req, res) {
  const asset = archiveTourismAsset(req.params.assetId)

  res.json({
    data: asset,
    message: 'Tourism asset archived successfully.',
  })
}
