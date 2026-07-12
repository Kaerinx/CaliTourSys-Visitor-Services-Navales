<script setup>
import { computed, reactive, ref, watch } from 'vue'
import CmsCoordinateField from './CmsCoordinateField.vue'
import CmsMapPicker from './CmsMapPicker.vue'
import CmsRelationSelect from './CmsRelationSelect.vue'
import { toNullable, validateRequired } from './formUtils'
import { useCmsAuthStore } from '../../stores/authStore'
import { mapboxAccessToken } from '@/config/mapbox'

const mapboxToken = mapboxAccessToken

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  destinations: { type: Array, default: () => [] },
  businesses: { type: Array, default: () => [] },
  events: { type: Array, default: () => [] },
  initialCoordinates: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])
const auth = useCmsAuthStore()
const submitted = reactive({ value: false })
const form = reactive(defaultForm())
const pickerOpen = ref(false)
const lastAutoLabel = ref('')
const title = computed(() => (props.value?.id ? 'Edit map location' : 'Create map location'))
const canUseAdvancedMapSettings = computed(() =>
  auth.roles.some((role) => {
    if (typeof role === 'string') return role === 'system_admin' || role === 'System Administrator'
    return role?.roleKey === 'system_admin' || role?.role_key === 'system_admin' || role?.name === 'System Administrator'
  }),
)
const selectedTarget = computed(() => {
  if (form.locationType === 'destination') return props.destinations.find((item) => item.id === form.destinationId)
  if (form.locationType === 'business') return props.businesses.find((item) => item.id === form.businessId)
  if (form.locationType === 'event') return props.events.find((item) => item.id === form.eventId)
  return null
})

const errors = computed(() => {
  const output = {}
  if (!submitted.value) return output
  if (!form.locationType) output.locationType = 'Choose what kind of place this pin is for.'
  output.label = validateRequired(form.label, 'Label')
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  if (form.latitude === '') output.latitude = 'Enter the latitude or pick the location on the map.'
  else if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) output.latitude = 'Latitude must be a number from -90 to 90.'
  if (form.longitude === '') output.longitude = 'Enter the longitude or pick the location on the map.'
  else if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) output.longitude = 'Longitude must be a number from -180 to 180.'
  const targetCount = [form.destinationId, form.businessId, form.eventId].filter(Boolean).length
  if (targetCount > 1) output.target = 'Choose only one linked item for this pin.'
  if (form.locationType === 'destination' && !form.destinationId) output.target = 'Select the destination this pin belongs to.'
  if (form.locationType === 'business' && !form.businessId) output.target = 'Select the business this pin belongs to.'
  if (form.locationType === 'event' && !form.eventId) output.target = 'Select the event this pin belongs to.'
  if (form.geojsonPropertiesText.trim() && !parseGeoJsonProperties()) output.geojsonPropertiesText = 'Additional map data must be valid JSON.'
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value))
})

watch(() => [props.open, props.value, props.initialCoordinates], () => {
  Object.assign(form, defaultForm(props.value))
  submitted.value = false
  pickerOpen.value = false
  lastAutoLabel.value = ''
}, { immediate: true })

watch(() => form.locationType, (type) => {
  if (type !== 'destination') form.destinationId = ''
  if (type !== 'business') form.businessId = ''
  if (type !== 'event') form.eventId = ''
})

watch(selectedTarget, (target) => {
  if (!target) return
  const targetLabel = target.name || target.title || target.label || ''
  if (!targetLabel) return
  if (!form.label.trim() || form.label === lastAutoLabel.value) {
    form.label = targetLabel
    lastAutoLabel.value = targetLabel
  }
})

