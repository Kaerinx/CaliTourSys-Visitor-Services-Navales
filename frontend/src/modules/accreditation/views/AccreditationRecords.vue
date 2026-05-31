<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Accreditation Records</h1>
        <p>View issued accreditation records and renewal history.</p>
      </div>
    </div>

    <p v-if="error" class="form-error sticky-error">{{ error }}</p>

    <div class="card compact">
      <div class="card-header">
        <h2>Issued Records</h2>
        <div class="table-tools">
          <input v-model="search" class="compact-search" placeholder="Search records..." />
          <select v-model="statusFilter">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Record No.</th>
            <th>Application</th>
            <th>Business</th>
            <th>Permit No.</th>
            <th>Issued</th>
            <th>Expires</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredRecords" :key="record.id">
            <td><strong>{{ record.record_number }}</strong></td>
            <td>{{ record.application_number }}</td>
            <td>{{ record.business_name }}</td>
            <td>{{ record.business_permit_number || "Not provided" }}</td>
            <td>{{ formatDate(record.issued_at) }}</td>
            <td>{{ formatDate(record.expires_at) }}</td>
            <td><StatusBadge :status="record.status" /></td>
            <td><button class="btn ghost" @click="selectedRecord = record">View</button></td>
          </tr>
          <tr v-if="filteredRecords.length === 0">
            <td colspan="8" class="empty-state">No accreditation records found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedRecord" class="modal-backdrop" @click.self="selectedRecord = null">
      <section class="modal landscape">
        <button class="modal-close" @click="selectedRecord = null">x</button>
        <div class="modal-title-row">
          <div>
            <h2>{{ selectedRecord.business_name }}</h2>
            <p class="muted">{{ selectedRecord.record_number }} - {{ selectedRecord.application_number }}</p>
          </div>
          <StatusBadge :status="selectedRecord.status" />
        </div>

        <div class="review-grid">
          <div class="card detail-panel">
            <h3>Record Information</h3>
            <div class="detail-grid">
              <p><span>Accreditation Type</span><strong>{{ selectedRecord.accreditation_type }}</strong></p>
              <p><span>Business Type</span><strong>{{ selectedRecord.business_type }}</strong></p>
              <p><span>Business Permit No.</span><strong>{{ selectedRecord.business_permit_number || "Not provided" }}</strong></p>
              <p><span>DTI/SEC Registration No.</span><strong>{{ selectedRecord.dti_sec_registration_number || "Not provided" }}</strong></p>
              <p><span>Issued</span><strong>{{ formatDate(selectedRecord.issued_at) }}</strong></p>
              <p><span>Expires</span><strong>{{ formatDate(selectedRecord.expires_at) }}</strong></p>
              <p><span>Owner</span><strong>{{ ownerName(selectedRecord) }}</strong></p>
              <p><span>Issued By</span><strong>{{ issuerName(selectedRecord) }}</strong></p>
              <p class="span-2"><span>Address</span><strong>{{ address(selectedRecord) }}</strong></p>
              <p v-if="selectedRecord.notes" class="span-2"><span>Notes</span><strong>{{ selectedRecord.notes }}</strong></p>
            </div>
          </div>

          <div class="card detail-panel">
            <h3>Submitted Documents</h3>
            <div
              v-for="doc in normalizedDocuments(selectedRecord)"
              :key="doc.name"
              class="document-review-row"
            >
              <div>
                <strong>{{ doc.name }}</strong>
                <p>{{ doc.original_name || "No file uploaded" }}</p>
                <p>Uploaded {{ formatDate(doc.uploaded_at) }}</p>
              </div>
              <div class="document-review-actions">
                <StatusBadge :status="doc.status" />
                <button class="btn ghost" type="button" :disabled="!(doc.url || doc.id)" @click="viewDocument(doc)">
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
import { computed, onMounted, ref } from "vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { requiredDocuments } from "@/modules/accreditation/data/mockData";
import { getRecords, openApplicationDocument } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const records = ref([]);
const selectedRecord = ref(null);
const search = ref("");
const statusFilter = ref("all");
const error = ref("");

onMounted(async () => {
  await auth.connectDemoToBackend();
  try {
    const result = await getRecords();
    records.value = result.records || [];
  } catch (err) {
    records.value = [];
    error.value = err.response?.data?.message || "Unable to load accreditation records.";
  }
});

const filteredRecords = computed(() => {
  const term = search.value.trim().toLowerCase();
  return records.value.filter((record) => {
    const matchesStatus = statusFilter.value === "all" || record.status === statusFilter.value;
    const matchesSearch =
      !term ||
      [record.record_number, record.application_number, record.business_name, record.business_permit_number, ownerName(record)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });
});

function normalizedDocuments(record) {
  return requiredDocuments.map((name) => {
    const document = record.documents?.find((item) => item.document_type === name || item.name === name);
    return document
      ? {
          ...document,
          name: document.name || document.document_type,
          url: document.url || "",
        }
      : { name, status: "pending", uploaded_at: null, url: "" };
  });
}

function ownerName(record) {
  return [record.first_name, record.last_name].filter(Boolean).join(" ") || "Business Owner";
}

function issuerName(record) {
  return [record.issuer_first_name, record.issuer_last_name].filter(Boolean).join(" ") || "Tourism Office";
}

function address(record) {
  return [record.street_address, record.barangay, record.city_municipality, record.province]
    .filter(Boolean)
    .join(", ");
}

async function viewDocument(doc) {
  if (doc.url) window.open(doc.url, "_blank", "noopener,noreferrer");
  else if (doc.id) await openApplicationDocument(doc.id);
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>
