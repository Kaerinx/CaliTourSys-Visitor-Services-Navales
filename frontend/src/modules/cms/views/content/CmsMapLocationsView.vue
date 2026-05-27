<script setup>
import { onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsMapLocationForm from '../../components/content/CmsMapLocationForm.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { useCmsRelations } from '../../composables/useCmsRelations'
import { cmsContentApi } from '../../services/cmsContentApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsContentApi.getMapLocations, { locationType: '', sort: '-createdAt' })
const { relations, relationError } = useCmsRelations({
  destinations: () => cmsContentApi.getDestinations({ limit: 100, status: 'published' }),
  businesses: () => cmsContentApi.getBusinesses({ limit: 100, status: 'active' }),
  events: () => cmsContentApi.getEvents({ limit: 100, status: 'published' }),
})
const formOpen = ref(false), selected = ref(null), formError = ref(''), isSaving = ref(false), notice = ref(''), confirmAction = ref(null), isActionBusy = ref(false)
const columns = [{ key: 'label', label: 'Location' }, { key: 'type', label: 'Type' }, { key: 'target', label: 'Target' }, { key: 'coordinates', label: 'Coordinates' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]
onMounted(load)
const can = (permission) => auth.hasPermission(permission)
function openCreate() { selected.value = null; formError.value = ''; formOpen.value = true }
function openEdit(item) { selected.value = item; formError.value = ''; formOpen.value = true }
function targetLabel(item) { return item.destinationId || item.businessId || item.eventId || 'No target' }
async function submitRecord(payload) { isSaving.value = true; formError.value = ''; try { if (selected.value?.id) await cmsContentApi.updateMapLocation(selected.value.id, payload); else await cmsContentApi.createMapLocation(payload); formOpen.value = false; notice.value = selected.value?.id ? 'Map location updated.' : 'Map location created.'; await load() } catch (err) { formError.value = friendlyContentError(err) } finally { isSaving.value = false } }
function askDelete(item) { confirmAction.value = { item } }
async function runDelete() { isActionBusy.value = true; try { await cmsContentApi.deleteMapLocation(confirmAction.value.item.id); notice.value = 'Map location deleted.'; confirmAction.value = null; await load() } catch (err) { error.value = friendlyContentError(err) } finally { isActionBusy.value = false } }
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-map-title">
    <header class="cms-content-page__header"><div><p>Map Operations</p><h1 id="cms-map-title">Map Locations</h1><span>Manage map pins, target links, clustering metadata, and coordinate accuracy.</span></div></header>
    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div><div v-if="relationError" class="cms-content-page__notice" role="status">{{ relationError }}</div>
    <CmsContentToolbar v-model:search="filters.search" v-model:status="filters.status" v-model:location-type="filters.locationType" create-label="Create map location" :can-create="can('map_locations.create')" show-location-type @create="openCreate" />
    <CmsDataTable :columns="columns" :items="items" :loading="isLoading" :error="error" empty-title="No map locations found" empty-text="Create a map location or adjust your filters." @retry="load">
      <template #rows="{ items: rows }"><tr v-for="item in rows" :key="item.id"><td><span class="cms-table-title"><strong>{{ item.label }}</strong><span>{{ item.markerIcon || 'Default marker' }}</span></span></td><td>{{ item.locationType }}</td><td>{{ targetLabel(item) }}</td><td>{{ item.latitude }}, {{ item.longitude }}</td><td><CmsStatusBadge :status="item.status" /></td><td><span class="cms-table-actions"><button v-if="can('map_locations.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('map_locations.update')" class="is-danger" type="button" @click="askDelete(item)">Delete</button></span></td></tr></template>
      <template #cards="{ items: cards }"><article v-for="item in cards" :key="item.id" class="cms-mobile-card"><span class="cms-table-title"><strong>{{ item.label }}</strong><span>{{ item.locationType }}</span></span><div class="cms-mobile-meta"><CmsStatusBadge :status="item.status" /><span>{{ item.latitude }}, {{ item.longitude }}</span></div><span>{{ targetLabel(item) }}</span><div class="cms-mobile-card__actions cms-table-actions"><button v-if="can('map_locations.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('map_locations.update')" class="is-danger" type="button" @click="askDelete(item)">Delete</button></div></article></template>
    </CmsDataTable>
    <CmsPagination :pagination="pagination" @page-change="setPage" />
    <CmsMapLocationForm :open="formOpen" :value="selected" :destinations="relations.destinations || []" :businesses="relations.businesses || []" :events="relations.events || []" :busy="isSaving" :server-error="formError" @close="formOpen = false" @submit="submitRecord" />
    <CmsConfirmDialog :open="Boolean(confirmAction)" title="Delete this map location?" message="This removes the map location record. Backend audit logging remains the source of truth." confirm-label="Delete" tone="danger" :busy="isActionBusy" @cancel="confirmAction = null" @confirm="runDelete" />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';
</style>
