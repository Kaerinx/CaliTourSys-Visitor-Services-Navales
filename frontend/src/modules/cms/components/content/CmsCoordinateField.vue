<script setup>
defineProps({
  latitude: { type: [String, Number], default: '' },
  longitude: { type: [String, Number], default: '' },
  latitudeError: { type: String, default: '' },
  longitudeError: { type: String, default: '' },
  helperText: { type: String, default: '' },
  showPickerButton: { type: Boolean, default: false },
})

defineEmits(['update:latitude', 'update:longitude', 'pick'])
</script>

<template>
  <div class="cms-coordinate-field">
    <div v-if="showPickerButton" class="cms-coordinate-field__header">
      <span>Manual coordinates</span>
      <button v-if="showPickerButton" type="button" @click="$emit('pick')">Pick location on map</button>
    </div>
    <p v-if="helperText">{{ helperText }}</p>
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
  </div>
</template>

<style scoped>
.cms-coordinate-field {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin-inline: 20px;
}

.cms-coordinate-field .cms-form-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(170px, 1fr));
  gap: 12px;
  margin-inline: 0;
}

.cms-coordinate-field .cms-form-modal__grid label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.cms-coordinate-field .cms-form-modal__grid label > span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.cms-coordinate-field input {
  width: 100%;
  min-width: 0;
  min-height: 38px;
  padding: 8px 10px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

.cms-coordinate-field input:focus,
.cms-coordinate-field button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

.cms-coordinate-field input[aria-invalid='true'] {
  border-color: #dc2626;
}

.cms-coordinate-field small {
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-coordinate-field__header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.cms-coordinate-field__header > span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 900;
}

.cms-coordinate-field__header button {
  min-height: 36px;
  padding: 0 12px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font: inherit;
  font-weight: 800;
}

.cms-coordinate-field p {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
  text-transform: none;
}

@media (max-width: 520px) {
  .cms-coordinate-field__header {
    align-items: stretch;
    flex-direction: column;
  }

  .cms-coordinate-field__header button {
    width: 100%;
  }

  .cms-coordinate-field .cms-form-modal__grid {
    grid-template-columns: 1fr;
  }
}
</style>
