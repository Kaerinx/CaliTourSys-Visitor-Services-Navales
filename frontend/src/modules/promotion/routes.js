const promotionRoutes = [
  {
    path: '/',
    name: 'promotion-home',
    component: () => import('./views/PromotionHomeView.vue'),
  },
  {
    path: '/promotion',
    redirect: '/',
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
    path: '/packages/:slug',
    name: 'promotion-package-detail',
    component: () => import('./views/PackageDetailView.vue'),
    props: true,
  },
  {
    path: '/promotion/packages',
    redirect: '/packages',
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
    path: '/promotion/accredited-establishments',
    redirect: '/accredited-establishments',
  },
  {
    path: '/promotion/inquiry',
    name: 'promotion-inquiry',
    component: () => import('./views/TourismInquiryView.vue'),
  },
]

export default promotionRoutes
