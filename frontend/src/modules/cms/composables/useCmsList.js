import { computed, reactive, ref, watch } from 'vue'
import { ApiError, isAuthFailureError } from '@/services/http'

export function useCmsList(loader, initialFilters = {}) {
  const items = ref([])
  const pagination = ref({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })
  const filters = reactive({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    sort: '-createdAt',
    ...initialFilters,
  })
  const isLoading = ref(false)
  const error = ref('')
  let searchTimer = null

  const queryParams = computed(() => ({
    ...filters,
  }))

  async function load() {
    isLoading.value = true
    error.value = ''
    try {
      const { data, meta } = await loader(queryParams.value)
      items.value = data || []
      pagination.value = meta?.pagination || pagination.value
    } catch (err) {
      error.value = friendlyContentError(err)
    } finally {
      isLoading.value = false
    }
  }

  function setPage(page) {
    filters.page = page
    load()
  }

  function refresh() {
    return load()
  }

  watch(
    () => [
      filters.search,
      filters.status,
      filters.featured,
      filters.categoryId,
      filters.businessId,
      filters.businessType,
      filters.barangay,
      filters.locationType,
      filters.mimeType,
      filters.storageProvider,
    ],
    () => {
      filters.page = 1
      window.clearTimeout(searchTimer)
      searchTimer = window.setTimeout(load, 260)
    },
  )

  return {
    error,
    filters,
    isLoading,
    items,
    load,
    pagination,
    refresh,
    setPage,
  }
}

export function friendlyContentError(error) {
  if (error instanceof ApiError) {
    if (isAuthFailureError(error)) return 'Your session expired. Please sign in again to continue.'
    if (error.code === 'NETWORK_ERROR') return error.message
    if (error.status === 400) return validationMessage(error) || 'Please check the submitted fields.'
    if (error.status === 404) return 'The requested CMS record was not found.'
    if (error.status === 409) return 'A record with this slug already exists.'
    if (error.status === 429) return 'Too many requests. Please try again shortly.'
    if (error.status >= 500) return 'The CMS service is unavailable. Please try again later.'
  }

  return error?.message || 'The CMS request failed.'
}

function validationMessage(error) {
  const detail = error.details?.[0]
  if (!detail) return ''
  if (typeof detail === 'string') return detail
  return detail.message || detail.path?.join?.('.') || ''
}
