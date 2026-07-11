<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const CALABANGA_CENTER = [123.2469, 13.7069];
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;

const props = defineProps({
  address: { type: String, default: "" },
  latitude: { type: [String, Number], default: "" },
  longitude: { type: [String, Number], default: "" },
});

const emit = defineEmits(["update:latitude", "update:longitude", "update:address"]);

const accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "";
const mapContainer = ref(null);
const mapLoadError = ref("");
const locationError = ref("");
const mapReady = ref(false);

let map = null;
let marker = null;
let resizeObserver = null;

const hasValidToken = computed(() => accessToken.startsWith("pk."));
const selectedCoordinates = computed(() => {
  const latitude = Number(props.latitude);
  const longitude = Number(props.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [longitude, latitude];
});

function setCoordinates(latitude, longitude) {
  emit("update:latitude", Number(latitude).toFixed(6));
  emit("update:longitude", Number(longitude).toFixed(6));
}

function coordinateAddress(latitude, longitude) {
  return `Lat ${Number(latitude).toFixed(6)}, Lng ${Number(longitude).toFixed(6)}`;
}

async function reverseGeocode(latitude, longitude) {
  if (!hasValidToken.value) {
    return coordinateAddress(latitude, longitude);
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "PH",
    limit: "1",
    language: "en",
    types: "address,poi,place,locality,neighborhood",
  });

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params}`,
    );
    if (!response.ok) return coordinateAddress(latitude, longitude);

    const data = await response.json();
    return data.features?.[0]?.place_name || coordinateAddress(latitude, longitude);
  } catch {
    return coordinateAddress(latitude, longitude);
  }
}

async function selectCoordinates(lngLat, updateAddress = true) {
  locationError.value = "";
  setCoordinates(lngLat.lat, lngLat.lng);
  if (updateAddress) {
    emit("update:address", await reverseGeocode(lngLat.lat, lngLat.lng));
  }
}

function syncMarker() {
  if (!map || !mapReady.value) return;

  const coordinates = selectedCoordinates.value;
  if (!coordinates) {
    marker?.remove();
    marker = null;
    return;
  }

  if (!marker) {
    marker = new mapboxgl.Marker({ color: "#176249" }).setLngLat(coordinates).addTo(map);
  } else {
    marker.setLngLat(coordinates);
  }

  map.easeTo({ center: coordinates, zoom: Math.max(map.getZoom(), SELECTED_ZOOM), duration: 250 });
}

async function initializeMap() {
  if (!hasValidToken.value || !mapContainer.value || map) return;

  try {
    mapboxgl.accessToken = accessToken;
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: "mapbox://styles/mapbox/streets-v12",
      center: selectedCoordinates.value || CALABANGA_CENTER,
      zoom: selectedCoordinates.value ? SELECTED_ZOOM : DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      mapReady.value = true;
      map.resize();
      syncMarker();
    });
    map.on("click", (event) => selectCoordinates(event.lngLat));
    map.on("error", (event) => {
      const message = String(event?.error?.message || "");
      if (!mapReady.value && message.toLowerCase().includes("token")) {
        mapLoadError.value = "Mapbox token rejected.";
      }
    });

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => map?.resize());
      resizeObserver.observe(mapContainer.value);
    }
  } catch {
    mapLoadError.value = "Map unavailable.";
  }
}

function useCurrentLocation() {
  locationError.value = "";

  if (!navigator.geolocation) {
    locationError.value = "Location unavailable.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      await selectCoordinates({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    () => {
      locationError.value = "Location unavailable.";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

watch(selectedCoordinates, syncMarker);

onMounted(async () => {
  await nextTick();
  initializeMap();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  marker?.remove();
  map?.remove();
  map = null;
});
</script>

<template>
  <section class="establishment-location-picker" aria-label="Establishment coordinates">
    <div v-if="hasValidToken && !mapLoadError" ref="mapContainer" class="establishment-location-picker__map"></div>
    <div v-else class="establishment-location-picker__fallback">
      <strong>Map unavailable</strong>
      <span>{{ mapLoadError || "Mapbox token is not configured." }}</span>
    </div>

    <div class="establishment-location-picker__fields">
      <label>
        Latitude *
        <input
          :value="latitude"
          type="number"
          min="-90"
          max="90"
          step="0.000001"
          required
          @input="$emit('update:latitude', $event.target.value)"
        />
      </label>
      <label>
        Longitude *
        <input
          :value="longitude"
          type="number"
          min="-180"
          max="180"
          step="0.000001"
          required
          @input="$emit('update:longitude', $event.target.value)"
        />
      </label>
      <button class="establishment-location-picker__button" type="button" @click="useCurrentLocation">
        Use current location
      </button>
    </div>
    <p v-if="locationError" class="establishment-location-picker__error">{{ locationError }}</p>
  </section>
</template>

<style scoped>
.establishment-location-picker {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.establishment-location-picker__map,
.establishment-location-picker__fallback {
  min-height: 280px;
  overflow: hidden;
  border: 1px solid #b9c9c1;
  border-radius: 6px;
  background: #e6eee9;
}

.establishment-location-picker__fallback {
  display: grid;
  place-content: center;
  gap: 6px;
  padding: 24px;
  color: #52665e;
  text-align: center;
}

.establishment-location-picker__fallback strong {
  color: #173f32;
}

.establishment-location-picker__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: end;
}

.establishment-location-picker__button {
  min-height: 44px;
  padding: 9px 14px;
  border: 1px solid #176249;
  border-radius: 5px;
  background: #ffffff;
  color: #174d3d;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.establishment-location-picker__button:hover {
  background: #edf7f2;
}

.establishment-location-picker__error {
  margin: 0;
  color: #762816;
  font-size: 13px;
  font-weight: 700;
}

:deep(.mapboxgl-ctrl-group) {
  overflow: hidden;
  border-radius: 8px;
}

@media (max-width: 720px) {
  .establishment-location-picker__fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
