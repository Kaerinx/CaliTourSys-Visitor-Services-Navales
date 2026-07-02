import * as promotionApi from './promotionApi'

let itineraryState = []
const ITINERARY_SESSION_KEY = 'calitoursys_itinerary_session'

const API_UNAVAILABLE_MESSAGE =
  'The public tourism API is unavailable, so no content could be loaded right now.'

const accentPalette = ['#B5451B', '#7B341E', '#1B4332', '#D4711B', '#1565C0', '#D4AC0D']

const clone = (value) => JSON.parse(JSON.stringify(value))

function notifyItineraryUpdated() {
  window.dispatchEvent(new CustomEvent('calitoursys:itinerary-updated'))
}

const wait = (payload, delay = 80) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), delay)
  })

// Returns live API data. If the API is unavailable we resolve to an empty value
// (never fabricated demo content) so the UI renders its empty state.
async function withApiData(apiCall, emptyValue = []) {
  try {
    const response = await apiCall()
    return response.data
  } catch (error) {
    console.warn(API_UNAVAILABLE_MESSAGE, error)
    return clone(emptyValue)
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
  if (typeof category === 'string') return category
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
    description:
      product.shortDescription ||
      product.description ||
      'Public product information is being prepared.',
    tags: product.tags || [],
    imageUrl: product.primaryImage?.url,
  }
}

function slugify(value) {
  return String(value || 'tourism-package')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferPackageCategory(tourismPackage) {
  const content = [
    tourismPackage.name,
    tourismPackage.description,
    tourismPackage.targetMarket,
    tourismPackage.remarks,
    ...(tourismPackage.items || []).map((item) => `${item.name} ${item.location} ${item.status}`),
  ]
    .join(' ')
    .toLowerCase()

  if (/church|faith|heritage|devotion|pilgrim|relig|quipayo|hinulid|santo|visita/.test(content)) {
    return 'Cultural'
  }

  if (/bay|coast|island|sea|fish|fishing|kawit|tanglad|cabgan|san miguel/.test(content)) {
    return 'Nature'
  }

  if (/farm|agri|hacienda|harvest|countryside/.test(content)) {
    return 'Food'
  }

  if (/food|product|bagoong|pili|seafood|producer|market|local/.test(content)) {
    return 'Food'
  }

  if (/festival|event|calendar|celebration|parade/.test(content)) {
    return 'Events'
  }

  return 'Nature'
}

function packageCategoryList(tourismPackage, fallback) {
  // Categories are flexible combinations attached to the package. Prefer an
  // explicit array from the API; otherwise split a combined string (e.g.
  // "Sports, Outdoor & Endurance") so the UI can render the full cluster.
  if (Array.isArray(tourismPackage.categories) && tourismPackage.categories.length) {
    return tourismPackage.categories
      .map((category) => ({
        name: categoryName(category),
        color: category?.color || category?.markerColor || '',
      }))
      .filter((category) => category.name)
  }

  const combined = categoryName(tourismPackage.category) || fallback
  return String(combined)
    .split(/\s*(?:,|\/|&|\+)\s*/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, color: '' }))
}

function mapReadyPackage(tourismPackage, index = 0) {
  const packageItems = Array.isArray(tourismPackage.items) ? tourismPackage.items : []
  const gallery = Array.isArray(tourismPackage.gallery)
    ? tourismPackage.gallery
        .map((image) => ({
          ...image,
          url: image.url || image.imageUrl,
        }))
        .filter((image) => image.url)
    : []
  const category = categoryName(tourismPackage.category) || inferPackageCategory(tourismPackage)
  const categories = packageCategoryList(tourismPackage, category)
  const packageId =
    tourismPackage.slug || `package-${slugify(tourismPackage.name)}-${tourismPackage.id}`

  return {
    id: packageId,
    apiId: tourismPackage.id,
    slug: packageId,
    name: tourismPackage.name,
    producer: 'Calabanga Tourism Product Development',
    businessId: null,
    price: 'Price upon inquiry',
    category,
    categories,
    accent: accentPalette[(index + 2) % accentPalette.length],
    accredited: true,
    featured: true,
    description:
      tourismPackage.description ||
      tourismPackage.remarks ||
      'This tourism package has been approved for promotion handoff.',
    tags: [tourismPackage.targetMarket, tourismPackage.estimatedDuration].filter(Boolean),
    imageUrl:
      tourismPackage.primaryImage?.url ||
      tourismPackage.imageUrl ||
      packageImageForCategory(category),
    sourceModule: 'product-development',
    packageStatus: tourismPackage.packageStatus,
    targetMarket: tourismPackage.targetMarket || 'General visitors',
    estimatedDuration: tourismPackage.estimatedDuration || 'Duration to be confirmed',
    itemCount: tourismPackage.itemCount ?? packageItems.length,
    assetCount:
      tourismPackage.assetCount ?? packageItems.filter((item) => item.itemType === 'Asset').length,
    activityCount:
      tourismPackage.activityCount ??
      packageItems.filter((item) => item.itemType === 'Activity').length,
    remarks: tourismPackage.remarks || '',
    items: packageItems,
    gallery,
  }
}

