<template>
  <section class="page tourist-count-page">
    <div class="page-header">
      <div>
        <h1>Tourist Log</h1>
        <p>Record and review tourist counts for your establishment.</p>
      </div>
    </div>

    <div v-if="loading" class="card state-card">Loading tourist count logs...</div>

    <div v-else-if="!businessProfile" class="card state-card profile-required">
      <div>
        <h2>Complete your Business Profile first</h2>
        <p>Tourist count logs must be linked to your establishment before they can be submitted.</p>
      </div>
      <RouterLink class="btn primary" to="/accreditation/app/business-profile">Open Business Profile</RouterLink>
    </div>

    <template v-else>
      <div v-if="recordsWarning" class="records-warning" role="status">
        {{ recordsWarning }}
      </div>

      <div class="count-tabs" role="tablist" aria-label="Tourist count log sections">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'submit'"
          :class="{ active: activeTab === 'submit' }"
          @click="activeTab = 'submit'"
        >
          Tourist Count Log
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'records'"
          :class="{ active: activeTab === 'records' }"
          @click="activeTab = 'records'"
        >
          Tourist Records
        </button>
      </div>

      <div v-if="successMessage" class="form-message success-message" role="status">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="form-message error-message" role="alert">
        {{ errorMessage }}
      </div>

      <form v-if="activeTab === 'submit'" class="card count-form" @submit.prevent="submitLog">
        <div class="card-header">
          <div>
            <h2>Tourist Count Log</h2>
            <p class="muted">Counts will be recorded for {{ displayBusinessName }}.</p>
          </div>
        </div>

        <div class="form-grid">
          <section class="form-section span-all">
            <div class="section-heading">
              <h3>Reporting Details</h3>
            </div>
            <div class="details-grid">
              <label class="form-field">
                <span>Reporting Date <strong aria-hidden="true">*</strong></span>
                <input v-model="form.logDate" type="date" :max="todayDate" required />
              </label>
              <label class="form-field">
                <span>Establishment</span>
                <input :value="displayBusinessName" type="text" readonly aria-readonly="true" />
              </label>
            </div>
          </section>

          <section class="form-section span-all">
            <div class="section-heading">
              <h3>Tourist Count by Age Group</h3>
            </div>
            <div class="counter-grid age-counter-grid">
              <div v-for="counter in ageCounterFields" :key="counter.key" class="counter-card">
                <span class="counter-label">{{ counter.label }}</span>
                <div class="counter-control">
                  <button
                    type="button"
                    class="counter-button"
                    :aria-label="`Decrease ${counter.label}`"
                    :disabled="countValue(form[counter.key]) === 0"
                    @click="decrementCounter(counter.key)"
                  >
                    -
                  </button>
                  <span class="counter-value">{{ countValue(form[counter.key]) }}</span>
                  <button
                    type="button"
                    class="counter-button"
                    :aria-label="`Increase ${counter.label}`"
                    @click="incrementCounter(counter.key)"
                  >
                    +
                  </button>
                </div>
              </div>
              <div class="total-card primary-total compact-total">
                <span>Total Tourists</span>
                <strong>{{ totalVisitors }}</strong>
                <small>Adults + Senior Citizens + Children</small>
              </div>
            </div>
          </section>

          <section class="form-section span-all">
            <div class="section-heading">
              <h3>Tourist Classification</h3>
            </div>
            <div class="classification-grid">
              <div class="total-card computed-total compact-total">
                <span>Local Tourists</span>
                <strong>{{ localVisitors }}</strong>
                <small>Auto-calculated and read-only</small>
              </div>
              <div v-for="counter in classificationCounterFields" :key="counter.key" class="counter-card">
                <span class="counter-label">{{ counter.label }}</span>
                <div class="counter-control">
                  <button
                    type="button"
                    class="counter-button"
                    :aria-label="`Decrease ${counter.label}`"
                    :disabled="countValue(form[counter.key]) === 0"
                    @click="decrementCounter(counter.key)"
                  >
                    -
                  </button>
                  <span class="counter-value">{{ countValue(form[counter.key]) }}</span>
                  <button
                    type="button"
                    class="counter-button"
                    :aria-label="`Increase ${counter.label}`"
                    :disabled="classifiedVisitors >= totalVisitors"
                    @click="incrementCounter(counter.key)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section span-all">
            <div class="section-heading">
              <h3>Visit Context</h3>
            </div>
            <div class="context-options" role="radiogroup" aria-label="Visit Context">
              <button
                v-for="option in visitContextOptions"
                :key="option"
                type="button"
                class="context-chip"
                role="radio"
                :aria-checked="form.visitContext === option"
                :class="{ active: form.visitContext === option }"
                @click="form.visitContext = option"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-section span-all">
            <div class="section-heading">
              <h3>Summary</h3>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <span>Total Tourists</span>
                <strong>{{ totalVisitors }}</strong>
              </div>
              <div class="summary-item">
                <span>Local Tourists</span>
                <strong>{{ localVisitors }}</strong>
              </div>
              <div class="summary-item">
                <span>Domestic Tourists</span>
                <strong>{{ countValue(form.domesticCount) }}</strong>
              </div>
              <div class="summary-item">
                <span>International Tourists</span>
                <strong>{{ countValue(form.internationalCount) }}</strong>
              </div>
            </div>
          </section>
        </div>

        <p v-if="classificationExceedsTotal" class="inline-error" role="alert">
          Domestic and International Tourists cannot exceed Total Tourists.
        </p>

        <div class="form-actions">
          <button class="btn primary" type="submit" :disabled="submitDisabled">
            {{ submitting ? "Submitting..." : "Submit Tourist Count" }}
          </button>
        </div>
      </form>

      <div v-else class="card compact records-card">
        <div class="card-header">
          <div>
            <h2>Tourist Records</h2>
            <p class="muted">Previously submitted tourist count logs for {{ displayBusinessName }}.</p>
          </div>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reporting Date</th>
                <th>Adults</th>
                <th>Senior Citizens</th>
                <th>Children</th>
                <th>Total Tourists</th>
                <th>Local Tourists</th>
                <th>Domestic Tourists</th>
                <th>International Tourists</th>
                <th>Visit Context</th>
                <th>Status</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td><strong>{{ formatReportingDate(log.log_date) }}</strong></td>
                <td>{{ log.adult_count }}</td>
                <td>{{ log.senior_count }}</td>
                <td>{{ log.children_count }}</td>
                <td>{{ log.total_count }}</td>
                <td>{{ log.local_count }}</td>
                <td>{{ log.domestic_count }}</td>
                <td>{{ log.international_count }}</td>
                <td>{{ log.visit_context || "-" }}</td>
                <td><StatusBadge :status="log.status" /></td>
                <td>{{ formatDateTime(log.created_at) }}</td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="11" class="empty-state">No tourist count logs have been submitted yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import {
  createTouristCountLog,
  getBusinessProfile,
  getTouristCountLogs,
} from "@/modules/accreditation/services/accreditationApi";

