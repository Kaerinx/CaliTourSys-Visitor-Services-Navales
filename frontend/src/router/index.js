import { createRouter, createWebHistory } from 'vue-router'
import { cmsRoutes, guardCmsRoute } from '@/modules/cms'
import { useCmsAuthStore } from '@/modules/cms/stores/authStore'
import promotionRoutes from '@/modules/promotion/routes'
import { setAuthFailureHandler } from '@/services/http'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...promotionRoutes, ...cmsRoutes],
})

router.beforeEach(guardCmsRoute)

let handlingCmsAuthFailure = false

setAuthFailureHandler(() => {
  const currentRoute = router.currentRoute.value
  if (!currentRoute.path.startsWith('/cms') || currentRoute.name === 'cms-login') return

  const auth = useCmsAuthStore()
  const redirect = currentRoute.fullPath
  auth.expireSession()

  if (handlingCmsAuthFailure) return
  handlingCmsAuthFailure = true

  router
    .replace({
      name: 'cms-login',
      query: { redirect, sessionExpired: '1' },
    })
    .catch(() => {})
    .finally(() => {
      handlingCmsAuthFailure = false
    })
})

export default router
