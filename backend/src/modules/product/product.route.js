import { Router } from 'express'

import { authenticate } from '../../middleware/auth.js'
import { getStatus } from './product.controller.js'

const router = Router()

router.get('/status', authenticate, getStatus)

export default router
