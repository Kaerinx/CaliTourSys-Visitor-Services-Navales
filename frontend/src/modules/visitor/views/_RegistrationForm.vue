<template>
  <section class="panel">
    <form class="form-grid" @submit.prevent="submit">
      <div class="field"><label>Group ID</label><input v-model="form.group_id" readonly /></div>
      <div class="field"><label>Full Name *</label><input v-model="form.full_name" required /></div>
      <div class="field"><label>Contact Number</label><input v-model="form.contact_number" /></div>
      <div class="field"><label>Email</label><input v-model="form.email" type="email" /></div>
      <div class="field"><label>Gender</label><select v-model="form.gender"><option>Female</option><option>Male</option><option>Prefer not to say</option></select></div>
      <div class="field"><label>Age Group</label><select v-model="form.age_group"><option value="adult">Adult</option><option value="senior">Senior</option><option value="child">Child</option></select></div>
      <div class="field"><label>Nationality</label><input v-model="form.nationality" /></div>
      <div class="field"><label>Province</label><input v-model="form.province" /></div>
      <div class="field"><label>Country</label><input v-model="form.country" /></div>
      <div class="field span-2"><label>Address</label><input v-model="form.address" /></div>
      <div class="field"><label>Purpose of Visit</label><input v-model="form.purpose_of_visit" /></div>
      <div class="field"><label>Visit Date *</label><input v-model="form.visit_date" type="date" required /></div>
      <div class="field"><label>Check-in Time</label><input v-model="form.check_in_time" type="time" /></div>
      <div class="field"><label>Number of Guests</label><input v-model.number="guestCount" type="number" min="1" /></div>
      <div v-if="!isReceptionist" class="field">
        <label>Establishment</label>
        <select v-model="form.establishment_id">
          <option value="">Tourism Office</option>
          <option v-for="item in establishments" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </div>

      <div v-if="companions.length" class="span-3">
        <h2>Companion Details</h2>
        <div v-for="(_, index) in companions" :key="index" class="form-grid" style="margin-bottom:18px">
          <div class="field"><label>Companion Name</label><input v-model="companions[index].full_name" /></div>
          <div class="field"><label>Age Group</label><select v-model="companions[index].age_group"><option value="adult">Adult</option><option value="senior">Senior</option><option value="child">Child</option></select></div>
          <div class="field"><label>Gender</label><select v-model="companions[index].gender"><option>Female</option><option>Male</option><option>Prefer not to say</option></select></div>
          <div class="field"><label>Nationality</label><input v-model="companions[index].nationality" /></div>
        </div>
      </div>

      <p v-if="error" class="error span-3">{{ error }}</p>
      <button class="btn span-3" type="submit" :disabled="loading">{{ loading ? 'Saving...' : 'Save Record' }}</button>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { visitorApi } from '../services/visitorApi'

const props = defineProps({
  sourceType: { type: String, default: 'tourism_office' },
})
const emit = defineEmits(['saved'])
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const establishments = ref([])
const guestCount = ref(1)
const companions = ref([])
const isReceptionist = computed(() => auth.user?.role === 'receptionist')
const form = reactive(defaultForm())

function defaultForm() {
  return {
    group_id: `GRP-${Date.now()}`,
    full_name: '',
    contact_number: '',
    email: '',
    gender: 'Female',
    age_group: 'adult',
    nationality: 'Filipino',
    province: '',
    country: 'Philippines',
    address: '',
    purpose_of_visit: '',
    visit_date: new Date().toISOString().slice(0, 10),
    check_in_time: '',
    status: 'pending',
    source_type: props.sourceType,
    establishment_id: '',
  }
}

watch(guestCount, (count) => {
  const needed = Math.max(0, Number(count || 1) - 1)
  while (companions.value.length < needed) {
    companions.value.push({ full_name: '', age_group: 'adult', gender: 'Female', nationality: 'Filipino' })
  }
  companions.value = companions.value.slice(0, needed)
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const payload = { ...form, companions: companions.value }
    if (isReceptionist.value) {
      payload.establishment_id = auth.user.assigned_establishment_id
      payload.source_type = 'resort'
    }
    await visitorApi.createVisitor(payload)
    Object.assign(form, defaultForm())
    guestCount.value = 1
    companions.value = []
    emit('saved')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  establishments.value = await visitorApi.establishments().catch(() => [])
})
</script>
