<script setup>
import { onMounted, ref } from 'vue'
import CmsConfirmDialog from '../../components/content/CmsConfirmDialog.vue'
import CmsContentToolbar from '../../components/content/CmsContentToolbar.vue'
import CmsDataTable from '../../components/content/CmsDataTable.vue'
import CmsPagination from '../../components/content/CmsPagination.vue'
import CmsProductForm from '../../components/content/CmsProductForm.vue'
import CmsStatusBadge from '../../components/content/CmsStatusBadge.vue'
import { friendlyContentError, useCmsList } from '../../composables/useCmsList'
import { useCmsRelations } from '../../composables/useCmsRelations'
import { cmsContentApi } from '../../services/cmsContentApi'
import { useCmsAuthStore } from '../../stores/authStore'

const auth = useCmsAuthStore()
const { filters, items, pagination, isLoading, error, load, setPage } = useCmsList(cmsContentApi.getProducts, {
  categoryId: '',
  businessId: '',
  featured: '',
  sort: '-createdAt',
})
const { relations, relationError } = useCmsRelations({
  categories: () => cmsContentApi.getProductCategories({ limit: 100, status: 'published' }),
  businesses: () => cmsContentApi.getBusinesses({ limit: 100, status: 'active' }),
})
const formOpen = ref(false)
const selected = ref(null)
const formError = ref('')
const isSaving = ref(false)
const notice = ref('')
const confirmAction = ref(null)
const isActionBusy = ref(false)
const columns = [{ key: 'name', label: 'Product' }, { key: 'business', label: 'Business' }, { key: 'category', label: 'Category' }, { key: 'price', label: 'Price' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]

onMounted(load)
const can = (permission) => auth.hasPermission(permission)
const money = (item) => item.priceAmount === null || item.priceAmount === undefined ? 'No price' : `${item.priceCurrency || 'PHP'} ${Number(item.priceAmount).toLocaleString()}${item.unitLabel ? ` / ${item.unitLabel}` : ''}`
function openCreate() { selected.value = null; formError.value = ''; formOpen.value = true }
function openEdit(item) { selected.value = item; formError.value = ''; formOpen.value = true }
async function submitRecord(payload) {
  isSaving.value = true
  formError.value = ''
  try {
    if (selected.value?.id) await cmsContentApi.updateProduct(selected.value.id, payload)
    else await cmsContentApi.createProduct(payload)
    formOpen.value = false
    notice.value = selected.value?.id ? 'Product updated.' : 'Product created.'
    await load()
  } catch (err) { formError.value = friendlyContentError(err) } finally { isSaving.value = false }
}
function askAction(type, item) { confirmAction.value = { type, item } }
async function runConfirmedAction() {
  isActionBusy.value = true
  try {
    if (confirmAction.value.type === 'publish') { await cmsContentApi.publishProduct(confirmAction.value.item.id); notice.value = 'Product published.' }
    else { await cmsContentApi.archiveProduct(confirmAction.value.item.id); notice.value = 'Product archived.' }
    confirmAction.value = null
    await load()
  } catch (err) { error.value = friendlyContentError(err) } finally { isActionBusy.value = false }
}
</script>

<template>
  <section class="cms-content-page" aria-labelledby="cms-products-title">
    <header class="cms-content-page__header"><div><p>OTOP Support</p><h1 id="cms-products-title">Products / OTOP</h1><span>Manage local products, pricing, producer links, and public publishing status.</span></div></header>
    <div v-if="notice" class="cms-content-page__notice" role="status">{{ notice }}</div>
    <div v-if="relationError" class="cms-content-page__notice" role="status">{{ relationError }}</div>
    <CmsContentToolbar v-model:search="filters.search" v-model:status="filters.status" v-model:featured="filters.featured" v-model:category-id="filters.categoryId" v-model:business-id="filters.businessId" create-label="Create product" :can-create="can('products.create')" :categories="relations.categories || []" :businesses="relations.businesses || []" show-featured show-category show-business @create="openCreate" />
    <CmsDataTable :columns="columns" :items="items" :loading="isLoading" :error="error" empty-title="No products found" empty-text="Create a product draft or adjust your filters." @retry="load">
      <template #rows="{ items: rows }"><tr v-for="item in rows" :key="item.id"><td><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span></td><td>{{ item.business?.name || 'No business' }}</td><td>{{ item.category?.name || 'No category' }}</td><td>{{ money(item) }}</td><td><CmsStatusBadge :status="item.status" /></td><td><span class="cms-table-actions"><button v-if="can('products.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('products.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button><button v-if="can('products.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button></span></td></tr></template>
      <template #cards="{ items: cards }"><article v-for="item in cards" :key="item.id" class="cms-mobile-card"><span class="cms-table-title"><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></span><div class="cms-mobile-meta"><CmsStatusBadge :status="item.status" /><span>{{ money(item) }}</span></div><span>{{ item.business?.name || 'No business' }} / {{ item.category?.name || 'No category' }}</span><div class="cms-mobile-card__actions cms-table-actions"><button v-if="can('products.update')" type="button" @click="openEdit(item)">Edit</button><button v-if="can('products.publish') && item.status !== 'published'" type="button" @click="askAction('publish', item)">Publish</button><button v-if="can('products.archive') && item.status !== 'archived'" class="is-danger" type="button" @click="askAction('archive', item)">Archive</button></div></article></template>
    </CmsDataTable>
    <CmsPagination :pagination="pagination" @page-change="setPage" />
    <CmsProductForm :open="formOpen" :value="selected" :categories="relations.categories || []" :businesses="relations.businesses || []" :busy="isSaving" :server-error="formError" @close="formOpen = false" @submit="submitRecord" />
    <CmsConfirmDialog :open="Boolean(confirmAction)" :title="confirmAction?.type === 'publish' ? 'Publish this product?' : 'Archive this product?'" :message="confirmAction?.type === 'publish' ? 'Published products can appear on the public OTOP pages.' : 'Archived products are hidden from active public content.'" :confirm-label="confirmAction?.type === 'publish' ? 'Publish' : 'Archive'" :tone="confirmAction?.type === 'archive' ? 'danger' : 'primary'" :busy="isActionBusy" @cancel="confirmAction = null" @confirm="runConfirmedAction" />
  </section>
</template>

<style scoped>
@import './cms-content-page.css';
</style>
