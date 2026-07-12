<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '@/components/common/AppFooter.vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import FloatingItinerary from './modules/promotion/components/FloatingItinerary.vue'
import PublicAuthModal from './modules/promotion/components/PublicAuthModal.vue'

const route = useRoute()
const router = useRouter()

const isProductShell = computed(() =>
  route.matched.some((record) => record.meta.productPublic || record.meta.productRequiresAuth),
)
const isCmsRoute = computed(() => route.path.startsWith('/cms'))
const isAccreditationRoute = computed(() => route.path.startsWith('/accreditation'))
const isVisitorRoute = computed(() => route.path.startsWith('/visitor'))
const isMuseumRoute = computed(() => route.path.startsWith('/promotion/museum'))
const showPublicItinerary = computed(
  () =>
    !isCmsRoute.value &&
    !isMuseumRoute.value &&
    !isProductShell.value &&
    !isAccreditationRoute.value &&
    !isVisitorRoute.value,
)
const showPublicAuth = computed(
  () => !isCmsRoute.value && !isProductShell.value && !isAccreditationRoute.value && !isVisitorRoute.value,
)
const publicAuthMode = computed(() => {
  const mode = route.query.auth
  return mode === 'register' ? 'register' : mode === 'login' ? 'login' : ''
})
const publicAuthIntent = computed(() => {
  const intent = route.query.authIntent
  return intent === 'save' ? 'save' : ''
})

function setPublicAuthMode(mode) {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      auth: mode,
    },
  })
}

function closePublicAuth() {
  const nextQuery = { ...route.query }
  delete nextQuery.auth
  delete nextQuery.authIntent
  router.replace({
    path: route.path,
    query: nextQuery,
  })
}

async function handlePublicAuthenticated() {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    await router.replace(redirect)
    return
  }
  closePublicAuth()
}
</script>

<template>
  <div v-if="isProductShell" class="app-shell">
    <AppNavbar />
    <main>
      <RouterView />
    </main>
    <AppFooter />
  </div>
  <RouterView v-else-if="isAccreditationRoute || isVisitorRoute" />
  <template v-else>
    <RouterView />
    <FloatingItinerary v-if="showPublicItinerary" />
    <PublicAuthModal
      v-if="showPublicAuth && publicAuthMode"
      :mode="publicAuthMode"
      :intent="publicAuthIntent"
      @close="closePublicAuth"
      @change-mode="setPublicAuthMode"
      @authenticated="handlePublicAuthenticated"
    />
  </template>
</template>

<style>
:root {
  --color-bg: #f4f7f3;
  --color-panel: #ffffff;
  --color-ink: #15251f;
  --color-muted: #66746e;
  --color-primary: #1f6f58;
  --color-primary-dark: #174d3f;
  --color-accent: #d89b35;
  --color-line: #dfe8e1;
  --shadow-soft: 0 18px 50px rgba(21, 37, 31, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.app-navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 72px;
  padding: 14px 40px;
  border-bottom: 1px solid var(--color-line);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
}

.brand {
  display: grid;
  gap: 2px;
}

.brand span {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand strong {
  font-size: 16px;
}

.app-navbar nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.app-navbar nav a,
.user-chip,
.demo-panel button {
  border-radius: 999px;
}

.app-navbar nav a {
  padding: 10px 14px;
  color: var(--color-muted);
  font-weight: 700;
}

.app-navbar nav a.router-link-active {
  background: #e5f3ee;
  color: var(--color-primary-dark);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 12px;
  background: #eef5f1;
  color: var(--color-primary-dark);
  font-size: 13px;
  font-weight: 700;
}

.user-chip button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
}

.app-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 40px;
  color: var(--color-muted);
  font-size: 13px;
}

.login-page {
  min-height: calc(100vh - 126px);
  display: grid;
  place-items: center;
  padding: 40px;
}

.login-card {
  width: min(100%, 520px);
  padding: 36px;
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 12px;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1;
  letter-spacing: 0;
}

h2 {
  font-size: 22px;
}

.lede,
.section-heading p,
.summary-card p,
.product-card p,
.module-contract p,
.empty-state p {
  color: var(--color-muted);
  line-height: 1.65;
}

.login-form {
  display: grid;
  gap: 16px;
  margin-top: 28px;
}

.login-form label {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.login-form input {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 12px 14px;
  color: var(--color-ink);
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--color-primary);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.secondary-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  padding: 10px 12px;
  background: white;
  color: var(--color-primary-dark);
  font-weight: 800;
  cursor: pointer;
}

.danger-button {
  border-color: #fed7d2;
  background: #fff5f5;
  color: #b42318;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  background: transparent;
  color: var(--color-muted);
  font-weight: 800;
  cursor: pointer;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  grid-column: 1 / -1;
  justify-content: flex-end;
}

.form-error {
  margin: 0;
  color: #b42318;
  font-weight: 700;
}

.form-success {
  margin: 0 0 12px;
  color: var(--color-primary);
  font-weight: 800;
}

.demo-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--color-line);
}

.demo-panel span {
  width: 100%;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.demo-panel button {
  border: 1px solid var(--color-line);
  padding: 8px 10px;
  background: #f8fbf9;
  color: var(--color-primary-dark);
  cursor: pointer;
}

.page-section {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 44px 0;
}

.section-heading {
  max-width: 780px;
  margin-bottom: 28px;
}

.summary-grid,
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card,
.product-card,
.handoff-panel,
.module-contract,
.empty-state {
  border: 1px solid var(--color-line);
  border-radius: 18px;
  background: var(--color-panel);
  box-shadow: var(--shadow-soft);
}

.summary-card,
.product-card {
  min-height: 190px;
  padding: 20px;
}

.summary-card span,
.product-card span {
  display: inline-block;
  margin-bottom: 14px;
  border-radius: 999px;
  padding: 6px 10px;
  background: #e5f3ee;
  color: var(--color-primary-dark);
  font-size: 12px;
  font-weight: 900;
}

.handoff-panel,
.module-contract {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 20px;
  padding: 24px;
}

.role-notice {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
  border-left: 6px solid var(--color-primary);
  border-radius: 14px;
  padding: 14px 16px;
  background: #eaf5ef;
}

.role-notice.readonly {
  border-left-color: var(--color-accent);
  background: #fff6e5;
}

.contract-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 460px;
}

.contract-list h3 {
  width: 100%;
  margin-bottom: 4px;
}

.contract-list span {
  border-radius: 999px;
  padding: 8px 10px;
  background: #edf4f8;
  color: #245a8d;
  font-size: 12px;
  font-weight: 800;
}

.empty-state {
  max-width: 680px;
  padding: 28px;
}

@media (max-width: 900px) {
  .app-navbar,
  .app-footer,
  .handoff-panel,
  .module-contract {
    align-items: flex-start;
    flex-direction: column;
  }

  .app-navbar {
    position: static;
  }

  .app-navbar nav {
    flex-wrap: wrap;
  }

  .summary-grid,
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
