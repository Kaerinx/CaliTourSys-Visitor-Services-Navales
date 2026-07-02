<script setup>
defineProps({
  // `floating` positions the badge in the top-right of a positioned card;
  // otherwise it renders inline (e.g. in a trust strip or detail header).
  floating: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'LGU Accredited',
  },
})
</script>

<template>
  <span
    class="accr-badge"
    :class="{ 'accr-badge--floating': floating }"
    role="img"
    :title="label"
    :aria-label="label"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z" />
    </svg>
  </span>
</template>

<style scoped>
.accr-badge {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #fff9e6;
  border: 1px solid #d4ac0d;
  flex: 0 0 auto;
}

.accr-badge svg {
  width: 16px;
  height: 16px;
  fill: #d4ac0d;
  stroke: #d4ac0d;
  stroke-width: 1;
  stroke-linejoin: round;
}

.accr-badge--floating {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}
</style>
