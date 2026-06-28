<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Visitor Name</th>
          <th>Visitor Type</th>
          <th>Nationality</th>
          <th>Source</th>
          <th>Establishment</th>
          <th>Visit Purpose</th>
          <th>Visit Date</th>
          <th>No. of Visitors</th>
          <th>Record Status</th>
          <th>Recorded By</th>
          <th>Date Recorded</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.full_name }}</td>
          <td><span class="type-pill" :class="record.visitor_type">{{ formatVisitorType(record.visitor_type) }}</span></td>
          <td>{{ record.nationality || '-' }}</td>
          <td>{{ sourceLabel(record) }}</td>
          <td>{{ record.establishment_name || 'Tourism Office' }}</td>
          <td>{{ record.purpose_of_visit || '-' }}</td>
          <td>{{ formatDate(record.visit_date) }}</td>
          <td>{{ visitorCount(record) }}</td>
          <td><span class="status-pill record-status" :class="recordStatusClass(record.status)">{{ recordStatus(record.status) }}</span></td>
          <td>{{ record.recorded_by_name || record.encoded_by || '-' }}</td>
          <td>{{ formatDate(record.created_at) }}</td>
        </tr>
        <tr v-if="!records.length">
          <td colspan="11">No records found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { formatDate, formatSourceType, formatVisitorType } from '../utils/format'

defineProps({
  records: { type: Array, default: () => [] },
  showActions: { type: Boolean, default: false },
})

function recordStatus(status) {
  if (status === 'archived' || status === 'cancelled') return 'Archived'
  if (status === 'verified') return 'Verified'
  if (status === 'pending_review') return 'Pending Review'
  return 'Recorded'
}

function recordStatusClass(status) {
  if (status === 'archived' || status === 'cancelled') return 'archived'
  if (status === 'verified') return 'verified'
  if (status === 'pending_review') return 'pending-review'
  return 'recorded'
}

function companionCount(record) {
  return Number(record.companion_count ?? record.companions?.length ?? 0) + 1
}

function visitorCount(record) {
  return Number(record.number_of_visitors || record.number_of_guests || 0) || companionCount(record)
}

function sourceLabel(record) {
  return formatSourceType(record.source_type || record.establishment_type)
}
</script>

<style scoped>
.table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

table {
  min-width: 1280px;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

td {
  color: #0f172a;
  font-size: 0.92rem;
}

.type-pill.local {
  background: #e0f2fe;
  color: #0369a1;
}

.record-status {
  background: #dcfce7;
  color: #166534;
}

.record-status.verified {
  background: #020617;
  color: #fff;
}

.record-status.pending-review {
  background: #fef3c7;
  color: #92400e;
}

.record-status.archived {
  background: #e5e7eb;
  color: #475569;
}

tbody tr:hover {
  background: #f8fafc;
}
</style>
