<script setup>
import CmsCategoryManager from '../../components/content/CmsCategoryManager.vue'
</script>

<template>
  <CmsCategoryManager
    kind="museum"
    title="Museum Categories"
    description="Maintain collection labels used to organize virtual museum artifacts."
    write-permission="museum.update"
  />
</template>
