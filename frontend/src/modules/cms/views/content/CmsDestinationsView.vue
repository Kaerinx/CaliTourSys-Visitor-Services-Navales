<script setup>
import { onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsDestinationForm from '../../components/content/CmsDestinationForm.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { useCmsRelations } from '../../composables/useCmsRelations'
import { cmsContentApi } from '../../services/cmsContentApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsContentApi.getDestinations, { categoryId: '', barangay: '', featured: '', sort: '-createdAt' })
const { relations, relationError } = useCmsRelations({
  categories: () => cmsContentApi.getDestinationCategories({ limit: 100, status: 'published' }),
  businesses: () => cmsContentApi.getBusinesses({ limit: 100, status: 'active' }),
})
const formOpen = ref(false), selected = ref(null), formError = ref(''), isSaving = ref(false), notice = ref(''), confirmAction = ref(null), isActionBusy = ref(false)
const columns = [{ key: 'name', label: 'Destination' }, { key: 'category', label: 'Category' }, { key: 'business', label: 'Linked business' }, { key: 'barangay', label: 'Barangay' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]
onMounted(load)
const can = (permission) => auth.hasPermission(permission)
function openCreate() { selected.value = null; formError.value = ''; formOpen.value = true }
function openEdit(item) { selected.value = item; formError.value = ''; formOpen.value = true }
async function submitRecord(payload) { isSaving.value = true; formError.value = ''; try { if (selected.value?.id) await cmsContentApi.updateDestination(selected.value.id, payload); else await cmsContentApi.createDestination(payload); formOpen.value = false; notice.value = selected.value?.id ? 'Destination updated.' : 'Destination created.'; await load() } catch (err) { formError.value = friendlyContentError(err) } finally { isSaving.value = false } }
function askAction(type, item) { confirmAction.value = { type, item } }
async function runConfirmedAction() { isActionBusy.value = true; try { if (confirmAction.value.type === 'publish') { await cmsContentApi.publishDestination(confirmAction.value.item.id); notice.value = 'Destination published.' } else { await cmsContentApi.archiveDestination(confirmAction.value.item.id); notice.value = 'Destination archived.' } confirmAction.value = null; await load() } catch (err) { error.value = friendlyContentError(err) } finally { isActionBusy.value = false } }
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-destinations-title">
    <header class="cms-content-page__header"><div><p>Tourism Places</p><h1 id="cms-destinations-title">Destinations</h1><span>Manage public tourism places, category metadata, and optional partner business links.</span></div></header>
    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div><div v-if="relationError" class="cms-content-page__notice" role="status">{{ relationError }}</div>
    <CmsContentToolbar v-model:search="filters.search" v-model:status="filters.status" v-model:featured="filters.featured" v-model:category-id="filters.categoryId" v-model:barangay="filters.barangay" create-label="Create destination" :can-create="can('destinations.create')" :categories="relations.categories || []" show-featured show-category show-barangay @create="openCreate" />
    <CmsDataTable :columns="columns" :items="items" :loading="isLoading" :error="error" empty-title="No destinations found" empty-text="Create a destination draft or adjust your filters." @retry="load">
      <template #rows="{ items: rows }"><tr v-for="item in rows" :key="item.id"><td><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span></td><td>{{ item.category?.name || 'No category' }}</td><td>{{ item.business?.name || 'None' }}</td><td>{{ item.barangay || 'Not set' }}</td><td><CmsStatusBadge :status="item.status" /></td><td><span class="cms-table-actions"><button v-if="can('destinations.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('destinations.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button><button v-if="can('destinations.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button></span></td></tr></template>
      <template #cards="{ items: cards }"><article v-for="item in cards" :key="item.id" class="cms-mobile-card"><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span><div class="cms-mobile-meta"><CmsStatusBadge :status="item.status" /><span>{{ item.category?.name || 'No category' }}</span></div><span>{{ item.barangay || 'No barangay' }} / {{ item.business?.name || 'No business link' }}</span><div class="cms-mobile-card__actions cms-table-actions"><button v-if="can('destinations.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('destinations.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button><button v-if="can('destinations.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button></div></article></template>
    </CmsDataTable>
    <CmsPagination :pagination="pagination" @page-change="setPage" />
    <CmsDestinationForm :open="formOpen" :value="selected" :categories="relations.categories || []" :businesses="relations.businesses || []" :busy="isSaving" :server-error="formError" @close="formOpen = false" @submit="submitRecord" />
    <CmsConfirmDialog :open="Boolean(confirmAction)" :title="confirmAction?.type === 'publish' ? 'Publish this destination?' : 'Archive this destination?'" :message="confirmAction?.type === 'publish' ? 'Published destinations can appear on the public discovery pages.' : 'Archived destinations are hidden from active public content.'" :confirm-label="confirmAction?.type === 'publish' ? 'Publish' : 'Archive'" :tone="confirmAction?.type === 'archive' ? 'danger' : 'primary'" :busy="isActionBusy" @cancel="confirmAction = null" @confirm="runConfirmedAction" />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';
</style>
