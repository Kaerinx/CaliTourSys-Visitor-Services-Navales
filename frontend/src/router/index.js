import { createRouter, createWebHistory } from 'vue-router'
import promotionRoutes from '@/modules/promotion/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...promotionRoutes],
})

export default router
