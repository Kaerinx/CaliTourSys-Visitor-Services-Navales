<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Reports</h1>
        <p>Monitor application volume, processing performance, compliance, and accreditation records.</p>
      </div>
      <button class="btn outline" type="button" @click="exportCsv">Export CSV</button>
    </div>

    <p v-if="error" class="form-error sticky-error">{{ error }}</p>

    <div class="card report-filters">
      <label>Date From<input v-model="filters.dateFrom" type="date" /></label>
      <label>Date To<input v-model="filters.dateTo" type="date" /></label>
      <label>Status
        <select v-model="filters.status">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="for_revision">For Revision</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <label>Business Type
        <select v-model="filters.businessType">
          <option value="all">All Business Types</option>
          <option v-for="type in businessTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>
      <label>City / Municipality
        <select v-model="filters.city">
          <option value="all">All Cities / Municipalities</option>
          <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
        </select>
      </label>
    </div>

    <div class="stats-grid">
      <StatCard title="Applications" :value="filteredApplications.length" icon="A" />
      <StatCard title="Approved" :value="approvedCount" icon="OK" color="green" />
      <StatCard title="For Revision" :value="revisionCount" icon="!" color="red" />
      <StatCard title="Avg Review Days" :value="averageReviewDays" icon="D" color="orange" />
    </div>

    <div class="two-column">
      <section class="card report-card">
        <h2>Application Summary</h2>
        <div class="report-bars">
          <div v-for="item in statusSummary" :key="item.label" class="report-bar-row">
            <div>
              <strong>{{ item.label }}</strong>
              <span>{{ item.value }}</span>
            </div>
            <div class="report-bar-track">
              <span :style="{ width: `${item.percent}%` }"></span>
            </div>
          </div>
        </div>
      </section>

      <section class="card report-card">
        <h2>Monthly Volume</h2>
        <div class="report-bars">
          <div v-for="item in monthlySummary" :key="item.label" class="report-bar-row">
            <div>
              <strong>{{ item.label }}</strong>
              <span>{{ item.value }}</span>
            </div>
            <div class="report-bar-track">
              <span :style="{ width: `${item.percent}%` }"></span>
            </div>
          </div>
          <p v-if="monthlySummary.length === 0" class="muted">No applications in the selected period.</p>
        </div>
      </section>
    </div>

    <div class="two-column">
      <section class="card report-card">
        <h2>Business Category Report</h2>
        <div class="report-list">
          <div v-for="item in topBusinessTypes" :key="item.label" class="report-list-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
          <p v-if="topBusinessTypes.length === 0" class="muted">No business categories found.</p>
        </div>
      </section>

      <section class="card report-card">
        <h2>Location Report</h2>
        <div class="report-list">
          <div v-for="item in topLocations" :key="item.label" class="report-list-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
          <p v-if="topLocations.length === 0" class="muted">No locations found.</p>
        </div>
      </section>
    </div>

    <div class="two-column">
      <section class="card report-card">
        <h2>Document Compliance</h2>
        <div class="report-list">
          <div class="report-list-row">
            <span>Complete document sets</span>
            <strong>{{ completeDocumentCount }}</strong>
          </div>
          <div class="report-list-row">
            <span>Missing required documents</span>
            <strong>{{ missingDocumentCount }}</strong>
          </div>
          <div class="report-list-row">
            <span>Documents for revision</span>
            <strong>{{ documentRevisionCount }}</strong>
          </div>
        </div>
      </section>

      <section class="card report-card">
        <h2>Accreditation Records</h2>
        <div class="report-list">
          <div class="report-list-row">
            <span>Active accreditations</span>
            <strong>{{ activeRecords.length }}</strong>
          </div>
          <div class="report-list-row">
            <span>Expiring within 60 days</span>
            <strong>{{ expiringSoonRecords.length }}</strong>
          </div>
          <div class="report-list-row">
            <span>Expired records</span>
            <strong>{{ expiredRecords.length }}</strong>
          </div>
        </div>
      </section>
    </div>

    <section class="card compact">
      <div class="card-header">
        <h2>Pending and Revision Worklist</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Application</th>
            <th>Business</th>
            <th>Type</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Review Days</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in actionableApplications" :key="app.id">
            <td><strong>{{ app.id }}</strong></td>
            <td>{{ app.business_name }}</td>
            <td>{{ app.type }}</td>
            <td><StatusBadge :status="app.status" /></td>
            <td>{{ formatDate(app.submitted_at) }}</td>
            <td>{{ reviewDays(app) }}</td>
            <td class="muted-cell">{{ app.review_remarks || app.owner_remarks || "None" }}</td>
          </tr>
          <tr v-if="actionableApplications.length === 0">
            <td colspan="7" class="empty-state">No pending or revision applications found.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card compact">
      <div class="card-header">
        <h2>Expiring Accreditations</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Record</th>
            <th>Business</th>
            <th>Permit No.</th>
            <th>Issued</th>
            <th>Expires</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in expiringAndExpiredRecords" :key="record.id">
            <td><strong>{{ record.record_number }}</strong></td>
            <td>{{ record.business_name }}</td>
            <td>{{ record.business_permit_number || "Not provided" }}</td>
            <td>{{ formatDate(record.issued_at) }}</td>
            <td>{{ formatDate(record.expires_at) }}</td>
            <td><StatusBadge :status="recordStatus(record)" /></td>
          </tr>
          <tr v-if="expiringAndExpiredRecords.length === 0">
            <td colspan="6" class="empty-state">No expiring accreditation records.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { getApplications, getRecords } from "@/modules/accreditation/services/accreditationApi";
