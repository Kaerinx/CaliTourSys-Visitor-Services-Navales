import { http } from '@/services/http'

export const cmsOperationsApi = {
  getMedia(params) {
    return http.getAuth('/cms/media', params)
  },
  getMediaById(id) {
    return http.getAuth(`/cms/media/${id}`)
  },
  createMedia(payload) {
    return http.postAuth('/cms/media', payload)
  },
  updateMedia(id, payload) {
    return http.patchAuth(`/cms/media/${id}`, payload)
  },
  archiveMedia(id) {
    return http.patchAuth(`/cms/media/${id}/archive`, {})
  },
}

