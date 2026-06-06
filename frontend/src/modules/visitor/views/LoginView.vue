<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  router.replace({
    name: 'cms-login',
    query: {
      redirect: typeof redirect === 'string' && redirect.startsWith('/cms') ? redirect : '/cms/visitor',
    },
  })
})
</script>

<template>
  <main class="visitor-login-handoff" aria-live="polite">
    <strong>Redirecting to CMS sign in...</strong>
    <span>Visitor Services now uses the unified CaliTourSys login.</span>
  </main>
</template>

<style scoped>
.visitor-login-handoff {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  background: #f7faf8;
  color: #475569;
  text-align: center;
}

.visitor-login-handoff strong {
  color: #0f172a;
  font-size: 1.1rem;
}
</style>
