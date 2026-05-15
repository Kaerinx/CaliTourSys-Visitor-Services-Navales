<template>
  <ManagementLayout :nav="tourismNav">
    <h1>Inquiries</h1>
    <p class="muted">View inquiries, respond, update status, and maintain records.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="panel table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Contact</th><th>Subject</th><th>Status</th><th>Response</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="inquiry in inquiries" :key="inquiry.id">
            <td>{{ inquiry.full_name }}</td>
            <td>{{ inquiry.email }}<br />{{ inquiry.contact_number }}</td>
            <td>{{ inquiry.subject }}<br /><span class="muted">{{ inquiry.message }}</span></td>
            <td>
              <select v-model="inquiry.status">
                <option value="pending">pending</option>
                <option value="responded">responded</option>
                <option value="archived">archived</option>
              </select>
            </td>
            <td><textarea v-model="responses[inquiry.id]" /></td>
            <td>
              <div class="actions">
                <button class="btn" type="button" @click="respond(inquiry)">Respond</button>
                <button class="btn ghost" type="button" @click="saveStatus(inquiry)">Save Status</button>
              </div>
            </td>
          </tr>
          <tr v-if="!inquiries.length"><td colspan="6">No inquiries found.</td></tr>
        </tbody>
      </table>
    </section>
  </ManagementLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ManagementLayout from '../components/ManagementLayout.vue'
import { tourismNav } from './nav'
import { visitorApi } from '../services/visitorApi'

const inquiries = ref([])
const responses = reactive({})
const error = ref('')

async function load() {
  inquiries.value = await visitorApi.inquiries()
}

async function respond(inquiry) {
  if (!responses[inquiry.id]) return
  await visitorApi.respondInquiry(inquiry.id, { response_message: responses[inquiry.id] })
  responses[inquiry.id] = ''
  await load()
}

async function saveStatus(inquiry) {
  await visitorApi.updateInquiryStatus(inquiry.id, inquiry.status)
  await load()
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = err.message
  }
})
</script>
