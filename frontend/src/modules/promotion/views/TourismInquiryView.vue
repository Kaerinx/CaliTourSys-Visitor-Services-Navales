<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import PromotionNavbar from "../components/PromotionNavbar.vue";
import PromotionFooter from "../components/PromotionFooter.vue";
import {
  subscribeToNewsletter,
  submitTourismInquiry,
} from "../services/promotionService";
import {
  validateInquiryForm,
  validateNewsletterEmail,
} from "../utils/formValidation";

const faqs = [
  {
    question: "What are the office hours of the Calabanga Tourism Office?",
    answer:
      "The Calabanga Tourism Office follows regular government office hours, Monday to Friday, from 8:00 AM to 5:00 PM.",
  },
  {
    question: "How can I contact the Tourism Office?",
    answer:
      "You may contact the Tourism Office through email at municipalitycalabanga@gmail.com or visit the office during regular office hours.",
  },
  {
    question: "Where is the Tourism Office located?",
    answer:
      "The Tourism Office is located at the LGU Calabanga Municipal Hall, San Pablo, Calabanga, Camarines Sur, Philippines 4405.",
  },
  {
    question: "Can I visit the Tourism Office personally for assistance?",
    answer:
      "Yes. Visitors may personally visit the Tourism Office during office hours for tourism-related inquiries, visitor assistance, and other concerns.",
  },
  {
    question: "What should I do if I lost an item during my visit?",
    answer:
      "You may report lost items to the Tourism Office or to the concerned establishment where the item may have been lost. Please provide important details such as the item description, location, date, and your contact information.",
  },
  {
    question: "What should I do in case of an emergency while visiting?",
    answer:
      "In case of emergency, contact the appropriate local emergency hotline immediately. You may also seek assistance from the nearest tourism establishment, barangay office, or local authority.",
  },
];

const emergencyHotlines = [
  {
    service: "Police Station",
    office: "Calabanga MPS",
    number: "0998-598-5984",
  },
  { service: "Fire Station", office: "BFP Calabanga", number: "0930-231-8101" },
  {
    service: "Ambulance",
    office: "Emergency Medical Services",
    number: "0919-548-9199",
  },
  {
    service: "MDRRMO",
    office: "Disaster Risk Management",
    number: "0998-549-5020",
  },
];

const form = reactive({
  fullName: "",
  email: "",
  contactNumber: "",
  subject: "",
  message: "",
});

const openFaq = ref(0);
const isInquiryOpen = ref(false);
const submitted = ref(false);
const touched = ref(false);
const isSubmitting = ref(false);
const formMessage = ref("");
const newsletterEmail = ref("");
const newsletterMessage = ref("");
const isSubscribing = ref(false);

const isValid = computed(
  () =>
    form.fullName.trim() &&
    form.email.trim() &&
    form.subject.trim() &&
    form.message.trim(),
);

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index;
}

function openInquiry() {
  isInquiryOpen.value = true;
}

function closeInquiry() {
  if (isSubmitting.value) return;
  isInquiryOpen.value = false;
}

function handleKeydown(event) {
  if (event.key === "Escape" && isInquiryOpen.value) closeInquiry();
}

watch(isInquiryOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

window.addEventListener("keydown", handleKeydown);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});

