import {
  businessProfiles,
  campaigns,
  destinations,
  events,
  itineraryItems,
  mapLocations,
  museumItems,
  otopProducts,
  promotions,
} from '../data/promotionMockData'

let itineraryState = [...itineraryItems]

const clone = (value) => JSON.parse(JSON.stringify(value))

const wait = (payload, delay = 220) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), delay)
  })

export function getPromotions() {
  return wait(promotions)
}

export function getCampaigns() {
  return wait(campaigns)
}

export function getEvents() {
  return wait(events)
}

export function getDestinations() {
  return wait(destinations)
}

export function getPromotionalProducts() {
  return wait(otopProducts)
}

export async function getProductById(id) {
  const product = otopProducts.find((item) => item.id === id)

  if (!product) {
    throw new Error('Product not found')
  }

  return wait(product)
}

export async function getBusinessById(id) {
  const business = businessProfiles.find((item) => item.id === id)

  if (!business) {
    throw new Error('Business profile not found')
  }

  return wait(business)
}

export function getMapLocations() {
  return wait(mapLocations)
}

export function getMuseumItems() {
  return wait(museumItems)
}

export function getItineraryItems() {
  return wait(itineraryState, 80)
}

export async function saveToItinerary(item) {
  const nextItem = {
    id: `${item.itemType || item.type}-${item.itemId || item.id}`,
    itemId: item.itemId || item.id,
    itemType: item.itemType || item.type,
    title: item.title || item.name,
    savedAt: new Date().toISOString(),
  }

  itineraryState = [
    nextItem,
    ...itineraryState.filter(
      (saved) => !(saved.itemId === nextItem.itemId && saved.itemType === nextItem.itemType),
    ),
  ]

  return wait(nextItem, 180)
}

export async function removeFromItinerary(item) {
  const itemId = item.itemId || item.id
  const itemType = item.itemType || item.type

  itineraryState = itineraryState.filter(
    (saved) => !(saved.itemId === itemId && saved.itemType === itemType),
  )

  return wait({ itemId, itemType, removed: true }, 180)
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
