<script setup>
import AccreditationBadge from "../components/AccreditationBadge.vue";
import LocationImageCarousel from "../components/LocationImageCarousel.vue";
import PromotionNavbar from "../components/PromotionNavbar.vue";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getEmergencyFacilitiesGeoJson,
  getMapLocationGeoJson,
  getMapLocationDetails,
  getPromotionalPackages,
  getTourismAssets,
} from "../services/promotionService";
import { formatRouteDuration, getRoute } from "../services/mapboxDirections";
import {
  getTravelEstimates,
  hasTravelEstimate,
} from "../services/travelEstimates";
import { useGeolocationStore } from "@/stores/geolocation";
import { mapboxAccessToken } from "@/config/mapbox";

const TouristMapBox = defineAsyncComponent(
  () => import("../components/TouristMapBox.vue"),
);
const ReviewsSection = defineAsyncComponent(
  () => import("../components/ReviewsSection.vue"),
);
const NearbySuggestions = defineAsyncComponent(
  () => import("../components/NearbySuggestions.vue"),
);

const mapboxToken = mapboxAccessToken;

const route = useRoute();
const router = useRouter();
const geo = useGeolocationStore();

const routeGeoJson = ref(null);
const routeEstimates = ref(null);
const isRouting = ref(false);
let routeRequestId = 0;
let routingController = null;

const detailCache = new Map();
const selectedDetails = ref(null);
const isDetailLoading = ref(false);
const detailError = ref("");
let detailRequestId = 0;
let detailController = null;
const detailDrawer = ref(null);
let detailPreviouslyFocused = null;

// Fixed public discovery filter taxonomy. Counts are derived from live data,
// but the set of categories (and their order/colors) is curated here.
const FILTER_CATEGORIES = [
  { key: "Faith & Religious", color: "#7c3aed" },
  { key: "Food", color: "#d97706" },
  { key: "Nature", color: "#1b7a4a" },
  { key: "Beach", color: "#2563eb" },
  { key: "Cafe", color: "#92400e" },
];

const REVIEW_TARGET_BY_LOCATION_TYPE = Object.freeze({
  destination: "destination",
  business: "business",
  "tourism asset": "tourism_asset",
});

const locations = ref([]);
const bookablePackages = ref([]);

const categories = computed(() => {
  const knownCategories = new Set(
    FILTER_CATEGORIES.map((category) => category.key),
  );
  const extraCategories = [];

  locations.value.forEach((location) => {
    if (!location.category || knownCategories.has(location.category)) return;
    knownCategories.add(location.category);
    extraCategories.push({
      key: location.category,
      color: location.color || "#1b4332",
    });
  });

  return [...FILTER_CATEGORIES, ...extraCategories].map((category) => ({
    ...category,
    count: locations.value.filter(
      (location) => location.category === category.key,
    ).length,
  }));
});

const searchQuery = ref("");
const selectedId = ref("");
const enabledCategories = ref({});
const hasFilterInteraction = ref(false);
const showDetail = ref(false);
const mobileListCollapsed = ref(false);
const feedbackMessage = ref("");
const isLoading = ref(true);
const errorMessage = ref("");
const mapRuntimeError = ref("");
const mapGeoJson = ref({ type: "FeatureCollection", features: [] });
const emergencyGeoJson = ref({ type: "FeatureCollection", features: [] });

const visibleLocations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return locations.value.filter((location) => {
    const matchesCategory = enabledCategories.value[location.category];
    const matchesQuery =
      !query ||
      [location.name, location.category, location.distance]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return matchesCategory && matchesQuery;
  });
});

const hasActiveFilters = computed(() => {
  const allCategoriesChecked = categories.value.every(
    (category) => enabledCategories.value[category.key],
  );
  return Boolean(searchQuery.value.trim()) || !allCategoriesChecked;
});

const selectedLocation = computed(
  () =>
    visibleLocations.value.find(
      (location) => location.id === selectedId.value,
    ) || visibleLocations.value[0],
);

const selectedLocationTypeLabel = computed(() =>
  selectedLocation.value?.locationType
    ? selectedLocation.value.locationType.replace("-", " ")
    : "map location",
);

const supportsRichDetails = computed(() =>
  ["destination", "business"].includes(selectedLocation.value?.locationType),
);

const detailGallery = computed(() => {
  if (supportsRichDetails.value && selectedDetails.value?.gallery?.length) {
    return selectedDetails.value.gallery;
  }
  return selectedLocation.value?.imageUrl
    ? [
        {
          id: "summary-image",
          url: selectedLocation.value.imageUrl,
          alt: selectedLocation.value.name,
        },
      ]
    : [];
});

const detailOverview = computed(
  () =>
    selectedDetails.value?.overview ||
    selectedLocation.value?.description ||
    "",
);

const primaryBookPackage = computed(
  () =>
    selectedDetails.value?.primaryPackage ||
    packageForTourismAsset(selectedLocation.value),
);

const hasEmergencyFacilities = computed(
  () => (emergencyGeoJson.value.features || []).length > 0,
);

const reviewTargetType = computed(
  () =>
    REVIEW_TARGET_BY_LOCATION_TYPE[selectedLocation.value?.locationType] ||
    null,
);

const canReviewSelectedLocation = computed(() =>
  Boolean(selectedLocation.value?.apiId && reviewTargetType.value),
);

function displayValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(
        ([, entry]) => entry !== undefined && entry !== null && entry !== "",
      )
      .map(
        ([key, entry]) =>
          `${key.replace(/([A-Z])/g, " $1")}: ${displayValue(entry)}`,
      )
      .join(" · ");
  }
  return value ? String(value) : "";
}

const visibleMapGeoJson = computed(() => {
  const visibleIds = new Set(
    visibleLocations.value.map((location) => location.id),
  );

  return {
    type: "FeatureCollection",
    features: (mapGeoJson.value.features || []).filter((feature) =>
      visibleIds.has(
        String(feature.properties?.slug || feature.properties?.id || ""),
      ),
    ),
  };
});

