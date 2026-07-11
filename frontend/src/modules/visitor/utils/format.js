export function titleize(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatStatus(value) {
  const labels = {
    checked_in: 'Checked-in',
    checked_out: 'Checked-out',
    pending: 'Pending',
    cancelled: 'Cancelled',
    responded: 'Responded',
    archived: 'Archived',
  }
  return labels[value] || titleize(value)
}

export function formatVisitorType(value) {
  const labels = {
    local: 'Local',
    domestic: 'Domestic',
    international: 'International',
  }
  return labels[value] || titleize(value)
}

export function formatSourceType(value) {
  const labels = {
    resort: 'Resort',
    museum: 'Museum',
    tourism_office: 'Tourism Office',
  }
  return labels[value] || titleize(value)
}

export function formatDate(value) {
  if (!value) return '-'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}
