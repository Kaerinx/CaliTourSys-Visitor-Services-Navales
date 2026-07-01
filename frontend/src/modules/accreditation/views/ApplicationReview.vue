<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>{{ application.id || "Application Review" }}</h1>
        <p>Review business information, documents, and record your decision.</p>
      </div>
      <RouterLink class="btn outline" :to="queuePath">Back to Queue</RouterLink>
    </div>

    <p v-if="message" class="form-success sticky-error">{{ message }}</p>
    <p v-if="error" class="form-error sticky-error">{{ error }}</p>

    <div class="review-grid">
      <div class="card">
        <h2>Business Information</h2>
        <div class="detail-grid">
          <p><span>Business</span><strong>{{ application.business_name }}</strong></p>
          <p><span>Type</span><strong>{{ application.business_type }}</strong></p>
          <p><span>Business Permit No.</span><strong>{{ application.business_permit_number || "Not provided" }}</strong></p>
          <p><span>DTI/SEC Registration No.</span><strong>{{ application.dti_sec_registration_number || "Not provided" }}</strong></p>
          <p><span>Accreditation Type</span><strong>{{ application.type }}</strong></p>
          <p><span>Owner</span><strong>{{ ownerName }}</strong></p>
          <p><span>Contact</span><strong>{{ application.phone || "Not provided" }}</strong></p>
          <p><span>Email</span><strong>{{ application.email || "Not provided" }}</strong></p>
          <p class="span-2"><span>Address</span><strong>{{ address }}</strong></p>
          <p class="span-2"><span>Business Owner Remarks</span><strong>{{ application.owner_remarks || "No remarks from business owner." }}</strong></p>
          <p><span>Status</span><StatusBadge :status="application.status" /></p>
        </div>
      </div>

      <div class="card">
        <h2>Submitted Documents</h2>
        <div v-for="doc in normalizedDocuments" :key="doc.name" class="document-review-row">
          <div>
            <strong>{{ doc.name }}</strong>
            <p>{{ doc.original_name || "No file uploaded" }}</p>
            <p>Uploaded {{ formatDate(doc.uploaded_at) }}</p>
          </div>
          <div class="button-row compact-actions">
            <button
              v-if="doc.id || doc.url"
              class="btn ghost"
              type="button"
              @click="viewDocument(doc)"
            >
              View
            </button>
            <StatusBadge :status="doc.status" />
          </div>
        </div>
      </div>
    </div>

    <form class="card form-card" @submit.prevent="submitReview('under_review')">
      <div class="section-heading-row">
        <div>
          <h2>Decision</h2>
          <p class="muted">{{ decisionHint }}</p>
        </div>
        <StatusBadge :status="application.status" />
      </div>
      <label>Review Remarks<textarea v-model="remarks" rows="4" placeholder="Enter review remarks or revision instructions..." /></label>
      <div class="button-row">
        <button
          v-if="application.status === 'submitted'"
          class="btn outline"
          type="button"
          :disabled="savingDecision"
          @click="submitReview('under_review')"
        >
          Start Review
        </button>
        <button class="btn outline" type="button" :disabled="savingDecision" @click="submitReview('for_revision')">Request Revision</button>
        <button class="btn danger" type="button" :disabled="savingDecision" @click="submitReview('rejected')">Reject</button>
        <button class="btn primary" type="button" :disabled="savingDecision" @click="submitReview('approved')">Approve</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { demoApplications, getRequiredDocumentsForBusinessType } from "@/modules/accreditation/data/mockData";
import { getApplication, openApplicationDocument, reviewApplication } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const auth = useAuthStore();
const message = ref("");
const error = ref("");
const remarks = ref("");
const documents = ref([]);
const savingDecision = ref(false);
const application = reactive(normalizeApplication(demoApplications[0]));
const queuePath = computed(() => "/cms/businesses/applications");

onMounted(loadApplication);

watch(
  () => route.query.application,
  () => loadApplication()
);

const ownerName = computed(
  () => application.owner || `${application.first_name || ""} ${application.last_name || ""}`.trim() || "Business Owner"
);
const address = computed(() =>
  [application.street_address, application.barangay, application.city_municipality, application.province]
    .filter(Boolean)
    .join(", ")
);
const decisionHint = computed(() => {
  if (application.status === "submitted") return "Start review when you begin checking the application.";
  if (application.status === "under_review") return "Approve, reject, or request revision after checking the documents.";
  if (application.status === "for_revision") return "The owner has been asked to revise this application.";
  if (application.status === "approved") return "This application has already been approved.";
  if (application.status === "rejected") return "This application has already been rejected.";
  return "Record the next application decision.";
});
const normalizedDocuments = computed(() =>
  getRequiredDocumentsForBusinessType(application.business_type).map((name) => {
    const document = documents.value.find((item) => item.document_type === name || item.name === name);
    return document || { name, document_type: name, status: "pending", uploaded_at: null };
  })
);

async function loadApplication() {
  await auth.connectDemoToBackend();
  const id = route.query.application || demoApplications[0].id;
  if (isDemoSession()) {
    Object.assign(application, normalizeApplication(demoApplications.find((app) => app.id === id) || demoApplications[0]));
    documents.value = application.documents || [];
    return;
  }

  try {
    const result = await getApplication(id);
    Object.assign(application, normalizeApplication(result.application));
    remarks.value = application.review_remarks || "";
    documents.value = result.documents || [];
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load application.";
  }
}

async function submitReview(status) {
  message.value = "";
  error.value = "";
  savingDecision.value = true;

  try {
    if (isDemoSession()) {
      application.status = status;
      message.value = "Review decision saved for prototype.";
      return;
    }

    const result = await reviewApplication(application.id, {
      status,
      remarks: remarks.value,
    });
    Object.assign(application, normalizeApplication(result.application));
    remarks.value = application.review_remarks || "";
    message.value = "Review decision saved.";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to save review decision.";
  } finally {
    savingDecision.value = false;
  }
}

function normalizeApplication(app) {
  return {
    ...app,
    id: app.application_number || app.id,
    status: app.status === "pending" ? "submitted" : app.status,
    type: app.accreditation_type || app.type || "New Accreditation",
    owner_remarks: app.owner_remarks || (["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    review_remarks: app.review_remarks || (!["draft", "submitted"].includes(app.status) ? app.remarks : ""),
    owner: app.owner || `${app.first_name || ""} ${app.last_name || ""}`.trim(),
  };
}

function formatDate(value) {
  if (!value) return "Not uploaded";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function viewDocument(doc) {
  if (doc.url) {
    window.open(doc.url, "_blank", "noopener,noreferrer");
    return;
  }
  if (doc.id) await openApplicationDocument(doc.id);
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
