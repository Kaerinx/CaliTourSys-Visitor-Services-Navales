export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function toNullable(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : null
}

export function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}

export function validateSlug(value) {
  if (!String(value || '').trim()) return 'Slug is required.'
  if (!SLUG_PATTERN.test(String(value).trim())) return 'Use lowercase letters, numbers, and hyphens only.'
  return ''
}

export function validateRequired(value, label) {
  return String(value || '').trim() ? '' : `${label} is required.`
}