async function getReadyPackageById(id) {
  let data = null
  let mappedPackage = null

  try {
    const response = await promotionApi.getPackageBySlug(id)
    data = response.data
  } catch {
    const readyPackages = await withApiData(() => promotionApi.getReadyForPromotionPackages(), [])
    mappedPackage = readyPackages
      .map(mapReadyPackage)
      .find(
        (packageCard) =>
          packageCard.id === id || packageCard.slug === id || packageCard.apiId === id,
      )
  }

  const tourismPackage = mappedPackage || (data ? mapReadyPackage(data) : null)

  if (!tourismPackage) {
    throw new Error('Package not found')
  }

  return {
    ...tourismPackage,
    businessProfile: {
      id: 'calabanga-tourism-product-development',
      name: 'Calabanga Tourism Product Development',
      type: 'Tourism Office',
      owner: 'LGU Calabanga',
      location: 'Calabanga, Camarines Sur',
      accreditationStatus: 'approved',
      accreditedSince: '2026',
      description: 'Prepared by the Product Development module and approved for public promotion.',
      contacts: [],
    },
    gallery: tourismPackage.gallery || [],
    relatedProducts: [],
  }
}

function packageImageForCategory(category) {
  const images = {
    Cultural:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg',
    Nature:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg',
    Food: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg',
    Events:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg',
  }

  return images[packageCategoryImageKey(category)] || images.Nature
}

