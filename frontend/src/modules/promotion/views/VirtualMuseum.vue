<template>
  <main class="promotion-placeholder promotion-placeholder--museum">
    <p class="promotion-placeholder__caption">Calabanga Heritage Collection</p>
    <h1>Calabanga Cultural Museum</h1>
    <p class="promotion-placeholder__note">
      Museum page skeleton. Final implementation must follow the locked cinematic hero, artifact
      grid, and artifact detail modal.
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

.promotion-placeholder--museum {
  background: linear-gradient(120deg, #7b341e 0%, #b5451b 60%, #d4711b 100%);
}

.promotion-placeholder__caption {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 44px;
  line-height: 1.2;
}

.promotion-placeholder__note {
  max-width: 640px;
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  line-height: 1.6;
}
</style>
