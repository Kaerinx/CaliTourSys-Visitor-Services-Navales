<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Audit Logs</h1>
        <p>Track account, accreditation, and administration activity.</p>
      </div>
      <button class="btn outline" type="button" @click="exportLogs">Export Logs</button>
    </div>

    <p v-if="error" class="form-error sticky-error">{{ error }}</p>

    <div class="stats-grid">
      <StatCard title="Events Today" :value="eventsToday" icon="E" />
      <StatCard title="Security Alerts" :value="securityAlerts" icon="!" color="red" />
      <StatCard title="Decisions Logged" :value="decisionEvents" icon="OK" color="green" />
      <StatCard title="Admin Changes" :value="adminChanges" icon="A" />
    </div>

    <div class="card compact">
      <div class="card-header">
        <h2>System Activity</h2>
        <div class="table-tools">
          <input v-model="search" class="compact-search" placeholder="Search audit logs..." />
          <select v-model="moduleFilter">
            <option value="all">All Modules</option>
            <option v-for="module in modules" :key="module" :value="module">{{ module }}</option>
          </select>
          <select v-model="severityFilter">
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Event ID</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Module</th>
            <th>Severity</th>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.event_number">
            <td><strong>{{ log.event_number }}</strong></td>
            <td>{{ log.actor_name || "System" }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.module }}</td>
            <td><StatusBadge :status="log.severity" /></td>
            <td>{{ formatDateTime(log.created_at) }}</td>
            <td><button class="btn ghost" @click="selected = log">View</button></td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="7" class="empty-state">No audit logs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <section class="modal landscape">
        <button class="modal-close" @click="selected = null">x</button>
        <h2>Audit Log Details</h2>
        <p class="muted">{{ selected.event_number }}</p>
        <div class="detail-grid">
          <p><span>Action</span><strong>{{ selected.action }}</strong></p>
          <p><span>Actor</span><strong>{{ selected.actor_name || "System" }}</strong></p>
          <p><span>Role</span><strong>{{ roleLabel(selected.actor_role) }}</strong></p>
          <p><span>Module</span><strong>{{ selected.module }}</strong></p>
          <p><span>Severity</span><strong>{{ selected.severity }}</strong></p>
          <p><span>Outcome</span><strong>{{ selected.outcome || "Completed" }}</strong></p>
          <p><span>Reference</span><strong>{{ selected.reference_id || "None" }}</strong></p>
          <p><span>Date</span><strong>{{ formatDateTime(selected.created_at) }}</strong></p>
          <p class="span-2"><span>Details</span><strong>{{ selected.details || "No additional details." }}</strong></p>
        </div>
        <div class="modal-actions">
          <button class="btn outline" @click="selected = null">Close</button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { demoAuditLogs } from "@/modules/accreditation/data/mockData";
import { getAuditLogs } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const auth = useAuthStore();
const logs = ref([]);
const selected = ref(null);
const search = ref("");
const moduleFilter = ref("all");
const severityFilter = ref("all");
const error = ref("");

onMounted(async () => {
  await loadLogs();
  openAuditLogFromRoute();
});

watch(
  () => route.query.event,
  () => openAuditLogFromRoute()
);

const filteredLogs = computed(() => {
  const term = search.value.trim().toLowerCase();
  return logs.value.filter((log) => {
    const matchesModule = moduleFilter.value === "all" || log.module === moduleFilter.value;
    const matchesSeverity = severityFilter.value === "all" || log.severity === severityFilter.value;
    const matchesSearch =
      !term ||
      [log.event_number, log.actor_name, log.action, log.module, log.reference_id, log.details]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    return matchesModule && matchesSeverity && matchesSearch;
  });
});

const modules = computed(() => Array.from(new Set(logs.value.map((log) => log.module).filter(Boolean))).sort());
const eventsToday = computed(() => logs.value.filter((log) => isToday(log.created_at)).length);
const securityAlerts = computed(() => logs.value.filter((log) => log.severity === "high").length);
const decisionEvents = computed(() =>
  logs.value.filter((log) => /approved|rejected|revision|review/i.test(`${log.action} ${log.module}`)).length
);
const adminChanges = computed(() =>
  logs.value.filter((log) => /user|role|admin/i.test(`${log.action} ${log.module}`)).length
);

async function loadLogs() {
  if (isDemoSession()) {
    logs.value = demoAuditLogs;
    return;
  }

  try {
    const result = await getAuditLogs();
    logs.value = result.logs || [];
  } catch (err) {
    logs.value = [];
    error.value = err.response?.data?.message || "Unable to load audit logs.";
  }
}

function openAuditLogFromRoute() {
  const eventNumber = route.query.event;
  if (!eventNumber) return;
  const log = logs.value.find((item) => item.event_number === eventNumber);
  if (log) selected.value = log;
}

function exportLogs() {
  const rows = [
    ["Event ID", "Actor", "Action", "Module", "Severity", "Outcome", "Reference", "Date", "Details"],
    ...filteredLogs.value.map((log) => [
      log.event_number,
      log.actor_name || "System",
      log.action,
      log.module,
      log.severity,
      log.outcome || "",
      log.reference_id || "",
      formatDateTime(log.created_at),
      log.details || "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function roleLabel(role) {
  const labels = {
    business_owner: "Business Owner",
    tourism_staff: "Tourism Staff / Officer",
    admin: "System Administrator",
  };
  return labels[role] || role || "System";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
