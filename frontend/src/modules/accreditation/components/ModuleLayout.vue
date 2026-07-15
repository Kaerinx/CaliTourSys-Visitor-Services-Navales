<template>
  <div class="app-shell" :class="portalClass">
    <div
      v-if="isMobileNavOpen"
      class="mobile-nav-backdrop"
      aria-hidden="true"
      @click="closeMobileNav"
    ></div>

    <aside
      id="accreditation-navigation"
      ref="drawerRef"
      class="sidebar"
      :class="{ 'mobile-open': isMobileNavOpen }"
      :role="isMobileNavOpen ? 'dialog' : undefined"
      :aria-modal="isMobileNavOpen ? 'true' : undefined"
      :aria-labelledby="
        isMobileNavOpen ? 'accreditation-navigation-title' : undefined
      "
      @keydown.esc.stop.prevent="closeMobileNav"
      @keydown.tab="trapMobileNavFocus"
    >
      <div class="brand">
        <div class="brand-mark">
          <Building2 :size="24" />
        </div>
        <div>
          <h2 id="accreditation-navigation-title">LGU Tourism</h2>
          <p>Accreditation System</p>
        </div>
        <button
          type="button"
          class="mobile-nav-close"
          aria-label="Close navigation menu"
          @click="closeMobileNav"
        >
          <X :size="22" />
        </button>
      </div>

      <nav aria-label="Accreditation navigation">
        <RouterLink
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          @click="closeMobileNav"
        >
          <component :is="item.icon" :size="20" class="nav-icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <button type="button" class="sidebar-logout" @click="logout">
        <LogOut :size="20" />
        Logout
      </button>
    </aside>

    <section class="workspace" :inert="isMobileNavOpen">
      <header class="topbar">
        <button
          ref="menuButtonRef"
          type="button"
          class="mobile-menu-button"
          aria-label="Open navigation menu"
          aria-controls="accreditation-navigation"
          :aria-expanded="isMobileNavOpen"
          @click="openMobileNav"
        >
          <Menu :size="22" />
        </button>
        <div class="search-wrap">
          <Search :size="16" />
          <input
            v-model="searchTerm"
            class="search"
            aria-label="Search applications and businesses"
            placeholder="Search applications, businesses..."
            @keydown.enter="submitSearch"
          />
        </div>
        <div class="topbar-user">
          <RouterLink
            class="icon-button notification-button"
            to="/accreditation/app/notifications"
            aria-label="Notifications"
          >
            <Bell :size="20" />
            <span v-if="notificationCount" class="notification-count">{{
              notificationCount
            }}</span>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { getNotifications } from "@/modules/accreditation/services/accreditationApi";
import { ensureAccreditationBackendSession } from "@/modules/accreditation/services/accreditationSession";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Star,
  MessageSquare,
  User,
  Users,
  X,
} from "@lucide/vue";

const router = useRouter();
const auth = useAuthStore();
const searchTerm = ref("");
const unreadNotifications = ref(0);
const isMobileNavOpen = ref(false);
const drawerRef = ref(null);
const menuButtonRef = ref(null);

const roleLabel = computed(() => {
  if (auth.role === "admin") return "System Administrator";
  if (auth.role === "tourism_staff") return "Tourism Staff / Officer";
  return "Business Owner";
});

const displayName = computed(() =>
  auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : "User",
);

const notificationCount = computed(() => unreadNotifications.value);
const portalClass = computed(() => ({
  "business-owner-portal": auth.role === "business_owner",
}));

onMounted(async () => {
  window.addEventListener("resize", handleViewportResize);

  const isConnected = await ensureAccreditationBackendSession(auth);
  if (!isConnected || isDemoSession()) return;

  try {
    const result = await getNotifications();
    unreadNotifications.value =
      result.unreadCount ??
      (result.notifications || []).filter((item) => !item.is_read).length;
  } catch (_error) {
    unreadNotifications.value = 0;
  }
});

