<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Welcome {{ firstName }}</h1>
        <p>Here's an overview of your business accreditation status</p>
      </div>
      <RouterLink class="btn primary" :to="applicationRoute('New Accreditation')">
        Apply for Accreditation
      </RouterLink>
    </div>

    <div class="stats-grid">
      <StatCard title="Total Applications" :value="applications.length" icon="A" />
      <StatCard title="Approved" :value="approvedCount" icon="OK" color="green" />
      <StatCard title="Under Review" :value="underReviewCount" icon="UR" color="orange" />
      <StatCard title="For Revision" :value="revisionCount" icon="!" color="red" />
    </div>

    <div class="two-column">
      <div class="card">
        <div class="card-header">
          <h2>Recent Applications</h2>
          <RouterLink to="/accreditation/app/applications">View All</RouterLink>
        </div>
        <RouterLink
          v-for="app in recentApplications"
          :key="app.id"
          class="application-card"
          :to="applicationDetailsRoute(app)"
        >
          <div class="application-icon">B</div>
          <div class="application-body">
            <strong>{{ app.business_name }}</strong>
            <p>{{ app.id }} - {{ app.type }}</p>
            <p>Submitted {{ formatDate(app.submitted_at) }} - Updated {{ formatDate(app.updated_at) }}</p>
            <div class="application-card-footer">
              <StatusBadge :status="app.status" />
              <span v-if="app.status === 'for_revision'">View revision notes</span>
            </div>
          </div>
        </RouterLink>
        <p v-if="recentApplications.length === 0" class="muted">No applications yet.</p>
      </div>

      <div class="card">
        <h2>Activity Timeline</h2>
        <div v-for="item in activityTimeline" :key="item.id" class="timeline-item">
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
          <small>{{ formatDateTime(item.timestamp) }} - {{ item.user }}</small>
        </div>
        <p v-if="activityTimeline.length === 0" class="muted">No activity yet.</p>
      </div>
    </div>

    <div class="callout-card">
      <div>
        <h3>Ready to apply for accreditation?</h3>
        <p>Start your application process today and get your business accredited with the LGU Tourism Office.</p>
      </div>
      <div class="callout-actions">
        <RouterLink class="btn outline light" :to="applicationRoute('New Accreditation')">
          New Accreditation
        </RouterLink>
        <RouterLink class="btn outline light" :to="applicationRoute('Renewal')">
          Renewal
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { demoApplications } from "@/modules/accreditation/data/mockData";
import { getApplications } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const applications = ref(demoApplications);
const firstName = computed(() => auth.user?.firstName || "Business Owner");
const recentApplications = computed(() => applications.value.slice(0, 2));
const approvedCount = computed(() => applications.value.filter((app) => app.status === "approved").length);
const underReviewCount = computed(() => applications.value.filter((app) => app.status === "under_review").length);
const revisionCount = computed(() => applications.value.filter((app) => app.status === "for_revision").length);
const activityTimeline = computed(() =>
  applications.value
    .flatMap((app) => buildApplicationTimeline(app))
    .filter((item) => item.timestamp)
    .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
    .slice(0, 6)
);

onMounted(async () => {
  await auth.connectDemoToBackend();
  if (isDemoSession()) return;

  try {
    const result = await getApplications();
    applications.value = result.applications.map(normalizeApplication);
  } catch (_err) {
    applications.value = demoApplications;
  }
});

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

function normalizeApplication(app) {
  return {
    ...app,
    id: app.application_number || app.id,
    type: app.accreditation_type || app.type,
    owner_remarks: app.owner_remarks || (["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    review_remarks: app.review_remarks || (!["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    documents: Array.isArray(app.documents) ? app.documents : [],
  };
}

function buildApplicationTimeline(app) {
  const businessName = app.business_name || "your business";
  const applicationId = app.application_number || app.id;
  const timeline = [];

  if (app.created_at) {
    timeline.push({
      id: `${applicationId}-created`,
      title: "Draft Created",
      description: `${app.type || app.accreditation_type || "Accreditation"} draft for ${businessName} was started.`,
      timestamp: app.created_at,
      user: "Business Owner",
    });
  }

  if (app.submitted_at) {
    timeline.push({
      id: `${applicationId}-submitted`,
      title: "Application Submitted",
      description: `${applicationId} for ${businessName} was submitted.`,
      timestamp: app.submitted_at,
      user: "System",
    });
  }

  for (const document of app.documents || []) {
    if (!document.uploaded_at) continue;
    timeline.push({
      id: `${applicationId}-${document.name || document.document_type}-uploaded`,
      title: "Document Uploaded",
      description: `${document.name || document.document_type} was uploaded for ${businessName}.`,
      timestamp: document.uploaded_at,
      user: "Business Owner",
    });
  }

  if (["under_review", "for_revision", "approved", "rejected"].includes(app.status)) {
    timeline.push({
      id: `${applicationId}-${app.status}`,
      title: statusTitle(app.status),
      description: statusDescription(app, businessName),
      timestamp: app.reviewed_at || app.updated_at,
      user: reviewerName(app) || "Tourism Office",
    });
  }

  return timeline;
}

function reviewerName(app) {
  return [app.reviewer_first_name, app.reviewer_last_name].filter(Boolean).join(" ");
}

function statusTitle(status) {
  const titles = {
    under_review: "Under Review",
    for_revision: "Revision Requested",
    approved: "Application Approved",
    rejected: "Application Rejected",
  };
  return titles[status] || "Application Updated";
}

function statusDescription(app, businessName) {
  const descriptions = {
    under_review: `Tourism staff started reviewing ${app.application_number || app.id} for ${businessName}.`,
    for_revision: app.review_remarks
      ? `${app.application_number || app.id} needs revisions: ${app.review_remarks}`
      : `${app.application_number || app.id} for ${businessName} needs revisions.`,
    approved: `${app.application_number || app.id} for ${businessName} was approved.`,
    rejected: `${app.application_number || app.id} for ${businessName} was rejected.`,
  };
  return descriptions[app.status] || `${app.application_number || app.id} for ${businessName} was updated.`;
}

function applicationRoute(type) {
  return {
    path: "/accreditation/app/apply",
    query: {
      type: type === "Renewal" ? "renewal" : "new",
      start: "1",
    },
  };
}

function applicationDetailsRoute(app) {
  return {
    path: "/accreditation/app/applications",
    query: { application: app.application_number || app.id },
  };
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