async function submitInquiry() {
  touched.value = true;
  formMessage.value = validateInquiryForm(form);
  submitted.value = false;
  if (formMessage.value) return;

  isSubmitting.value = true;

  try {
    await submitTourismInquiry({
      ...form,
      sourcePage: "/promotion/inquiry",
    });
    submitted.value = true;
    formMessage.value = "";
  } catch (error) {
    formMessage.value =
      error.message || "Unable to submit inquiry. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}

function resetForm() {
  form.fullName = "";
  form.email = "";
  form.contactNumber = "";
  form.subject = "";
  form.message = "";
  touched.value = false;
  submitted.value = false;
  formMessage.value = "";
}

async function submitNewsletter() {
  newsletterMessage.value = validateNewsletterEmail(newsletterEmail.value);
  if (newsletterMessage.value) return;

  isSubscribing.value = true;

  try {
    await subscribeToNewsletter({ email: newsletterEmail.value });
    newsletterMessage.value = "Subscription confirmed. Thank you for joining.";
    newsletterEmail.value = "";
  } catch (error) {
    newsletterMessage.value =
      error.message || "Unable to subscribe. Please try again.";
  } finally {
    isSubscribing.value = false;
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
            Find quick answers to common visitor concerns or send an inquiry to
            the Calabanga Tourism Office.
          </p>
        </div>
      </section>

      <section class="inquiry-content">
        <div class="page-shell inquiry-layout">
          <section class="faq-section" aria-labelledby="faq-title">
            <div class="section-heading">
              <p class="eyebrow">Visitor Support</p>
              <h2 id="faq-title">Frequently Asked Questions</h2>
              <p>Find quick answers before sending an inquiry.</p>
            </div>

            <div class="faq-list">
              <article
                v-for="(faq, index) in faqs"
                :key="faq.question"
                class="faq-item"
                :class="{ 'faq-item--open': openFaq === index }"
              >
                <h3>
                  <button
                    type="button"
                    :aria-expanded="openFaq === index"
                    :aria-controls="`faq-answer-${index}`"
                    @click="toggleFaq(index)"
                  >
                    <span>{{ faq.question }}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </h3>
                <div
                  v-show="openFaq === index"
                  :id="`faq-answer-${index}`"
                  class="faq-answer"
                >
                  <p>{{ faq.answer }}</p>
                </div>
              </article>
            </div>
          </section>

          <aside class="inquiry-card" aria-labelledby="office-title">
            <h2 id="office-title">Tourism Office</h2>

            <div class="office-detail">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div>
                <h3>Address</h3>
                <p>LGU Calabanga Municipal Hall</p>
                <p>San Pablo, Calabanga, Camarines Sur, Philippines 4405</p>
              </div>
            </div>

            <div class="office-detail">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <div>
                <h3>Operating Hours</h3>
                <p>Monday to Friday</p>
                <p>8:00 AM – 5:00 PM</p>
              </div>
            </div>

            <div class="office-detail">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <div>
                <h3>Email</h3>
                <a href="mailto:municipalitycalabanga@gmail.com">
                  municipalitycalabanga@gmail.com
                </a>
              </div>
            </div>

            <div class="hotlines">
              <h3>Emergency Hotlines</h3>
              <ul>
                <li v-for="hotline in emergencyHotlines" :key="hotline.service">
                  <div>
                    <strong>{{ hotline.service }}</strong>
                    <span>{{ hotline.office }}</span>
                  </div>
                  <a :href="`tel:${hotline.number.replace(/-/g, '')}`">{{
                    hotline.number
                  }}</a>
                </li>
              </ul>
            </div>

            <div class="card-actions">
              <RouterLink to="/destinations" class="secondary-button">
                Browse Destinations
              </RouterLink>
              <button class="primary-button" type="button" @click="openInquiry">
                Send an Inquiry
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <PromotionFooter />

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isInquiryOpen"
          class="inquiry-modal"
          @click.self="closeInquiry"
        >
          <section
            class="inquiry-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-modal-title"
            aria-describedby="inquiry-modal-description"
          >
            <button
              class="inquiry-modal__close"
              type="button"
              aria-label="Close inquiry form"
              :disabled="isSubmitting"
              @click="closeInquiry"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>

            <form
              class="inquiry-form"
              novalidate
              @submit.prevent="submitInquiry"
            >
              <div class="form-heading">
                <h2 id="inquiry-modal-title">Submit an Inquiry</h2>
                <p id="inquiry-modal-description">
                  Send your concern to the Calabanga Tourism Office.
                </p>
              </div>

              <label for="inquiry-full-name">
                <span>Full Name *</span>
                <input
                  id="inquiry-full-name"
                  v-model="form.fullName"
                  autocomplete="name"
                  placeholder="Enter your full name"
                  required
                />
              </label>

              <label for="inquiry-email">
                <span>Email Address *</span>
                <input
                  id="inquiry-email"
                  v-model="form.email"
                  autocomplete="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                />
              </label>

              <label for="inquiry-contact-number">
                <span>Contact Number</span>
                <input
                  id="inquiry-contact-number"
                  v-model="form.contactNumber"
                  autocomplete="tel"
                  type="tel"
                  placeholder="+63 or your country code"
                />
              </label>

              <label for="inquiry-subject">
                <span>Subject *</span>
                <input
                  id="inquiry-subject"
                  v-model="form.subject"
                  placeholder="What is your inquiry about?"
                  required
                />
              </label>

              <label for="inquiry-message">
                <span>Message *</span>
                <textarea
                  id="inquiry-message"
                  v-model="form.message"
                  rows="5"
                  placeholder="Please provide details about your inquiry..."
                  required
                ></textarea>
              </label>

              <p
                v-if="touched && !isValid"
                class="form-message form-message--error"
                role="alert"
              >
                {{ formMessage || "Please complete all required fields." }}
              </p>

              <p
                v-else-if="formMessage"
                class="form-message form-message--error"
                role="alert"
              >
                {{ formMessage }}
              </p>

              <p
                v-if="submitted"
                class="form-message form-message--success"
                role="status"
              >
                Inquiry received. Thank you for contacting the Tourism Office.
              </p>

              <div class="form-actions">
                <button
                  class="primary-button"
                  type="submit"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? "Submitting..." : "Submit Inquiry" }}
                </button>
                <button
                  v-if="submitted"
                  class="secondary-button"
                  type="button"
                  @click="resetForm"
                >
                  Send another
                </button>
                <button
                  v-else
                  class="secondary-button"
                  type="button"
                  :disabled="isSubmitting"
                  @click="closeInquiry"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

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
.inquiry-page *::after,
.inquiry-modal,
.inquiry-modal *,
.inquiry-modal *::before,
.inquiry-modal *::after {
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
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
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
  max-width: 760px;
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 16px;
}

.inquiry-content {
  padding: 48px 0 96px;
}

.inquiry-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
  align-items: start;
  gap: 32px;
}

.faq-section,
.inquiry-card {
  min-width: 0;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
}

.faq-section {
  padding: 32px;
}

.section-heading h2,
.inquiry-card > h2,
.form-heading h2 {
  color: #1a1a1a;
  font-size: 26px;
  font-weight: 700;
}

.section-heading h2 {
  margin-top: 10px;
}

.section-heading > p:last-child,
.form-heading p {
  margin: 10px 0 0;
  color: #5c5c5c;
  font-size: 15px;
}

.faq-list {
  margin-top: 28px;
  border-top: 1px solid #e8e4dc;
}

.faq-item {
  border-bottom: 1px solid #e8e4dc;
}

.faq-item h3 {
  font-family: inherit;
}

.faq-item button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 4px;
  border: 0;
  background: transparent;
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
}

