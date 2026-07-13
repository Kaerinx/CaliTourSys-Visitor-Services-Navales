<template>
  <section class="panel registration-card">
    <div class="form-heading">
      <div>
        <h2>Record Visitor Information</h2>
        <p>Encode visitor details for tourism monitoring and reporting.</p>
      </div>
      <span v-if="isReceptionist" class="assigned-chip">{{ assignedEstablishmentName }}</span>
    </div>
    <form class="form-grid" @submit.prevent="submit">
      <div class="field"><label>Group ID</label><input v-model="form.group_id" readonly /></div>
      <div class="field"><label>Full Name *</label><input v-model="form.full_name" required /></div>
      <div class="field"><label>Contact Number</label><input v-model="form.contact_number" /></div>
      <div class="field"><label>Email</label><input v-model="form.email" type="email" /></div>
      <div class="field"><label>Gender</label><select v-model="form.gender"><option value="M">M</option><option value="F">F</option></select></div>
      <div class="field"><label>Age Group</label><select v-model="form.age_group"><option value="adult">Adult</option><option value="senior">Senior</option><option value="child">Child</option></select></div>
      <div class="field"><label>Nationality</label><input v-model="form.nationality" /></div>
      <div class="field"><label>Province</label><input v-model="form.province" /></div>
      <div class="field"><label>Country</label><input v-model="form.country" /></div>
      <div class="field span-2"><label>Address</label><input v-model="form.address" /></div>
      <div class="field"><label>Purpose of Visit</label><input v-model="form.purpose_of_visit" /></div>
      <div class="field"><label>Visit Date *</label><input v-model="form.visit_date" type="date" required /></div>
      <div class="field"><label>Recording Time</label><input v-model="form.check_in_time" type="time" /></div>
      <div class="field"><label>Number of Visitors</label><input v-model.number="guestCount" type="number" min="1" /></div>
      <div v-if="isReceptionist" class="field">
        <label>Assigned Resort/Establishment</label>
        <input :value="assignedEstablishmentName" readonly />
      </div>
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
          <div class="field"><label>Gender</label><select v-model="companions[index].gender"><option value="M">M</option><option value="F">F</option></select></div>
          <div class="field"><label>Nationality</label><input v-model="companions[index].nationality" /></div>
        </div>
      </div>

      <p v-if="error" class="error span-3">{{ error }}</p>
      <div class="form-actions span-3">
        <button class="btn ghost" type="button" :disabled="loading" @click="clearForm">Clear Form</button>
        <button class="btn" type="submit" :disabled="loading">{{ loading ? 'Saving...' : 'Save Visitor Record' }}</button>
      </div>
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
const assignedEstablishmentName = computed(() => auth.user?.assigned_establishment_name || 'Assigned Establishment')
const form = reactive(defaultForm())

function defaultForm() {
  return {
    group_id: `GRP-${Date.now()}`,
    full_name: '',
    contact_number: '',
    email: '',
    gender: 'M',
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
    companions.value.push({ full_name: '', age_group: 'adult', gender: 'M', nationality: 'Filipino' })
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
    clearForm()
    emit('saved')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function clearForm() {
  Object.assign(form, defaultForm())
  guestCount.value = 1
  companions.value = []
}

onMounted(async () => {
  establishments.value = await visitorApi.establishments().catch(() => [])
})
</script>

<style scoped>
.registration-card {
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
}

.form-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.2rem;
}

.form-heading h2 {
  margin: 0;
  font-size: 1.35rem;
}

.form-heading p {
  margin: 0.25rem 0 0;
  color: #475569;
}

.assigned-chip {
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  padding: 0.4rem 0.8rem;
  font-weight: 800;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.form-actions .btn {
  width: auto;
  min-width: 170px;
}

@media (max-width: 760px) {
  .form-heading,
  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
