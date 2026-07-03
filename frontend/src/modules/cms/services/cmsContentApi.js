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

  getProducts(params) {
    return http.getAuth('/cms/products', params)
  },
  getProductAccreditedEstablishments(params) {
    return http.getAuth('/accredited-establishments', params)
  },
  getProductById(id) {
    return http.getAuth(`/cms/products/${id}`)
  },
  createProduct(payload) {
    return http.postAuth('/cms/products', payload)
  },
  updateProduct(id, payload) {
    return http.patchAuth(`/cms/products/${id}`, payload)
  },
  publishProduct(id) {
    return http.patchAuth(`/cms/products/${id}/publish`, {})
  },
  archiveProduct(id) {
    return http.patchAuth(`/cms/products/${id}/archive`, {})
  },

  getDestinations(params) {
    return http.getAuth('/cms/destinations', params)
  },
  getDestinationById(id) {
    return http.getAuth(`/cms/destinations/${id}`)
  },
  createDestination(payload) {
    return http.postAuth('/cms/destinations', payload)
  },
  updateDestination(id, payload) {
    return http.patchAuth(`/cms/destinations/${id}`, payload)
  },
  publishDestination(id) {
    return http.patchAuth(`/cms/destinations/${id}/publish`, {})
  },
  archiveDestination(id) {
    return http.patchAuth(`/cms/destinations/${id}/archive`, {})
  },

  getBusinesses(params) {
    return http.getAuth('/cms/businesses', params)
  },
  getBusinessById(id) {
    return http.getAuth(`/cms/businesses/${id}`)
  },
  createBusiness(payload) {
    return http.postAuth('/cms/businesses', payload)
  },
  updateBusiness(id, payload) {
    return http.patchAuth(`/cms/businesses/${id}`, payload)
  },

  getAccreditationDashboard() {
    return http.getAuth('/cms/business-accreditation/dashboard')
  },
  getAccreditationSession() {
    return http.getAuth('/cms/business-accreditation/session')
  },
  getAccreditationApplications(params) {
    return http.getAuth('/cms/business-accreditation/applications', params)
  },
  getAccreditationApplication(id) {
    return http.getAuth(`/cms/business-accreditation/applications/${id}`)
  },
  reviewAccreditationApplication(id, payload) {
    return http.patchAuth(`/cms/business-accreditation/applications/${id}/review`, payload)
  },
  getAccreditationRecords(params) {
    return http.getAuth('/cms/business-accreditation/records', params)
  },

  getMuseumArtifacts(params) {
    return http.getAuth('/cms/museum/artifacts', params)
  },
  getMuseumArtifactById(id) {
    return http.getAuth(`/cms/museum/artifacts/${id}`)
  },
  createMuseumArtifact(payload) {
    return http.postAuth('/cms/museum/artifacts', payload)
  },
  updateMuseumArtifact(id, payload) {
    return http.patchAuth(`/cms/museum/artifacts/${id}`, payload)
  },
  publishMuseumArtifact(id) {
    return http.patchAuth(`/cms/museum/artifacts/${id}/publish`, {})
  },
  archiveMuseumArtifact(id) {
    return http.patchAuth(`/cms/museum/artifacts/${id}/archive`, {})
  },

  getMapLocations(params) {
    return http.getAuth('/cms/map-locations', params)
  },
  getMapLocationById(id) {
    return http.getAuth(`/cms/map-locations/${id}`)
  },
  createMapLocation(payload) {
    return http.postAuth('/cms/map-locations', payload)
  },
  updateMapLocation(id, payload) {
    return http.patchAuth(`/cms/map-locations/${id}`, payload)
  },
  deleteMapLocation(id) {
    return http.deleteAuth(`/cms/map-locations/${id}`)
  },
}
