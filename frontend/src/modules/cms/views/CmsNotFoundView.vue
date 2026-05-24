<template>
  <section class="cms-not-found">
    <p>CMS page not available</p>
    <h1>This CMS module has not been built yet.</h1>
    <RouterLink to="/cms/dashboard">Back to dashboard</RouterLink>
  </section>
</template>

<style scoped>
.cms-not-found {
  display: grid;
  gap: 12px;
  place-items: center;
  min-height: 50vh;
  padding: 32px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
}

p,
h1 {
  margin: 0;
}

p {
  color: #0284c7;
  font-weight: 800;
}

h1 {
  color: #0f172a;
  font-size: 1.35rem;
}

a {
  margin-top: 8px;
  color: #0369a1;
  font-weight: 800;
}
</style>
