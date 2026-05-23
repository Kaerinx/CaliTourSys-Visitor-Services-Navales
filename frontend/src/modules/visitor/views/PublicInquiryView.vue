<template>
  <main>
    <section class="page-hero">
      <span class="hero-kicker">Visitor Assistance</span>
      <h1>Contact the Calabanga Tourism Office</h1>
      <p>Send questions about destinations, resorts, events, museum visits, or local travel support.</p>
    </section>

    <section class="public-section inquiry-layout">
      <form class="public-form-card" @submit.prevent="submitInquiry">
        <h2>Submit an Inquiry</h2>
        <p>
          Provide your contact details and message. Our tourism staff will review your inquiry and
          respond through the available contact information.
        </p>

        <div class="public-form-grid">
          <label>
            Full Name *
            <input v-model="form.full_name" required placeholder="Enter your full name" />
          </label>
          <label>
            Email Address *
            <input v-model="form.email" type="email" required placeholder="your.email@example.com" />
          </label>
          <label>
            Contact Number *
            <input v-model="form.contact_number" required placeholder="+63 or your country code" />
          </label>
          <label>
            Subject *
            <input v-model="form.subject" required placeholder="What is your inquiry about?" />
          </label>
          <label>
            Message *
            <textarea
              v-model="form.message"
              required
              rows="5"
              placeholder="Please provide details about your inquiry..."
            />
          </label>
        </div>

        <p v-if="message" :class="messageType">{{ message }}</p>
        <button class="public-button submit-button" type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Submit Inquiry' }}
        </button>
      </form>

      <aside class="contact-panel">
        <article class="public-card public-card-body">
          <h2>Tourism Office</h2>
          <p>Municipal Hall Compound, Calabanga, Camarines Sur</p>
          <p><strong>Email:</strong> tourism@calabanga.gov.ph</p>
          <p><strong>Phone:</strong> (054) 123-4567</p>
          <p><strong>Office Hours:</strong> Monday to Friday, 8:00 AM - 5:00 PM</p>
        </article>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import visitorApi from '../services/visitorApi'

const loading = ref(false)
const message = ref('')
const messageType = ref('')
const form = reactive({
  full_name: '',
  email: '',
  contact_number: '',
  subject: '',
  message: '',
})

async function submitInquiry() {
  loading.value = true
  message.value = ''
  try {
    await visitorApi.inquiries.create({ ...form })
    Object.assign(form, {
      full_name: '',
      email: '',
      contact_number: '',
      subject: '',
      message: '',
    })
    messageType.value = 'success-message'
    message.value = 'Inquiry submitted successfully.'
  } catch (error) {
    messageType.value = 'error-message'
    message.value = error.message || 'Unable to submit inquiry.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.inquiry-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 1.5rem;
  align-items: start;
}

.public-form-card {
  margin: 0;
}

.public-form-card h2 {
  margin-top: 0;
}

.submit-button {
  margin-top: 1.25rem;
}

.contact-panel {
  position: sticky;
  top: 100px;
}

.success-message {
  color: #047857;
  font-weight: 800;
}

.error-message {
  color: #b91c1c;
  font-weight: 800;
}

@media (max-width: 1000px) {
  .inquiry-layout {
    grid-template-columns: 1fr;
  }

  .contact-panel {
    position: static;
  }
}
</style>
