<template>
  <ManagementLayout :nav="isReceptionist ? receptionistNav : tourismNav">
    <h1>{{ isReceptionist ? 'Records' : 'Visitor Records' }}</h1>
    <p class="muted">Review and update visitor status records.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="panel">
      <VisitorTable :records="records" @status="updateStatus" />
    </section>
  </ManagementLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ManagementLayout from '../components/ManagementLayout.vue'
import VisitorTable from '../components/VisitorTable.vue'
import { receptionistNav, tourismNav } from './nav'
import { visitorApi } from '../services/visitorApi'

const route = useRoute()
const records = ref([])
const error = ref('')
const isReceptionist = computed(() => route.meta.sourceType === 'resort')

async function load() {
  records.value = await visitorApi.visitors({ source_type: route.meta.sourceType || 'tourism_office' })
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
