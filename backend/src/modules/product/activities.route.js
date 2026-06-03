import { Router } from 'express'

import { authenticate, authorize, ROLES } from '../../middleware/auth.js'
import {
  archiveActivity,
  createActivity,
  getActivity,
  listActivities,
  updateActivity,
} from './activities.controller.js'

const router = Router()

const activityEditors = [ROLES.TOURISM_STAFF, ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]
const activityArchivists = [ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]

router.use(authenticate)

router.get('/', listActivities)
router.get('/:activityId', getActivity)
router.post('/', authorize(...activityEditors), createActivity)
router.put('/:activityId', authorize(...activityEditors), updateActivity)
router.patch('/:activityId/archive', authorize(...activityArchivists), archiveActivity)

export default router
