<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Tourism Staff Dashboard</h1>
        <p>Overview of accreditation workload and recent decisions.</p>
      </div>
      <RouterLink class="btn primary" :to="applicationsPath">Open Applications</RouterLink>
    </div>

    <div class="stats-grid">
      <StatCard title="Total Queue" :value="queueCount" icon="Q" />
      <StatCard title="Submitted" :value="submittedCount" icon="S" color="orange" />
      <StatCard title="Under Review" :value="underReviewCount" icon="UR" />
      <StatCard title="For Revision" :value="revisionCount" icon="!" color="red" />
    </div>

    <div class="two-column">
      <div class="card">
        <div class="card-header">
          <h2>Needs Review</h2>
          <RouterLink :to="applicationsPath">View Queue</RouterLink>
        </div>
        <RouterLink
          v-for="app in needsReview"
          :key="app.id"
          class="application-card compact-card"
          :to="{ path: reviewPath, query: { application: app.id } }"
        >
          <div class="application-icon">A</div>
          <div class="application-body">
            <strong>{{ app.business_name }}</strong>
            <p>{{ app.id }} - {{ app.type }}</p>
            <p>{{ app.owner }} - Submitted {{ formatDate(app.submitted_at) }}</p>
            <div class="application-card-footer">
              <StatusBadge :status="app.status" />
            </div>
          </div>
        </RouterLink>
        <p v-if="needsReview.length === 0" class="muted">No submitted applications waiting for review.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Recent Staff Decisions</h2>
          <RouterLink :to="recordsPath">Records</RouterLink>
        </div>
        <div v-for="app in recentDecisions" :key="app.id" class="timeline-item">
          <strong>{{ app.business_name }}</strong>
          <p>{{ decisionLabel(app.status) }}{{ app.review_remarks ? ` - ${app.review_remarks}` : "" }}</p>
          <small>{{ formatDateTime(app.reviewed_at || app.updated_at) }} - {{ reviewerName(app) }}</small>
        </div>
        <p v-if="recentDecisions.length === 0" class="muted">No recent review decisions yet.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { demoApplications } from "@/modules/accreditation/data/mockData";
import { getApplications } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const route = useRoute();
const applications = ref([]);
const isCmsAccreditation = computed(() => route.path.startsWith("/cms/businesses"));
const applicationsPath = computed(() => isCmsAccreditation.value ? "/cms/businesses/applications" : "/accreditation/app/staff-dashboard");
const recordsPath = computed(() => isCmsAccreditation.value ? "/cms/businesses/records" : "/accreditation/app/records");
const reviewPath = computed(() => isCmsAccreditation.value ? "/cms/businesses/review" : "/accreditation/app/review");

onMounted(async () => {
  await auth.connectDemoToBackend();
  if (isDemoSession()) {
    applications.value = demoApplications.map(normalizeApplication).filter((app) => app.status !== "draft");
    return;
  }

  try {
    const result = await getApplications();
    applications.value = result.applications
      .map(normalizeApplication)
      .filter((app) => app.status !== "draft");
  } catch (_err) {
    applications.value = [];
  }
});

const queueCount = computed(() => applications.value.length);
const submittedCount = computed(() => applications.value.filter((app) => app.status === "submitted").length);
const underReviewCount = computed(() => applications.value.filter((app) => app.status === "under_review").length);
const revisionCount = computed(() => applications.value.filter((app) => app.status === "for_revision").length);
const needsReview = computed(() =>
  applications.value
    .filter((app) => app.status === "submitted" || app.status === "under_review")
    .slice(0, 4)
);
const recentDecisions = computed(() =>
  applications.value
    .filter((app) => ["for_revision", "approved", "rejected"].includes(app.status))
    .slice(0, 5)
);

function normalizeApplication(app) {
  return {
    ...app,
    id: app.application_number || app.id,
    status: app.status === "pending" ? "submitted" : app.status,
    type: app.accreditation_type || app.type || "New Accreditation",
    owner_remarks: app.owner_remarks || (["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    review_remarks: app.review_remarks || (!["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    owner: app.owner || `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Business Owner",
  };
}

function reviewerName(app) {
  return [app.reviewer_first_name, app.reviewer_last_name].filter(Boolean).join(" ") || "Tourism Office";
}

function decisionLabel(status) {
  const labels = {
    for_revision: "Requested revision",
    approved: "Approved",
    rejected: "Rejected",
  };
  return labels[status] || "Updated";
}

function formatDate(value) {
  if (!value) return "Not yet submitted";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