function locationFromFeature(feature, index, destinationBySlug) {
  const properties = feature.properties || {};
  const coordinates = feature.geometry?.coordinates || [];
  const slug = String(
    properties.slug || properties.id || `map-location-${index}`,
  );
  const destination = destinationBySlug.get(slug);
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  const color = properties.markerColor || destination?.color || "#1b4332";

  return {
    id: slug,
    apiId: properties.targetId || destination?.apiId || null,
    mapLocationId: properties.id,
    slug,
    name: properties.label || destination?.name || "Tourism location",
    category:
      properties.category ||
      destination?.category ||
      properties.locationType ||
      "Tourism",
    color,
    distance: properties.locationType
      ? properties.locationType.replace("-", " ")
      : "Map-ready",
    address:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : "Calabanga, Camarines Sur",
    hours: destination?.hours || "Visiting information to be confirmed",
    description:
      properties.description ||
      destination?.description ||
      "Public map discovery details are being prepared.",
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude,
    longitude,
    locationType: properties.locationType,
    imageUrl: properties.primaryImage || destination?.imageUrl,
    accredited: properties.accredited ?? destination?.accredited ?? true,
  };
}

function locationFromTourismAsset(asset, index) {
  const latitude = Number(asset.latitude);
  const longitude = Number(asset.longitude);

  return {
    id: asset.id,
    apiId: asset.apiId || asset.id,
    slug: asset.slug || asset.id,
    name: asset.name,
    category: asset.category || "Tourism",
    color: asset.color || "#1b4332",
    distance: asset.distance || "Product Development asset",
    address: asset.address || "Calabanga, Camarines Sur",
    hours: asset.hours || "Visiting information to be confirmed",
    description:
      asset.description || "Tourism asset details are being prepared.",
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    locationType: "tourism asset",
    imageUrl: asset.imageUrl,
    accredited: asset.accredited ?? true,
  };
}

function packageItemReferenceIds(tourismPackage) {
  return (tourismPackage?.items || [])
    .flatMap((item) => [
      item.referenceId,
      item.reference_id,
      item.itemReferenceId,
      item.item_reference_id,
      item.assetId,
      item.asset_id,
    ])
    .filter(Boolean)
    .map(String);
}

function packageForTourismAsset(location) {
  if (!location || location.locationType !== "tourism asset") return null;
  const assetIds = [location.apiId, location.id, location.slug]
    .filter(Boolean)
    .map(String);

  return (
    bookablePackages.value.find((tourismPackage) => {
      const references = packageItemReferenceIds(tourismPackage);
      return assetIds.some((id) => references.includes(id));
    }) || null
  );
}

function featureFromAssetLocation(location) {
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  )
    return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
    },
    properties: {
      id: location.id,
      slug: location.id,
      label: location.name,
      category: location.category,
      markerColor: location.color,
      primaryImage: location.imageUrl,
      locationType: location.locationType,
      accredited: location.accredited,
      description: location.description,
    },
  };
}

function detailKey(location) {
  return String(location?.mapLocationId || "");
}

function invalidateDetailRequest() {
  detailRequestId += 1;
  detailController?.abort();
  detailController = null;
  isDetailLoading.value = false;
}

async function loadLocationDetails(location) {
  invalidateDetailRequest();
  selectedDetails.value = null;
  detailError.value = "";

  if (!["destination", "business"].includes(location?.locationType)) return;

  const key = detailKey(location);
  if (!key) {
    detailError.value =
      "More information for this location has not been linked yet.";
    return;
  }

  if (detailCache.has(key)) {
    selectedDetails.value = detailCache.get(key);
    return;
  }

  const requestId = ++detailRequestId;
  const controller = new AbortController();
  detailController = controller;
  isDetailLoading.value = true;

  try {
    const details = await getMapLocationDetails(key, {
      signal: controller.signal,
    });
    if (
      requestId !== detailRequestId ||
      selectedLocation.value?.id !== location.id
    )
      return;
    detailCache.set(key, details);
    selectedDetails.value = details;
  } catch (error) {
    if (error?.name === "AbortError") return;
    if (
      requestId !== detailRequestId ||
      selectedLocation.value?.id !== location.id
    )
      return;
    detailError.value =
      error.message || "Detailed visitor information is unavailable right now.";
  } finally {
    if (requestId === detailRequestId) {
      isDetailLoading.value = false;
      detailController = null;
    }
  }
}

function selectLocation(id) {
  if (id !== selectedId.value) {
    clearRoute();
    invalidateDetailRequest();
    selectedDetails.value = null;
    detailError.value = "";
  }
  selectedId.value = id;
  if (!id) return;
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      location: id,
    },
  });

  if (showDetail.value) {
    const location = locations.value.find((item) => item.id === id);
    if (location) loadLocationDetails(location);
  }
}

function openLocationDetail(id) {
  const wasOpen = showDetail.value;
  if (id) selectLocation(id);
  showDetail.value = true;
  if (!wasOpen && selectedLocation.value)
    loadLocationDetails(selectedLocation.value);
}

function closeLocationDetail() {
  showDetail.value = false;
  invalidateDetailRequest();
}

function detailFocusableElements() {
  if (!detailDrawer.value) return [];
  return [
    ...detailDrawer.value.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => !element.hidden && element.offsetParent !== null);
}

function handleDetailKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeLocationDetail();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = detailFocusableElements();
  if (!focusable.length) {
    event.preventDefault();
    detailDrawer.value?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !detailDrawer.value?.contains(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function toggleMobileList() {
  mobileListCollapsed.value = !mobileListCollapsed.value;
}

function toggleCategory(category) {
  hasFilterInteraction.value = true;
  enabledCategories.value = {
    ...enabledCategories.value,
    [category]: !enabledCategories.value[category],
  };
}

function resetFilters() {
  hasFilterInteraction.value = true;
  searchQuery.value = "";
  enabledCategories.value = Object.fromEntries(
    categories.value.map((category) => [category.key, true]),
  );
}

function clearCategories() {
  hasFilterInteraction.value = true;
  enabledCategories.value = Object.fromEntries(
    categories.value.map((category) => [category.key, false]),
  );
}

async function loadLocations() {
  isLoading.value = true;
  errorMessage.value = "";
  mapRuntimeError.value = "";

  try {
    const [
      tourismAssetData,
      mapLocationData,
      emergencyFacilityData,
      packageData,
    ] =
      await Promise.all([
        getTourismAssets({ limit: 50, sort: "-updatedAt" }),
        getMapLocationGeoJson(),
        getEmergencyFacilitiesGeoJson(),
        getPromotionalPackages(),
      ]);
    const mapFeatures = Array.isArray(mapLocationData?.features)
      ? mapLocationData.features
      : [];
    const destinationBySlug = new Map();
    tourismAssetData.forEach((asset) => {
      if (asset.id) destinationBySlug.set(String(asset.id), asset);
      if (asset.slug) destinationBySlug.set(String(asset.slug), asset);
    });

    const locationData = mapFeatures.length
      ? mapFeatures.map((feature, index) =>
          locationFromFeature(feature, index, destinationBySlug),
        )
      : tourismAssetData.map((asset, index) =>
          locationFromTourismAsset(asset, index),
        );

    mapGeoJson.value = mapFeatures.length
      ? mapLocationData
      : {
          type: "FeatureCollection",
          features: locationData.map(featureFromAssetLocation).filter(Boolean),
    };
    emergencyGeoJson.value = emergencyFacilityData;
    bookablePackages.value = packageData;
    locations.value = locationData;
    enabledCategories.value = Object.fromEntries(
      categories.value.map((category) => [category.key, true]),
    );
    selectedId.value = String(
      route.query.location || locationData[0]?.id || "",
    );
  } catch (error) {
    errorMessage.value =
      error.message || "Unable to load public map locations.";
  } finally {
    isLoading.value = false;
  }
}

function clearRoute() {
  routeRequestId += 1;
  routingController?.abort();
  routingController = null;
  routeGeoJson.value = null;
  routeEstimates.value = null;
  isRouting.value = false;
  feedbackMessage.value = "";
}

function bookPrimaryPackage() {
  if (!primaryBookPackage.value?.slug) return;
  router.push(`/packages/${encodeURIComponent(primaryBookPackage.value.slug)}`);
}

async function getDirections(location) {
  if (!location) return;

  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    feedbackMessage.value =
      "This place has no map coordinates yet, so directions are unavailable.";
    return;
  }

  routingController?.abort();
  const requestId = ++routeRequestId;
  routingController = new AbortController();
  const { signal } = routingController;
  routeGeoJson.value = null;
  routeEstimates.value = null;
  isRouting.value = true;
  feedbackMessage.value = "Getting your location…";

  const origin = await geo.requestLocation();
  if (requestId !== routeRequestId || signal.aborted) return;

  if (!origin) {
    isRouting.value = false;
    routingController = null;
    feedbackMessage.value =
      geo.error ||
      "Enable location access to get directions from where you are.";
    return;
  }

  feedbackMessage.value = "Calculating walking, car, and motorcycle estimates…";
  const estimates = await getTravelEstimates(origin, location, {
    routeClient: getRoute,
    signal,
  });

  if (requestId !== routeRequestId || signal.aborted) return;

  isRouting.value = false;
  routingController = null;

  if (!hasTravelEstimate(estimates)) {
    feedbackMessage.value =
      "We could not calculate a route right now. Please try again.";
    return;
  }

  // Only the regular driving route owns map geometry. ETA state is deliberately
  // separate so partial profile responses never redraw or refit the route.
  routeGeoJson.value = estimates.driving;
  routeEstimates.value = {
    destinationName: location.name,
    ...estimates,
  };
  feedbackMessage.value = "";
  showDetail.value = false;
  invalidateDetailRequest();
}

watch(searchQuery, () => {
  if (searchQuery.value.trim()) hasFilterInteraction.value = true;
});

watch(showDetail, async (isOpen) => {
  if (isOpen) {
    detailPreviouslyFocused = document.activeElement;
    await nextTick();
    if (!showDetail.value) return;
    const firstFocusable = detailFocusableElements()[0];
    if (firstFocusable) firstFocusable.focus();
    else detailDrawer.value?.focus();
    return;
  }

  await nextTick();
  if (showDetail.value) return;
  if (detailPreviouslyFocused?.isConnected) detailPreviouslyFocused.focus();
  detailPreviouslyFocused = null;
});

onMounted(() => {
  loadLocations();
});

onBeforeUnmount(() => {
  routeRequestId += 1;
  routingController?.abort();
  invalidateDetailRequest();
  if (detailPreviouslyFocused?.isConnected) detailPreviouslyFocused.focus();
});
</script>

<template>
  <div class="discovery-page">
    <PromotionNavbar />

    <main class="discovery-shell">
      <aside
        class="discovery-sidebar"
        :class="{ 'discovery-sidebar--collapsed': mobileListCollapsed }"
        :inert="showDetail"
        :aria-hidden="showDetail ? 'true' : undefined"
      >
        <button
          type="button"
          class="sheet-handle"
          :aria-label="mobileListCollapsed ? 'Expand list' : 'Collapse list'"
          @click="toggleMobileList"
        >
          <span class="sheet-handle__bar"></span>
        </button>

        <section class="sidebar-block sidebar-block--search">
          <h1>Discover</h1>
          <label class="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              v-model="searchQuery"
              placeholder="Search places, food, crafts..."
            />
          </label>
        </section>

        <section class="sidebar-block">
          <div class="filter-heading">
            <h2>Filter results</h2>
            <span>
              <button type="button" @click="clearCategories">Clear all</button>
              <button type="button" @click="resetFilters">Reset</button>
            </span>
          </div>

          <div class="filter-list">
            <label
              v-for="category in categories"
              :key="category.key"
              class="filter-row"
              role="checkbox"
              tabindex="0"
              :aria-checked="Boolean(enabledCategories[category.key])"
              @click="toggleCategory(category.key)"
              @keydown.enter.prevent="toggleCategory(category.key)"
              @keydown.space.prevent="toggleCategory(category.key)"
            >
              <span
                class="fake-checkbox"
                :class="{
                  'fake-checkbox--off': !enabledCategories[category.key],
                }"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
              <span
                class="category-dot"
                :style="{ backgroundColor: category.color }"
              ></span>
              <span>{{ category.key }}</span>
              <small>{{ category.count }}</small>
            </label>
          </div>
        </section>

        <section class="results-block">
          <p v-if="isLoading">Loading public locations...</p>
          <p v-else-if="errorMessage">{{ errorMessage }}</p>
          <p v-else>Showing {{ visibleLocations.length }} locations</p>
          <div class="result-list">
            <div
              v-if="
                !isLoading &&
                visibleLocations.length === 0 &&
                (hasFilterInteraction || hasActiveFilters)
              "
              class="map-empty-state"
            >
              <strong>No locations match your filters.</strong>
              <span>Try selecting more categories.</span>
            </div>
            <div
              v-else-if="!isLoading && visibleLocations.length === 0"
              class="map-empty-state"
            >
              <strong>No published map locations yet</strong>
              <span
                >Published tourism places will appear here once available.</span
              >
            </div>
            <button
              v-for="location in visibleLocations"
              :key="location.id"
              class="result-card"
              :class="{
                'result-card--selected': location.id === selectedLocation?.id,
              }"
              @click="selectLocation(location.id)"
            >
              <span
                class="result-thumb"
                :style="{ '--thumb-color': location.color }"
              ></span>
              <span class="result-card__copy">
                <strong>{{ location.name }}</strong>
                <span class="category-badge">{{ location.category }}</span>
                <span class="result-meta">
                  <span>{{ location.distance }}</span>
                </span>
              </span>
            </button>
          </div>
        </section>
      </aside>

      <section
        class="map-area"
        aria-label="Interactive tourist map"
        :inert="showDetail"
        :aria-hidden="showDetail ? 'true' : undefined"
      >
        <TouristMapBox
          :access-token="mapboxToken"
          :feature-collection="visibleMapGeoJson"
          :emergency-feature-collection="emergencyGeoJson"
          :selected-id="selectedLocation?.id || ''"
          :route="routeGeoJson"
          :loading="isLoading"
          :error="errorMessage"
          :empty-title="
            hasFilterInteraction || hasActiveFilters
              ? 'No locations match your filters.'
              : 'Asset coordinates not set yet'
          "
          :empty-text="
            hasFilterInteraction || hasActiveFilters
              ? 'Try selecting more categories.'
              : 'Product Development assets are listed here. Add map coordinates later to place them on the map.'
          "
          @select="selectLocation"
          @request-details="openLocationDetail"
          @map-error="mapRuntimeError = $event"
        />

        <div class="map-badge">
          <strong>Calabanga</strong>
          <span>&middot; Camarines Sur</span>
        </div>

        <div class="map-actions">
          <button
            type="button"
            disabled
            title="Map layers will be refined in a later phase"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16l-6.5 7.2V18l-3 1v-6.8L4 5Z" />
            </svg>
            Mapbox
          </button>
          <RouterLink to="/products">Browse Products</RouterLink>
          <button
            v-if="routeGeoJson || routeEstimates"
            type="button"
            class="map-actions__clear"
            @click="clearRoute"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            Clear route
          </button>
        </div>

        <div class="map-legend">
          <span v-for="category in categories" :key="category.key">
            <i :style="{ backgroundColor: category.color }"></i>
            {{ category.key }}
          </span>
          <span v-if="hasEmergencyFacilities">
            <i class="map-legend__emergency">+</i>
            Emergency services
          </span>
        </div>

        <section
          v-if="routeEstimates"
          class="travel-estimates"
          aria-label="Estimated travel times"
          aria-live="polite"
        >
          <header class="travel-estimates__header">
            <div>
              <span>Estimated travel time</span>
              <strong>{{ routeEstimates.destinationName }}</strong>
            </div>
            <button
              type="button"
              aria-label="Clear route and travel times"
              @click="clearRoute"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <div class="travel-estimates__modes">
            <article>
              <span class="travel-estimates__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="4" r="2" />
                  <path d="m10 22 1-7-3-3 2-5 4 3 3 1M14 22l-2-7 2-5" />
                </svg>
              </span>
              <span>Walking</span>
              <strong>{{
                routeEstimates.walking
                  ? formatRouteDuration(routeEstimates.walking.duration)
                  : "Unavailable"
              }}</strong>
            </article>
            <article>
              <span class="travel-estimates__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m5 17-1-5 2-5h12l2 5-1 5M6 12h12M7 17v2M17 17v2" />
                  <circle cx="7" cy="15" r="1" />
                  <circle cx="17" cy="15" r="1" />
                </svg>
              </span>
              <span>Car</span>
              <strong>{{
                routeEstimates.driving
                  ? formatRouteDuration(routeEstimates.driving.duration)
                  : "Unavailable"
              }}</strong>
            </article>
            <article>
              <span class="travel-estimates__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="6" cy="17" r="3" />
                  <circle cx="18" cy="17" r="3" />
                  <path d="m9 17 3-7h4l2 7M10 13H7l-2-3M14 7h3" />
                </svg>
              </span>
              <span>Motorcycle estimate</span>
              <strong>{{
                routeEstimates.motorcycle
                  ? formatRouteDuration(routeEstimates.motorcycle.duration)
                  : "Unavailable"
              }}</strong>
            </article>
          </div>
          <p>Motorcycle time uses Mapbox's live-traffic driving estimate.</p>
        </section>

        <div
          v-if="mapRuntimeError"
          class="feedback-toast feedback-toast--warning"
        >
          {{ mapRuntimeError }}
        </div>
        <div v-if="feedbackMessage" class="feedback-toast">
          {{ feedbackMessage }}
        </div>
      </section>

      <div
        v-if="showDetail && selectedLocation"
        class="detail-backdrop"
        @click="closeLocationDetail"
      ></div>

      <aside
        v-if="showDetail && selectedLocation"
        ref="detailDrawer"
        class="detail-drawer"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="`${selectedLocation.name} details`"
        @keydown="handleDetailKeydown"
      >
        <div class="detail-drawer__gallery">
          <LocationImageCarousel
            :images="detailGallery"
            :label="selectedLocation.name"
            :accent="selectedLocation.color"
          />
          <button
            type="button"
            class="detail-drawer__close"
            aria-label="Close details"
            @click="closeLocationDetail"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <AccreditationBadge floating />
        </div>

        <div class="detail-drawer__body">
          <div class="detail-drawer__meta">
            <span class="category-badge">{{ selectedLocation.category }}</span>
            <span>{{ selectedLocationTypeLabel }}</span>
          </div>
          <h2>{{ selectedLocation.name }}</h2>

          <p
            v-if="isDetailLoading"
            class="detail-drawer__load-state"
            aria-live="polite"
          >
            Loading visitor information…
          </p>
          <p v-else-if="detailError" class="detail-drawer__error" role="alert">
            {{ detailError }} The available map summary is shown below.
          </p>

          <template v-if="supportsRichDetails">
            <section class="detail-section detail-section--overview">
              <h3>Overview &amp; visit information</h3>
              <p>
                {{
                  detailOverview ||
                  "An overview will be added by the tourism team."
                }}
              </p>
              <div class="detail-drawer__facts">
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z"
                    />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                  <span
                    ><strong>Address</strong
                    >{{
                      selectedDetails?.address || selectedLocation.address
                    }}</span
                  >
                </p>
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span
                    ><strong>Hours</strong
                    >{{
                      displayValue(selectedDetails?.openingHours) ||
                      selectedLocation.hours
                    }}</span
                  >
                </p>
                <p v-if="selectedDetails?.admissionInformation">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16v10H4zM8 7v10M16 7v10" />
                  </svg>
                  <span
                    ><strong>Admission</strong
                    >{{
                      displayValue(selectedDetails.admissionInformation)
                    }}</span
                  >
                </p>
                <p v-if="selectedDetails?.bestTime">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path
                      d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
                    />
                  </svg>
                  <span
                    ><strong>Best time to visit</strong
                    >{{ displayValue(selectedDetails.bestTime) }}</span
                  >
                </p>
                <p v-if="selectedDetails?.accessibilityNotes">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="4" r="2" />
                    <path
                      d="M10 8h4v5h-3l-2 7M14 10l3 3 3 1M8 13a5 5 0 1 0 7 5"
                    />
                  </svg>
                  <span
                    ><strong>Accessibility</strong
                    >{{
                      displayValue(selectedDetails.accessibilityNotes)
                    }}</span
                  >
                </p>
              </div>
            </section>

            <section class="detail-section">
              <h3>Activities</h3>
              <ul
                v-if="selectedDetails?.activities?.length"
                class="detail-activity-list"
              >
                <li
                  v-for="activity in selectedDetails.activities"
                  :key="activity.id"
                >
                  <img
                    v-if="activity.imageUrl"
                    :src="activity.imageUrl"
                    :alt="activity.name"
                    loading="lazy"
                  />
                  <div>
                    <strong>{{ activity.name }}</strong>
                    <span v-if="activity.duration || activity.targetMarket">
                      {{
                        [activity.duration, activity.targetMarket]
                          .filter(Boolean)
                          .join(" · ")
                      }}
                    </span>
                    <p v-if="activity.description">
                      {{ activity.description }}
                    </p>
                  </div>
                </li>
              </ul>
              <p v-else class="detail-section__empty">
                Activities will appear here once linked by the tourism team.
              </p>
            </section>

            <section class="detail-section">
              <h3>How to visit</h3>
              <p>
                {{
                  selectedDetails?.howToVisit ||
                  "Travel instructions are being prepared."
                }}
              </p>
            </section>

            <section class="detail-section">
              <h3>How to book</h3>
              <p>
                {{
                  selectedDetails?.howToBook ||
                  "Booking instructions are being prepared."
                }}
              </p>
            </section>

            <section class="detail-section">
              <h3>Available packages</h3>
              <div
                v-if="selectedDetails?.packages?.length"
                class="detail-package-list"
              >
                <RouterLink
                  v-for="tourismPackage in selectedDetails.packages"
                  :key="tourismPackage.id"
                  :to="`/packages/${tourismPackage.slug}`"
                  class="detail-package-card"
                >
                  <img
                    v-if="tourismPackage.primaryImage"
                    :src="tourismPackage.primaryImage"
                    :alt="tourismPackage.name"
                    loading="lazy"
                  />
                  <span>
                    <small v-if="tourismPackage.isPrimary">Recommended</small>
                    <strong>{{ tourismPackage.name }}</strong>
                    <em>{{
                      [tourismPackage.duration, tourismPackage.priceLabel]
                        .filter(Boolean)
                        .join(" · ")
                    }}</em>
                  </span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </RouterLink>
              </div>
              <p v-else class="detail-section__empty">
                No bookable package is linked to this location yet.
              </p>
            </section>

            <section class="detail-section">
              <h3>Overnight stays</h3>
              <div
                v-if="selectedDetails?.overnightOptions?.length"
                class="overnight-table-wrap"
              >
                <table class="overnight-table">
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th>Capacity</th>
                      <th>Rate</th>
                      <th>Inclusions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="option in selectedDetails.overnightOptions"
                      :key="option.id"
                    >
                      <td>
                        <strong>{{ option.name }}</strong
                        ><span v-if="option.description">{{
                          option.description
                        }}</span>
                      </td>
                      <td>{{ option.capacity || "Ask host" }}</td>
                      <td>
                        <strong>{{ option.priceLabel }}</strong
                        ><span>{{ option.billingUnit }}</span>
                      </td>
                      <td>
                        <span>{{
                          option.inclusions.length
                            ? option.inclusions.join(", ")
                            : "Confirm with host"
                        }}</span>
                        <small v-if="option.notes">{{ option.notes }}</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="detail-section__empty">
                Camping and tent-rental options will appear here when published.
              </p>
            </section>

            <div class="detail-drawer__actions">
              <button
                class="detail-drawer__primary-action"
                type="button"
                :disabled="!primaryBookPackage"
                :title="
                  primaryBookPackage
                    ? `Book ${primaryBookPackage.name}`
                    : 'No ready package is linked yet'
                "
                @click="bookPrimaryPackage"
              >
                Book Now
              </button>
              <button
                class="detail-drawer__secondary-action"
                type="button"
                :disabled="isRouting"
                @click="getDirections(selectedLocation)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 18 3 15V5l6 3 6-3 6 3v10l-6-3-6 3Z" />
                  <path d="M9 8v10M15 5v10" />
                </svg>
                {{ isRouting ? "Finding route…" : "Get directions" }}
              </button>
            </div>
            <p v-if="!primaryBookPackage" class="detail-drawer__booking-note">
              Booking opens when the tourism team links a ready package.
            </p>
          </template>

          <template v-else>
            <section class="detail-section detail-section--overview">
              <h3>About this location</h3>
              <p>{{ selectedLocation.description }}</p>
              <div class="detail-drawer__facts">
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z"
                    />
                    <circle cx="12" cy="9" r="2.3" /></svg
                  ><span
                    ><strong>Address</strong
                    >{{ selectedLocation.address }}</span
                  >
                </p>
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" /></svg
                  ><span
                    ><strong>Hours</strong>{{ selectedLocation.hours }}</span
                  >
                </p>
              </div>
            </section>
            <div
              class="detail-drawer__actions"
              :class="{ 'detail-drawer__actions--single': !primaryBookPackage }"
            >
              <button
                v-if="primaryBookPackage"
                class="detail-drawer__primary-action"
                type="button"
                :title="`Book ${primaryBookPackage.name}`"
                @click="bookPrimaryPackage"
              >
                Book Now
              </button>
              <button
                class="detail-drawer__secondary-action"
                type="button"
                :disabled="isRouting"
                @click="getDirections(selectedLocation)"
              >
                {{ isRouting ? "Finding route…" : "Get directions" }}
              </button>
            </div>
            <p v-if="!primaryBookPackage" class="detail-drawer__booking-note">
              Booking opens when the tourism team links a ready package.
            </p>
          </template>

          <div
            v-if="canReviewSelectedLocation"
            class="detail-drawer__reviews"
          >
            <ReviewsSection
              :target-type="reviewTargetType"
              :target-id="selectedLocation.apiId"
              :target-name="selectedLocation.name"
            />
          </div>

          <div class="detail-drawer__nearby">
            <NearbySuggestions
              :origin="selectedLocation"
              title="Suggested Next Stops"
              :subtitle="`Closest places to ${selectedLocation.name}, routed by walking distance.`"
              :limit="4"
            />
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

