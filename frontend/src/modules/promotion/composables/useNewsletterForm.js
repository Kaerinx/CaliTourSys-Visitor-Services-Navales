import { ref } from 'vue'
import { subscribeToNewsletter } from '../services/promotionService'
import { validateNewsletterEmail } from '../utils/formValidation'

export function useNewsletterForm() {
  const newsletterEmail = ref('')
  const newsletterMessage = ref('')
  const isSubscribing = ref(false)

  async function submitNewsletter() {
    newsletterMessage.value = validateNewsletterEmail(newsletterEmail.value)
    if (newsletterMessage.value) return

    isSubscribing.value = true

    try {
      await subscribeToNewsletter({ email: newsletterEmail.value })
      newsletterMessage.value = 'Subscription confirmed. Thank you for joining.'
      newsletterEmail.value = ''
    } catch (error) {
      newsletterMessage.value = error.message || 'Unable to subscribe. Please try again.'
    } finally {
      isSubscribing.value = false
    }
  }

  return {
    newsletterEmail,
    newsletterMessage,
    isSubscribing,
    submitNewsletter,
  }
}
