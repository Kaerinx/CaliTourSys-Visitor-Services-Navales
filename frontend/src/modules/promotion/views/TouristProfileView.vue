<script setup>
import { computed, reactive, ref, watch } from 'vue'
import TouristAccountLayout from '../components/TouristAccountLayout.vue'
import { useTouristAuthStore } from '../stores/touristAuthStore'

const auth = useTouristAuthStore()
const submitted = ref(false)
const successMessage = ref('')
const form = reactive({ fullName: '', phoneNumber: '' })

watch(
  () => auth.tourist,
  (tourist) => {
    form.fullName = tourist?.fullName || ''
    form.phoneNumber = tourist?.phoneNumber || ''
  },
  { immediate: true },
)

const nameError = computed(() => {
  if (!submitted.value) return ''
  if (!form.fullName.trim()) return 'Full name is required.'
  if (form.fullName.trim().length > 255) return 'Full name must be 255 characters or fewer.'
  return ''
})

const phoneError = computed(() => {
  if (!submitted.value || !form.phoneNumber.trim()) return ''
  if (form.phoneNumber.trim().length > 80) return 'Phone number must be 80 characters or fewer.'
  return ''
})

async function saveProfile() {
  submitted.value = true
  successMessage.value = ''
  if (nameError.value || phoneError.value) return

  try {
    await auth.updateProfile({
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
    })
    submitted.value = false
    successMessage.value = 'Your profile has been updated.'
  } catch {
    // The store exposes a user-friendly API error below the form.
  }
}
</script>

<template>
  <TouristAccountLayout
    title="My profile"
    description="Keep the contact details used for your public tourism account up to date."
  >
    <form class="account-form" novalidate @submit.prevent="saveProfile">
      <header>
        <h2>Personal information</h2>
        <p>Your email identifies this account and cannot be changed here.</p>
      </header>

      <label>
        <span>Full name</span>
        <input
          v-model="form.fullName"
          type="text"
          autocomplete="name"
          :aria-invalid="Boolean(nameError)"
        />
        <small v-if="nameError">{{ nameError }}</small>
      </label>

      <label>
        <span>Email address</span>
        <input :value="auth.tourist?.email" type="email" autocomplete="email" readonly />
        <small class="field-help">Contact support if this address is no longer accessible.</small>
      </label>

      <label>
        <span>Phone number <small>(optional)</small></span>
        <input
          v-model="form.phoneNumber"
          type="tel"
          autocomplete="tel"
          placeholder="09XX XXX XXXX"
          :aria-invalid="Boolean(phoneError)"
        />
        <small v-if="phoneError">{{ phoneError }}</small>
      </label>

      <p v-if="successMessage" class="form-message form-message--success" role="status">{{ successMessage }}</p>
      <p v-if="auth.profileError" class="form-message form-message--error" role="alert">{{ auth.profileError }}</p>

      <button type="submit" :disabled="auth.isProfileLoading">
        {{ auth.isProfileLoading ? 'Saving...' : 'Save changes' }}
      </button>
    </form>
  </TouristAccountLayout>
</template>

<style scoped src="../tourist-account-form.css"></style>
