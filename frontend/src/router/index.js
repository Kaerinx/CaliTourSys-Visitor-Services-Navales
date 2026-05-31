import { createRouter, createWebHistory } from "vue-router";
import accreditationRoutes from "@/modules/accreditation/router/accreditationRoutes";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/accreditation",
    },
    ...accreditationRoutes,
  ],
});

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);
  const allowedRoles = to.matched
    .map((route) => route.meta.allowedRoles)
    .filter(Boolean)
    .flat();
  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(localStorage.getItem("auth_user") || "null");

  if (requiresAuth && !token) {
    return "/accreditation/login";
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return "/accreditation/app/dashboard";
  }

  return true;
});

export default router;
