<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccreditationRecords from '@/modules/accreditation/views/AccreditationRecords.vue'
import ApplicationReview from '@/modules/accreditation/views/ApplicationReview.vue'
import DashboardRouter from '@/modules/accreditation/views/DashboardRouter.vue'
import ReportsPage from '@/modules/accreditation/views/ReportsPage.vue'
import StaffApplications from '@/modules/accreditation/views/StaffApplications.vue'
import { useAuthStore as useAccreditationAuthStore } from '@/stores/authStore'
import { cmsContentApi } from '../../services/cmsContentApi'

const route = useRoute()
const router = useRouter()
const accreditationAuth = useAccreditationAuthStore()
const isPreparingSession = ref(false)
const sessionError = ref('')

const tabs = [
  { label: 'Dashboard', path: '/cms/businesses' },
  { label: 'Applications', path: '/cms/businesses/applications' },
  { label: 'Records', path: '/cms/businesses/records' },
  { label: 'Reports', path: '/cms/businesses/reports' },
]

const activeView = computed(() => {
  if (route.path.endsWith('/applications')) return StaffApplications
  if (route.path.endsWith('/records')) return AccreditationRecords
  if (route.path.endsWith('/reports')) return ReportsPage
  if (route.path.endsWith('/review')) return ApplicationReview
  return DashboardRouter
})

onMounted(prepareAccreditationSession)

async function prepareAccreditationSession() {
  isPreparingSession.value = true
  sessionError.value = ''
  try {
    const { data } = await cmsContentApi.getAccreditationSession()
    accreditationAuth.setSession(data.token, data.user)
  } catch (error) {
    sessionError.value = error?.message || 'Unable to open the Business Accreditation portal.'
  } finally {
    isPreparingSession.value = false
  }
}

function isActive(tab) {
  if (tab.path === '/cms/businesses') return route.path === tab.path
  return route.path.startsWith(tab.path)
}

function goTo(tab) {
  router.push(tab.path)
}
</script>

<template>
  <section class="cms-content-page cms-accreditation-page" aria-labelledby="cms-businesses-title">
    <header class="cms-content-page__header">
      <div>
        <p>Business Accreditation</p>
        <h1 id="cms-businesses-title">Tourism Staff / Officer Portal</h1>
        <span>The Business Accreditation application is loaded inside the CMS workspace with the same staff review, records, and reporting workflow.</span>
      </div>
    </header>

    <nav class="cms-content-page__tabs" aria-label="Business accreditation sections">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        type="button"
        :aria-current="isActive(tab) ? 'page' : undefined"
        @click="goTo(tab)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div v-if="isPreparingSession" class="cms-accreditation-page__state">
      Opening Business Accreditation portal...
    </div>
    <div v-else-if="sessionError" class="cms-accreditation-page__error" role="alert">
      {{ sessionError }}
    </div>
    <div v-else class="cms-accreditation-page__app">
      <component :is="activeView" />
    </div>
  </section>
</template>

<style scoped>
@import './cms-content-page.css';

.cms-content-page__tabs button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  color: #475569;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font-weight: 800;
  cursor: pointer;
}

.cms-content-page__tabs button:hover,
.cms-content-page__tabs button:focus-visible,
.cms-content-page__tabs button[aria-current='page'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
  outline: none;
}

.cms-accreditation-page__state,
.cms-accreditation-page__error {
  padding: 16px;
  border-radius: 8px;
  font-weight: 800;
}

.cms-accreditation-page__state {
  color: #075985;
  border: 1px solid #bae6fd;
  background: #f0f9ff;
}

.cms-accreditation-page__error {
  color: #991b1b;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.cms-accreditation-page__app {
  min-width: 0;
}
</style>
