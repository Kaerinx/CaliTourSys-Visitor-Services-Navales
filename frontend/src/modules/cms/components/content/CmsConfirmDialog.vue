<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm action' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  tone: { type: String, default: 'primary' },
  busy: { type: Boolean, default: false },
})

defineEmits(['cancel', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cms-confirm" role="presentation" @click.self="$emit('cancel')">
      <section class="cms-confirm__dialog" role="dialog" aria-modal="true" aria-labelledby="cms-confirm-title">
        <p>{{ tone === 'danger' ? 'Archive confirmation' : 'Publish confirmation' }}</p>
        <h2 id="cms-confirm-title">{{ title }}</h2>
        <span>{{ message }}</span>
        <div>
          <button type="button" :disabled="busy" @click="$emit('cancel')">Cancel</button>
          <button class="cms-confirm__primary" :class="{ 'is-danger': tone === 'danger' }" type="button" :disabled="busy" @click="$emit('confirm')">
            {{ busy ? 'Working...' : confirmLabel }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.cms-confirm {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.46);
}

.cms-confirm__dialog {
  width: min(440px, 100%);
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}

p,
h2,
span {
  margin: 0;
}

p {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.35rem;
}

span {
  display: block;
  margin-top: 10px;
  color: #64748b;
  line-height: 1.55;
}

div {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

button {
  min-height: 40px;
  padding: 0 14px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 800;
}

.cms-confirm__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

.cms-confirm__primary.is-danger {
  border-color: #dc2626;
  background: #dc2626;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

button:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.16);
  outline-offset: 2px;
}
</style>
