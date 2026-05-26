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
    await auth.bootstrap()

    if (!auth.isAuthenticated) {
      return {
        name: 'cms-login',
        query: { redirect: to.fullPath },
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