.discovery-page {
  min-height: 100vh;
  overflow: hidden;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

.icon-button svg,
.search-field svg,
.map-actions svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.login-button:disabled,
.map-actions button:disabled {
  cursor: default;
  opacity: 0.72;
}

.discovery-shell {
  height: calc(100vh - 64px);
  display: flex;
  padding-top: 64px;
}

.discovery-sidebar {
  width: 360px;
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e8e4dc;
}

.sidebar-block {
  padding: 20px;
  border-bottom: 1px solid #e8e4dc;
}

.sidebar-block--search {
  padding-top: 18px;
}

/* Bottom-sheet drag handle + close button — only shown on mobile. */
.sheet-handle,
.sheet-topbar,
.sheet-close {
  display: none;
}

.sheet-handle {
  width: 100%;
  padding: 10px 0 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.sheet-handle__bar {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto;
  border-radius: 999px;
  background: #cfd6cf;
}

.sheet-topbar {
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 10px;
}

.sheet-topbar .sheet-handle {
  flex: 1;
}

.sheet-close {
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  cursor: pointer;
}

.sheet-close svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

h1,
h2,
h3 {
  margin: 0;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  font-size: 22px;
  font-weight: 700;
}

.search-field {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  margin-top: 16px;
  border-radius: 8px;
  background: #f2f0eb;
  color: #5c5c5c;
}

.search-field svg {
  position: absolute;
  left: 13px;
  width: 17px;
  height: 17px;
}

.search-field input {
  width: 100%;
  height: 100%;
  padding: 0 12px 0 40px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1a1a1a;
  font-size: 14px;
}

.search-field input::placeholder {
  color: #8a8782;
}

.filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filter-heading span {
  display: inline-flex;
  gap: 10px;
}

.filter-heading h2 {
  font-size: 18px;
  font-weight: 600;
}

.filter-heading button {
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.filter-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.filter-row {
  display: grid;
  grid-template-columns: 16px 8px 1fr auto;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
}

.filter-row:focus-visible,
.result-card:focus-visible {
  outline: 3px solid rgba(27, 67, 50, 0.22);
  outline-offset: 2px;
}

.fake-checkbox {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1.5px solid #1b4332;
  border-radius: 4px;
  background: #1b4332;
  color: #ffffff;
}

.fake-checkbox--off {
  background: #ffffff;
  color: transparent;
}

.fake-checkbox svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.filter-row small {
  color: #5c5c5c;
  font-size: 12px;
}

.results-block {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.results-block > p {
  margin: 0;
  padding: 16px 20px 10px;
  color: #5c5c5c;
  font-size: 13px;
}

.result-list {
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 20px;
}

.map-empty-state {
  display: grid;
  gap: 4px;
  padding: 24px 20px;
  color: #5c5c5c;
  font-size: 13px;
}

.map-empty-state strong {
  color: #1a1a1a;
  font-size: 14px;
}

.result-card {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border: 0;
  border-bottom: 1px solid #e8e4dc;
  background: #ffffff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.result-card:hover {
  background: #f2f0eb;
}

.result-card--selected {
  border-left: 3px solid #1b4332;
  background: #d8f3dc;
  padding-left: 17px;
}

.result-thumb {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 8px;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.22),
      transparent 38%
    ),
    linear-gradient(
      135deg,
      var(--thumb-color),
      color-mix(in srgb, var(--thumb-color) 65%, white)
    );
}

.result-card__copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.result-card__copy strong {
  overflow: hidden;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  align-self: flex-start;
  height: 22px;
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe8de;
  color: #7a2d0e;
  font-size: 12px;
  font-weight: 500;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 5px;
  color: #5c5c5c;
  font-size: 12px;
}

.map-area {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: #e8e3da;
}

.map-area::before {
  display: none;
}

.map-badge,
.map-actions,
.map-legend,
.location-popup,
.cluster-marker,
.map-pin {
  position: absolute;
  z-index: 2;
}

.map-badge {
  top: 22px;
  left: 22px;
  display: inline-flex;
  gap: 4px;
  padding: 10px 13px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #5c5c5c;
  font-size: 13px;
}

.map-badge strong {
  color: #1a1a1a;
  font-weight: 500;
}

.map-actions {
  top: 22px;
  right: 20px;
  display: flex;
  gap: 10px;
}

.map-actions button,
.map-actions a {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
}

.map-actions button {
  cursor: pointer;
}

.map-actions button.map-actions__clear {
  border-color: #b5451b;
  color: #b5451b;
}

.map-actions button.map-actions__clear svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.map-actions a {
  border-color: #1b4332;
  background: #1b4332;
  color: #ffffff;
}

.map-actions svg {
  width: 16px;
  height: 16px;
}

.map-pin {
  width: 32px;
  border: 0;
  background: transparent;
  padding: 0;
  transform: translate(-50%, -100%);
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

.map-pin svg {
  width: 32px;
  height: 42px;
}

.map-pin path {
  fill: var(--pin-color);
}

.map-pin circle {
  fill: #ffffff;
}

.map-pin--selected {
  transform: translate(-50%, -100%) scale(1.3);
}

.map-pin--selected path {
  fill: #b5451b;
}

.cluster-marker {
  top: 48%;
  left: 50%;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1b4332;
  box-shadow: 0 0 0 6px rgba(27, 67, 50, 0.15);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}

.location-popup {
  width: 280px;
  overflow: hidden;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  transform: translateY(-50%);
  animation: fadeUp 240ms ease-out both;
}

.location-popup__image {
  position: relative;
  height: 140px;
  background:
    radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.25),
      transparent 45%
    ),
    linear-gradient(
      135deg,
      var(--popup-color),
      color-mix(in srgb, var(--popup-color) 62%, white)
    );
}

.location-popup__image button {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  cursor: pointer;
}

.location-popup__image button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.location-popup__body {
  padding: 14px 16px 16px;
}

.location-popup__body h2 {
  font-size: 15px;
  font-weight: 600;
}

.popup-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: #5c5c5c;
  font-size: 12px;
}

