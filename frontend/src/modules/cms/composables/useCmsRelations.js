import { onMounted, ref } from 'vue'
import { friendlyContentError } from './useCmsList'

export function useCmsRelations(loaders = {}) {
  const relations = ref({})
  const isLoadingRelations = ref(false)
  const relationError = ref('')

  async function loadRelations() {
    isLoadingRelations.value = true
    relationError.value = ''
    try {
      const entries = await Promise.all(
        Object.entries(loaders).map(async ([key, loader]) => {
          const { data } = await loader()
          return [key, data || []]
        }),
      )
      relations.value = Object.fromEntries(entries)
    } catch (err) {
      relationError.value = friendlyContentError(err)
    } finally {
      isLoadingRelations.value = false
    }
  }

  onMounted(loadRelations)

  return {
    isLoadingRelations,
    loadRelations,
    relationError,
    relations,
  }
}
