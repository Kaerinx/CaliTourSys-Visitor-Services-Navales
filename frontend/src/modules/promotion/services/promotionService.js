import * as promotionApi from './promotionApi'
import {
  businessProfiles,
  campaigns as mockCampaigns,
  destinations as mockDestinations,
  events as mockEvents,
  itineraryItems,
  mapLocations as mockMapLocations,
  museumItems as mockMuseumItems,
  otopProducts,
  promotions as mockPromotions,
} from '../data/promotionMockData'

let itineraryState = [...itineraryItems]
const ITINERARY_SESSION_KEY = 'calitoursys_itinerary_session'

const DEVELOPMENT_FALLBACK_MESSAGE =
  'Using development-only mock promotion data because the backend API is unavailable.'

const accentPalette = ['#B5451B', '#7B341E', '#1B4332', '#D4711B', '#1565C0', '#D4AC0D']

const clone = (value) => JSON.parse(JSON.stringify(value))

function notifyItineraryUpdated() {
  window.dispatchEvent(new CustomEvent('calitoursys:itinerary-updated'))
}

const wait = (payload, delay = 80) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), delay)
  })

async function withMockFallback(apiCall, fallbackFactory) {
  try {
    const response = await apiCall()
    return response.data
  } catch (error) {
    console.warn(DEVELOPMENT_FALLBACK_MESSAGE, error)
    return clone(typeof fallbackFactory === 'function' ? fallbackFactory(error) : fallbackFactory)
  }
}

function formatPrice(price) {
  if (!price || price.amount === null || price.amount === undefined) return 'Price upon inquiry'

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: price.currency || 'PHP',
  }).format(Number(price.amount))
}

