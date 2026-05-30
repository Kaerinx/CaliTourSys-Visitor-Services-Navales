<script setup>
import CmsCategoryManager from '../../components/content/CmsCategoryManager.vue'
</script>

<template>
  <CmsCategoryManager
    kind="destination"
    title="Destination Categories"
    description="Maintain destination grouping labels and map colors used by public place discovery."
    write-permission="destinations.update"
    show-color
  />
</template>