import { getRequiredDocumentsForBusinessType } from "@/modules/accreditation/data/mockData";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const applications = ref([]);
const records = ref([]);
const error = ref("");
const filters = reactive({
  dateFrom: "",
  dateTo: "",
  status: "all",
  businessType: "all",
  city: "all",
});

onMounted(async () => {
  await auth.connectDemoToBackend();
  try {
    const [applicationResult, recordResult] = await Promise.all([
      getApplications(),
      getRecords(),
    ]);
    applications.value = (applicationResult.applications || []).map(normalizeApplication);
    records.value = recordResult.records || [];
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load reports.";
  }
});

const filteredApplications = computed(() =>
  applications.value.filter((app) => {
    const date = app.submitted_at || app.created_at;
    const matchesDateFrom = !filters.dateFrom || (date && new Date(date) >= new Date(`${filters.dateFrom}T00:00:00`));
    const matchesDateTo = !filters.dateTo || (date && new Date(date) <= new Date(`${filters.dateTo}T23:59:59`));
    const matchesStatus = filters.status === "all" || app.status === filters.status;
    const matchesType = filters.businessType === "all" || app.business_type === filters.businessType;
    const matchesCity = filters.city === "all" || app.city_municipality === filters.city;
    return matchesDateFrom && matchesDateTo && matchesStatus && matchesType && matchesCity;
  })
);

const businessTypes = computed(() => unique(applications.value.map((app) => app.business_type).filter(Boolean)));
const cities = computed(() => unique(applications.value.map((app) => app.city_municipality).filter(Boolean)));
const approvedCount = computed(() => filteredApplications.value.filter((app) => app.status === "approved").length);
const revisionCount = computed(() => filteredApplications.value.filter((app) => app.status === "for_revision").length);
const averageReviewDays = computed(() => {
  const reviewed = filteredApplications.value
    .map((app) => reviewDays(app))
    .filter((days) => Number.isFinite(days));
  if (!reviewed.length) return 0;
  return Math.round(reviewed.reduce((sum, days) => sum + days, 0) / reviewed.length);
});

