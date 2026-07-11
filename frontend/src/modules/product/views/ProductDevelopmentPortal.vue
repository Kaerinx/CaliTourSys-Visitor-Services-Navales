<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DevelopmentPlanList from '@/modules/product/views/DevelopmentPlanList.vue'
import ProductList from '@/modules/product/views/ProductList.vue'
import TourismPackageList from '@/modules/product/views/TourismPackageList.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Assets', path: '/cms/product-development/assets' },
  { label: 'Plans', path: '/cms/product-development/development-plans' },
  { label: 'Packages', path: '/cms/product-development/packages' },
]

const activeView = computed(() => {
  if (route.path.endsWith('/development-plans')) return DevelopmentPlanList
  if (route.path.endsWith('/packages')) return TourismPackageList
  return ProductList
})

function isActive(tab) {
  return route.path === tab.path
}

function goTo(tab) {
  router.push(tab.path)
}
</script>

<template>
  <section class="cms-content-page cms-product-development-page" aria-labelledby="cms-product-development-title">
    <header class="cms-content-page__header">
      <div>
        <p>Product Development</p>
        <h1 id="cms-product-development-title">Tourism Product Development Portal</h1>
        <span>Manage tourism assets, development plans, and packages for public promotion.</span>
      </div>
    </header>

    <nav class="cms-content-page__tabs" aria-label="Product development sections">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        type="button"
        :aria-current="isActive(tab) ? 'page' : undefined"
        @click="goTo(tab)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="cms-product-development-page__app">
      <component :is="activeView" embedded />
    </div>
  </section>
</template>

<style scoped>
@import '@/modules/cms/views/content/cms-content-page.css';

.cms-content-page__tabs button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  padding: 0 12px;
  color: #475569;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.cms-content-page__tabs button:hover,
.cms-content-page__tabs button:focus-visible,
.cms-content-page__tabs button[aria-current='page'] {
  color: #075985;
  border-color: #bae6fd;
  background: #e0f2fe;
  outline: none;
}

.cms-product-development-page__app {
  min-width: 0;
}
</style>
