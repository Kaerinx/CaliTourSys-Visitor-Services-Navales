<script setup>
import { onMounted, ref } from 'vue'
import CmsQuickActionCard from '../components/CmsQuickActionCard.vue'
import CmsRecentActivity from '../components/CmsRecentActivity.vue'
import CmsStatCard from '../components/CmsStatCard.vue'
import { cmsApi } from '../services/cmsApi'

const isLoading = ref(true)
const error = ref('')
const dashboard = ref(null)

const quickActions = [
  { title: 'Content Management', description: 'Manage promotions, events, and public content.', path: '/cms/promotions', tone: 'indigo' },
  { title: 'OTOP Support', description: 'Review products and producer records.', path: '/cms/products', tone: 'amber' },
  { title: 'Business Directory', description: 'Maintain producer and tourism business profiles.', path: '/cms/businesses', tone: 'green' },
  { title: 'Visitor Services', description: 'Review inquiries and newsletter records.', path: '/cms/inquiries', tone: 'sky' },
]

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
      </div>
      <button type="button" :disabled="isLoading" @click="loadDashboard">
        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <div v-if="isLoading" class="cms-state">Loading dashboard...</div>
    <div v-else-if="error" class="cms-state cms-state--error" role="alert">
      {{ error }}
      <button type="button" @click="loadDashboard">Try again</button>
    </div>

    <template v-else>
      <div class="cms-dashboard__stats">
        <CmsStatCard label="Total Products" :value="dashboard?.totalProducts" :detail="`${dashboard?.publishedProducts || 0} published`" tone="amber" />
        <CmsStatCard label="Events" :value="dashboard?.totalEvents" :detail="`${dashboard?.publishedEvents || 0} published`" tone="indigo" />
        <CmsStatCard label="Destinations" :value="dashboard?.totalDestinations" :detail="`${dashboard?.publishedDestinations || 0} published`" tone="green" />
        <CmsStatCard label="Pending Inquiries" :value="dashboard?.pendingInquiries" detail="Visitor support queue" tone="sky" />
      </div>

      <div class="cms-dashboard__grid">
        <section class="cms-dashboard__panel">
          <div class="cms-dashboard__panel-header">
            <h2>Quick Access</h2>
            <span>{{ quickActions.length }} modules</span>
          </div>
          <div class="cms-dashboard__quick">
            <CmsQuickActionCard
              v-for="action in quickActions"
              :key="action.title"
              v-bind="action"
            />
          </div>
        </section>

        <CmsRecentActivity :items="dashboard?.recentAuditLogs || []" />
      </div>

      <section class="cms-dashboard__overview">
        <h2>System Overview</h2>
        <div>
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
  gap: 16px;
  align-items: center;
  min-height: 148px;
  padding: 28px;
  color: #fff;
  border-radius: 18px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.cms-dashboard__hero p,
.cms-dashboard__hero h1 {
  margin: 0;
}

.cms-dashboard__hero p {
  font-size: 0.82rem;
  font-weight: 800;
  opacity: 0.86;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cms-dashboard__hero h1 {
  margin-top: 8px;
  font-size: 1.9rem;
}

.cms-dashboard__hero button,
.cms-state button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  color: #075985;
  background: #fff;
  font-weight: 800;
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
  border-radius: 14px;
  background: #fff;
}

.cms-dashboard__panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.08rem;
}

.cms-dashboard__panel-header span,
.cms-dashboard__overview span {
  color: #64748b;
}

.cms-dashboard__quick {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cms-dashboard__overview div {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.cms-dashboard__overview span {
  padding: 14px;
  border-radius: 12px;
  background: #f8fafc;
}

.cms-dashboard__overview strong {
  display: block;
  color: #0f172a;
  font-size: 1.4rem;
}

.cms-state {
  padding: 32px;
  text-align: center;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
}

.cms-state--error {
  display: grid;
  gap: 12px;
  place-items: center;
  color: #991b1b;
}

@media (max-width: 1100px) {
  .cms-dashboard__stats,
  .cms-dashboard__overview div {
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
  .cms-dashboard__overview div {
    grid-template-columns: 1fr;
  }
}
</style>
