import { Router } from 'express'

import { authenticate, authorize, ROLES } from '../../middleware/auth.js'
import {
  archivePackage,
  createPackage,
  getPackage,
  listReadyPackages,
  listPackages,
  markPackageReady,
  updatePackage,
} from './packages.controller.js'

const router = Router()

const packageEditors = [ROLES.TOURISM_STAFF, ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]
const packageArchivists = [ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]
const readinessApprovers = [ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]

router.get('/ready-for-promotion', listReadyPackages)

router.use(authenticate)

router.get('/', listPackages)
router.get('/:packageId', getPackage)
router.post('/', authorize(...packageEditors), createPackage)
router.put('/:packageId', authorize(...packageEditors), updatePackage)
router.patch('/:packageId/archive', authorize(...packageArchivists), archivePackage)
router.patch('/:packageId/ready-for-promotion', authorize(...readinessApprovers), markPackageReady)

export default router