const visitContextOptions = [
  "Walk-in",
  "Event-related",
  "Package Tour",
  "Group Tour",
  "Regular Visit",
];

const ageCounterFields = [
  { key: "adultCount", label: "Adults", kind: "demographic" },
  { key: "seniorCount", label: "Senior Citizens", kind: "demographic" },
  { key: "childrenCount", label: "Children", kind: "demographic" },
];

const classificationCounterFields = [
  { key: "domesticCount", label: "Domestic Tourists", kind: "classification" },
  { key: "internationalCount", label: "International Tourists", kind: "classification" },
];

const activeTab = ref("submit");
const loading = ref(true);
const submitting = ref(false);
const businessProfile = ref(null);
const logs = ref([]);
const errorMessage = ref("");
const recordsWarning = ref("");
const successMessage = ref("");
const form = reactive(emptyForm());
const todayDate = todayLocalDate();

const totalVisitors = computed(
  () => countValue(form.adultCount) + countValue(form.seniorCount) + countValue(form.childrenCount)
);
const classifiedVisitors = computed(
  () => countValue(form.domesticCount) + countValue(form.internationalCount)
);
const classificationExceedsTotal = computed(() => classifiedVisitors.value > totalVisitors.value);
const localVisitors = computed(() => Math.max(totalVisitors.value - classifiedVisitors.value, 0));
const displayBusinessName = computed(() => businessProfile.value?.business_name || "Your Establishment");
const submitDisabled = computed(() => submitting.value || classificationExceedsTotal.value || !businessProfile.value);

