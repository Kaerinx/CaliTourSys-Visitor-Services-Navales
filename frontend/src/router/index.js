import { createRouter, createWebHistory } from 'vue-router'
import { cmsRoutes, guardCmsRoute } from '@/modules/cms'
import promotionRoutes from '@/modules/promotion/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...promotionRoutes, ...cmsRoutes],
})

router.beforeEach(guardCmsRoute)

export default router