.location-popup__body button {
  margin-top: 9px;
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.detail-drawer__actions button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.map-legend {
  bottom: 22px;
  left: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: calc(100% - 420px);
  padding: 12px 14px;
  border: 1px solid #e8e4dc;
  border-radius: 10px;
  background: #ffffff;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1a1a1a;
  font-size: 12px;
  white-space: nowrap;
}

.map-legend i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.map-legend i.map-legend__emergency {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  border: 2px solid #dc2626;
  border-radius: 4px;
  background: #ffffff;
  color: #dc2626;
  font-size: 14px;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
}

.travel-estimates {
  position: absolute;
  z-index: 5;
  right: 20px;
  bottom: 76px;
  width: min(440px, calc(100% - 40px));
  padding: 16px;
  border: 1px solid rgba(27, 67, 50, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 50px rgba(27, 67, 50, 0.2);
  backdrop-filter: blur(12px);
}

.travel-estimates__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.travel-estimates__header > div {
  min-width: 0;
  display: grid;
}

.travel-estimates__header span {
  color: #5c5c5c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.travel-estimates__header strong {
  overflow: hidden;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.travel-estimates__header button {
  width: 34px;
  height: 34px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #f2f0eb;
  color: #1a1a1a;
  cursor: pointer;
}

.travel-estimates__header svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.travel-estimates__modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.travel-estimates__modes article {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 11px 6px;
  border-radius: 12px;
  background: #f4f8f5;
  color: #5c5c5c;
  text-align: center;
}

.travel-estimates__modes article > span:not(.travel-estimates__icon) {
  min-height: 32px;
  display: grid;
  place-items: center;
  font-size: 11px;
  line-height: 1.25;
}

.travel-estimates__modes article > strong {
  color: #166534;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.25;
}

.travel-estimates__icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
}

.travel-estimates__icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.travel-estimates > p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
}

.feedback-toast {
  position: absolute;
  right: 20px;
  bottom: 22px;
  z-index: 4;
  width: 280px;
  padding: 14px 16px;
  border-left: 4px solid #1b7a4a;
  border-radius: 12px;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 14px;
}

.feedback-toast--warning {
  border-left-color: #d4ac0d;
}

.detail-backdrop {
  position: fixed;
  z-index: 65;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
}

.detail-drawer {
  position: fixed;
  z-index: 70;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(600px, 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: #ffffff;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.18);
  animation: slideIn 240ms ease-out both;
}

.detail-drawer__gallery {
  position: relative;
  flex: 0 0 auto;
}

.detail-drawer__gallery :deep(.accr-badge--floating) {
  top: auto;
  right: 14px;
  bottom: 14px;
}

.detail-drawer__close {
  position: absolute;
  z-index: 3;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(16, 24, 20, 0.68);
  color: #ffffff;
  cursor: pointer;
  backdrop-filter: blur(6px);
}

.detail-drawer__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.detail-drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;
  padding: 32px;
}

.detail-drawer__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5c5c5c;
  font-size: 14px;
}

