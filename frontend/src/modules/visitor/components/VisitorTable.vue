<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Source</th>
          <th>Establishment</th>
          <th>Visit Date</th>
          <th>Status</th>
          <th v-if="showActions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.full_name }}</td>
          <td><span class="type-pill" :class="record.visitor_type">{{ formatVisitorType(record.visitor_type) }}</span></td>
          <td>{{ formatSourceType(record.source_type) }}</td>
          <td>{{ record.establishment_name || 'Tourism Office' }}</td>
          <td>{{ formatDate(record.visit_date) }}</td>
          <td><span class="status-pill" :class="{ dark: record.status !== 'pending' }">{{ formatStatus(record.status) }}</span></td>
          <td v-if="showActions">
            <div class="actions">
              <button class="btn ghost" type="button" @click="$emit('status', record, 'checked_in')">Check-in</button>
              <button class="btn ghost" type="button" @click="$emit('status', record, 'checked_out')">Check-out</button>
            </div>
          </td>
        </tr>
        <tr v-if="!records.length">
          <td :colspan="showActions ? 7 : 6">No records found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { formatDate, formatSourceType, formatStatus, formatVisitorType } from '../utils/format'

defineProps({
  records: { type: Array, default: () => [] },
  showActions: { type: Boolean, default: true },
})

defineEmits(['status'])
</script>
