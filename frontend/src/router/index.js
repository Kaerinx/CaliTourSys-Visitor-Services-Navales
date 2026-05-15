import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../modules/visitor/stores/authStore'

const PublicLayout = () => import('../modules/visitor/views/PublicLayout.vue')
const HomeView = () => import('../modules/visitor/views/HomeView.vue')
const AboutView = () => import('../modules/visitor/views/AboutView.vue')
const DestinationsView = () => import('../modules/visitor/views/DestinationsView.vue')
const EventsView = () => import('../modules/visitor/views/EventsView.vue')
const PublicInquiryView = () => import('../modules/visitor/views/PublicInquiryView.vue')
const LoginView = () => import('../modules/visitor/views/LoginView.vue')

const AdminDashboard = () => import('../modules/visitor/views/AdminDashboard.vue')
const TourismStaffDashboard = () => import('../modules/visitor/views/TourismStaffDashboard.vue')
const ReceptionistDashboard = () => import('../modules/visitor/views/ReceptionistDashboard.vue')
const VisitorRegistration = () => import('../modules/visitor/views/VisitorRegistration.vue')
const MuseumRegistration = () => import('../modules/visitor/views/MuseumRegistration.vue')
const VisitorRecords = () => import('../modules/visitor/views/VisitorRecords.vue')
const MuseumRecords = () => import('../modules/visitor/views/MuseumRecords.vue')
const StaffInquiries = () => import('../modules/visitor/views/StaffInquiries.vue')
const ReportsAnalytics = () => import('../modules/visitor/views/ReportsAnalytics.vue')
const UserManagement = () => import('../modules/visitor/views/UserManagement.vue')
const EstablishmentManagement = () => import('../modules/visitor/views/EstablishmentManagement.vue')
const PlaceholderManagement = () => import('../modules/visitor/views/PlaceholderManagement.vue')

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'about', name: 'about', component: AboutView },
      { path: 'destinations', name: 'destinations', component: DestinationsView },
      { path: 'events', name: 'events', component: EventsView },
      { path: 'inquiries', name: 'public-inquiries', component: PublicInquiryView },
    ],
  },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },

  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/visitor-records',
    name: 'admin-visitors',
    component: VisitorRecords,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  { path: '/admin/visitors', redirect: '/admin/visitor-records' },
  {
    path: '/admin/establishments',
    name: 'admin-establishments',
    component: EstablishmentManagement,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/museum-records',
    name: 'admin-museum-records',
    component: MuseumRecords,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/inquiries',
    name: 'admin-inquiries',
    component: StaffInquiries,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/content',
    name: 'admin-content',
    component: PlaceholderManagement,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Tourism Content Management' },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: ReportsAnalytics,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: UserManagement,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: PlaceholderManagement,
    meta: { requiresAuth: true, roles: ['admin'], title: 'Settings' },
  },

  {
    path: '/tourism/dashboard',
    name: 'tourism-dashboard',
    component: TourismStaffDashboard,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/tourism/visitor-registration',
    name: 'tourism-visitor-registration',
    component: VisitorRegistration,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/tourism/museum-registration',
    name: 'tourism-museum-registration',
    component: MuseumRegistration,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/tourism/visitor-records',
    name: 'tourism-visitor-records',
    component: VisitorRecords,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/tourism/museum-records',
    name: 'tourism-museum-records',
    component: MuseumRecords,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/tourism/inquiries',
    name: 'tourism-inquiries',
    component: StaffInquiries,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },
  {
    path: '/tourism/reports',
    name: 'tourism-reports',
    component: ReportsAnalytics,
    meta: { requiresAuth: true, roles: ['admin', 'tourism_staff'] },
  },

  {
    path: '/receptionist/dashboard',
    name: 'receptionist-dashboard',
    component: ReceptionistDashboard,
    meta: { requiresAuth: true, roles: ['admin', 'receptionist'] },
  },
  {
    path: '/receptionist/guest-registration',
    name: 'receptionist-guest-registration',
    component: VisitorRegistration,
    meta: { requiresAuth: true, roles: ['admin', 'receptionist'] },
  },
  {
    path: '/receptionist/arrival-monitoring',
    redirect: '/receptionist/records',
  },
  {
    path: '/receptionist/records',
    name: 'receptionist-records',
    component: VisitorRecords,
    meta: { requiresAuth: true, roles: ['admin', 'receptionist'] },
  },
  {
    path: '/profile',
    name: 'profile',
    component: PlaceholderManagement,
    meta: { requiresAuth: true, title: 'Profile' },
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return auth.dashboardRoute
  }

  const allowedRoles = to.meta.roles
  if (allowedRoles?.length && !allowedRoles.includes(auth.user?.role)) {
    return auth.dashboardRoute || { name: 'login' }
  }

  return true
})

export default router
