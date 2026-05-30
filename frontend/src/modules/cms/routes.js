import { useCmsAuthStore } from './stores/authStore'

const cmsRoutes = [
  {
    path: '/cms',
    redirect: '/cms/dashboard',
  },
  {
    path: '/cms/login',
    name: 'cms-login',
    component: () => import('./views/CmsLoginView.vue'),
    meta: { publicOnly: true },
  },
  {
    path: '/cms/unauthorized',
    name: 'cms-unauthorized',
    component: () => import('./views/CmsUnauthorizedView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cms',
    component: () => import('./layouts/CmsLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'cms-dashboard',
        component: () => import('./views/CmsDashboardView.vue'),
        meta: { permission: 'dashboard.view' },
      },
      {
        path: 'product-development',
        name: 'cms-product-development',
        component: () => import('@/modules/product/views/ProductDashboard.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'product-development/assets',
        name: 'cms-product-development-assets',
        component: () => import('@/modules/product/views/ProductList.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'product-development/development-plans',
        name: 'cms-product-development-plans',
        component: () => import('@/modules/product/views/DevelopmentPlanList.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'product-development/improvements',
        name: 'cms-product-development-improvements',
        component: () => import('@/modules/product/views/ImprovementMonitoring.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'product-development/activities',
        name: 'cms-product-development-activities',
        component: () => import('@/modules/product/views/TourismActivityList.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'product-development/packages',
        name: 'cms-product-development-packages',
        component: () => import('@/modules/product/views/TourismPackageList.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'tourism-packages',
        redirect: '/cms/product-development/packages',
      },
      {
        path: 'promotions',
        name: 'cms-promotions',
        component: () => import('./views/content/CmsPromotionsView.vue'),
        meta: { permission: 'promotions.view' },
      },
      {
        path: 'events',
        name: 'cms-events',
        component: () => import('./views/content/CmsEventsView.vue'),
        meta: { permission: 'events.view' },
      },
      {
        path: 'categories',
        name: 'cms-categories',
        component: () => import('./views/content/CmsCategoriesView.vue'),
        meta: { permissionsAny: ['events.view', 'products.view', 'destinations.view', 'museum.view'] },
      },
      {
        path: 'categories/events',
        name: 'cms-event-categories',
        component: () => import('./views/content/CmsEventCategoriesView.vue'),
        meta: { permission: 'events.view' },
      },
      {
        path: 'categories/products',
        name: 'cms-product-categories',
        component: () => import('./views/content/CmsProductCategoriesView.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'categories/destinations',
        name: 'cms-destination-categories',
        component: () => import('./views/content/CmsDestinationCategoriesView.vue'),
        meta: { permission: 'destinations.view' },
      },
      {
        path: 'categories/museum',
        name: 'cms-museum-categories',
        component: () => import('./views/content/CmsMuseumCategoriesView.vue'),
        meta: { permission: 'museum.view' },
      },
      {
        path: 'products',
        name: 'cms-products',
        component: () => import('./views/content/CmsProductsView.vue'),
        meta: { permission: 'products.view' },
      },
      {
        path: 'destinations',
        name: 'cms-destinations',
        component: () => import('./views/content/CmsDestinationsView.vue'),
        meta: { permission: 'destinations.view' },
      },
      {
        path: 'businesses',
        name: 'cms-businesses',
        component: () => import('./views/content/CmsBusinessesView.vue'),
        meta: { permission: 'businesses.view' },
      },
      {
        path: 'museum',
        name: 'cms-museum',
        component: () => import('./views/content/CmsMuseumArtifactsView.vue'),
        meta: { permission: 'museum.view' },
      },
      {
        path: 'map-locations',
        name: 'cms-map-locations',
        component: () => import('./views/content/CmsMapLocationsView.vue'),
        meta: { permission: 'map_locations.view' },
      },
      {
        path: ':pathMatch(.*)*',
        name: 'cms-not-found',
        component: () => import('./views/CmsNotFoundView.vue'),
      },
    ],
  },
]

export async function guardCmsRoute(to) {
  if (!to.path.startsWith('/cms')) return true

  const auth = useCmsAuthStore()

  if (to.meta.publicOnly) {
    await auth.bootstrap()
    if (auth.isAuthenticated) return { name: 'cms-dashboard' }
    return true
  }

  if (to.meta.requiresAuth || to.path.startsWith('/cms')) {
    const hadStoredToken = Boolean(auth.accessToken)
    await auth.bootstrap()

    if (!auth.isAuthenticated) {
      return {
        name: 'cms-login',
        query: {
          redirect: to.fullPath,
          ...(hadStoredToken ? { sessionExpired: '1' } : {}),
        },
      }
    }

    const requiredPermission = to.meta.permission
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
      return { name: 'cms-unauthorized' }
    }

    const requiredAny = to.meta.permissionsAny
    if (requiredAny?.length && !auth.hasAnyPermission(requiredAny)) {
      return { name: 'cms-unauthorized' }
    }
  }

  return true
}

export default cmsRoutes
