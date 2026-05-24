<script setup>
defineProps({
  user: {
    type: Object,
    default: null,
  },
})

defineEmits(['toggle-sidebar', 'logout'])
</script>

<template>
  <header class="cms-topbar">
    <button class="cms-topbar__menu" type="button" aria-label="Open CMS navigation" @click="$emit('toggle-sidebar')">
      ☰
    </button>

    <div>
      <strong>{{ user?.displayName || 'CMS Staff' }}</strong>
      <small>{{ user?.roles?.join(', ') || 'Tourism Office' }}</small>
    </div>

    <button class="cms-topbar__logout" type="button" @click="$emit('logout')">Logout</button>
  </header>
</template>

<style scoped>
.cms-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 72px;
  padding: 14px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.92);
  backdrop-filter: blur(12px);
}

.cms-topbar__menu,
.cms-topbar__logout {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  border-radius: 10px;
}

.cms-topbar__menu {
  display: none;
  width: 42px;
  height: 42px;
  font-size: 1.2rem;
}

.cms-topbar__logout {
  min-height: 40px;
  padding: 0 14px;
  margin-left: auto;
  font-weight: 700;
}

button:hover,
button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.18);
}

strong,
small {
  display: block;
}

strong {
  color: #0f172a;
}

small {
  margin-top: 2px;
  color: #64748b;
}

@media (max-width: 900px) {
  .cms-topbar {
    padding: 12px 16px;
  }

  .cms-topbar__menu {
    display: block;
  }
}
</style>
