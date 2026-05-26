<script setup>
import CmsIcon from '../components/CmsIcon.vue'
</script>

<template>
  <section class="cms-not-found" aria-labelledby="cms-not-found-title">
    <span><CmsIcon name="empty" /></span>
    <p>CMS page not available</p>
    <h1 id="cms-not-found-title">This CMS module has not been built yet.</h1>
    <RouterLink to="/cms/dashboard">Back to dashboard</RouterLink>
  </section>
</template>

<style scoped>
.cms-not-found {
  display: grid;
  gap: 12px;
  place-items: center;
  min-height: 52vh;
  padding: 36px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.cms-not-found > span {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  color: #64748b;
  border-radius: 999px;
  background: #f1f5f9;
}

.cms-not-found svg {
  width: 28px;
  height: 28px;
}

p,
h1 {
  margin: 0;
}

p {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  color: #0f172a;
  font-size: 1.35rem;
}

a {
  min-height: 42px;
  margin-top: 8px;
  padding: 10px 14px;
  color: #0369a1;
  text-decoration: none;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font-weight: 800;
}

a:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.18);
  outline-offset: 2px;
}
</style>
