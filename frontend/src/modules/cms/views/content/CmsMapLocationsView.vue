<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsMapLocationForm from '../../components/content/CmsMapLocationForm.vue'
import CmsMapLocationsMapView from '../../components/content/CmsMapLocationsMapView.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { useCmsRelations } from '../../composables/useCmsRelations'
import { cmsContentApi } from '../../services/cmsContentApi'
import { useCmsAuthStore } from '../../stores/authStore'

const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || ''
const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsContentApi.getMapLocations, { locationType: '', sort: '-createdAt' })
const { relations, relationError } = useCmsRelations({
  destinations: () => cmsContentApi.getDestinations({ limit: 100, status: 'published' }),
  businesses: () => cmsContentApi.getBusinesses({ limit: 100, status: 'active' }),
  events: () => cmsContentApi.getEvents({ limit: 100, status: 'published' }),
})
const formOpen = ref(false), selected = ref(null), formError = ref(''), isSaving = ref(false), notice = ref(''), confirmAction = ref(null), isActionBusy = ref(false)
const initialCoordinates = ref(null)
const activeView = ref('table')
const mapLocations = ref([])
const isMapLoading = ref(false)
const mapError = ref('')
const columns = [{ key: 'label', label: 'Location' }, { key: 'type', label: 'Type' }, { key: 'target', label: 'Target' }, { key: 'coordinates', label: 'Coordinates' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]
const publishedMapLocations = computed(() => mapLocations.value.filter((item) => item.status === 'published'))
onMounted(async () => {
  await Promise.all([load(), loadMapLocations()])
})
const can = (permission) => auth.hasPermission(permission)
function openCreate(coordinates = null) { selected.value = null; initialCoordinates.value = coordinates; formError.value = ''; formOpen.value = true }
function openEdit(item) { selected.value = item; initialCoordinates.value = null; formError.value = ''; formOpen.value = true }
function targetLabel(item) { return item.destinationId || item.businessId || item.eventId || 'No target' }
async function loadMapLocations() { isMapLoading.value = true; mapError.value = ''; try { const { data } = await cmsContentApi.getMapLocations({ status: 'published', limit: 100 }); mapLocations.value = data || [] } catch (err) { mapError.value = friendlyContentError(err) } finally { isMapLoading.value = false } }
async function refreshViews() { await Promise.all([load(), loadMapLocations()]) }
async function submitRecord(payload) { isSaving.value = true; formError.value = ''; try { if (selected.value?.id) await cmsContentApi.updateMapLocation(selected.value.id, payload); else await cmsContentApi.createMapLocation(payload); formOpen.value = false; notice.value = selected.value?.id ? 'Map location updated.' : 'Map location created.'; await refreshViews() } catch (err) { formError.value = friendlyContentError(err) } finally { isSaving.value = false } }
function askDelete(item) { confirmAction.value = { item } }
async function runDelete() { isActionBusy.value = true; try { await cmsContentApi.deleteMapLocation(confirmAction.value.item.id); notice.value = 'Map location deleted.'; confirmAction.value = null; await refreshViews() } catch (err) { error.value = friendlyContentError(err) } finally { isActionBusy.value = false } }
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-map-title">
    <header class="cms-content-page__header"><div><p>Map Operations</p><h1 id="cms-map-title">Map Locations</h1><span>Manage map pins, target links, clustering metadata, and coordinate accuracy.</span></div></header>
    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div><div v-if="relationError" class="cms-content-page__notice" role="status">{{ relationError }}</div>
    <CmsContentToolbar v-model:search="filters.search" v-model:status="filters.status" v-model:location-type="filters.locationType" create-label="Create map location" :can-create="can('map_locations.create')" show-location-type @create="openCreate" />
    <div class="cms-map-view-toggle" role="tablist" aria-label="Map locations views">
      <button type="button" role="tab" :aria-selected="activeView === 'table'" :class="{ 'is-active': activeView === 'table' }" @click="activeView = 'table'">Table View</button>
      <button type="button" role="tab" :aria-selected="activeView === 'map'" :class="{ 'is-active': activeView === 'map' }" @click="activeView = 'map'">Map View</button>
    </div>
    <template v-if="activeView === 'table'">
      <CmsDataTable :columns="columns" :items="items" :loading="isLoading" :error="error" empty-title="No map locations found" empty-text="Create a map location or adjust your filters." @retry="load">
        <template #rows="{ items: rows }"><tr v-for="item in rows" :key="item.id"><td><span class="cms-table-title"><strong>{{ item.label }}</strong><span>{{ item.markerIcon || 'Default marker' }}</span></span></td><td>{{ item.locationType }}</td><td>{{ targetLabel(item) }}</td><td>{{ item.latitude }}, {{ item.longitude }}</td><td><CmsStatusBadge :status="item.status" /></td><td><span class="cms-table-actions"><button v-if="can('map_locations.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('map_locations.update')" class="is-danger" type="button" @click="askDelete(item)">Delete</button></span></td></tr></template>
        <template #cards="{ items: cards }"><article v-for="item in cards" :key="item.id" class="cms-mobile-card"><span class="cms-table-title"><strong>{{ item.label }}</strong><span>{{ item.locationType }}</span></span><div class="cms-mobile-meta"><CmsStatusBadge :status="item.status" /><span>{{ item.latitude }}, {{ item.longitude }}</span></div><span>{{ targetLabel(item) }}</span><div class="cms-mobile-card__actions cms-table-actions"><button v-if="can('map_locations.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('map_locations.update')" class="is-danger" type="button" @click="askDelete(item)">Delete</button></div></article></template>
      </CmsDataTable>
      <CmsPagination :pagination="pagination" @page-change="setPage" />
    </template>
    <CmsMapLocationsMapView v-else :access-token="mapboxToken" :locations="publishedMapLocations" :loading="isMapLoading" :error="mapError" :can-create="can('map_locations.create')" @create-at="openCreate" />
    <CmsMapLocationForm :open="formOpen" :value="selected" :initial-coordinates="initialCoordinates" :destinations="relations.destinations || []" :businesses="relations.businesses || []" :events="relations.events || []" :busy="isSaving" :server-error="formError" @close="formOpen = false" @submit="submitRecord" />
    <CmsConfirmDialog :open="Boolean(confirmAction)" title="Delete this map location?" message="This removes the map location record. Backend audit logging remains the source of truth." confirm-label="Delete" tone="danger" :busy="isActionBusy" @cancel="confirmAction = null" @confirm="runDelete" />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';

.cms-map-view-toggle {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  padding: 4px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

.cms-map-view-toggle button {
  min-height: 38px;
  padding: 0 14px;
  color: #475569;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-weight: 900;
}

.cms-map-view-toggle button.is-active {
  color: #075985;
  background: #e0f2fe;
}

.cms-map-view-toggle button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .cms-map-view-toggle {
    width: 100%;
  }

  .cms-map-view-toggle button {
    flex: 1;
  }
}
</style>
