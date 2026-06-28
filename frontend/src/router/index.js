import { createRouter, createWebHistory } from 'vue-router'
import { cmsRoutes, guardCmsRoute } from '@/modules/cms'
import accreditationRoutes from '@/modules/accreditation/router/accreditationRoutes'
import { useCmsAuthStore } from '@/modules/cms/stores/authStore'
import promotionRoutes from '@/modules/promotion/routes'
import { setAuthFailureHandler } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useAuthStore as useVisitorAuthStore } from '@/modules/visitor/stores/authStore'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'

const ProductDashboard = () => import('@/modules/product/views/ProductDashboard.vue')
const ProductList = () => import('@/modules/product/views/ProductList.vue')
const DevelopmentPlanList = () => import('@/modules/product/views/DevelopmentPlanList.vue')
const ImprovementMonitoring = () => import('@/modules/product/views/ImprovementMonitoring.vue')
const TourismActivityList = () => import('@/modules/product/views/TourismActivityList.vue')
const TourismPackageList = () => import('@/modules/product/views/TourismPackageList.vue')

const VisitorAdminDashboard = () => import('@/modules/visitor/views/AdminDashboard.vue')
const VisitorReceptionistDashboard = () => import('@/modules/visitor/views/ReceptionistDashboard.vue')
const VisitorRegistration = () => import('@/modules/visitor/views/VisitorRegistration.vue')
const VisitorMuseumRegistration = () => import('@/modules/visitor/views/MuseumRegistration.vue')
const VisitorRecords = () => import('@/modules/visitor/views/VisitorRecords.vue')
const VisitorMuseumRecords = () => import('@/modules/visitor/views/MuseumRecords.vue')
const VisitorUserManagement = () => import('@/modules/visitor/views/UserManagement.vue')
const VisitorAdministration = () => import('@/modules/visitor/views/Administration.vue')
const VisitorEstablishmentManagement = () => import('@/modules/visitor/views/EstablishmentManagement.vue')
const VisitorProfile = () => import('@/modules/visitor/views/ProfileView.vue')

const visitorLoginRedirect = { name: 'cms-login', query: { redirect: '/cms/visitor' } }

function redirectToCmsVisitor(path) {
  return (to) => ({
    path,
    query: to.query,
    hash: to.hash,
  })
}

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

const visitorRoutes = [
  {
    path: '/visitor',
    redirect: visitorLoginRedirect,
  },
  {
    path: '/visitor/login',
    name: 'visitor-login',
    redirect: visitorLoginRedirect,
  },
  {
    path: '/visitor/admin',
    redirect: redirectToCmsVisitor('/cms/visitor/admin'),
  },
  {
    path: '/visitor/staff',
    redirect: redirectToCmsVisitor('/cms/visitor/staff'),
  },
  {
    path: '/visitor/receptionist',
    redirect: redirectToCmsVisitor('/cms/visitor/receptionist'),
  },
  {
    path: '/visitor/registration',
    redirect: redirectToCmsVisitor('/cms/visitor/registration'),
  },
  {
    path: '/visitor/museum-registration',
    redirect: redirectToCmsVisitor('/cms/visitor/museum-registration'),
  },
  {
    path: '/visitor/records',
    redirect: redirectToCmsVisitor('/cms/visitor/records'),
  },
  {
    path: '/visitor/receptionist/records',
    redirect: redirectToCmsVisitor('/cms/visitor/receptionist/records'),
  },
  {
    path: '/visitor/museum-records',
    redirect: redirectToCmsVisitor('/cms/visitor/museum-records'),
  },
  {
    path: '/visitor/inquiries',
    redirect: redirectToCmsVisitor('/cms/visitor/inquiries'),
  },
  {
    path: '/visitor/reports',
    redirect: redirectToCmsVisitor('/cms/visitor/reports'),
  },
  {
    path: '/visitor/admin/administration',
    redirect: redirectToCmsVisitor('/cms/visitor/administration'),
  },
  {
    path: '/visitor/admin/users',
    redirect: redirectToCmsVisitor('/cms/visitor/users'),
  },
  {
    path: '/visitor/admin/establishments',
    redirect: redirectToCmsVisitor('/cms/visitor/establishments'),
  },
  {
    path: '/visitor/profile',
    redirect: redirectToCmsVisitor('/cms/visitor/profile'),
  },
  {
    path: '/cms/visitor',
    name: 'visitor-entry',
    meta: { visitorRequiresAuth: true },
  },
  {
    path: '/cms/visitor/admin',
    name: 'visitor-admin-dashboard',
    component: VisitorAdminDashboard,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin'] },
  },
  {
    path: '/cms/visitor/receptionist',
    name: 'visitor-receptionist-dashboard',
    component: VisitorReceptionistDashboard,
    meta: { visitorRequiresAuth: true, visitorRoles: ['receptionist'] },
  },
  {
    path: '/cms/visitor/registration',
    name: 'visitor-registration',
    component: VisitorRegistration,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin', 'tourism_staff', 'receptionist'] },
  },
  {
    path: '/cms/visitor/museum-registration',
    name: 'visitor-museum-registration',
    component: VisitorMuseumRegistration,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/cms/visitor/receptionist/records',
    name: 'visitor-receptionist-records',
    component: VisitorRecords,
    meta: { visitorRequiresAuth: true, visitorRoles: ['receptionist'], visitorStandalone: true },
  },
  {
    path: '/cms/visitor/museum-records',
    name: 'visitor-museum-records',
    component: VisitorMuseumRecords,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/cms/visitor/administration',
    name: 'visitor-admin-administration',
    component: VisitorAdministration,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin'] },
  },
  {
    path: '/cms/visitor/users',
    name: 'visitor-admin-users',
    component: VisitorUserManagement,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin'] },
  },
  {
    path: '/cms/visitor/establishments',
    name: 'visitor-admin-establishments',
    component: VisitorEstablishmentManagement,
    meta: { visitorRequiresAuth: true, visitorRoles: ['admin'] },
  },
  {
    path: '/cms/visitor/profile',
    name: 'visitor-profile',
    component: VisitorProfile,
    meta: { visitorRequiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...promotionRoutes, ...productRoutes, ...visitorRoutes, ...cmsRoutes, ...accreditationRoutes],
})

router.beforeEach(async (to) => {
  const cmsResult = await guardCmsRoute(to)
  if (cmsResult !== true) return cmsResult

  const auth = useAuthStore()
  if (to.path.startsWith('/accreditation')) {
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
  }

  const visitorAuth = useVisitorAuthStore()
  if (to.name === 'visitor-entry') {
    return visitorAuth.dashboardRoute || { name: 'cms-unauthorized' }
  }

  if (to.meta.visitorRequiresAuth && !visitorAuth.isAuthenticated) {
    return { name: 'cms-login', query: { redirect: to.fullPath } }
  }

  const visitorRoles = to.meta.visitorRoles
  if (visitorRoles?.length && !visitorRoles.includes(visitorAuth.user?.role)) {
    return visitorAuth.dashboardRoute || { name: 'cms-unauthorized' }
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
