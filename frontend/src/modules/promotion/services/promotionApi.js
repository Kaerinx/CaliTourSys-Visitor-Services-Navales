import { http } from '../../../services/http'

const publicPath = (path) => `/public${path}`

export function getHome() {
  return http.get(publicPath('/home'))
}

export function getPromotions(params) {
  return http.get(publicPath('/promotions'), params)
}

export function getPromotionBySlug(slug) {
  return http.get(publicPath(`/promotions/${slug}`))
}

export function getEvents(params) {
  return http.get(publicPath('/events'), params)
}

export function getEventBySlug(slug) {
  return http.get(publicPath(`/events/${slug}`))
}

export function getEventCategories() {
  return http.get(publicPath('/event-categories'))
}

export function getProducts(params) {
  return http.get(publicPath('/products'), params)
}

export function getProductBySlug(slug) {
  return http.get(publicPath(`/products/${slug}`))
}

export function getProductCategories() {
  return http.get(publicPath('/product-categories'))
}

export function getBusinessBySlug(slug) {
  return http.get(publicPath(`/businesses/${slug}`))
}

export function getDestinations(params) {
  return http.get(publicPath('/destinations'), params)
}

export function getDestinationBySlug(slug) {
  return http.get(publicPath(`/destinations/${slug}`))
}

export function getDestinationCategories() {
  return http.get(publicPath('/destination-categories'))
}

export function getMapLocations(params) {
  return http.get(publicPath('/map/locations'), params)
}

export function getMuseumArtifacts(params) {
  return http.get(publicPath('/museum/artifacts'), params)
}

export function getMuseumArtifactBySlug(slug) {
  return http.get(publicPath(`/museum/artifacts/${slug}`))
}

export function getMuseumCategories() {
  return http.get(publicPath('/museum/categories'))
}

export function createItinerarySession(payload = {}) {
  return http.post(publicPath('/itinerary/sessions'), payload)
}

export function getItinerary(sessionToken) {
  return http.get(publicPath(`/itinerary/${sessionToken}`))
}

export function addItineraryItem(sessionToken, payload) {
  return http.post(publicPath(`/itinerary/${sessionToken}/items`), payload)
}

export function deleteItineraryItem(sessionToken, itemId) {
  return http.delete(publicPath(`/itinerary/${sessionToken}/items/${itemId}`))
}

export function submitInquiry(payload) {
  return http.post(publicPath('/inquiries'), payload)
}

export function subscribeNewsletter(payload) {
  return http.post(publicPath('/newsletter-subscriptions'), payload)
}
