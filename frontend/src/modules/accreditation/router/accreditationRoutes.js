import AccreditationLayout from "@/modules/accreditation/views/AccreditationLayout.vue";
import LandingPage from "@/modules/accreditation/views/LandingPage.vue";
import LoginPage from "@/modules/accreditation/views/LoginPage.vue";
import RegistrationPage from "@/modules/accreditation/views/RegistrationPage.vue";
import DashboardRouter from "@/modules/accreditation/views/DashboardRouter.vue";
import BusinessProfile from "@/modules/accreditation/views/BusinessProfile.vue";
import ApplicationForm from "@/modules/accreditation/views/ApplicationForm.vue";
import MyApplications from "@/modules/accreditation/views/MyApplications.vue";
import AdminDashboard from "@/modules/accreditation/views/AdminDashboard.vue";
import UserManagement from "@/modules/accreditation/views/UserManagement.vue";
import RoleManagement from "@/modules/accreditation/views/RoleManagement.vue";
import AuditLogs from "@/modules/accreditation/views/AuditLogs.vue";
import NotificationsPage from "@/modules/accreditation/views/NotificationsPage.vue";
import AccountSettings from "@/modules/accreditation/views/AccountSettings.vue";
import VerifyEmailPage from "@/modules/accreditation/views/VerifyEmailPage.vue";

const redirectToCmsBusinesses = (path) => (to) => ({
  path,
  query: to.query,
  hash: to.hash,
});

export default [
  {
    path: "/accreditation",
    name: "accreditation-landing",
    component: LandingPage,
  },
  {
    path: "/accreditation/login",
    name: "accreditation-login",
    component: LoginPage,
  },
  {
    path: "/accreditation/register",
    name: "accreditation-register",
    component: RegistrationPage,
  },
  {
    path: "/accreditation/verify-email",
    name: "accreditation-verify-email",
    component: VerifyEmailPage,
  },
  {
    path: "/accreditation/app",
    component: AccreditationLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/accreditation/app/dashboard" },
      { path: "dashboard", component: DashboardRouter },
      { path: "business-profile", component: BusinessProfile, meta: { allowedRoles: ["business_owner"] } },
      { path: "apply", component: ApplicationForm, meta: { allowedRoles: ["business_owner"] } },
      { path: "applications", component: MyApplications, meta: { allowedRoles: ["business_owner"] } },
      { path: "staff-dashboard", redirect: redirectToCmsBusinesses("/cms/businesses/applications") },
      { path: "review", redirect: redirectToCmsBusinesses("/cms/businesses/review") },
      { path: "records", redirect: redirectToCmsBusinesses("/cms/businesses/records") },
      { path: "reports", redirect: redirectToCmsBusinesses("/cms/businesses/reports") },
      { path: "admin-dashboard", component: AdminDashboard, meta: { allowedRoles: ["admin"] } },
      { path: "users", component: UserManagement, meta: { allowedRoles: ["admin"] } },
      { path: "roles", component: RoleManagement, meta: { allowedRoles: ["admin"] } },
      { path: "audit", component: AuditLogs, meta: { allowedRoles: ["admin"] } },
      { path: "notifications", component: NotificationsPage },
      { path: "settings", component: AccountSettings },
    ],
  },
];
