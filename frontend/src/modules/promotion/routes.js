const promotionRoutes = [
  {
    path: '/',
    redirect: '/promotion',
  },
  {
    path: '/promotion',
    name: 'promotion-home',
    component: () => import('./views/PromotionHomeView.vue'),
  },
  {
    path: '/promotion/events',
    name: 'promotion-events',
    component: () => import('./views/EventsPromotions.vue'),
  },
  {
    path: '/promotion/products',
    name: 'promotion-products',
    component: () => import('./views/ProductPromotionView.vue'),
  },
  {
    path: '/promotion/products/:slug',
    name: 'promotion-product-detail',
    component: () => import('./views/PromotionDetail.vue'),
    props: true,
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
    path: '/promotion/discovery',
    name: 'promotion-discovery',
    component: () => import('./views/TouristDiscoveryView.vue'),
  },
  {
    path: '/promotion/destinations',
    name: 'promotion-destinations',
    component: () => import('./views/TouristDiscoveryView.vue'),
  },
  {
    path: '/promotion/map',
    name: 'promotion-map',
    component: () => import('./views/TouristDiscoveryView.vue'),
  },
  {
    path: '/promotion/museum',
    name: 'promotion-museum',
    component: () => import('./views/InteractiveMuseumView.vue'),
  },
  {
    path: '/promotion/inquiry',
    name: 'promotion-inquiry',
    component: () => import('./views/TourismInquiryView.vue'),
  },
]

export default promotionRoutes
