<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Applications</h1>
        <p>Review submitted accreditation applications and monitor decisions.</p>
      </div>
    </div>

    <div class="card compact">
      <div class="card-header">
        <h2>Applications Queue</h2>
        <div class="table-tools">
          <input v-model="search" class="compact-search" placeholder="Search applications..." />
          <select v-model="statusFilter">
            <option value="all">All Status</option>
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
            <th>Business</th>
            <th>Owner</th>
            <th>Type</th>
            <th>Documents</th>
            <th>Owner Remarks</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in filteredApplications" :key="app.id">
            <td><strong>{{ app.id }}</strong></td>
            <td>{{ app.business_name }}</td>
            <td>{{ app.owner }}</td>
            <td>{{ app.type }}</td>
            <td>{{ documentProgress(app) }}</td>
            <td class="muted-cell">{{ app.owner_remarks || "None" }}</td>
            <td><StatusBadge :status="app.status" /></td>
            <td>{{ formatDate(app.submitted_at) }}</td>
            <td>
              <RouterLink class="btn ghost" :to="{ path: reviewPath, query: { application: app.id } }">
                {{ app.status === "submitted" ? "Review" : "View" }}
              </RouterLink>
            </td>
          </tr>
          <tr v-if="filteredApplications.length === 0">
            <td colspan="9" class="empty-state">No applications found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { demoApplications, getRequiredDocumentsForBusinessType } from "@/modules/accreditation/data/mockData";
import { getApplications } from "@/modules/accreditation/services/accreditationApi";
import { cmsContentApi } from "@/modules/cms/services/cmsContentApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const route = useRoute();
const search = ref(String(route.query.q || ""));
const statusFilter = ref("all");
const applications = ref([]);
const reviewPath = computed(() => "/cms/businesses/review");
const isCmsBusinessRoute = computed(() => route.path.startsWith("/cms/businesses"));

onMounted(loadApplications);

watch(
  () => route.query.q,
  (value) => {
    search.value = String(value || "");
  }
);

const filteredApplications = computed(() => {
  const term = search.value.trim().toLowerCase();
  return applications.value.filter((app) => {
    const matchesStatus = statusFilter.value === "all" || app.status === statusFilter.value;
    const matchesSearch =
      !term ||
      [app.id, app.business_name, app.owner, app.business_type, app.type, app.business_permit_number, app.owner_remarks]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });
});

function normalizeApplication(app) {
  return {
    ...app,
    id: app.application_number || app.id,
    status: app.status === "pending" ? "submitted" : app.status,
    type: app.accreditation_type || app.type || "New Accreditation",
    owner_remarks: app.owner_remarks || (["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    review_remarks: app.review_remarks || (!["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    documents: Array.isArray(app.documents) ? app.documents : [],
    owner: app.owner || `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Business Owner",
  };
}

async function loadApplications() {
  try {
    if (isCmsBusinessRoute.value) {
      const result = await cmsContentApi.getAccreditationApplications();
      applications.value = unwrapApplicationList(result)
        .map(normalizeApplication)
        .filter((app) => app.status !== "draft");
      return;
    }

    await auth.connectDemoToBackend();
    if (isDemoSession()) {
      applications.value = demoApplications.map(normalizeApplication).filter((app) => app.status !== "draft");
      return;
    }

    const result = await getApplications();
    applications.value = unwrapApplicationList(result)
      .map(normalizeApplication)
      .filter((app) => app.status !== "draft");
  } catch (_err) {
    applications.value = [];
  }
}

function unwrapApplicationList(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.applications)) return result.data.applications;
  if (Array.isArray(result?.applications)) return result.applications;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function documentProgress(app) {
  const requiredDocuments = getRequiredDocumentsForBusinessType(app.business_type);
  const uploaded = requiredDocuments.filter((name) =>
    app.documents.some((doc) => doc.document_type === name || doc.name === name)
  ).length;
  return `${uploaded}/${requiredDocuments.length}`;
}

function formatDate(value) {
  if (!value) return "Not yet submitted";
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
