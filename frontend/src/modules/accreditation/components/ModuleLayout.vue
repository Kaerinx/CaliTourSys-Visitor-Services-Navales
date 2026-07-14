<template>
  <div class="app-shell" :class="portalClass">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <Building2 :size="24" />
        </div>
        <div>
          <h2>LGU Tourism</h2>
          <p>Accreditation System</p>
        </div>
      </div>

      <nav>
        <RouterLink
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="nav-link"
        >
          <component :is="item.icon" :size="20" class="nav-icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <button class="sidebar-logout" @click="logout">
        <LogOut :size="20" />
        Logout
      </button>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="search-wrap">
          <Search :size="16" />
          <input
            v-model="searchTerm"
            class="search"
            placeholder="Search applications, businesses..."
            @keydown.enter="submitSearch"
          />
        </div>
        <div class="topbar-user">
          <RouterLink class="icon-button notification-button" to="/accreditation/app/notifications">
            <Bell :size="20" />
            <span v-if="notificationCount" class="notification-count">{{ notificationCount }}</span>
          </RouterLink>
          <div>
            <strong>{{ displayName }}</strong>
            <p>{{ roleLabel }}</p>
          </div>
          <div class="avatar">
            <User :size="20" />
          </div>
        </div>
      </header>

      <main>
        <slot />
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { getNotifications } from "@/modules/accreditation/services/accreditationApi";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from "@lucide/vue";

const router = useRouter();
const auth = useAuthStore();
const searchTerm = ref("");
const unreadNotifications = ref(0);

const roleLabel = computed(() => {
  if (auth.role === "admin") return "System Administrator";
  if (auth.role === "tourism_staff") return "Tourism Staff / Officer";
  return "Business Owner";
});

const displayName = computed(() =>
  auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : "User"
);

const notificationCount = computed(() => unreadNotifications.value);
const portalClass = computed(() => ({
  "business-owner-portal": auth.role === "business_owner",
}));

onMounted(async () => {
  await auth.connectDemoToBackend();
  if (isDemoSession()) return;

  try {
    const result = await getNotifications();
    unreadNotifications.value =
      result.unreadCount ?? (result.notifications || []).filter((item) => !item.is_read).length;
  } catch (_error) {
    unreadNotifications.value = 0;
  }
});

const menu = computed(() => {
  if (auth.role === "admin") {
    return [
      { label: "Dashboard", path: "/accreditation/app/dashboard", icon: LayoutDashboard },
      { label: "User Management", path: "/accreditation/app/users", icon: Users },
      { label: "Role Management", path: "/accreditation/app/roles", icon: Shield },
      { label: "Audit Logs", path: "/accreditation/app/audit", icon: FileCheck },
      { label: "Notifications", path: "/accreditation/app/notifications", icon: Bell },
      { label: "Settings", path: "/accreditation/app/settings", icon: Settings },
    ];
  }

  if (auth.role === "tourism_staff") {
    return [
      { label: "Dashboard", path: "/cms/businesses", icon: LayoutDashboard },
      { label: "Applications", path: "/cms/businesses/applications", icon: FileText },
      { label: "Account Verification", path: "/accreditation/app/users", icon: Users },
      { label: "Records", path: "/cms/businesses/records", icon: Building2 },
      { label: "Reports", path: "/cms/businesses/reports", icon: BarChart3 },
      { label: "Notifications", path: "/accreditation/app/notifications", icon: Bell },
      { label: "Settings", path: "/accreditation/app/settings", icon: Settings },
    ];
  }

  return [
    { label: "Dashboard", path: "/accreditation/app/dashboard", icon: LayoutDashboard },
    { label: "Business Profile", path: "/accreditation/app/business-profile", icon: Building2 },
    { label: "Apply for Accreditation", path: "/accreditation/app/apply?type=new&start=1", icon: FileText },
    { label: "My Applications", path: "/accreditation/app/applications", icon: FileCheck },
    { label: "Tourist Log", path: "/accreditation/app/tourist-count-log", icon: ClipboardList },
    { label: "Notifications", path: "/accreditation/app/notifications", icon: Bell },
    { label: "Settings", path: "/accreditation/app/settings", icon: Settings },
  ];
});

function logout() {
  auth.logout();
  router.push("/accreditation");
}

function submitSearch() {
  const q = searchTerm.value.trim();
  if (!q) return;

  if (auth.role === "admin") {
    router.push({ path: "/accreditation/app/users", query: { q } });
    return;
  }

  if (auth.role === "tourism_staff") {
    router.push({ path: "/cms/businesses/applications", query: { q } });
    return;
  }

  router.push({ path: "/accreditation/app/applications", query: { q } });
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
