<template>
  <main class="promotion-placeholder">
    <p class="promotion-placeholder__caption">Design System · v1.0</p>
    <h1>TWBIS Design Language</h1>
    <p class="promotion-placeholder__note">
      Design reference page skeleton. Final implementation must mirror the Figmake component notes if this route remains enabled.
    </p>
  </main>
</template>

<style scoped>
.promotion-placeholder {
  min-height: 100vh;
  padding: 96px 40px;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

.promotion-placeholder__caption {
  margin: 0 0 12px;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 44px;
  line-height: 1.2;
}

.promotion-placeholder__note {
  max-width: 640px;
  margin: 16px 0 0;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 1.6;
}
</style>
