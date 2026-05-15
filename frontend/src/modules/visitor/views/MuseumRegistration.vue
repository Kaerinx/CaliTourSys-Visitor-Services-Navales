<template>
  <ManagementLayout title="Museum Registration" subtitle="Record Calabanga Municipal Museum visitors.">
    <section class="panel">
      <form class="form-grid" @submit.prevent="saveRecord">
        <label>
          Full Name *
          <input v-model="form.full_name" required />
        </label>
        <label>
          Contact Number
          <input v-model="form.contact_number" />
        </label>
        <label>
          Email Address
          <input v-model="form.email" type="email" />
        </label>
        <label>
          Gender
          <select v-model="form.gender">
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label>
          Age Group
          <select v-model="form.age_group">
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
            <option value="child">Child</option>
          </select>
        </label>
        <label>
          Visitor Type
          <select v-model="form.visitor_type">
            <option value="local">Local</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </label>
        <label>
          Nationality
          <input v-model="form.nationality" />
        </label>
        <label>
          Province
          <input v-model="form.province" />
        </label>
        <label>
          Country
          <input v-model="form.country" />
        </label>
        <label class="full-span">
          Address
          <input v-model="form.address" />
        </label>
        <label>
          Purpose of Visit
          <input v-model="form.purpose_of_visit" />
        </label>
        <label>
          Visit Date *
          <input v-model="form.visit_date" required type="date" />
        </label>
        <label>
          Check-in Time
          <input v-model="form.check_in_time" type="time" />
        </label>
        <label>
          Number of Guests
          <input v-model.number="form.number_of_guests" min="1" type="number" @input="syncCompanions" />
        </label>
        <label>
          Establishment
          <input value="Calabanga Municipal Museum" disabled />
        </label>

        <section v-if="companions.length" class="full-span companion-box">
          <h3>Companion Details</h3>
          <div v-for="(companion, index) in companions" :key="index" class="form-grid">
            <label>
              Companion Name
              <input v-model="companion.full_name" />
            </label>
            <label>
              Gender
              <select v-model="companion.gender">
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </select>
            </label>
            <label>
              Age Group
              <select v-model="companion.age_group">
                <option value="adult">Adult</option>
                <option value="senior">Senior</option>
                <option value="child">Child</option>
              </select>
            </label>
            <label>
              Nationality
              <input v-model="companion.nationality" />
            </label>
          </div>
        </section>

        <p v-if="message" class="full-span" :class="messageClass">{{ message }}</p>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Record' }}
        </button>
        <button class="secondary-button" type="button" @click="resetForm">Clear Form</button>
      </form>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import visitorApi from '../services/visitorApi'

const loading = ref(false)
const message = ref('')
const messageClass = ref('')
const companions = ref([])

const defaults = {
  full_name: '',
  contact_number: '',
  email: '',
  gender: 'Female',
  age_group: 'adult',
  visitor_type: 'local',
  nationality: 'Filipino',
  province: '',
  country: 'Philippines',
  address: '',
  purpose_of_visit: '',
  visit_date: new Date().toISOString().slice(0, 10),
  check_in_time: '',
  number_of_guests: 1,
}

const form = reactive({ ...defaults })

function syncCompanions() {
  const needed = Math.max(0, Number(form.number_of_guests || 1) - 1)
  while (companions.value.length < needed) {
    companions.value.push({
      full_name: '',
      gender: 'Female',
      age_group: 'adult',
      nationality: form.nationality || 'Filipino',
    })
  }
  companions.value.splice(needed)
}

function resetForm() {
  Object.assign(form, { ...defaults, visit_date: new Date().toISOString().slice(0, 10) })
  companions.value = []
  message.value = ''
}

async function saveRecord() {
  loading.value = true
  message.value = ''
  try {
    await visitorApi.createVisitor({
      ...form,
      source_type: 'museum',
      status: 'checked_in',
      establishment_id: null,
      companions: companions.value.filter((item) => item.full_name),
    })
    messageClass.value = 'success-text'
    message.value = 'Museum visitor record saved.'
    resetForm()
  } catch (error) {
    messageClass.value = 'error-text'
    message.value = error.message || 'Unable to save museum visitor.'
  } finally {
    loading.value = false
  }
}
</script>