onMounted(loadLogs);

function emptyForm() {
  return {
    logDate: todayLocalDate(),
    adultCount: 0,
    seniorCount: 0,
    childrenCount: 0,
    domesticCount: 0,
    internationalCount: 0,
    visitContext: "",
  };
}

function countValue(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function todayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function incrementCounter(key) {
  if (["domesticCount", "internationalCount"].includes(key) && classifiedVisitors.value >= totalVisitors.value) {
    return;
  }
  form[key] = countValue(form[key]) + 1;
}

function decrementCounter(key) {
  form[key] = Math.max(countValue(form[key]) - 1, 0);
}

async function loadLogs() {
  loading.value = true;
  errorMessage.value = "";
  recordsWarning.value = "";
  try {
    const result = await getTouristCountLogs();
    businessProfile.value = result.businessProfile || null;
    logs.value = Array.isArray(result.logs) ? result.logs : [];
  } catch (error) {
    const message = apiMessage(error, "Unable to load tourist count logs.");
    if (message.includes('relation "tourist_count_logs" does not exist')) {
      recordsWarning.value = "Tourist records table is not available yet. Apply the migration before testing saved records.";
      await loadBusinessProfileForTableWarning();
      logs.value = [];
    } else {
      errorMessage.value = message;
    }
  } finally {
    loading.value = false;
  }
}

async function loadBusinessProfileForTableWarning() {
  try {
    const result = await getBusinessProfile();
    businessProfile.value = result.profile || null;
  } catch (_error) {
    businessProfile.value = null;
  }
}

function validateForm() {
  if (!form.logDate) return "Reporting Date is required.";
  if (form.logDate > todayDate) return "Reporting Date cannot be a future date.";
  const fields = [
    [form.adultCount, "Adults"],
    [form.seniorCount, "Senior Citizens"],
    [form.childrenCount, "Children"],
    [form.domesticCount, "Domestic Tourists"],
    [form.internationalCount, "International Tourists"],
  ];
  for (const [value, label] of fields) {
    if (!Number.isInteger(Number(value)) || Number(value) < 0) {
      return `${label} must be a non-negative whole number.`;
    }
  }
  if (classificationExceedsTotal.value) {
    return "Domestic and International Tourists cannot exceed Total Tourists.";
  }
  return "";
}

async function submitLog() {
  if (!businessProfile.value) {
    errorMessage.value = "Complete your Business Profile before submitting official tourist count logs.";
    successMessage.value = "";
    return;
  }

  errorMessage.value = validateForm();
  successMessage.value = "";
  if (errorMessage.value) return;

  submitting.value = true;
  try {
    const result = await createTouristCountLog({
      ...form,
      localCount: localVisitors.value,
      notes: "",
    });
    logs.value = [result.log, ...logs.value];
    Object.assign(form, emptyForm());
    successMessage.value = result.message || "Tourist count log submitted successfully.";
    activeTab.value = "records";
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to submit the tourist count log.");
  } finally {
    submitting.value = false;
  }
}

function apiMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error?.message || fallback;
}

function formatReportingDate(value) {
  if (!value) return "-";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
</script>

<style scoped>
.tourist-count-page {
  min-width: 0;
}

.count-tabs {
  display: flex;
  gap: 6px;
  width: fit-content;
  padding: 5px;
  border: 1px solid var(--owner-border, var(--border));
  border-radius: 8px;
  background: #ffffff;
}

.count-tabs button {
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--owner-muted, var(--muted-foreground));
  padding: 8px 16px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.count-tabs button.active {
  background: var(--owner-sky-soft, #eff6ff);
  color: var(--owner-sky, var(--color-gov-blue));
}

.state-card,
.profile-required {
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: var(--owner-muted, var(--muted-foreground));
  text-align: center;
}

.profile-required {
  justify-content: space-between;
  text-align: left;
}

.profile-required h2,
.profile-required p,
.count-form .card-header h2,
.count-form .card-header p,
.records-card .card-header h2,
.records-card .card-header p {
  margin: 0;
}

.records-warning {
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #fff7ed;
  color: #9a3412;
  padding: 10px 14px;
  font-weight: 700;
}

.count-form .card-header {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--owner-border, var(--border));
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field > span {
  color: var(--owner-text, var(--foreground));
  font-weight: 700;
}

.form-field > span strong {
  color: #b91c1c;
}

.form-section {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 18px 0;
  border-top: 1px solid var(--owner-border, var(--border));
}

.form-section:first-child {
  border-top: 0;
  padding-top: 0;
}

.section-heading h3 {
  margin: 0;
  color: var(--owner-text, var(--foreground));
  font-size: 16px;
}

.details-grid,
.classification-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.details-grid input[readonly] {
  background: #f8fafc;
  color: var(--owner-text, var(--foreground));
  font-weight: 800;
}

.counter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 14px;
}

.counter-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  border: 1px solid var(--owner-border, var(--border));
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
}

