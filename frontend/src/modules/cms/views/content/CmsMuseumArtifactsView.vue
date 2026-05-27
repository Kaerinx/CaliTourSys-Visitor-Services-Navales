<script setup>
import { onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsMuseumArtifactForm from '../../components/content/CmsMuseumArtifactForm.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { useCmsRelations } from '../../composables/useCmsRelations'
import { cmsContentApi } from '../../services/cmsContentApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsContentApi.getMuseumArtifacts, { categoryId: '', featured: '', sort: '-createdAt' })
const { relations, relationError } = useCmsRelations({ categories: () => cmsContentApi.getMuseumCategories({ limit: 100, status: 'published' }) })
const formOpen = ref(false), selected = ref(null), formError = ref(''), isSaving = ref(false), notice = ref(''), confirmAction = ref(null), isActionBusy = ref(false)
const columns = [{ key: 'name', label: 'Artifact' }, { key: 'category', label: 'Category' }, { key: 'era', label: 'Era' }, { key: 'featured', label: 'Featured' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]
onMounted(load)
const can = (permission) => auth.hasPermission(permission)
function openCreate() { selected.value = null; formError.value = ''; formOpen.value = true }
function openEdit(item) { selected.value = item; formError.value = ''; formOpen.value = true }
async function submitRecord(payload) { isSaving.value = true; formError.value = ''; try { if (selected.value?.id) await cmsContentApi.updateMuseumArtifact(selected.value.id, payload); else await cmsContentApi.createMuseumArtifact(payload); formOpen.value = false; notice.value = selected.value?.id ? 'Artifact updated.' : 'Artifact created.'; await load() } catch (err) { formError.value = friendlyContentError(err) } finally { isSaving.value = false } }
function askAction(type, item) { confirmAction.value = { type, item } }
async function runConfirmedAction() { isActionBusy.value = true; try { if (confirmAction.value.type === 'publish') { await cmsContentApi.publishMuseumArtifact(confirmAction.value.item.id); notice.value = 'Artifact published.' } else { await cmsContentApi.archiveMuseumArtifact(confirmAction.value.item.id); notice.value = 'Artifact archived.' } confirmAction.value = null; await load() } catch (err) { error.value = friendlyContentError(err) } finally { isActionBusy.value = false } }
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-museum-title">
    <header class="cms-content-page__header"><div><p>Virtual Museum</p><h1 id="cms-museum-title">Museum Artifacts</h1><span>Manage artifact records, collection categories, historical notes, and public visibility.</span></div></header>
    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div><div v-if="relationError" class="cms-content-page__notice" role="status">{{ relationError }}</div>
    <CmsContentToolbar v-model:search="filters.search" v-model:status="filters.status" v-model:featured="filters.featured" v-model:category-id="filters.categoryId" create-label="Create artifact" :can-create="can('museum.create')" :categories="relations.categories || []" show-featured show-category @create="openCreate" />
    <CmsDataTable :columns="columns" :items="items" :loading="isLoading" :error="error" empty-title="No artifacts found" empty-text="Create an artifact draft or adjust your filters." @retry="load">
      <template #rows="{ items: rows }"><tr v-for="item in rows" :key="item.id"><td><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span></td><td>{{ item.category?.name || 'No category' }}</td><td>{{ item.eraLabel || 'Not set' }}</td><td><span class="cms-feature-dot" :class="{ 'is-featured': item.isFeatured }">{{ item.isFeatured ? 'Featured' : 'Standard' }}</span></td><td><CmsStatusBadge :status="item.status" /></td><td><span class="cms-table-actions"><button v-if="can('museum.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('museum.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button><button v-if="can('museum.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button></span></td></tr></template>
      <template #cards="{ items: cards }"><article v-for="item in cards" :key="item.id" class="cms-mobile-card"><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span><div class="cms-mobile-meta"><CmsStatusBadge :status="item.status" /><span>{{ item.category?.name || 'No category' }}</span></div><span>{{ item.eraLabel || 'No era label' }}</span><div class="cms-mobile-card__actions cms-table-actions"><button v-if="can('museum.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('museum.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button><button v-if="can('museum.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button></div></article></template>
    </CmsDataTable>
    <CmsPagination :pagination="pagination" @page-change="setPage" />
    <CmsMuseumArtifactForm :open="formOpen" :value="selected" :categories="relations.categories || []" :busy="isSaving" :server-error="formError" @close="formOpen = false" @submit="submitRecord" />
    <CmsConfirmDialog :open="Boolean(confirmAction)" :title="confirmAction?.type === 'publish' ? 'Publish this artifact?' : 'Archive this artifact?'" :message="confirmAction?.type === 'publish' ? 'Published artifacts can appear in the public virtual museum.' : 'Archived artifacts are hidden from active public content.'" :confirm-label="confirmAction?.type === 'publish' ? 'Publish' : 'Archive'" :tone="confirmAction?.type === 'archive' ? 'danger' : 'primary'" :busy="isActionBusy" @cancel="confirmAction = null" @confirm="runConfirmedAction" />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';
</style>
