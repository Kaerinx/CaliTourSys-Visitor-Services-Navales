<script setup>
import { computed, reactive, ref } from 'vue'
import TouristAccountLayout from '../components/TouristAccountLayout.vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'

const auth = useTouristAuthStore()
const submitted = ref(false)
const successMessage = ref('')
const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const currentPasswordError = computed(() =>
  submitted.value && !form.currentPassword ? 'Current password is required.' : '',
)
const newPasswordError = computed(() => {
  if (!submitted.value) return ''
  if (!form.newPassword) return 'New password is required.'
  if (form.newPassword.length < 12) return 'Use at least 12 characters.'
  if (!/[A-Z]/.test(form.newPassword)) return 'Include an uppercase letter.'
  if (!/[a-z]/.test(form.newPassword)) return 'Include a lowercase letter.'
  if (!/[0-9]/.test(form.newPassword)) return 'Include a number.'
  if (!/[^A-Za-z0-9]/.test(form.newPassword)) return 'Include a symbol.'
  return ''
})
const confirmPasswordError = computed(() => {
  if (!submitted.value) return ''
  if (!form.confirmPassword) return 'Confirm your new password.'
  if (form.confirmPassword !== form.newPassword) return 'Passwords do not match.'
  return ''
})

async function changePassword() {
  submitted.value = true
  successMessage.value = ''
  if (currentPasswordError.value || newPasswordError.value || confirmPasswordError.value) return

  try {
    await auth.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    submitted.value = false
    successMessage.value = 'Your password has been changed.'
  } catch {
    // The store exposes a user-friendly API error below the form.
  }
}
</script>

<template>
  <TouristAccountLayout
    title="Account settings"
    description="Protect your bookings, reviews, and saved itinerary with a strong password."
  >
    <form class="account-form" novalidate @submit.prevent="changePassword">
      <header>
        <h2>Change password</h2>
        <p>Use at least 12 characters with uppercase, lowercase, number, and symbol.</p>
      </header>

      <label>
        <span>Current password</span>
        <input
          v-model="form.currentPassword"
          type="password"
          autocomplete="current-password"
          :aria-invalid="Boolean(currentPasswordError)"
        />
        <small v-if="currentPasswordError">{{ currentPasswordError }}</small>
      </label>

      <label>
        <span>New password</span>
        <input
          v-model="form.newPassword"
          type="password"
          autocomplete="new-password"
          :aria-invalid="Boolean(newPasswordError)"
        />
        <small v-if="newPasswordError">{{ newPasswordError }}</small>
      </label>

      <label>
        <span>Confirm new password</span>
        <input
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          :aria-invalid="Boolean(confirmPasswordError)"
        />
        <small v-if="confirmPasswordError">{{ confirmPasswordError }}</small>
      </label>

      <p v-if="successMessage" class="form-message form-message--success" role="status">{{ successMessage }}</p>
      <p v-if="auth.passwordError" class="form-message form-message--error" role="alert">{{ auth.passwordError }}</p>

      <button type="submit" :disabled="auth.isPasswordLoading">
        {{ auth.isPasswordLoading ? 'Updating...' : 'Update password' }}
      </button>
    </form>
  </TouristAccountLayout>
</template>

<style scoped src="../tourist-account-form.css"></style>
