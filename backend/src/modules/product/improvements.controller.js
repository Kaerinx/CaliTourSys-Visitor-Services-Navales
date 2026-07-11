import {
  archiveImprovementRecord,
  createImprovementRecord,
  getImprovementOptions,
  getImprovementRecord,
  listImprovementRecords,
  updateImprovementRecord,
} from './improvements.service.js'

export function listImprovements(req, res) {
  const improvements = listImprovementRecords(req.query)

  res.json({
    data: improvements,
    meta: {
      total: improvements.length,
      options: getImprovementOptions(),
    },
  })
}

export function getImprovement(req, res) {
  res.json({
    data: getImprovementRecord(req.params.improvementId),
  })
}

export function createImprovement(req, res) {
  const improvement = createImprovementRecord(req.body, req.user)

  res.status(201).json({
    data: improvement,
    message: 'Improvement record created successfully.',
  })
}

export function updateImprovement(req, res) {
  const improvement = updateImprovementRecord(req.params.improvementId, req.body)

  res.json({
    data: improvement,
    message: 'Improvement record updated successfully.',
  })
}

export function archiveImprovement(req, res) {
  const improvement = archiveImprovementRecord(req.params.improvementId)

  res.json({
    data: improvement,
    message: 'Improvement record archived successfully.',
  })
}
