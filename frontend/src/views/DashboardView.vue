<script setup>
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const roleSummary = computed(() => {
  if (auth.isViewOnly) {
    return 'View-only access: reports, summaries, and development status only.'
  }

  return 'Operational access: prepare module records according to the assigned role.'
})

const moduleCards = [
  {
    title: 'Project foundation',
    status: 'Ready',
    description: 'Vue app shell, backend API shell, and module route preparation.',
  },
  {
    title: 'Role preparation',
    status: 'Ready',
    description: 'Tourism Staff, Tourism Officer, LGU Official, and System Administrator roles.',
  },
  {
    title: 'Product module dashboard',
    status: 'Ready',
    description: 'Dashboard is aligned for asset management and future development planning.',
  },
  {
    title: 'Asset management',
    status: 'Available',
    description: 'Tourism asset create, update, filter, view, and archive workflow is active.',
  },
  {
    title: 'Development planning',
    status: 'Available',
    description: 'Create product development plans linked to active tourism assets.',
  },
  {
    title: 'Improvement monitoring',
    status: 'Available',
    description: 'Record progress updates for active product development plans.',
  },
  {
    title: 'Tourism activities',
    status: 'Available',
    description: 'Prepare activity records connected to tourism assets and plans.',
  },
  {
    title: 'Tourism packages',
    status: 'Available',
    description: 'Combine active tourism assets and activities into package records.',
  },
]
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <p class="eyebrow">Dashboard</p>
      <h1>Welcome, {{ auth.user?.fullName }}</h1>
      <p>{{ roleSummary }}</p>
    </div>

    <div class="summary-grid">
      <article v-for="card in moduleCards" :key="card.title" class="summary-card">
        <span>{{ card.status }}</span>
        <h2>{{ card.title }}</h2>
        <p>{{ card.description }}</p>
      </article>
    </div>

    <div class="handoff-panel">
      <div>
        <h2>Tourism Product Development Program</h2>
        <p>
          Continue to the product module dashboard to review current module scope, planned API groups,
          user roles, and the future consolidation contract.
        </p>
      </div>
      <RouterLink class="primary-button" to="/product">Open Product Module</RouterLink>
    </div>
  </section>
</template>
