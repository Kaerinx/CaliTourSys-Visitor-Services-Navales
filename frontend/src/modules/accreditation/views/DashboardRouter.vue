<template>
  <AdminDashboard v-if="auth.role === 'admin'" />
  <BusinessOwnerDashboard v-else-if="auth.role === 'business_owner'" />
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import AdminDashboard from "./AdminDashboard.vue";
import BusinessOwnerDashboard from "./BusinessOwnerDashboard.vue";

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (auth.role === "tourism_staff") {
    router.replace("/cms/businesses");
  }
});
</script>