function dateParts(value) {
  if (!value) {
    return {
      day: '--',
      month: 'TBA',
      date: 'Date to be announced',
    }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return {
      day: '--',
      month: 'TBA',
      date: 'Date to be announced',
    }
  }

  return {
    day: new Intl.DateTimeFormat('en-PH', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(date).toUpperCase(),
    date: new Intl.DateTimeFormat('en-PH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
      .format(date)
      .toUpperCase(),
  }
}

function categoryName(category) {
  return category?.name || 'Tourism'
}

function colorFor(value, index = 0) {
  if (value?.color) return value.color
  return accentPalette[index % accentPalette.length]
}

function mapProduct(product, index = 0) {
  return {
    id: product.slug,
    apiId: product.id,
    slug: product.slug,
    name: product.name,
    producer: product.business?.name || 'Calabanga producer',
    businessId: product.business?.slug,
    price: formatPrice(product.price),
    category: categoryName(product.category),
    accent: colorFor(product.category, index),
    accredited: product.accreditationStatus === 'accredited',
    featured: Boolean(product.isFeatured),
    description: product.shortDescription || product.description || 'Public product information is being prepared.',
    tags: product.tags || [],
    imageUrl: product.primaryImage?.url,
  }
}

function mapProductDetail(detail) {
  const product = mapProduct(
    {
      ...detail.product,
      description: detail.description,
    },
    0,
  )

  return {
    ...product,
    description: detail.description || product.description,
    gallery: detail.gallery || [],
    relatedProducts: (detail.relatedProducts || []).map((relatedProduct, index) =>
      mapProduct(relatedProduct, index + 1),
    ),
    businessProfile: mapBusiness(detail.business),
  }
}

function mapBusiness(business) {
  if (!business) return null

  const primaryContact = business.contacts?.[0]

  return {
    id: business.slug,
    apiId: business.id,
    slug: business.slug,
    name: business.name,
    type: business.businessType,
    owner: business.ownerName,
    location: [business.barangay, business.municipality, business.province].filter(Boolean).join(', '),
    accreditationStatus: business.accreditation?.status || 'pending',
    accreditedSince: business.accreditation?.issuedAt
      ? new Date(business.accreditation.issuedAt).getFullYear()
      : 'verification pending',
    contactEmail: primaryContact?.contactType === 'email' ? primaryContact.contactValue : '',
    phone: primaryContact?.contactType === 'phone' ? primaryContact.contactValue : '',
    description: business.description || 'Public business profile information is being prepared.',
    contacts: business.contacts || [],
  }
}

function mapEvent(event, index = 0) {
  const parts = dateParts(event.startsAt)

  return {
    id: event.slug,
    apiId: event.id,
    slug: event.slug,
    title: event.title,
    ...parts,
    location: event.venueName || 'Calabanga',
    category: categoryName(event.category),
    accent: colorFor(event.category, index),
    desc: event.shortDescription || event.description || 'Event details are being prepared.',
    featured: Boolean(event.isFeatured),
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    imageUrl: event.primaryImage?.url,
  }
}

function mapDestination(destination, index = 0) {
  return {
    id: destination.slug,
    apiId: destination.id,
    slug: destination.slug,
    name: destination.name,
    category: categoryName(destination.category),
    color: colorFor(destination.category, index),
    distance: destination.barangay || 'Calabanga',
    address: [destination.barangay, 'Calabanga', 'Camarines Sur'].filter(Boolean).join(', '),
    hours: destination.openingHoursText || 'Visiting information to be confirmed',
    description:
      destination.shortDescription || destination.description || 'Destination details are being prepared.',
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    accredited: true,
    featured: Boolean(destination.isFeatured),
    imageUrl: destination.primaryImage?.url,
  }
}

function mapMapLocation(location, index = 0) {
  return {
    id: location.slug || location.id,
    apiId: location.targetId || null,
    slug: location.slug,
    name: location.label,
    category: location.category || location.locationType,
    color: location.markerColor || colorFor(null, index),
    distance: location.barangay || 'Map-ready',
    address: location.label,
    hours: 'Visiting information to be confirmed',
    description: location.description || 'Map discovery record from the public API.',
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude: location.latitude,
    longitude: location.longitude,
    locationType: location.locationType,
    accredited: true,
    imageUrl: location.primaryImage,
  }
}

function mapArtifact(artifact, index = 0) {
  return {
    id: artifact.slug,
    apiId: artifact.id,
    slug: artifact.slug,
    name: artifact.name,
    era: artifact.eraLabel || artifact.category?.name || 'Heritage',
    accent: colorFor(artifact.category, index),
    category: categoryName(artifact.category),
    desc: artifact.shortDescription || artifact.description || 'Artifact details are being prepared.',
    details: artifact.historicalNotes || artifact.description,
    featured: Boolean(artifact.isFeatured),
    imageUrl: artifact.primaryImage?.url,
  }
}

function userMessageForError(error) {
  if (error?.status === 429) return 'Too many requests. Please try again later.'
  if (error?.status === 404) return 'This item is no longer available.'
  if (error?.code === 'NETWORK_ERROR') return 'Unable to connect to the tourism API. Please try again later.'
  return error?.message || 'The request could not be completed. Please try again.'
}

export async function getHome() {
  return withMockFallback(() => promotionApi.getHome(), () => ({
    featuredProducts: otopProducts.slice(0, 4),
    upcomingEvents: mockEvents.slice(0, 3),
    featuredDestinations: mockDestinations.slice(0, 5),
    featuredMuseumArtifacts: mockMuseumItems.slice(0, 4),
    featuredPromotions: mockPromotions,
  }))
}

export async function getPromotions(params) {
  const data = await withMockFallback(
    () => promotionApi.getPromotions(params),
    () => mockPromotions,
  )
  return Array.isArray(data) ? data : []
}

export function getCampaigns() {
  return wait(mockCampaigns)
}

export async function getEvents(params) {
  const data = await withMockFallback(
    () => promotionApi.getEvents(params),
    () => mockEvents,
  )
  return data.map((event, index) => (event.slug ? mapEvent(event, index) : event))
}

export async function getDestinations(params) {
  const data = await withMockFallback(
    () => promotionApi.getDestinations(params),
    () => mockDestinations,
  )
  return data.map((destination, index) =>
    destination.slug ? mapDestination(destination, index) : destination,
  )
}

export async function getPromotionalProducts(params) {
  const data = await withMockFallback(
    () => promotionApi.getProducts(params),
    () => otopProducts,
  )
  return data.map((product, index) => (product.slug ? mapProduct(product, index) : product))
}

export async function getProductById(id) {
  const data = await withMockFallback(
    () => promotionApi.getProductBySlug(id),
    () => {
      const product = otopProducts.find((item) => item.id === id)
      if (!product) throw new Error('Product not found')
      return product
    },
  )

  if (data.product) return mapProductDetail(data)

  return {
    ...data,
    relatedProducts: otopProducts
      .filter((item) => item.id !== data.id)
      .slice(0, 4),
  }
}

export async function getBusinessById(id) {
  const data = await withMockFallback(
    () => promotionApi.getBusinessBySlug(id),
    () => {
      const business = businessProfiles.find((item) => item.id === id)
      if (!business) throw new Error('Business profile not found')
      return business
    },
  )

  return data.slug ? mapBusiness(data) : data
}

export async function getMapLocations(params = { format: 'list' }) {
  const data = await withMockFallback(
    () => promotionApi.getMapLocations(params),
    () => mockMapLocations,
  )

  if (data?.type === 'FeatureCollection') {
    return data.features.map((feature, index) =>
      mapMapLocation(
        {
          id: feature.properties.id,
          label: feature.properties.label,
          slug: feature.properties.slug,
          locationType: feature.properties.locationType,
          category: feature.properties.category,
          markerColor: feature.properties.markerColor,
          primaryImage: feature.properties.primaryImage,
          description: feature.properties.description,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
        },
        index,
      ),
    )
  }

  return data.map((location, index) => (location.locationType ? mapMapLocation(location, index) : location))
}

export async function getMapLocationGeoJson(params = {}) {
  return withMockFallback(
    () => promotionApi.getMapLocations({ ...params, format: 'geojson' }),
    () => ({
      type: 'FeatureCollection',
      features: mockMapLocations.map((location, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            123.24 + (Number(location.x || index * 8) - 50) / 1000,
            13.7 + (Number(location.y || index * 8) - 50) / 1000,
          ],
        },
        properties: {
          id: location.id,
          locationType: 'destination',
          slug: location.id,
          label: location.name,
          category: location.category,
          markerColor: location.color,
          markerIcon: null,
          primaryImage: location.imageUrl,
          description: location.description,
        },
      })),
    }),
  )
}

