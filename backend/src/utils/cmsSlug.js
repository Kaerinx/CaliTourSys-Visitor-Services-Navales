const CMS_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function normalizeSlug(slug) {
  return typeof slug === 'string' ? slug.trim() : slug
}

module.exports = {
  CMS_SLUG_PATTERN,
  normalizeSlug,
}

