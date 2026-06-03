import {
  archiveTourismActivity,
  createTourismActivity,
  getActivityOptions,
  getTourismActivity,
  listTourismActivities,
  updateTourismActivity,
} from './activities.service.js'

export function listActivities(req, res) {
  const activities = listTourismActivities(req.query)

  res.json({
    data: activities,
    meta: {
      total: activities.length,
      options: getActivityOptions(),
    },
  })
}

export function getActivity(req, res) {
  res.json({
    data: getTourismActivity(req.params.activityId),
  })
}

export function createActivity(req, res) {
  const activity = createTourismActivity(req.body, req.user)

  res.status(201).json({
    data: activity,
    message: 'Tourism activity created successfully.',
  })
}

export function updateActivity(req, res) {
  const activity = updateTourismActivity(req.params.activityId, req.body)

  res.json({
    data: activity,
    message: 'Tourism activity updated successfully.',
  })
}

export function archiveActivity(req, res) {
  const activity = archiveTourismActivity(req.params.activityId)

  res.json({
    data: activity,
    message: 'Tourism activity archived successfully.',
  })
}
