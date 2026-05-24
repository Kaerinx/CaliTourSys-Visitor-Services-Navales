<script setup>
import { computed, reactive, ref } from 'vue'
import {
  subscribeToNewsletter,
  submitTourismInquiry,
} from '../services/promotionService'
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
  () =>
    form.fullName.trim() &&
    form.email.trim() &&
    form.subject.trim() &&
    form.message.trim(),
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
    <header class="site-nav">
      <div class="site-nav__inner">
        <RouterLink to="/promotion" class="brand" aria-label="TWBIS Home">
          <span class="brand__mark">T</span>
          <span class="brand__copy">
            <span class="brand__name">TWBIS</span>
            <span class="brand__tagline">Calabanga Tourism</span>
          </span>
        </RouterLink>

        <nav class="site-nav__links" aria-label="Primary navigation">
          <RouterLink to="/promotion" class="site-nav__link">Home</RouterLink>
          <RouterLink to="/promotion/map" class="site-nav__link">Destination</RouterLink>
          <RouterLink to="/promotion/products" class="site-nav__link">Products</RouterLink>
          <RouterLink to="/promotion/events" class="site-nav__link">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
          <RouterLink to="/promotion/inquiry" class="site-nav__link site-nav__link--active">
            Inquiries
          </RouterLink>
        </nav>

        <div class="site-nav__actions">
          <button class="icon-button" type="button" aria-label="Search planned for later" disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </button>
          <button class="login-button" type="button" disabled title="Public login is planned for a later phase">
            Public Site
          </button>
          <button class="icon-button icon-button--menu" type="button" aria-label="Menu" disabled title="Mobile menu is planned for a later phase">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

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
            <RouterLink to="/promotion/map">Browse destinations</RouterLink>
          </aside>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="site-footer__main page-shell">
        <div>
          <div class="footer-brand">
            <span class="footer-brand__mark">T</span>
            <span>
              <strong>TWBIS</strong>
              <small>Calabanga Tourism</small>
            </span>
          </div>
          <p>
            The official tourism platform of the Local Government of Calabanga, Camarines Sur -
            celebrating our coast, culture, and craft.
          </p>
          <div class="social-row">
            <a aria-label="Facebook page pending" aria-disabled="true">f</a>
            <a aria-label="Instagram page pending" aria-disabled="true">o</a>
            <a aria-label="Youtube page pending" aria-disabled="true">></a>
          </div>
        </div>

        <div>
          <h4>Explore</h4>
          <RouterLink to="/promotion/map">Map &amp; Discovery</RouterLink>
          <RouterLink to="/promotion/products">Products</RouterLink>
          <RouterLink to="/promotion/events">Events</RouterLink>
          <RouterLink to="/promotion/museum">Virtual Museum</RouterLink>
        </div>

        <div>
          <h4>Visit</h4>
          <p>LGU Calabanga, Camarines Sur 4405</p>
          <p>+63 54 871 1234</p>
          <p>tourism@calabanga.gov.ph</p>
        </div>

        <div>
          <h4>Stay updated</h4>
          <p>Festival dates, new producers, and seasonal guides - once a month.</p>
          <form class="subscribe-form" @submit.prevent="submitNewsletter">
            <input v-model="newsletterEmail" aria-label="Email address" placeholder="you@email.com" />
            <button type="submit" :disabled="isSubscribing">
              {{ isSubscribing ? 'Joining...' : 'Join' }}
            </button>
          </form>
          <p v-if="newsletterMessage" class="footer-message">{{ newsletterMessage }}</p>
        </div>
      </div>

      <div class="site-footer__bottom">
        <div class="page-shell">
          <span>&copy; 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
          <span>
            <a aria-disabled="true">Privacy</a>
            <a aria-disabled="true">Accessibility</a>
            <RouterLink to="/promotion/inquiry">Contact</RouterLink>
          </span>
        </div>
      </div>
    </footer>
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

.site-nav {
  position: fixed;
  z-index: 50;
  top: 0;
  right: 0;
  left: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.site-nav__inner {
  width: min(100% - 48px, 1200px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.brand,
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand__mark,
.footer-brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #1b4332;
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-weight: 700;
}

.brand__copy,
.footer-brand span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.brand__name,
.footer-brand strong {
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.brand__tagline,
.footer-brand small {
  color: #5c5c5c;
  font-size: 11px;
}

.site-nav__links {
  display: flex;
  align-self: stretch;
  align-items: stretch;
  justify-content: center;
  gap: 14px;
}

.site-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 6px;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 500;
}

.site-nav__link--active,
.site-nav__link:hover {
  color: #1b4332;
}

.site-nav__link--active::after {
  position: absolute;
  right: 6px;
  bottom: 19px;
  left: 6px;
  height: 2px;
  border-radius: 999px;
  background: #1b4332;
  content: '';
}

.site-nav__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button,
.login-button {
  border: 0;
  background: transparent;
  color: #1a1a1a;
  cursor: pointer;
}

.icon-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 999px;
}

.icon-button:hover {
  background: #f2f0eb;
}

.icon-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.icon-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.icon-button--menu {
  display: none;
}

.login-button {
  height: 38px;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 500;
}

.login-button:disabled {
  cursor: default;
  opacity: 0.72;
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
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
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

.site-footer {
  background: #1b4332;
  color: #ffffff;
}

.site-footer__main {
  display: grid;
  grid-template-columns: 1.35fr 1fr 1.25fr 1.25fr;
  gap: 56px;
  padding: 64px 0;
}

.site-footer p,
.site-footer a,
.site-footer small {
  color: rgba(255, 255, 255, 0.72);
}

.site-footer p {
  max-width: 290px;
  margin: 14px 0 0;
  font-size: 14px;
}

.footer-brand__mark {
  background: #ffffff;
  color: #1b4332;
}

.footer-brand strong {
  color: #ffffff;
}

.social-row {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.social-row a {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  color: #ffffff;
  font-size: 14px;
}

.site-footer h4 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.site-footer__main > div:not(:first-child) a {
  display: block;
  margin-top: 11px;
  font-size: 14px;
}

.subscribe-form {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.subscribe-form input {
  min-width: 0;
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 14px;
}

.subscribe-form button {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-size: 13px;
  font-weight: 500;
}

.footer-message {
  margin-top: 10px !important;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px !important;
}

.site-footer__bottom {
  background: #14532d;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.site-footer__bottom .page-shell {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.site-footer__bottom a {
  margin-left: 24px;
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
