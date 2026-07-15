<template>
  <ManagementLayout>
    <header class="page-heading">
      <span class="eyebrow">Tourism Staff</span>
      <h1>Inquiries</h1>
      <p>View submitted public inquiries and track review status.</p>
    </header>

    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <section class="panel filter-card">
      <div class="section-header">
        <div>
          <h2>Search and Filter Inquiries</h2>
          <p>Filter public inquiries by visitor, keyword, date, or review status.</p>
        </div>
      </div>

      <form class="filter-grid" @submit.prevent="applyFilters">
        <div class="field search-field">
          <label>Search</label>
          <input v-model="draftFilters.search" type="search" placeholder="Search by name, email, subject, or keyword" />
        </div>
        <div class="field">
          <label>Date From</label>
          <input v-model="draftFilters.date_from" type="date" />
        </div>
        <div class="field">
          <label>Date To</label>
          <input v-model="draftFilters.date_to" type="date" />
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="draftFilters.status">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="reset-button" type="button" @click="resetFilters">Reset Filters</button>
          <button class="apply-button" type="submit">Apply Filters</button>
        </div>
      </form>
    </section>

    <section class="panel table-wrap">
      <div class="section-header">
        <div>
          <h2>Inquiry Records</h2>
          <p>Status updates are tracked here while responses are handled via email.</p>
        </div>
        <span class="record-count">Showing {{ filteredInquiries.length }} of {{ inquiries.length }} inquiries</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Contact Number</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Source</th>
            <th>Date Submitted</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inquiry in filteredInquiries" :key="inquiry.id">
            <td>{{ inquiry.full_name }}</td>
            <td>{{ inquiry.email }}</td>
            <td>{{ inquiry.contact_number || '-' }}</td>
            <td>{{ inquiry.subject }}</td>
            <td class="message-cell">{{ inquiry.message }}</td>
            <td>{{ formatSourcePage(inquiry.source_page) }}</td>
            <td>{{ formatDate(inquiry.created_at || inquiry.inquiry_date) }}</td>
            <td>
              <div class="status-editor">
                <button
                  class="status-chip"
                  :class="statusClass(displayStatus(inquiry))"
                  type="button"
                  :aria-label="`Change status from ${formatInquiryStatus(displayStatus(inquiry))}`"
                  @click="advanceStatus(inquiry)"
                >
                  {{ formatInquiryStatus(displayStatus(inquiry)) }}
                </button>
                <button
                  class="btn compact"
                  type="button"
                  :disabled="saving[inquiry.id] || !hasPendingChange(inquiry)"
                  @click="saveStatus(inquiry)"
                >
                  {{ saving[inquiry.id] ? 'Saving...' : 'Save Status' }}
                </button>
              </div>
              <span v-if="hasPendingChange(inquiry)" class="status-note">Unsaved change</span>
            </td>
          </tr>
          <tr v-if="!filteredInquiries.length"><td colspan="8">No inquiries found.</td></tr>
        </tbody>
      </table>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import { visitorApi } from '../services/visitorApi'
import { formatDate } from '../utils/format'

function defaultFilters() {
  return { search: '', date_from: '', date_to: '', status: '' }
}

