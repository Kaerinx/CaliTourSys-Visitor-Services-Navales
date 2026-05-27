import { createRouter, createWebHistory } from 'vue-router'
import { cmsRoutes, guardCmsRoute } from '@/modules/cms'
import promotionRoutes from '@/modules/promotion/routes'
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
  routes: [...promotionRoutes, ...productRoutes, ...cmsRoutes],
})

router.beforeEach(async (to) => {
  const cmsResult = await guardCmsRoute(to)
  if (cmsResult !== true) return cmsResult

  const auth = useAuthStore()

  if (to.meta.productRequiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
