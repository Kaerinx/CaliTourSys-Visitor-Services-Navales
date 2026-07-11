<script setup>
import { SHOW_MUSEUM_MODULE } from '@/config/featureFlags'
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-categories-title">
    <header class="cms-content-page__header">
      <div>
        <p>Content Taxonomy</p>
        <h1 id="cms-categories-title">Categories</h1>
        <span>Choose a category group to manage the labels used across public tourism content.</span>
      </div>
    </header>

    <div class="cms-categories-grid">
      <RouterLink to="/cms/categories/events">
        <strong>Event Categories</strong>
        <span>Festival, cultural, sports, and calendar groupings.</span>
      </RouterLink>
      <RouterLink to="/cms/categories/products">
        <strong>Product Categories</strong>
        <span>OTOP product and producer catalog groupings.</span>
      </RouterLink>
      <RouterLink to="/cms/categories/destinations">
        <strong>Destination Categories</strong>
        <span>Place discovery categories with optional color labels.</span>
      </RouterLink>
      <RouterLink v-if="SHOW_MUSEUM_MODULE" to="/cms/categories/museum">
        <strong>Museum Categories</strong>
        <span>Artifact collection labels for virtual museum content.</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
@import './cms-content-page.css';

.cms-categories-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.cms-categories-grid a {
  display: grid;
  gap: 8px;
  min-height: 130px;
  align-content: center;
  padding: 20px;
  color: inherit;
  text-decoration: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.cms-categories-grid a:hover,
.cms-categories-grid a:focus-visible {
  border-color: #7dd3fc;
  outline: 3px solid rgba(14, 165, 233, 0.12);
}

strong {
  color: #0f172a;
  font-size: 1.05rem;
}

span {
  color: #64748b;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .cms-categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
