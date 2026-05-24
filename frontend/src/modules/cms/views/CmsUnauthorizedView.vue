<script setup>
import { useRouter } from 'vue-router'
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
    <section>
      <p>Access restricted</p>
      <h1>You do not have permission to view this CMS area.</h1>
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
  background: #f8fafc;
}

section {
  width: min(560px, 100%);
  padding: 28px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
}

p {
  margin: 0 0 10px;
  color: #0284c7;
  font-weight: 800;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.4rem;
}

div {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

a,
button {
  min-height: 42px;
  padding: 10px 14px;
  color: #0369a1;
  text-decoration: none;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  background: #f0f9ff;
  font-weight: 800;
}
</style>