.detail-drawer__body .category-badge {
  align-self: flex-start;
}

.detail-drawer__body h2 {
  margin-top: 14px;
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 32px;
  font-weight: 600;
}

.detail-drawer__load-state,
.detail-drawer__error {
  margin: 18px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f2f0eb;
  color: #5c5c5c;
  font-size: 13px;
}

.detail-drawer__error {
  border-left: 3px solid #b5451b;
  background: #fff7ed;
  color: #7a2d0e;
}

.detail-section {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #e8e4dc;
}

.detail-section--overview {
  padding-top: 0;
  border-top: 0;
}

.detail-section h3 {
  font-size: 18px;
  font-weight: 650;
}

.detail-section > p {
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-line;
}

.detail-section > p.detail-section__empty {
  padding: 14px;
  border-radius: 10px;
  background: #f7f6f3;
  font-size: 13px;
}

.detail-drawer__facts {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.detail-drawer__facts p {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  color: #1a1a1a;
  font-size: 14px;
}

.detail-drawer__facts p > span {
  display: grid;
  gap: 2px;
}

.detail-drawer__facts p strong {
  font-size: 12px;
  letter-spacing: 0.02em;
}

.detail-drawer__facts svg,
.detail-drawer__actions svg {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.detail-drawer__facts svg {
  margin-top: 2px;
  color: #1b4332;
}

.detail-activity-list {
  list-style: none;
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
  padding: 0;
}

.detail-activity-list li {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
}

.detail-activity-list img {
  width: 72px;
  height: 72px;
  flex: 0 0 auto;
  border-radius: 9px;
  object-fit: cover;
}

.detail-activity-list div {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 3px;
}

.detail-activity-list strong {
  font-size: 14px;
}

.detail-activity-list span {
  color: #1b7a4a;
  font-size: 11px;
  font-weight: 600;
}

.detail-activity-list p {
  margin: 2px 0 0;
  color: #5c5c5c;
  font-size: 12px;
  line-height: 1.5;
}

.detail-package-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.detail-package-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 12px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  transition:
    border-color 150ms ease,
    transform 150ms ease;
}

.detail-package-card:hover {
  border-color: #1b4332;
  transform: translateY(-1px);
}

.detail-package-card img {
  width: 60px;
  height: 54px;
  border-radius: 8px;
  object-fit: cover;
}

.detail-package-card > span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.detail-package-card small {
  color: #b5451b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.detail-package-card strong {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-package-card em {
  color: #5c5c5c;
  font-size: 12px;
  font-style: normal;
}

.detail-package-card > svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #1b4332;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.overnight-table-wrap {
  width: 100%;
  margin-top: 14px;
  overflow-x: auto;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
}