export async function getMuseumItems(params) {
  const data = await withMockFallback(
    () => promotionApi.getMuseumArtifacts(params),
    () => mockMuseumItems,
  )
  return data.map((artifact, index) => (artifact.slug ? mapArtifact(artifact, index) : artifact))
}

function getStoredSessionToken() {
  return window.localStorage.getItem(ITINERARY_SESSION_KEY)
}

function setStoredSessionToken(token) {
  window.localStorage.setItem(ITINERARY_SESSION_KEY, token)
}

function clearStoredSessionToken() {
  window.localStorage.removeItem(ITINERARY_SESSION_KEY)
}

async function ensureItinerarySession() {
  const existingToken = getStoredSessionToken()
  if (existingToken) return existingToken

  const response = await promotionApi.createItinerarySession()
  setStoredSessionToken(response.data.sessionToken)
  return response.data.sessionToken
}

export function getItineraryItems() {
  return wait(itineraryState, 80)
}

export async function loadItinerary() {
  const sessionToken = getStoredSessionToken()
  if (!sessionToken) {
    itineraryState = []
    return wait({ sessionToken: null, itemCount: 0, items: [] }, 60)
  }

  try {
    const response = await promotionApi.getItinerary(sessionToken)
    itineraryState = response.data.items.map((item) => ({
      id: item.id,
      backendItemId: item.id,
      itemId: item.targetId,
      apiId: item.targetId,
      itemType: item.itemType,
      title: item.titleSnapshot || item.summary?.title,
      savedAt: item.savedAt,
      summary: item.summary,
    }))

    return response.data
  } catch (error) {
    if (error?.status === 404) {
      clearStoredSessionToken()
      itineraryState = []
      return { sessionToken: null, itemCount: 0, items: [] }
    }

    throw new Error(userMessageForError(error))
  }
}

export function isSavedToItinerary(itemType, targetId, localId = targetId) {
  return itineraryState.some(
    (item) =>
      item.itemType === itemType &&
      (item.apiId === targetId || item.itemId === targetId || item.itemId === localId),
  )
}

