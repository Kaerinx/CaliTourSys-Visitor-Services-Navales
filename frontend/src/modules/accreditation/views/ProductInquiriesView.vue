<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import {
  Archive,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
} from "@lucide/vue";
import {
  getProductInquiries,
  updateProductInquiryStatus,
} from "@/modules/accreditation/services/accreditationApi";
import { ensureAccreditationBackendSession } from "@/modules/accreditation/services/accreditationSession";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const inquiries = ref([]);
const selectedInquiry = ref(null);
const isLoading = ref(true);
const loadErrorMessage = ref("");
const actionErrorMessage = ref("");
const search = ref("");
const statusFilter = ref("all");
const updatingId = ref("");
const inquiryDialog = ref(null);
const lastInquiryTrigger = ref(null);

const filteredInquiries = computed(() => {
  const query = search.value.trim().toLowerCase();
  return inquiries.value.filter((inquiry) => {
    const matchesStatus =
      statusFilter.value === "all" || inquiry.status === statusFilter.value;
    const matchesSearch =
      !query ||
      [
        inquiry.productName,
        inquiry.fullName,
        inquiry.email,
        inquiry.subject,
        inquiry.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesStatus && matchesSearch;
  });
});

const newCount = computed(
  () => inquiries.value.filter((item) => item.status === "new").length,
);
const respondedCount = computed(
  () => inquiries.value.filter((item) => item.status === "responded").length,
);

function normalizeInquiry(item = {}) {
  return {
    id: item.id,
    productId: item.productId || item.product_id,
    productName: item.productName || item.product_name || "Product inquiry",
    productSlug: item.productSlug || item.product_slug,
    fullName: item.fullName || item.full_name || "Tourist",
    email: item.email || "",
    contactNumber: item.contactNumber || item.contact_number || "",
    subject:
      item.subject ||
      `Product inquiry: ${item.productName || item.product_name || "Product"}`,
    message: item.message || "",
    status: item.status || "new",
    sourcePage: item.sourcePage || item.source_page || "",
    createdAt:
      item.createdAt || item.created_at || item.receivedAt || item.received_at,
  };
}

async function loadInquiries() {
  isLoading.value = true;
  loadErrorMessage.value = "";
  actionErrorMessage.value = "";
  try {
    const isConnected = await ensureAccreditationBackendSession(auth);
    if (!isConnected) {
      throw new Error(
        "The demo account could not connect to live inquiry data. Please try again.",
      );
    }
    const result = await getProductInquiries();
    const items = Array.isArray(result)
      ? result
      : result.inquiries || result.items || [];
    inquiries.value = items.map(normalizeInquiry);
    if (selectedInquiry.value) {
      selectedInquiry.value =
        inquiries.value.find((item) => item.id === selectedInquiry.value.id) ||
        null;
    }
  } catch (error) {
    loadErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "Unable to load product inquiries.";
  } finally {
    isLoading.value = false;
  }
}

async function openInquiry(inquiry, trigger) {
  lastInquiryTrigger.value = trigger || null;
  selectedInquiry.value = inquiry;
  await nextTick();
  inquiryDialog.value?.focus();
  if (inquiry.status === "new") await setStatus(inquiry, "read");
}

async function closeInquiry() {
  selectedInquiry.value = null;
  actionErrorMessage.value = "";
  await nextTick();
  lastInquiryTrigger.value?.focus();
}

function handleInquiryDialogKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeInquiry();
    return;
  }

  if (event.key !== "Tab") return;
  const focusable = Array.from(
    inquiryDialog.value?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [],
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === inquiryDialog.value)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function setStatus(inquiry, status) {
  updatingId.value = inquiry.id;
  actionErrorMessage.value = "";
  try {
    const result = await updateProductInquiryStatus(inquiry.id, status);
    const updated = normalizeInquiry(result.inquiry || { ...inquiry, status });
    const index = inquiries.value.findIndex((item) => item.id === inquiry.id);
    if (index >= 0)
      inquiries.value[index] = {
        ...inquiries.value[index],
        ...updated,
        status,
      };
    if (selectedInquiry.value?.id === inquiry.id) {
      selectedInquiry.value = inquiries.value[index] || { ...inquiry, status };
    }
  } catch (error) {
    actionErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "Unable to update this inquiry.";
  } finally {
    updatingId.value = "";
  }
}

