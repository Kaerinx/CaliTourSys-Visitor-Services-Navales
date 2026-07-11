export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export function validateInquiryForm(form) {
  if (!form.fullName.trim()) return 'Full name is required.'
  if (!isValidEmail(form.email)) return 'Please enter a valid email address.'
  if (!form.subject.trim()) return 'Subject is required.'
  if (!form.message.trim()) return 'Message is required.'
  return ''
}

export function validateNewsletterEmail(email) {
  if (!isValidEmail(email)) return 'Please enter a valid email address.'
  return ''
}
