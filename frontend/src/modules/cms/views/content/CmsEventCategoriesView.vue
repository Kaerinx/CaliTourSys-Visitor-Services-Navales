<script setup>
import CmsCategoryManager from '../../components/content/CmsCategoryManager.vue'
</script>

<template>
  <CmsCategoryManager
    kind="event"
    title="Event Categories"
    description="Maintain category labels used to organize public event listings and CMS event forms."
    write-permission="events.update"
  />
</template>