const statusSummary = computed(() => summarize(
  filteredApplications.value,
  (app) => statusLabel(app.status),
  ["Draft", "Submitted", "Under Review", "For Revision", "Approved", "Rejected"]
));
const monthlySummary = computed(() => summarize(
  filteredApplications.value,
  (app) => monthLabel(app.submitted_at || app.created_at)
).slice(0, 6));
const topBusinessTypes = computed(() => summarize(filteredApplications.value, (app) => app.business_type || "Unspecified").slice(0, 6));
const topLocations = computed(() => summarize(filteredApplications.value, (app) => app.city_municipality || "Unspecified").slice(0, 6));
const completeDocumentCount = computed(() =>
  filteredApplications.value.filter((app) =>
    getRequiredDocumentsForBusinessType(app.business_type).every((name) => hasDocument(app, name))
  ).length
);
const missingDocumentCount = computed(() =>
  filteredApplications.value.reduce(
    (count, app) =>
      count + getRequiredDocumentsForBusinessType(app.business_type).filter((name) => !hasDocument(app, name)).length,
    0
  )
);
const documentRevisionCount = computed(() =>
  filteredApplications.value.reduce((count, app) => count + app.documents.filter((doc) => doc.status === "for_revision").length, 0)
);
const actionableApplications = computed(() =>
  filteredApplications.value.filter((app) => ["submitted", "under_review", "for_revision"].includes(app.status))
);
const activeRecords = computed(() => records.value.filter((record) => recordStatus(record) === "active"));
const expiringSoonRecords = computed(() => records.value.filter((record) => recordStatus(record) === "expiring_soon"));
const expiredRecords = computed(() => records.value.filter((record) => recordStatus(record) === "expired"));
const expiringAndExpiredRecords = computed(() =>
  records.value.filter((record) => ["expiring_soon", "expired"].includes(recordStatus(record)))
);

function normalizeApplication(app) {
  return {
    ...app,
    id: app.application_number || app.id,
    status: app.status === "pending" ? "submitted" : app.status,
    type: app.accreditation_type || app.type || "New Accreditation",
    owner_remarks: app.owner_remarks || (["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    review_remarks: app.review_remarks || (!["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    documents: Array.isArray(app.documents) ? app.documents : [],
  };
}

function summarize(items, getLabel, preferredOrder = []) {
  const counts = new Map();
  for (const item of items) {
    const label = getLabel(item);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  const max = Math.max(...counts.values(), 1);
  const rows = Array.from(counts, ([label, value]) => ({
    label,
    value,
    percent: Math.round((value / max) * 100),
  }));
  if (!preferredOrder.length) return rows.sort((first, second) => second.value - first.value);
  return preferredOrder.map((label) => ({
    label,
    value: counts.get(label) || 0,
    percent: Math.round(((counts.get(label) || 0) / max) * 100),
  }));
}

function hasDocument(app, name) {
  return app.documents.some((doc) => doc.document_type === name || doc.name === name);
}

function reviewDays(app) {
  if (!app.submitted_at) return null;
  const endDate = app.reviewed_at || app.updated_at || new Date().toISOString();
  return Math.max(0, Math.ceil((new Date(endDate) - new Date(app.submitted_at)) / 86400000));
}

function recordStatus(record) {
  if (record.status !== "active") return record.status;
  const days = daysUntil(record.expires_at);
  if (days < 0) return "expired";
  if (days <= 60) return "expiring_soon";
  return "active";
}

function daysUntil(value) {
  if (!value) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(value) - today) / 86400000);
}

function statusLabel(status) {
  return {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    for_revision: "For Revision",
    approved: "Approved",
    rejected: "Rejected",
  }[status] || status;
}

function monthLabel(value) {
  if (!value) return "No Date";
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function unique(values) {
  return Array.from(new Set(values)).sort((first, second) => first.localeCompare(second));
}

function exportCsv() {
  const rows = [
    ["Application", "Business", "Business Type", "City/Municipality", "Status", "Submitted", "Review Days", "Owner Remarks", "Review Remarks"],
    ...filteredApplications.value.map((app) => [
      app.id,
      app.business_name,
      app.business_type,
      app.city_municipality,
      statusLabel(app.status),
      formatDate(app.submitted_at),
      reviewDays(app) ?? "",
      app.owner_remarks || "",
      app.review_remarks || "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `accreditation-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}
</script>
