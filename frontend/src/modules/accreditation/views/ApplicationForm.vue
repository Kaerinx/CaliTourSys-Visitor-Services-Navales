<template>
  <section class="page">
      <div class="page-header">
        <div>
          <h1>Apply for Accreditation</h1>
          <p>Complete the basic details, attach the required documents, then submit.</p>
        </div>
      </div>

    <form class="card form-card" @submit.prevent="submit">
      <p v-if="message" class="form-success sticky-error">{{ message }}</p>
      <p v-if="error" class="form-error sticky-error">{{ error }}</p>
      <div v-if="revisionRemarks" class="revision-notice inline">
        <div>
          <strong>Revision requested</strong>
          <p>{{ revisionRemarks }}</p>
        </div>
      </div>

      <section class="form-section">
        <h2>Application Information</h2>
        <div class="form-grid two">
          <label>Accreditation Type
            <select v-model="form.accreditationType">
              <option value="New Accreditation">New Accreditation</option>
              <option value="Renewal">Renewal</option>
            </select>
          </label>
          <label>Business Type
            <select v-model="form.businessType" required>
              <option value="">Select business type</option>
              <optgroup
                v-for="group in businessTypeGroups"
                :key="group.label"
                :label="group.label"
              >
                <option v-for="type in group.options" :key="type" :value="type">
                  {{ type }}
                </option>
              </optgroup>
            </select>
          </label>
          <label>Business Permit Number<input v-model="form.businessPermitNumber" required /></label>
          <label>DTI/SEC Registration Number<input v-model="form.dtiSecRegistrationNumber" /></label>
          <label class="span-2">Business Owner Remarks<textarea v-model="form.remarks" rows="4" placeholder="Optional notes for tourism staff" /></label>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading-row">
          <div>
            <h2>Required Documents</h2>
            <p class="muted">Choose a file and click upload. Your draft is saved automatically.</p>
          </div>
          <StatusBadge :status="applicationId ? applicationStatus : 'draft'" />
        </div>
        <div class="document-checklist">
          <div v-for="doc in requiredDocuments" :key="doc" class="document-check-row">
            <div class="document-check-icon">
              <FileText :size="20" />
            </div>
            <div class="document-check-body">
              <div class="document-title-row">
                <div>
                  <strong>{{ doc }}</strong>
                  <p>PDF, JPG, or PNG. Maximum 10MB.</p>
                </div>
                <StatusBadge
                  v-if="uploadedDocuments[doc]"
                  :status="uploadedDocuments[doc].status"
                />
                <span v-else-if="selectedFiles[doc]" class="document-state ready">
                  Ready to upload
                </span>
                <span v-else class="document-state">
                  Required
                </span>
              </div>

              <div class="document-file-strip">
                <span>{{ documentFileName(doc) }}</span>
                <small>{{ documentMeta(doc) }}</small>
              </div>

              <div class="document-actions">
                <input
                  :id="fileInputId(doc)"
                  class="sr-only"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  @change="setFile(doc, $event)"
                />
                <label class="btn outline" :for="fileInputId(doc)">
                  <Upload :size="16" />
                  Choose File
                </label>
                <button
                  class="btn primary"
                  type="button"
                  :disabled="!selectedFiles[doc] || !!uploadingDocument"
                  @click="uploadDocumentFile(doc)"
                >
                  {{ uploadButtonLabel(doc) }}
                </button>
                <button
                  class="btn ghost"
                  type="button"
                  :disabled="!documentViewUrl(doc)"
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

      <div class="button-row">
        <button class="btn outline" type="button" :disabled="saving || submitting" @click="saveDraft">
          {{ saving ? "Saving..." : "Save for Later" }}
        </button>
        <button class="btn primary" type="submit" :disabled="submitting">
          {{ submitting ? "Submitting..." : "Submit Application" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Eye, FileText, Upload } from "@lucide/vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { businessTypeGroups, requiredDocuments } from "@/modules/accreditation/data/mockData";
import {
  createApplication,
  getApplication,
  getBusinessProfile,
  saveApplicationDraft,
  submitApplication,
  uploadApplicationDocument,
} from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const route = useRoute();
const draftStorageKey = "application_draft";
const message = ref("");
const error = ref("");
const saving = ref(false);
const submitting = ref(false);
const uploadingDocument = ref("");
const revisionRemarks = ref("");
const routeAccreditationType = getAccreditationTypeFromRoute();
const rawSavedDraft = JSON.parse(localStorage.getItem(draftStorageKey) || "null");
const savedDraft = shouldIgnoreSavedDraft(rawSavedDraft, routeAccreditationType) ? null : rawSavedDraft;
const applicationId = ref(savedDraft?.applicationId || "");
const applicationNumber = ref(savedDraft?.applicationNumber || "");
const applicationStatus = ref(savedDraft?.status || "draft");
const selectedFiles = reactive({});
const selectedFileUrls = reactive({});
const uploadedDocuments = reactive(savedDraft?.uploadedDocuments || {});

const form = reactive({
  accreditationType: routeAccreditationType || savedDraft?.form?.accreditationType || "New Accreditation",
  businessType: savedDraft?.form?.businessType || "",
  businessPermitNumber: savedDraft?.form?.businessPermitNumber || "",
  dtiSecRegistrationNumber: savedDraft?.form?.dtiSecRegistrationNumber || "",
  remarks: savedDraft?.form?.remarks || "",
});

onMounted(async () => {
  await auth.connectDemoToBackend();

  if (route.query.application) {
    await loadApplicationForRevision(route.query.application);
    return;
  }

  if (isDemoSession()) return;

  try {
    const { profile } = await getBusinessProfile();
    if (profile) applyBusinessProfileDefaults(profile);
  } catch (_err) {
    // Keep the form usable even if the profile request is unavailable.
  }
});

watch(
  () => [route.query.type, route.query.start],
  () => {
    const selectedType = getAccreditationTypeFromRoute();
    if (!selectedType) return;
    form.accreditationType = selectedType;

    if (route.query.start === "1") {
      resetDraftState();
    }
  }
);

async function saveDraft() {
  message.value = "";
  error.value = "";
  saving.value = true;

  try {
    const application = await persistDraft();
    message.value = `Draft ${application.application_number || applicationNumber.value} saved.`;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to save draft.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    saving.value = false;
  }
}

async function submit() {
  message.value = "";
  error.value = "";
  submitting.value = true;

  try {
    const application = await persistDraft();
    await uploadPendingDocuments();
    ensureRequiredDocumentsUploaded();

    if (isDemoSession()) {
      applicationStatus.value = "submitted";
      saveLocalDraft();
      message.value = `Application ${application.application_number || applicationNumber.value} submitted successfully.`;
      return;
    }

    const result = await submitApplication(application.id);
    const submittedApplication = result?.application;
    if (!submittedApplication) {
      throw new Error("The application was not submitted. Please refresh and try again.");
    }

    applicationStatus.value = submittedApplication.status;
    applicationNumber.value = submittedApplication.application_number || applicationNumber.value;
    message.value = `Application ${applicationNumber.value} submitted successfully.`;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Unable to submit application.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    submitting.value = false;
  }
}

async function loadApplicationForRevision(id) {
  if (isDemoSession()) return;

  try {
    const result = await getApplication(id);
    const app = result.application;
    applicationId.value = app.id;
    applicationNumber.value = app.application_number;
    applicationStatus.value = app.status;
    revisionRemarks.value = app.status === "for_revision" ? app.review_remarks || app.remarks || "Please update the requested items before resubmitting." : "";

    Object.assign(form, {
      accreditationType: app.accreditation_type || "New Accreditation",
      businessType: app.business_type || "",
      businessPermitNumber: app.business_permit_number || "",
      dtiSecRegistrationNumber: app.dti_sec_registration_number || "",
      remarks: app.owner_remarks || "",
    });

    Object.keys(uploadedDocuments).forEach((doc) => delete uploadedDocuments[doc]);
    for (const document of result.documents || []) {
      const name = document.document_type;
      uploadedDocuments[name] = {
        name: document.original_name,
        status: document.status,
        uploaded_at: document.uploaded_at,
        url: publicFileUrl(document.file_path),
      };
    }
    saveLocalDraft();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load this application for revision.";
  }
}

async function persistDraft() {
  await auth.connectDemoToBackend();
  resetLocalDemoApplicationIfConnected();

  if (isDemoSession()) {
    if (!applicationId.value) {
      applicationId.value = `demo-${Date.now()}`;
      applicationNumber.value = `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    }
    applicationStatus.value = "draft";
    saveLocalDraft();
    return { id: applicationId.value, application_number: applicationNumber.value, status: "draft" };
  }

  const payload = { ...form };
  const result = applicationId.value
    ? await saveApplicationDraft(applicationId.value, payload)
    : await createApplication(payload);

  const savedApplication = result?.application;
  if (!savedApplication) {
    throw new Error("The draft could not be saved. Please check the application details and try again.");
  }

  applicationId.value = savedApplication.id;
  applicationNumber.value = savedApplication.application_number;
  applicationStatus.value = savedApplication.status;
  saveLocalDraft();
  return savedApplication;
}

function setFile(doc, event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (selectedFileUrls[doc]) {
    URL.revokeObjectURL(selectedFileUrls[doc]);
  }

  selectedFiles[doc] = file;
  selectedFileUrls[doc] = URL.createObjectURL(file);
  error.value = "";
}

async function uploadPendingDocuments() {
  for (const doc of requiredDocuments) {
    if (selectedFiles[doc]) {
      await uploadDocumentFile(doc);
    }
  }
}

async function uploadDocumentFile(doc) {
  await auth.connectDemoToBackend();
  resetLocalDemoApplicationIfConnected();

  if (!selectedFiles[doc]) {
    error.value = `Select a file for ${doc} before uploading.`;
    return;
  }

  uploadingDocument.value = doc;
  saving.value = !applicationId.value;
  error.value = "";
  message.value = "";

  try {
    if (!applicationId.value) {
      await persistDraft();
    }

    if (isDemoSession()) {
      uploadedDocuments[doc] = {
        name: selectedFiles[doc].name,
        status: "submitted",
        uploaded_at: new Date().toISOString(),
        url: selectedFileUrls[doc],
      };
      delete selectedFiles[doc];
      saveLocalDraft();
      message.value = `${doc} uploaded.`;
      return;
    }

    const data = new FormData();
    data.append("document", selectedFiles[doc]);
    data.append("documentType", doc);
    const result = await uploadApplicationDocument(applicationId.value, data);
    uploadedDocuments[doc] = {
      name: result.document.original_name,
      status: result.document.status,
      uploaded_at: result.document.uploaded_at,
      url: publicFileUrl(result.document.file_path),
    };
    clearSelectedFile(doc);
    saveLocalDraft();
    message.value = `${doc} uploaded.`;
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      err.message ||
      `Unable to upload ${doc}. Please check the basic details and try again.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    uploadingDocument.value = "";
    saving.value = false;
  }
}

function documentFileName(doc) {
  return uploadedDocuments[doc]?.name || selectedFiles[doc]?.name || "No file selected";
}

function documentMeta(doc) {
  if (uploadedDocuments[doc]?.uploaded_at) {
    return `Uploaded ${formatDateTime(uploadedDocuments[doc].uploaded_at)}`;
  }
  if (selectedFiles[doc]) {
    return `${formatFileSize(selectedFiles[doc].size)} selected`;
  }
  return "Choose a file, then upload.";
}

function uploadButtonLabel(doc) {
  if (uploadingDocument.value === doc) return applicationId.value ? "Uploading..." : "Saving & Uploading...";
  return applicationId.value ? "Upload" : "Save & Upload";
}

function documentViewUrl(doc) {
  return selectedFileUrls[doc] || uploadedDocuments[doc]?.url || "";
}

function viewDocument(doc) {
  const url = documentViewUrl(doc);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

function fileInputId(doc) {
  return `document-${doc.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function publicFileUrl(filePath) {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const serverBase = apiBase.replace(/\/api\/?$/, "");
  const normalizedPath = filePath.replaceAll("\\", "/").replace(/^uploads\//, "/uploads/");
  return `${serverBase}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

function clearSelectedFile(doc) {
  if (selectedFileUrls[doc]) {
    URL.revokeObjectURL(selectedFileUrls[doc]);
    delete selectedFileUrls[doc];
  }
  delete selectedFiles[doc];
}

function ensureRequiredDocumentsUploaded() {
  const missing = requiredDocuments.filter((doc) => !uploadedDocuments[doc]);
  if (missing.length) {
    throw new Error(`Please upload required documents: ${missing.join(", ")}.`);
  }
}

function saveLocalDraft() {
  localStorage.setItem(
    draftStorageKey,
    JSON.stringify({
      applicationId: applicationId.value,
      applicationNumber: applicationNumber.value,
      status: applicationStatus.value,
      form: { ...form },
      uploadedDocuments: { ...uploadedDocuments },
    })
  );
}

function applyBusinessProfileDefaults(profile) {
  if (!form.businessType && profile.business_type) {
    form.businessType = profile.business_type;
  }
  if (!form.businessPermitNumber && profile.business_permit_number) {
    form.businessPermitNumber = profile.business_permit_number;
  }
  if (!form.dtiSecRegistrationNumber && profile.dti_sec_registration_number) {
    form.dtiSecRegistrationNumber = profile.dti_sec_registration_number;
  }
}

function getAccreditationTypeFromRoute() {
  const type = String(route.query.type || "").toLowerCase();
  if (["renew", "renewal"].includes(type)) return "Renewal";
  if (["new", "new-accreditation", "new_accreditation"].includes(type)) return "New Accreditation";
  return "";
}

function shouldIgnoreSavedDraft(draft, selectedType) {
  if (!draft) return false;
  if (route.query.start === "1") return true;
  return Boolean(selectedType && draft.form?.accreditationType !== selectedType);
}

function resetDraftState() {
  applicationId.value = "";
  applicationNumber.value = "";
  applicationStatus.value = "draft";
  Object.keys(selectedFiles).forEach((doc) => clearSelectedFile(doc));
  Object.keys(uploadedDocuments).forEach((doc) => {
    delete uploadedDocuments[doc];
  });
}

function resetLocalDemoApplicationIfConnected() {
  if (isDemoSession() || !String(applicationId.value).startsWith("demo-")) return;

  resetDraftState();
  saveLocalDraft();
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
