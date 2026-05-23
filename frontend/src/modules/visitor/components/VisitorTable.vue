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
          <td>{{ formatSourceType(record.source_type) }}</td>
          <td>{{ record.establishment_name || 'Tourism Office' }}</td>
          <td>{{ record.purpose_of_visit || '-' }}</td>
          <td>{{ formatDate(record.visit_date) }}</td>
          <td>{{ record.number_of_visitors || record.number_of_guests || companionCount(record) }}</td>
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
  return Number(record.companions?.length || 0) + 1
}
</script>

<style scoped>
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
