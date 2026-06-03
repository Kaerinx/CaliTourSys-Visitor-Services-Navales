import { Router } from 'express'

import { authenticate } from '../../middleware/auth.js'
import { getReports } from './reports.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getReports)

export default router
