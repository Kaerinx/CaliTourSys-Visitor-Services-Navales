<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Email Verification</h1>
      <p :class="error ? 'form-error' : 'form-success'">{{ message }}</p>
      <RouterLink class="btn primary full" to="/accreditation/login">Go to Sign In</RouterLink>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { verifyEmail } from "@/modules/accreditation/services/accreditationApi";

const route = useRoute();
const message = ref("Verifying your email...");
const error = ref(false);

onMounted(async () => {
  try {
    const result = await verifyEmail(route.query.token);
    message.value = result.message;
  } catch (err) {
    error.value = true;
    message.value = err.response?.data?.message || "Unable to verify email.";
  }
});
</script>
