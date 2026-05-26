<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsIcon from '../components/CmsIcon.vue'
import CmsQuickActionCard from '../components/CmsQuickActionCard.vue'
import CmsRecentActivity from '../components/CmsRecentActivity.vue'
import CmsStatCard from '../components/CmsStatCard.vue'
import { cmsApi } from '../services/cmsApi'
import { useCmsAuthStore } from '../stores/authStore'

const auth = useCmsAuthStore()
const isLoading = ref(true)
const error = ref('')
const dashboard = ref(null)

const quickActions = [
  {
    title: 'Content Management',
    description: 'Manage promotions, events, and public content.',
    path: '/cms/promotions',
    tone: 'indigo',
    icon: 'message',
    permissions: ['promotions.view', 'events.view'],
  },
  {
    title: 'OTOP Support',
    description: 'Review products and producer records.',
    path: '/cms/products',
    tone: 'amber',
    icon: 'package',
    permissions: ['products.view'],
  },
  {
    title: 'Business Directory',
    description: 'Maintain producer and tourism business profiles.',
    path: '/cms/businesses',
    tone: 'green',
    icon: 'building',
    permissions: ['businesses.view'],
  },
  {
    title: 'Visitor Services',
    description: 'Review inquiries and newsletter records.',
    path: '/cms/inquiries',
    tone: 'sky',
    icon: 'message',
    permissions: ['inquiries.view', 'newsletter.view'],
  },
]

const visibleQuickActions = computed(() =>
  quickActions.filter((action) => auth.hasAnyPermission(action.permissions)),
)

onMounted(loadDashboard)

async function loadDashboard() {
  isLoading.value = true
  error.value = ''
  try {
    const { data } = await cmsApi.getDashboard()
    dashboard.value = data
  } catch (err) {
    error.value = err.message || 'Unable to load CMS dashboard.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="cms-dashboard" aria-labelledby="cms-dashboard-title">
    <header class="cms-dashboard__hero">
      <div>
        <p>Tourism Office Operations</p>
        <h1 id="cms-dashboard-title">CMS Dashboard</h1>
        <span>Monitor published content, visitor queues, and staff activity in one workspace.</span>
      </div>
      <button type="button" :disabled="isLoading" @click="loadDashboard">
        <CmsIcon name="refresh" />
        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <div v-if="isLoading" class="cms-dashboard__loading" aria-live="polite" aria-busy="true">
      <div v-for="index in 4" :key="index" class="cms-dashboard__skeleton"></div>
      <div class="cms-dashboard__skeleton cms-dashboard__skeleton--wide"></div>
      <div class="cms-dashboard__skeleton cms-dashboard__skeleton--tall"></div>
    </div>

    <div v-else-if="error" class="cms-state cms-state--error" role="alert">
      <CmsIcon name="alert" />
      <strong>Dashboard could not load</strong>
      <p>{{ error }}</p>
      <button type="button" @click="loadDashboard">Try again</button>
    </div>

    <template v-else>
      <div class="cms-dashboard__stats">
        <CmsStatCard label="Total Products" :value="dashboard?.totalProducts" :detail="`${dashboard?.publishedProducts || 0} published`" tone="amber" icon="package" />
        <CmsStatCard label="Events" :value="dashboard?.totalEvents" :detail="`${dashboard?.publishedEvents || 0} published`" tone="indigo" icon="calendar" />
        <CmsStatCard label="Destinations" :value="dashboard?.totalDestinations" :detail="`${dashboard?.publishedDestinations || 0} published`" tone="green" icon="destinations" />
        <CmsStatCard label="Pending Inquiries" :value="dashboard?.pendingInquiries" detail="Visitor support queue" tone="sky" icon="message" />
      </div>

      <div class="cms-dashboard__grid">
        <section class="cms-dashboard__panel" aria-labelledby="quick-access-title">
          <div class="cms-dashboard__panel-header">
            <div>
              <h2 id="quick-access-title">Quick Access</h2>
              <p>Modules shown are based on your assigned permissions.</p>
            </div>
            <span>{{ visibleQuickActions.length }} modules</span>
          </div>

          <div v-if="visibleQuickActions.length" class="cms-dashboard__quick">
            <CmsQuickActionCard
              v-for="action in visibleQuickActions"
              :key="action.title"
              v-bind="action"
            />
          </div>

          <div v-else class="cms-dashboard__empty">
            <CmsIcon name="lock" />
            <strong>No quick actions available</strong>
            <p>Your current role does not include access to content modules yet.</p>
          </div>
        </section>

        <CmsRecentActivity :items="dashboard?.recentAuditLogs || []" />
      </div>

      <section class="cms-dashboard__overview" aria-labelledby="system-overview-title">
        <div class="cms-dashboard__panel-header">
          <div>
            <h2 id="system-overview-title">System Overview</h2>
            <p>Current operational counts from the CMS backend.</p>
          </div>
        </div>
        <div class="cms-dashboard__overview-metrics">
          <span><strong>{{ dashboard?.totalBusinesses || 0 }}</strong> businesses</span>
          <span><strong>{{ dashboard?.activeBusinesses || 0 }}</strong> active</span>
          <span><strong>{{ dashboard?.totalMuseumArtifacts || 0 }}</strong> artifacts</span>
          <span><strong>{{ dashboard?.newsletterSubscribers || 0 }}</strong> subscribers</span>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.cms-dashboard {
  display: grid;
  gap: 22px;
}

.cms-dashboard__hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  min-height: 156px;
  padding: 28px;
  color: #fff;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(8, 47, 73, 0.94), rgba(15, 118, 110, 0.9)),
    linear-gradient(135deg, #075985, #0f766e);
}

.cms-dashboard__hero p,
.cms-dashboard__hero h1 {
  margin: 0;
}

.cms-dashboard__hero p {
  font-size: 0.8rem;
  font-weight: 900;
  opacity: 0.86;
  letter-spacing: 0;
  text-transform: uppercase;
}

.cms-dashboard__hero h1 {
  margin-top: 8px;
  font-size: 2rem;
}

.cms-dashboard__hero span {
  display: block;
  max-width: 620px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.55;
}

.cms-dashboard__hero button,
.cms-state button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  color: #075985;
  background: #fff;
  font-weight: 800;
}

.cms-dashboard__hero button svg {
  width: 17px;
  height: 17px;
}

.cms-dashboard__hero button:disabled {
  opacity: 0.72;
  cursor: wait;
}

.cms-dashboard__hero button:focus-visible,
.cms-state button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.2);
  outline-offset: 2px;
}