.overnight-table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.overnight-table th {
  padding: 10px 12px;
  background: #f2f0eb;
  color: #5c5c5c;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.overnight-table td {
  max-width: 180px;
  padding: 12px;
  border-top: 1px solid #e8e4dc;
  vertical-align: top;
}

.overnight-table td span,
.overnight-table td small {
  display: block;
  margin-top: 3px;
  color: #5c5c5c;
  line-height: 1.45;
}

.detail-drawer__actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  padding-top: 32px;
  border-top: 1px solid #e8e4dc;
}

.detail-drawer__actions--single button {
  max-width: 280px;
}

.detail-drawer__nearby,
.detail-drawer__reviews {
  margin-top: 28px;
}

.detail-drawer__actions button {
  height: 48px;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.detail-drawer__actions .detail-drawer__secondary-action {
  background: transparent;
  color: #1b4332;
}

.detail-drawer__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.detail-drawer__booking-note {
  margin: 9px 0 0;
  color: #5c5c5c;
  font-size: 12px;
  text-align: center;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(calc(-50% + 8px));
  }

  to {
    opacity: 1;
    transform: translateY(-50%);
  }
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .discovery-sidebar {
    width: 330px;
    flex-basis: 330px;
  }

  .map-legend {
    max-width: calc(100% - 380px);
  }
}

