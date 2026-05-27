<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  options: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
  placeholder: { type: String, default: 'Select option' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <label>
    <span>{{ label }}</span>
    <select
      :value="modelValue"
      :aria-invalid="Boolean(error)"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ required ? placeholder : `No ${label.toLowerCase()}` }}</option>
      <option v-for="option in options" :key="option.id" :value="option.id">
        {{ option.name || option.title || option.label }}
      </option>
    </select>
    <small v-if="error">{{ error }}</small>
  </label>
</template>