.cms-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.cms-dashboard__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
  gap: 18px;
}

.cms-dashboard__panel,
.cms-dashboard__overview {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.cms-dashboard__panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

h2,
.cms-dashboard__panel-header p {
  margin: 0;
}

h2 {
  color: #0f172a;
  font-size: 1.08rem;
}

.cms-dashboard__panel-header p {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.86rem;
}

.cms-dashboard__panel-header > span {
  display: grid;
  min-width: 82px;
  min-height: 30px;
  place-items: center;
  color: #0f766e;
  border-radius: 999px;
  background: #ccfbf1;
  font-size: 0.82rem;
  font-weight: 900;
}

.cms-dashboard__quick {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cms-dashboard__overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.cms-dashboard__overview span {
  padding: 14px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-dashboard__overview strong {
  display: block;
  color: #0f172a;
  font-size: 1.4rem;
}

.cms-dashboard__loading {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.cms-dashboard__skeleton {
  min-height: 116px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 40%, #eef2f7 65%);
  background-size: 220% 100%;
  animation: cms-skeleton 1.1s ease-in-out infinite;
}

.cms-dashboard__skeleton--wide {
  grid-column: span 2;
  min-height: 260px;
}

.cms-dashboard__skeleton--tall {
  grid-column: span 2;
  min-height: 260px;
}

.cms-state,
.cms-dashboard__empty {
  display: grid;
  gap: 10px;
  place-items: center;
  padding: 34px;
  text-align: center;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.cms-state svg,
.cms-dashboard__empty svg {
  width: 38px;
  height: 38px;
  color: #94a3b8;
}

.cms-state strong,
.cms-dashboard__empty strong {
  color: #0f172a;
}

.cms-state p,
.cms-dashboard__empty p {
  max-width: 520px;
  margin: 0;
  line-height: 1.5;
}

.cms-state--error {
  color: #991b1b;
}

.cms-state--error svg {
  color: #dc2626;
}

@keyframes cms-skeleton {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 1100px) {
  .cms-dashboard__stats,
  .cms-dashboard__overview-metrics,
  .cms-dashboard__loading {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cms-dashboard__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cms-dashboard__hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .cms-dashboard__stats,
  .cms-dashboard__quick,
  .cms-dashboard__overview-metrics,
  .cms-dashboard__loading {
    grid-template-columns: 1fr;
  }

  .cms-dashboard__skeleton--wide,
  .cms-dashboard__skeleton--tall {
    grid-column: span 1;
  }

  .cms-dashboard__panel-header {
    flex-direction: column;
  }
}
</style>
