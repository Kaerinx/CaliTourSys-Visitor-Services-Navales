<script setup>
import PromotionNavbar from '../components/PromotionNavbar.vue'
import PromotionFooter from '../components/PromotionFooter.vue'
import { computed, reactive, ref } from 'vue'
import { subscribeToNewsletter, submitTourismInquiry } from '../services/promotionService'
import { validateInquiryForm, validateNewsletterEmail } from '../utils/formValidation'

const form = reactive({
  fullName: '',
  email: '',
  contactNumber: '',
  subject: '',
  message: '',
})

const submitted = ref(false)
const touched = ref(false)
const isSubmitting = ref(false)
const formMessage = ref('')
const newsletterEmail = ref('')
const newsletterMessage = ref('')
const isSubscribing = ref(false)

const isValid = computed(
  () => form.fullName.trim() && form.email.trim() && form.subject.trim() && form.message.trim(),
)

async function submitInquiry() {
  touched.value = true
  formMessage.value = validateInquiryForm(form)
  submitted.value = false
  if (formMessage.value) return

  isSubmitting.value = true

  try {
    await submitTourismInquiry({
      ...form,
      sourcePage: '/promotion/inquiry',
    })
    submitted.value = true
    formMessage.value = ''
  } catch (error) {
    formMessage.value = error.message || 'Unable to submit inquiry. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  form.fullName = ''
  form.email = ''
  form.contactNumber = ''
  form.subject = ''
  form.message = ''
  touched.value = false
  submitted.value = false
  formMessage.value = ''
}

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
</script>

<template>
  <div class="inquiry-page">
    <PromotionNavbar />

    <main>
      <section class="inquiry-header">
        <div class="page-shell">
          <p class="eyebrow">Visitor support</p>
          <h1>Tourism Inquiry</h1>
          <p>
            Send questions about destinations, events, products, and visitor services in Calabanga.
          </p>
        </div>
      </section>

      <section class="inquiry-content">
        <div class="page-shell inquiry-layout">
          <form class="inquiry-form" @submit.prevent="submitInquiry">
            <div class="form-heading">
              <h2>Submit an Inquiry</h2>
              <p>
                Have questions about our tourism destinations, resorts, or services? Send us a
                message and we will get back to you.
              </p>
            </div>

            <label>
              <span>Full Name *</span>
              <input v-model="form.fullName" placeholder="Enter your full name" />
            </label>

            <label>
              <span>Email Address *</span>
              <input v-model="form.email" type="email" placeholder="your.email@example.com" />
            </label>

            <label>
              <span>Contact Number</span>
              <input v-model="form.contactNumber" placeholder="+63 or your country code" />
            </label>

            <label>
              <span>Subject *</span>
              <input v-model="form.subject" placeholder="What is your inquiry about?" />
            </label>

            <label>
              <span>Message *</span>
              <textarea
                v-model="form.message"
                rows="6"
                placeholder="Please provide details about your inquiry..."
              ></textarea>
            </label>

            <p v-if="touched && !isValid" class="form-message form-message--error">
              {{ formMessage || 'Please complete all required fields.' }}
            </p>

            <p v-else-if="formMessage" class="form-message form-message--error">
              {{ formMessage }}
            </p>

            <p v-if="submitted" class="form-message form-message--success">
              Inquiry received. Thank you for contacting the Tourism Office.
            </p>

            <div class="form-actions">
              <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Submitting...' : 'Submit Inquiry' }}
              </button>
              <button v-if="submitted" type="button" @click="resetForm">Send another</button>
            </div>
          </form>

          <aside class="inquiry-card">
            <h2>Tourism Office</h2>
            <p>LGU Calabanga, Camarines Sur 4405</p>
            <p>+63 54 871 1234</p>
            <p>tourism@calabanga.gov.ph</p>
            <RouterLink to="/destinations">Browse destinations</RouterLink>
          </aside>
        </div>
      </section>
    </main>

    <PromotionFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.inquiry-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

.inquiry-page,
.inquiry-page *,
.inquiry-page *::before,
.inquiry-page *::after {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea {
  font: inherit;
}

.page-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
}

.inquiry-header {
  padding-top: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.inquiry-header .page-shell {
  padding: 48px 0 42px;
}

.eyebrow {
  margin: 0;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.2;
}

h1 {
  margin-top: 14px;
  font-size: 44px;
  font-weight: 700;
}

.inquiry-header p:last-child {
  max-width: 650px;
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.inquiry-content {
  padding: 48px 0 96px;
}

.inquiry-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
  align-items: start;
  gap: 24px;
}

.inquiry-form,
.inquiry-card {
  min-width: 0;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
}

.inquiry-form {
  display: grid;
  gap: 18px;
  padding: 32px;
}

.form-heading {
  margin-bottom: 4px;
}

.form-heading h2,
.inquiry-card h2 {
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 600;
}

.form-heading p,
.inquiry-card p {
  margin: 12px 0 0;
  color: #5c5c5c;
  font-size: 15px;
}

label {
  display: grid;
  gap: 8px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  max-width: 100%;
  display: block;
  border: 1px solid transparent;
  border-radius: 8px;
  outline: 0;
  background: #f2f0eb;
  color: #1a1a1a;
  font-size: 15px;
}

input {
  height: 48px;
  padding: 0 16px;
}

textarea {
  min-height: 140px;
  resize: vertical;
  padding: 14px 16px;
}

input:focus,
textarea:focus {
  border-color: #1b4332;
  background: #ffffff;
}

input::placeholder,
textarea::placeholder {
  color: #777777;
}

.form-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.form-message--error {
  background: #ffe8de;
  color: #7a2d0e;
}

.form-message--success {
  background: #d8f3dc;
  color: #1b4332;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.form-actions button,
.inquiry-card a {
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 0 24px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  background: #1b4332;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
}

.form-actions button:last-child {
  background: transparent;
  color: #1b4332;
}

.form-actions button:disabled,
.subscribe-form button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.inquiry-card {
  padding: 28px;
}

.inquiry-card a {
  width: 100%;
  margin-top: 24px;
  padding-right: 16px;
  padding-left: 16px;
  white-space: normal;
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .icon-button--menu {
    display: grid;
  }

  .inquiry-layout,
  .site-footer__main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page-shell,
  .site-nav__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy,
  .login-button {
    display: none;
  }

  h1 {
    font-size: 38px;
  }

  .inquiry-form {
    padding: 24px;
  }

  .form-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .form-actions button {
    width: 100%;
  }

  .site-footer__main {
    gap: 32px;
  }

  .site-footer__bottom .page-shell {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 0;
  }

  .site-footer__bottom a {
    margin: 0 18px 0 0;
  }
}
</style>
