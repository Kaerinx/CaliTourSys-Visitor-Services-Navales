<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCmsAuthStore } from '../stores/authStore'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  open: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

const route = useRoute()
const auth = useCmsAuthStore()

const visibleItems = computed(() =>
  props.items.filter((item) => {
    if (item.permissions?.length) return auth.hasAnyPermission(item.permissions)
    if (item.permission) return auth.hasPermission(item.permission)
    return true
  }),
)
</script>

<template>
  <aside class="cms-sidebar" :class="{ 'is-open': open }" aria-label="CMS navigation">
    <div class="cms-sidebar__brand">
      <span class="cms-sidebar__mark">C</span>
      <span>
        <strong>Calabanga Tourism</strong>
        <small>Management System</small>
      </span>
    </div>

    <nav>
      <RouterLink
        v-for="item in visibleItems"
        :key="item.key || item.path"
        :to="item.path"
        class="cms-sidebar__link"
        :aria-current="route.path === item.path ? 'page' : undefined"
        @click="$emit('close')"
      >
        <span class="cms-sidebar__glyph">{{ item.icon || item.label.slice(0, 1) }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="cms-sidebar__footer">
      <strong>Tourism Office</strong>
      <small>CMS v1 · Public site stable</small>
    </div>
  </aside>
</template>

<style scoped>
.cms-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  display: flex;
  width: 280px;
  flex-direction: column;
  padding: 18px;
  border-right: 1px solid #dbeafe;
  background: #fff;
  box-shadow: 12px 0 28px rgba(15, 23, 42, 0.06);
}

.cms-sidebar__brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
}

.cms-sidebar__mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  color: #0369a1;
  background: #fff;
  font-weight: 900;
}

strong,
small {
  display: block;
}

small {
  margin-top: 2px;
  color: inherit;
  opacity: 0.82;
}

nav {
  display: grid;
  gap: 6px;
  margin-top: 22px;
}

.cms-sidebar__link {
  display: flex;
  gap: 11px;
  align-items: center;
  min-height: 44px;
  padding: 10px 12px;
  color: #475569;
  text-decoration: none;
  border-radius: 11px;
  border-left: 3px solid transparent;
}

.cms-sidebar__link:hover,
.cms-sidebar__link:focus-visible,
.cms-sidebar__link[aria-current='page'] {
  color: #0369a1;
  background: #e0f2fe;
  border-left-color: #0ea5e9;
  outline: none;
}

.cms-sidebar__glyph {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  font-weight: 800;
}

.cms-sidebar__footer {
  padding: 14px;
  margin-top: auto;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .cms-sidebar {
    transform: translateX(-105%);
    transition: transform 0.2s ease;
  }

  .cms-sidebar.is-open {
    transform: translateX(0);
  }
}
</style>
