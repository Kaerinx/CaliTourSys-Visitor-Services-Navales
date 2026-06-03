import AccreditationLayout from "@/modules/accreditation/views/AccreditationLayout.vue";
import LandingPage from "@/modules/accreditation/views/LandingPage.vue";
import LoginPage from "@/modules/accreditation/views/LoginPage.vue";
import RegistrationPage from "@/modules/accreditation/views/RegistrationPage.vue";
import DashboardRouter from "@/modules/accreditation/views/DashboardRouter.vue";
import BusinessProfile from "@/modules/accreditation/views/BusinessProfile.vue";
import ApplicationForm from "@/modules/accreditation/views/ApplicationForm.vue";
import MyApplications from "@/modules/accreditation/views/MyApplications.vue";
import TourismStaffDashboard from "@/modules/accreditation/views/TourismStaffDashboard.vue";
import StaffApplications from "@/modules/accreditation/views/StaffApplications.vue";
import ApplicationReview from "@/modules/accreditation/views/ApplicationReview.vue";
import AccreditationRecords from "@/modules/accreditation/views/AccreditationRecords.vue";
import ReportsPage from "@/modules/accreditation/views/ReportsPage.vue";
import AdminDashboard from "@/modules/accreditation/views/AdminDashboard.vue";
import UserManagement from "@/modules/accreditation/views/UserManagement.vue";
import RoleManagement from "@/modules/accreditation/views/RoleManagement.vue";
import AuditLogs from "@/modules/accreditation/views/AuditLogs.vue";
import NotificationsPage from "@/modules/accreditation/views/NotificationsPage.vue";
import AccountSettings from "@/modules/accreditation/views/AccountSettings.vue";
import VerifyEmailPage from "@/modules/accreditation/views/VerifyEmailPage.vue";

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
      { path: "staff-dashboard", component: StaffApplications, meta: { allowedRoles: ["tourism_staff"] } },
      { path: "review", component: ApplicationReview, meta: { allowedRoles: ["tourism_staff", "admin"] } },
      { path: "records", component: AccreditationRecords, meta: { allowedRoles: ["tourism_staff", "admin"] } },
      { path: "reports", component: ReportsPage, meta: { allowedRoles: ["tourism_staff", "admin"] } },
      { path: "admin-dashboard", component: AdminDashboard, meta: { allowedRoles: ["admin"] } },
      { path: "users", component: UserManagement, meta: { allowedRoles: ["admin"] } },
      { path: "roles", component: RoleManagement, meta: { allowedRoles: ["admin"] } },
      { path: "audit", component: AuditLogs, meta: { allowedRoles: ["admin"] } },
      { path: "notifications", component: NotificationsPage },
      { path: "settings", component: AccountSettings },
    ],
  },
];
