<template>
  <ManagementLayout :nav="isReceptionist ? receptionistNav : tourismNav" :subtitle="isReceptionist ? 'Desk' : 'Management System'">
    <header class="record-header">
      <p class="eyebrow">{{ isReceptionist ? 'Receptionist Desk' : 'Tourism Staff' }}</p>
      <h1>{{ isReceptionist ? 'Record Visitor' : 'Visitor Registration' }}</h1>
      <p class="muted">Encode visitor details for tourism monitoring and reporting.</p>
    </header>
    <p v-if="notice" class="notice">{{ notice }}</p>
    <RegistrationForm :source-type="sourceType" @saved="notice = 'Visitor record saved successfully.'" />
  </ManagementLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ManagementLayout from '../components/ManagementLayout.vue'
import RegistrationForm from './_RegistrationForm.vue'
import { receptionistNav, tourismNav } from './nav'

const route = useRoute()
const notice = ref('')
const isReceptionist = computed(() => route.meta.sourceType === 'resort')
const sourceType = computed(() => route.meta.sourceType || 'tourism_office')
</script>

<style scoped>
.record-header {
  margin-bottom: 1.25rem;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #166534;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
}
</style>
