<script setup>
import CmsIcon from './CmsIcon.vue'

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
    <a class="cms-topbar__skip" href="#cms-main-content">Skip to content</a>

    <button class="cms-topbar__menu" type="button" aria-label="Open CMS navigation" @click="$emit('toggle-sidebar')">
      <CmsIcon name="menu" />
    </button>

    <div class="cms-topbar__title">
      <strong>Staff workspace</strong>
      <small>Calabanga Tourism Office CMS</small>
    </div>

    <div class="cms-topbar__account" aria-label="Signed-in CMS account">
      <span class="cms-topbar__avatar" aria-hidden="true">
        {{ (user?.displayName || user?.email || 'C').slice(0, 1).toUpperCase() }}
      </span>
      <span>
        <strong>{{ user?.displayName || 'CMS Staff' }}</strong>
        <small>{{ user?.roles?.join(', ') || 'Tourism Office' }}</small>
      </span>
    </div>

    <button class="cms-topbar__logout" type="button" @click="$emit('logout')">
      <CmsIcon name="logOut" />
      <span>Logout</span>
    </button>
  </header>
</template>

<style scoped>
.cms-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 74px;
  padding: 14px 28px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(246, 248, 251, 0.94);
  backdrop-filter: blur(12px);
}

.cms-topbar__skip {
  position: absolute;
  top: -48px;
  left: 16px;
  z-index: 2;
  padding: 10px 12px;
  color: #0f172a;
  text-decoration: none;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  background: #fff;
  font-weight: 800;
}

.cms-topbar__skip:focus {
  top: 12px;
}

.cms-topbar__menu,
.cms-topbar__logout {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  border-radius: 8px;
}

.cms-topbar__menu {
  display: none;
  width: 42px;
  height: 42px;
  place-items: center;
}

.cms-topbar__menu svg,
.cms-topbar__logout svg {
  width: 18px;
  height: 18px;
}

.cms-topbar__title {
  min-width: 0;
}

.cms-topbar__logout {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  font-weight: 700;
}

.cms-topbar__account {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  margin-left: auto;
}

.cms-topbar__avatar {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #0f766e;
  border: 1px solid #99f6e4;
  border-radius: 999px;
  background: #ccfbf1;
  font-weight: 900;
}

button:hover,
button:focus-visible,
.cms-topbar__skip:focus {
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
    display: grid;
  }
}

@media (max-width: 640px) {
  .cms-topbar {
    gap: 10px;
  }

  .cms-topbar__title small {
    display: none;
  }

  .cms-topbar__account span:not(.cms-topbar__avatar) {
    display: none;
  }

  .cms-topbar__logout {
    width: 42px;
    padding: 0;
  }

  .cms-topbar__logout span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}
</style>
