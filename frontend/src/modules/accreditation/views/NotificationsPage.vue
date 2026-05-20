<template>
  <section class="page narrow">
    <div class="page-header">
      <div>
        <h1>Notifications</h1>
        <p>{{ unreadCount }} unread notification{{ unreadCount === 1 ? "" : "s" }}</p>
      </div>
      <button class="btn outline" @click="markAllRead">Mark All Read</button>
    </div>

    <div class="card notification-list">
      <button
        v-for="item in notifications"
        :key="item.id"
        class="list-row notification-row"
        :class="{ unread: !item.read }"
        type="button"
        @click="openNotification(item)"
      >
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.message }}</p>
          <small class="notification-meta">
            {{ item.read ? "Read" : "Unread" }} - {{ item.destinationLabel }}
          </small>
        </div>
        <div class="notification-side">
          <StatusBadge :status="item.level" />
          <span>Open</span>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import {
  getNotifications,
  markNotificationRead,
} from "@/modules/accreditation/services/accreditationApi";

const router = useRouter();
const auth = useAuthStore();
const storageKey = computed(() => `notifications_${auth.role}`);
const notifications = ref(loadStoredNotifications() || mockNotifications());

onMounted(async () => {
  if (isDemoSession()) return;

  try {
    const result = await getNotifications();
    if (result.notifications?.length) {
      notifications.value = result.notifications.map(mapNotification);
      persistNotifications();
    }
  } catch (_err) {
    notifications.value = loadStoredNotifications() || mockNotifications();
  }
});

const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length);

async function openNotification(item) {
  item.read = true;
  persistNotifications();

  if (!isDemoSession()) {
    try {
      await markNotificationRead(item.id);
    } catch (_err) {
      item.read = true;
    }
  }

  router.push(item.actionPath || "/accreditation/app/notifications");
}

function markAllRead() {
  notifications.value = notifications.value.map((item) => ({ ...item, read: true }));
  persistNotifications();
}

function mapNotification(item) {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    level: item.type || "info",
    read: item.is_read,
    actionPath: item.action_path || destinationForRole(auth.role),
    destinationLabel: destinationLabel(item.action_path),
  };
}

function mockNotifications() {
  if (auth.role === "admin") {
    return [
      {
        id: "admin-1",
        title: "Inactive Staff Account",
        message: "Review inactive tourism staff access.",
        level: "action_needed",
        read: false,
        actionPath: "/accreditation/app/users?user=ana-reyes",
        destinationLabel: "User Management",
      },
      {
        id: "admin-2",
        title: "Failed Login Attempt",
        message: "A staff account had a failed login attempt today.",
        level: "urgent",
        read: false,
        actionPath: "/accreditation/app/audit?event=AUD-2026-1055",
        destinationLabel: "Audit Log Details",
      },
      {
        id: "admin-3",
        title: "Audit Export Ready",
        message: "Latest audit log export is available.",
        level: "info",
        read: true,
        actionPath: "/accreditation/app/audit",
        destinationLabel: "Audit Logs",
      },
    ];
  }

  if (auth.role === "tourism_staff" || auth.role === "tourism_officer") {
    return [
      {
        id: "staff-1",
        title: "New Application Submitted",
        message: "APP-2026-006 is ready for review.",
        level: "action_needed",
        read: false,
        actionPath: "/accreditation/app/review?application=APP-2026-006",
        destinationLabel: "Application Review",
      },
      {
        id: "staff-2",
        title: "Revision Response Received",
        message: "A revised document was uploaded.",
        level: "action_needed",
        read: false,
        actionPath: "/accreditation/app/review?application=APP-2026-003",
        destinationLabel: "Application Review",
      },
    ];
  }

  return [
    {
      id: "owner-1",
      title: "Application Under Review",
      message: "Your application APP-2026-001 is now under review.",
      level: "info",
      read: false,
      actionPath: "/accreditation/app/applications?application=APP-2026-001",
      destinationLabel: "Application Details",
    },
    {
      id: "owner-2",
      title: "Documents Verified",
      message: "Required documents have been verified.",
      level: "info",
      read: true,
      actionPath: "/accreditation/app/applications?application=APP-2026-001",
      destinationLabel: "Application Details",
    },
    {
      id: "owner-3",
      title: "Revision Needed",
      message: "Please update your submitted document before resubmitting.",
      level: "action_needed",
      read: false,
      actionPath: "/accreditation/app/applications?application=APP-2026-003",
      destinationLabel: "Application Details",
    },
  ];
}

function destinationForRole(role) {
  if (role === "admin") return "/accreditation/app/dashboard";
  if (role === "tourism_staff" || role === "tourism_officer") return "/accreditation/app/staff-dashboard";
  return "/accreditation/app/applications";
}

function destinationLabel(path = "") {
  if (path.includes("/applications")) return "Application Details";
  if (path.includes("/review")) return "Application Review";
  if (path.includes("/audit")) return "Audit Log Details";
  if (path.includes("/users")) return "User Management";
  return "Related Page";
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}

function loadStoredNotifications() {
  return JSON.parse(localStorage.getItem(storageKey.value) || "null");
}

function persistNotifications() {
  localStorage.setItem(storageKey.value, JSON.stringify(notifications.value));
}
</script>
