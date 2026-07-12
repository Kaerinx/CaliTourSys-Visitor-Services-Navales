<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { hasMapboxPublicToken, mapboxAccessToken } from "@/config/mapbox";

const CALABANGA_CENTER = [123.2469, 13.7069];
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;
const TILE_SIZE = 256;
const FALLBACK_TILE_SPREAD = 2;

const props = defineProps({
  address: { type: String, default: "" },
  latitude: { type: [String, Number], default: "" },
  longitude: { type: [String, Number], default: "" },
});

const emit = defineEmits(["update:latitude", "update:longitude", "update:address"]);

const accessToken = mapboxAccessToken;
const mapContainer = ref(null);
const mapLoadError = ref("");
const locationError = ref("");
const mapReady = ref(false);
const fallbackZoom = ref(13);

let map = null;
let marker = null;
let resizeObserver = null;

const selectedCoordinates = computed(() => {
  if (props.latitude === "" || props.longitude === "") return null;

  const latitude = Number(props.latitude);
  const longitude = Number(props.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [longitude, latitude];
});
const fallbackCenter = computed(() => selectedCoordinates.value || CALABANGA_CENTER);
const fallbackTileFrame = computed(() => lngLatToTile(fallbackCenter.value[0], fallbackCenter.value[1], fallbackZoom.value));
const fallbackTiles = computed(() => {
  const centerTile = fallbackTileFrame.value;
  const baseX = Math.floor(centerTile.x);
  const baseY = Math.floor(centerTile.y);
  const tiles = [];

  for (let xOffset = -FALLBACK_TILE_SPREAD; xOffset <= FALLBACK_TILE_SPREAD; xOffset += 1) {
    for (let yOffset = -FALLBACK_TILE_SPREAD; yOffset <= FALLBACK_TILE_SPREAD; yOffset += 1) {
      const x = baseX + xOffset;
      const y = baseY + yOffset;
      tiles.push({
        key: `${fallbackZoom.value}-${x}-${y}`,
        src: `https://tile.openstreetmap.org/${fallbackZoom.value}/${x}/${y}.png`,
        style: {
          left: `calc(50% + ${(x - centerTile.x) * TILE_SIZE}px)`,
          top: `calc(50% + ${(y - centerTile.y) * TILE_SIZE}px)`,
        },
      });
    }
  }

  return tiles;
});

function setCoordinates(latitude, longitude) {
  emit("update:latitude", Number(latitude).toFixed(6));
  emit("update:longitude", Number(longitude).toFixed(6));
}

function coordinateAddress(latitude, longitude) {
  return `Lat ${Number(latitude).toFixed(6)}, Lng ${Number(longitude).toFixed(6)}`;
}

function lngLatToTile(longitude, latitude, zoom) {
  const scale = 2 ** zoom;
  const latitudeRadians = (latitude * Math.PI) / 180;
  return {
    x: ((longitude + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) * scale,
  };
}

function tileToLngLat(x, y, zoom) {
  const scale = 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const latitudeRadians = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale)));
  const latitude = (latitudeRadians * 180) / Math.PI;
  return { lng: longitude, lat: latitude };
}

function clampFallbackZoom(zoom) {
  return Math.min(17, Math.max(11, zoom));
}

async function reverseGeocode(latitude, longitude) {
  if (!hasMapboxPublicToken) {
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
  if (!hasMapboxPublicToken || !mapContainer.value || map) return;

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

function selectFallbackCoordinates(event) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const xOffset = (event.clientX - bounds.left - bounds.width / 2) / TILE_SIZE;
  const yOffset = (event.clientY - bounds.top - bounds.height / 2) / TILE_SIZE;
  const centerTile = fallbackTileFrame.value;
  const lngLat = tileToLngLat(centerTile.x + xOffset, centerTile.y + yOffset, fallbackZoom.value);

  selectCoordinates(lngLat);
}

function adjustFallbackZoom(delta) {
  fallbackZoom.value = clampFallbackZoom(fallbackZoom.value + delta);
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
    <div
      v-if="hasMapboxPublicToken && !mapLoadError"
      ref="mapContainer"
      class="establishment-location-picker__map"
    ></div>
    <div
      v-else-if="!hasMapboxPublicToken"
      class="establishment-location-picker__map establishment-location-picker__tile-map"
      role="button"
      tabindex="0"
      aria-label="Click to select establishment coordinates"
      @click="selectFallbackCoordinates"
    >
      <img
        v-for="tile in fallbackTiles"
        :key="tile.key"
        class="establishment-location-picker__tile"
        :src="tile.src"
        :style="tile.style"
        alt=""
        draggable="false"
      />
      <span v-if="selectedCoordinates" class="establishment-location-picker__pin" aria-hidden="true"></span>
      <div class="establishment-location-picker__zoom" aria-label="Map zoom controls">
        <button type="button" aria-label="Zoom in" @click.stop="adjustFallbackZoom(1)">+</button>
        <button type="button" aria-label="Zoom out" @click.stop="adjustFallbackZoom(-1)">-</button>
      </div>
      <span class="establishment-location-picker__attribution">© OpenStreetMap contributors</span>
    </div>
    <div v-else class="establishment-location-picker__fallback">
      <strong>Map unavailable</strong>
      <span>{{ mapLoadError }}</span>
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

.establishment-location-picker__tile-map {
  position: relative;
  cursor: crosshair;
  user-select: none;
}

.establishment-location-picker__tile {
  position: absolute;
  width: 256px;
  height: 256px;
  max-width: none;
  transform: translate(-50%, -50%);
}

.establishment-location-picker__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 22px;
  height: 22px;
  border: 3px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  background: #176249;
  box-shadow: 0 4px 10px rgba(23, 63, 50, 0.28);
  transform: translate(-50%, -100%) rotate(-45deg);
}

.establishment-location-picker__pin::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #ffffff;
  content: "";
  transform: translate(-50%, -50%);
}

.establishment-location-picker__zoom {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  overflow: hidden;
  border: 1px solid #b9c9c1;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(23, 63, 50, 0.14);
}

.establishment-location-picker__zoom button {
  display: grid;
  width: 34px;
  height: 32px;
  place-items: center;
  border: 0;
  border-bottom: 1px solid #d7e1dc;
  background: #ffffff;
  color: #173f32;
  font: inherit;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
}

.establishment-location-picker__zoom button:last-child {
  border-bottom: 0;
}

.establishment-location-picker__zoom button:hover {
  background: #edf7f2;
}

.establishment-location-picker__attribution {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 3;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.86);
  color: #173f32;
  font-size: 11px;
  line-height: 1.2;
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
