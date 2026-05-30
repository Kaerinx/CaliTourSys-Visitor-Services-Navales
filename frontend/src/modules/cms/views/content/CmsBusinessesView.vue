<script setup>
import { computed, onMounted, ref } from 'vue'
import CmsBusinessForm from '../../components/content/CmsBusinessForm.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { cmsContentApi } from '../../services/cmsContentApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsContentApi.getBusinesses, { businessType: '', featured: '', sort: '-createdAt' })
const businessTypes = computed(() => [...new Set(items.value.map((item) => item.businessType).filter(Boolean))])
const formOpen = ref(false), selected = ref(null), formError = ref(''), isSaving = ref(false), notice = ref('')
const columns = [{ key: 'name', label: 'Business' }, { key: 'type', label: 'Type' }, { key: 'owner', label: 'Owner' }, { key: 'featured', label: 'Featured' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]
onMounted(load)
const can = (permission) => auth.hasPermission(permission)
function openCreate() { selected.value = null; formError.value = ''; formOpen.value = true }
function openEdit(item) { selected.value = item; formError.value = ''; formOpen.value = true }
async function submitRecord(payload) { isSaving.value = true; formError.value = ''; try { if (selected.value?.id) await cmsContentApi.updateBusiness(selected.value.id, payload); else await cmsContentApi.createBusiness(payload); formOpen.value = false; notice.value = selected.value?.id ? 'Business updated.' : 'Business created.'; await load() } catch (err) { formError.value = friendlyContentError(err) } finally { isSaving.value = false } }
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-businesses-title">
    <header class="cms-content-page__header"><div><p>Producer Directory</p><h1 id="cms-businesses-title">Businesses / Producers</h1><span>Manage tourism businesses, OTOP producers, profile status, and featured directory entries.</span></div></header>
    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>
    <CmsContentToolbar v-model:search="filters.search" v-model:status="filters.status" v-model:featured="filters.featured" v-model:business-type="filters.businessType" create-label="Create business" :can-create="can('businesses.create')" :business-types="businessTypes" :status-options="[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'archived', label: 'Archived' }]" show-featured show-business-type @create="openCreate" />
    <CmsDataTable :columns="columns" :items="items" :loading="isLoading" :error="error" empty-title="No businesses found" empty-text="Create a producer or adjust your filters." @retry="load">
      <template #rows="{ items: rows }"><tr v-for="item in rows" :key="item.id"><td><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span></td><td>{{ item.businessType }}</td><td>{{ item.ownerName || 'Not set' }}</td><td><span class="cms-feature-dot" :class="{ 'is-featured': item.isFeatured }">{{ item.isFeatured ? 'Featured' : 'Standard' }}</span></td><td><CmsStatusBadge :status="item.status" /></td><td><span class="cms-table-actions"><button v-if="can('businesses.update')" type="button" @click="openEdit(item)">Edit</button></span></td></tr></template>
      <template #cards="{ items: cards }"><article v-for="item in cards" :key="item.id" class="cms-mobile-card"><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span><div class="cms-mobile-meta"><CmsStatusBadge :status="item.status" /><span>{{ item.businessType }}</span></div><span>{{ item.ownerName || 'No owner' }}</span><div class="cms-mobile-card__actions cms-table-actions"><button v-if="can('businesses.update')" type="button" @click="openEdit(item)">Edit</button></div></article></template>
    </CmsDataTable>
    <CmsPagination :pagination="pagination" @page-change="setPage" />
    <CmsBusinessForm :open="formOpen" :value="selected" :busy="isSaving" :server-error="formError" @close="formOpen = false" @submit="submitRecord" />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';
</style>