.counter-label {
  min-height: 40px;
  color: var(--owner-text, var(--foreground));
  font-weight: 800;
  line-height: 1.25;
}

.counter-control {
  display: grid;
  grid-template-columns: 38px minmax(42px, 1fr) 38px;
  align-items: center;
  gap: 8px;
}

.counter-button {
  width: 38px;
  height: 38px;
  border: 1px solid var(--owner-border, var(--border));
  border-radius: 999px;
  background: var(--owner-sky-soft, #eff6ff);
  color: var(--owner-sky, var(--color-gov-blue));
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.counter-button:hover:not(:disabled) {
  border-color: var(--owner-sky, var(--color-gov-blue));
  background: #dbeafe;
}

.counter-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.counter-value {
  min-width: 0;
  text-align: center;
  color: var(--owner-text, var(--foreground));
  font-size: 24px;
  font-weight: 900;
}

.totals-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.total-card {
  display: grid;
  gap: 6px;
  min-width: 0;
  border: 1px solid var(--owner-border, var(--border));
  border-radius: 8px;
  padding: 18px;
}

.total-card span {
  color: var(--owner-muted, var(--muted-foreground));
  font-weight: 800;
}

.total-card strong {
  color: var(--owner-text, var(--foreground));
  font-size: 34px;
  line-height: 1;
}

.total-card small {
  color: var(--owner-muted, var(--muted-foreground));
  line-height: 1.4;
}

.primary-total {
  background: var(--owner-sky-soft, #eff6ff);
}

.computed-total {
  background: #f8fafc;
}

.compact-total {
  min-height: 100%;
}

.context-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.context-chip {
  border: 1px solid var(--owner-border, var(--border));
  border-radius: 999px;
  background: #ffffff;
  color: var(--owner-muted, var(--muted-foreground));
  padding: 10px 16px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.context-chip:hover,
.context-chip.active {
  border-color: var(--owner-sky, var(--color-gov-blue));
  background: var(--owner-sky-soft, #eff6ff);
  color: var(--owner-sky, var(--color-gov-blue));
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-item {
  display: grid;
  gap: 6px;
  min-width: 0;
  border: 1px solid var(--owner-border, var(--border));
  border-radius: 8px;
  background: #ffffff;
  padding: 14px 16px;
}

.summary-item span {
  color: var(--owner-muted, var(--muted-foreground));
  font-size: 13px;
  font-weight: 800;
}

.summary-item strong {
  color: var(--owner-text, var(--foreground));
  font-size: 24px;
  line-height: 1;
}

.span-all {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.form-message,
.inline-error {
  border: 1px solid;
  border-radius: 8px;
  padding: 12px 16px;
}

.success-message {
  border-color: #99f6e4;
  background: #f0fdfa;
  color: #0f766e;
}

.error-message,
.inline-error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.inline-error {
  margin: 18px 0 0;
}

.records-card {
  min-width: 0;
}

.table-scroll {
  overflow-x: auto;
}

.table-scroll table {
  min-width: 1320px;
}

@media (max-width: 900px) {
  .counter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .details-grid,
  .classification-grid,
  .summary-grid,
  .totals-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .count-tabs,
  .count-tabs button {
    width: 100%;
  }

  .count-tabs {
    flex-direction: column;
  }

  .counter-grid {
    grid-template-columns: 1fr;
  }

  .span-all {
    grid-column: auto;
  }

  .profile-required {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
