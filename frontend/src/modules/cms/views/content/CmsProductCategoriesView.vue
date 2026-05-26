<script setup>
import CmsCategoryManager from '../../components/content/CmsCategoryManager.vue'
</script>

<template>
  <CmsCategoryManager
    kind="product"
    title="Product Categories"
    description="Maintain OTOP and product category labels used across public product discovery."
    write-permission="products.update"
  />
</template>