const menu = computed(() => {
  if (auth.role === "admin") {
    return [
      {
        label: "Dashboard",
        path: "/accreditation/app/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "User Management",
        path: "/accreditation/app/users",
        icon: Users,
      },
      {
        label: "Role Management",
        path: "/accreditation/app/roles",
        icon: Shield,
      },
      {
        label: "Audit Logs",
        path: "/accreditation/app/audit",
        icon: FileCheck,
      },
      {
        label: "Notifications",
        path: "/accreditation/app/notifications",
        icon: Bell,
      },
      {
        label: "Settings",
        path: "/accreditation/app/settings",
        icon: Settings,
      },
    ];
  }

  if (auth.role === "tourism_staff") {
    return [
      { label: "Dashboard", path: "/cms/businesses", icon: LayoutDashboard },
      {
        label: "Applications",
        path: "/cms/businesses/applications",
        icon: FileText,
      },
      {
        label: "Account Verification",
        path: "/accreditation/app/users",
        icon: Users,
      },
      { label: "Records", path: "/cms/businesses/records", icon: Building2 },
      { label: "Reports", path: "/cms/businesses/reports", icon: BarChart3 },
      {
        label: "Notifications",
        path: "/accreditation/app/notifications",
        icon: Bell,
      },
      {
        label: "Settings",
        path: "/accreditation/app/settings",
        icon: Settings,
      },
    ];
  }

  return [
    {
      label: "Dashboard",
      path: "/accreditation/app/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Business Profile",
      path: "/accreditation/app/business-profile",
      icon: Building2,
    },
    {
      label: "Apply for Accreditation",
      path: "/accreditation/app/apply?type=new&start=1",
      icon: FileText,
    },
    {
      label: "My Applications",
      path: "/accreditation/app/applications",
      icon: FileCheck,
    },
    {
      label: "Tourist Log",
      path: "/accreditation/app/tourist-count-log",
      icon: ClipboardList,
    },
    {
      label: "Ratings & Reviews",
      path: "/accreditation/app/ratings",
      icon: Star,
    },
    {
      label: "Product Inquiries",
      path: "/accreditation/app/product-inquiries",
      icon: MessageSquare,
    },
    {
      label: "Notifications",
      path: "/accreditation/app/notifications",
      icon: Bell,
    },
    { label: "Settings", path: "/accreditation/app/settings", icon: Settings },
  ];
});

function logout() {
  isMobileNavOpen.value = false;
  auth.logout();
  router.push("/accreditation");
}

async function openMobileNav() {
  isMobileNavOpen.value = true;
  await nextTick();
  drawerRef.value?.querySelector(".nav-link")?.focus();
}

async function closeMobileNav() {
  if (!isMobileNavOpen.value) return;
  isMobileNavOpen.value = false;
  await nextTick();
  menuButtonRef.value?.focus();
}

function trapMobileNavFocus(event) {
  if (!isMobileNavOpen.value || !drawerRef.value) return;

  const focusable = Array.from(
    drawerRef.value.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleViewportResize() {
  if (window.innerWidth > 920 && isMobileNavOpen.value) {
    isMobileNavOpen.value = false;
  }
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

onBeforeUnmount(() => {
  isMobileNavOpen.value = false;
  window.removeEventListener("resize", handleViewportResize);
});
</script>

<style scoped>
.mobile-menu-button,
.mobile-nav-close,
.mobile-nav-backdrop {
  display: none;
}

@media (max-width: 920px) {
  .mobile-menu-button,
  .mobile-nav-close {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: #ffffff;
    color: var(--foreground);
    cursor: pointer;
  }

  .mobile-menu-button {
    display: grid;
  }

  .mobile-nav-close {
    display: grid;
    margin-left: auto;
  }

  .mobile-nav-backdrop {
    position: fixed;
    z-index: 109;
    inset: 0;
    display: block;
    background: rgba(15, 23, 42, 0.52);
  }

  .sidebar.mobile-open {
    position: fixed;
    z-index: 110;
    inset: 0 auto 0 0;
    width: min(86vw, 320px);
    height: 100dvh;
    display: flex;
    box-shadow: 18px 0 45px rgba(15, 23, 42, 0.24);
  }

  .topbar {
    gap: 10px;
  }
}
</style>