.faq-item button:hover {
  color: #1b4332;
}

.faq-item button:focus-visible,
.primary-button:focus-visible,
.secondary-button:focus-visible,
.inquiry-modal__close:focus-visible {
  outline: 3px solid rgba(27, 67, 50, 0.2);
  outline-offset: 3px;
}

.faq-item button svg {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 0.2s ease;
}

.faq-item--open button svg {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 40px 22px 4px;
}

.faq-answer p {
  margin: 0;
  color: #5c5c5c;
  font-size: 15px;
}

.inquiry-card {
  position: sticky;
  top: 88px;
  padding: 28px;
}

.office-detail {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.office-detail > svg {
  width: 21px;
  height: 21px;
  margin-top: 2px;
  fill: none;
  stroke: #1b4332;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.office-detail h3,
.hotlines > h3 {
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
}

.office-detail p,
.office-detail a {
  display: block;
  margin: 3px 0 0;
  overflow-wrap: anywhere;
  color: #5c5c5c;
  font-size: 13px;
  line-height: 1.5;
}

.office-detail a:hover,
.hotlines a:hover {
  color: #1b4332;
  text-decoration: underline;
}

.hotlines {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid #e8e4dc;
}

.hotlines ul {
  display: grid;
  gap: 14px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.hotlines li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  font-size: 12px;
  line-height: 1.45;
}

.hotlines strong,
.hotlines span {
  display: block;
}

.hotlines strong {
  color: #1a1a1a;
  font-weight: 600;
}

.hotlines span {
  color: #777777;
}

.hotlines a {
  flex: 0 0 auto;
  color: #1b4332;
  font-weight: 600;
}

.card-actions,
.form-actions {
  display: grid;
  gap: 10px;
  margin-top: 26px;
}

.primary-button,
.secondary-button {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
}

.primary-button {
  background: #1b4332;
  color: #ffffff;
}

.primary-button:hover {
  background: #14532d;
}

.secondary-button {
  background: #ffffff;
  color: #1b4332;
}

.secondary-button:hover {
  background: #d8f3dc;
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.inquiry-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 24px;
  background: rgba(26, 26, 26, 0.52);
  font-family: Inter, system-ui, sans-serif;
}

.inquiry-modal__dialog {
  position: relative;
  width: min(640px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #ffffff;
  color: #1a1a1a;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
}

.inquiry-modal__close {
  position: absolute;
  z-index: 1;
  top: 18px;
  right: 18px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #5c5c5c;
  cursor: pointer;
}

.inquiry-modal__close:hover {
  background: #f2f0eb;
  color: #1a1a1a;
}

.inquiry-modal__close svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.inquiry-form {
  display: grid;
  gap: 18px;
  padding: 36px;
}

.form-heading {
  padding-right: 42px;
  margin-bottom: 4px;
}

.inquiry-form label {
  display: grid;
  gap: 8px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
}

.inquiry-form input,
.inquiry-form textarea {
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

.inquiry-form input {
  height: 48px;
  padding: 0 16px;
}

.inquiry-form textarea {
  min-height: 124px;
  resize: vertical;
  padding: 14px 16px;
}

.inquiry-form input:focus,
.inquiry-form textarea:focus {
  border-color: #1b4332;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.12);
}

.inquiry-form input::placeholder,
.inquiry-form textarea::placeholder {
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 4px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-active .inquiry-modal__dialog,
.modal-leave-active .inquiry-modal__dialog {
  transition: transform 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .inquiry-modal__dialog,
.modal-leave-to .inquiry-modal__dialog {
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 1024px) {
  .inquiry-layout {
    grid-template-columns: 1fr;
  }

  .inquiry-card {
    position: static;
  }
}

@media (max-width: 760px) {
  .page-shell {
    width: min(100% - 32px, 1200px);
  }

  h1 {
    font-size: 38px;
  }

  .inquiry-header .page-shell {
    padding: 40px 0 36px;
  }

  .inquiry-content {
    padding: 32px 0 64px;
  }

  .inquiry-layout {
    gap: 24px;
  }

  .faq-section,
  .inquiry-card {
    padding: 24px;
  }

  .faq-item button {
    gap: 16px;
    padding: 20px 0;
    font-size: 15px;
  }

  .faq-answer {
    padding: 0 36px 20px 0;
  }

  .inquiry-modal {
    align-items: end;
    padding: 0;
  }

  .inquiry-modal__dialog {
    width: 100%;
    max-height: calc(100dvh - 24px);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 16px 16px 0 0;
  }

  .inquiry-form {
    padding: 28px 20px 24px;
  }

  .form-actions {
    grid-template-columns: 1fr;
  }
}
</style>