export async function saveToItinerary(item) {
  let backendItem = null

  if (item.apiId) {
    try {
      const sessionToken = await ensureItinerarySession()
      const response = await promotionApi.addItineraryItem(sessionToken, {
        itemType: item.itemType || item.type,
        targetId: item.apiId,
      })
      backendItem = response.data
    } catch (error) {
      if (error?.status === 404) clearStoredSessionToken()
      throw new Error(userMessageForError(error))
    }
  }

  const nextItem = {
    id: backendItem?.id || `${item.itemType || item.type}-${item.itemId || item.id}`,
    backendItemId: backendItem?.id,
    itemId: item.itemId || item.id,
    apiId: item.apiId || backendItem?.targetId,
    itemType: item.itemType || item.type,
    title: backendItem?.titleSnapshot || item.title || item.name,
    savedAt: backendItem?.savedAt || new Date().toISOString(),
  }

  itineraryState = [
    nextItem,
    ...itineraryState.filter(
      (saved) =>
        !(
          saved.itemType === nextItem.itemType &&
          (saved.itemId === nextItem.itemId ||
            (nextItem.apiId && saved.apiId === nextItem.apiId) ||
            (nextItem.backendItemId && saved.backendItemId === nextItem.backendItemId))
        ),
    ),
  ]

  notifyItineraryUpdated()

  return wait(nextItem, 80)
}

export async function removeFromItinerary(item) {
  const itemId = item.itemId || item.id
  const itemType = item.itemType || item.type
  const savedItem = itineraryState.find(
    (saved) =>
      saved.itemType === itemType &&
      (saved.itemId === itemId || saved.apiId === item.apiId || saved.backendItemId === item.backendItemId),
  )

  if (savedItem?.backendItemId) {
    try {
      const sessionToken = getStoredSessionToken()
      if (sessionToken) await promotionApi.deleteItineraryItem(sessionToken, savedItem.backendItemId)
    } catch (error) {
      if (error?.status !== 404) throw new Error(userMessageForError(error))
    }
  }

  itineraryState = itineraryState.filter(
    (saved) =>
      !(
        saved.itemType === itemType &&
        (saved.itemId === itemId || saved.apiId === item.apiId || saved.backendItemId === item.backendItemId)
      ),
  )

  notifyItineraryUpdated()

  return wait({ itemId, itemType, removed: true }, 80)
}

export async function submitTourismInquiry(payload) {
  try {
    const response = await promotionApi.submitInquiry({
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      contactNumber: payload.contactNumber?.trim() || undefined,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      sourcePage: payload.sourcePage,
    })
    return response.data
  } catch (error) {
    throw new Error(userMessageForError(error))
  }
}

export async function subscribeToNewsletter(payload) {
  try {
    const response = await promotionApi.subscribeNewsletter({
      email: payload.email.trim().toLowerCase(),
      fullName: payload.fullName?.trim() || undefined,
    })
    return response.data
  } catch (error) {
    throw new Error(userMessageForError(error))
  }
}

export async function sharePublicItem(item) {
  const shareUrl = item.url || `${window.location.origin}${item.path || window.location.pathname}`
  const shareData = {
    title: item.title || item.name || 'TWBIS Calabanga Tourism',
    text: item.text || item.description || item.desc || 'Explore Calabanga tourism information.',
    url: shareUrl,
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return { method: 'native', ...shareData }
    } catch {
      // Continue to clipboard fallback when native share is cancelled or unavailable.
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl)
      return { method: 'clipboard', ...shareData }
    } catch {
      // Fall through to manual mode if clipboard permissions are denied.
    }
  }

  return { method: 'manual', ...shareData }
}

export const promotionWriteApi = {
  createItinerarySession: promotionApi.createItinerarySession,
  getItinerary: promotionApi.getItinerary,
  addItineraryItem: promotionApi.addItineraryItem,
  deleteItineraryItem: promotionApi.deleteItineraryItem,
  submitInquiry: promotionApi.submitInquiry,
  subscribeNewsletter: promotionApi.subscribeNewsletter,
}
