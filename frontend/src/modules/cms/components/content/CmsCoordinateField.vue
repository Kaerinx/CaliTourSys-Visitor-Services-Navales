<script setup>
defineProps({
  latitude: { type: [String, Number], default: '' },
  longitude: { type: [String, Number], default: '' },
  latitudeError: { type: String, default: '' },
  longitudeError: { type: String, default: '' },
})

defineEmits(['update:latitude', 'update:longitude'])
</script>

<template>
  <div class="cms-form-modal__grid">
    <label>
      <span>Latitude</span>
      <input
        :value="latitude"
        type="number"
        step="0.000001"
        min="-90"
        max="90"
        :aria-invalid="Boolean(latitudeError)"
        @input="$emit('update:latitude', $event.target.value)"
      />
      <small v-if="latitudeError">{{ latitudeError }}</small>
    </label>
    <label>
      <span>Longitude</span>
      <input
        :value="longitude"
        type="number"
        step="0.000001"
        min="-180"
        max="180"
        :aria-invalid="Boolean(longitudeError)"
        @input="$emit('update:longitude', $event.target.value)"
      />
      <small v-if="longitudeError">{{ longitudeError }}</small>
    </label>
  </div>
</template>
