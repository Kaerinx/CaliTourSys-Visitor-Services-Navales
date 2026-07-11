<script setup>
defineEmits(['apply', 'clear'])
</script>

<template>
  <div class="filter-actions">
    <button class="secondary-button" type="button" @click="$emit('apply')">Apply Filters</button>
    <button class="ghost-button" type="button" @click="$emit('clear')">Clear</button>
  </div>
</template>
