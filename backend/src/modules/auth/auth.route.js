import { Router } from 'express'

import { authenticate } from '../../middleware/auth.js'
import { getCurrentUser, login } from './auth.controller.js'

const router = Router()

router.post('/login', login)
router.get('/me', authenticate, getCurrentUser)

export default router