function defaultForm(value = null) {
  const initialLatitude = normalizeInitialCoordinate(props.initialCoordinates?.latitude)
  const initialLongitude = normalizeInitialCoordinate(props.initialCoordinates?.longitude)

  return {
    locationType: value?.locationType || 'destination',
    destinationId: value?.destinationId || '',
    businessId: value?.businessId || '',
    eventId: value?.eventId || '',
    label: value?.label || '',
    latitude: value ? value.latitude ?? '' : initialLatitude,
    longitude: value ? value.longitude ?? '' : initialLongitude,
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

function normalizeInitialCoordinate(value) {
  if (value === null || value === undefined || value === '') return ''
  const coordinate = Number(value)
  if (!Number.isFinite(coordinate) || coordinate === 0) return ''
  return value
}

function parseGeoJsonProperties() {
  if (!form.geojsonPropertiesText.trim()) return null
  try {
    return JSON.parse(form.geojsonPropertiesText)
  } catch {
    return null
  }
}

function applyPickedCoordinates(coordinates) {
  form.latitude = coordinates.latitude
  form.longitude = coordinates.longitude
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
    <div v-if="open" class="cms-map-location-modal" role="presentation" @click.self="$emit('close')">
      <section class="cms-map-location-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-map-form-title">
        <header>
          <div>
            <p>Map Locations</p>
            <h2 id="cms-map-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close map location form" @click="$emit('close')">x</button>
        </header>

        <form novalidate @submit.prevent="submitForm">
          <div class="cms-map-location-modal__body">
            <section class="cms-map-section" aria-labelledby="map-location-basic-title">
              <h3 id="map-location-basic-title">Location details</h3>

              <div class="cms-map-grid">
                <label>
                  <span>Location type</span>
                  <select v-model="form.locationType" :aria-invalid="Boolean(errors.locationType)">
                    <option value="destination">Destination</option>
                    <option value="business">Business</option>
                    <option value="event">Event</option>
                  </select>
                  <small v-if="errors.locationType">{{ errors.locationType }}</small>
                </label>

                <label>
                  <span>Status</span>
                  <select v-model="form.status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <CmsRelationSelect v-if="form.locationType === 'destination'" v-model="form.destinationId" class="cms-map-relation-select" label="Linked destination" required :options="destinations" :error="errors.target" />
              <CmsRelationSelect v-if="form.locationType === 'business'" v-model="form.businessId" class="cms-map-relation-select" label="Linked business" required :options="businesses" :error="errors.target" />
              <CmsRelationSelect v-if="form.locationType === 'event'" v-model="form.eventId" class="cms-map-relation-select" label="Linked event" required :options="events" :error="errors.target" />

              <label>
                <span>Label</span>
                <input v-model="form.label" :aria-invalid="Boolean(errors.label)" />
                <small v-if="errors.label">{{ errors.label }}</small>
              </label>
            </section>

            <section class="cms-map-section cms-map-section--picker" aria-labelledby="map-location-coordinates-title">
              <div class="cms-map-section__title-row">
                <h3 id="map-location-coordinates-title">Coordinates</h3>
                <button class="cms-map-picker-toggle" type="button" @click="pickerOpen = !pickerOpen">
                  {{ pickerOpen ? 'Hide map picker' : 'Pick location on map' }}
                </button>
              </div>
              <p class="cms-map-helper">Map is centered on Calabanga. Click the exact location to place the marker.</p>
              <div v-if="pickerOpen" class="cms-map-picker-panel">
                <CmsMapPicker
                  :access-token="mapboxToken"
                  :latitude="form.latitude"
                  :longitude="form.longitude"
                  @select="applyPickedCoordinates"
                />
              </div>
              <CmsCoordinateField
                v-model:latitude="form.latitude"
                v-model:longitude="form.longitude"
                :latitude-error="errors.latitude"
                :longitude-error="errors.longitude"
              />
            </section>

            <details v-if="canUseAdvancedMapSettings" class="cms-map-advanced">
              <summary>Advanced Map Settings</summary>
              <div class="cms-map-advanced__body">
                <div class="cms-map-grid">
                  <label>
                    <span>Marker color</span>
                    <input v-model="form.markerColor" />
                  </label>
                  <label>
                    <span>Marker icon</span>
                    <input v-model="form.markerIcon" />
                  </label>
                </div>

                <div class="cms-map-grid">
                  <label>
                    <span>Mapbox place ID</span>
                    <input v-model="form.mapboxPlaceId" />
                  </label>
                  <label>
                    <span>Cluster group</span>
                    <input v-model="form.clusterGroup" />
                  </label>
                </div>

                <div class="cms-map-grid">
                  <label>
                    <span>Sort priority</span>
                    <input v-model="form.sortPriority" type="number" />
                  </label>

                  <div class="cms-map-grid cms-map-grid--checks">
                    <label class="cms-map-check">
                      <input v-model="form.isPrimary" type="checkbox" />
                      <span>Primary location</span>
                    </label>
                    <label class="cms-map-check">
                      <input v-model="form.isClusterable" type="checkbox" />
                      <span>Allow clustering</span>
                    </label>
                  </div>
                </div>

                <label>
                  <span>GeoJSON / Additional Map Data</span>
                  <textarea v-model="form.geojsonPropertiesText" rows="4" placeholder='{"key":"value"}'></textarea>
                  <em>Optional technical map data. Leave this blank unless instructed by the system administrator.</em>
                  <small v-if="errors.geojsonPropertiesText">{{ errors.geojsonPropertiesText }}</small>
                </label>
              </div>
            </details>

            <div v-if="serverError" class="cms-map-location-modal__error" role="alert">{{ serverError }}</div>
          </div>

          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="cms-map-location-modal__primary" type="submit" :disabled="busy">{{ busy ? 'Saving...' : 'Save map location' }}</button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.cms-map-location-modal {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.cms-map-location-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(920px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}

header,
footer {
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
}

footer {
  position: sticky;
  bottom: 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 0;
  background: #fff;
  box-shadow: 0 -8px 18px rgba(15, 23, 42, 0.04);
}

header button {
  display: grid;
  width: 34px;
  min-height: 34px;
  padding: 0;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
}

p,
h2,
h3 {
  margin: 0;
}

p {
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.18rem;
}

h3 {
  color: #0f172a;
  font-size: 0.9rem;
}

form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.cms-map-location-modal__body {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.95fr);
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.cms-map-section {
  display: grid;
  align-content: start;
  gap: 14px;
  min-width: 0;
}

.cms-map-section--picker {
  gap: 10px;
}

.cms-map-section__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.cms-map-section > label,
.cms-map-grid label,
.cms-map-grid :deep(label),
.cms-map-advanced__body > label,
:deep(.cms-map-relation-select) {
  display: grid;
  min-width: 0;
  gap: 6px;
}

label > span,
.cms-map-grid :deep(label > span),
:deep(.cms-map-relation-select > span) {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

input,
select,
textarea,
.cms-map-grid :deep(select),
:deep(.cms-map-relation-select select) {
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 7px 10px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}

textarea {
  line-height: 1.45;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus,
button:focus-visible,
.cms-map-grid :deep(select:focus),
:deep(.cms-map-relation-select select:focus) {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

input[aria-invalid='true'],
select[aria-invalid='true'],
.cms-map-grid :deep(select[aria-invalid='true']),
:deep(.cms-map-relation-select select[aria-invalid='true']) {
  border-color: #dc2626;
}

small,
.cms-map-grid :deep(small),
:deep(.cms-map-relation-select small) {
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.35;
}

.cms-map-helper {
  margin: -2px 0 2px;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
  text-transform: none;
}

.cms-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 12px;
  min-width: 0;
}

.cms-map-grid--checks {
  align-items: center;
}

.cms-map-check {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  color: #334155;
  font-weight: 800;
}

.cms-map-check span {
  min-width: 0;
  color: #334155;
  font-size: 0.84rem;
}

.cms-map-check input {
  width: 16px;
  min-height: 16px;
}

.cms-map-section :deep(.cms-coordinate-field),
.cms-map-picker-panel {
  margin-inline: 0;
}

.cms-map-picker-toggle {
  min-height: 36px;
  padding: 0 12px;
  color: #075985;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  font: inherit;
  font-weight: 800;
}

.cms-map-advanced {
  grid-column: 1 / -1;
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.cms-map-advanced summary {
  min-height: 42px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #0f172a;
  cursor: pointer;
  font-weight: 900;
}

.cms-map-advanced summary:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 2px;
}

.cms-map-advanced__body {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 0 12px 12px;
}

.cms-map-advanced em {
  color: #64748b;
  font-size: 0.8rem;
  font-style: normal;
  line-height: 1.4;
}

.cms-map-location-modal__error {
  grid-column: 1 / -1;
  padding: 10px 12px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
}

button {
  min-height: 36px;
  padding: 0 13px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 800;
}

.cms-map-location-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 640px) {
  .cms-map-location-modal {
    padding: 10px;
  }

  .cms-map-location-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer {
    padding: 12px 14px;
  }

  .cms-map-location-modal__body {
    grid-template-columns: 1fr;
    padding: 14px;
  }
}

@media (max-width: 460px) {
  footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  footer button {
    width: 100%;
  }
}
</style>
