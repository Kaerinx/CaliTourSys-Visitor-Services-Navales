import { http } from '@/services/http'

export const cmsContentApi = {
  getPromotions(params) {
    return http.getAuth('/cms/promotions', params)
  },
  getPromotionById(id) {
    return http.getAuth(`/cms/promotions/${id}`)
  },
  createPromotion(payload) {
    return http.postAuth('/cms/promotions', payload)
  },
  updatePromotion(id, payload) {
    return http.patchAuth(`/cms/promotions/${id}`, payload)
  },
  publishPromotion(id) {
    return http.patchAuth(`/cms/promotions/${id}/publish`, {})
  },
  archivePromotion(id) {
    return http.patchAuth(`/cms/promotions/${id}/archive`, {})
  },

  getEvents(params) {
    return http.getAuth('/cms/events', params)
  },
  getEventById(id) {
    return http.getAuth(`/cms/events/${id}`)
  },
  createEvent(payload) {
    return http.postAuth('/cms/events', payload)
  },
  updateEvent(id, payload) {
    return http.patchAuth(`/cms/events/${id}`, payload)
  },
  publishEvent(id) {
    return http.patchAuth(`/cms/events/${id}/publish`, {})
  },
  archiveEvent(id) {
    return http.patchAuth(`/cms/events/${id}/archive`, {})
  },

  getEventCategories(params) {
    return http.getAuth('/cms/event-categories', params)
  },
  createEventCategory(payload) {
    return http.postAuth('/cms/event-categories', payload)
  },
  updateEventCategory(id, payload) {
    return http.patchAuth(`/cms/event-categories/${id}`, payload)
  },

  getProductCategories(params) {
    return http.getAuth('/cms/product-categories', params)
  },
  createProductCategory(payload) {
    return http.postAuth('/cms/product-categories', payload)
  },
  updateProductCategory(id, payload) {
    return http.patchAuth(`/cms/product-categories/${id}`, payload)
  },

  getDestinationCategories(params) {
    return http.getAuth('/cms/destination-categories', params)
  },
  createDestinationCategory(payload) {
    return http.postAuth('/cms/destination-categories', payload)
  },
  updateDestinationCategory(id, payload) {
    return http.patchAuth(`/cms/destination-categories/${id}`, payload)
  },

  getMuseumCategories(params) {
    return http.getAuth('/cms/museum/categories', params)
  },
  createMuseumCategory(payload) {
    return http.postAuth('/cms/museum/categories', payload)
  },
  updateMuseumCategory(id, payload) {
    return http.patchAuth(`/cms/museum/categories/${id}`, payload)
  },
}
