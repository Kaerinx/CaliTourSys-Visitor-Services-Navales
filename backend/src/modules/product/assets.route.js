import { Router } from 'express'

import { authenticate, authorize, ROLES } from '../../middleware/auth.js'
import { archiveAsset, createAsset, getAsset, listAssets, updateAsset } from './assets.controller.js'

const router = Router()

const assetEditors = [ROLES.TOURISM_STAFF, ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]
const assetArchivists = [ROLES.TOURISM_OFFICER, ROLES.SYSTEM_ADMINISTRATOR]

router.use(authenticate)

router.get('/', listAssets)
router.get('/:assetId', getAsset)
router.post('/', authorize(...assetEditors), createAsset)
router.put('/:assetId', authorize(...assetEditors), updateAsset)
router.patch('/:assetId/archive', authorize(...assetArchivists), archiveAsset)

export default router
