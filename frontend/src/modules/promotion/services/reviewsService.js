/**
 * Reviews & ratings service for public Destinations and Products.
 *
 * NOTE (frontend-only phase): there is no backend reviews endpoint yet, so this
 * persists to localStorage. The module is written as a drop-in seam — when the
 * backend ships, implement the API calls marked "BACKEND CONTRACT" below and
 * route the exported functions through them; the component API stays identical.
 *
 * Expected backend contract (for later wiring):
 *   GET  /public/reviews?targetType=product&targetId=:id
 *        -> { average, count, distribution, reviews: [{ id, rating, comment, author, createdAt }] }
 *   POST /public/reviews  { targetType, targetId, rating, comment }
 *        -> { id, rating, comment, author, createdAt }   (author from the session)
 */

const STORAGE_KEY = 'calitoursys_public_reviews'
const VALID_TARGET_TYPES = new Set(['product', 'destination'])

const wait = (payload, delay = 120) =>
  new Promise((resolve) => window.setTimeout(() => resolve(payload), delay))

function targetKey(targetType, targetId) {
  return `${targetType}:${targetId}`
}

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage unavailable (private mode / quota). Reviews stay in memory for the
    // current view; nothing else to do in this stub.
  }
}

function summarise(reviews) {
  const count = reviews.length
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0

  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating)))
    distribution[rating] += 1
    total += rating
  }

  const average = count ? Math.round((total / count) * 10) / 10 : 0

  return { average, count, distribution }
}

function normaliseTargetType(targetType) {
  const value = String(targetType || '').toLowerCase()
  return VALID_TARGET_TYPES.has(value) ? value : 'product'
}

/**
 * Fetch the aggregate rating and the list of reviews (newest first) for a target.
 * @returns {Promise<{ average:number, count:number, distribution:object, reviews:Array }>}
 */
export async function getReviews(targetType, targetId) {
  const type = normaliseTargetType(targetType)
  const store = readStore()
  const reviews = [...(store[targetKey(type, targetId)] || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )

  return wait({ ...summarise(reviews), reviews })
}

/**
 * Persist a new review for a target. `author` is supplied from the public
 * visitor session by the caller.
 * @returns {Promise<{ id, rating, comment, author, createdAt }>}
 */
export async function submitReview(targetType, targetId, { rating, comment, author }) {
  const type = normaliseTargetType(targetType)
  const safeRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 0)))

  if (safeRating < 1) throw new Error('Please select a star rating.')

  const review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    rating: safeRating,
    comment: String(comment || '').trim(),
    author: author || 'Guest',
    createdAt: new Date().toISOString(),
  }

  const store = readStore()
  const key = targetKey(type, targetId)
  store[key] = [review, ...(store[key] || [])]
  writeStore(store)

  return wait(review, 200)
}
