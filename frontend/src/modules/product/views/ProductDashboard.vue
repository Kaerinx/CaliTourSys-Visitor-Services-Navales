<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import ModuleStats from '@/modules/product/components/ModuleStats.vue'
import { useProductAccess } from '@/modules/product/composables/useProductAccess'
import { getProductModuleStatus, getProductReportSummary } from '@/modules/product/services/productApi'

const auth = useProductAccess()
const route = useRoute()
const moduleStatus = ref(null)
const reportSummary = ref(null)
const statusError = ref('')
const reportError = ref('')

const productBasePath = computed(() => (route.path.startsWith('/cms') ? '/cms/product-development' : '/product'))

const reportCards = computed(() => {
  const reports = reportSummary.value

  if (!reports) {
    return []
  }

  return [
    { label: 'Tourism assets', value: reports.assets.total },
    { label: 'Active plans', value: reports.developmentPlans.active },
    { label: 'Average progress', value: `${reports.improvements.averageProgress}%` },
    { label: 'Ready packages', value: reports.packages.readyForPromotion },
  ]
})

const workflowCards = computed(() => {
  const reports = reportSummary.value

  return [
    {
      title: 'Assets',
      path: `${productBasePath.value}/assets`,
      count: reports?.assets.total ?? 0,
      helper: `${reports?.assets.active ?? 0} active, ${reports?.assets.archived ?? 0} archived`,
      description: 'Maintain tourism sites, attractions, and local resources before planning work starts.',
    },
    {
      title: 'Plans',
      path: `${productBasePath.value}/development-plans`,
      count: reports?.developmentPlans.total ?? 0,
      helper: `${reports?.developmentPlans.active ?? 0} active plans`,
      description: 'Turn selected assets into objectives, timelines, needs, and assigned work.',
    },
    {
      title: 'Improvements',
      path: `${productBasePath.value}/improvements`,
      count: reports?.improvements.total ?? 0,
      helper: `${reports?.improvements.delayed ?? 0} delayed, ${reports?.improvements.completed ?? 0} completed`,
      description: 'Track progress updates so development work is visible before packaging.',
    },
    {
      title: 'Activities',
      path: `${productBasePath.value}/activities`,
      count: reports?.activities.total ?? 0,
      helper: `${reports?.activities.active ?? 0} active activities`,
      description: 'Design visitor activities linked to active assets and optional development plans.',
    },
    {
      title: 'Packages',
      path: `${productBasePath.value}/packages`,
      count: reports?.packages.total ?? 0,
      helper: `${reports?.packages.readyForPromotion ?? 0} ready for promotion`,
      description: 'Combine assets and activities, then review complete packages for public handoff.',
    },
  ]
})

const quickActions = computed(() => [
  { label: 'Create asset', path: `${productBasePath.value}/assets` },
  { label: 'Create plan', path: `${productBasePath.value}/development-plans` },
  { label: 'Review packages', path: `${productBasePath.value}/packages` },
])

const packageStatusSummary = computed(() => reportSummary.value?.packages.byStatus || [])
const planStatusSummary = computed(() => reportSummary.value?.developmentPlans.byStatus || [])

onMounted(async () => {
  try {
    const [statusResponse, reportResponse] = await Promise.all([
      getProductModuleStatus(),
      getProductReportSummary(),
    ])

    moduleStatus.value = statusResponse.data
    reportSummary.value = reportResponse.data
  } catch (error) {
    statusError.value = error.message
    reportError.value = error.message
  }
})
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Product Module</p>
      <h1>Tourism Product Development Program</h1>
      <p>
        Manage tourism assets, development plans, improvement updates, activity records, and package
        records through readiness review, reporting, and promotion handoff preparation.
      </p>
    </div>

    <div class="role-notice" :class="{ readonly: auth.isViewOnly }">
      <strong>{{ auth.user?.role }}</strong>
      <span v-if="auth.isViewOnly">
        LGU Officials have view-only access for reports, summaries, and development status.
      </span>
      <span v-else>
        Your role can work with assets, development plans, improvements, activities, and packages
        according to the assigned permissions.
      </span>
    </div>

    <ModuleStats v-if="reportCards.length" :items="reportCards" />
    <p v-else-if="reportError" class="form-error">{{ reportError }}</p>

    <div class="dashboard-actions">
      <RouterLink v-for="action in quickActions" :key="action.label" :to="action.path">
        {{ action.label }}
      </RouterLink>
    </div>

    <div class="workflow-grid">
      <RouterLink v-for="card in workflowCards" :key="card.title" class="workflow-card" :to="card.path">
        <span>{{ card.helper }}</span>
        <strong>{{ card.count }}</strong>
        <h2>{{ card.title }}</h2>
        <p>{{ card.description }}</p>
      </RouterLink>
    </div>

    <section v-if="reportSummary" class="module-contract report-panel">
      <div>
        <h2>Module report summary</h2>
        <p>
          Current records are organized for package readiness review, status monitoring, and future
          handoff to the Promotion and Marketing module.
        </p>
      </div>

      <div class="report-groups">
        <section>
          <h3>Packages by status</h3>
          <span v-for="item in packageStatusSummary" :key="item.status">
            {{ item.status }}: {{ item.count }}
          </span>
        </section>
        <section>
          <h3>Plans by status</h3>
          <span v-for="item in planStatusSummary" :key="item.status">
            {{ item.status }}: {{ item.count }}
          </span>
        </section>
      </div>
    </section>

    <section class="module-contract">
      <div>
        <h2>Future consolidation contract</h2>
        <p>
          This module will stay standalone for now, but it prepares shared role names, status
          values, and API group naming for eventual integration with the group system.
        </p>
      </div>

      <div v-if="moduleStatus" class="contract-list">
        <h3>Planned API groups</h3>
        <span v-for="apiGroup in moduleStatus.plannedApiGroups" :key="apiGroup">
          {{ apiGroup }}
        </span>
      </div>

      <p v-else-if="statusError" class="form-error">{{ statusError }}</p>
    </section>
  </section>
</template>

<style scoped>
.dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 20px;
}

.dashboard-actions a {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 0 16px;
  background: var(--color-primary);
  color: white;
  font-weight: 900;
  text-decoration: none;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.workflow-card {
  display: grid;
  min-height: 220px;
  align-content: start;
  border: 1px solid var(--color-line);
  border-radius: 16px;
  padding: 18px;
  background: var(--color-panel);
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-soft);
}

.workflow-card:hover {
  border-color: var(--color-primary);
}

.workflow-card span {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.workflow-card strong {
  margin-top: 18px;
  font-size: 36px;
  line-height: 1;
}

.workflow-card h2 {
  margin: 12px 0 0;
  font-size: 20px;
}

.workflow-card p {
  margin: 10px 0 0;
  color: var(--color-muted);
  line-height: 1.55;
}

.report-panel {
  align-items: flex-start;
}

.report-groups {
  display: grid;
  gap: 16px;
  min-width: min(100%, 420px);
}

.report-groups section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.report-groups h3 {
  width: 100%;
  margin-bottom: 0;
}

.report-groups span {
  border-radius: 999px;
  padding: 8px 10px;
  background: #edf4f8;
  color: #245a8d;
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 1200px) {
  .workflow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard-actions,
  .dashboard-actions a {
    width: 100%;
  }

  .workflow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
