import { Router } from 'express'

import { authenticate, authorize, ROLES } from '../../middleware/auth.js'
import {
  archiveDevelopmentPlan,
  createDevelopmentPlan,
  getDevelopmentPlan,
  listDevelopmentPlans,
  updateDevelopmentPlan,
} from './developmentPlans.controller.js'

const router = Router()

const planEditors = [ROLES.TOURISM_STAFF, ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]
const planArchivists = [ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]

router.use(authenticate)

router.get('/', listDevelopmentPlans)
router.get('/:planId', getDevelopmentPlan)
router.post('/', authorize(...planEditors), createDevelopmentPlan)
router.put('/:planId', authorize(...planEditors), updateDevelopmentPlan)
router.patch('/:planId/archive', authorize(...planArchivists), archiveDevelopmentPlan)

export default router
