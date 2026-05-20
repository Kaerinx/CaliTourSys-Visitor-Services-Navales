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
  const token = localStorage.getItem("auth_token");

  if (requiresAuth && !token) {
    return "/accreditation/login";
  }

  return true;
});

export default router;
