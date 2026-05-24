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
  }

  return true
}

export default cmsRoutes
