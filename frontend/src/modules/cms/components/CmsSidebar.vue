<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCmsAuthStore } from '../stores/authStore'
import CmsIcon from './CmsIcon.vue'

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

function isActive(item) {
  if (route.path === item.path) return true
  return item.path !== '/cms/dashboard' && route.path.startsWith(`${item.path}/`)
}

function permissionLabel(item) {
  if (item.permissions?.length) return `Any: ${item.permissions.join(', ')}`
  if (item.permission) return item.permission
  return 'Available to your role'
}
</script>

<template>
  <aside class="cms-sidebar" :class="{ 'is-open': open }" aria-label="CMS navigation">
    <div class="cms-sidebar__brand">
      <span class="cms-sidebar__mark">CT</span>
      <span>
        <strong>Calabanga Tourism</strong>
        <small>Staff CMS</small>
      </span>
    </div>

    <div class="cms-sidebar__section-label">Workspace</div>

    <nav>
      <RouterLink
        v-for="item in visibleItems"
        :key="item.key || item.path"
        :to="item.path"
        class="cms-sidebar__link"
        :aria-current="isActive(item) ? 'page' : undefined"
        :title="permissionLabel(item)"
        @click="$emit('close')"
      >
        <span class="cms-sidebar__glyph"><CmsIcon :name="item.icon" /></span>
        <span class="cms-sidebar__link-text">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div v-if="!visibleItems.length" class="cms-sidebar__empty">
      <strong>No modules available</strong>
      <small>Your account has no CMS navigation permissions assigned.</small>
    </div>

    <div class="cms-sidebar__footer">
      <strong>{{ visibleItems.length }} modules available</strong>
      <small>Navigation follows your assigned permissions.</small>
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
  padding: 18px 14px;
  border-right: 1px solid #d7e2ee;
  background: #fff;
  box-shadow: 10px 0 28px rgba(15, 23, 42, 0.06);
}

.cms-sidebar__brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  color: #0f172a;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff, #ecfdf5);
}

.cms-sidebar__mark {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  color: #0f766e;
  border: 1px solid #99f6e4;
  border-radius: 8px;
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
  opacity: 0.74;
}

.cms-sidebar__section-label {
  margin: 22px 12px 8px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

nav {
  display: grid;
  gap: 4px;
  overflow-y: auto;
  padding-right: 2px;
}

.cms-sidebar__link {
  position: relative;
  display: flex;
  gap: 11px;
  align-items: center;
  min-height: 42px;
  padding: 9px 10px;
  color: #475569;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 8px;
}

.cms-sidebar__link:hover,
.cms-sidebar__link:focus-visible {
  color: #0f766e;
  border-color: #ccfbf1;
  background: #f0fdfa;
  outline: none;
}

.cms-sidebar__link[aria-current='page'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
  box-shadow: inset 3px 0 0 #0ea5e9;
}

.cms-sidebar__glyph {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-sidebar__glyph svg {
  width: 17px;
  height: 17px;
}

.cms-sidebar__link-text {
  min-width: 0;
  overflow: hidden;
  font-size: 0.92rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-sidebar__empty,
.cms-sidebar__footer {
  padding: 14px;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-sidebar__empty {
  margin-top: 12px;
}

.cms-sidebar__footer {
  margin-top: auto;
}

@media (max-width: 900px) {
  .cms-sidebar {
    max-width: calc(100vw - 48px);
    transform: translateX(-105%);
    transition: transform 0.2s ease;
  }

  .cms-sidebar.is-open {
    transform: translateX(0);
  }
}
</style>
