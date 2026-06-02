<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>System Administrator Dashboard</h1>
        <p>Monitor system users, owner applications, and staff activity.</p>
      </div>
      <RouterLink class="btn primary" to="/accreditation/app/users">Add New User</RouterLink>
    </div>

    <div class="stats-grid">
      <StatCard title="Total Users" :value="users.length" icon="U" />
      <StatCard title="Business Owners" :value="businessOwnerCount" icon="BO" />
      <StatCard title="Tourism Staff/Officers" :value="staffCount" icon="S" />
      <StatCard title="Applications" :value="applicationCount" icon="A" color="orange" />
    </div>

    <div class="two-column">
      <div class="card">
        <div class="card-header">
          <h2>System Oversight</h2>
          <RouterLink class="btn ghost" to="/accreditation/app/users">Manage Users</RouterLink>
        </div>
        <div class="list-row">
          <div>
            <strong>Business Owner Accounts</strong>
            <p>{{ businessOwnerCount }} owner account{{ businessOwnerCount === 1 ? "" : "s" }} managed by admin.</p>
          </div>
          <StatusBadge status="info" />
        </div>
        <div class="list-row">
          <div>
            <strong>Tourism Staff/Officer Accounts</strong>
            <p>{{ staffCount }} reviewer account{{ staffCount === 1 ? "" : "s" }} managed by admin.</p>
          </div>
          <StatusBadge status="action_needed" />
        </div>
      </div>

      <div class="card">
        <h2>Quick Actions</h2>
        <div class="quick-grid">
          <RouterLink class="btn outline" to="/accreditation/app/users">Manage Users</RouterLink>
          <RouterLink class="btn outline" to="/accreditation/app/staff-dashboard">View Applications</RouterLink>
          <RouterLink class="btn outline" to="/accreditation/app/audit">View Audit Logs</RouterLink>
          <RouterLink class="btn outline" to="/accreditation/app/notifications">Notifications</RouterLink>
        </div>
      </div>
    </div>

    <div class="two-column">
      <div class="card">
        <h2>Role Summary</h2>
        <div class="list-row" v-for="role in roles" :key="role.name">
          <div>
            <strong>{{ role.name }}</strong>
            <p>{{ role.users }} user{{ role.users === 1 ? "" : "s" }}</p>
          </div>
          <StatusBadge :status="role.users ? 'active' : 'pending'" />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Recent System Activity</h2>
          <RouterLink class="btn ghost" to="/accreditation/app/audit">View All</RouterLink>
        </div>
        <div class="list-row" v-for="activity in activities" :key="activity.id">
          <div>
            <strong>{{ activity.action }}</strong>
            <p>{{ activity.id }} by {{ activity.actor }}</p>
          </div>
          <p class="muted">{{ formatDate(activity.created_at) }}</p>
        </div>
        <p v-if="activities.length === 0" class="muted">No recent activity.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { getApplications, getAuditLogs, getUsers } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const users = ref([]);
const applications = ref([]);
const activities = ref([]);

onMounted(async () => {
  if (isDemoSession()) {
    users.value = [
      { role: "business_owner", status: "active" },
      { role: "tourism_staff", status: "active" },
      { role: "admin", status: "active" },
    ];
    applications.value = [{ id: "APP-2026-001" }, { id: "APP-2026-002" }];
    activities.value = [
      { id: "AUD-2026-1057", action: "Updated role permissions", actor: "Admin User", created_at: "2026-05-14T16:45:00" },
      { id: "AUD-2026-1055", action: "Failed login attempt", actor: "Ana Reyes", created_at: "2026-05-14T13:05:00" },
    ];
    return;
  }

  try {
    const [userResult, applicationResult, auditResult] = await Promise.all([
      getUsers(),
      getApplications(),
      getAuditLogs(),
    ]);
    users.value = userResult.users;
    applications.value = applicationResult.applications;
    activities.value = auditResult.logs.map((log) => ({
      id: log.event_number,
      action: log.action,
      actor: log.actor_name || "System",
      created_at: log.created_at,
    }));
  } catch (_err) {
    users.value = [];
    applications.value = [];
    activities.value = [];
  }
});

const businessOwnerCount = computed(() => users.value.filter((user) => user.role === "business_owner").length);
const staffCount = computed(() =>
  users.value.filter((user) => user.role === "tourism_staff").length
);
const applicationCount = computed(() => applications.value.length);
const roles = computed(() => [
  { name: "Business Owner", users: businessOwnerCount.value },
  { name: "Tourism Staff/Officer", users: staffCount.value },
  { name: "System Administrator", users: users.value.filter((user) => user.role === "admin").length },
]);

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