function packageCategoryImageKey(category) {
  const value = String(category || '').toLowerCase()
  if (value.includes('food')) return 'Food'
  if (value.includes('event')) return 'Events'
  if (value.includes('cultural')) return 'Cultural'
  return 'Nature'
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
    location: [business.barangay, business.municipality, business.province]
      .filter(Boolean)
      .join(', '),
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

function formatYear(value) {
  if (!value) return 'verification pending'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'verification pending' : String(date.getFullYear())
}

function mapAccreditedBusiness(business) {
  const location = [
    business.barangay,
    business.municipality || business.cityMunicipality,
    business.province,
  ]
    .filter(Boolean)
    .join(', ')

  return {
    id: business.id,
    apiId: business.businessId,
    slug: business.slug,
    name: business.name,
    type: business.businessType || 'Tourism Business',
    owner: business.ownerName || 'Registered business owner',
    location: location || business.region || 'Calabanga, Camarines Sur',
    accreditationStatus: business.accreditation?.status || 'accredited',
    accreditationNumber: business.accreditation?.accreditationNumber,
    accreditedSince: formatYear(business.accreditation?.issuedAt),
    expiresAt: business.accreditation?.expiresAt,
    contactEmail: business.contactEmail || '',
    phone: business.phone || '',
    description:
      business.description ||
      `${business.businessType || 'Tourism business'} accredited through the LGU Tourism Office.`,
    source: business.source,
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
      destination.shortDescription ||
      destination.description ||
      'Destination details are being prepared.',
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    accredited: true,
    featured: Boolean(destination.isFeatured),
    imageUrl: destination.primaryImage?.url,
  }
}

function mapTourismAsset(asset, index = 0) {
  return {
    id: asset.slug || `asset-${slugify(asset.name)}-${asset.id}`,
    apiId: asset.id,
    slug: asset.slug,
    name: asset.name,
    category: categoryName(asset.category),
    color: colorFor(asset.category, index),
    distance: asset.barangay || asset.location || 'Calabanga',
    address: [asset.barangay || asset.location, 'Calabanga', 'Camarines Sur'].filter(Boolean).join(', '),
    hours: 'Visiting information to be confirmed',
    description: asset.shortDescription || asset.description || 'Tourism asset details are being prepared.',
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude: asset.latitude,
    longitude: asset.longitude,
    accredited: true,
    featured: true,
    imageUrl: asset.primaryImage?.url || asset.imageUrl,
    targetMarket: asset.targetMarket,
    sourceBusinessName: asset.sourceBusinessName,
    sourceBusinessType: asset.sourceBusinessType,
    sourceAccreditationRecordNumber: asset.sourceAccreditationRecordNumber,
    sourceModule: asset.sourceModule || 'product-development',
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
    desc:
      artifact.shortDescription || artifact.description || 'Artifact details are being prepared.',
    details: artifact.historicalNotes || artifact.description,
    featured: Boolean(artifact.isFeatured),
    imageUrl: artifact.primaryImage?.url,
  }
}

function userMessageForError(error) {
  if (error?.status === 429) return 'Too many requests. Please try again later.'
  if (error?.status === 404) return 'This item is no longer available.'
  if (error?.code === 'NETWORK_ERROR')
    return 'Unable to connect to the tourism API. Please try again later.'
  return error?.message || 'The request could not be completed. Please try again.'
}

export async function getHome() {
  return withApiData(() => promotionApi.getHome(), {
    featuredProducts: [],
    upcomingEvents: [],
    featuredDestinations: [],
    featuredMuseumArtifacts: [],
    featuredPromotions: [],
  })
}

export async function getPromotions(params) {
  const data = await withApiData(() => promotionApi.getPromotions(params), [])
  return Array.isArray(data) ? data : []
}

export function getCampaigns() {
  return wait([])
}

export async function getEvents(params) {
  const data = await withApiData(() => promotionApi.getEvents(params), [])
  return data.map((event, index) => (event.slug ? mapEvent(event, index) : event))
}

export async function getDestinations(params) {
  const data = await withApiData(() => promotionApi.getDestinations(params), [])
  return data.map((destination, index) =>
    destination.slug ? mapDestination(destination, index) : destination,
  )
}

export async function getTourismAssets(params) {
  const data = await withApiData(() => promotionApi.getTourismAssets(params), [])
  return data.map((asset, index) =>
    asset.sourceModule === 'product-development' ? mapTourismAsset(asset, index) : asset,
  )
}

export async function getPromotionalProducts(params) {
  const data = await withApiData(() => promotionApi.getProducts(params), [])

  return data.map((product, index) => (product.slug ? mapProduct(product, index) : product))
}

export async function getPromotionalPackages() {
  const readyPackages = await withApiData(
    () => promotionApi.getReadyForPromotionPackages(),
    [],
  )

  return readyPackages.map(mapReadyPackage)
}

export async function getProductById(id) {
  const response = await promotionApi.getProductBySlug(id).catch((error) => {
    throw new Error(userMessageForError(error))
  })
  const data = response.data

  if (data.product) return mapProductDetail(data)

  return { ...data, relatedProducts: [] }
}

export function getPackageById(id) {
  return getReadyPackageById(id)
}

export async function getBusinessById(id) {
  const response = await promotionApi.getBusinessBySlug(id).catch((error) => {
    throw new Error(userMessageForError(error))
  })
  const data = response.data

  return data.slug ? mapBusiness(data) : data
}

export async function getAccreditedBusinesses(params = {}) {
  const data = await withApiData(
    () => promotionApi.getBusinesses({ limit: 50, sort: '-issuedAt', ...params }),
    [],
  )

  return data.map((business) =>
    business.businessType || business.accreditation ? mapAccreditedBusiness(business) : business,
  )
}

export async function getMapLocations(params = { format: 'list' }) {
  const data = await withApiData(() => promotionApi.getMapLocations(params), [])

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

  return data.map((location, index) =>
    location.locationType ? mapMapLocation(location, index) : location,
  )
}

export async function getMapLocationGeoJson(params = {}) {
  return withApiData(() => promotionApi.getMapLocations({ ...params, format: 'geojson' }), {
    type: 'FeatureCollection',
    features: [],
  })
}

export async function getMuseumItems(params) {
  const data = await withApiData(() => promotionApi.getMuseumArtifacts(params), [])
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
      (saved.itemId === itemId ||
        saved.apiId === item.apiId ||
        saved.backendItemId === item.backendItemId),
  )

  if (savedItem?.backendItemId) {
    try {
      const sessionToken = getStoredSessionToken()
      if (sessionToken)
        await promotionApi.deleteItineraryItem(sessionToken, savedItem.backendItemId)
    } catch (error) {
      if (error?.status !== 404) throw new Error(userMessageForError(error))
    }
  }

  itineraryState = itineraryState.filter(
    (saved) =>
      !(
        saved.itemType === itemType &&
        (saved.itemId === itemId ||
          saved.apiId === item.apiId ||
          saved.backendItemId === item.backendItemId)
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
