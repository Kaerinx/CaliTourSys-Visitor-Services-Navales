<script setup>
import { computed, reactive, watch } from 'vue'
import CmsCoordinateField from './CmsCoordinateField.vue'
import CmsRelationSelect from './CmsRelationSelect.vue'
import { toNullable, validateRequired } from './formUtils'

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  destinations: { type: Array, default: () => [] },
  businesses: { type: Array, default: () => [] },
  events: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const title = computed(() => (props.value?.id ? 'Edit map location' : 'Create map location'))

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  output.label = validateRequired(form.label, 'Label')
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  if (form.latitude === '' || Number.isNaN(latitude) || latitude < -90 || latitude > 90) output.latitude = 'Latitude must be between -90 and 90.'
  if (form.longitude === '' || Number.isNaN(longitude) || longitude < -180 || longitude > 180) output.longitude = 'Longitude must be between -180 and 180.'
  const targetCount = [form.destinationId, form.businessId, form.eventId].filter(Boolean).length
  if (targetCount !== 1) output.target = 'Select exactly one linked target.'
  if (form.locationType === 'destination' && !form.destinationId) output.target = 'Destination target is required.'
  if (form.locationType === 'business' && !form.businessId) output.target = 'Business target is required.'
  if (form.locationType === 'event' && !form.eventId) output.target = 'Event target is required.'
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value))
})

watch(() => [props.open, props.value], () => {
  Object.assign(form, defaultForm(props.value))
  submitted.value = false
}, { immediate: true })

watch(() => form.locationType, (type) => {
  if (type !== 'destination') form.destinationId = ''
  if (type !== 'business') form.businessId = ''
  if (type !== 'event') form.eventId = ''
})

function defaultForm(value = null) {
  return {
    locationType: value?.locationType || 'destination',
    destinationId: value?.destinationId || '',
    businessId: value?.businessId || '',
    eventId: value?.eventId || '',
    label: value?.label || '',
    latitude: value?.latitude ?? '',
    longitude: value?.longitude ?? '',
    mapboxPlaceId: value?.mapboxPlaceId || '',
    markerColor: value?.markerColor || '#0f766e',
    markerIcon: value?.markerIcon || '',
    clusterGroup: value?.clusterGroup || '',
    geojsonPropertiesText: value?.geojsonProperties ? JSON.stringify(value.geojsonProperties, null, 2) : '',
    isPrimary: value?.isPrimary ?? true,
    isClusterable: value?.isClusterable ?? true,
    sortPriority: value?.sortPriority ?? 0,
    status: value?.status || 'published',
  }
}

function parseGeoJsonProperties() {
  if (!form.geojsonPropertiesText.trim()) return null
  try {
    return JSON.parse(form.geojsonPropertiesText)
  } catch {
    return null
  }
}

function submitForm() {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  emit('submit', {
    locationType: form.locationType,
    destinationId: form.destinationId || null,
    businessId: form.businessId || null,
    eventId: form.eventId || null,
    label: form.label.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    mapboxPlaceId: toNullable(form.mapboxPlaceId),
    markerColor: toNullable(form.markerColor),
    markerIcon: toNullable(form.markerIcon),
    clusterGroup: toNullable(form.clusterGroup),
    geojsonProperties: parseGeoJsonProperties(),
    isPrimary: form.isPrimary,
    isClusterable: form.isClusterable,
    sortPriority: Number(form.sortPriority || 0),
    status: form.status,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-form-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-form-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-map-form-title">
        <header><div><p>Map Locations</p><h2 id="cms-map-form-title">{{ title }}</h2></div><button type="button" aria-label="Close map location form" @click="$emit('close')">x</button></header>
        <form novalidate @submit.prevent="submitForm">
          <div class="cms-form-modal__grid cms-form-modal__grid--top">
            <label><span>Location type</span><select v-model="form.locationType"><option value="destination">Destination</option><option value="business">Business</option><option value="event">Event</option></select></label>
            <label><span>Status</span><select v-model="form.status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          </div>
          <CmsRelationSelect v-if="form.locationType === 'destination'" v-model="form.destinationId" label="Destination" required :options="destinations" :error="errors.target" />
          <CmsRelationSelect v-if="form.locationType === 'business'" v-model="form.businessId" label="Business" required :options="businesses" :error="errors.target" />
          <CmsRelationSelect v-if="form.locationType === 'event'" v-model="form.eventId" label="Event" required :options="events" :error="errors.target" />
          <label><span>Label</span><input v-model="form.label" :aria-invalid="Boolean(errors.label)" /><small v-if="errors.label">{{ errors.label }}</small></label>
          <CmsCoordinateField v-model:latitude="form.latitude" v-model:longitude="form.longitude" :latitude-error="errors.latitude" :longitude-error="errors.longitude" />
          <div class="cms-form-modal__grid">
            <label><span>Mapbox place ID</span><input v-model="form.mapboxPlaceId" /></label>
            <label><span>Marker color</span><input v-model="form.markerColor" /></label>
          </div>
          <div class="cms-form-modal__grid">
            <label><span>Marker icon</span><input v-model="form.markerIcon" /></label>
            <label><span>Cluster group</span><input v-model="form.clusterGroup" /></label>
          </div>
          <div class="cms-form-modal__grid">
            <label><span>Sort priority</span><input v-model="form.sortPriority" type="number" /></label>
            <label class="cms-form-modal__check"><input v-model="form.isPrimary" type="checkbox" /><span>Primary location</span></label>
          </div>
          <label class="cms-form-modal__check"><input v-model="form.isClusterable" type="checkbox" /><span>Allow clustering</span></label>
          <label><span>GeoJSON properties</span><textarea v-model="form.geojsonPropertiesText" rows="4" placeholder='{"key":"value"}'></textarea></label>
          <div v-if="serverError" class="cms-form-modal__error" role="alert">{{ serverError }}</div>
          <footer><button type="button" :disabled="busy" @click="$emit('close')">Cancel</button><button class="cms-form-modal__primary" type="submit" :disabled="busy">{{ busy ? 'Saving...' : 'Save map location' }}</button></footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@import './cms-form-modal.css';
</style>