function replyLink(inquiry) {
  const inquirySubject = inquiry.subject.replace(/[\r\n]+/g, " ").trim();
  const subject = inquirySubject.toLowerCase().startsWith("re:")
    ? inquirySubject
    : `Re: ${inquirySubject}`;
  const ownerName = [auth.user?.firstName, auth.user?.lastName]
    .filter(Boolean)
    .join(" ");
  const body = [
    `Hello ${inquiry.fullName},`,
    "",
    `Thank you for your inquiry about ${inquiry.productName}.`,
    "",
    "",
    "Kind regards,",
    ownerName || "Business Owner",
  ].join("\r\n");
  return `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function prepareReply(inquiry) {
  if (inquiry.status === "new") await setStatus(inquiry, "read");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(value) {
  return (
    { new: "New", read: "Read", responded: "Responded", archived: "Archived" }[
      value
    ] || value
  );
}

onMounted(loadInquiries);
</script>

<template>
  <section class="page owner-inquiries-page">
    <div class="page-header">
      <div>
        <h1>Product Inquiries</h1>
        <p>
          Messages tourists send from your public product pages appear here.
        </p>
      </div>
      <button
        class="btn outline"
        type="button"
        :disabled="isLoading"
        @click="loadInquiries"
      >
        <RefreshCw :size="17" :class="{ spinning: isLoading }" />
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="card inquiry-empty" role="status">
      Loading product inquiries...
    </div>

    <div v-else-if="loadErrorMessage" class="inquiry-alert" role="alert">
      <span>{{ loadErrorMessage }}</span>
      <button type="button" @click="loadInquiries">Try again</button>
    </div>

    <template v-else>
      <div class="inquiry-stats">
        <article class="card">
          <span>All inquiries</span><strong>{{ inquiries.length }}</strong>
        </article>
        <article class="card">
          <span>New messages</span><strong>{{ newCount }}</strong>
        </article>
        <article class="card">
          <span>Responded</span><strong>{{ respondedCount }}</strong>
        </article>
      </div>

      <section class="card inquiry-workspace">
        <div class="inquiry-toolbar">
          <label class="inquiry-search"
            ><Search :size="17" /><input
              v-model="search"
              aria-label="Search product inquiries"
              placeholder="Search product, tourist, or message..."
          /></label>
          <select v-model="statusFilter" aria-label="Filter inquiry status">
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div v-if="!filteredInquiries.length" class="inquiry-empty">
          <MessageSquareText :size="38" />
          <h2>
            {{
              inquiries.length
                ? "No inquiries match your filters"
                : "No product inquiries yet"
            }}
          </h2>
          <p>
            When a tourist uses Contact producer on one of your products, their
            message will appear here.
          </p>
        </div>
        <div v-else class="inquiry-list">
          <button
            v-for="inquiry in filteredInquiries"
            :key="inquiry.id"
            type="button"
            class="inquiry-row"
            :class="{ unread: inquiry.status === 'new' }"
            @click="openInquiry(inquiry, $event.currentTarget)"
          >
            <span class="inquiry-avatar">{{
              inquiry.fullName.charAt(0).toUpperCase()
            }}</span>
            <span class="inquiry-summary">
              <span
                ><strong>{{ inquiry.fullName }}</strong
                ><small :class="`status-${inquiry.status}`">{{
                  statusLabel(inquiry.status)
                }}</small></span
              >
              <strong>{{ inquiry.productName }}</strong>
              <span>{{ inquiry.message }}</span>
            </span>
            <time>{{ formatDate(inquiry.createdAt) }}</time>
          </button>
        </div>
      </section>
    </template>

    <div
      v-if="!isLoading && !loadErrorMessage && selectedInquiry"
      class="inquiry-modal"
      @click.self="closeInquiry"
    >
      <article
        ref="inquiryDialog"
        class="inquiry-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        tabindex="-1"
        @keydown="handleInquiryDialogKeydown"
      >
        <header>
          <div>
            <span>Product inquiry</span>
            <h2 id="inquiry-title">{{ selectedInquiry.productName }}</h2>
          </div>
          <button
            type="button"
            aria-label="Close inquiry"
            @click="closeInquiry"
          >
            ×
          </button>
        </header>
        <div class="inquiry-detail">
          <dl>
            <div>
              <dt>From</dt>
              <dd>{{ selectedInquiry.fullName }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a :href="`mailto:${selectedInquiry.email}`">{{
                  selectedInquiry.email
                }}</a>
              </dd>
            </div>
            <div v-if="selectedInquiry.contactNumber">
              <dt>Contact</dt>
              <dd>{{ selectedInquiry.contactNumber }}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{{ formatDate(selectedInquiry.createdAt) }}</dd>
            </div>
          </dl>
          <div class="inquiry-subject">
            <span>Subject</span><strong>{{ selectedInquiry.subject }}</strong>
          </div>
          <div class="inquiry-message">
            <span>Message</span>
            <p>{{ selectedInquiry.message }}</p>
          </div>
          <p class="email-note">
            Reply opens your email app with the tourist's address, subject, and
            a prepared greeting.
          </p>
          <p
            v-if="actionErrorMessage"
            class="inquiry-action-error"
            role="alert"
          >
            {{ actionErrorMessage }}
          </p>
        </div>
        <footer>
          <button
            type="button"
            class="archive-button"
            :disabled="updatingId === selectedInquiry.id"
            @click="setStatus(selectedInquiry, 'archived')"
          >
            <Archive :size="17" /> Archive
          </button>
          <button
            v-if="selectedInquiry.status !== 'responded'"
            type="button"
            class="responded-button"
            :disabled="updatingId === selectedInquiry.id"
            @click="setStatus(selectedInquiry, 'responded')"
          >
            Mark responded
          </button>
          <a
            class="reply-button"
            :href="replyLink(selectedInquiry)"
            @click="prepareReply(selectedInquiry)"
            ><Mail :size="17" /> Reply via email</a
          >
        </footer>
      </article>
    </div>
  </section>
</template>

<style scoped>
.owner-inquiries-page {
  display: grid;
  gap: 24px;
}
.page-header .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.spinning {
  animation: spin 0.8s linear infinite;
}
.inquiry-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.inquiry-stats article {
  display: grid;
  gap: 7px;
}
.inquiry-stats span {
  color: #64748b;
  font-size: 13px;
}
.inquiry-stats strong {
  font-size: 30px;
}
.inquiry-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 18px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff7f7;
  color: #991b1b;
}
.inquiry-alert button {
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: 700;
  cursor: pointer;
}
.inquiry-workspace {
  overflow: hidden;
  padding: 0;
}
.inquiry-toolbar {
  display: flex;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid #e8ecea;
}
.inquiry-search {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border: 1px solid #d9e1dd;
  border-radius: 9px;
  color: #64748b;
}
.inquiry-search input {
  width: 100%;
  height: 42px;
  border: 0;
  outline: 0;
  background: transparent;
}
.inquiry-search:focus-within {
  border-color: var(--color-gov-blue-light);
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.22);
}
.inquiry-toolbar select {
  min-width: 150px;
  padding: 0 12px;
  border: 1px solid #d9e1dd;
  border-radius: 9px;
  background: #fff;
}
.inquiry-list {
  display: grid;
}
.inquiry-row {
  width: 100%;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 150px;
  gap: 14px;
  align-items: start;
  padding: 18px 22px;
  border: 0;
  border-bottom: 1px solid #edf0ee;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.inquiry-row:hover {
  background: #f8fbf9;
}
.inquiry-row.unread {
  background: #f2faf6;
}
.inquiry-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #dcefe5;
  color: #245844;
  font-weight: 800;
}
.inquiry-summary {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.inquiry-summary > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}
.inquiry-summary > strong {
  font-size: 13px;
}
.inquiry-summary > span:last-child {
  overflow: hidden;
  color: #64748b;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inquiry-summary small {
  padding: 2px 7px;
  border-radius: 999px;
  background: #eef2f0;
  color: #4b5563;
  font-size: 10px;
  text-transform: uppercase;
}
.inquiry-summary .status-new {
  background: #dcfce7;
  color: #166534;
}
.inquiry-summary .status-responded {
  background: #dbeafe;
  color: #1d4ed8;
}
.inquiry-summary .status-archived {
  background: #f1f5f9;
  color: #64748b;
}
.inquiry-row time {
  color: #64748b;
  font-size: 11px;
  text-align: right;
}
.inquiry-empty {
  display: grid;
  justify-items: center;
  padding: 64px 24px;
  color: #64748b;
  text-align: center;
}
.inquiry-empty h2 {
  margin: 14px 0 5px;
  color: #1f2937;
}
.inquiry-empty p {
  max-width: 560px;
  margin: 0;
}
.inquiry-modal {
  position: fixed;
  z-index: 120;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.58);
}
.inquiry-panel {
  width: min(100%, 680px);
  max-height: calc(100vh - 48px);
  overflow: auto;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
}
.inquiry-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
  border-bottom: 1px solid #e8ecea;
}
.inquiry-panel header span,
.inquiry-detail span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.inquiry-panel header h2 {
  margin: 3px 0 0;
  font-size: 22px;
}
.inquiry-panel header button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f3;
  font-size: 24px;
  cursor: pointer;
}
.inquiry-detail {
  display: grid;
  gap: 20px;
  padding: 24px;
}
.inquiry-detail dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}
.inquiry-detail dl div {
  padding: 12px;
  border-radius: 9px;
  background: #f7f9f8;
}
.inquiry-detail dt {
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
}
.inquiry-detail dd {
  margin: 4px 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.inquiry-detail dd a {
  color: #246149;
}
.inquiry-subject,
.inquiry-message {
  display: grid;
  gap: 7px;
}
.inquiry-message p {
  margin: 0;
  padding: 16px;
  border: 1px solid #e3e9e6;
  border-radius: 10px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.email-note {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}
.inquiry-action-error {
  margin: 0;
  padding: 11px 13px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff7f7;
  color: #991b1b;
  font-size: 13px;
}
.inquiry-panel footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px;
  border-top: 1px solid #e8ecea;
}
.inquiry-panel footer button,
.reply-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 15px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.archive-button {
  margin-right: auto;
  border: 1px solid #d9e1dd;
  background: #fff;
  color: #4b5563;
}
.responded-button {
  border: 1px solid #aacdbc;
  background: #eef8f3;
  color: #245844;
}
.reply-button {
  border: 1px solid #245844;
  background: #245844;
  color: #fff;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 700px) {
  .inquiry-stats {
    grid-template-columns: 1fr;
  }
  .inquiry-toolbar {
    display: grid;
  }
  .inquiry-toolbar select {
    min-height: 42px;
  }
  .inquiry-row {
    grid-template-columns: 42px minmax(0, 1fr);
  }
  .inquiry-row time {
    grid-column: 2;
    text-align: left;
  }
  .inquiry-detail dl {
    grid-template-columns: 1fr;
  }
  .inquiry-panel footer {
    flex-wrap: wrap;
  }
  .archive-button {
    margin-right: 0;
  }
}
</style>
