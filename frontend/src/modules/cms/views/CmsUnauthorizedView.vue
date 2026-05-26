<script setup>
import { useRouter } from 'vue-router'
import CmsIcon from '../components/CmsIcon.vue'
import { useCmsAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useCmsAuthStore()

async function logout() {
  await auth.logout()
  router.replace('/cms/login')
}
</script>

<template>
  <main class="cms-simple-state">
    <section aria-labelledby="cms-unauthorized-title">
      <span class="cms-simple-state__icon"><CmsIcon name="shield" /></span>
      <p>Access restricted</p>
      <h1 id="cms-unauthorized-title">You do not have permission to view this CMS area.</h1>
      <span class="cms-simple-state__detail">Your session is valid, but this module is outside your assigned role permissions.</span>
      <div>
        <RouterLink to="/cms/dashboard">Back to dashboard</RouterLink>
        <button type="button" @click="logout">Logout</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.cms-simple-state {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.1), transparent 36%),
    #f6f8fb;
}

section {
  display: grid;
  width: min(580px, 100%);
  gap: 12px;
  place-items: center;
  padding: 34px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.cms-simple-state__icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  color: #b45309;
  border-radius: 999px;
  background: #fef3c7;
}

.cms-simple-state__icon svg {
  width: 26px;
  height: 26px;
}

p {
  margin: 4px 0 0;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  max-width: 480px;
  margin: 0;
  color: #0f172a;
  font-size: 1.45rem;
  line-height: 1.25;
}

.cms-simple-state__detail {
  max-width: 440px;
  color: #64748b;
  line-height: 1.55;
}

div {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

a,
button {
  min-height: 42px;
  padding: 10px 14px;
  color: #0369a1;
  text-decoration: none;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font-weight: 800;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.18);
  outline-offset: 2px;
}
</style>
