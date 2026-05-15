<template>
  <main class="public-section">
    <div class="section-title">
      <span class="brand-logo" style="margin: 0 auto 1.5rem">⌖</span>
      <h1>Calabanga Tourism Office</h1>
      <p>We're here to help you plan your visit to Calabanga</p>
    </div>

    <form class="public-form-card" @submit.prevent="submitInquiry">
      <h2>Submit an Inquiry</h2>
      <p>Have questions about our tourism destinations, resorts, or services? Send us a message and we'll get back to you.</p>

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
          <textarea v-model="form.message" required rows="4" placeholder="Please provide details about your inquiry..." />
        </label>
      </div>

      <p v-if="message" :class="messageType">{{ message }}</p>
      <button class="public-button" type="submit" :disabled="loading">
        {{ loading ? 'Submitting...' : 'Submit Inquiry' }}
      </button>
    </form>
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
.success-message {
  color: #047857;
  font-weight: 700;
}

.error-message {
  color: #b91c1c;
  font-weight: 700;
}
</style>
