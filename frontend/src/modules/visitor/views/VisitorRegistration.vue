<template>
  <ManagementLayout :nav="isReceptionist ? receptionistNav : tourismNav" :subtitle="isReceptionist ? 'Desk' : 'Management System'">
    <h1>{{ isReceptionist ? 'Guest Registration' : 'Visitor Registration' }}</h1>
    <p class="muted">Register individual visitors or group registrations with companion details.</p>
    <RegistrationForm :source-type="sourceType" @saved="notice = 'Record saved successfully.'" />
    <p v-if="notice" class="notice">{{ notice }}</p>
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