@media (max-width: 760px) {
  /* The navbar is a fixed component (z-index 50, solid white). The shell holds a
     full-height map with UI layered above it. z-order: map < list < detail. */
  .discovery-shell {
    position: relative;
    display: block;
    /* Use dynamic viewport height so bottom-anchored sheets sit above the phone
       browser's toolbar instead of behind it (fallback to vh for old browsers). */
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
    min-height: calc(100vh - 64px);
    min-height: calc(100dvh - 64px);
    margin-top: 64px;
    padding-top: 0;
    overflow: hidden;
  }

  .map-area {
    position: absolute;
    inset: 0;
    height: 100%;
    z-index: 1;
  }

  .map-badge {
    top: 12px;
    left: 12px;
  }

  .map-actions {
    top: 12px;
    right: 12px;
    flex-direction: column;
  }

  .map-actions a {
    display: none;
  }

  .map-legend,
  .location-popup {
    display: none;
  }

  .travel-estimates {
    right: 12px;
    bottom: calc(44dvh + env(safe-area-inset-bottom) + 12px);
    width: calc(100% - 24px);
    padding: 12px;
  }

  .travel-estimates__modes {
    margin-top: 10px;
  }

  .travel-estimates__modes article {
    padding: 8px 4px;
  }

  .travel-estimates > p {
    display: none;
  }

  /* Reveal the sheet controls on mobile. */
  .sheet-handle {
    display: block;
  }

  .sheet-topbar {
    display: flex;
  }

  .sheet-close {
    display: inline-grid;
  }

  /* ---- Discover list: persistent bottom sheet, capped at 40vh ---- */
  .discovery-sidebar {
    position: absolute;
    z-index: 20;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    max-width: 100vw;
    max-height: 44vh;
    max-height: 44dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 0;
    border-top: 1px solid #e8e4dc;
    border-radius: 18px 18px 0 0;
    background: #ffffff;
    box-shadow: 0 -12px 32px rgba(27, 67, 50, 0.16);
    transition: transform 0.28s ease;
  }

  /* Collapsed: slide down, leaving the handle + search peeking above the fold. */
  .discovery-sidebar--collapsed {
    transform: translateY(calc(100% - 118px));
  }

  .sidebar-block:not(.sidebar-block--search) {
    display: none;
  }

  .results-block {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .results-block > p {
    padding: 10px 16px 6px;
  }

  .result-list {
    max-height: none;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }

  .result-card {
    min-height: 68px;
    padding: 12px 16px;
  }

  .search-field,
  .search-field input {
    min-width: 0;
  }

  .result-card--selected {
    padding-left: 13px;
  }

  .result-thumb {
    width: 44px;
    height: 44px;
  }

  .detail-drawer {
    width: 100%;
  }

  .detail-drawer__body {
    padding: 28px 20px;
  }

  .detail-drawer__body h2 {
    font-size: 28px;
  }

  .detail-drawer__actions {
    flex-direction: column;
  }

  .overnight-table {
    min-width: 560px;
  }

  @media (prefers-reduced-motion: reduce) {
    .discovery-sidebar,
    .detail-drawer {
      transition: none;
      animation: none;
    }
  }
}
</style>
