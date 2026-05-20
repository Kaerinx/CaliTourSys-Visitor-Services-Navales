<template>
  <AdminDashboard v-if="auth.role === 'admin'" />
  <TourismStaffDashboard v-else-if="auth.role === 'tourism_staff' || auth.role === 'tourism_officer'" />
  <BusinessOwnerDashboard v-else />
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore";
import AdminDashboard from "./AdminDashboard.vue";
import BusinessOwnerDashboard from "./BusinessOwnerDashboard.vue";
import TourismStaffDashboard from "./TourismStaffDashboard.vue";

const auth = useAuthStore();
</script>
