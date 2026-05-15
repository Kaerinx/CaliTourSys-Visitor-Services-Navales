<template>
  <ManagementLayout :nav="tourismNav">
    <h1>Museum Records</h1>
    <p class="muted">Museum pages use visitor records filtered by source_type = museum.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="panel">
      <VisitorTable :records="records" @status="updateStatus" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { tourismNav } from './nav'
import { visitorApi } from '../services/visitorApi'

const records = ref([])
const error = ref('')

async function load() {
  records.value = await visitorApi.visitors({ source_type: 'museum' })
}

async function updateStatus(record, status) {
  await visitorApi.updateVisitorStatus(record.id, status)
  await load()
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = err.message
  }
})
</script>
