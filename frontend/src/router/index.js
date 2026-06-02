import { createRouter, createWebHistory } from 'vue-router'
import { cmsRoutes, guardCmsRoute } from '@/modules/cms'
import accreditationRoutes from '@/modules/accreditation/router/accreditationRoutes'
import { useCmsAuthStore } from '@/modules/cms/stores/authStore'
import promotionRoutes from '@/modules/promotion/routes'
import { setAuthFailureHandler } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'

const ProductDashboard = () => import('@/modules/product/views/ProductDashboard.vue')
const ProductList = () => import('@/modules/product/views/ProductList.vue')
const DevelopmentPlanList = () => import('@/modules/product/views/DevelopmentPlanList.vue')
const ImprovementMonitoring = () => import('@/modules/product/views/ImprovementMonitoring.vue')
const TourismActivityList = () => import('@/modules/product/views/TourismActivityList.vue')
const TourismPackageList = () => import('@/modules/product/views/TourismPackageList.vue')

const productRoutes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { productPublic: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { productRequiresAuth: true },
  },
  {
    path: '/product',
    name: 'product-dashboard',
    component: ProductDashboard,
    meta: { productRequiresAuth: true },
  },
  {
    path: '/product/assets',
    name: 'product-assets',
    component: ProductList,
    meta: { productRequiresAuth: true },
  },
  {
    path: '/product/development-plans',
    name: 'product-development-plans',
    component: DevelopmentPlanList,
    meta: { productRequiresAuth: true },
  },
  {
    path: '/product/improvements',
    name: 'product-improvements',
    component: ImprovementMonitoring,
    meta: { productRequiresAuth: true },
  },
  {
    path: '/product/activities',
    name: 'product-activities',
    component: TourismActivityList,
    meta: { productRequiresAuth: true },
  },
  {
    path: '/product/packages',
    name: 'product-packages',
    component: TourismPackageList,
    meta: { productRequiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...promotionRoutes, ...productRoutes, ...cmsRoutes, ...accreditationRoutes],
})

router.beforeEach(async (to) => {
  const cmsResult = await guardCmsRoute(to)
  if (cmsResult !== true) return cmsResult

  const auth = useAuthStore()
  const accreditationRequiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const accreditationAllowedRoles = to.matched
    .map((route) => route.meta.allowedRoles)
    .filter(Boolean)
    .flat()
  const accreditationToken = localStorage.getItem('auth_token')
  const accreditationUser = JSON.parse(localStorage.getItem('auth_user') || 'null')

  if (accreditationRequiresAuth && !accreditationToken) {
    return '/accreditation/login'
  }

  if (accreditationAllowedRoles.length && !accreditationAllowedRoles.includes(accreditationUser?.role)) {
    return '/accreditation/app/dashboard'
  }

  if (to.meta.productRequiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

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
