<template>
  <span class="badge" :class="statusClass">{{ label }}</span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: { type: String, required: true },
});

const labels = {
  info: "Info",
  action_needed: "Action Needed",
  urgent: "Urgent",
};

const label = computed(() => {
  if (labels[props.status]) return labels[props.status];
  return props.status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
});

const statusClass = computed(() => ({
  approved: ["approved", "active", "verified"].includes(props.status),
  rejected: ["rejected", "high", "inactive", "urgent"].includes(props.status),
  pending: ["pending", "submitted", "medium", "pending_verification", "action_needed"].includes(props.status),
  review: ["under_review", "low", "info"].includes(props.status),
  revision: props.status === "for_revision",
}));
</script>
