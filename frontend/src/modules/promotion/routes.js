function touristAuthRedirect(to, defaultMode = 'login') {
  const requestedMode = Array.isArray(to.query.mode) ? to.query.mode[0] : to.query.mode
  const mode = requestedMode === 'register' ? 'register' : defaultMode
  const redirect = Array.isArray(to.query.redirect) ? to.query.redirect[0] : to.query.redirect

  return {
    path: '/',
    query: {
      auth: mode,
      ...(typeof redirect === 'string' ? { redirect } : {}),
    },
  }
}

const promotionRoutes = [
  {
    path: '/',
    name: 'promotion-home',
    alias: '/home',
    component: () => import('./views/PromotionHomeView.vue'),
  },
  {
    path: '/promotion',
    redirect: '/',
  },
  {
    path: '/login',
    name: 'tourist-auth-entry',
    redirect: (to) => touristAuthRedirect(to),
  },
  {
    path: '/events',
    name: 'promotion-events',
    component: () => import('./views/EventsPromotions.vue'),
  },
  {
    path: '/promotion/events',
    redirect: '/events',
  },
  {
    path: '/products',
    name: 'promotion-products',
    component: () => import('./views/ProductPromotionView.vue'),
  },
  {
    path: '/products/:slug',
    name: 'promotion-product-detail',
    component: () => import('./views/PromotionDetail.vue'),
    props: true,
  },
  {
    path: '/promotion/products',
    redirect: '/products',
  },
  {
    path: '/promotion/products/:slug',
    redirect: (to) => `/products/${to.params.slug}`,
  },
  {
    path: '/packages',
    name: 'promotion-packages',
    component: () => import('./views/PackagePromotionView.vue'),
  },
  {
    path: '/packages/:slug/booking-info',
    name: 'promotion-package-booking-info',
    component: () => import('./views/PackageBookingInfoView.vue'),
    props: true,
    meta: { touristRequiresAuth: true },
  },
  {
    path: '/packages/:slug/payment',
    name: 'promotion-package-booking-payment',
    component: () => import('./views/PackageBookingPaymentView.vue'),
    props: true,
    meta: { touristRequiresAuth: true },
  },
  {
    path: '/packages/:slug',
    name: 'promotion-package-detail',
    component: () => import('./views/PackageDetailView.vue'),
    props: true,
  },
  {
    path: '/package-booking-status',
    name: 'promotion-package-booking-status',
    component: () => import('./views/PackageBookingLookupView.vue'),
  },
  {
    path: '/tourist/login',
    name: 'tourist-login',
    redirect: (to) => touristAuthRedirect(to),
  },
  {
    path: '/tourist/register',
    name: 'tourist-register',
    redirect: (to) => touristAuthRedirect(to, 'register'),
  },
  {
    path: '/tourist/dashboard',
    name: 'tourist-dashboard',
    redirect: '/tourist/bookings',
  },
  {
    path: '/tourist/bookings',
    name: 'tourist-bookings',
    component: () => import('./views/TouristDashboardView.vue'),
    meta: { touristRequiresAuth: true },
  },
  {
    path: '/tourist/profile',
    name: 'tourist-profile',
    component: () => import('./views/TouristProfileView.vue'),
    meta: { touristRequiresAuth: true },
  },
  {
    path: '/tourist/settings',
    name: 'tourist-settings',
    component: () => import('./views/TouristSettingsView.vue'),
    meta: { touristRequiresAuth: true },
  },
  {
    path: '/tourist/bookings/:requestId',
    name: 'tourist-booking-detail',
    component: () => import('./views/TouristBookingDetailView.vue'),
    props: true,
    meta: { touristRequiresAuth: true },
  },
  {
    path: '/promotion/packages',
    redirect: '/packages',
  },
  {
    path: '/promotion/packages/:slug/booking-info',
    redirect: (to) => ({
      path: `/packages/${to.params.slug}/booking-info`,
      query: to.query,
    }),
  },
  {
    path: '/promotion/packages/:slug/payment',
    redirect: (to) => ({
      path: `/packages/${to.params.slug}/payment`,
      query: to.query,
    }),
  },
  {
    path: '/promotion/package-booking-status',
    redirect: '/package-booking-status',
  },
  {
    path: '/promotion/packages/:slug',
    redirect: (to) => `/packages/${to.params.slug}`,
  },
  {
    path: '/destinations',
    name: 'promotion-discovery',
    component: () => import('./views/TouristDiscoveryView.vue'),
  },
  {
    path: '/promotion/discovery',
    redirect: (to) => ({ path: '/destinations', query: to.query }),
  },
  {
    path: '/promotion/destinations',
    redirect: (to) => ({ path: '/destinations', query: to.query }),
  },
  {
    path: '/promotion/map',
    redirect: (to) => ({ path: '/destinations', query: to.query }),
  },
  {
    path: '/promotion/museum',
    name: 'promotion-museum',
    component: () => import('./views/InteractiveMuseumView.vue'),
  },
  {
    path: '/accredited-establishments',
    name: 'promotion-accredited-establishments',
    component: () => import('./views/AccreditedEstablishmentsView.vue'),
  },
  {
    path: '/accredited-establishments/:slug',
    name: 'promotion-establishment-information',
    component: () => import('./views/EstablishmentInformationView.vue'),
    props: true,
  },
  {
    path: '/promotion/accredited-establishments',
    redirect: '/accredited-establishments',
  },
  {
    path: '/promotion/accredited-establishments/:slug',
    redirect: (to) => `/accredited-establishments/${to.params.slug}`,
  },
  {
    path: '/promotion/inquiry',
    name: 'promotion-inquiry',
    component: () => import('./views/TourismInquiryView.vue'),
  },
]

export default promotionRoutes