const inquiries = ref([])
const error = ref('')
const success = ref('')
const saving = ref({})
const pendingStatuses = ref({})
const draftFilters = reactive(defaultFilters())
const appliedFilters = reactive(defaultFilters())
const filteredInquiries = computed(() => {
  const keyword = appliedFilters.search.trim().toLowerCase()
  return inquiries.value.filter((inquiry) => {
    const haystack = [
      inquiry.full_name,
      inquiry.email,
      inquiry.contact_number,
      inquiry.subject,
      inquiry.message,
      inquiry.source_page,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const submittedDate = String(inquiry.created_at || inquiry.inquiry_date || '').slice(0, 10)

    if (keyword && !haystack.includes(keyword)) return false
    if (appliedFilters.date_from && submittedDate < appliedFilters.date_from) return false
    if (appliedFilters.date_to && submittedDate > appliedFilters.date_to) return false
    if (appliedFilters.status && normalizeStatus(inquiry.status) !== appliedFilters.status) return false
    return true
  })
})

async function load() {
  inquiries.value = await visitorApi.inquiries()
  pendingStatuses.value = {}
}

async function saveStatus(inquiry) {
  const status = displayStatus(inquiry)
  error.value = ''
  success.value = ''
  saving.value = { ...saving.value, [inquiry.id]: true }
  try {
    await visitorApi.updateInquiryStatus(inquiry.id, status)
    inquiry.status = status
    const nextPending = { ...pendingStatuses.value }
    delete nextPending[inquiry.id]
    pendingStatuses.value = nextPending
    success.value = 'Inquiry status saved successfully.'
  } catch (err) {
    error.value = err.message || 'Unable to save inquiry status.'
  } finally {
    saving.value = { ...saving.value, [inquiry.id]: false }
  }
}

function normalizeStatus(status) {
  const value = String(status || 'new').toLowerCase()
  if (['new', 'read', 'responded', 'archived'].includes(value)) return value
  if (value === 'pending') return 'new'
  if (value === 'reviewed') return 'read'
  return 'new'
}

function displayStatus(inquiry) {
  return normalizeStatus(pendingStatuses.value[inquiry.id] || inquiry.status)
}

function hasPendingChange(inquiry) {
  return Boolean(pendingStatuses.value[inquiry.id]) && displayStatus(inquiry) !== normalizeStatus(inquiry.status)
}

function advanceStatus(inquiry) {
  const current = displayStatus(inquiry)
  if (current === 'responded' || current === 'archived') return
  pendingStatuses.value = {
    ...pendingStatuses.value,
    [inquiry.id]: current === 'new' ? 'read' : 'responded',
  }
  error.value = ''
  success.value = ''
}

function applyFilters() {
  Object.assign(appliedFilters, draftFilters)
}

function resetFilters() {
  Object.assign(draftFilters, defaultFilters())
  Object.assign(appliedFilters, defaultFilters())
}

function formatInquiryStatus(status) {
  return {
    new: 'New',
    read: 'Read',
    responded: 'Responded',
    archived: 'Archived',
  }[normalizeStatus(status)]
}

function formatSourcePage(sourcePage) {
  if (!sourcePage) return 'Public website'
  if (sourcePage === '/promotion/inquiry') return 'Public inquiry page'
  return sourcePage
}

function statusClass(status) {
  return `status-${normalizeStatus(status)}`
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<style scoped>
.page-heading {
  margin-bottom: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 0.45rem;
  color: #166534;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0 0 0.35rem;
}

.page-heading p,
.section-header p {
  margin: 0;
  color: #475569;
  font-weight: 400;
}

.filter-card {
  border-top: 3px solid #166534;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.section-header h2 {
  margin: 0 0 0.25rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(150px, 1fr)) auto;
  gap: 1rem;
  align-items: end;
}

.filter-grid :deep(input),
.filter-grid :deep(select) {
  min-height: 44px;
  font-weight: 400;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.apply-button,
.reset-button {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 1rem;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.apply-button {
  border: 0;
  background: #020617;
  color: #fff;
}

.apply-button:hover {
  background: #0f3625;
}

.reset-button {
  border: 1px solid #bbf7d0;
  background: #fff;
  color: #166534;
}

.reset-button:hover {
  background: #dcfce7;
}

.record-count {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 0 0.8rem;
  background: #dcfce7;
  color: #166534;
  font-size: 0.85rem;
  font-weight: 800;
  white-space: nowrap;
}

.message-cell {
  max-width: 420px;
  white-space: normal;
  line-height: 1.45;
}

.status-editor {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-chip {
  min-width: 104px;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.status-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.status-new {
  background: #fef3c7;
  border-color: #fde68a;
  color: #92400e;
}

.status-read {
  background: #e0f2fe;
  border-color: #bae6fd;
  color: #075985;
}

.status-responded {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.status-archived {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.btn.compact {
  width: auto;
  min-width: 104px;
  padding: 0.55rem 0.9rem;
}

.btn.compact:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.status-note {
  display: inline-block;
  width: 100%;
  margin-top: 0.2rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #92400e;
  font-size: 0.82rem;
  font-weight: 700;
}

.success {
  color: #166534;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .section-header,
  .filter-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
