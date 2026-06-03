import { Router } from 'express'

import { authenticate, authorize, ROLES } from '../../middleware/auth.js'
import {
  archiveImprovement,
  createImprovement,
  getImprovement,
  listImprovements,
  updateImprovement,
} from './improvements.controller.js'

const router = Router()

const improvementEditors = [ROLES.TOURISM_STAFF, ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]
const improvementArchivists = [ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]

router.use(authenticate)

router.get('/', listImprovements)
router.get('/:improvementId', getImprovement)
router.post('/', authorize(...improvementEditors), createImprovement)
router.put('/:improvementId', authorize(...improvementEditors), updateImprovement)
router.patch('/:improvementId/archive', authorize(...improvementArchivists), archiveImprovement)

export default router
