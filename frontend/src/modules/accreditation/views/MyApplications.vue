<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>My Applications</h1>
        <p>View and manage your accreditation applications.</p>
      </div>
      <RouterLink class="btn primary" :to="{ path: '/accreditation/app/apply', query: { type: 'new', start: '1' } }">
        New Application
      </RouterLink>
    </div>

    <div class="card compact">
      <div class="card-header">
        <h2>Applications</h2>
        <div class="table-tools">
          <input v-model="search" class="compact-search" placeholder="Search applications..." />
          <select v-model="statusFilter">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="for_revision">For Revision</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Business Name</th>
            <th>Business Type</th>
            <th>Accreditation Type</th>
            <th>Submitted</th>
            <th>Documents</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in filteredApplications" :key="app.id">
            <td><strong>{{ app.id }}</strong></td>
            <td>{{ app.business_name }}</td>
            <td>{{ app.business_type }}</td>
            <td>{{ app.type }}</td>
            <td>{{ formatDate(app.submitted_at) }}</td>
            <td>
              <div class="document-pills">
                <span v-for="doc in normalizedDocuments(app)" :key="doc.name">
                  {{ doc.name }}
                </span>
              </div>
            </td>
            <td>
              <div class="status-stack">
                <StatusBadge :status="app.status" />
                <span v-if="app.status === 'for_revision'">Needs your action</span>
              </div>
            </td>
            <td><button class="btn ghost" @click="openApplication(app)">View Details</button></td>
          </tr>
          <tr v-if="filteredApplications.length === 0">
            <td colspan="8" class="empty-state">No applications found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedApplication" class="modal-backdrop" @click.self="closeApplication">
      <section class="modal landscape">
        <button class="modal-close" @click="closeApplication">x</button>
        <div class="modal-title-row">
          <div>
            <h2>{{ selectedApplication.business_name }}</h2>
            <p class="muted">{{ selectedApplication.id }} - {{ selectedApplication.type }}</p>
          </div>
          <StatusBadge :status="selectedApplication.status" />
        </div>

        <div v-if="needsRevision(selectedApplication)" class="revision-notice">
          <div>
            <strong>Revision needed</strong>
            <p>{{ selectedApplication.review_remarks || "The tourism office requested changes. Review your submitted documents and application details before resubmitting." }}</p>
          </div>
          <RouterLink class="btn primary" :to="revisionRoute(selectedApplication)">
            Revise Application
          </RouterLink>
        </div>

        <div class="review-grid">
          <div class="card detail-panel">
            <h3>Application Information</h3>
            <div class="detail-grid">
              <p><span>Business Type</span><strong>{{ selectedApplication.business_type }}</strong></p>
              <p><span>Business Permit No.</span><strong>{{ selectedApplication.business_permit_number || "Not provided" }}</strong></p>
              <p><span>DTI/SEC Registration No.</span><strong>{{ selectedApplication.dti_sec_registration_number || "Not provided" }}</strong></p>
              <p><span>Submitted</span><strong>{{ formatDate(selectedApplication.submitted_at) }}</strong></p>
              <p><span>Last Updated</span><strong>{{ formatDate(selectedApplication.updated_at) }}</strong></p>
              <p class="span-2"><span>Business Address</span><strong>{{ selectedApplication.address }}</strong></p>
              <p v-if="selectedApplication.owner_remarks" class="span-2"><span>Your Remarks</span><strong>{{ selectedApplication.owner_remarks }}</strong></p>
              <p v-if="selectedApplication.review_remarks && !needsRevision(selectedApplication)" class="span-2"><span>Tourism Office Remarks</span><strong>{{ selectedApplication.review_remarks }}</strong></p>
            </div>
          </div>

          <div class="card detail-panel">
            <h3>Submitted Documents</h3>
            <div
              v-for="doc in normalizedDocuments(selectedApplication)"
              :key="doc.name"
              class="document-review-row"
            >
              <div>
                <strong>{{ doc.name }}</strong>
                <p>{{ doc.original_name || "No file uploaded" }}</p>
                <p>Uploaded {{ formatDate(doc.uploaded_at) }}</p>
                <p v-if="doc.remarks" class="revision-text">{{ doc.remarks }}</p>
              </div>
              <div class="document-review-actions">
                <StatusBadge :status="doc.status" />
                <button
                  class="btn ghost"
                  type="button"
                  :disabled="!(doc.url || doc.id)"
                  @click="viewDocument(doc)"
                >
                  <Eye :size="16" />
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Eye } from "@lucide/vue";
import { demoApplications, getRequiredDocumentsForBusinessType } from "@/modules/accreditation/data/mockData";
import { getApplications, openApplicationDocument } from "@/modules/accreditation/services/accreditationApi";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const search = ref(String(route.query.q || ""));
const statusFilter = ref("all");
const selectedApplication = ref(null);
const applications = ref([]);

onMounted(async () => {
  await auth.connectDemoToBackend();

  if (isDemoSession()) {
    applications.value = demoApplications.map(normalizeApplication);
    openApplicationFromRoute();
    return;
  }

  try {
    const result = await getApplications();
    applications.value = result.applications.map(normalizeApplication);
  } catch (_err) {
    applications.value = [];
  }
  openApplicationFromRoute();
});

const filteredApplications = computed(() => {
  const term = search.value.trim().toLowerCase();
  return applications.value.filter((app) => {
    const matchesStatus = statusFilter.value === "all" || app.status === statusFilter.value;
    const matchesSearch =
      !term ||
      [app.id, app.business_name, app.business_type, app.type, app.business_permit_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });
});

watch(
  () => route.query.application,
  () => openApplicationFromRoute()
);

watch(
  () => route.query.q,
  (value) => {
    search.value = String(value || "");
  }
);

function normalizeApplication(app) {
  const id = app.application_number || app.id;
  return {
    ...app,
    id,
    type: app.accreditation_type || app.type,
    owner_remarks: app.owner_remarks || (["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    review_remarks: app.review_remarks || (!["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    address:
      app.address ||
      [app.street_address, app.barangay, app.city_municipality, app.province]
        .filter(Boolean)
        .join(", "),
    documents: Array.isArray(app.documents) ? app.documents : [],
  };
}

function normalizedDocuments(app) {
  return getRequiredDocumentsForBusinessType(app.business_type).map((name) => {
    const document = app.documents?.find((item) => item.name === name || item.document_type === name);
    return document
      ? {
          ...document,
          name: document.name || document.document_type,
          url: document.url || "",
        }
      : { name, status: "pending", uploaded_at: null, url: "" };
  });
}

function formatDate(value) {
  if (!value) return "Not yet submitted";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openApplicationFromRoute() {
  const applicationId = route.query.application;
  if (!applicationId) {
    selectedApplication.value = null;
    return;
  }
  const application = applications.value.find((app) => app.id === applicationId || app.application_number === applicationId);
  selectedApplication.value = application || null;
}

function openApplication(app) {
  selectedApplication.value = app;
  router.push({
    path: "/accreditation/app/applications",
    query: { application: app.application_number || app.id },
  });
}

function closeApplication() {
  selectedApplication.value = null;
  router.push({ path: "/accreditation/app/applications" });
}

function needsRevision(app) {
  return app?.status === "for_revision";
}

function revisionRoute(app) {
  return {
    path: "/accreditation/app/apply",
    query: {
      application: app.application_number || app.id,
      revise: "1",
    },
  };
}

async function viewDocument(doc) {
  if (doc.url) window.open(doc.url, "_blank", "noopener,noreferrer");
  else if (doc.id) await openApplicationDocument(doc.id);
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
